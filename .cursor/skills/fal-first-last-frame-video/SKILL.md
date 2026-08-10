---
name: fal-first-last-frame-video
description: >-
  Generate and gate AstraJax first/last-frame video previz via fal.ai (Veo 3.1 FLF or
  Kling). Requires FAL_KEY. Use for living-painting holds, pose transitions, and
  Cursor creative sessions that must not burn Hyperagent credits on chat.
---

# fal-first-last-frame-video

True first+last-frame video generation via fal.ai, plus the house registration gate. Created 16 Jul 2026 for the Clive talking-portrait state bank (Track B probes), after the HA GenerateVideo wrapper was confirmed to reject `lastFrameImage` on all paths.

**STATUS: SHAKEDOWN COMPLETE (16 Jul 2026).** Both scripts ran clean on the first keyed run. Two probes rendered (reading hold + welcome transition, 8s silent 1080p, $1.60 each), gated, and delivered. Lessons from the shakedown are baked into flf_gate.py — read "Shakedown lessons" below before trusting numbers from any older copy.

## Credentials
- `FAL_KEY` — fal.ai API key (dashboard → Keys). In Cursor: export in your shell. In Hyperagent: inject via RunWithCredentials.

## Cursor runtime (primary for creative sessions)

Hyperagent `RunWithCredentials` is optional here. In Cursor. Motion briefs and engine
choice for character work sit with `@milo-cadence` / skill `milo-cadence`; this skill owns
the fal generate + gate mechanics. One pipeline — do not invent a parallel stack.

**Portrait / hold loop discipline:** for seamless zero-drift loops, pin first and last
frame to the **same** approved contact still (`previz.py --still`, or identical first/last).
That dual-anchor is the standing method. New fal models (e.g. scouted MiniMax H3 paths)
stay trial-only until Matthew greenlights a probe and a live endpoint is verified here or
in `scripts/fal/` — never invent model IDs from scout notes.

1. Set `FAL_KEY` in the shell environment Cursor inherits.
2. Prefer the thin wrapper:

```bash
python3 scripts/fal/previz.py \
  --still path/to/contact.png \
  --prompt "..." \
  --engine kling \
  --out brand/.previz/name.mp4
```

3. Scripts live in `scripts/fal/` (and mirrored under this skill's `scripts/`).
4. Local stills are sent as data URIs (≤8MB). Larger masters must be downsampled first.
5. Default drop folder: `brand/.previz/` (gitignored outputs).
6. Label every clip: **Rough motion previz — not final art.**

Dependencies: `python3`, `requests` (generate scripts), and for gating `numpy` + `Pillow` + `ffmpeg`.


## Model contract (verified 16 Jul 2026)
- Model ID: `fal-ai/veo3.1/first-last-frame-to-video`
- Queue submit: `POST https://queue.fal.run/{model_id}` with `Authorization: Key $FAL_KEY`
- Required: `prompt`, `first_frame_url`, `last_frame_url` (hosted URLs or base64 data URIs, ≤8MB each)
- Options: `duration` "4s"|"6s"|"8s" · `resolution` "720p"|"1080p"|"4k" · `aspect_ratio` "16:9"|"9:16" · `generate_audio` (FORCE FALSE — silent bank, audio doubles cost) · `negative_prompt` · `seed` · `safety_tolerance`
- Output: `{video: {url}}`
- Observed render time: ~2-2.5 min per 8s 1080p clip.
- Pricing (Jul 2026): $0.20/s silent at 720p/1080p → 8s = $1.60/clip; 4K $0.40/s.

## Shakedown lessons (16 Jul 2026 — the important part)
1. **Veo center-crops non-16:9 conditioning inputs.** The bank plates are 2752×1536 (1.792:1); Veo renders true 16:9 and center-crops the input (~10px each side). CONSEQUENCE A: the gate must center-crop the still to the clip's aspect before comparing (flf_gate.py now does this automatically; naive comparison false-FAILs at ~0.69 outside-SSIM). CONSEQUENCE B: a bank mixing 1.792 stills with 16:9 clips will misregister at runtime cuts — standardize the bank on 2731×1536 center-crops before production motion work.
2. **Compare at the clip's resolution** — downscale the still, never upscale the frame (resampling blur tanks SSIM).
3. **Recalibrated clip bars** (provisional, pending Matthew+Kate ratification; measured against an x264-crf18 codec floor of ~0.997): outside-region SSIM ≥0.95 AND drift(>15) ≤1.0%. First probe pair measured 0.9587–0.9694 outside, drift 0.42–0.74%. The still-vs-still bar (0.985/0.3%) applies only to same-pipeline native-res comparisons. Bars move only by joint decision, never silently.
4. **Dual-anchoring works.** Hold loop (first=last=still) seam measured 0.9832 first-vs-last frame; one-directional generation (the HA wrapper path) measured 0.336. This is the whole reason the skill exists.
5. Residual clip-vs-still difference concentrates in generative brushwork shimmer on fur/tweed and the directed motion (fire flicker, breathing, page-worry) — texture noise, not geometry. Watch-item: facial texture shimmer around the eyes at cut boundaries; judge by eye at runtime.

## Image hosting for the stills
Thread files aren't public. Generate 4-hour signed URLs with `GenerateTempExternalDownloadUrl({fileId})`, stash them to files (they're ~1.7KB), and pass with `--first-url "$(cat url.txt)"`. Revoke after the run.

