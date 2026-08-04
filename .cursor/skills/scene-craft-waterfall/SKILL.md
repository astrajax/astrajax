---
name: scene-craft-waterfall
description: Route any AstraJax scene-craft job through the ordered pipeline that turns a flat painting into a shipped, responsive, interactable scene. Use at the start of any painted-scene task, when unsure which scene-craft skill to reach for, or when onboarding a new room.
---

# Scene Craft Waterfall

Kate carries many skills. This is the index that orders them. Given a scene-craft job, do not reason across the whole pile: find the phase you are in, load the one or two specialist skills that phase names, do the work, and hand the manifest to the next phase. Read this first, pull specialists on demand.

## The waterfall

The pipeline that turns a flat approved painting into a shipped, responsive, interactable room. Each phase names the skill to load and what it hands downstream.

- **Phase 0. Orient.** Load `astrajax-website-map` (available locally). Learn where scenes, components, lib, and assets live under website/. Always first in a session before touching code.
- **Phase 1. Direct and generate the art.** Choose by output: still art uses `creative-prompting` (not yet ported) and `advanced-image-techniques` (not yet ported); moving source uses `video-motion` (not yet ported), `video-prompting` (not yet ported), then `Veo Seamless Video Loop Production` (not yet ported); character beats use `character-motion-timecraft` (not yet ported); narration uses `voice-direction` (not yet ported). Output: the master painting plus any source clips.
- **Phase 2. Map the interactables.** Load `scene-dev-tools` (available locally) and open the hotspot editor. Draw a region over each clickable object; mark the essential ones critical. Output: a regions and hotspots manifest. Do this before the cut so you cut exactly what is interactable.
- **Phase 3. Cut the scene.** Load `scene-layer-cut` (available locally). Turn the flat master into registration-perfect transparent layers plus a reconstructed background plate plus state variants, verified with SSIM. Output: the layer manifest.
- **Phase 4. Forge moving accents.** Load `alpha-accent-forge` (not yet ported). Key a Veo accent (flicker, smoke, sparks, a pulse) to transparent alpha video, or lay it with screen blend if it is additive light. Consumes looped clips from the Veo loop skill. Output: alpha accents plus posters.
- **Phase 5. Frame responsive.** Load `responsive-scene-recomposition` (available locally). Compute focal-aware crops per breakpoint, re-project the hotspots, and gate that no critical interactable leaves the frame. Output: the per-breakpoint framing.
- **Phase 6. Deliver and prove.** Apply the baked-in delivery discipline (next/image, IntersectionObserver offscreen pause, reduced-motion poster swap), then load `scene-dev-tools` (available locally) for before/after PR evidence. Output: a PR carrying visual proof.
- **Phase 7. Report.** Follow the Fleet Communication Standard and the branch agreement: kate/* branches, add and update only, Matthew merges. Flag any change that touches public claims, not just presentation.

## Route by job

Skip to the entry phase for the job in front of you:

- "Make this painting clickable" starts at Phase 2, then 3, 5, 6.
- "Cut this room into layers" starts at Phase 3.
- "Add a candle flicker or smoke" starts at Phase 4 (not yet ported).
- "It breaks on mobile" starts at Phase 5.
- "The hover state swims" starts at Phase 3 (registration-check).
- "Prep PR evidence" starts at Phase 6.
- "Where does X live?" starts at Phase 0.
- "Generate or fix the artwork" starts at Phase 1 (not yet ported).

## Load economy

Keep this index in mind; pull each specialist only for its phase. Never reason from all the skills at once, and never load a phase's skill before you reach that phase. A scene job usually touches two or three specialists, not the whole set. This is why the waterfall exists: it converts a flat pile into a short, ordered reach.

## When several skills look similar

The media cluster overlaps; disambiguate by the exact job:

- `creative-prompting` (not yet ported): still images and the house Lock Kit. The default for painting or editing a still.
- `advanced-image-techniques` (not yet ported): background replacement, style transfer, batch variations on a still.
- `video-motion` and `video-prompting` (not yet ported): directing a Veo clip (shot structure, camera, motion).
- `Veo Seamless Video Loop Production` (not yet ported): making an existing clip loop with no visible seam.
- `alpha-accent-forge` (not yet ported): making a clip transparent so it lays over a scene.
- `video-continuation-patterns` (not yet ported): extending or chaining clips into a longer sequence.
- `hyperframes` (not yet ported): HTML-to-MP4 composed videos (titles, data motion). Rarely used for painted scenes.
- `character-motion-timecraft` (not yet ported): movement beats for a cast character.
- `voice-direction` (not yet ported): narration and character voice.

If two still-image skills both seem to fit, start with `creative-prompting` (not yet ported); reach for `advanced-image-techniques` (not yet ported) only for background replacement or batch work.

## Examples

Example 1: a whole new room, end to end.
Input: an approved flat painting of a new room.
Steps: Phase 0 orient; Phase 1 confirm the master is final (not yet ported); Phase 2 map the hotspots; Phase 3 cut the layers; Phase 4 forge any accents (not yet ported); Phase 5 frame for mobile; Phase 6 deliver with before/after evidence; Phase 7 open the kate/* PR.
Output: a responsive, interactable room with a proof-carrying PR.

Example 2: just add a moving accent.
Input: a shipped room that needs a candle flicker.
Steps: jump to Phase 4 (not yet ported); decide additive (screen blend) versus occluding (alpha video); forge it; Phase 6 evidence; Phase 7 PR. Skip cutting and framing.
Output: a small accent added without re-running the pipeline.

Example 3: a hotspot is unreachable on a phone.
Input: a desktop-correct room that fails on mobile.
Steps: jump to Phase 5; add the hotspot to the framing manifest as critical; verify; it fails on portrait; give it an alternate portrait anchor; re-verify; Phase 6 evidence.
Output: a passing responsive framing with the interactable reachable on every screen.
