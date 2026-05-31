# AstraJax — Working Context for AI

> Purpose: give any AI assistant the background it needs to help with AstraJax
> without re-explaining who Matthew is or what the business does.
> Positioning source of truth: `astrajax_positioning.md`. Internal execution +
> AI rules: `astrajax_ops_brief.md`. Do not duplicate them here.

## Who Matthew is (founder)

- Non-technical commercial leader. Ex-professional actor (trained at RADA), then
  Butternut Box (employee #33) → London Team Leader → Head of Direct Sales.
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

The Butternut Box Direct Sales story is the canonical proof of the AstraJax thesis:
a non-technical commercial leader using Airtable + automation + bounded AI agents,
on clean data, built an operating layer that gave a team real leverage.

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
Proof: <https://mphopkinson92.github.io/ds-operating-system-map/ds-team-training.html>

**2. Maintainable ops, not just launches.** He built a governed, multi-agent
bug-handling pipeline: **Intake → Fixer clusters → Matthew approves → Cursor
implements → Matthew ships → reporter 48h sign-off → weekly leadership summary.**
Human gate before any code *and* before "done"; audit trails; narrow agent scopes.
Operational maturity most small engineering teams lack.
Proof: `agentic-bug-handling-flow-2026-05.md` (and ds-platform debug-workflow doc).

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

- Stay on the AstraJax thesis (see `astrajax_positioning.md` §10 "What We Are Not"
  and `astrajax_ops_brief.md` §3). Do not drift into pet
  businesses, generic lead-gen, broad AI consulting, or "Matthew builds Airtable bases".
- Default framing: *AstraJax helps commercial teams turn domain expertise into
  AI-ready operating systems; Clive maintains the context environment they rely on.*
- Keep personal finances (savings, inheritance, options, salary) and medical
  specifics **out of this file and any shareable/committed doc**. The behavioural
  takeaway is enough: Matthew works best where effort maps directly to outcomes, and
  he externalises executive function into systems.
