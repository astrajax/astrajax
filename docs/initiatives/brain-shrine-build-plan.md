# Brain Shrine — Build Plan

**Status:** Plan (1 Jul 2026) — awaiting Matthew go-ahead to start Phase 1.
**Owner:** Matthew.
**Origin:** Replaces the dashboard-style brain governance entry (`/brain/health`, `/brain/review`) with a warm single-brain "shrine" built on Matthew's creative (brain-in-a-jar in a library). Interaction pattern pinched from the DS `bot-fleet` extension (Fleet → card → detail), re-expressed in Next.js + Tailwind and the site's cream/apricot palette.
**Read with:** [`architecture.md`](../business/architecture.md) §6 (brain maturity, context health, context access), [`brain-key-wiring.md`](./brain-key-wiring.md), [`brain-upkeep.md`](./brain-upkeep.md), [`chapter1-workbench-build-plan.md`](./chapter1-workbench-build-plan.md).

---

## 1. What we're building

A single-brain **shrine** as the entry to context governance:

- One brain "jar" on stage at a time, with `‹ ›` arrows to move between brains.
- A **status cartouche** showing the brain's **health** (rotten → thriving).
- `LAST AUDIT` and `FLAGS` plates wired to real signals.
- A **gold nameplate** at the bottom — displays the brain name, or becomes a **live text field** when creating a new brain.
- An **Enter** action that opens that brain's **governance workspace**.

```text
Build-a-Brain book ─┐
                    ├─▶  /brain   (shrine: one jar, ‹ › arrows, health cartouche,
Clive's Man portrait ┘             LAST AUDIT / FLAGS plates, gold nameplate)
                                   │                        │
                          Enter this brain          ＋ New brain
                                   ▼                        ▼
                        /brain/[slug]            gold plaque → type name (live)
                        governance workspace      → /chapter-1?book=brain-building&newBrain=<name>
                        (tabbed)                    (Chapter 1 = create-a-new-brain path)
```

## 2. Locked decisions (from Matthew, 1 Jul 2026)

1. **Enter target:** dedicated, shareable route `/brain/[slug]` (not an in-place panel).
2. **Old routes:** fold `/brain/health` + `/brain/review` into the workspace; keep the old paths as **redirects**.
3. **Status cartouche = health**, not maturity, for now. Five bands: **rotten · unhappy · okay · happy · thriving**. (Maturity ladder still lives inside the workspace Overview tab.)
4. **Chapter 1 becomes the "create a new brain" path** launched from the shrine. The **bottom gold plaque is where a new brain is named** — a live editable field; the typed name carries into Chapter 1.

## 3. Routes & information architecture

| Route | Purpose | Notes |
|---|---|---|
| `/brain` | The shrine (new) | Cycles brains; `Enter` → workspace; `＋ New brain` → name on plaque → Chapter 1 |
| `/brain/[slug]` | Per-brain governance workspace (new) | Tabs via `?tab=` |
| `/brain/health` | **Redirect** → `/brain/{defaultSlug}?tab=overview` | Fold-in |
| `/brain/review` | **Redirect** → `/brain/{defaultSlug}?tab=review` (preserve `?view=`) | Fold-in |

**Workspace tabs** (`/brain/[slug]?tab=`):

| Tab | Source today |
|---|---|
| `overview` | `BrainHealthShell` overview (maturity ladder, efficiency credit, metrics, leaderboard, recent level-up) + **new health band** |
| `truths-memories` | `BrainHealthShell` truths + memories promote/retire gate |
| `review` | `InteractionReviewShell` (needs-review shortlist, scoring, upkeep actions) |
| `context-health` | `BrainHealthShell` context-health (importance mix, risk tolerance, retire queue) |
| `paper-trail` | Change-log / paper-trail lines (already modelled in `brain-health.ts` `PaperTrailLine`) |

`defaultSlug = northline-field-ops` (matches `DEFAULT_BRAIN_HEALTH.brainSlug`).

## 4. Entry-point wiring

- **Build a Brain book** — `CliveStudyHub.tsx` `brain-building` hotspot currently routes to `/chapter-1?book=brain-building` via `CliveStudyRoom.tsx`. Repoint the `brain-building` book to `/brain` (the shrine). Chapter 1's brain-building step is reached *from* the shrine's `＋ New brain` action instead.
- **Clive's Man portrait** — add an "Enter the brains" action on `agents/[slug]` for `clive-man` (and optionally the roster card in `AgentBasesShell.tsx`) → `/brain`. (`clive-man` has no portrait asset yet in `agent-bases.ts`; entry action works regardless; portrait asset is a follow-up.)
- Update `rooms.ts` Pam/Clive station links (`/brain/health`, `/brain/health#context-health`, `/brain/review`) to the new workspace tabs.

## 5. Component tree

**New — `website/src/components/brain/`:**

