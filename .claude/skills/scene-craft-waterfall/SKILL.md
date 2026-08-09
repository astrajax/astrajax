---
name: scene-craft-waterfall
description: >-
  Route any AstraJax scene-craft job through the ordered pipeline that turns a flat painting into a shipped, responsive, interactable scene, so the right specialist skill loads at each phase instead of facing a flat pile. Use at the start of any painted-scene task (making a painting clickable, adding a moving accent, framing a room for mobile, preparing PR evidence), when unsure which scene-craft skill to reach for, or when onboarding a new room. Triggers on phrases like "scene-craft", "make this painting interactable", "build this room", "which skill do I use", "start a new scene". Not for generating the art itself, general web development, o…
---

# Scene Craft Waterfall

Kate carries many skills. This is the index that orders them. Given a scene-craft job, do not reason across the whole pile: find the phase you are in, load the one or two specialist skills that phase names, do the work, and hand the manifest to the next phase. Read this first, pull specialists on demand.


## Cursor runtime

Ported from Hyperagent export `skill-scene-craft-waterfall.json` (2026-08-08).
This is the routing index — no embedded scripts, no credentials.

| Hyperagent | Cursor |
|---|---|
| Specialist skill load by phase | Load the matching `.cursor/skills/<slug>/SKILL.md` (Claude mirrors under `.claude/skills/`) |
| HA `Vercel API` skill (Phase 6 deploy check) | **Do not port / do not load a Vercel API skill.** Use **Vercel MCP**, `vercel` CLI, and Cursor Vercel plugin skills instead |
| Fleet Communication Standard / branch agreement | Existing household skills + Kate agent git working agreement |
| Media cluster skills (creative-prompting, Veo loop, alpha-accent-forge, …) | Some already exist in-repo (e.g. `fal-first-last-frame-video`, `character-motion-timecraft`); others remain HA-only until separately ported — see Gaps |

**Cursor phase → skill slug (this batch):**

| Phase | Cursor skill |
|---|---|
| 0 Orient | `astrajax-website-map` |
| 2 Map interactables | `scene-dev-tools` |
| 3 Cut | `scene-layer-cut` |
| 5 Frame responsive | `responsive-scene-recomposition` |
| 6 Deliver / prove | `scene-dev-tools` + **Vercel MCP / `vercel` CLI** (not Vercel API skill) |

Phases 1 and 4 (generate art / forge alpha accents) may still need HA or
already-ported fal/motion skills — do not invent missing specialists.

## The waterfall

The pipeline that turns a flat approved painting into a shipped, responsive, interactable room. Each phase names the skill to load and what it hands downstream.

