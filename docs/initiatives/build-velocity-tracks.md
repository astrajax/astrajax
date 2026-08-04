# Build velocity tracks

**Status:** working initiative — living checklist.  
**Owner:** Matthew.  
**Read with:** [`docs/business/architecture.md`](../business/architecture.md) §9, [`doc-minions.md`](./doc-minions.md), [`source-document-mining.md`](./source-document-mining.md), [`hyperagent/docs/hyperagent-deploy-playbook.md`](../../hyperagent/docs/hyperagent-deploy-playbook.md).

One track at a time. Finish the done bar, use for ~1 week, then start the next.

```text
Track 0a (snapshot map) → Track 1 (tiers) → Track 3 (handoff) → Track 2 (job queue) → Track 4 (generator) → Track 5 (digests)
Track 0b (keep twins synced) — BLOCKED until HA write-back or standing courier habit
```

---

## Track status

| Track | Status | Done bar |
|-------|--------|----------|
| **0a** Snapshot Doc twin map | **Done** 2 Aug 2026 | Twin map + shared vs intentional + job-queue owner + HA-ahead truth direction |
| **0b** Keep twins from drifting | **Blocked** | Needs HA→repo write-back **or** standing Matthew export courier |
| **1** Risk-tier reconciliation | **Done** (artifacts landed; trial week owed) | Cursor Doc + minions speak Household Conduct Green/Amber/Red |
| **3** Handoff contract | **Done** (artifacts landed; trial week owed) | Two-lane contract + `handoff_hyperagent_export.py` |
| **2** Implementation job queue | **Done** (thin slice landed) | `Implementation Jobs` table + worker for `hyperagent_export_regen` |
| **4** Persona Config → repo generator | **Done** (Clive's Man pilot) | `generate_persona_config_sync.py` + drift check |
| **5** Default digests | **Done** (policy landed) | Clive's Man + mining doc default to digests for routine rows |

---

## Track 0a — Doc twin map (snapshot)

**Snapshot source:** HyperAgent export `Downloads/agent-doc-albright (1).json` (`exportedAt` 2026-07-29T16:46:10Z). Downloads is not truth — this map is. Re-export required before trusting HA details again.

### Inventory

| Surface | Version / status | Role | Tools / lane |
|---------|------------------|------|----------------|
| **HyperAgent Doc Albright (On-Platform)** | System Prompt **v0.4**; model `moonshotai/kimi-k3-fast` | Dispatcher **+** Workshop Proposer merged; auto-dispatches Challenger; hands cleared briefs to Workshop Executor | Airtable (roster/registry), Household skills; **never** builds repo artifacts, commits, imports, or approves |
| **Cursor `@doc`** | Skill still claims **Operational v0.2** (`rec0KNMfpdSlPWQuf`) — **lagging sync artifact** | Triage → Phase A → approve → Phase B minion in Cursor | MCP + repo + Composer builders |
| **Airtable Persona Config** (Doc base `appI5tpwsKNwjfrqR`) | **v0.2** `rec0KNMfpdSlPWQuf` = **Retired**; **v0.3** `recdOn7bnhn7sMK0Y` = **Approved**; **v0.4 (On-Platform)** `recIgO57oqkERrJ93` = **Pending** | Declared authoring surface | Not yet emitting Cursor skills via generator |
| **Workshop Challenger (HA)** | Dispatched by HA Doc | Red-team packs | HA subagent |
| **Workshop Executor (HA)** | Receives cleared briefs | On-platform config application under gating | HA; may support guarded config (not Cursor repo build) |
| **Doc Brain Base Builder** | Cursor minion | Governed Airtable schema | Airtable MCP |
| **Vercel Minion** | Cursor minion | `website/` | Repo + Vercel |
| **Workshop Cursor / Hyperagent Builders** | Cursor minions | Repo exports / generators | Composer |

### Shared household vs intentional specialisation

**Shared (must not diverge on meaning):**

- Household Conduct — Green / Amber / Red by blast radius ([`docs/context/household-conduct-standard.md`](../context/household-conduct-standard.md))
- Household Communication, Routing, Activity Logging (HA-preloaded; Cursor should point at the same names)
- Trinity separation of persons; no agent sets Approved/Canonical; Matthew decides

**Intentional specialisation:**

| | HyperAgent Doc | Cursor Doc |
|--|----------------|------------|
| Job | On-platform design + dispatch | Repo minion orchestration |
| Build | Never writes git | Phase B via Composer minions |
| Proposer | Merged into Doc | Separate `@doc-workshop-proposer` |
| Deploy | Hands to Executor / Matthew UI | Handoff card + manual import |

### Truth direction (until 0b)

> **HA Doc is operationally ahead. Cursor Doc is a lagging sync artifact. Airtable v0.3 is Approved for Doc technical role; v0.4 On-Platform is Pending. Do not invent a second Green/Amber/Red scheme in Cursor.**

Missing from repo: `agents/registry/hyperagent/doc/albright-onplatform/` build-pack-v0.4 (referenced by HA prompt). **Not restored as reconciliation** — one-shot land without 0b would go stale. Marked HA-canonical-for-now.

### `implementation_jobs` owner

**Owner:** Cursor Doc dispatch lane (Opus-class brief compiler) + Composer/local worker for repo job types.  
HA On-Platform Doc may **create or update** Approved job rows in Airtable (bookkeeping) but **does not** run Composer or write repo artifacts. Backend/worker executes; humans publish.

### Track 0b — blocked

Cannot close the twin loop from Cursor alone. Unblock with:

- **A.** HyperAgent write-back of approved export/prompt pack into the repo, or  
- **B.** Standing courier: Matthew exports Doc (+ Household Conduct) after Red changes → land under `hyperagent/exports/` + build-pack path → Doc/Clive's Man diffs Cursor sync.

---

## Track 1 — Risk-tier reconciliation

Shared language: [`docs/context/household-conduct-standard.md`](../context/household-conduct-standard.md).

Cursor Doc and [`doc-minions.md`](./doc-minions.md) must open with a **Tier call** and follow Green/Amber/Red (not blanket Phase A).

**Trial owed:** two real Green builds without fresh Phase A; one Red still stops for Pam.

---

## Track 3 — Handoff contract

Canonical contract: [`docs/initiatives/hyperagent-handoff-contract.md`](./hyperagent-handoff-contract.md).  
Script: `python3 hyperagent/scripts/handoff_hyperagent_export.py <export.json>`.

---

## Track 2 — Implementation Jobs

- Table: Brain Registry (`appbdTVHevH6Bl5ZZ`) → **Implementation Jobs**
- First job type: `hyperagent_export_regen`
- Worker: `python3 scripts/process_implementation_job.py [--job-id rec…]`
- IDs: `website/src/lib/brains/airtable-ids.ts` → `IMPLEMENTATION_JOBS`

---

## Track 4 — Generator pilot (Clive's Man)

- `python3 scripts/generate_persona_config_sync.py --agent clive-man`
- Emits `agents/registry/cursor/clive/clive-man/persona-config.generated.md`
- Drift check: `python3 scripts/generate_persona_config_sync.py --agent clive-man --check`
- Do **not** pilot on Doc until 0b

---

## Track 5 — Digests

Clive's Man + [`source-document-mining.md`](./source-document-mining.md): routine mine batches → digest; escalate only on Challenger flags.

---

## Related

- Pam challenge on original plan: 29 Jul 2026 (Track 0 required)
- Hard constraint: no Cursor-only twin close-loop (Matthew, 30 Jul 2026)
