---
name: scene-dev-tools
description: Speed up Kate's scene-craft loop with two dev tools. Capture before/after PR evidence with Playwright (screenshots at chosen viewports, composed into side-by-side, diff heatmap, self-contained wipe-slider). Define hotspot regions visually with a drag-to-draw editor that exports a scene-layer-cut manifest. Use when preparing PR evidence for a scene PR, defining hotspot coordinates for a room, or mapping interactables on a new painting.
---

# Scene Dev Tools

Two chores recur in every scene-craft PR: producing before/after proof that the change looks right, and defining hotspot coordinates for a painting. This skill removes both. One tool captures and composes visual evidence; the other lets you draw hotspot regions on a painting and exports a manifest the rest of the scene-craft skills consume.

## Before/after PR evidence

Kate's working agreement requires before/after proof on every PR. Produce it in two steps.

### Capture

`python3 scripts/pr_evidence.py capture --url https://astrajax.com --url-b https://<branch-preview> --routes /command/doc,/brain --viewports 1440x900,390x844 --out-dir pr-evidence`

It screenshots each route at each viewport from both the base and the branch preview. It uses Playwright, so the runtime needs `pip install playwright && python3 -m playwright install chromium`. When Playwright is absent it prints setup guidance rather than crashing.

If Playwright is not available, Claude Code has browser automation tools (Read/navigate/screenshot via the preview system). Capture the frames, then jump straight to compose.

### Compose

`python3 scripts/pr_evidence.py compose --before before.png --after after.png --out side.png --diff diff.png --slider slider.html --label-a main --label-b kate/branch`

This writes three artifacts: a labelled side-by-side, a red pixel-diff heatmap that reports the changed fraction, and a self-contained wipe-slider HTML with both frames embedded. Always attach the slider or the side-by-side to the PR, and use the diff heatmap to confirm the change is where you intended and nowhere else. The composition is deterministic (numpy plus Pillow); it needs no browser.

## The hotspot editor

`hotspot_editor.html` is a dev-only tool for defining hotspot regions on a painting by dragging rectangles, instead of guessing coordinates by hand. Open it locally and pass the scene as `?src=<image-url>`, or load a file from the picker; with no image it shows a placeholder grid so it still runs.

Drag to draw a region, name it, and mark it critical if it must survive responsive reframing. Coordinates are stored in master pixels (scaled from the displayed size), so they drop straight into the other skills. Export writes a manifest that feeds both scene-layer-cut (the regions to cut) and responsive-scene-recomposition (the hotspot centre anchors). Run it as a dev route or a local file only; never ship it to a production route.

## The manifest it exports

```json
{
  "room": "doc-workshop",
  "size": [1600, 900],
  "regions": [
    {"name": "vat", "x": 700, "y": 300, "w": 200, "h": 200, "z": 10, "critical": true}
  ],
  "hotspots": [
    {"name": "vat", "x": 800, "y": 400, "critical": true}
  ]
}
```

- size: the painting's natural pixel size, captured when the image loads.
- regions: rectangles in master pixels, ready as scene-layer-cut cut regions.
- hotspots: each region's centre, ready as responsive-scene-recomposition anchors.

## Known gotchas

- Capture needs Playwright plus a Chromium binary. If it is missing, use Claude Code browser automation to grab the frames and run compose on them; do not treat the guidance message as an error.
- Editor coordinates are master pixels, scaled from the displayed image. Always confirm the image's natural size loaded before trusting exported numbers; a broken `?src` leaves the placeholder grid's size instead.
- The slider HTML embeds both frames as base64 data URIs. It is self-contained and shareable, but larger than the PNGs; do not commit it as a source asset.
- Run the editor dev-only. It is a build aid, never a production route.
- Compose resizes the after frame to the before frame if they differ. Capture both at the same viewport so the diff heatmap stays meaningful.

## Precedent

`website/e2e/receiving-wall-screenshots.mjs` already does multi-viewport capture + PIL pixel-diff + JSON reporting for a different feature. It is a working precedent for the same pattern this skill's `pr_evidence.py` does, so it is not a first-of-its-kind idea.

## Script reference

- `pr_evidence.py`: capture (Playwright screenshots of routes at viewports, lazy-imported) and compose (side-by-side, pixel-diff heatmap, self-contained wipe-slider; numpy plus Pillow). Prints JSON, exits 1 on failure, exits 2 with guidance when Playwright is absent.
- `hotspot_editor.html`: the drag-to-define editor. Its coordinate and manifest logic lives in a pure `EditorCore` block, and a test surface is exposed on `window.__editor` for headless drivers.
- `test_editor_core.mjs`: a Node check of `EditorCore` (display-to-master scaling, inverted-drag normalisation, bounds clamping, manifest shape, centre anchors).
- `run_test.py`: exercises the compose artifacts, the Playwright-absent guidance path, and runs the Node core check.

## Examples

Example 1: PR evidence for a book-desk hover change.
Input: the deployed base and a branch preview URL.
Steps: capture `/command/clive` at desktop and mobile from both; compose the desktop pair with a diff heatmap and a slider.
Output: side.png, diff.png showing only the book glow changed, and slider.html attached to the PR.

Example 2: map hotspots on a new room.
Input: a freshly painted master.
Steps: open hotspot_editor.html with `?src` pointing at the master; drag a region over each interactable; mark the primary ones critical; export.
Output: a regions manifest that scene-layer-cut and responsive-scene-recomposition both read.

Example 3: a visual diff catches an unintended shift.
Symptom: a spacing tweak seems to nudge a plaque.
Steps: capture before and after; compose with the diff heatmap.
Output: the heatmap lights up the plaque region, confirming the regression before merge.
