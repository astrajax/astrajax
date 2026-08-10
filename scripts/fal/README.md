# fal previz (Cursor)

Thin path for AstraJax first/last-frame video without Hyperagent chat credits.

## Setup

```bash
export FAL_KEY=...   # https://fal.ai/dashboard/keys
# optional deps for generate / gate
pip install requests numpy Pillow
# ffmpeg on PATH for flf_gate.py --conform
```

## Generate a hold loop

```bash
python3 scripts/fal/previz.py \
  --still path/to/contact.png \
  --prompt "Static camera. ..." \
  --engine kling \
  --out brand/.previz/name.mp4
```

- `--engine kling` (default): silent holds, cheaper, tight seams
- `--engine veo`: Veo 3.1 first-last-frame
- Local stills ≤8MB (data URI). Larger masters: downsample first.

## Gate / conform

```bash
python3 scripts/fal/flf_gate.py \
  --clip brand/.previz/name.mp4 \
  --first-still path/to/contact.png \
  --last-still path/to/contact.png \
  --outdir brand/.previz/gate-name \
  --seam --conform
```

## Agent

`@milo-cadence` loads the craft + fal skills. Every clip is **rough previz, not final art.**
