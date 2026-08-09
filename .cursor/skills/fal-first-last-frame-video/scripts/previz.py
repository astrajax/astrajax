#!/usr/bin/env python3
"""Cursor-native fal previz: local stills → first/last-frame video → brand/.previz/.

Requires FAL_KEY. Prefer Kling for silent holds (cheaper, tight seams); Veo for FLF.

Examples:
  python3 scripts/fal/previz.py \\
    --still path/to/contact.png \\
    --prompt "Static camera. Oil painting breathes only in the face..." \\
    --engine kling \\
    --out brand/.previz/foo-hold.mp4

Always: Rough motion previz — not final art.
"""
from __future__ import annotations

import argparse
import os
import subprocess
import sys
from pathlib import Path

SCRIPTS = Path(__file__).resolve().parent
REPO_ROOT = SCRIPTS.parents[1]
DEFAULT_OUT_DIR = REPO_ROOT / "brand" / ".previz"

STILLNESS_NEGATIVE = (
    "camera movement, camera pan, camera zoom, reframing, room changes, "
    "furniture moving, style change, morphing background, page turning, "
    "pages moving, paw movement, hand gestures, fidgeting"
)


def die(msg: str, code: int = 1) -> None:
    print(f"ERROR: {msg}", file=sys.stderr)
    sys.exit(code)


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--still", help="Hold loop: same still as first and last.")
    ap.add_argument("--first", help="First-frame path or URL.")
    ap.add_argument("--last", help="Last-frame path or URL.")
    ap.add_argument("--prompt", required=True)
    ap.add_argument("--out")
    ap.add_argument("--engine", choices=("veo", "kling"), default="kling")
    ap.add_argument("--duration", default=None)
    ap.add_argument("--resolution", default="1080p", choices=("720p", "1080p", "4k"))
    ap.add_argument("--negative", default=STILLNESS_NEGATIVE)
    ap.add_argument("--seed", type=int, default=None)
    args = ap.parse_args()

    if not os.environ.get("FAL_KEY"):
        die(
            "FAL_KEY not set. Export it in your shell "
            "(e.g. export FAL_KEY=... in ~/.zshrc) so Cursor can inherit it."
        )

    if args.still:
        first = last = args.still
        stem = Path(args.still).stem
    else:
        if not args.first or not args.last:
            die("Provide --still for a hold, or both --first and --last.")
        first, last = args.first, args.last
        stem = f"{Path(args.first).stem}-to-{Path(args.last).stem}"

    out = Path(args.out) if args.out else DEFAULT_OUT_DIR / f"{stem}-{args.engine}.mp4"
    if not out.is_absolute():
        out = (Path.cwd() / out).resolve()
    out.parent.mkdir(parents=True, exist_ok=True)

    def is_url(v: str) -> bool:
        return v.startswith(("http://", "https://", "data:"))

    print(f"[previz] engine={args.engine} out={out}")
    print("[previz] Rough motion previz — not final art.")

    if args.engine == "veo":
        duration = args.duration or "8s"
        cmd = [
            sys.executable, str(SCRIPTS / "flf_generate.py"),
            "--prompt", args.prompt,
            "--out", str(out),
            "--duration", duration,
            "--resolution", args.resolution,
            "--negative", args.negative,
        ]
        cmd += ["--first-url", first] if is_url(first) else ["--first-file", first]
        cmd += ["--last-url", last] if is_url(last) else ["--last-file", last]
        if args.seed is not None:
            cmd += ["--seed", str(args.seed)]
    else:
        duration = args.duration or "10"
        cmd = [
            sys.executable, str(SCRIPTS / "kling_generate.py"),
            "--prompt", args.prompt,
            "--out", str(out),
            "--duration", str(duration),
            "--negative", args.negative,
        ]
        cmd += ["--start-url", first] if is_url(first) else ["--start-file", first]
        cmd += ["--end-url", last] if is_url(last) else ["--end-file", last]

    raise SystemExit(subprocess.call(cmd))


if __name__ == "__main__":
    main()
