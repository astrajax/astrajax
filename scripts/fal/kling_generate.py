#!/usr/bin/env python3
"""Generate a video from a start and end frame via fal.ai Kling Video (v2.6/v3 Pro).

Sibling to flf_generate.py (Veo 3.1 FLF) — same fal queue protocol, DIFFERENT
param names. Verified 16 Jul 2026 against fal.ai's live docs:
  Model ID: fal-ai/kling-video/v2.6/pro/image-to-video (or v3/pro, no /o1, no "O3")
  Params:  prompt, start_image_url (required), end_image_url (optional — the
           first/last-frame path), duration (seconds, default "5"),
           generate_audio (default TRUE — force False for the silent bank),
           negative_prompt.
  No resolution enum (unlike Veo) — output res is fixed by the model tier.
  Pricing (v2.6 Pro): $0.07/s silent -> 8s = $0.56/clip. v3 Pro: $0.112/s -> $0.90.

Usage:
  python3 kling_generate.py --prompt "..." --start-url URL --end-url URL \
      --out clip.mp4 [--duration 8] [--model fal-ai/kling-video/v2.6/pro/image-to-video]
"""
import argparse, json, os, sys, time
import requests

QUEUE = "https://queue.fal.run"
DEFAULT_MODEL = "fal-ai/kling-video/v2.6/pro/image-to-video"


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
    ap.add_argument("--start-url", default=None)
    ap.add_argument("--end-url", default=None, help="omit for start-image-only animation")
    ap.add_argument("--start-file", default=None)
    ap.add_argument("--end-file", default=None)
    ap.add_argument("--out", required=True)
    ap.add_argument("--duration", default="8", help="seconds, model-dependent enum — check schema")
    ap.add_argument("--negative", default="blur, distort, low quality, page turning, pages moving, paw movement, hand gestures, fidgeting, camera movement, camera pan, camera zoom, reframing, room changes, furniture moving, style change, morphing background")
    ap.add_argument("--model", default=DEFAULT_MODEL)
    ap.add_argument("--timeout-min", type=int, default=20)
    args = ap.parse_args()

    start_url = args.start_url or (args.start_file and _as_frame_url(args.start_file))
    end_url = args.end_url or (args.end_file and _as_frame_url(args.end_file))
    if not start_url:
        die("Provide --start-url or --start-file.")
    args.start_url = start_url
    args.end_url = end_url

    key = os.environ.get("FAL_KEY")
    if not key:
        die("FAL_KEY not set. Export FAL_KEY in your shell (Cursor) or inject via RunWithCredentials (Hyperagent).")

    headers = {"Authorization": f"Key {key}", "Content-Type": "application/json"}
    payload = {
        "prompt": args.prompt,
        "start_image_url": args.start_url,
        "duration": args.duration,
        "generate_audio": False,
        "negative_prompt": args.negative,
    }
    if args.end_url:
        payload["end_image_url"] = args.end_url

    print(f"[submit] {args.model} duration={args.duration}s end_frame={'yes' if args.end_url else 'no'}")
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
