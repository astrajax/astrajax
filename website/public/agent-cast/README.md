# Agent cast media

Per-character home for **hero stills** (portrait cards) and **animation loops** used on the AstraJax site and platform shells.

## Folder layout

```text
agent-cast/
  manifest.json          ← ops index (keep in sync with src/lib/agent-cast-assets.ts)
  README.md
  {slug}.png             ← legacy flat heroes (still valid until migrated)
  {slug}/
    hero.png             ← canonical hero still (target location)
    animations/
      idle-loop.mp4      ← example variant
      speaking-loop.mp4
```

**Slug** = kebab-case full name, matching existing DS cards: `clive-wigglesworth`, `pam-portiscue`, `doc-albright`, etc.

## Founding cast (AstraJax product loop)

| Slug | Character | Hero today |
|------|-----------|------------|
| `clive-wigglesworth` | Clive | legacy flat PNG |
| `pam-portiscue` | Pam | **pending** — folder ready |
| `doc-albright` | Doc | legacy flat PNG |
| `professor-iris-mortimer` | Iris | legacy flat PNG |
| `vera-vinegar-toes` | Vera | legacy flat PNG |
| `halvard-bjornson` | Hal (Prof. Halvard Bjornson) | **rough direction** — `art/` pack + `animations/tower-loop.mp4`; Blob mirror `halvard-bjornson/` |

Extended DS fleet characters (Juan, Marcel, KK, Reggie, Marlowe, Tashi) use the same layout when they get animations.

**Homepage founding-cast hero** — asymmetric wall in `FoundingCastHero.tsx`: Clive centre, Doc column with Doc's Minions above Doc, Pam, Clive's Man, and Lazlo. The Doc/Clive/Pam entries still come from `foundingCastHeroTriptych()`.

## Naming

| Asset | Path | Notes |
|-------|------|-------|
| Hero still | `{slug}/hero.png` | PNG preferred; same aspect as existing cards (~16:9) |
| Animation | `{slug}/animations/{variant-id}.mp4` | H.264 MP4; kebab-case id |

Suggested animation variant ids (add only what you ship):

- `idle-loop` — default ambient loop
- `speaking-loop` — mouth/energy for chat surfaces
- `wave-in` — one-shot entrance (optional)

## Adding Pam (when Kathryn delivers)

1. Save the approved still as `pam-portiscue/hero.png`
2. Drop any loops in `pam-portiscue/animations/` (e.g. `idle-loop.mp4`)
3. In `website/src/lib/agent-cast-assets.ts`, set Pam's `heroStatus` to `"canonical"` and list animations under `animations: [{ id, file, purpose }]`
4. Mirror the same fields in `manifest.json` for this folder

No rename of Vera or Iris — Pam is a new character.

## Migrating legacy flat PNGs (optional)

When moving an existing root-level `{slug}.png` into `{slug}/hero.png`:

1. Move the file (or copy and delete the flat file when ready)
2. Set `heroStatus: "canonical"` in `agent-cast-assets.ts` and `manifest.json`

Code resolves heroes via `castHeroSrc()` — no path strings scattered in components.

## Code registry

TypeScript source of truth: `website/src/lib/agent-cast-assets.ts`

```typescript
import { castHeroSrc, castAnimationSrc, castHeroByProduct } from "@/lib/agent-cast-assets";

castHeroSrc("clive-wigglesworth"); // → /agent-cast/clive-wigglesworth.png (legacy)
castHeroByProduct("pam");          // → undefined until hero is delivered
castAnimationSrc("clive-wigglesworth", "idle-loop"); // when registered
```

## Not in this folder

- **Journey talk clips** — `website/public/video/journey-clips/` (Matthew's Butternut story)
- **Fleet montage video** — `website/public/video/direct-sales-agent-cast.mp4` (all characters together)
