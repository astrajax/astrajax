#!/usr/bin/env python3
"""Gate + conform a first/last-frame clip against its contact stills.

The scene-layer-cut registration gate, applied to motion. SHAKEDOWN LESSONS
(16 Jul 2026, first keyed run) baked in:
  1. Veo renders true 16:9; the bank plates are 2752x1536 = 1.792:1. Veo
     CENTER-CROPS the conditioning input, so the still must be center-cropped
     to the clip's aspect before comparison — comparing squashed frames
     produced false FAILs at ~0.69 outside-SSIM.
  2. Compare at the CLIP's resolution (downscale the still), never upscale
     the clip frame — upscaling tanks SSIM with resampling blur.
  3. Recalibrated clip bars (vs a measured x264-crf18 codec floor of ~0.997):
     outside-region SSIM >= 0.95 AND drift(>15) <= 1.0% — PROVISIONAL, set
     from the first probe pair (0.9587-0.9637 outside). The still-vs-still
     bar (0.985/0.3%) applies only to same-pipeline comparisons at native res.
     Bars move only by joint Matthew+Kate decision, never silently.

Checks:
  - each clip endpoint vs its contact still (outside-region = HARD, full-frame
    = advisory, eyes decide)
  - --seam: clip first frame vs clip last frame (loop closure; dual-anchored
    holds measured 0.983 full-frame on the first probe; one-directional
    generation measured 0.336 — the difference IS the technique)
  - --conform: CFR fps, exact duration, silent, 1920x1080 + frame-zero poster

Usage:
  python3 flf_gate.py --clip clip.mp4 --first-still a.png --last-still b.png \
      --outdir gate-out [--seam] [--conform] [--duration 8.0] [--fps 24] \
      [--mask 560,2110,150] [--extra-mask x0,x1,y0]

Mask coords are in STILL pixel space (default = Clive+book region of the
2752x1536 bank plates). For poses that move the book (presenting), add
--extra-mask 350,2110,1050 so the object's vacated footprint doesn't false-flag.
"""
import argparse, json, os, subprocess, sys
import numpy as np
from PIL import Image


def run(cmd):
    p = subprocess.run(cmd, capture_output=True, text=True)
    if p.returncode != 0:
        print(p.stderr[-800:], file=sys.stderr)
        sys.exit(f"command failed: {' '.join(cmd[:6])}...")
    return p.stdout


def box_blur(a, r=1):
    k = 2 * r + 1
    p = np.pad(a, r, mode="edge")
    c = np.cumsum(p, axis=0)
    a1 = (c[k-1:, :] - np.vstack([np.zeros((1, c.shape[1])), c[:-k, :]])) / k
    c = np.cumsum(a1, axis=1)
    return (c[:, k-1:] - np.hstack([np.zeros((c.shape[0], 1)), c[:, :-k]])) / k


def uniform_filter(a, k):
    r = k // 2
    p = np.pad(a, r, mode="reflect")
    c = np.cumsum(p, axis=0)
    a1 = (c[k-1:, :] - np.vstack([np.zeros((1, c.shape[1])), c[:-k, :]])) / k
    c = np.cumsum(a1, axis=1)
    return (c[:, k-1:] - np.hstack([np.zeros((c.shape[0], 1)), c[:, :-k]])) / k


def ssim_map(x, y, k=11):
    C1, C2 = (0.01 * 255) ** 2, (0.03 * 255) ** 2
    mx, my = uniform_filter(x, k), uniform_filter(y, k)
    vx = uniform_filter(x * x, k) - mx * mx
    vy = uniform_filter(y * y, k) - my * my
    cxy = uniform_filter(x * y, k) - mx * my
    return ((2 * mx * my + C1) * (2 * cxy + C2)) / ((mx * mx + my * my + C1) * (vx + vy + C2))


def gray_arr(im):
    return box_blur(np.asarray(im.convert("L"), dtype=np.float64), 1)


def prep_still(still_path, frame_w, frame_h, mask_rects):
    """Center-crop the still to the frame's aspect, resize to frame res,
    and transform mask rects from still space into frame space."""
    im = Image.open(still_path)
    SW, SH = im.size
    frame_aspect = frame_w / frame_h
    still_aspect = SW / SH
    crop_x0, crop_y0 = 0, 0
    cw, ch = SW, SH
    handling = "direct"
    if abs(still_aspect - frame_aspect) / frame_aspect > 0.003:
        if still_aspect > frame_aspect:   # still wider -> crop width
            cw = int(round(SH * frame_aspect))
            crop_x0 = (SW - cw) // 2
            im = im.crop((crop_x0, 0, crop_x0 + cw, SH))
        else:                             # still taller -> crop height
            ch = int(round(SW / frame_aspect))
            crop_y0 = (SH - ch) // 2
            im = im.crop((0, crop_y0, SW, crop_y0 + ch))
        handling = f"center-crop({cw}x{ch})"
    im = im.resize((frame_w, frame_h), Image.LANCZOS)
    sx, sy = frame_w / cw, frame_h / ch
    rects = []
    for (x0, x1, y0) in mask_rects:
        rects.append((max(0, int((x0 - crop_x0) * sx)),
                      min(frame_w, int((x1 - crop_x0) * sx)),
                      max(0, int((y0 - crop_y0) * sy))))
    return gray_arr(im), rects, handling