- `BrainShrine.tsx` — the stage. Creative backdrop, `‹ ›` arrows, `StatusCartouche`, `LAST AUDIT`/`FLAGS` plates, `BrainNameplate`, `Enter` + `＋ New brain` actions. Keyboard: `←/→` move, `Enter` open, `Esc` leave. Overlays positioned by percentage over the art (same technique as `CliveStudyHub` `BOOK_HOTSPOTS`).
- `BrainJar.tsx` — presentational jar/hero; optional glow tinted by health band.
- `StatusCartouche.tsx` — the health word + colour.
- `BrainNameplate.tsx` — display name (view) / controlled text input (create).
- `BrainWorkspace.tsx` — tabbed shell for `/brain/[slug]`; renders the folded-in sections.

**New pages:**

- `website/src/app/brain/page.tsx` → `BrainShrine`.
- `website/src/app/brain/[slug]/page.tsx` → `BrainWorkspace`.

**Refactors (no rewrite — lift into tabs):**

- `BrainHealthShell.tsx` → split its three tabs into workspace-mountable sections; add health band to overview.
- `InteractionReviewShell.tsx` → mount as the `review` tab (it already reads `?view=`).
- `app/brain/health/page.tsx`, `app/brain/review/page.tsx` → thin redirects.

**Pinched from `bot-fleet` (re-expressed in Tailwind + site tokens):** `Section` block, one `Pill` + typed wrappers, KV grid + "+N more" collapse, collapsible long text (canonical truth), value→colour helper (→ `healthColor`), and the CSS finish (hover lift+glow, focus-visible ring, scroll-lock, `prefers-reduced-motion`, scrollbar polish). **Not** pinched: navy/gold palette, Airtable-SDK hooks, inline-style theming, `App.tsx`/`index.tsx` bootstrap.

## 6. Data model & sources

**Brains list (new seed) — `website/src/lib/platform/brains.ts`:**

```ts
export type BrainHealthBand = "rotten" | "unhappy" | "okay" | "happy" | "thriving";

export interface BrainShelfEntry {
  slug: string;
  name: string;
  theme: string;            // sector / domain
  maturityLabel: string;    // from the six-level ladder
  healthBand: BrainHealthBand;
  lastAuditAt: string | null;
  flagsCount: number;       // needs-review shortlist count
  jarArtSrc: string;
}
```

Seed 3–5 brains for continuity with existing copy: **Northline Field Ops**, **Pricing Guardrails**, **Forecast Coach** (both already named in `DEFAULT_BRAIN_HEALTH.leaderboard`), **AstraJax Chapter 1**. Later: `/api/brains/list` reading the Brain Registry base replaces the seed.

**Per-brain workspace:** existing `brain-health.ts` snapshot + `/api/brains/interactions/list` + `/api/chapter1/draft-truths` + Doc promote — **memory-mode fallback preserved**. No new write powers; promote stays human-gated via `BRAIN_DOC_PROMOTE_TOKEN`.

## 7. Health cartouche spec

Five bands, derived from **real signals** (honest, coarse — not a precise meter). New helper `deriveHealthBand(metrics, flagsCount)` in `brains.ts`:

```text
score = 100
  − contradictionCount        × 12
  − answerFailureRate(points) × (worsening 1.5 | stable 1.0 | improving 0.5)
  − staleRecordCount          × 3
  − knownGaps.length          × 4
  − flagsCount                × 5
  − (signOffCurrent ? 0 : 10)

thriving ≥ 85 · happy 70–84 · okay 50–69 · unhappy 30–49 · rotten < 30
```

Start seeded (each `BrainShelfEntry.healthBand`); switch to `deriveHealthBand` once metrics are wired. **Pam note:** the cartouche is a mood read from signals, not autonomy — human review still governs; don't imply "thriving" means the brain can act unsupervised.

**Health tokens** (add to `@theme` in `globals.css`, warm/library-consistent):

```text
--color-health-rotten:   #a23e2a   (rust)
--color-health-unhappy:  #c9732f   (burnt apricot)
--color-health-okay:     #c9a54e   (buttermilk gold)
--color-health-happy:    #8a9a6a   (sage)
--color-health-thriving: #5f7a43   (deep sage)
```

## 8. Gold plaque (naming) spec

- **View mode:** shows `brain.name` (read-only; inline rename is a later, governed follow-up).
- **Create mode** (`＋ New brain`): plaque becomes a controlled text input — placeholder "Name your brain…", live typed value. Confirm (Enter / tick) → route `/chapter-1?book=brain-building&newBrain=<encodeURIComponent(name)>`.
- **Chapter 1** reads `newBrain` and seeds the business-brain name/`clientName`. (`AieDemoShell` / `hub-books.ts` `stepForBook('brain-building')`.)
- **Honest caveat:** naming here does **not** create a Trusted base. Persisting a new brain to Registry/Workshop is a later human-gated Doc step; Phase 1–2 carry the name into the build only.

## 9. Theming & CSS

