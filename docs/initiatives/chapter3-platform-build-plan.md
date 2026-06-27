# Chapter 3 — The Downstream Loop: Design, Deploy, Dispatch, Adopt

**Status:** Working initiative (planned by Opus 4.8, 26 Jun 2026)
**Owner:** Matthew
**Source of truth:** `docs/business/architecture.md`
**Builds on:** Chapter 1 (intake → brain → Pam → approval → Doc filing) and Chapter 2 (Brain Health, Agent Bases, Coach, Court).

> Purpose: build the back half of the product loop the architecture describes but the site does not yet
> show. Chapter 1 makes the brain; Chapter 2 reviews its health and the fleet's character; **Chapter 3
> turns approved reasoning into a designed fleet, a deployable package, a governed dispatch board, and an
> adoption layer.** Planned by Opus 4.8; built by Composer under the same babysitting QA gates.

---

## 1. What this adds and why (grounded in architecture.md)

The product loop in `architecture.md` §5 runs intake → brain → challenge → approval → **Step 6 design the
fleet → Step 7 package and deploy → Step 8 celebrate and coach → Step 9 the brain learns**, with §9
defining Doc's production routing (Opus → Composer) and §11 the HyperAgent relationship. Steps 6, 7, the
people-side of 8, and the §9 routing are **not yet built**. Chapter 3 builds them as four surfaces:

| Surface | Route | Architecture anchor |
|---|---|---|
| **Fleet Design** (task-scoped agents; personality editable, competence locked) | `/fleet` | §5 Step 6; positioning §4A legibility-not-governance |
| **Package & Deploy** (HyperAgent-ready export; governed defaults; runtime as partner) | `/deploy` | §5 Step 7; §11; Rule 7 |
| **Doc Dispatch** (implementation-jobs board; approved brief → route → draft → publish) | `/dispatch` | §9 (esp. 9.1, 9.2, 9.5, 9.6); Rule 5/6 |
| **Adoption / Scorekeeper** (training, confidence, engagement leaderboard, XP) | `/adoption` | §5 Step 8 people-side; §12 KK Kingsford; Rule 8 |

Why this set: it completes the loop end to end, it does not duplicate any built surface, and the **Doc
Dispatch board is the most on-thesis surface we can show** — it is exactly the Opus → Composer routing
this very build ran through. AstraJax proving it runs the pattern it sells.

This is sized to match Chapters 1 and 2: four route surfaces, ~10–14 new components, new seeded-data
libraries, plus additive wiring.

---

## 2. Boundary and governance invariants (carried forward, unchanged)

- **Additive only.** Do not amend Chapter 1 or Chapter 2 components/pages. The only pre-existing files
  that may be edited, additively:
  - `src/components/FeatureHub.tsx` — add four new `live` entries with hrefs. No restyle.
  - `src/components/platform/PlatformNav.tsx` — add the four new routes to the sub-nav (it is the
    platform nav; new platform surfaces belong in it).
  - `src/app/globals.css` — APPEND a `/* ── Chapter 3 ── */` band. Do not edit earlier sections.
  Everything else is net-new. Do not modify `Nav.tsx`, the Chapter 1 components, the Chapter 2 shells,
  or `api/ask-clive/route.ts`.
- **Booth-safe + seeded.** Each surface renders from new `src/lib/platform/*` seed data (mirror the
  existing `lib/platform/*` and `lib/aie-demo/demo-data.ts` patterns). No live Airtable, no new API
  routes, no env requirements. Every promote/approve/publish/deploy/export action is a **human gate** that
  updates optimistic local state only — never auto-approve. Label each surface "Demo data. Actions update
  this session only, not live records."
- **No raw machinery in UI** (`rec…`/`tbl…`/`app…`/`fld…`/scope strings/`apd_…`). Plain language.
- **Coaching is not surveillance** (Rule 8) — applies hard to `/adoption`.
- **Personality editable, competence locked** (Step 6) — the spine of `/fleet`.
- **No Composer without an approved brief id; output lands in Draft; full paper trail** (§9.6) — the spine of `/dispatch`.
- **HyperAgent is a partner, not a competitor** (§11) — the framing of `/deploy`.
- **British English, no em-dashes.** Reuse brand tokens + existing classes; respect `prefers-reduced-motion`; `next/image` with `sizes`; focus-visible on all controls; tabular numerals on figures.

