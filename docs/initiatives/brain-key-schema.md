# Brain Key — Airtable Schema Blueprint

**Status:** Replicable schema reference (context-agnostic)  
**Owner:** Matthew  
**Last updated:** 26 June 2026  
**Use with:** [`brain-key-wiring.md`](./brain-key-wiring.md) (access model + API), [`architecture.md`](../business/architecture.md) (governance)

Any agent (especially **@doc-airtable-minion**) can recreate or extend Brain Key bases from this doc alone. No chat history required.

**Surfacing:** backstage governance only. Demo and product copy say **approved context for this task**, not Brain Key. Grants apply from **Working Brain** upward; Seedling = Workshop only.

**Live Chapter 1 instance IDs:** [`website/src/lib/brains/airtable-ids.ts`](../../website/src/lib/brains/airtable-ids.ts)

---

## Four-base model

| Base shape | Name pattern | Purpose |
|------------|--------------|---------|
| **Registry** | `AstraJax Brain Registry` | Index, Brain Key Requests, Access Grants, Change Log, **Agents** index. No trusted context text. |
| **Workshop** | `AstraJax Brain Workshop` | Draft/propose only. One shared Workshop per environment (not per brain theme). |
| **Trusted Brain** | `AstraJax Trusted Brain — {Theme Label}` | Approved business context only. **One base per brain theme** (token scoping). |
| **Agent** | `AstraJax Agent — {Agent Label}` | Character + role memory for one agent. **One base per agent** (token scoping). |

After creating a new Trusted Brain: add a row to Registry **Brains** and update `airtable-ids.ts`.

After creating a new Agent base: add a row to Registry **Agents** and update `airtable-ids.ts`.

**Product agents (Chapter 1):** Clive, Pam, Doc, Clive's Man (`clive-man`). Each gets its own Agent base.

**HyperAgent:** durable memory lives in Airtable Agent and Trusted Brain bases only — not in HyperAgent `/memories`. Runtimes fetch at session start; `autoSaveMemories = false` on governed HyperAgent exports remains the fleet default because HyperAgent must not own the brain. Persona Memories auto-form **into Airtable** under the rules below — that is governed auto-save, not runtime auto-save.

---

## Scope convention (exact match)

Trusted **Brain Truth** `Scope` field uses:

```text
read:brain-truth:<area>
```

Grant `Scope` must match a Trusted row **exactly** for retrieve to return it.

Chapter 1 demo areas: `positioning`, `governance`.

---

## Registry base

### Table: Brains

Primary field: **Brain Slug** (singleLineText)

| Field | Type | Notes |
|-------|------|-------|
| Brain Slug | singleLineText | Primary. e.g. `astrajax-chapter-1` |
| Brain Name | singleLineText | Display name |
| Purpose | multilineText | |
| Maturity | singleSelect | Seedling, House-Trained, Working, Sharp, Trusted, Elder |
| Workshop Base ID | singleLineText | `app…` ID |
| Trusted Base ID | singleLineText | `app…` ID |
| Status | singleSelect | Active, Paused, Retired |
| Domain Owner | singleLineText | |

### Table: Agents

Primary field: **Agent Slug** (singleLineText). Index of product and fleet agents with Agent bases.

| Field | Type | Notes |
|-------|------|-------|
| Agent Slug | singleLineText | Primary. e.g. `clive`, `pam`, `doc`, `clive-man` |
| Agent Name | singleLineText | Display name |
| Purpose | multilineText | |
| Agent Base ID | singleLineText | `app…` ID of the Agent base |
| Repo Path | singleLineText | Canonical build pack / agent definition in repo |
| Status | singleSelect | Active, Paused, Retired |
| Owner | singleLineText | |

### Table: Brain Key Requests

Primary field: **Request ID** (singleLineText). App-generated e.g. `bkr_…`

