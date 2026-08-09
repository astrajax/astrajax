#!/usr/bin/env python3
"""
scene_layer_cut.py -- deterministic verification + compositing toolkit for the
AstraJax flat-master -> interactable-layers pipeline.

The GENERATIVE steps (deriving masks, inpainting holes, painting state variants)
are done with the GenerateImage tool per SKILL.md. THIS script owns the
deterministic half: cutting exact master pixels through a mask, cleaning
painterly edges, recompositing, and proving registration with SSIM/PSNR.

Dependencies: numpy + Pillow only (no scipy/skimage/cv2). SSIM is computed with
a pure-numpy integral-image box filter.

Subcommands:
  mask-apply        Cut a layer from the master by applying a mask to the exact
                    master pixels (registration-preserving by construction).
  edge-clean        Feather alpha + decontaminate fringe (kill background halos).
  compose           Composite a background plate + positioned layers -> one PNG.
  verify            Recomposite and compare to the master (SSIM/PSNR + heatmap).
  registration-check  Prove a state variant differs from its base ONLY in the
                    intended region and stays registered elsewhere.
  inpaint-guard     Prove an inpainted plate changed pixels ONLY inside the holes.

Run `python3 scene_layer_cut.py <subcommand> --help` for arguments.
"""

import argparse
import json
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter


# ---------------------------------------------------------------------------
# IO helpers
# ---------------------------------------------------------------------------

def load_rgba(path):
    return np.asarray(Image.open(path).convert("RGBA"), dtype=np.float64)


def load_rgb(path):
    return np.asarray(Image.open(path).convert("RGB"), dtype=np.float64)


def load_gray(path):
    return np.asarray(Image.open(path).convert("L"), dtype=np.float64)


def save_rgba(arr, path):
    Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8), "RGBA").save(path)


def save_rgb(arr, path):
    Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8), "RGB").save(path)


def luminance(rgb):
    # Rec. 601 luma; rgb is HxWx3
    return rgb[..., 0] * 0.299 + rgb[..., 1] * 0.587 + rgb[..., 2] * 0.114


# ---------------------------------------------------------------------------
# SSIM / PSNR (pure numpy)
# ---------------------------------------------------------------------------

def _box_mean(a, r):
    """Local mean over a (2r+1)x(2r+1) window, edge-padded, via integral image."""
    ap = np.pad(a, r, mode="edge")
    integ = np.cumsum(np.cumsum(ap, axis=0), axis=1)
    integ = np.pad(integ, ((1, 0), (1, 0)), mode="constant")
    h, w = a.shape
    k = 2 * r + 1
    s = (integ[k:k + h, k:k + w] - integ[0:h, k:k + w]
         - integ[k:k + h, 0:w] + integ[0:h, 0:w])
    return s / float(k * k)


def ssim_map(x, y, r=3, L=255.0):
    """Per-pixel SSIM map for two grayscale arrays (float 0..255)."""
    c1 = (0.01 * L) ** 2
    c2 = (0.03 * L) ** 2
    mux, muy = _box_mean(x, r), _box_mean(y, r)
    muxx, muyy, muxy = _box_mean(x * x, r), _box_mean(y * y, r), _box_mean(x * y, r)
    vx = np.clip(muxx - mux * mux, 0, None)
    vy = np.clip(muyy - muy * muy, 0, None)
    vxy = muxy - mux * muy
    num = (2 * mux * muy + c1) * (2 * vxy + c2)
    den = (mux * mux + muy * muy + c1) * (vx + vy + c2)
    return num / den


def mssim(x, y, r=3):
    return float(ssim_map(x, y, r=r).mean())


def psnr(x, y):
    mse = float(np.mean((x - y) ** 2))
    if mse <= 1e-12:
        return float("inf")
    return float(10.0 * np.log10((255.0 ** 2) / mse))


def _check_same_size(a, b, what):
    if a.shape[:2] != b.shape[:2]:
        raise SystemExit(f"ERROR: {what} size mismatch {a.shape[:2]} vs {b.shape[:2]}")


# ---------------------------------------------------------------------------
# Diff heatmap
# ---------------------------------------------------------------------------

