#!/usr/bin/env python3
"""Self-test: a wide 1600x900 painted room with a central focal region and four
hotspots, framed across wide/portrait/square breakpoints. Proves focal-aware
crops, hotspot reprojection, off-screen detection, and the critical-hotspot gate."""
import json
import subprocess
import sys
from pathlib import Path

from PIL import Image

HERE = Path(__file__).parent
T = HERE / "_test"
T.mkdir(exist_ok=True)
CLI = [sys.executable, str(HERE / "recompose.py")]
W, H = 1600, 900


def run(args):
    r = subprocess.run(CLI + args, capture_output=True, text=True)
    out = r.stdout.strip()
    try:
        payload = json.loads(out) if out.startswith("{") else {}
    except json.JSONDecodeError:
        payload = {}
    return r.returncode, payload, r.stdout + r.stderr


# synthetic master for preview
im = Image.new("RGB", (W, H))
px = im.load()
for y in range(H):
    for x in range(0, W, 4):
        px[x, y] = (40 + x * 120 // W, 30 + y * 90 // H, 25)
im.save(T / "master.png")

manifest = {
    "room": "test-room", "size": [W, H],
    "focal": {"x": 560, "y": 250, "w": 480, "h": 400},
    "hotspots": [
        {"name": "vat", "x": 800, "y": 450, "critical": True},
        {"name": "left-vial", "x": 620, "y": 450, "critical": True},
        {"name": "nameplate", "x": 800, "y": 820, "critical": True},
        {"name": "right-arrow", "x": 1520, "y": 450, "critical": False},
    ],
    "breakpoints": [
        {"name": "wide", "aspect": 1.7778},
        {"name": "portrait", "aspect": 0.5625},
        {"name": "square", "aspect": 1.0},
    ],
}
(T / "scene.json").write_text(json.dumps(manifest))

results = []


def expect(label, cond, detail=""):
    results.append((label, cond))
    print(f"  [{'PASS' if cond else 'FAIL'}] {label}  {detail}")


# --- plan ---
rc, p, log = run(["plan", "--manifest", str(T / "scene.json"), "--out", str(T / "plan.json"),
                  "--css", str(T / "frame.css"), "--image", str(T / "master.png"),
                  "--preview", str(T / "preview.png")])
plan = json.loads((T / "plan.json").read_text())
bps = {b["name"]: b for b in plan["breakpoints"]}
expect("plan produced all breakpoints", rc == 0 and len(plan["breakpoints"]) == 3)
expect("wide keeps the whole master", bps["wide"]["crop"]["w"] == W and bps["wide"]["crop"]["h"] == H,
       f"crop={bps['wide']['crop']['w']}x{bps['wide']['crop']['h']}")
expect("portrait is a full-height narrow slice",
       bps["portrait"]["crop"]["h"] == 900 and bps["portrait"]["crop"]["w"] == round(900 * 0.5625),
       f"crop={bps['portrait']['crop']['w']}x{bps['portrait']['crop']['h']}")


def spot(bp, name):
    return next(s for s in bps[bp]["hotspots"] if s["name"] == name)


expect("central hotspot stays inside portrait", spot("portrait", "vat")["inside"],
       f"vat@portrait={spot('portrait','vat')['x_pct']}%")
expect("far-right hotspot detected off-screen on portrait",
       not spot("portrait", "right-arrow")["inside"],
       f"right-arrow@portrait={spot('portrait','right-arrow')['x_pct']}%")
expect("far-right hotspot off-screen on square too",
       not spot("square", "right-arrow")["inside"])
expect("plan wrote css + preview",
       (T / "frame.css").exists() and (T / "preview.png").exists())

# --- verify: right-arrow decorative -> passes ---
rc, p, log = run(["verify", "--manifest", str(T / "scene.json")])
expect("verify passes when off-screen spot is non-critical", rc == 0 and p.get("passed"),
       f"warnings={len(p.get('warnings', []))}")

# --- verify: mark right-arrow critical -> fails ---
bad = json.loads((T / "scene.json").read_text())
for hs in bad["hotspots"]:
    if hs["name"] == "right-arrow":
        hs["critical"] = True
(T / "scene_bad.json").write_text(json.dumps(bad))
rc, p, log = run(["verify", "--manifest", str(T / "scene_bad.json")])
expect("verify fails when a critical spot goes off-screen",
       rc == 1 and not p.get("passed") and any("right-arrow" in f for f in p.get("failures", [])),
       f"failures={len(p.get('failures', []))}")

# --- crop subcommand matches plan for portrait ---
rc, p, log = run(["crop", "--width", str(W), "--height", str(H),
                  "--fx", "560", "--fy", "250", "--fw", "480", "--fh", "400",
                  "--aspect", "0.5625"])
expect("crop subcommand agrees with plan",
       rc == 0 and p.get("w") == bps["portrait"]["crop"]["w"],
       f"w={p.get('w')} objpos={p.get('object_position')}")

n_pass = sum(1 for _, c in results if c)
print(f"\n{n_pass}/{len(results)} checks passed")
sys.exit(0 if n_pass == len(results) else 1)
