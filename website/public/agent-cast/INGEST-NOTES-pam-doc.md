# Ingest notes — Pam & Doc hero loop videos

**Status:** Asset ingest complete, registry wiring pending  
**Owner:** Matthew (code owner to wire the registry)  
**Date:** 30 Jun 2026  
**Scope:** Copied two recorded loop videos into the agent-cast media tree. This
agent did **not** edit any `.ts`/`.tsx` source. The suggested registry entries
below are for the code owner to apply to
[`website/src/lib/agent-cast-assets.ts`](../../src/lib/agent-cast-assets.ts).

Convention reminder: files live at
`website/public/agent-cast/{slug}/animations/{kebab-id}.mp4`, and the registry
`AgentAnimationVariant` shape is `{ id, file, purpose }`, where `id` matches the
filename without extension and `file` is relative to `{slug}/animations/`.

---

## What was copied

### Pam Portiscue — Act 4 (Pam's chamber)

| Field | Value |
|-------|-------|
| **Source** | `brand/system-assets/agent-visual-assets/Pam Portiscue/PAM-HERO.mp4` |
| **Destination** | `website/public/agent-cast/pam-portiscue/animations/idle-loop.mp4` |
| **Size** | 10,991,234 bytes (~10.49 MB) |
| **Video** | 1920×1080, 24 fps, 18.125 s |
| **SHA-1** | `3267b5913d66213e4a1b120d440d427bfce99174` |
| **Content** | The grey Victorian-suited cat (challenger) standing over a map-covered desk in her study — pinned world map, globe, brass anglepoise lamp, teacup, dividers, fountain pen. Subtle head/lean motion; opens and closes on the same still state, so it loops. |

> **Note:** this is a **distinct** asset from the existing
> `pam-portiscue/hero.mp4` (SHA `699d9c68…`, ~4.95 MB). The new loop is larger,
> higher-resolution (1080p), and longer. Treat it as a new chamber loop, not a
> duplicate of the homepage hero.

### Doc Albright — Act 6 (Doc files it)

| Field | Value |
|-------|-------|
| **Source** | `brand/system-assets/agent-visual-assets/Doc Albright/DOC-HERO.mp4` |
| **Destination** | `website/public/agent-cast/doc-albright/animations/idle-loop.mp4` |
| **Size** | 1,615,096 bytes (~1.54 MB) |
| **Video** | 1280×720, 24 fps, 8.0 s |
| **SHA-1** | `9a5a330870e45aa24676411471f15c0ffaaff39a` |
| **Content** | The goggled terrier engineer on a stool in a steampunk workshop, tinkering on a brass gear device by a lit forge — gears, tools, jars, pipes. Subtle working motion; opens and closes on the same still state, so it loops. |

> **Note:** this file is **byte-identical** (same SHA-1) to the existing
> `doc-albright/hero.mp4`. The Doc workshop loop is the same clip already serving
> as his homepage hero. The code owner may prefer to **reference `hero.mp4`
> directly** rather than ship a duplicate `idle-loop.mp4`; both options are listed
> below. If you keep only the hero, delete `doc-albright/animations/idle-loop.mp4`.

---

## Naming rationale

Both clips are ambient **idle/presence loops** (subtle motion, locked-off framing,
loop-safe start/end) rather than one-shot gestures, so both are named
`idle-loop.mp4` per the registry's documented example id (`idle-loop`). They sit in
separate slug folders, so the shared filename does not collide. Scene/Act context
is carried in the `purpose` field below.

---

## Suggested registry entries (for the code owner — NOT applied by this agent)

Apply these to the `animations: []` arrays in
[`website/src/lib/agent-cast-assets.ts`](../../src/lib/agent-cast-assets.ts).
Pam's entry is on the `pam-portiscue` object (currently `animations: []`); Doc's is
on the `doc-albright` object (currently `animations: []`).

### `pam-portiscue`

```ts
animations: [
  {
    id: "idle-loop",
    file: "idle-loop.mp4",
    purpose:
      "Act 4 — Pam's chamber ambient loop: the challenger at her map desk, subtle head/lean motion. Loop-safe (same start/end state).",
  },
],
```

### `doc-albright`

**Option A — wire the new `animations/idle-loop.mp4`:**

```ts
animations: [
  {
    id: "idle-loop",
    file: "idle-loop.mp4",
    purpose:
      "Act 6 — Doc files it: the engineer tinkering at his steampunk workbench, subtle working motion. Loop-safe (same start/end state).",
  },
],
```

**Option B — reuse the existing `hero.mp4` (since the clip is identical) and skip the duplicate.** If you choose this, delete `doc-albright/animations/idle-loop.mp4` and reference the hero loop via `castHeroVideoSrc("doc-albright")` instead.

---

## Resulting public URLs

Once the Pam entry (and Doc Option A) are wired, `castAnimationSrc(...)` resolves to:

- `/agent-cast/pam-portiscue/animations/idle-loop.mp4`
- `/agent-cast/doc-albright/animations/idle-loop.mp4`