def diff_heatmap(base_rgb, other_rgb, out_path, thresh=8.0):
    """Red overlay on a dimmed base where per-pixel abs diff exceeds thresh."""
    d = np.abs(base_rgb - other_rgb).mean(axis=2)
    hot = d > thresh
    canvas = base_rgb * 0.35
    canvas[hot] = [255, 40, 40]
    save_rgb(canvas, out_path)
    return float(hot.mean())  # fraction of changed pixels


# ---------------------------------------------------------------------------
# Subcommand: mask-apply
# ---------------------------------------------------------------------------

def cmd_mask_apply(args):
    master = load_rgb(args.master)
    mask = load_gray(args.mask)
    _check_same_size(master, mask, "master vs mask")
    alpha = mask
    if args.invert:
        alpha = 255.0 - alpha
    if args.feather > 0:
        a_img = Image.fromarray(alpha.astype(np.uint8), "L").filter(
            ImageFilter.GaussianBlur(args.feather))
        alpha = np.asarray(a_img, dtype=np.float64)

    rgba = np.dstack([master, alpha])

    # Trim to alpha bounding box so the layer is a compact, positioned sprite.
    ys, xs = np.where(alpha > args.trim_thresh)
    if len(xs) == 0:
        raise SystemExit("ERROR: mask is empty after threshold; nothing to cut")
    x0, x1 = int(xs.min()), int(xs.max()) + 1
    y0, y1 = int(ys.min()), int(ys.max()) + 1
    if args.pad:
        x0, y0 = max(0, x0 - args.pad), max(0, y0 - args.pad)
        x1 = min(master.shape[1], x1 + args.pad)
        y1 = min(master.shape[0], y1 + args.pad)
    layer = rgba[y0:y1, x0:x1]
    save_rgba(layer, args.out)

    result = {"ok": True, "out": args.out,
              "offset": {"x": x0, "y": y0},
              "size": {"w": x1 - x0, "h": y1 - y0},
              "canvas": {"w": master.shape[1], "h": master.shape[0]}}
    print(json.dumps(result, indent=2))
    print("\nManifest entry:", json.dumps(
        {"name": Path(args.out).stem, "path": args.out, "x": x0, "y": y0, "z": 10}))


# ---------------------------------------------------------------------------
# Subcommand: edge-clean
# ---------------------------------------------------------------------------

def cmd_edge_clean(args):
    rgba = load_rgba(args.layer)
    rgb = rgba[..., :3].copy()
    alpha = rgba[..., 3].copy()

    # Foreground color extension: fill fringe (partially transparent) pixels with
    # the colour of neighbouring opaque pixels, so premultiplied compositing does
    # not reveal a dark or background-tinted halo. This is the fringe fix.
    known = alpha >= args.opaque_thresh
    rgb[~known] = 0.0
    filled = rgb.copy()
    kmask = known.astype(np.float64)
    for _ in range(args.passes):
        acc = np.zeros_like(filled)
        cnt = np.zeros_like(kmask)
        for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            acc += np.roll(np.roll(filled, dy, 0), dx, 1)
            cnt += np.roll(np.roll(kmask, dy, 0), dx, 1)
        grow = (kmask == 0) & (cnt > 0)
        filled[grow] = acc[grow] / cnt[grow, None]
        kmask[grow] = 1.0
    rgb = filled

    if args.feather > 0:
        a_img = Image.fromarray(alpha.astype(np.uint8), "L").filter(
            ImageFilter.GaussianBlur(args.feather))
        alpha = np.asarray(a_img, dtype=np.float64)

    save_rgba(np.dstack([rgb, alpha]), args.out)
    print(json.dumps({"ok": True, "out": args.out,
                      "fringe_pixels_filled": int((~known).sum()),
                      "passes": args.passes, "feather": args.feather}, indent=2))


# ---------------------------------------------------------------------------
# compose core
# ---------------------------------------------------------------------------

def _compose(manifest, base_dir):
    size = manifest.get("size")
    bg_path = manifest.get("background")
    if bg_path:
        bg = Image.open(base_dir / bg_path).convert("RGBA")
        if size is None:
            size = [bg.width, bg.height]
    if size is None:
        raise SystemExit("ERROR: manifest needs 'size' or a 'background'")
    canvas = Image.new("RGBA", (int(size[0]), int(size[1])), (0, 0, 0, 0))
    if bg_path:
        canvas.alpha_composite(bg, (0, 0))
    for layer in sorted(manifest["layers"], key=lambda d: d.get("z", 0)):
        img = Image.open(base_dir / layer["path"]).convert("RGBA")
        canvas.alpha_composite(img, (int(layer.get("x", 0)), int(layer.get("y", 0))))
    return canvas


