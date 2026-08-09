#!/usr/bin/env python3
"""
fal_image_edit.py -- instruction-anchored image editing (FLUX Kontext) and
brushwork-preserving 4x upscaling (AuraSR) via the fal.ai queue protocol.

Two subcommands:

  edit     FLUX Kontext instruction edit (default model fal-ai/flux-pro/kontext/max).
           Verified schema: {prompt, image_url, output_format, num_images,
           guidance_scale?, seed?} -> {images: [{url, width, height, content_type}]}.
           ~21s. Output is ~1MP regardless of input size, and aspect ratio can
           snap slightly (e.g. 1.792 in -> 1.851 out).

  upscale  AuraSR GAN 4x upscale (default model fal-ai/aura-sr).
           Verified schema: {image_url, upscaling_factor: 4} -> {image: {url}}.
           ~21s. 1392x752 -> 5568x3008 (~24MB PNG). GAN upscaling preserves
           painterly brushwork where diffusion upscalers repaint it.

Queue protocol (shared with the fal-first-last-frame-video skill), including
the nested-path lesson: STATUS and RESULT endpoints use only the APP-LEVEL
PREFIX (first two path segments), never the full submission path (405 if you do).

Usage:
  python3 fal_image_edit.py edit --prompt "..." --image-url URL --out edited.png \
      [--model fal-ai/flux-pro/kontext/max] [--guidance 3.5] [--seed N] [--timeout 240]
  python3 fal_image_edit.py upscale --image-url URL --out big.png \
      [--model fal-ai/aura-sr] [--factor 4] [--timeout 240]

Requires FAL_KEY in the environment (RunWithCredentials injects it).
Input images must be publicly fetchable URLs: for thread files use
GenerateTempExternalDownloadUrl (4h signed URL), stash it to a file and pass
via "$(cat url.txt)" (too long for inline shell), then revoke after the run.

422 responses carry pydantic-style validation detail and are surfaced
verbatim: that is the schema probe for any new fal model.
"""
import argparse, json, os, sys, time, urllib.request, urllib.error

QUEUE = "https://queue.fal.run"

def req(url, method="GET", payload=None, key=None):
    data = json.dumps(payload).encode() if payload is not None else None
    r = urllib.request.Request(url, data=data, method=method)
    r.add_header("Authorization", f"Key {key}")
    if payload is not None:
        r.add_header("Content-Type", "application/json")
    try:
        with urllib.request.urlopen(r, timeout=60) as resp:
            return resp.status, json.loads(resp.read().decode())
    except urllib.error.HTTPError as e:
        body = e.read().decode(errors="replace")
        try:
            return e.code, json.loads(body)
        except Exception:
            return e.code, {"_raw": body}

def app_prefix(model_id):
    parts = model_id.strip("/").split("/")
    return "/".join(parts[:2])  # e.g. fal-ai/flux-pro

def run(model, payload, out_path, timeout):
    key = os.environ.get("FAL_KEY")
    if not key:
        print(json.dumps({"success": False, "error": "FAL_KEY not set -- run via RunWithCredentials"}))
        sys.exit(1)

    code, sub = req(f"{QUEUE}/{model}", "POST", payload, key)
    if code == 401:
        print(json.dumps({"success": False, "error": "401 bad FAL_KEY"})); sys.exit(1)
    if code == 402:
        print(json.dumps({"success": False, "error": "402 no credit on fal account"})); sys.exit(1)
    if code == 422:
        # Schema probe result: surface the validation detail verbatim so the
        # caller can correct field names without guessing.
        print(json.dumps({"success": False, "error": "422 validation", "detail": sub}, indent=2))
        sys.exit(1)
    if code not in (200, 201) or "request_id" not in sub:
        print(json.dumps({"success": False, "error": f"submit HTTP {code}", "detail": sub}, indent=2))
        sys.exit(1)

    rid = sub["request_id"]
    prefix = app_prefix(model)
    print(f"submitted request_id={rid} (app prefix {prefix})", flush=True)

    t0 = time.time()
    while True:
        if time.time() - t0 > timeout:
            print(json.dumps({"success": False, "error": "poll timeout",
                              "request_id": rid, "model_prefix": prefix,
                              "resume": f"re-poll {QUEUE}/{prefix}/requests/{rid}/status"}))
            sys.exit(1)
        code, st = req(f"{QUEUE}/{prefix}/requests/{rid}/status", key=key)
        status = st.get("status", f"HTTP {code}")
        print(f"  [{int(time.time()-t0):3d}s] {status}", flush=True)
        if status == "COMPLETED":
            break
        if status in ("FAILED", "ERROR"):
            print(json.dumps({"success": False, "error": "generation failed", "detail": st}, indent=2))
            sys.exit(1)
        time.sleep(3)

    code, res = req(f"{QUEUE}/{prefix}/requests/{rid}", key=key)
    # Handle both result shapes: {images: [...]} (Kontext) and {image: {...}} (AuraSR).
    imgs = res.get("images") or ([res["image"]] if "image" in res else [])
    if not imgs:
        print(json.dumps({"success": False, "error": "no images in result", "detail": res}, indent=2))
        sys.exit(1)
    url = imgs[0].get("url")
    with urllib.request.urlopen(url, timeout=120) as r, open(out_path, "wb") as f:
        f.write(r.read())
    size = os.path.getsize(out_path)
    meta = {k: imgs[0].get(k) for k in ("width", "height", "content_type") if k in imgs[0]}
    print(json.dumps({"success": True, "out": out_path, "bytes": size,
                      "meta": meta, "request_id": rid}))

def main():
    ap = argparse.ArgumentParser(description="fal.ai image editing and upscaling")
    sub = ap.add_subparsers(dest="cmd", required=True)

    e = sub.add_parser("edit", help="FLUX Kontext instruction edit")
    e.add_argument("--model", default="fal-ai/flux-pro/kontext/max")
    e.add_argument("--prompt", required=True)
    e.add_argument("--image-url", required=True)
    e.add_argument("--out", required=True)
    e.add_argument("--guidance", type=float, default=None)
    e.add_argument("--seed", type=int, default=None)
    e.add_argument("--timeout", type=int, default=240)

    u = sub.add_parser("upscale", help="AuraSR GAN 4x upscale")
    u.add_argument("--model", default="fal-ai/aura-sr")
    u.add_argument("--image-url", required=True)
    u.add_argument("--out", required=True)
    u.add_argument("--factor", type=int, default=4)
    u.add_argument("--timeout", type=int, default=240)

    args = ap.parse_args()

    if args.cmd == "edit":
        payload = {"prompt": args.prompt, "image_url": args.image_url,
                   "output_format": "png", "num_images": 1}
        if args.guidance is not None:
            payload["guidance_scale"] = args.guidance
        if args.seed is not None:
            payload["seed"] = args.seed
    else:
        payload = {"image_url": args.image_url, "upscaling_factor": args.factor}

    run(args.model, payload, args.out, args.timeout)

if __name__ == "__main__":
    main()
