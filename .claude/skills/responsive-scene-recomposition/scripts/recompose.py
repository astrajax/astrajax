#!/usr/bin/env python3
"""
recompose.py -- art-directed responsive framing for wide AstraJax painted scenes.

A 16:9 painted room (Brain Vault, Doc's Workshop) shown on a portrait phone must
be cropped, not letterboxed. A naive centre-crop guillotines the subject (the
central vat, Doc at his pedestal) and the percentage-positioned hotspots drift
off the visible slice. This tool computes, per breakpoint, the focal-aware crop
(as a CSS object-position), re-projects every hotspot into the cropped view, and
flags any interactable that falls off-screen so it can be repositioned or hidden.

Delivery models both supported:
  * Flattened <img>/<video> with object-fit: cover -> use the object-position.
  * Layered DOM stage -> translate the stage by the crop offset; children move
    with it, so the value here is the off-screen flag per breakpoint.

Dependency: Pillow only (geometry is plain arithmetic; PIL draws the preview).

Subcommands:
  crop      One crop: master + focal + target aspect -> crop rect + object-position.
  project   One hotspot: master coords + crop -> projected % + inside flag.
  plan      Full per-breakpoint plan (crop, object-position, hotspots) + CSS + preview.
  verify    Assert every critical hotspot stays on-screen at every breakpoint.

Run `python3 recompose.py <subcommand> --help` for arguments.
"""

import argparse
import json
import sys
from pathlib import Path

from PIL import Image, ImageDraw


def compute_crop(W, H, focal, aspect):
    """Largest cover-crop of the given aspect, centred on the focal centre and
    clamped to the image. Returns the crop rect, the CSS object-position, and
    whether the whole focal rect fits inside the crop."""
    a_i = W / H
    if aspect <= a_i:            # target taller/narrower: full height, crop sides
        cropH, cropW = H, round(H * aspect)
    else:                        # target wider: full width, crop top and bottom
        cropW, cropH = W, round(W / aspect)
    cropW, cropH = min(cropW, W), min(cropH, H)

    fcx = focal["x"] + focal.get("w", 0) / 2
    fcy = focal["y"] + focal.get("h", 0) / 2
    cropX = max(0, min(round(fcx - cropW / 2), W - cropW))
    cropY = max(0, min(round(fcy - cropH / 2), H - cropH))

    ox = 50.0 if W == cropW else round(cropX / (W - cropW) * 1000) / 10
    oy = 50.0 if H == cropH else round(cropY / (H - cropH) * 1000) / 10

    focal_fits = (focal.get("w", 0) <= cropW and focal.get("h", 0) <= cropH
                  and cropX <= focal["x"]
                  and cropX + cropW >= focal["x"] + focal.get("w", 0)
                  and cropY <= focal["y"]
                  and cropY + cropH >= focal["y"] + focal.get("h", 0))
    return {"x": cropX, "y": cropY, "w": cropW, "h": cropH,
            "object_position": [ox, oy], "focal_fits": focal_fits}


def project(hx, hy, crop):
    fx = (hx - crop["x"]) / crop["w"]
    fy = (hy - crop["y"]) / crop["h"]
    return {"x_pct": round(fx * 1000) / 10, "y_pct": round(fy * 1000) / 10,
            "inside": 0.0 <= fx <= 1.0 and 0.0 <= fy <= 1.0}


def _load_manifest(path):
    m = json.loads(Path(path).read_text())
    W, H = m["size"]
    return m, W, H


# ---------------------------------------------------------------------------