## Scripts
### flf_generate.py — submit, poll, download
```
python3 flf_generate.py --prompt "..." --first-url URL --last-url URL \
  --out clip.mp4 [--duration 8s] [--resolution 1080p] [--seed N] [--negative "..."]
```
Queue protocol with status logs; clear errors for 401 (bad key) / 402 (no credit). Prints a JSON result line. Holds: first-url == last-url == the contact still. Transitions: first = still A, last = still B.

### flf_gate.py — registration gate + seam + conform
```
python3 flf_gate.py --clip clip.mp4 --first-still a.png --last-still b.png \
  --outdir gate-out [--seam] [--conform] [--duration 8.0] [--fps 24] [--extra-mask 350,2110,1050]
```
Auto center-crops stills to the clip aspect (reports `aspect_handling`), compares at clip resolution. Outside-region SSIM = HARD gate (default bars 0.95/1.0% per recalibration); full-frame = advisory, eyes decide. `--seam` measures loop closure (clip first vs last frame). `--conform` renders CFR 24fps 1920×1080 silent exact-duration MP4 + frame-zero poster. Default mask = Clive+book region in 2752×1536 still space (`560,2110,150`), auto-transformed through crop+scale; add `--extra-mask 350,2110,1050` for poses that move the book (presenting).

## Prompt pattern that held (both probes)
Static camera declared twice (start and end of prompt); name what must NOT change (room enumeration, "the painting's brushwork and colours stay exactly constant"); direct the micro-motion explicitly (breathing, eye movement along lines, page-worry, firelight flicker); register line ("an oil painting breathing"). Default negative prompt in the script covers camera moves/reframing/room changes/morphing.

## Gate policy (Kate's bench)
Outside-region bar is hard. Full-frame endpoint fidelity is reported, not gated — eyes decide, and the numbers come back to Matthew+Kate for any bar change. Passing clips get conformed to the bank spec and posters extracted; runtime posters come FROM conformed clips, never from the source stills (crop parity).

## Fallback models (same fal key, same queue protocol, different param names — verify schema before use)
Kling v2.6 Pro (see probe result below) and Wan FLF2V are hosted on fal; probe those if Veo 3.1 FLF disappoints on painterly subtlety.

## MOTION REGISTER — OWN THE STILLNESS (Matthew, 16 Jul 2026; supersedes any page-worry direction above)

Standing law for all talking-portrait motion, ratified after the v2 stillness probe:
- **The pages of the book NEVER turn or stir. No prop business of any kind.** Page-worry, prop fidgets, and hand gestures are cut — "it's just business."
- **Paws rest completely still** unless a pose's own gesture IS the beat (bashful's wave-off, qualm's half-raise — and even then, held, not fidgeting).
- **The motion budget belongs to the head, the face, and breath**: eye movement, blinks, brow changes, the breathing rise and fall. He is interesting enough there.
- **Ambient life is light only**: firelight flicker, candle shimmer, steady lamp. The room never moves.

