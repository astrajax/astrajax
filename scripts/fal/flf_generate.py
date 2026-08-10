#!/usr/bin/env python3
"""Generate a video from a FIRST and LAST frame via fal.ai (Veo 3.1 FLF).

House use: Clive talking-portrait state bank probes.
  - Hold loop:   first == last == the contact still  (seamless by construction)
  - Transition:  first == still A, last == still B   (pose-to-pose interpolation)

Auth: FAL_KEY env var (injected by RunWithCredentials).
Protocol: fal queue API (submit -> poll -> fetch result -> download).
Schema verified 16 Jul 2026 against https://fal.ai/models/fal-ai/veo3.1/first-last-frame-to-video/api

Usage:
  python3 flf_generate.py --prompt "..." --first-url URL --last-url URL \
      --out clip.mp4 [--duration 8s] [--resolution 1080p] [--seed N] \
      [--negative "..."] [--model fal-ai/veo3.1/first-last-frame-to-video]

Cost note (fal pricing, Jul 2026): $0.20/s silent at 720p/1080p -> 8s = $1.60.
generate_audio is forced FALSE (the bank is silent; audio doubles the price).
"""
import argparse, json, os, sys, time
import requests

QUEUE = "https://queue.fal.run"
DEFAULT_MODEL = "fal-ai/veo3.1/first-last-frame-to-video"


def die(msg, code=1):
    print(f"ERROR: {msg}", file=sys.stderr)
    sys.exit(code)

def _as_frame_url(value: str) -> str:
    """Accept http(s)/data URL or local path (→ data URI, ≤8MB)."""
    import base64, mimetypes
    from pathlib import Path
    if value.startswith(("http://", "https://", "data:")):
        return value
    path = Path(value).expanduser().resolve()
    if not path.is_file():
        die(f"Still not found: {path}")
    size = path.stat().st_size
    if size > 8 * 1024 * 1024:
        die(f"{path} is {size/1e6:.1f} MB — fal inputs must be ≤8MB.")
    mime = mimetypes.guess_type(path.name)[0] or "image/png"
    return f"data:{mime};base64," + base64.b64encode(path.read_bytes()).decode("ascii")



def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--prompt", required=True)
    ap.add_argument("--first-url", default=None)
    ap.add_argument("--last-url", default=None)
    ap.add_argument("--first-file", default=None, help="Local still path (alt to --first-url)")
    ap.add_argument("--last-file", default=None, help="Local still path (alt to --last-url)")
    ap.add_argument("--out", required=True)
    ap.add_argument("--duration", default="8s", choices=["4s", "6s", "8s"])
    ap.add_argument("--resolution", default="1080p", choices=["720p", "1080p", "4k"])
    ap.add_argument("--negative", default="camera movement, camera pan, camera zoom, reframing, room changes, furniture moving, style change, morphing background")
    ap.add_argument("--seed", type=int, default=None)
    ap.add_argument("--model", default=DEFAULT_MODEL)
    ap.add_argument("--timeout-min", type=int, default=20)
    args = ap.parse_args()

    first_url = args.first_url or (args.first_file and _as_frame_url(args.first_file))
    last_url = args.last_url or (args.last_file and _as_frame_url(args.last_file))
    if not first_url or not last_url:
        die("Provide --first-url/--last-url or --first-file/--last-file.")
    args.first_url, args.last_url = first_url, last_url

    key = os.environ.get("FAL_KEY")
    if not key:
        die("FAL_KEY not set. Export FAL_KEY in your shell (Cursor) or inject via RunWithCredentials (Hyperagent).")

    headers = {"Authorization": f"Key {key}", "Content-Type": "application/json"}
    payload = {
        "prompt": args.prompt,
        "first_frame_url": args.first_url,
        "last_frame_url": args.last_url,
        "duration": args.duration,
        "resolution": args.resolution,
        "aspect_ratio": "16:9",
        "generate_audio": False,
        "negative_prompt": args.negative,
    }
    if args.seed is not None:
        payload["seed"] = args.seed

    print(f"[submit] {args.model} duration={args.duration} res={args.resolution}")
    r = requests.post(f"{QUEUE}/{args.model}", headers=headers, json=payload, timeout=60)
    if r.status_code == 401:
        die("401 Unauthorized — check the FAL_KEY.")
    if r.status_code == 402:
        die("402 Payment required — the fal.ai account has no credit.")
    if r.status_code >= 400:
        die(f"Submit failed {r.status_code}: {r.text[:500]}")
    sub = r.json()
    req_id = sub.get("request_id")
    status_url = sub.get("status_url") or f"{QUEUE}/{args.model}/requests/{req_id}/status"
    response_url = sub.get("response_url") or f"{QUEUE}/{args.model}/requests/{req_id}"
    print(f"[queued] request_id={req_id}")

    deadline = time.time() + args.timeout_min * 60
    last_status = None
    while time.time() < deadline:
        s = requests.get(status_url + "?logs=1", headers=headers, timeout=30)
        if s.status_code >= 400:
            die(f"Status poll failed {s.status_code}: {s.text[:300]}")
        st = s.json()
        status = st.get("status")
        if status != last_status:
            print(f"[status] {status}")
            last_status = status
        for log in st.get("logs") or []:
            m = log.get("message")
            if m:
                print(f"  | {m}")
        if status == "COMPLETED":
            break
        if status in ("FAILED", "CANCELLED", "ERROR"):
            die(f"Generation {status}: {json.dumps(st)[:500]}")
        time.sleep(6)
    else:
        die(f"Timed out after {args.timeout_min} min (request_id={req_id} — it may still complete; re-poll {response_url}).")

    res = requests.get(response_url, headers=headers, timeout=60)
    if res.status_code >= 400:
        die(f"Result fetch failed {res.status_code}: {res.text[:300]}")
    video = (res.json() or {}).get("video") or {}
    url = video.get("url")
    if not url:
        die(f"No video.url in result: {json.dumps(res.json())[:500]}")

    print(f"[download] {url}")
    with requests.get(url, stream=True, timeout=300) as dl:
        dl.raise_for_status()
        os.makedirs(os.path.dirname(os.path.abspath(args.out)) or ".", exist_ok=True)
        with open(args.out, "wb") as f:
            for chunk in dl.iter_content(1 << 16):
                f.write(chunk)
    size = os.path.getsize(args.out)
    print(f"[done] {args.out} ({size/1e6:.1f} MB)")
    print(json.dumps({"request_id": req_id, "out": args.out, "bytes": size}))


if __name__ == "__main__":
    main()
