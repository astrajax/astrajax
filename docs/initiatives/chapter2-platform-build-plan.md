# Chapter 2 — Platform Surfaces Build Plan

**Status:** Working initiative (planned by Opus 4.8, 26 Jun 2026)
**Owner:** Matthew
**Source of truth:** `docs/business/architecture.md`
**Builds on:** the Chapter 1 "Clive's World" run (portrait entry, study, streaming Clive/Pam, paper trail, feature hub, global launcher).

> Purpose: add the next chunk of the platform — the core feature surfaces `architecture.md`
> describes that the first run advertised as "coming." This plan is reasoned by Opus 4.8;
> the build is dispatched to **Composer** under the same babysitting QA gates used in Chapter 1.

---

## 1. What this adds and why (grounded in architecture.md)

The Chapter 1 feature hub (`website/src/components/FeatureHub.tsx`) already promises four surfaces as
"coming." This build makes them real, plus the one high-stakes pattern the architecture treats as a
flagship idea (Court Mode). Each surface maps directly to a numbered section of `architecture.md`:

| Surface | Route | Architecture anchor |
|---|---|---|
| **Brain Health Meter** (maturity, metrics, efficiency credit, celebrate-not-surveil leaderboard) | `/brain/health` | §5 Step 8 "Celebrate and Coach"; §7 maturity metadata |
| **Agent Bases review** (fleet roster + tiered character context + provenance gate + persona conversation review) | `/agents`, `/agents/[slug]` | §7 "Tiered Character Context" + "Agent Authoring Surface"; §4.6; Rule 7 |
| **User Brain + Coach Whit** (competency map, Clive/Pam calibration, prompt coaching) | `/coach` | §5 Step 0; §7 "User Brain"; §12 Coach Whit |
| **Court Mode** (multi-perspective high-stakes panel; human gives judgement) | `/court` | §3A; §5 Step 3A; Rule 4 |

This is deliberately a "similar size" to Chapter 1: ~4 new route surfaces, ~10–14 new components,
new seeded data libraries, plus additive hub wiring. It is improvisation **grounded** in the doc, not
new scope: every screen is something `architecture.md` already specifies.

**Non-negotiable boundary — do not amend the Chapter 1 work.** The Chapter 1 experience
(`components/chapter1/*`, `AieDemoShell.tsx`, `api/ask-clive/route.ts`, the Chapter 1 CSS sections,
the launcher) is signed off. The build is **additive only**. The two pre-existing files the worker may
touch, and only additively:

- `FeatureHub.tsx` — flip the relevant entries from `coming` → `live`, add the `href`, add a Court Mode entry. No restyle of the hub.
- `globals.css` — **append** new style sections for the new surfaces. Do not edit existing Chapter 1 / study / launcher styles.

Everything else is net-new files. Do **not** modify `Nav.tsx`; cross-link the new surfaces to each
other and rely on the feature hub for discovery.

---

## 2. Governance invariants (carried from Chapter 1, unchanged)

These hold on every new surface. They are the product, not decoration:

- **Agents propose, humans approve.** Nothing becomes trusted/canonical without a human gate (Rule 1).
- **Booth-safe + honest.** Surfaces render from seeded data in `lib/platform/*` (mirrors the Chapter 1
  `lib/aie-demo/demo-data.ts` pattern). No live Airtable writes are required to demo. Where a surface
  shows a "promote / approve / retire" action, it updates **optimistic local state** only (like the
  Chapter 1 promote), and is clearly the human gate — never an auto-approve.
- **No raw machinery in the UI.** No `rec…` IDs, `tbl…`/`app…` IDs, `fld…` IDs, scope strings, or
  `apd_…` identifiers on the main surfaces. Plain language. (IDs may exist in seeded data objects but
  must not render as user-facing copy.)
- **Coaching is not surveillance** (Rule 8). Leaderboards celebrate brains/teams, never rank individuals.
- **Maturity is earned by human review, not agent confidence** (§7).
- **The paper trail matters** (Rule 9): any state-changing action shows source, approver, reason, timestamp.

---

## 3. Surfaces in detail

### 3.1 Brain Health Meter — `/brain/health`

Make the boring layer feel like progress (§5 Step 8). Client-rendered, seeded.

- **Maturity ladder** (the six levels, §5 Step 8): Seedling → House-Trained → Working → Sharp → Trusted
  → Elder. Show current level, what it means, and **next-level requirements**.
- **Metrics panel** (§7 maturity metadata): QA pass count, approved record count, draft count, stale
  record count, known gaps, contradiction count, answer failure rate (trending down), last reviewed,
  confidence by domain.