def compare(frame_png, still_png, mask_rects):
    frame_im = Image.open(frame_png)
    W, H = frame_im.size
    ref, rects, handling = prep_still(still_png, W, H, mask_rects)
    fg = gray_arr(frame_im)
    d = np.abs(ref - fg)
    smap = ssim_map(ref, fg)
    change = np.zeros((H, W), dtype=bool)
    for (x0, x1, y0) in rects:
        change[y0:H, x0:x1] = True
    outside = ~change
    return {
        "aspect_handling": handling,
        "outside_ssim": round(float(smap[outside].mean()), 4),
        "outside_frac_gt15": round(float((d[outside] > 15).mean() * 100), 2),
        "fullframe_ssim": round(float(smap.mean()), 4),
        "inside_mean_absdiff": round(float(d[change].mean()), 2),
    }


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--clip", required=True)
    ap.add_argument("--first-still", required=True)
    ap.add_argument("--last-still", required=True)
    ap.add_argument("--outdir", default="gate-out")
    ap.add_argument("--seam", action="store_true", help="also measure clip first vs last frame (loop closure)")
    ap.add_argument("--conform", action="store_true")
    ap.add_argument("--duration", type=float, default=8.0)
    ap.add_argument("--fps", type=int, default=24)
    ap.add_argument("--mask", default="560,2110,150")
    ap.add_argument("--extra-mask", default=None)
    ap.add_argument("--bar-outside", type=float, default=0.95, help="clip-vs-still bar (recalibrated 16 Jul 2026; provisional)")
    ap.add_argument("--bar-drift", type=float, default=1.0)
    args = ap.parse_args()

    os.makedirs(args.outdir, exist_ok=True)
    rects = [tuple(int(v) for v in args.mask.split(","))]
    if args.extra_mask:
        rects.append(tuple(int(v) for v in args.extra_mask.split(",")))

    first_png = os.path.join(args.outdir, "clip-first.png")
    last_png = os.path.join(args.outdir, "clip-last.png")
    run(["ffmpeg", "-y", "-i", args.clip, "-vf", "select=eq(n\\,0)", "-vframes", "1", first_png])
    run(["ffmpeg", "-y", "-sseof", "-0.08", "-i", args.clip, "-update", "1", "-vframes", "1", last_png])

    report = {
        "clip": args.clip,
        "bars": {"outside_ssim": args.bar_outside, "drift_pct": args.bar_drift,
                 "note": "clip-vs-still bar, recalibrated 16 Jul 2026 vs codec floor ~0.997; provisional pending Matthew+Kate ratification"},
        "first_vs_still": compare(first_png, args.first_still, rects),
        "last_vs_still": compare(last_png, args.last_still, rects),
    }
    for k in ("first_vs_still", "last_vs_still"):
        m = report[k]
        m["pass_outside"] = bool(m["outside_ssim"] >= args.bar_outside and m["outside_frac_gt15"] <= args.bar_drift)
    report["gate"] = "PASS" if report["first_vs_still"]["pass_outside"] and report["last_vs_still"]["pass_outside"] else "FAIL"

    if args.seam:
        fg = gray_arr(Image.open(first_png))
        lg = gray_arr(Image.open(last_png))
        smap = ssim_map(fg, lg)
        report["seam_first_vs_last"] = {
            "fullframe_ssim": round(float(smap.mean()), 4),
            "note": "loop closure; dual-anchored holds measured ~0.983, one-directional ~0.336",
        }

    if args.conform:
        base = os.path.splitext(os.path.basename(args.clip))[0]
        conformed = os.path.join(args.outdir, f"{base}-conformed.mp4")
        poster = os.path.join(args.outdir, f"{base}-poster.png")
        run(["ffmpeg", "-y", "-i", args.clip,
             "-vf", f"fps={args.fps},scale=1920:1080:flags=lanczos",
             "-t", f"{args.duration:.3f}", "-an",
             "-c:v", "libx264", "-crf", "18", "-pix_fmt", "yuv420p",
             "-movflags", "+faststart", conformed])
        run(["ffmpeg", "-y", "-i", conformed, "-vf", "select=eq(n\\,0)", "-vframes", "1", poster])
        dur = run(["ffprobe", "-v", "quiet", "-show_entries", "format=duration", "-of", "csv=p=0", conformed]).strip()
        report["conformed"] = {"file": conformed, "poster": poster, "duration_s": float(dur), "fps": args.fps}

    out_json = os.path.join(args.outdir, "gate-report.json")
    with open(out_json, "w") as f:
        json.dump(report, f, indent=2)
    print(json.dumps(report, indent=2))


if __name__ == "__main__":
    main()
