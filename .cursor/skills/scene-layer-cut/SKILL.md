---
name: scene-layer-cut
description: >-
  Cut a flat painted master scene into registration-perfect transparent interactable layers for point-and-click web UI. Derive object masks, cut exact master pixels through them, decontaminate painterly edges, inpaint the background behind lifted objects, build state variants, and verify every layer recomposites onto the master with SSIM. Use when turning an AstraJax painted room (Brain Vault, Doc's Workshop, Clive's study) into clickable DOM layers, preparing hover, open, or glow state variants, or debugging layers that swim, halo, or fail to line up. Triggers on phrases like "cut this scene into layers", "make this painting interactable", "l…
---

# Scene Layer Cut

Turn a flat painted master (an approved AstraJax room such as the Brain Vault, Doc's Workshop, or Clive's study) into a stack of registration-perfect transparent layers the browser can composite, so every interactable object becomes its own DOM element. This is the production pipeline behind layer decomposition: the master stays the source of truth, and each interactable is lifted without losing a pixel of fidelity or alignment.


## Cursor runtime

Ported from Hyperagent export `skill-scene-layer-cut (1).json` (2026-08-08).
Hyperagent mechanics map to Cursor as follows:

| Hyperagent | Cursor |
|---|---|
| `GenerateImage` (mask / inpaint / state variants) | **GenerateImage** tool (pass master as `reference_image_paths`) |
| Skill `execute-script` / local Python | Shell: `python3 .cursor/skills/scene-layer-cut/scripts/scene_layer_cut.py …` |
| Thread file attachments | Local repo / `/tmp` paths; Read / Write |
| Browser for visual checks | Local open of cut layers / composites; PR proof via `scene-dev-tools` |
| No credentials (`authType: none`) | No env vars required |

**Scripts (repo-relative):**

```bash
python3 .cursor/skills/scene-layer-cut/scripts/scene_layer_cut.py mask-apply \
  --master ROOM.png --mask MASK.png --out book.png
python3 .cursor/skills/scene-layer-cut/scripts/scene_layer_cut.py edge-clean \
  --layer book.png --out book_clean.png
python3 .cursor/skills/scene-layer-cut/scripts/scene_layer_cut.py inpaint-guard \
  --master ROOM.png --plate PLATE.png --holes HOLES.png
python3 .cursor/skills/scene-layer-cut/scripts/run_test.py
# mirrors: .claude/skills/scene-layer-cut/scripts/
# convenience: scripts/kate/
```

Dependencies: `python3`, `numpy`, `Pillow`. No `RunWithCredentials`.
Keep the fidelity rule: cut master pixels through masks; generate only for hidden
backgrounds and new state variants.

## The core rule: cut for fidelity, generate for what is hidden or new

Always cut interactable objects straight from the master's own pixels through a mask. Never regenerate an object that already exists in the approved painting, because a fresh generation repaints it and destroys both fidelity and registration. Reserve GenerateImage for the two things the master cannot give you: the background hidden behind a lifted object, and new state variants (glow, open, lit) that do not exist yet.

This one rule removes registration drift by construction: pixels that never move cannot fall out of alignment.

## Plan the cut

Read the target room and the scene-manifest convention first (see the astrajax-website-map skill for where scenes, layers, and manifests live under website/). Decide, per object, interactable or decorative:

- Interactable objects each become their own layer (a book you can open, a portrait door, a vial, a nameplate).
- Decorative detail stays baked into the background plate. Never cut what nobody clicks; every extra layer is weight and a registration risk.

Record the interactable list with a rough region for each. The output of this phase is the layer plan, not assets.

## Derive the mask, then cut (the fidelity half)

For each interactable, get a mask first, then apply it to the master's exact pixels.

1. Derive the object mask with GenerateImage: ask for the object isolated on a flat contrasting field, or a white-on-black matte of just that object, passing the master as the input image so the shape matches. Use the creative-prompting Keep, Change, Add, Render playbook to phrase the edit. The generated matte defines shape only, never the object's colour.
2. Cut through the mask: `python3 scene_layer_cut.py mask-apply --master ROOM.png --mask MASK.png --out book.png`. This applies the mask as alpha to the master's own RGB, feathers the alpha, trims to the bounding box, and prints the offset plus a ready manifest entry. The layer therefore carries the approved painted pixels exactly.

Painterly edges are soft by nature. Keep a small feather (default 1.5 px) so the varnish and brushwork survive; a hard binary edge reads as cut with scissors.

## Decontaminate the fringe

Semi-transparent edge pixels carry background colour spill that shows as a dark or coloured halo once composited. Always run edge-clean on a cut layer before delivery: `python3 scene_layer_cut.py edge-clean --layer book.png --out book_clean.png`. It extends the opaque foreground colour outward into the fringe and optionally re-feathers, so premultiplied compositing stays halo-free.

## Reconstruct the background (the generative half)

Lifting an object leaves a hole. Build one background plate for the whole scene:

1. Mask out every lifted object at once and inpaint with GenerateImage: instruct it to repaint the surface behind the objects (the desk, the shelf, the wall), matching lighting, palette, and brushwork. Hold the house register with the creative-prompting Lock Kit; advanced-image-techniques covers the background-replacement approach.
2. Guard the inpaint: `python3 scene_layer_cut.py inpaint-guard --master ROOM.png --plate PLATE.png --holes HOLES.png`. This proves the model changed pixels only inside the holes and left the rest of the painting untouched. If it reports a leak, re-mask tighter and regenerate. Never ship a plate that quietly altered the scene.