Measured consequence (v1 page-worry vs v2 stillness, temporal stddev at 960×540): paw+book 5.37→3.84, face 11.04→14.90, shelves 0.89→0.89. Banning business doesn't deaden the clip — it reallocates the model's motion budget into the face. Name what must not move, and direct where the life should go.

**Revised standing probe prompt (the one that passed, v2):** "A painted Victorian study, completely static camera. The golden retriever gentleman in tweed reads, head bowed over the open book on the desk. The ONLY movement is in his head and face: his eyes travel slowly along the lines of the page; a slow blink; the faintest breathing rise and fall. His paws rest completely still — the paw on the book never moves. The book lies perfectly still and its pages NEVER turn or stir. Firelight from the right flickers gently; the green banker's lamp glows steady on the left. Nothing else in the room moves; the painting's brushwork and colours stay exactly constant. Deeply still, weighted, serene — an oil painting that breathes only in the face. He never looks up."

**Extended negative prompt for holds:** add "page turning, pages moving, paw movement, hand gestures, fidgeting" to the standard set. v2 gate: PASS (0.9697/0.9636 outside, drift 0.41/0.67%, seam 0.9839).

## CORRECTION (16 Jul 2026): "Kling O3 Pro" does not exist

The earlier fallback note naming "Kling O3 Pro" was wrong — a conflated/hallucinated model name. Verified against fal.ai's live catalog, the real Kling options are:

- `fal-ai/kling-video/v2.6/pro/image-to-video` — params: `prompt`, `start_image_url` (required), `end_image_url` (optional, this is the first/last-frame path), `duration`, `generate_audio` (default true — SET FALSE for the silent bank), `negative_prompt`. Pricing: $0.07/s silent (8s ≈ $0.56), $0.14/s with audio.
- `fal-ai/kling-video/v3/pro/image-to-video` — same shape, adds 4K output, multi-shot, and `elements` (character/object locking). $0.112/s silent. Irrelevant extras for a single held pose; v2.6 Pro is the right probe target.

Same queue protocol as Veo FLF (submit/poll/fetch), different param names (`start_image_url`/`end_image_url` vs `first_frame_url`/`last_frame_url`, no `resolution` enum — check current schema before scripting, this file has not yet been extended with a Kling wrapper). Wan FLF2V remains unverified — check its fal schema before use too.

## KLING PROBE RESULT (16 Jul 2026) — verdict and a working wrapper

Ran the stillness-register reading hold on Kling v2.6 Pro (start_image_url = end_image_url = the reading still, generate_audio forced false). Result: **PASS, and arguably the stronger take.**