| Field | Type | Notes |
|-------|------|-------|
| Request ID | singleLineText | Primary |
| Brain Slug | singleLineText | |
| Persona | singleSelect | clive, pam |
| Purpose | multilineText | |
| Scope | singleLineText | Must match grant scope exactly |
| Reason | multilineText | |
| Session ID | singleLineText | |
| Status | singleSelect | Pending, Approved, Rejected, Expired |
| Requested At | dateTime | Europe/London, 24h ISO |
| Expires At | dateTime | |

### Table: Access Grants

Primary field: **Grant ID** (singleLineText). App-generated e.g. `grt_…`

| Field | Type | Notes |
|-------|------|-------|
| Grant ID | singleLineText | Primary |
| Request ID | singleLineText | |
| Brain Slug | singleLineText | |
| Persona | singleSelect | clive, pam |
| Scope | singleLineText | |
| Session ID | singleLineText | |
| Approved By | singleLineText | |
| Approved At | dateTime | |
| Expires At | dateTime | |
| Max Uses | number | Integer, default 3 |
| Use Count | number | Integer |
| Status | singleSelect | Active, Revoked, Expired |

### Table: Change Log

Primary field: **Entry ID** (singleLineText). App-generated.

| Field | Type | Notes |
|-------|------|-------|
| Entry ID | singleLineText | Primary |
| Change Summary | multilineText | |
| Change Type | singleSelect | Truth Promote, Grant Issued, Grant Revoked, Persona Update, Other |
| Changed By | singleLineText | |
| Approved By | singleLineText | |
| Executing Agent | singleLineText | e.g. Doc |
| Source | singleLineText | Route or brief ID |
| Reason | multilineText | |
| Affected Records | multilineText | Record IDs, comma-separated |
| Status | singleSelect | Draft, Complete, Failed |
| Previous Hash | singleLineText | Hash chain |
| Entry Hash | singleLineText | Hash chain |
| Notes | multilineText | Never secrets |

---

## Workshop base

### Table: User Brains

Primary field: **User Label** (singleLineText)

| Field | Type | Notes |
|-------|------|-------|
| User Label | singleLineText | Primary |
| Role Domain | singleLineText | |
| Guide Mode | singleSelect | Full Story, Light Story, No Story |
| AI Confidence | singleSelect | New, Comfortable, Expert |
| Context Environment Confidence | singleSelect | New, Comfortable, Expert |
| Notes | multilineText | |

### Table: Draft Brain Truth

Primary field: **Title** (singleLineText). **Workshop only** — never approved canonical truth.

| Field | Type | Notes |
|-------|------|-------|
| Title | singleLineText | Primary |
| Canonical Text | multilineText | Proposed content only |
| Brain Slug | singleLineText | |
| Proposed Category | singleSelect | Workshop sorting only — not access control. See options below. |
| Status | singleSelect | Draft, Quarantined |
| Proposed By Agent | singleLineText | e.g. clive |
| Created By | singleSelect | Matthew, Agent, Website, TL |

**Workshop Draft Brain Truth — Proposed Category options (Chapter 1 / AstraJax):**  
Business Definition, Positioning, Method, Offers, Proof, Workflow Rule, Governance

**Do not add to Workshop drafts:** `Scope`, `Category`, `Authority`, `Freshness`, or any Trusted-only field. Those are set on **new Trusted rows** at Doc promote.

---

## Promote boundary (Workshop → Trusted)

Doc promote is a **copy-out**, not a status flip on one table.

1. Human approves via **Approval Decisions** (+ Pam at action gate if required).
2. Doc route reads draft **Title** and **Canonical Text** from Workshop only.
3. Doc **creates a new row** in Trusted **Brain Truth** with human-specified **Category** and **Scope** (from promote payload — not from draft fields).
4. Workshop draft **Status → Quarantined** (consumed proposal, not “Approved”).
5. **Change Log** + grant revoke on Registry.

Trusted Brain tokens never read Workshop; Clive/Pam tokens never write Trusted. Only the Doc promote credential crosses both bases for this flow.

---

### Table: Brain Interactions

Primary field: **Interaction ID** (singleLineText)

