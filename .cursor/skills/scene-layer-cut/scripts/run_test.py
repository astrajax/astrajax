#!/usr/bin/env python3
"""Self-test: synthesise a painted scene and exercise every subcommand.
Asserts the deterministic behaviour (good cut verifies; shifted variant fails
registration; out-of-hole inpaint leak is caught)."""
import json
import subprocess
import sys
from pathlib import Path

import numpy as np
from PIL import Image

HERE = Path(__file__).parent
T = HERE / "_test"
T.mkdir(exist_ok=True)
CLI = [sys.executable, str(HERE / "scene_layer_cut.py")]

H, W = 180, 240
X0, X1, Y0, Y1 = 70, 150, 80, 140  # book bbox


def save(arr, name):
    Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8)).save(T / name)
    return T / name


def run(args):
    r = subprocess.run(CLI + args, capture_output=True, text=True)
    out = r.stdout.strip()
    try:
        payload = json.loads(out.split("\n\n")[0]) if out else {}
    except json.JSONDecodeError:
        payload = {}
    return r.returncode, payload, r.stdout + r.stderr


# --- synthesise scene ---
yy, xx = np.mgrid[0:H, 0:W]
bg = 60 + 40 * (yy / H) + 15 * np.sin(xx / 9.0)
bg_rgb = np.dstack([bg, bg * 0.8, bg * 0.6])
book = np.dstack([
    150 + 30 * np.sin((xx + yy) / 4.0),
    40 + 20 * np.sin((xx + yy) / 4.0),
    40 + 20 * np.sin((xx + yy) / 4.0),
])
master = bg_rgb.copy()
region = (slice(Y0, Y1), slice(X0, X1))
master[region] = book[region]

mask = np.zeros((H, W))
mask[region] = 255

save(master, "master.png")
save(bg_rgb, "plate.png")          # ground-truth background (perfect inpaint)
save(mask, "book_mask.png")
save(mask, "holes.png")

results = []


def expect(label, cond, detail=""):
    results.append((label, cond, detail))
    print(f"  [{'PASS' if cond else 'FAIL'}] {label}  {detail}")


# --- mask-apply ---
rc, p, log = run(["mask-apply", "--master", str(T / "master.png"),
                  "--mask", str(T / "book_mask.png"), "--out", str(T / "book.png"),
                  "--feather", "1.0"])
expect("mask-apply cuts a positioned layer",
       rc == 0 and p.get("ok") and "offset" in p, f"offset={p.get('offset')}")
ox, oy = p["offset"]["x"], p["offset"]["y"]

# --- manifest + verify (good) ---
manifest = {"size": [W, H], "background": "plate.png",
            "layers": [{"name": "book", "path": "book.png", "x": ox, "y": oy, "z": 10}]}
(T / "manifest.json").write_text(json.dumps(manifest))
rc, p, log = run(["verify", "--manifest", str(T / "manifest.json"),
                  "--master", str(T / "master.png"),
                  "--heatmap", str(T / "verify_heat.png"), "--min-ssim", "0.98"])
expect("verify recomposite matches master", rc == 0 and p.get("passed"),
       f"ssim={p.get('ssim')} psnr={p.get('psnr')}")

# --- verify (bad: layer mis-positioned by 10px) ---
bad = json.loads((T / "manifest.json").read_text())
bad["layers"][0]["x"] += 10
(T / "manifest_bad.json").write_text(json.dumps(bad))
rc, p, log = run(["verify", "--manifest", str(T / "manifest_bad.json"),
                  "--master", str(T / "master.png"), "--min-ssim", "0.98"])
expect("verify catches a mis-positioned layer", rc == 1 and not p.get("passed"),
       f"ssim={p.get('ssim')}")

# --- registration-check: good variant (localized glow) ---
base_book = master[Y0:Y1, X0:X1].copy()
save(base_book, "base_book.png")
glow = base_book.copy()
glow[5:20, 5:25] = np.clip(glow[5:20, 5:25] + 90, 0, 255)  # small bright patch
save(glow, "variant_glow.png")
rc, p, log = run(["registration-check", "--base", str(T / "base_book.png"),
                  "--variant", str(T / "variant_glow.png"),
                  "--heatmap", str(T / "reg_heat.png")])
expect("registration-check passes a localized variant", rc == 0 and p.get("passed"),
       f"changed={p.get('changed_fraction')} outside_ssim={p.get('outside_change_ssim')}")

# --- registration-check: bad variant (3px shift = drift) ---
shift = np.roll(np.roll(base_book, 3, 0), 3, 1)
save(shift, "variant_shift.png")
rc, p, log = run(["registration-check", "--base", str(T / "base_book.png"),
                  "--variant", str(T / "variant_shift.png")])
expect("registration-check fails a shifted (drifted) variant",
       rc == 1 and not p.get("passed"),
       f"changed={p.get('changed_fraction')} outside_ssim={p.get('outside_change_ssim')}")

# --- inpaint-guard: good plate (perfect background) ---
rc, p, log = run(["inpaint-guard", "--master", str(T / "master.png"),
                  "--plate", str(T / "plate.png"), "--holes", str(T / "holes.png")])
expect("inpaint-guard passes a clean plate", rc == 0 and p.get("passed"),
       f"leaked={p.get('leaked_fraction')} outside_ssim={p.get('outside_ssim')}")

# --- inpaint-guard: bad plate (edit leaked outside the hole) ---
badplate = bg_rgb.copy()
badplate[10:25, 180:210] = 255  # bright edit far from the book hole
save(badplate, "plate_bad.png")
rc, p, log = run(["inpaint-guard", "--master", str(T / "master.png"),
                  "--plate", str(T / "plate_bad.png"), "--holes", str(T / "holes.png"),
                  "--heatmap", str(T / "leak_heat.png")])
expect("inpaint-guard catches an out-of-hole leak", rc == 1 and not p.get("passed"),
       f"leaked={p.get('leaked_fraction')}")

# --- edge-clean runs ---
rc, p, log = run(["edge-clean", "--layer", str(T / "book.png"),
                  "--out", str(T / "book_clean.png")])
expect("edge-clean produces a cleaned layer", rc == 0 and p.get("ok"),
       f"fringe_filled={p.get('fringe_pixels_filled')}")

# --- summary ---
n_pass = sum(1 for _, c, _ in results if c)
print(f"\n{n_pass}/{len(results)} checks passed")
sys.exit(0 if n_pass == len(results) else 1)
