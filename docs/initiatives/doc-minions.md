# Doc's Minions — Agent Family

**Status:** working spec for Doc's specialised build subagents.  
**Owner:** Matthew.  
**Read with:** [`docs/business/architecture.md`](../business/architecture.md) §9 (Opus → Composer routing), [`brain-base-builder-agent.md`](./brain-base-builder-agent.md) (Airtable minion context).

---

## How Matthew invokes

**Primary entry point:** `@doc`

Doc triages the task, tells you which minion fits and why, then runs that minion's
two-phase workflow (propose → you approve → build in Agent mode).

Direct minion invoke still works if you already know the lane: `@doc-airtable-builder`, `@doc-vercel-minion`.

## Skill sources (two types)

| Source | Where | Who picks |
|--------|-------|-----------|
| **Airtable pack** | `.cursor/skills/` in repo (copied from Airtable open-source) | Doc → Airtable Minion |
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

1. **Two phases:** Phase A propose (Ask or Agent, read-only). Phase B build (Agent mode only, explicit approval).
2. **One lane each:** A minion does not become Clive, Pam, Factory, or HyperAgent.
3. **No canonical truth:** Minions implement structure and code; humans approve what becomes trusted context.
4. **Paper trail:** Say what changed, what Matthew still does manually, preview/deploy links when relevant.
5. **Still forbidden unless Matthew asks:** `git commit`, `git push`, production promote, exposing secrets.

---

## Roster

| Role | Invoke | Lane | Status |
|------|--------|------|--------|
| **Doc** (dispatcher) | `@doc` | Triage + route to minion | v0.1 shipped |
| **Airtable Minion** | `@doc-airtable-builder` (or via `@doc`) | Brain bases + ops bases via Airtable MCP | v0.1 shipped |
| **Vercel Minion** | `@doc-vercel-minion` (or via `@doc`) | `website/` Next.js app, API routes, env, deploy | v0.1 shipped |

Future minions (not built): HyperAgent export packager, context scaffold, etc. — only after a minion passes the duplication check in Agent Factory.

---

## Naming

- Doc router registry: `agents/cursor/doc/router/`
- Minion registry: `agents/cursor/doc/<minion-slug>/`
- Cursor subagents: `.cursor/agents/doc.md`, `.cursor/agents/doc-<lane>-….md`
- Skills: `.cursor/skills/doc/SKILL.md`, `.cursor/skills/doc-<lane>-…/SKILL.md`

Display names: **Doc Albright**, **Doc's Airtable Minion**, **Doc's Vercel Minion**.

---

## Positioning

Minions are **Matthew's and AstraJax's internal build tooling**, not a client-facing "we build your stack" product. Client-facing Doc → minion dispatch (Vercel-hosted) is post-AIE.