- New `.brain-shrine*` block in `globals.css`: full-bleed stage, percentage-positioned plate overlays, arrow buttons, nameplate field, cartouche, `Enter`/`New brain` controls — all in cream/apricot/parchment + the five health tokens.
- Pinched finish: `.brain-card:hover` lift+glow (apricot, not navy), focus-visible ring, `prefers-reduced-motion`, scrollbar polish.
- **Art:** copy the creative to `website/public/brain/shrine-stage.png`. Phase 1 overlays live text over the baked-in plates; **follow-up:** commission a **plate-free variant** so `THRIVING`/`LAST AUDIT`/`FLAGS`/nameplate are entirely live UI.

## 10. Accessibility & motion

- Arrows and jar are real buttons; `←/→` cycle, `Enter` opens, `Esc` exits; visible focus rings.
- Cartouche colour is paired with the **word** (never colour alone).
- `role="tablist"`/`tab` on the workspace tabs; deep-linkable via `?tab=`.
- Honor `prefers-reduced-motion` (no jar float / card lift).

## 11. Phased delivery

**Phase 1 — Visual (mock, no new API)**
- `brains.ts` seed + `BrainHealthBand` + `deriveHealthBand` (used with seed).
- `BrainShrine`, `BrainJar`, `StatusCartouche`, `BrainNameplate`; `app/brain/page.tsx`.
- Health tokens + `.brain-shrine*` CSS; copy art to `public/brain/`.
- Plaque create-mode + `＋ New brain` → Chapter 1 with `newBrain`.

**Phase 2 — Workspace + fold-in**
- `BrainWorkspace` + `app/brain/[slug]/page.tsx` with tabs.
- Refactor `BrainHealthShell` sections + mount `InteractionReviewShell` as `review`.
- Redirect `app/brain/health` + `app/brain/review`; update `rooms.ts` links.
- Wire tabs to `/api/brains/*` + `brain-health.ts` (memory-mode preserved).

**Phase 3 — Entry wiring**
- Repoint `brain-building` book → `/brain`.
- Add "Enter the brains" from Clive's Man (`agents/[slug]`, roster card).
- Chapter 1 reads `newBrain` and seeds the build.

**Phase 4 — Live brains list + polish**
- `/api/brains/list` from Brain Registry; drop the seed.
- Plate-free art variant; Clive's Man portrait asset; a11y/motion pass.

## 12. Out of scope / honest caveats

- No new write powers; **promote stays human-gated** (Doc token). Naming ≠ creating a Trusted base.
- Health is a **coarse 5-band read** from real signals, not a precise meter (the 0–100 meter stays deferred per `brain-upkeep.md`).
- Brains list is **seeded** until Phase 4.
- Don't present seeded values as live data on the cartouche/plates until wired.

## 13. Skills and review gates

Not every repo skill — only what this build touches. Same panel pattern as [`chapter2-platform-build-plan.md`](./chapter2-platform-build-plan.md) §6.

**Build lane:** `doc-vercel-minion` (primary `website/` executor), `vercel-react-best-practices` (tabs/refactors/fetch), `web-design-guidelines` (a11y, focus, reduced motion).

**Design lane (before Phase 1):** `frontend-design` (shrine direction, one signature element), `kathryn-goodchild` (creative fidelity, brand colours, plate positioning).

**Governance reviewers (readonly):** `clive` (health/maturity honesty, coaching-not-surveillance), `clive-man` (portrait entry + upkeep alignment), `doc` (scope, no new writes, seeded vs live).

**Deploy gate:** `pam` / `pam-decision-gate` — mandatory before merge/deploy.

**Out of scope:** `doc-brain-base-builder`, `lazlo-marlowe-*`, `canvas`, plugin skills unless doc-vercel-minion hits a gap.

Cursor plan mirror: `.cursor/plans/brain_shrine_2fb45164.plan.md` §Skills and review gates.

## 14. Agents (Cursor subagents + cast reviewers)

Skills = how; agents = who. Panel pattern matches [`chapter2-platform-build-plan.md`](./chapter2-platform-build-plan.md) §6.

**Orchestration:** `@doc` triages to **doc-vercel-minion** (Composer executor, Phases 1–4).

**Readonly reviewers (after each phase):**

- **kathryn-goodchild** — Phase 1: shrine creative fidelity (plates, cartouche, nameplate, brand).
- **clive** — Phases 1–2: governance honesty (health ≠ permission, seeded vs live, coaching-not-surveillance).
- **clive-man** / **clive-man-challenger** — Phase 3: entry wiring + upkeep alignment.
- **bugbot** — Phase 2 (+ optional 4): diff review on fold-in refactors.
- **pam** — mandatory before merge/deploy.

**As needed:** `shell` (build/test), `explore` (readonly wiring discovery), `deployment-expert` (Vercel), `performance-optimizer` (Phase 4), `ci-investigator` (failed PR only).

**Skip:** doc-brain-base-builder, clive-man-proposer/executor, lazlo-marlowe-*, security-review, ai-architect.

Full agent map + parallel dispatch diagram: `.cursor/plans/brain_shrine_2fb45164.plan.md` §Agents.

## 15. On build (follow-ups)

- Add `SRC-AJ-BRAIN-SHRINE` to `docs/context/source-registry.md`.
- Note the `/brain` + `/brain/[slug]` routes in `website/README.md`.