- **Duration enum is strict**: "5" or "10" only (not an arbitrary integer like Veo). Used 10s.
- **No resolution parameter** — output came back 1928×1072 (close to but not exactly 16:9). The conform step in flf_gate.py force-scales to 1920×1080 regardless, so this is a non-issue downstream, but don't expect a clean native 1080p frame.
- **Gate: PASS.** Outside-region SSIM 0.9673 (first) / 0.9717 (last), drift 0.62%/0.39% — comparable to Veo's best stillness take.
- **Seam (loop closure): 0.9926** — tighter than any Veo take so far (Veo's stillness v2/v3 measured 0.9826–0.9839). Kling's dual-anchoring closes the loop more precisely.
- **Page-turning compliance: verified by frame-by-frame inspection across the full 10s (7 sample points, not just endpoints) — the book and paw never moved.** Same page, same paw position, throughout. This is the exact thing Matthew asked to check, and it held.
- **Head-bow compliance: also held** — consistent downward reading angle across the timeline, no lift to camera. (First-look at a single mid-clip frame briefly read as "head up" — a bad crop/viewing-scale misjudgement, corrected by sampling the full timeline. Lesson: judge compliance from a timeline strip, never a single frame.)
- **Cost:** $0.07/s silent × 10s = **$0.70** (cheaper than Veo's 8s/$1.60).

### The queue URL quirk that cost real debugging time
For a nested multi-segment model ID like `fal-ai/kling-video/v2.6/pro/image-to-video`, the STATUS and RESULT queue endpoints do NOT repeat the full submission path. They use only the app-level prefix:
- Submit: `POST https://queue.fal.run/fal-ai/kling-video/v2.6/pro/image-to-video` (full path)
- Status: `GET https://queue.fal.run/fal-ai/kling-video/requests/{request_id}/status` (app-level prefix ONLY — "v2.6/pro/image-to-video" dropped)
- Result: `GET https://queue.fal.run/fal-ai/kling-video/requests/{request_id}` (same)

Using the full submission path for status/result returns 405 Method Not Allowed. This did NOT come up with Veo because `fal-ai/veo3.1/first-last-frame-to-video` is already a "short" 3-segment ID that happens to equal its own app prefix. Any new nested-path fal model should test this before assuming the Veo pattern holds.

### Kling generation is slow — poll asynchronously
A single RunWithCredentials call appears to have a ~5 minute wall-clock ceiling; Kling's 10s render did not complete within one call (Veo's 8s render at ~2.5 min did). Use `kling_generate.py` to submit (cheap, returns fast with a request_id), then `poll_and_download.py --model fal-ai/kling-video --request-id ID --out clip.mp4` in a follow-up call to resume polling without resubmitting (avoids double-charging). Always redirect stdout through `tee` to a file when polling long jobs — RunWithCredentials can truncate/lose the return value on a timeout even though the underlying process (and any file it's writing) is unaffected; the log file survives and is readable via a normal Bash call.

## Scripts (video)
- `kling_generate.py` — submit to Kling v2.6/v3 Pro (start_image_url/end_image_url naming, strict duration enum, generate_audio forced false).
- `poll_and_download.py` — resume-poll any fal queue request by request_id + app-level model prefix; use when a generation outlives one RunWithCredentials call.

## IMAGE EDITING WITH THE SAME KEY (26 Jul 2026) — FLUX Kontext + AuraSR, verified

The queue protocol generalises to fal's image models unchanged (submit full path → status/result at app prefix). Shakedown: the Receiving Wall rework (Clive's Man room hero) — plaque removal + resurfacing the gateway field as carved stone — held composition, palette and painterly register on the first attempt.

- **`fal-ai/flux-pro/kontext/max`** — instruction-driven image EDIT. Params verified: `{prompt, image_url, output_format, num_images, guidance_scale?, seed?}`. Returns `{images: [{url, width, height, content_type}]}`. ~21s render. App prefix for status/result = `fal-ai/flux-pro` (nested-path rule holds).
- **Output is ~1MP** (1392×752 for a 2752×1536 input) and the aspect can snap slightly (1.792 in → 1.851 out). Plan an upscale pass for masters; expect a hair of vertical crop.
- **`fal-ai/aura-sr`** — GAN 4× upscale, `{image_url, upscaling_factor: 4}`, returns `{image: {url,...}}`, ~21s. Chosen over diffusion upscalers (clarity-upscaler) deliberately: GAN upscaling preserves existing brushwork rather than re-painting texture. 1392×752 → 5568×3008 (~24MB PNG).
- **Edit-prompt pattern that held**: name the changes first, then enumerate everything that must stay ("Keep everything else exactly the same: the composition, the … sconces …, the … threshold with the letters …, and the Victorian oil painting style, brushwork and palette."). Same philosophy as the video prompts: name what must not move.
- **Conditioning-input note**: FLF endpoints cap input stills at 8MB — when a Kontext-edited wall becomes a loop plate, condition on the ~1MP Kontext output or a ≤8MB downsample of the AuraSR master, never the 24MB PNG itself.

### Script
- `fal_image_edit.py` — generic image-model wrapper: `--model` (default `fal-ai/flux-pro/kontext/max`), `--prompt`, `--image-url`, `--out`, optional `--guidance/--seed/--timeout`. Computes the app prefix automatically (first two path segments), surfaces 422 validation detail verbatim (use as a schema probe for new models), handles both `{images:[...]}` and `{image:{...}}` result shapes, prints a JSON result line.

## GESTURES ARE ROUND TRIPS FROM THE HUB, NOT HOLDS (Matthew, 26 Jul 2026) — architectural correction, supersedes the two gesture rules above

Matthew's question that exposed the flaw: "Surely he needs to start from the canonical resting frame and move to these gestures? Otherwise how the hell do we stitch them together."

**The bug in the original bank design:** every hold was dual-anchored to ITS OWN still (first = last = pose still). For expression-only poses that is correct and stitches fine — a painted face changing state between hard cuts reads as a portrait changing. But for poses whose beat is a LIMB MOVING THROUGH SPACE (bashful's wave-off, qualm's half-raise, presenting's book-lift), it means the clip OPENS with the paw already mid-air. Cutting into it from the attending hub (paw resting on the book) teleports the limb between two frames.

**Why the gate missed it:** flf_gate.py compares clip endpoints against the pose's own still, and the outside-region (room) mask excludes Clive's body — so a gesture hold scores a clean PASS while being unstitchable. Measured directly on the old bashful-hold, gating its endpoints against the ATTENDING hub instead of its own still: outside-region 0.963 (room matches fine, hence the false pass) but FULL-FRAME 0.877 — that 0.877 is the paw teleport, invisible to the room-only bar. The round-trip version scores full-frame 0.965/0.972 against the same hub.

**The fix — render gestures as round trips:** `start_image_url = end_image_url = the ATTENDING HUB still` (not the pose still), and put the whole gesture arc in the prompt: begin at rest, perform the beat, return and settle exactly back. Prompt shape that worked:
> "...begins seated with both paws resting on the open book, attending warmly to his visitor. He is thanked, and becomes bashful: he lifts one paw off the book in a small flustered wave-off gesture... then he lowers the paw back down onto the book and returns his gaze to his visitor, settling exactly back to where he began. One single smooth continuous gesture: lift, small deflecting wave, return, settle."

Verified on bashful and qualm (10s Kling, $0.70 each): both gate PASS against the hub, seam 0.9928, and dense frame inspection confirms a true arc — paw on book at t=0, gesture peaks mid-clip, paw back on book by t=9.9.

**Consequences that supersede earlier rules:**
1. The gesture POSE STILLS (bashful, qualm, presenting) are no longer motion endpoints — they remain useful as poster frames / reduced-motion fallbacks, but no clip is anchored to them.
2. The "gesture holds ship at native 10s, no retiming" rule still stands, and for a better reason: a round trip is a performed beat with its own natural tempo, not a stretched freeze. Do not retime it.
3. The "gesture holds use duplication not minterpolate" rule becomes moot for these clips (no retiming happens at all), but keep it on file for any future case where a gesture clip must be retimed.
4. **Gate protocol addition: for any gesture clip, gate against the HUB still and read the FULL-FRAME figure, not just outside-region.** Outside-region alone cannot detect a limb discontinuity. Consider this the standing check for stitchability.
5. Presenting has not yet been re-rendered as a round trip — its original hold has the same teleport flaw (book starts already lifted) and should be re-rendered from the hub before use.

## THE DEFAULT NEGATIVE PROMPT SUPPRESSES GESTURES — read this before any gesture render (found 27 Jul 2026)

`kling_generate.py`'s default `--negative` contains **"paw movement, hand gestures, fidgeting"**. Those terms were correct for the stillness-law passive holds and are actively wrong for any gesture clip. The bashful and qualm round-trips (26 Jul) were submitted WITHOUT an explicit `--negative` override, so they inherited it: the positive prompt asked for a wave-off while the negative prompt banned paw movement and hand gestures. The model split the difference and produced a timid, lifeless half-motion. Matthew's verdict on the result: "terrible… they've lost their life in the gestures." This was a self-inflicted constraint conflict, NOT a Kling capability limit.

**Rule: every gesture render must pass an explicit `--negative` that omits the anti-gesture terms.** Gesture-safe negative set:
```
blur, distort, low quality, page turning, pages moving, camera movement, camera pan, camera zoom, reframing, room changes, furniture moving, style change, morphing background
```
Keep the room/camera/page guards; drop `paw movement, hand gestures, fidgeting`. Consider adding a `--gesture` flag to the script that swaps the default set, so this cannot be forgotten again.

## STITCHABILITY: BUILD THE JOIN, DON'T HOPE FOR IT (Matthew, 27 Jul 2026 — proposed, NOT yet tested)

Matthew: "none of them start and end on the same frame so they're not stitchable." Correct, and the round-trip fix only got us close, not exact — generative endpoints land NEAR the anchor (measured 0.965–0.972 full-frame vs the hub) but never ON it. Hard cuts need exact.

**Proposed fix (untested as of 29 Jul):** top-and-tail each clip with real frames of the canonical hub still — hard-splice N frames of the actual still onto head and tail, with a short cross-dissolve (~4–6 frames) into and out of the generated motion. Every clip then literally begins and ends on the identical hub frame, pixel-exact, so joins are structural rather than statistical. Standard scenic-department practice: you don't hope the join lands, you build it. Verify afterwards by extracting frame 0 and frame -1 and diffing against the hub still — should be ~1.0, not ~0.97.

## PROCESS LESSON — DO NOT BATCH-PRODUCE A CRAFT PROBLEM (29 Jul 2026)

The one clip in this project that landed first time and drew unqualified praise ("this is completely different… the stillness is phenomenal") was the reading hold, which got three prompt iterations plus dense per-frame visual inspection at each step. The batch of twelve that followed got one-shot prompts, parallel submission, and numeric gating only — Matthew's first reaction to the whole batch was "these are all very weird," and the gesture subset then consumed several further rounds. Numeric gates verify registration; they cannot verify performance. **Render one clip, inspect it densely by eye, get it approved, and only then scale the pattern.** Also worth noting: the agent's own visual judgement demonstrably drifted late in the project (a gesture round-trip was presented as a success and judged terrible) — when the numbers and Matthew's eye disagree, his eye is the ground truth.


## MID-FRAME ANCHORS FOR DIRECTION-CRITICAL TRANSITIONS (learned 30 Jul 2026, Clive welcome-arc book-close — five renders)

**Plates pin STATES, not motion DIRECTION.** A first/last pair fixes where a transition starts and ends; it says nothing about WHICH WAY the subject travels between them. When the direction is the point (a fold, a rotation, a hand-off, anything with a hinge or chirality), the model will resolve the missing direction from its own prior — and it often resolves it the cheap, wrong way.

The worked failure: the welcome-arc book-close (reading → RESTING) flipped for five renders. Root cause was in the PLATES, not the motion model — the open-book plate showed the cover line symmetric at both ends, so the spine/hinge had no fixed home; Kling hinged it from the far side and rolled the book away. Two Kontext edit-in-place passes on that open plate ALSO hinged at the centre gutter, because **an instruction edit moves structure that is already painted — it cannot invent a fixed spine the plate does not contain.**

**The fix — generate a mid-frame anchor, never edit the ambiguous end plate:**
1. Diagnose the direction-critical geometry (here: which side is the hinge/spine on?).
2. GENERATE the in-between frame with that geometry built explicitly (Nano Banana Pro, both end plates as references), anchored to sit between them — e.g. book mid-close, hinge FIXED far-left, cover rising toward the reader, flat far page + paw held. Generation composes from references and can synthesise the spine the end plate lacks; an edit cannot.
3. Render the transition as TWO HOPS, each dual-anchored: endA → mid-frame, mid-frame → endB. Each hop's end frame now carries its own fold direction and a fixed hinge, so the model never interpolates across the ambiguity.
4. Gate every hop endpoint against its plate (outside-region + full-frame where a limb/prop crosses), and inspect the direction-critical region DENSELY across the joint — not just the endpoints.

Result on the close: hopA 0.9905→0.9868, hopB 0.9903→0.9884, spine held dense, physically correct — first pass in five. Born stitchable at head, tail, and the joint.

**When to reach for this:** any FLF transition where the motion has a handedness, hinge, pivot, or occluded path that the two end stills leave ambiguous. If a transition flips, don't re-prompt the video — paint the in-between. The ambiguous end plate is a STATE plate; keep it untouched and generate the mid-frame as a NEW previz plate (bank canon only after the visual-finish eye approves).