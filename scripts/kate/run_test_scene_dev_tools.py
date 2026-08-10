#!/usr/bin/env python3
"""Self-test for scene-dev-tools: proves the pr_evidence before/after composition
(side-by-side + diff heatmap + self-contained slider), that capture gives clean
guidance when Playwright is absent, and (via Node) that the hotspot editor's
coordinate core is correct."""
import json
import subprocess
import sys
from pathlib import Path

from PIL import Image, ImageDraw

HERE = Path(__file__).parent
T = HERE / "_test"
T.mkdir(exist_ok=True)
PY = [sys.executable, str(HERE / "pr_evidence.py")]
results = []


def expect(label, cond, detail=""):
    results.append((label, cond))
    print(f"  [{'PASS' if cond else 'FAIL'}] {label}  {detail}")


def run(args):
    r = subprocess.run(PY + args, capture_output=True, text=True)
    out = r.stdout.strip()
    try:
        payload = json.loads(out) if out.startswith("{") else {}
    except json.JSONDecodeError:
        payload = {}
    return r.returncode, payload, r.stdout + r.stderr


# --- fixtures: a before frame and an after frame with a change ---
W, H = 400, 300
before = Image.new("RGB", (W, H))
px = before.load()
for y in range(H):
    for x in range(W):
        px[x, y] = (30 + x * 120 // W, 40 + y * 100 // H, 60)
before.save(T / "before.png")
after = before.copy()
d = ImageDraw.Draw(after)
d.rectangle([250, 60, 360, 170], fill=(217, 117, 69))  # the "change"
after.save(T / "after.png")

# --- compose ---
rc, p, log = run(["compose", "--before", str(T / "before.png"), "--after", str(T / "after.png"),
                  "--out", str(T / "side.png"), "--diff", str(T / "diff.png"),
                  "--slider", str(T / "slider.html"), "--label-a", "main", "--label-b", "kate/branch"])
side_ok = Path(T / "side.png").exists()
if side_ok:
    sw, sh = Image.open(T / "side.png").size
else:
    sw = sh = 0
expect("compose wrote side-by-side at 2x width", rc == 0 and sw == W * 2 + 12,
       f"{sw}x{sh}")
expect("compose diff heatmap flags the change",
       Path(T / "diff.png").exists() and p.get("changed_fraction", 0) > 0,
       f"changed={p.get('changed_fraction')}")
slider_txt = (T / "slider.html").read_text() if Path(T / "slider.html").exists() else ""
expect("slider html is self-contained (2 embedded frames)",
       slider_txt.count("data:image/png;base64,") == 2)

# --- capture without playwright: clean guidance, not a crash ---
rc, p, log = run(["capture", "--url", "http://example.com", "--routes", "/"])
expect("capture guides cleanly when Playwright is absent",
       rc == 2 and p.get("ok") is False and "playwright" in json.dumps(p).lower())

# --- node: editor coordinate core ---
node = subprocess.run(["node", str(HERE / "test_editor_core.mjs")], capture_output=True, text=True)
print(node.stdout.strip())
expect("hotspot editor coordinate core passes (Node)", node.returncode == 0)

n_pass = sum(1 for _, c in results if c)
print(f"\n{n_pass}/{len(results)} checks passed")
sys.exit(0 if n_pass == len(results) else 1)
