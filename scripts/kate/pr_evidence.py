#!/usr/bin/env python3
"""
pr_evidence.py -- before/after visual evidence for Kate's scene-craft PRs.

Kate's working agreement demands before/after proof on every PR, but the capture
was improvised. This codifies it: capture route screenshots at chosen viewports
(Playwright), then compose a shareable before/after artifact (side-by-side plus a
pixel-diff heatmap plus a self-contained wipe-slider HTML).

The COMPOSITION is deterministic (numpy + Pillow) and is the tested core. The
CAPTURE uses Playwright, lazy-imported so this script loads without it; if
Playwright is absent, capture returns clear setup guidance, and Kate can instead
grab the two PNGs with the platform browser tools and feed them straight to
`compose`.

Subcommands:
  capture   Screenshot routes at viewports from a base and a branch URL (Playwright).
  compose   Two PNGs -> side-by-side + diff heatmap + a self-contained slider HTML.

Run `python3 pr_evidence.py <subcommand> --help` for arguments.
"""

import argparse
import base64
import json
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw


# ---------------------------------------------------------------------------
# capture (Playwright, lazy)
# ---------------------------------------------------------------------------

def cmd_capture(args):
    try:
        from playwright.sync_api import sync_playwright
    except ImportError:
        print(json.dumps({"ok": False, "reason": "playwright not installed",
              "fix": "pip install playwright && python3 -m playwright install chromium. "
              "Or capture the two PNGs with the platform browser tools "
              "(BrowserNavigate + BrowserScreenshot) and run `compose` on them."},
              indent=2))
        return 2

    out = Path(args.out_dir)
    out.mkdir(parents=True, exist_ok=True)
    viewports = []
    for v in args.viewports.split(","):
        w, h = v.lower().split("x")
        viewports.append((int(w), int(h)))
    routes = args.routes.split(",")
    shots = []
    sources = [("before", args.url)]
    if args.url_b:
        sources.append(("after", args.url_b))

    with sync_playwright() as pw:
        browser = pw.chromium.launch()
        for label, root in sources:
            for (vw, vh) in viewports:
                page = browser.new_page(viewport={"width": vw, "height": vh})
                for route in routes:
                    page.goto(root.rstrip("/") + route, wait_until="networkidle")
                    if args.selector:
                        page.wait_for_selector(args.selector)
                    slug = route.strip("/").replace("/", "-") or "home"
                    fp = out / f"{slug}_{vw}x{vh}_{label}.png"
                    if args.selector:
                        page.locator(args.selector).screenshot(path=str(fp))
                    else:
                        page.screenshot(path=str(fp), full_page=args.full_page)
                    shots.append(str(fp))
                page.close()
        browser.close()
    print(json.dumps({"ok": True, "shots": shots}, indent=2))
    return 0


# ---------------------------------------------------------------------------
# compose (tested core)
# ---------------------------------------------------------------------------

def _load(path):
    return Image.open(path).convert("RGB")


def _label_bar(width, text, h=28):
    bar = Image.new("RGB", (width, h), (23, 26, 24))
    d = ImageDraw.Draw(bar)
    d.text((8, 7), text, fill=(231, 209, 173))
    return bar


def cmd_compose(args):
    before, after = _load(args.before), _load(args.after)
    if after.size != before.size:
        after = after.resize(before.size)
    w, h = before.size
    gap = 12

    # Side-by-side with labels.
    bar_h = 28
    canvas = Image.new("RGB", (w * 2 + gap, h + bar_h), (17, 18, 16))
    canvas.paste(_label_bar(w, args.label_a), (0, 0))
    canvas.paste(_label_bar(w, args.label_b), (w + gap, 0))
    canvas.paste(before, (0, bar_h))
    canvas.paste(after, (w + gap, bar_h))
    canvas.save(args.out)
    result = {"ok": True, "side_by_side": args.out, "size": [w, h]}

    # Pixel-diff heatmap.
    if args.diff:
        a = np.asarray(before, dtype=np.float64)
        b = np.asarray(after, dtype=np.float64)
        d = np.abs(a - b).mean(axis=2)
        hot = d > args.diff_thresh
        heat = (a * 0.35)
        heat[hot] = [255, 40, 40]
        Image.fromarray(np.clip(heat, 0, 255).astype(np.uint8), "RGB").save(args.diff)
        result["diff"] = args.diff
        result["changed_fraction"] = round(float(hot.mean()), 5)

    # Self-contained wipe-slider HTML (both frames embedded as data URIs).
    if args.slider:
        def datauri(p):
            return "data:image/png;base64," + base64.b64encode(Path(p).read_bytes()).decode()
        html = f"""<!doctype html><meta charset=utf-8>
<title>{args.label_a} vs {args.label_b}</title>
<style>body{{margin:0;background:#171A18;font-family:system-ui}}
.ba{{position:relative;max-width:{w}px;margin:16px auto}}
.ba img{{display:block;width:100%}}
.ba .top{{position:absolute;inset:0;clip-path:inset(0 50% 0 0)}}
input{{width:{w}px;display:block;margin:8px auto}}</style>
<div class=ba><img src="{datauri(args.before)}">
<img class=top src="{datauri(args.after)}"></div>
<input type=range min=0 max=100 value=50
 oninput="document.querySelector('.top').style.clipPath='inset(0 '+(100-this.value)+'% 0 0)'">"""
        Path(args.slider).write_text(html)
        result["slider"] = args.slider

    print(json.dumps(result, indent=2))
    return 0


def build_parser():
    p = argparse.ArgumentParser(description="Before/after PR evidence for scene work")
    sub = p.add_subparsers(dest="cmd", required=True)

    c = sub.add_parser("capture", help="Screenshot routes at viewports (Playwright)")
    c.add_argument("--url", required=True, help="base (before) URL root")
    c.add_argument("--url-b", default=None, help="branch (after) URL root")
    c.add_argument("--routes", default="/", help="comma-separated routes")
    c.add_argument("--viewports", default="1440x900,390x844")
    c.add_argument("--selector", default=None, help="screenshot only this element")
    c.add_argument("--full-page", action="store_true")
    c.add_argument("--out-dir", default="pr-evidence")
    c.set_defaults(func=cmd_capture)

    m = sub.add_parser("compose", help="Compose before/after artifacts")
    m.add_argument("--before", required=True)
    m.add_argument("--after", required=True)
    m.add_argument("--out", required=True, help="side-by-side PNG")
    m.add_argument("--label-a", default="before")
    m.add_argument("--label-b", default="after")
    m.add_argument("--diff", default=None, help="write a pixel-diff heatmap PNG")
    m.add_argument("--diff-thresh", type=float, default=10.0)
    m.add_argument("--slider", default=None, help="write a self-contained wipe-slider HTML")
    m.set_defaults(func=cmd_compose)
    return p


def main():
    args = build_parser().parse_args()
    rc = args.func(args)
    sys.exit(rc if isinstance(rc, int) else 0)


if __name__ == "__main__":
    main()
