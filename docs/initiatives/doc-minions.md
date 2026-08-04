# Doc's Minions — Agent Family

**Status:** working spec for Doc's specialised build subagents.  
**Owner:** Matthew.  
**Read with:** [`docs/business/architecture.md`](../business/architecture.md) §7 (four-base Airtable model), §9 (Opus → Composer routing), [`brain-key-schema.md`](./brain-key-schema.md) + [`brain-key-wiring.md`](./brain-key-wiring.md) (canonical shapes), [`doc-brain-base-builder.md`](./doc-brain-base-builder.md) (Doc Brain Base Builder runbook).

---

## How Matthew invokes

**Primary entry point:** `@doc` (Cursor lane)

Doc tiers the job (Household Conduct), triages the minion, then runs that minion's
workflow. Twin map / HA Doc: [`build-velocity-tracks.md`](./build-velocity-tracks.md).

Direct minion invoke still works if you already know the lane: `@doc-brain-base-builder`, `@doc-vercel-minion`, `@doc-workshop-proposer`, `@doc-workshop-challenger`, `@doc-workshop-cursor`, `@doc-workshop-hyperagent`.

## Household Conduct tiers (shared)

Canonical language: [`docs/context/household-conduct-standard.md`](../context/household-conduct-standard.md).

| Tier | Minion / Doc behaviour |
|------|-------------------------|
| **Green** | Reversible + bounded. Standing Green or `green go` → Phase B without a fresh Phase A. |
| **Amber** | Phase A → Matthew yes → Phase B (or act-then-notify for standing Amber). |
| **Red** | Propose only; Pam/Trinity where required; no build until Matthew approves. |

Every Doc reply opens with `**Tier:** Green|Amber|Red`. Uncertain → higher tier.

## Skill sources (two types)

| Source | Where | Who picks |
|--------|-------|-----------|
| **Airtable pack** | `.cursor/skills/` in repo (copied from Airtable open-source) | Doc → Doc Brain Base Builder |
| **Vercel pack** | Vercel Cursor **plugin** (pills in chat — Functions, CLI, Storage, etc.) | **Doc names them**; Vercel Minion reads & applies |

Doc does not need every Vercel skill every time — Doc picks the smallest set and
says why. Reference: `.cursor/skills/doc-vercel-minion/references/vercel-plugin-skills.md`

---

| Role | Who | Job |
|------|-----|-----|
| **Doc** (heavy reasoning) | Opus-class model | Triage, validate brief, **name the minion**, shape the execution plan. Invoked as `@doc`. |
| **Minion** (narrow build) | Cursor subagent / Composer in Agent mode | Executes one lane after human approval — repo files, Vercel app, Airtable schema. |

```text
Matthew → @doc → Doc names minion + Phase A plan → Matthew approves → Minion builds (Agent mode)
```

HyperAgent is **not** a minion. HyperAgent runs **deployed fleet agents**. Minions are **Doc's Cursor build crew**.

---

## Minion rules (all minions)

1. **Tier first, then phases:** Follow Household Conduct. Phase A is not automatic for every Green job.
2. **Two phases when required:** Phase A propose (Ask or Agent, read-only). Phase B build (Agent mode only, approval when tier requires it).
3. **One lane each:** A minion does not become Clive, Pam, Clive's Man, or HyperAgent On-Platform Doc.
4. **No canonical truth:** Minions implement structure and code; humans approve what becomes trusted context.
5. **Paper trail:** Say what changed, what Matthew still does manually, preview/deploy links when relevant. HyperAgent builders must emit a handoff card (`hyperagent-handoff-contract.md`).
6. **Clive's Man (executors only):** After Phase B, invoke `@clive-man` with build decisions so canonical context sources stay in sync (`doc` skill — Clive's Man handoff).
7. **Still forbidden unless Matthew asks:** `git commit`, `git push`, production promote, exposing secrets.

---

## Roster

| Role | Invoke | Lane | Status |
|------|--------|------|--------|
| **Doc** (dispatcher) | `@doc` | Triage + route to minion | v0.1 shipped |
| **Doc Brain Base Builder** | `@doc-brain-base-builder` (or via `@doc`) | Brain bases + ops bases via Airtable MCP | v0.1 shipped |

**Doc Brain Base Builder canonical sources (Mode 1 — brain):** `brain-key-schema.md` (fields) → `brain-key-wiring.md` (access) → `doc-brain-base-builder.md` (invoke + inventory) → `airtable-ids.ts` (live IDs). Do not treat the initiative doc as a second schema — it is the runbook.
| **Vercel Minion** | `@doc-vercel-minion` (or via `@doc`) | `website/` Next.js app, API routes, env, deploy | v0.1 shipped |
| **Doc's Workshop** | via `@doc` → `@doc-workshop-proposer` | Agent-making place (Trinity below) | v0.1 shipped |

### Doc's Workshop (Trinity)

Agent design and build uses a **Proposer → Challenger → Executor** split (see `docs/context/trinity-agent-flow.md`). Matthew approves between Challenger and Executor.

| Role | Invoke | Model | Job |
|------|--------|-------|-----|
| **Workshop Proposer** | `@doc-workshop-proposer` | gpt-5.5-high | Interview, roster, risk, config pack; dispatches Challenger |
| **Workshop Challenger** | `@doc-workshop-challenger` | gpt-5.5-high | Red-team every pack before Matthew sees it |
| **Cursor Builder** (Executor) | `@doc-workshop-cursor` | composer-2.5-fast | `.cursor/agents`, `.cursor/skills`, cursor registry |
| **Hyperagent Builder** (Executor) | `@doc-workshop-hyperagent` | composer-2.5-fast | `hyperagent/builds/`, exports, hyperagent registry; deploy handoff only |

Future runtimes: add another Workshop Executor minion (same Trinity, new runtime lane).

---

## Naming

- Doc router registry: `agents/registry/cursor/doc/router/`
- Minion registry: `agents/registry/cursor/doc/<minion-slug>/`
- Workshop registry: `agents/registry/cursor/doc/workshop-<role>/`
- Cursor subagents: `.cursor/agents/doc.md`, `.cursor/agents/doc-<lane>-….md`
- Skills: `.cursor/skills/doc/SKILL.md`, `.cursor/skills/doc-<lane>-…/SKILL.md`

Display names: **Doc Albright**, **Doc Brain Base Builder**, **Doc's Vercel Minion**, **Doc's Workshop Proposer**, **Doc's Workshop — Challenger / Cursor Builder / Hyperagent Builder**.

---

## Positioning

Minions are **Matthew's and AstraJax's internal build tooling**, not a client-facing "we build your stack" product. Client-facing Doc → minion dispatch (Vercel-hosted) is post-AIE.
