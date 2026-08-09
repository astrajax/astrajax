#!/usr/bin/env python3
"""Resume-poll an already-submitted fal.ai queue request and download the result.
For when generation outlives a single RunWithCredentials call (Kling ran long)."""
import argparse, json, os, sys, time
import requests

QUEUE = "https://queue.fal.run"


def die(msg):
    print(f"ERROR: {msg}", file=sys.stderr)
    sys.exit(1)


ap = argparse.ArgumentParser()
ap.add_argument("--model", required=True)
ap.add_argument("--request-id", required=True)
ap.add_argument("--out", required=True)
ap.add_argument("--timeout-min", type=int, default=15)
args = ap.parse_args()

key = os.environ.get("FAL_KEY")
if not key:
    die("FAL_KEY not set.")
headers = {"Authorization": f"Key {key}"}
status_url = f"{QUEUE}/{args.model}/requests/{args.request_id}/status"
response_url = f"{QUEUE}/{args.model}/requests/{args.request_id}"

deadline = time.time() + args.timeout_min * 60
last = None
while time.time() < deadline:
    s = requests.get(status_url + "?logs=1", headers=headers, timeout=30)
    if s.status_code >= 400:
        die(f"status {s.status_code}: {s.text[:300]}")
    st = s.json()
    status = st.get("status")
    if status != last:
        print(f"[status] {status}", flush=True)
        last = status
    for log in st.get("logs") or []:
        m = log.get("message")
        if m:
            print(f"  | {m}", flush=True)
    if status == "COMPLETED":
        break
    if status in ("FAILED", "CANCELLED", "ERROR"):
        die(f"Generation {status}: {json.dumps(st)[:500]}")
    time.sleep(8)
else:
    die(f"Still not done after {args.timeout_min} min. Re-run this poller again.")

res = requests.get(response_url, headers=headers, timeout=60)
if res.status_code >= 400:
    die(f"result fetch {res.status_code}: {res.text[:300]}")
video = (res.json() or {}).get("video") or {}
url = video.get("url")
if not url:
    die(f"no video.url: {json.dumps(res.json())[:500]}")
print(f"[download] {url}", flush=True)
with requests.get(url, stream=True, timeout=300) as dl:
    dl.raise_for_status()
    with open(args.out, "wb") as f:
        for chunk in dl.iter_content(1 << 16):
            f.write(chunk)
size = os.path.getsize(args.out)
print(f"[done] {args.out} ({size/1e6:.1f} MB)", flush=True)
