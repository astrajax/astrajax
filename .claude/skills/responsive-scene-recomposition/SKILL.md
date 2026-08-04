---
name: responsive-scene-recomposition
description: Frame a wide painted AstraJax room for portrait and square screens without letterboxing or guillotining the subject. Compute focal-aware crops per breakpoint, emit as CSS object-position, re-project hotspots into the cropped view, and flag interactables that fall off-screen. Use when framing a 16:9 painted scene for mobile, when hotspots drift off-screen at a breakpoint, or when planning per-device framing.
---

# Responsive Scene Recomposition

Wide painted rooms are authored at 16:9, but phones are portrait. Letterboxing wastes the screen and shrinks the art; a naive centre cover-crop guillotines the subject and drags the percentage-positioned hotspots off the visible slice. This tool frames each scene per breakpoint around a declared focal region, and proves no interactable leaves the frame.

## Give every scene a focal region first

Always author one focal rectangle per room: the must-keep subject (the central vat, Doc at his pedestal, the nameplate). Every crop is centred on it and clamped to the image. Without a focal region the tool falls back to the geometric centre, which is usually wrong for these scenes.

## Two delivery models, one geometry

The crop math serves both ways AstraJax renders a scene:

- Flattened `<img>` or `<video>` with `object-fit: cover`: apply the emitted `object-position`. The tool converts the focal-aware crop offset into the exact percentage.
- Layered DOM stage (background plate plus absolutely-positioned layers from scene-layer-cut): translate the stage by the crop offset and clip the overflow. Hotspots are children, so they move with the stage for free; here the value is the per-breakpoint off-screen flag, not the object-position.

## Plan the breakpoints

Run the plan over a scene manifest:

`python3 scripts/recompose.py plan --manifest scene.json --out plan.json --css frame.css --image room.png --preview framing.png`

For each breakpoint it emits the crop rectangle, the CSS `object-position`, and every hotspot re-projected into the cropped view with an `inside` flag. The preview draws the focal region, each breakpoint crop, and every hotspot dot on the master so the framing is eyeballable in one glance.

## Read the off-screen flags and decide

For each hotspot the plan marks off-screen at a breakpoint, choose one, deliberately:

- Reposition it for that breakpoint (give it an alternate anchor near the visible edge).
- Hide it at that breakpoint if the interaction is non-essential on small screens.
- Widen the focal region so the crop includes it (accepting a wider, shorter framing).

Never leave a needed interactable off-screen by accident. That is what the verify gate is for.

## Verify before delivery

`python3 scripts/recompose.py verify --manifest scene.json`

It passes only when every hotspot marked `critical` stays on-screen at every breakpoint, and it warns when the focal region cannot fully fit a crop. Wire it into the pre-delivery check so a phone framing can never silently drop the primary interactable.

## Manifest schema

One framing manifest per room. Coordinates are master pixels; hotspot anchors are the interactable's centre point.

```json
{
  "room": "doc-workshop",
  "size": [3840, 2160],
  "focal": {"x": 1340, "y": 520, "w": 1160, "h": 1200},
  "hotspots": [
    {"name": "doc", "x": 1920, "y": 1180, "critical": true},
    {"name": "left-bay", "x": 640, "y": 1180, "critical": false}
  ],
  "breakpoints": [
    {"name": "wide", "aspect": 1.7778},
    {"name": "portrait", "aspect": 0.5625},
    {"name": "square", "aspect": 1.0}
  ]
}
```

- focal: the must-keep subject rectangle. Crops centre on it and clamp to the image.
- hotspots: anchor points reused from the scene-layer-cut manifest. Mark the ones that must never disappear as `critical`.
- breakpoints: target aspect ratios as width over height. Portrait 9:16 is 0.5625, square is 1.0.

## Known gotchas

- Always declare a focal region. The default centre crop guillotines these off-centre subjects.
- object-position only applies to the flattened model. For a layered DOM stage, use the crop offset as a stage translate and trust the off-screen flags.
- A hotspot at more than 100 percent or below 0 percent is off the crop, not merely near the edge. Treat the `inside` flag as the truth, not the raw percentage.
- Portrait of a 16:9 master is a narrow full-height slice. Expect most horizontal hotspots to fall outside; plan their small-screen behaviour rather than hoping.
- If the focal region will not fit (the warning fires), the subject is wider than a portrait slice. Split the interaction across screens or accept a shorter framing.

## Script reference

`recompose.py` uses Pillow only; the geometry is plain arithmetic. Commands print JSON and return exit code 1 on failure.

- crop: one focal-aware crop for a given size, focal, and target aspect; optional preview.
- project: re-project one hotspot into a given crop; returns percentage plus inside flag.
- plan: the full per-breakpoint plan, plus a CSS file and a framing preview.
- verify: assert every critical hotspot stays on-screen at every breakpoint.

`run_test.py` frames a synthetic wide room across three breakpoints and checks the crops, reprojection, off-screen detection, and the critical gate; run it after editing the script.

## Examples

Example 1: frame Doc's Workshop for a phone.
Input: the 3840x2160 master, focal on Doc and his pedestal, hotspots for Doc, each side bay, and the nameplate.
Steps: author the manifest; plan; read the preview; the side bays flag off-screen on portrait, so hide them on small screens; verify passes because Doc and the nameplate stay in.
Output: plan.json with per-breakpoint object-position, frame.css, and a framing preview.

Example 2: a hotspot drifts off on mobile.
Symptom: the Court button works on desktop but is unreachable on a phone.
Steps: add it to the manifest as critical; verify; it fails on portrait; give it an alternate portrait anchor near the visible edge and re-verify.
Output: a passing verify with the button repositioned for small screens.

Example 3: choose the crop aspect for a new device.
Input: a target device that is 3:4.
Steps: run crop with the master size, the focal rectangle, and aspect 0.75; read the object-position and whether the focal fits.
Output: the crop rectangle and CSS object-position for that device.