- **Brain Efficiency Credit** (§5 Step 8): current credit %, the maturity→credit table, and the
  eligibility rules (sustained 30 days, gaps below threshold, contradictions low, failure rate
  improving, sign-off current). Frame as **shared economics** ("better context makes AI cheaper, safer,
  more useful"), explicitly **not** a schoolroom discount.
- **Celebrate-not-surveil leaderboard** (Rule 8): cleanest brain, most improved, fastest stale cleanup,
  best evidence coverage — at brain/team level. Never individuals.
- **Level-up celebration card** ("Working Brain → Sharp Brain — reason: 3 QA passes, 42 approved
  records, no unresolved contradictions").
- **Truths + Memories review tab** (§7 + §9 Step 9): a light read of Brain Truth rows and Brain Memories
  for this brain, with a human-gated "promote memory → Brain Truth" action (optimistic). This satisfies
  the hub's "Brains — memories review" promise without a second route.
- Seeded data: `website/src/lib/platform/brain-health.ts`.

### 3.2 Agent Bases review — `/agents` and `/agents/[slug]`

The durable memory + character model lives in Airtable Agent bases (§7, Rule 7). This surface reviews it.

- **Fleet roster** (`/agents`): the four Chapter 1 agents — Clive, Pam, Doc, Clive's Man — as cards with
  portrait where one exists (`public/agent-cast/clive-wigglesworth.png`, `doc-albright.png`; Pam and
  Clive's Man use a tasteful nameplate placeholder), one-line role, and brain/maturity chips.
- **Agent detail** (`/agents/[slug]`), the tiered character context (§7 "Tiered Character Context"):
  - **Tier 1 — Super Objective:** one selfish sentence. Always-injected, highest priority.
  - **Tier 2 — Known Truths:** the fixed five slots — (1) formative memory, (2) secret, (3) baseline
    relationship stance, (4) greatest fear, (5) inner attitude. Capped at five.
  - **Tier 3 — Persona Memories:** limitless, retrieved on demand, each linked to exactly one Known
    Truth slot; shows how the character **develops**.
  - **Persona Config** summary in plain language (role, output shape) — no raw prompt dump, no IDs.
- **Provenance gate** (§7 "Write-with-approval gate"): Tier 1/2 records show a **Pending** badge with a
  human-only **"Promote to canonical"** action; Tier 3 memories show **Active** (auto-formed) with a
  **"Retire"** action. Promotion/retire updates optimistic local state and writes a paper-trail line.
- **Persona conversation review:** recent interactions for the agent (reuse the `InteractionSummary`
  shape; seed a few), so "conversation review" from the hub is real, with a link through to
  `/brain/review` for scoring.
- Seeded data: `website/src/lib/platform/agent-bases.ts`. Use the real cast facts from
  `docs/initiatives/character-provenance.md` where helpful, but keep it light and seeded.

### 3.3 User Brain + Coach Whit — `/coach`

The system adapts to the human before the human adapts to the system (§5 Step 0).

- **User-brain competency map:** the architecture's domains (AI/prompting, context environments, system
  architecture, coding, commercial/forecasting, data/evidence, team leadership, domain-specific), each
  scored new / comfortable / expert / prefer-not-to-say, editable, with optional notes.
- **Live calibration view:** render the §5 Step 0 table — show, for the current scores, how Clive's pace
  and Pam's sensitivity change. Make the link between "who you are" and "how the system treats you"
  legible.
- **Coach Whit prompt coaching** (§12, downstream of the user brain): a short prompt-practice panel with
  calibrated feedback (seeded coaching tips keyed off the weakest domains). Framed as **enablement**, not
  surveillance. Manager-set coaching flags shown read-only (same signal family as Coach Whit).
- Booth-safe: coaching feedback is seeded; do **not** modify `api/ask-clive/route.ts`. (A live "Coach
  Whit" persona is a post-build stretch noted below.)
- Seeded data: `website/src/lib/platform/user-brain.ts`.

### 3.4 Court Mode — `/court`

The high-stakes branch at the human gate (§3A, Step 3A, Rule 4). Full-Story-Mode court scene.

- **Decision under review:** a seeded high-stakes example (e.g. "Approve the off-script discount
  guardrail for trusted context?").
- **Role-based takes:** Clive (upside/adoption), Pam (risk/weak assumptions), Doc (implementation cost,
  action readiness), Iris (evidence quality, `professor-iris-mortimer.png`), Vera (stakeholder reaction,
  narrative risk, `vera-vinegar-toes.png`), Judge (summarises; does **not** decide).
- **Human gives judgement:** the user records their decision (approve / not yet / send to another human).
  Doc "executes" only after judgement is recorded — show the paper-trail line. Make the rule explicit:
  *the Court surfaces perspectives; the human gives judgement.*
- Seeded data: `website/src/lib/platform/court.ts`. (Live multi-persona Claude is a post-build stretch.)

### 3.5 Feature hub + cross-links (additive wiring)

- In `FeatureHub.tsx`: flip to `live` with hrefs — Brain health (`/brain/health`), Agent Bases review
  (`/agents`), User Brain coaching (`/coach`); fold "Brains — memories review" into the health route;
  add a new `live` **Court Mode** entry (`/court`). Leave "health meter" honest — it is now live.
- Cross-link the four new surfaces with a small shared "Platform" sub-nav header component
  (`components/platform/PlatformNav.tsx`) so they are navigable without touching `Nav.tsx`.

---

## 4. Visual + motion direction (reuse, don't reinvent)

- Reuse the brand tokens already in `globals.css` (apricot / sage / cream / moss / parchment, Fraunces
  display, Space Mono labels). Reuse `.card`, `.section-label`, `.status-pill`, `.btn-*` and the
  `feature-hub-card` patterns.
- Health, Coach, Agents read as calm **cream product** surfaces (like `/brain/review`). Court Mode may
  borrow a touch of the **moss study** warmth for the scene, but cap cinematics — one tasteful entrance,
  no per-role animation rabbit-hole.
- New CSS is appended to `globals.css` under a clearly-commented `Chapter 2` band. Respect
  `prefers-reduced-motion`.

---

## 5. Build slices (Composer)

Dispatched to **Composer** (`composer-2.5-fast`) as one coherent worker; the four surfaces are
internally parallelizable but share `globals.css` + `FeatureHub.tsx`, so the worker sequences those
shared edits to avoid contention.

1. **Platform scaffolding:** `lib/platform/*` seeded data + `components/platform/PlatformNav.tsx` + appended `globals.css` Chapter 2 band.
2. **Brain Health Meter** (`/brain/health`) incl. truths/memories review tab.
3. **Agent Bases review** (`/agents`, `/agents/[slug]`) incl. provenance gate + persona conversation review.
4. **User Brain + Coach Whit** (`/coach`).
5. **Court Mode** (`/court`).
6. **Hub wiring + cross-links** (flip coming→live, add Court entry).
7. **Self-verify:** `npm run build` and `npm run test:brain-key`; fix anything red before returning.

---

## 6. Babysitting QA gates (same loop as Chapter 1)

Composer builds; the coordinator (Opus 4.8) then dispatches the relevant reviewer persona(s) per slice,
folds findings back to a Composer fix pass, and re-checks. Reviewers are readonly.

**The panel (Cursor-native reviewers):**

- **Doc** (`.cursor/skills/doc/SKILL.md`) — scope, do-not-build, no-fake-screens, additive-only discipline.
- **Clive** (`.cursor/skills/clive/SKILL.md`) — governance feel + honesty: maturity earned not claimed, promote gates real, coaching-not-surveillance, no overclaimed features.
- **Lazlo Marlowe** (`.cursor/skills/lazlo-marlowe-*`) — character truth: Super Objective + five Known Truths shape, six Court voices distinct, Judge does not decide.
- **Kathryn Goodchild** (`.cursor/skills/kathryn-goodchild/SKILL.md`) — visual identity: roster, court scene, brand fidelity.
- **`review-animations`** — only if Court adds a real motion beat.
- **Pam** — not a per-slice reviewer; she is the **skeptic gate before any deploy** (mandatory).

**Slice → reviewer map:**

- Slice 2 Brain health → Kathryn (look) + Clive (honest maturity/credit, no surveilling leaderboard) + Doc (scope, no fake live data).
- Slice 3 Agent bases → Lazlo (character truth/voice) + Kathryn (roster look) + Clive (provenance gate honest).
- Slice 4 Coach → Clive (coaching-not-surveillance; user-brain honest) + Lazlo (Coach Whit voice) + Kathryn (look).
- Slice 5 Court → Lazlo (six distinct voices, Judge abstains) + Kathryn (court scene) + Clive (human-gives-judgement governance).
- Slice 6 hub/wiring → Doc (honest live/coming, no fake screens) + `web-design-guidelines` (a11y).
- Final → `web-design-guidelines` + `vercel-react-best-practices` (a11y/perf), then **Pam** at the deploy gate.

---

## 7. Model routing (per `.cursor/rules/model-routing.mdc`)

- **This plan:** Opus 4.8 (reasoning lane). ✔
- **The build:** Composer (`composer-2.5-fast`) — mechanical execution on an approved plan.
- **QA gates:** the reviewer personas (their own lanes), readonly.
- **Runtime conversation** (if any live wiring is added later): Claude, as in Chapter 1.

---

## 8. Out of scope (do-not-build)

Auth, billing, multi-tenant, real HyperAgent sync, live analytics ingestion, automatic deployment,
live client data, and any live Airtable writes from these surfaces. Anything tempting becomes a
seeded paper-trail line, not a live integration. Do not modify Chapter 1 components, the ask-clive
route, or `Nav.tsx`.

## 9. Post-build stretch (captured, not built now)

1. Live **Coach Whit** persona on `/api/ask-clive` (new persona + guardrails), calibrated to the user brain.
2. Live multi-persona **Court Mode** (each role a Claude call), still human-judged.
3. Wire Brain Health + Agent Bases to read real Airtable rows (Trusted Brain + Agent bases) behind the existing Brain Key governance, once `BRAIN_KEY_USE_MEMORY=false` with real tokens.

## 10. Verification

`cd website && npm run dev`; walk `/brain/health`, `/agents`, `/agents/[slug]`, `/coach`, `/court`;
confirm hub entries are live and route correctly; confirm no technical identifiers render on the main
surfaces; confirm every promote/approve/retire is a human gate; `npm run build` and
`npm run test:brain-key` green before deploy.