| Field | Type | Notes |
|-------|------|-------|
| Interaction ID | singleLineText | Primary |
| Session ID | singleLineText | |
| Persona | singleSelect | clive, pam, doc |
| Brain Slug | singleLineText | |
| User Message | multilineText | |
| Assistant Reply | multilineText | |
| Channel | singleSelect | Website, Booth, Admin, Test |
| Manifest Record IDs | multilineText | When grant used — not full trusted text |
| Manifest Hashes | multilineText | |
| Grant ID | singleLineText | |
| Quality Score | number | Client rating 1–5 |
| Reviewer | singleLineText | Who scored the interaction |
| Review Notes | multilineText | Optional client notes |
| Reviewed At | dateTime | When the score was submitted |
| Suspected Context Issue | checkbox | Client flagged possible context problem |
| Review Status | singleSelect | New, Reviewed, Action proposed, No action |
| Context Flagged | singleSelect | None, Flagged for review, Quarantine proposed, Resolved |

New interactions default to **Review Status = New** and **Context Flagged = None** at log time.
Client scoring normally sets **Review Status = Reviewed** and updates **Context Flagged** when the suspected-context checkbox is used. The thin Brain Upkeep loop reuses these existing fields: scores 1-2 set **Review Status = Action proposed** and **Context Flagged = Flagged for review** or **Quarantine proposed**. No extra Airtable fields are required.

### Table: Pam Reviews

Primary field: **Review ID** (singleLineText). Action gates only — not Brain Key unlock.

| Field | Type | Notes |
|-------|------|-------|
| Review ID | singleLineText | Primary |
| Trigger Type | singleSelect | Action gate, Contextual invitation, Turn-count safety net |
| Strongest Part | multilineText | |
| Weakest Assumption | multilineText | |
| Missing Evidence | multilineText | |
| Rabbit-hole Risk | multilineText | |
| Safe To Send To Doc | singleSelect | Yes, Not yet |

### Table: Approval Decisions

Primary field: **Decision ID** (singleLineText)

| Field | Type | Notes |
|-------|------|-------|
| Decision ID | singleLineText | Primary |
| Decision Summary | multilineText | |
| Approver | singleLineText | |
| Decision | singleSelect | Approved, Approved with caveat, Rejected, Needs more work |
| Decision Notes | multilineText | |
| Send To Doc | checkbox | |

### Table: Doc Actions

Primary field: **Action ID** (singleLineText)

| Field | Type | Notes |
|-------|------|-------|
| Action ID | singleLineText | Primary |
| Approval Decision ID | singleLineText | Required for promote |
| Action Type | singleSelect | Context write, Brain truth promote, Prompt update, Implementation job |
| Status | singleSelect | Draft, Ready, Dispatched, Needs review, Failed, Complete |
| Reason | multilineText | |
| Output Summary | multilineText | |

---

## Trusted Brain base (per theme)

### Table: Brain Truth

Primary field: **Title** (singleLineText). **Approved rows only** — if it is in this table, it is canonical. No Draft status field.

| Field | Type | Notes |
|-------|------|-------|
| Title | singleLineText | Primary |
| Canonical Text | multilineText | |
| Category | singleSelect | Canonical taxonomy — set at promote, not copied from draft |
| Scope | singleSelect | Grant match key — Trusted only. Format: `read:brain-truth:<area>` |
| Authority | singleLineText | Approver or source doc |
| Freshness | singleSelect | Current, Review soon, Stale |
| Last Reviewed | date | ISO date |

**Trusted Brain Truth — Category options (Chapter 1 / AstraJax):**  
Business Definition, Positioning, Method, Offers, Proof, Workflow Rule, Governance

**Trusted Brain Truth — Scope options (Chapter 1 demo):**  
`read:brain-truth:positioning`, `read:brain-truth:governance`

Per brain theme: document Category and Scope option sets in this file when standing up a new Trusted Brain. New scopes require human adding a select option (governance), not agent free text.

### Table: Brain Memories

Primary field: **Memory Text** (singleLineText). **Working brain recall** — shared across personas when they hold a grant. Not canonical truth.