## Build state variants

Hover, open, lit, glowing: each state is a variant of a layer, and crossfades between them only look right if the variant is pixel-registered to its base.

Always edit the base layer in place (creative-prompting Keep, Change, Add, Render, or a masked blend-mode glow), changing only the region the state touches. Never regenerate the whole object for a state, because that repaints everything and the crossfade will swim.

Prove it: `python3 scene_layer_cut.py registration-check --base book.png --variant book_glow.png`. It passes only when the change is localized to the intended region and the rest stays in registration. A whole-object repaint fails the localized check; a shifted variant fails the outside-region SSIM.

For a variant that should actually move (a candle flame, a curl of smoke, a brain pulse), never fake it with a static frame; hand the layer to the Veo Seamless Video Loop Production skill for an alpha accent instead.

## Verify the whole stack (the deterministic gate)

Before delivery, recomposite the plate plus every layer at its manifest position and compare to the master:

`python3 scene_layer_cut.py verify --manifest layers.json --master ROOM.png --heatmap check.png`

Because layers were cut from the master and only the holes were repainted, a correct stack reproduces the master almost exactly. Pass requires SSIM at or above 0.985. A lower score means a layer is mis-positioned, an alpha is wrong, or the plate altered non-hole pixels, and the heatmap shows where. This SSIM gate is the same seam-verification discipline the Veo seamless loop skill applies to loop endpoints.

## Export and wire the manifest

Deliver each layer as a trimmed transparent PNG master plus a manifest entry. Keep PNG as the master and let next/image negotiate AVIF or WebP at delivery (Kate's baked-in delivery discipline). One manifest per room:

```json
{
  "room": "clive-study",
  "size": [3840, 2160],
  "background": "clive-study-plate.png",
  "layers": [
    {
      "name": "book", "path": "layers/book.png",
      "x": 1180, "y": 1320, "z": 10, "baseline": 1560,
      "states": {"hover": "layers/book_glow.png"}
    }
  ]
}
```

- x, y: top-left offset on the scene canvas, in master pixels. Convert to percent at render time for responsive scaling.
- z: paint order, low to high. Borrowed from the Popochiu adventure-engine data model.
- baseline: optional y line for front-versus-behind ordering, when a character or overlay must sit in front of one object and behind another.
- states: variant layers keyed by state name, each already passed through registration-check.

## Known gotchas

- Never regenerate an object that already exists in the master. Cutting preserves registration for free; regenerating throws it away. This is the single most common way layers start to swim.
- A generated matte is a shape, not a colour. Use it only to define alpha; the colour must come from the master's pixels.
- Inpaint leaks silently. Always run inpaint-guard; a plate that looks fine can have shifted the whole wall's tone.
- Halos come from the fringe, not the mask. If an edge glows wrong after compositing, run edge-clean before blaming the alpha.
- SSIM near 1.0 is the pass bar here, not 0.7. These layers are cut from the master, so a correct recomposite is nearly identical. Treat any real dip as a defect.
- Feather is per object. A hard-edged brass plaque wants near-zero feather; a soft-lit book edge wants more.

## Script reference

`scene_layer_cut.py` uses numpy and Pillow only (no scipy, skimage, or cv2), so it runs in a bare sandbox. SSIM is a pure-numpy integral-image box filter. Every command prints JSON and returns exit code 1 on failure, so it gates a pipeline cleanly.

- mask-apply: cut a positioned layer from the master through a mask.
- edge-clean: feather alpha and decontaminate fringe halos.
- compose: composite plate plus positioned layers into one image.
- verify: recomposite versus master, report SSIM and PSNR, write a drift heatmap.
- registration-check: prove a variant differs from its base only where intended.
- inpaint-guard: prove a plate changed only inside the holes.

`run_test.py` synthesises a scene and exercises every command; run it after editing the script to confirm the deterministic behaviour still holds.

## Examples

Example 1: lift a book off Clive's desk.
Input: clive-study.png (flat master); the book is interactable.
Steps: GenerateImage a matte of the book; mask-apply to cut clive-study.png through it (returns the offset); edge-clean the cut; add the book region to the plate hole mask; inpaint the desk behind it; inpaint-guard the plate; verify the recomposite at SSIM 0.985 or higher.
Output: book.png (transparent, positioned), clive-study-plate.png (desk gap repainted), a manifest entry, and a passing verify.

Example 2: a glowing-book hover state.
Input: book.png (the base layer from Example 1).
Steps: edit book.png in place to add a warm glow only on the pages (Keep everything, Change only the glow); registration-check base versus variant.
Output: book_glow.png that passes the localized-change and stays in registration, ready to crossfade on hover.

Example 3: debug a layer that swims on hover.
Input: a base and a variant that visibly jump during the crossfade.
Steps: registration-check base versus variant.
Output: a FAIL reporting changed_fraction near 1.0, meaning the variant was a full repaint. Refix by editing the base in place instead of regenerating.

## Lineage

Designed 5 Jul 2026 from Kate's own top felt gap (flat-master layer separation, painterly-edge alpha, background reconstruction, variant registration) triangulated against an Exa research sweep. Companion skills: creative-prompting (generative edits and the Lock Kit), advanced-image-techniques (background replacement), Veo Seamless Video Loop Production (alpha accents and the SSIM lineage), astrajax-website-map (where scenes and manifests live). The z and baseline manifest fields are borrowed from the Popochiu point-and-click adventure model; only the data shape is borrowed, never the engine.