def cmd_crop(args):
    focal = {"x": args.fx, "y": args.fy, "w": args.fw, "h": args.fh}
    crop = compute_crop(args.width, args.height, focal, args.aspect)
    if args.preview and args.image:
        im = Image.open(args.image).convert("RGB")
        d = ImageDraw.Draw(im)
        d.rectangle([crop["x"], crop["y"], crop["x"] + crop["w"], crop["y"] + crop["h"]],
                    outline=(217, 117, 69), width=max(2, args.width // 300))
        im.save(args.preview)
        crop["preview"] = args.preview
    print(json.dumps(crop, indent=2))
    return 0


def cmd_project(args):
    crop = {"x": args.cx, "y": args.cy, "w": args.cw, "h": args.ch}
    print(json.dumps(project(args.hx, args.hy, crop), indent=2))
    return 0


def _plan(m, W, H):
    focal = m["focal"]
    out = {"room": m.get("room", ""), "size": [W, H], "breakpoints": []}
    for bp in m["breakpoints"]:
        crop = compute_crop(W, H, focal, bp["aspect"])
        spots = []
        for hs in m.get("hotspots", []):
            p = project(hs["x"], hs["y"], crop)
            p.update({"name": hs["name"], "critical": bool(hs.get("critical"))})
            spots.append(p)
        out["breakpoints"].append({"name": bp["name"], "aspect": bp["aspect"],
                                   "crop": crop, "hotspots": spots})
    return out


def _css(plan):
    lines = [f"""/* {plan['room']} responsive framing (wire the media queries to
your breakpoints) */"""]
    for bp in plan["breakpoints"]:
        ox, oy = bp["crop"]["object_position"]
        off = [s["name"] for s in bp["hotspots"] if not s["inside"]]
        note = f"""  /* off-screen here: {', '.join(off)} */""" if off else ""
        lines.append(f""".scene-{plan['room']}.bp-{bp['name']} {{ object-fit: cover;
object-position: {ox}% {oy}%; }}{note}""")
    return "\n".join(lines)


def cmd_plan(args):
    m, W, H = _load_manifest(args.manifest)
    plan = _plan(m, W, H)
    Path(args.out).write_text(json.dumps(plan, indent=2))
    if args.css:
        Path(args.css).write_text(_css(plan))
    if args.preview and args.image:
        im = Image.open(args.image).convert("RGB")
        d = ImageDraw.Draw(im)
        f = m["focal"]
        d.rectangle([f["x"], f["y"], f["x"] + f.get("w", 0), f["y"] + f.get("h", 0)],
                    outline=(154, 167, 122), width=max(2, W // 250))
        palette = [(217, 117, 69), (231, 209, 173), (120, 160, 220), (200, 90, 160)]
        for i, bp in enumerate(plan["breakpoints"]):
            c = bp["crop"]
            d.rectangle([c["x"], c["y"], c["x"] + c["w"], c["y"] + c["h"]],
                        outline=palette[i % len(palette)], width=max(2, W // 350))
        for hs in m.get("hotspots", []):
            col = (255, 60, 60) if hs.get("critical") else (255, 210, 90)
            d.ellipse([hs["x"] - 6, hs["y"] - 6, hs["x"] + 6, hs["y"] + 6],
                      fill=col)
        im.save(args.preview)
    result = {"ok": True, "out": args.out, "breakpoints": len(plan["breakpoints"])}
    if args.css:
        result["css"] = args.css
    if args.preview and args.image:
        result["preview"] = args.preview
    print(json.dumps(result, indent=2))
    return 0


def cmd_verify(args):
    m, W, H = _load_manifest(args.manifest)
    plan = _plan(m, W, H)
    failures, warnings = [], []
    for bp in plan["breakpoints"]:
        if not bp["crop"]["focal_fits"]:
            warnings.append(f"""{bp['name']}: focal region does not fully fit the crop""")
        for s in bp["hotspots"]:
            if s["critical"] and not s["inside"]:
                failures.append(f"""{bp['name']}: critical hotspot '{s['name']}'
off-screen at ({s['x_pct']}%, {s['y_pct']}%)""")
    passed = not failures
    print(json.dumps({"ok": True, "passed": passed, "failures": failures,
                      "warnings": warnings}, indent=2))
    if not passed:
        print("""FAIL: a critical interactable leaves the frame. Reposition it for
that breakpoint, widen the focal region, or mark it non-critical.""",
              file=sys.stderr)
        return 1
    return 0


def build_parser():
    p = argparse.ArgumentParser(description="Responsive framing for painted scenes")
    sub = p.add_subparsers(dest="cmd", required=True)

    c = sub.add_parser("crop", help="Compute one focal-aware crop")
    for name in ("width", "height", "fx", "fy", "fw", "fh"):
        c.add_argument(f"--{name}", type=int, required=True)
    c.add_argument("--aspect", type=float, required=True, help="target w/h, e.g. 0.5625")
    c.add_argument("--image", default=None)
    c.add_argument("--preview", default=None)
    c.set_defaults(func=cmd_crop)

    pr = sub.add_parser("project", help="Project one hotspot into a crop")
    for name in ("hx", "hy", "cx", "cy", "cw", "ch"):
        pr.add_argument(f"--{name}", type=int, required=True)
    pr.set_defaults(func=cmd_project)

    pl = sub.add_parser("plan", help="Per-breakpoint plan + CSS + preview")
    pl.add_argument("--manifest", required=True)
    pl.add_argument("--out", required=True)
    pl.add_argument("--css", default=None)
    pl.add_argument("--image", default=None)
    pl.add_argument("--preview", default=None)
    pl.set_defaults(func=cmd_plan)

    v = sub.add_parser("verify", help="Assert critical hotspots stay on-screen")
    v.add_argument("--manifest", required=True)
    v.set_defaults(func=cmd_verify)
    return p


def main():
    args = build_parser().parse_args()
    rc = args.func(args)
    sys.exit(rc if isinstance(rc, int) else 0)


if __name__ == "__main__":
    main()