| Field | Type | Notes |
|-------|------|-------|
| Memory Text | singleLineText | Primary. Short fact, gap, tension, or retrieval hint |
| When to Use | multilineText | Trigger line for runtime injection |
| Scope Area | singleLineText | Optional filter, e.g. `positioning`, `governance` |
| Status | singleSelect | Active, Stale, Promoted, Retired |
| Freshness | singleSelect | Current, Review soon, Stale |
| Last Reviewed | date | ISO date |
| Proposed By Agent | singleLineText | e.g. clive-man |
| Source Notes | multilineText | Interaction ID, digest link, or human note |

**Promotion (one direction only):** Brain Memory → Workshop **Draft Brain Truth** → Trusted **Brain Truth**. Never Persona Memory → Brain Memory without human review at promote boundary.

**Curation:** Clive's Man (or equivalent steward) may quarantine or retire stale Brain Memories without a per-record human approval gate. Human gate applies at **promotion** to canonical truth.

---

## Agent base (one per agent)

Name pattern: `AstraJax Agent — {Agent Label}` (e.g. `AstraJax Agent — Clive`).

**Do not mix agents in one Agent base.** Character state, narrative arch, and persona memories stay isolated so business-truth retrieval never pulls Victorian subtext.

**This base is the authoring surface for the agent** (decision 25 Jun 2026; canonical statement in [`architecture.md`](../business/architecture.md) §7 → "Agent Authoring Surface"). HyperAgent is the primary runtime, so humans author the agent **here**: character backstory in **Narrative Arch**, system prompt / rules / output format in **Persona Config**, and the agent's **skills** here too (a skill is just text + a `whenToUse` trigger + a pinned/load flag, the same shape as the memory rows). A generator (a script that reads Airtable and writes out the agent files — the `hyperagent/builds/build_*.py` pattern, run by Doc) then emits **both** the HyperAgent export JSON and the Cursor `.cursor/agents/*.md` + `.cursor/skills/*/SKILL.md` files. The repo `.cursor/` files and build packs are **generated artifacts, not hand-authored sources of truth**. Skills authored here pass the **same human-approval gate** as Narrative Arch and Persona Config before generation or publish.

### Table: Narrative Arch

Primary field: **Title** (singleLineText). Slow-changing, approved **character spine** — not episodic memory.

| Field | Type | Notes |
|-------|------|-------|
| Title | singleLineText | Primary. e.g. Super Objective, Inner Attitude |
| Body | multilineText | Approved narrative / dramaturgical content |
| Arch Type | singleSelect | Super Objective, Inner Attitude, Relationships, Outer Character, Other |
| Status | singleSelect | Approved, Retired |
| Last Reviewed | date | ISO date |
| Source Notes | multilineText | character-provenance, Lazlo brief, Matthew approval |

Human approves Narrative Arch changes. This is the **bible**, not the diary.

### Table: Persona Config

Primary field: **Config Name** (singleLineText). Approved runtime behaviour contract.

| Field | Type | Notes |
|-------|------|-------|
| Config Name | singleLineText | Primary. e.g. `Operational v0.1` |
| Role | singleSelect | Reason, Challenge, Act, Coach, Steward |
| Operational System Prompt | multilineText | |
| Rules Section | multilineText | Engineering guardrails |
| Output Format | multilineText | Slack, plain text, structured tables |
| Status | singleSelect | Approved, Retired |

Human approves Persona Config changes.

### Table: Persona Memories

Primary field: **Memory Text** (singleLineText). **Non-canonical tier** — episodic role recall. Auto-form; **no human approval on create**.

| Field | Type | Notes |
|-------|------|-------|
| Memory Text | singleLineText | Primary |
| When to Use | multilineText | Trigger line for runtime injection |
| User Scope | singleSelect | Global, User-specific, Session |
| User Label | singleLineText | When User Scope is not Global |
| Session ID | singleLineText | When User Scope is Session |
| Status | singleSelect | Active, Stale, Promoted, Retired |
| Freshness | singleSelect | Current, Review soon, Stale |
| Last Reviewed | date | ISO date |
| Created By | singleSelect | Agent, Matthew, TL, System |
| Source Notes | multilineText | Interaction ID or trigger — not full trusted text |