- Phase 0. Orient. Load astrajax-website-map. Learn where scenes, components, lib, and assets live under website/. Always first in a session before touching code.
- Phase 1. Direct and generate the art. Choose by output: still art uses creative-prompting (the Lock Kit and Nano Banana edits) and advanced-image-techniques (background replacement, batch variations); moving source uses video-motion and video-prompting (Veo shot craft) then Veo Seamless Video Loop Production (make a clip loop); character beats use character-motion-timecraft; narration uses voice-direction. Output: the master painting plus any source clips.
- Phase 2. Map the interactables. Load scene-dev-tools and open the hotspot editor. Draw a region over each clickable object; mark the essential ones critical. Output: a regions and hotspots manifest. Do this before the cut so you cut exactly what is interactable.
- Phase 3. Cut the scene. Load scene-layer-cut. Turn the flat master into registration-perfect transparent layers plus a reconstructed background plate plus state variants, verified with SSIM. Output: the layer manifest.
- Phase 4. Forge moving accents. Load alpha-accent-forge. Key a Veo accent (flicker, smoke, sparks, a pulse) to transparent alpha video, or lay it with screen blend if it is additive light. Consumes looped clips from the Veo loop skill. Output: alpha accents plus posters.
- Phase 5. Frame responsive. Load responsive-scene-recomposition. Compute focal-aware crops per breakpoint, re-project the hotspots, and gate that no critical interactable leaves the frame. Output: the per-breakpoint framing.
- Phase 6. Deliver and prove. Apply the baked-in delivery discipline (next/image, IntersectionObserver offscreen pause, reduced-motion poster swap), then load scene-dev-tools for before/after PR evidence, and Vercel API to check the deploy. Output: a PR carrying visual proof.
- Phase 7. Report. Follow the Fleet Communication Standard and the branch agreement: kate/* branches, add and update only, Matthew merges. Flag any change that touches public claims, not just presentation.

## Route by job

Skip to the entry phase for the job in front of you:

- "Make this painting clickable" starts at Phase 2, then 3, 5, 6.
- "Cut this room into layers" starts at Phase 3.
- "Add a candle flicker or smoke" starts at Phase 4, then 6.
- "It breaks on mobile" starts at Phase 5.
- "The hover state swims" starts at Phase 3 (registration-check).
- "Prep PR evidence" starts at Phase 6.
- "Where does X live?" starts at Phase 0.
- "Generate or fix the artwork" starts at Phase 1.

## Load economy

Keep this index in mind; pull each specialist only for its phase. Never reason from all fifteen skills at once, and never load a phase's skill before you reach that phase. A scene job usually touches two or three specialists, not the whole set. This is why the waterfall exists: it converts a flat pile into a short, ordered reach.

## When several skills look similar

The media cluster overlaps; disambiguate by the exact job:

- creative-prompting: still images and the house Lock Kit. The default for painting or editing a still.
- advanced-image-techniques: background replacement, style transfer, batch variations on a still.
- video-motion and video-prompting: directing a Veo clip (shot structure, camera, motion).
- Veo Seamless Video Loop Production: making an existing clip loop with no visible seam.
- alpha-accent-forge: making a clip transparent so it lays over a scene.
- video-continuation-patterns: extending or chaining clips into a longer sequence.
- hyperframes: HTML-to-MP4 composed videos (titles, data motion). Rarely used for painted scenes.
- character-motion-timecraft: movement beats for a cast character.
- voice-direction: narration and character voice.

If two still-image skills both seem to fit, start with creative-prompting; reach for advanced-image-techniques only for background replacement or batch work.

## Examples

Example 1: a whole new room, end to end.
Input: an approved flat painting of a new room.
Steps: Phase 0 orient; Phase 1 confirm the master is final; Phase 2 map the hotspots; Phase 3 cut the layers; Phase 4 forge any accents; Phase 5 frame for mobile; Phase 6 deliver with before/after evidence; Phase 7 open the kate/* PR.
Output: a responsive, interactable room with a proof-carrying PR.

Example 2: just add a moving accent.
Input: a shipped room that needs a candle flicker.
Steps: jump to Phase 4; decide additive (screen blend) versus occluding (alpha video); forge it; Phase 6 evidence; Phase 7 PR. Skip cutting and framing.
Output: a small accent added without re-running the pipeline.

Example 3: a hotspot is unreachable on a phone.
Input: a desktop-correct room that fails on mobile.
Steps: jump to Phase 5; add the hotspot to the framing manifest as critical; verify; it fails on portrait; give it an alternate portrait anchor; re-verify; Phase 6 evidence.
Output: a passing responsive framing with the interactable reachable on every screen.

## Lineage

Designed 5 Jul 2026 to order Kate's skill set into a pipeline after her config showed fifteen skills preloaded with no routing. It indexes, and never replaces, the specialist skills: astrajax-website-map, creative-prompting, advanced-image-techniques, video-motion, video-prompting, Veo Seamless Video Loop Production, character-motion-timecraft, voice-direction, scene-dev-tools, scene-layer-cut, alpha-accent-forge, responsive-scene-recomposition, Vercel API, Fleet Communication Standard. Pairs best with skillLoadMode discover, so this index is the anchor and specialists load per phase.