---

## 3. Surfaces in detail

### 3.1 Fleet Design — `/fleet`  (§5 Step 6)

Design task-scoped agents from an approved brain. Seeded roster uses the agents the Chapter 1 receipts
already name: **Forecast Coach, Event Staffing Advisor, Pricing Guardrail Checker**.

- Each agent shows two clearly-separated panels:
  - **Editable (personality):** name, avatar, tone, examples, team-facing personality. Make these feel
    editable (inputs/selects, optimistic local state).
  - **Locked (competence):** task scope, model/runtime requirement, write permissions, approval rules,
    source boundaries, safety guardrails. Visibly locked (lock affordance), not editable.
- Banner principle: **"The personality is editable. The competence is locked."** One line under it:
  character is how scope becomes legible for humans, not a replacement for governance.
- Human gate: **"Approve this fleet design"** (optimistic) → marks the agent design ready for packaging,
  with a paper-trail line. A link forward to `/deploy`.
- Seed data: `src/lib/platform/fleet.ts`.

### 3.2 Package & Deploy — `/deploy`  (§5 Step 7, §11, Rule 7)

Turn an approved agent design into a runtime-ready package.

- **HyperAgent-ready package view:** scoped tools, approval rules, trusted-context bindings, and the
  **governed defaults** the architecture mandates — `autoSaveMemories = false`, durable memory targets
  Airtable Agent/Trusted bases, runtime fetches at session start (Rule 7, §7 Runtime Memory).
- **Export package** (shows the package summary; no real file needed) and a clearly-**mocked** "Deploy to
  HyperAgent" success state. Label the mock honestly.
- **Partner framing:** "HyperAgent makes powerful agents possible. AstraJax makes them adoptable by the
  teams who know the work." Do not pitch against HyperAgent.
- Human gate before deploy; paper-trail line on export/deploy.
- Seed data: extend `src/lib/platform/fleet.ts` or add `src/lib/platform/deploy.ts`.

### 3.3 Doc Dispatch — `/dispatch`  (§9)

The production routing board — the meta-proof surface. Doc receives approved briefs and routes them.

- **Routing table** (§9.2): for each approved action, show the executor Doc picks — direct structured
  write (Airtable) | HyperAgent package | **Opus → Composer build** — and why.
- **Implementation-jobs board** (§9.5): a list of jobs with the status flow **Approved → Running →
  Draft ready | Needs review | Failed**, each with linked approved-brief reference (plain language, no raw
  ids), executor, and a diff/summary line. Human **"Publish to canonical"** gate on Draft-ready jobs.
- **Guardrails shown** (§9.6) as legible product copy: no Composer without an approved brief; structured
  writes skip Composer; output lands in Draft; brief + prompt + diff logged; Doc escalates, not guesses;
  users do not chat with Doc.
- This mirrors the exact Opus → Composer loop AstraJax just used to build Chapter 3. Make that legible:
  it is the agent-first-business proof (§9.8).
- Seed data: `src/lib/platform/dispatch.ts`.

### 3.4 Adoption / Scorekeeper — `/adoption`  (§5 Step 8 people-side, §12, Rule 8)