def cmd_compose(args):
    manifest = json.loads(Path(args.manifest).read_text())
    base_dir = Path(args.manifest).parent
    out = _compose(manifest, base_dir)
    out.convert("RGB").save(args.out) if args.flatten else out.save(args.out)
    print(json.dumps({"ok": True, "out": args.out,
                      "layers": len(manifest["layers"])}, indent=2))


# ---------------------------------------------------------------------------
# Subcommand: verify
# ---------------------------------------------------------------------------

def cmd_verify(args):
    manifest = json.loads(Path(args.manifest).read_text())
    base_dir = Path(args.manifest).parent
    recomposite = np.asarray(_compose(manifest, base_dir).convert("RGB"), dtype=np.float64)
    master = load_rgb(args.master)
    _check_same_size(master, recomposite, "master vs recomposite")

    score = mssim(luminance(master), luminance(recomposite))
    p = psnr(master, recomposite)
    changed = None
    if args.heatmap:
        changed = diff_heatmap(master, recomposite, args.heatmap)
    passed = score >= args.min_ssim

    result = {"ok": True, "ssim": round(score, 5), "psnr": round(p, 2),
              "min_ssim": args.min_ssim, "passed": passed}
    if changed is not None:
        result["changed_fraction"] = round(changed, 5)
        result["heatmap"] = args.heatmap
    print(json.dumps(result, indent=2))
    if not passed:
        print("FAIL: recomposite drifted from master. A layer is mis-positioned, "
              "an alpha is wrong, or the plate altered non-hole pixels.", file=sys.stderr)
        return 1
    return 0


# ---------------------------------------------------------------------------
# Subcommand: registration-check
# ---------------------------------------------------------------------------

def cmd_registration_check(args):
    base = load_rgb(args.base)
    variant = load_rgb(args.variant)
    _check_same_size(base, variant, "base vs variant")

    d = np.abs(base - variant).mean(axis=2)
    changed = d > args.change_thresh
    frac = float(changed.mean())

    bbox = None
    outside_ssim = 1.0
    if changed.any():
        ys, xs = np.where(changed)
        bbox = {"x0": int(xs.min()), "y0": int(ys.min()),
                "x1": int(xs.max()) + 1, "y1": int(ys.max()) + 1}
        # SSIM outside a dilated change bbox: registration must hold there.
        outside = np.ones(changed.shape, dtype=bool)
        m = args.margin
        outside[max(0, bbox["y0"] - m):bbox["y1"] + m,
                max(0, bbox["x0"] - m):bbox["x1"] + m] = False
        if outside.any():
            bl, vl = luminance(base), luminance(variant)
            smap = ssim_map(bl, vl)
            outside_ssim = float(smap[outside].mean())

    localized = frac <= args.max_changed
    registered = outside_ssim >= args.min_outside_ssim
    passed = localized and registered

    result = {"ok": True, "changed_fraction": round(frac, 5),
              "change_bbox": bbox, "outside_change_ssim": round(outside_ssim, 5),
              "localized": localized, "registered": registered, "passed": passed}
    if args.heatmap:
        diff_heatmap(base, variant, args.heatmap, thresh=args.change_thresh)
        result["heatmap"] = args.heatmap
    print(json.dumps(result, indent=2))
    if not passed:
        msg = []
        if not localized:
            msg.append(f"change covers {frac:.1%} of the layer (cap {args.max_changed:.1%}); "
                       "the model likely repainted the whole object instead of editing in place")
        if not registered:
            msg.append(f"outside-change SSIM {outside_ssim:.4f} below {args.min_outside_ssim}; "
                       "the variant drifted out of registration with its base")
        print("FAIL: " + "; ".join(msg), file=sys.stderr)
        return 1
    return 0


# ---------------------------------------------------------------------------
# Subcommand: inpaint-guard
# ---------------------------------------------------------------------------

