# AstraJax — Working Context for AI

> Purpose: give any AI assistant the background it needs to help with AstraJax
> without re-explaining who Matthew is or what the business does.
> Living business notes live in Airtable trusted brains. Start at the Brain Registry → System Brains (https://airtable.com/appbdTVHevH6Bl5ZZ/tblAUtpgSjtKf3BBr) — which trusted brain for this context, then go to the trusted base that row names. Household Register → Estate Bases (https://airtable.com/appPrpfvsAr71RPP3/tblWygUeD4Qo8vq4s) — which physical Airtable base is which. Do not hardcode one brain. Origin holds code and this door sign. Files under docs/business/ are leftover copies until they move. Do not update claims in Origin.

## Who Matthew is (founder)

- Non-technical commercial leader. Ex-professional actor (trained at RADA, lead role in major network TV pilot, West End stage, speaking role in ITV Broadchurch alongside David Tennant & Olivia Colman), then Butternut Box (employee #33) → London Team Leader → **Head of Sales** (reference as **Director of Sales** externally — Butternut-sanctioned).
- **Career velocity:** actor → Head of Sales at a confirmed unicorn in **seven years** (by July 2026). Same engine as the AstraJax thesis — steep learning curve, deep domain context, compounding fast. Use as capability evidence for investors, not a title flex.
- Edge: deep domain context in messy, large-scale commercial operations **plus**
AI fluency — not engineering. He builds with AI on top of clean data.
- **Has never handwritten a line of code.** Entirely AI-assisted, he's shipped
production software at scale. This is the living proof of the AstraJax thesis —
lead with it, never apologise for it.
- **Timeline (get this right):** ~12 months on the "boring layer" — data cleaning
and system-architecture decisions, little/no code. *Then* the build moved fast:
~556 files of custom interfaces in roughly a month, first agent fleet in two
weeks. The point is the sequencing — the foundation year is what made the
month-long build possible. (Talk track: *"that speed was only possible because
the foundation was already there."*)
- Building AstraJax as an **owned venture** (legacy, a team, leverage), not a job.

## Flagship proof point — Butternut Box

Matthew's role at Butternut was **Head of Sales** (Director of Sales for external reference). The documented operating-layer proof below is scoped to the **Direct Sales channel** — the field-sales function he built and governed.

The Butternut Box Direct Sales story is the canonical proof of the AstraJax thesis: working with AI on top of cleaned operational data, Matthew solo-built a production operating layer for the Direct Sales channel — an £8m p/y commercial function with a 120 headcount. Real adoption pressure.

> From Gmail, WhatsApp, Notion, and Google Sheets to an operating system.

**Canonical numbers (use these):**

- Channel spend: **£8.1m**, across 3 P&Ls (UK, Ireland, sister cat brand).
- Acquisitions: **~64k (2026 target)**, compounding to **70k+ (2027)**.
- Team: **~15 office FTE + ~90 field salespeople** (2026 plan).
- Labour-model shift: BA-heavy → rep-led; **~29% higher rep SPS**; shift
fulfilment **90% → 79%** under the old model, **96% target** under the new one.
- Systems impact: **~£180k/yr travel saved**, **~3,000 hrs/yr capacity** at scale.
- Sequencing: **~12-month "boring layer" foundation → first agent fleet in 2 weeks.**
- Agent design pattern (the "Trinity"): link → propose → **human approves** → execute.

> Note: Matthew's talk track uses rounded, company-scale figures for narrative
> (e.g. "1,500 staff, 120 sellers, 7 markets"). The numbers above are canonical
> for the Direct Sales channel; prefer them in any factual/written deliverable.

## What Matthew has actually built (engineering proof)

Shipped production software, **100% AI-built** (Matthew writes none of the code by
hand) — not slideware. **~9 Airtable Interface Extensions, ~556 TypeScript/React
files** (React 19 + Airtable Blocks SDK). The code itself was built in roughly a
month — *after* ~12 months of data cleaning and system architecture that made
that speed possible (see timeline above).
Repo: `mphopkinson92/ds-platform` (local: `~/ds-platform/Interface_Extensions`).

- **Role-specific interfaces** (proves "the system shows you only what your role
needs"): EC Period, RM Staffing, Salesperson, Performance Analysis (leadership),
DS Pay — each persona-scoped.
- **Agent ops layer:** Bot Fleet — agent roster, feedback → fix → Cursor pipeline,
training analytics + engagement leaderboard (gamified adoption).
- **International scale:** an Italy variant (€, simpler schema) — proof the model ports.
- **Data governance:** dual-lens (Operational vs Reporting) numbers that never blend,
weighted-average rules, audit/sign-off pipelines, field-ID single-source-of-truth.
- **Human-in-the-loop everywhere:** AI scrape + status-gate pills (Pending →
Confirmed → Lock); agents propose, humans approve (the "Trinity" pattern).
- **Embedded AI:** "Uncle Clive" CPA calculator + Ask-Clive panels live in-interface.

## Three more proven strengths (don't under-sell these)

**1. People leadership + culture (esp. change & AI-engagement).** Matthew isn't just a
builder — he has deep people-management experience and launches things well.
Pre-AstraJax: scaled a team 20→50 solo, best regional performance in company
history, rebuilt post-COVID, manages managers, runs per-report development plans
and a themed 1:1 cadence. His real differentiator is **adoption culture**: he led a
BA→Rep transformation across 140+ people and designed an explicit
**Trust / Training / Value / Safety** adoption system. Proof: a team training hub
with training videos, sandbox walkthroughs and **engagement leaderboards**
(live analytics), plus an XP/gamification agent — he engineers cultures where
people *play* with AI and therefore learn it fast.
Proof: [https://mphopkinson92.github.io/ds-operating-system-map/ds-team-training.html](https://mphopkinson92.github.io/ds-operating-system-map/ds-team-training.html)

**2. Maintainable ops, not just launches.** He built a governed, multi-agent
bug-handling pipeline: **Intake → Fixer clusters → Matthew approves → Cursor
implements → Matthew ships → reporter 48h sign-off → weekly leadership summary.**
Human gate before any code *and* before "done"; audit trails; narrow agent scopes.
Operational maturity most small engineering teams lack.
Proof: `docs/archive/strategy-notes/agentic-bug-handling-flow-2026-05.md` (and ds-platform debug-workflow doc).

**3. Storytelling & creativity (ex-actor).** Trained at RADA; he channels
performance craft into the work. The flagship is delivered as a three-act story,
and the agent fleet is a *cast* — Clive (needy Victorian golden retriever), Marcel
(snobbish Persian sommelier), Vera (gossip columnist), Reggie (oblivious uncle),
Doc Albright (Jack Russell engineer). The principle: **"personality is not
decoration, it is adoption infrastructure"** — *"a commercially serious system
with a tiny sitcom living inside it."* Lean into warmth, narrative, and wit; this
is a genuine edge, not a quirk to sand off.

## Core principles Matthew operates by

- Boring layer first: clean data and clear workflows make AI useful.
- Agents on messy data are "confident chaos machines" — keep scope narrow.
- Humans keep judgement; agents take the sludge. Always an audit trail.
- Personality drives adoption (Clive et al.) — not a gimmick, a usage strategy.
- Adoption needs Trust, Training, Value, Safety — embedded in delivery, not a
separate "AI culture coaching" product.
- Domain experts don't need to become technical; they can become architects.

## How to work with Matthew

- Address him as **Matthew**, not Matt.
- Collaborative and data-driven; tie claims back to evidence/metrics.
- Concise, structured, bias to action; dry humour welcome.
- Give him processing space — don't force instant decisions or pure-logic asks.
- Don't overclaim he's an engineer, or an enterprise change-management expert.
- He thinks in systems and leverage; he can sell but it drains him.

## Founder intent (light)

- Four pillars of "winning": **Mastery, Usefulness, Leverage, Alignment.**
- Financial independence is his **starting position, not the goal** (no figures here).
- Wants: build something owned, lead a team, stay at the front of AI.

## Guardrails

- Stay on the AstraJax thesis (see `docs/business/positioning.md` §13 "What We Are Not"
and `docs/business/internal-brief.md` §3). Do not drift into pet
businesses, generic lead-gen, broad AI consulting, or "Matthew builds Airtable bases".
- Default framing: *AstraJax helps commercial teams turn domain expertise into
AI-ready operating systems; Clive reasons, and Clive's Man stewards the context lane they rely on.*
- Keep personal finances (savings, inheritance, options, salary) and medical
specifics **out of this file and any shareable/committed doc**. The behavioural
takeaway is enough: Matthew works best where effort maps directly to outcomes, and
he externalises executive function into systems.

## Cursor Cloud specific instructions

The one runnable product is the **`website/`** Next.js app (Next.js 15 + React 19,
App Router). Its API routes (`src/app/api/*`) are the backend — there is **no
separate server, database, or Docker** to start. Everything under `hyperagent/`,
`scripts/`, and `agents/` is offline Python tooling / specs (stdlib-only, run with
`python3 <file>.py`, needs Airtable tokens) and is not part of the core app.

- **Run the app (dev):** `cd website && npm run dev` → http://localhost:3000.
  Standard commands live in `website/README.md` and `website/package.json`.
- **Local env:** the startup script (see below) creates `website/.env.local` from
  `website/.env.example` if it is missing. It is gitignored. It sets
  `BRAIN_KEY_USE_MEMORY=true` so all Brain Key / brain routes work fully offline
  with an in-memory store — **no Airtable needed** for local dev.
- **Ask Clive without a key:** with `ANTHROPIC_API_KEY` empty, `POST /api/ask-clive`
  still returns `200` with a canned fallback reply (`"fallback": true`). This is by
  design — the UI works end to end offline. Add a real `ANTHROPIC_API_KEY` to
  `website/.env.local` for live Claude replies (Court routes use `COURT_MODEL`,
  Clive voice uses `OPENAI_API_KEY`).
- **Lint:** `npm run lint` (`next lint`) is **not usable non-interactively** — no
  ESLint config or dependency exists, so it drops into an interactive setup prompt.
  Use `npx tsc --noEmit` in `website/` as the static check instead.
- **Tests:** `npm run test:brain-key`, `npm run test:command-centre`,
  `npm run test:platform-activity` (vitest); `npm run test:e2e` (Playwright — needs
  `npx playwright install` for browsers). To check health on your branch, run
  `npx tsc --noEmit` and the relevant vitest scripts in `website/` — treat any failure
  as real work to fix, not a known baseline to ignore.
- **Platform telemetry** (`PLATFORM_*`) and the `vercel.json` crons default **off**
  and are not needed for local dev/testing.