The people side of adoption, hosted by **KK Kingsford** (`/agent-cast/kk-kingsford.png`). Distinct from
`/brain/health` (which is the brain's maturity); this is the team's momentum.

- Adoption signals: training completion, prompt confidence, helpful-usage, safe sandbox practice,
  XP/levels, adoption momentum.
- **Engagement leaderboard — celebrate, never surveil** (Rule 8): team/positive categories only
  ("Sales completed the prompt sandbox", "Ops improved confidence this week"). Explicitly no individual
  ranking, no "who asked fewest questions". A short visible note that this is enablement, not monitoring.
- Tie to proof: link to the Butternut DS training hub (`TRAINING_HUB_URL` in `src/lib/site.ts`).
- Seed data: `src/lib/platform/adoption.ts`.

### 3.5 Wiring (additive)

- `FeatureHub.tsx`: add four `live` entries — Fleet Design (`/fleet`), Package & Deploy (`/deploy`), Doc
  Dispatch (`/dispatch`), Adoption (`/adoption`).
- `PlatformNav.tsx`: add the four routes so the platform sub-nav spans the whole loop.

---

## 4. Visual + motion direction

Reuse the established system: brand tokens (apricot/sage/cream/moss/parchment), Fraunces display, Space
Mono labels, `.card`, `.section-label`, `.status-pill`, `.btn-*`, `.platform-*`, `--color-apricot-text`
for small apricot text, focus-visible rings, tabular numerals, reduced-motion. Calm cream product
surfaces; `/dispatch` may use status pills (Approved/Running/Draft/Failed) in the existing pill palette.
Append all new CSS under a commented `/* ── Chapter 3 ── */` band.

---

## 5. Build slices (Composer)

One coherent Composer worker (`composer-2.5-fast`); four internally-parallel surfaces sharing
`FeatureHub.tsx` / `PlatformNav.tsx` / `globals.css`, so sequence those shared edits last.

1. Seed data: `lib/platform/{fleet,deploy,dispatch,adoption}.ts`.
2. `/fleet` — Fleet Design (editable vs locked, approve gate).
3. `/deploy` — Package & Deploy (HyperAgent package, governed defaults, mocked deploy).
4. `/dispatch` — Doc Dispatch (routing table, jobs board, publish gate, guardrail copy).
5. `/adoption` — Adoption / Scorekeeper (KK, leaderboard celebrate-not-surveil, proof link).
6. Shared wiring last: FeatureHub entries + PlatformNav links + globals.css Chapter 3 band.
7. Self-verify: `npm run build` and `npm run test:brain-key` green before returning.

---

## 6. Babysitting QA gates (same loop)

Composer builds; coordinator (Opus 4.8) dispatches the relevant readonly reviewers per surface, folds
findings into one Composer fix pass, then runs Pam + a11y/perf, then a final sweep.

- `/fleet` → Lazlo (agent personalities/voice) + Clive (personality-editable / competence-locked honest, no governance bypass) + Kathryn (look) + Doc (scope).
- `/deploy` → Doc (governed defaults, HyperAgent-as-partner, honest mock) + Clive (no overclaim of live deploy) + Kathryn.
- `/dispatch` → **Doc (primary — his surface: routing correctness, approved-brief-required, no orphan runs, output-to-Draft, paper trail)** + Clive (governance) + Kathryn.
- `/adoption` → **Clive (primary — coaching-not-surveillance, Rule 8)** + Lazlo (KK Kingsford voice) + Kathryn (KK look).
- Final → `web-design-guidelines` + `vercel-react-best-practices` (a11y/perf), then **Pam** skeptic gate before any deploy.

---

## 7. Model routing

Plan: Opus 4.8 (reasoning). Build: Composer (`composer-2.5-fast`). QA: reviewer personas (readonly).
Per `.cursor/rules/model-routing.mdc`.

## 8. Out of scope (do-not-build)

Auth, billing, multi-tenant, real HyperAgent sync/deploy, live job execution, real Composer dispatch from
the UI, live analytics, live Airtable writes. All mocked/seeded and labelled. Do not modify Chapter 1/2
components or `Nav.tsx`. The Chapter 1 → platform spine link remains a narration choice, not a code change.

## 9. Post-build stretch (captured, not built now)

1. Wire `/dispatch` to a real `implementation_jobs` table behind the Brain Key governance.
2. Real HyperAgent export from `/deploy` via the existing `hyperagent/builds/build_*.py` generator.
3. Live adoption signals from real training/usage data.

## 10. Verification

`cd website && npm run dev`; walk `/fleet`, `/deploy`, `/dispatch`, `/adoption`; confirm hub + PlatformNav
route correctly; no raw identifiers on surfaces; every action is a human gate; leaderboard celebrates
teams not individuals; `npm run build` and `npm run test:brain-key` green before deploy.