**Non-canonical rules:**

- No `Confirmed By Human` field. Creation is autonomous (agent auto-save into Airtable).
- Human gate applies only at **promotion** (Persona Memory → Brain Memory → Draft Brain Truth → Brain Truth).
- Every write passes the same **sanitiser** as client responses (`sanitizeForClient`): no API tokens, grant secrets, raw trusted base IDs, or copied Brain Truth text.
- Steward (Clive's Man) runs **dedup and retire** passes — janitor, not approver on birth.
- Must never hold canonical business truth long-term. If it became truth, promote it out.

### Table: Minions

Primary field: **Minion Name** (singleLineText). Runtime roster for this agent's Composer subagents.

| Field | Type | Notes |
|-------|------|-------|
| Minion Name | singleLineText | Primary. e.g. `proposer`, `challenger`, `executor` |
| Role | singleSelect | Proposer, Challenger, Executor, Builder, Other |
| Model | singleLineText | e.g. `composer-2.5-fast` |
| Scope | multilineText | Bounded write surface |
| Status | singleSelect | Active, Retired |
| Repo Path | singleLineText | Canonical build pack / `.cursor/agents/` slug |

Empty Minions table is valid (Pam may have zero minions). Shape must be consistent across Agent bases.

---

## MCP recreate checklist

1. Create **Registry** base with five tables above (field names must match exactly).
2. Create **Workshop** base with six tables.
3. Create **Trusted Brain** base for the theme with **Brain Truth** + **Brain Memories** (no Personas table).
4. Create **Agent** base per agent with four tables: Narrative Arch, Persona Config, Persona Memories, Minions.
5. Registry **Brains** row: slug, name, workshop + trusted base IDs, maturity Seedling, status Active.
6. Registry **Agents** row per agent: slug, name, agent base ID, repo path, status Active.
7. Seed Trusted **Brain Truth** with scopes using `read:brain-truth:<area>` convention.
8. Seed Agent bases with structure/placeholders only — not client-approved narrative or business truth.
9. Update [`airtable-ids.ts`](../../website/src/lib/brains/airtable-ids.ts) with new `app` / `tbl` IDs.
10. Create scoped Airtable tokens per base role (see credential map in `brain-key-wiring.md`).

**Live Chapter 1 migration (completed 24 Jun 2026):** Workshop `Proposed Category` (singleSelect) added; Trusted `Category` and `Scope` converted to singleSelect; seed rows updated. Delete the two `LEGACY ... (delete in UI)` text columns in Airtable when convenient — MCP cannot remove fields.

**Live Chapter 1 four-base migration (completed 25 Jun 2026):** Trusted Brain Chapter 1 now has **Brain Memories** and the legacy **Personas** rows have been migrated into per-agent Agent bases (Narrative Arch + Persona Config). The legacy Personas table remains in Airtable only as a manual UI cleanup item (`app6tjzzG0L0lOeVb` / `tblBV7XSiTYdqSOWH`) because MCP cannot delete tables.

---

## What not to put in schema

- API tokens or PAT values
- Approved business truth (client canonical content) in Trusted Brain during scaffold
- `Context Packs` table (deprecated naming)
- Draft rows in Trusted Brain Truth
- **Scope or canonical Category on Workshop drafts** — access control and taxonomy live on Trusted only
- **Draft / Approved status on Trusted Brain Truth** — physical separation replaces status toggles
- Pam gate on Brain Key Request flow (human approves read access directly)
- Canonical business truth in Persona Memories or Brain Memories long-term (promote or retire)
- Copied Brain Truth snippets in Persona Memories (sanitiser must reject)
- HyperAgent `/memories` as system of record for product agents

---

## Related

- [Brain Key wiring](./brain-key-wiring.md) — access model, API routes, credentials
- [Brain Key build plan](./brain-key-build-plan.md) — application layer QA
- [Doc's Airtable Minion](../../.cursor/agents/doc-airtable-minion.md)