def cmd_inpaint_guard(args):
    master = load_rgb(args.master)
    plate = load_rgb(args.plate)
    holes = load_gray(args.holes)
    _check_same_size(master, plate, "master vs plate")
    _check_same_size(master, holes, "master vs holes")

    outside = holes < args.hole_thresh  # pixels that must stay unchanged
    d = np.abs(master - plate).mean(axis=2)
    leaked = outside & (d > args.tol)
    frac_leaked = float(leaked.sum()) / float(max(1, outside.sum()))

    bl, pl = luminance(master), luminance(plate)
    smap = ssim_map(bl, pl)
    outside_ssim = float(smap[outside].mean()) if outside.any() else 1.0
    passed = frac_leaked <= args.max_leak

    result = {"ok": True, "outside_ssim": round(outside_ssim, 5),
              "leaked_fraction": round(frac_leaked, 6),
              "max_leak": args.max_leak, "passed": passed}
    if args.heatmap:
        canvas = master * 0.35
        canvas[leaked] = [255, 40, 40]
        save_rgb(canvas, args.heatmap)
        result["heatmap"] = args.heatmap
    print(json.dumps(result, indent=2))
    if not passed:
        print(f"FAIL: inpaint altered {frac_leaked:.2%} of pixels OUTSIDE the holes. "
              "Re-mask so only the lifted-object regions are repainted.", file=sys.stderr)
        return 1
    return 0


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------

def build_parser():
    p = argparse.ArgumentParser(description="AstraJax scene layer-cut verification toolkit")
    sub = p.add_subparsers(dest="cmd", required=True)

    a = sub.add_parser("mask-apply", help="Cut a layer from the master via a mask")
    a.add_argument("--master", required=True)
    a.add_argument("--mask", required=True)
    a.add_argument("--out", required=True)
    a.add_argument("--feather", type=float, default=1.5, help="alpha blur radius (px)")
    a.add_argument("--invert", action="store_true", help="treat black as object")
    a.add_argument("--trim-thresh", type=float, default=8.0)
    a.add_argument("--pad", type=int, default=2)
    a.set_defaults(func=cmd_mask_apply)

    b = sub.add_parser("edge-clean", help="Feather alpha + decontaminate fringe halos")
    b.add_argument("--layer", required=True)
    b.add_argument("--out", required=True)
    b.add_argument("--opaque-thresh", type=float, default=250.0)
    b.add_argument("--passes", type=int, default=4)
    b.add_argument("--feather", type=float, default=0.8)
    b.set_defaults(func=cmd_edge_clean)

    c = sub.add_parser("compose", help="Composite plate + layers into one image")
    c.add_argument("--manifest", required=True)
    c.add_argument("--out", required=True)
    c.add_argument("--flatten", action="store_true", help="flatten to RGB")
    c.set_defaults(func=cmd_compose)

    d = sub.add_parser("verify", help="Recomposite vs master (SSIM/PSNR)")
    d.add_argument("--manifest", required=True)
    d.add_argument("--master", required=True)
    d.add_argument("--min-ssim", type=float, default=0.985)
    d.add_argument("--heatmap", default=None)
    d.set_defaults(func=cmd_verify)

    e = sub.add_parser("registration-check", help="State variant vs base layer")
    e.add_argument("--base", required=True)
    e.add_argument("--variant", required=True)
    e.add_argument("--change-thresh", type=float, default=8.0)
    e.add_argument("--max-changed", type=float, default=0.6,
                   help="max fraction of pixels allowed to change")
    e.add_argument("--min-outside-ssim", type=float, default=0.98)
    e.add_argument("--margin", type=int, default=6)
    e.add_argument("--heatmap", default=None)
    e.set_defaults(func=cmd_registration_check)

    f = sub.add_parser("inpaint-guard", help="Confirm inpaint changed only the holes")
    f.add_argument("--master", required=True)
    f.add_argument("--plate", required=True)
    f.add_argument("--holes", required=True, help="mask: white = repainted hole region")
    f.add_argument("--tol", type=float, default=6.0)
    f.add_argument("--hole-thresh", type=float, default=128.0)
    f.add_argument("--max-leak", type=float, default=0.002)
    f.add_argument("--heatmap", default=None)
    f.set_defaults(func=cmd_inpaint_guard)

    return p


def main():
    args = build_parser().parse_args()
    rc = args.func(args)
    sys.exit(rc if isinstance(rc, int) else 0)


if __name__ == "__main__":
    main()
