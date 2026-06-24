# Brain Key — Airtable Schema Blueprint

**Status:** Replicable schema reference (context-agnostic)  
**Owner:** Matthew  
**Last updated:** 24 June 2026  
**Use with:** [`brain-key-wiring.md`](./brain-key-wiring.md) (access model + API), [`architecture.md`](../business/architecture.md) (governance)

Any agent (especially **@doc-airtable-minion**) can recreate or extend Brain Key bases from this doc alone. No chat history required.

**Live Chapter 1 instance IDs:** [`website/src/lib/brains/airtable-ids.ts`](../../website/src/lib/brains/airtable-ids.ts)

---

## Three-base model

| Base shape | Name pattern | Purpose |
|------------|--------------|---------|
| **Registry** | `AstraJax Brain Registry` | Index, Brain Key Requests, Access Grants, Change Log. No trusted context text. |
| **Workshop** | `AstraJax Brain Workshop` | Draft/propose only. One shared Workshop per environment (not per brain theme). |
| **Trusted Brain** | `AstraJax Trusted Brain — {Theme Label}` | Approved context + personas. **One base per brain theme** (token scoping). |

After creating a new Trusted Brain: add a row to Registry **Brains** and update `airtable-ids.ts`.

---

## Scope convention (exact match)

Trusted **Brain Context** `Scope` field uses:

```text
read:brain-context:<area>
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
| Change Type | singleSelect | Context Promote, Grant Issued, Grant Revoked, Persona Update, Other |
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

### Table: Draft Brain Context

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

**Workshop Draft Brain Context — Proposed Category options (Chapter 1 / AstraJax):**  
Business Definition, Positioning, Method, Offers, Proof, Workflow Rule, Governance

**Do not add to Workshop drafts:** `Scope`, `Category`, `Authority`, `Freshness`, or any Trusted-only field. Those are set on **new Trusted rows** at Doc promote.

---

## Promote boundary (Workshop → Trusted)

Doc promote is a **copy-out**, not a status flip on one table.

1. Human approves via **Approval Decisions** (+ Pam at action gate if required).
2. Doc route reads draft **Title** and **Canonical Text** from Workshop only.
3. Doc **creates a new row** in Trusted **Brain Context** with human-specified **Category** and **Scope** (from promote payload — not from draft fields).
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
| Action Type | singleSelect | Context write, Brain context promote, Prompt update, Implementation job |
| Status | singleSelect | Draft, Ready, Dispatched, Needs review, Failed, Complete |
| Reason | multilineText | |
| Output Summary | multilineText | |

---

## Trusted Brain base (per theme)

### Table: Brain Context

Primary field: **Title** (singleLineText). **Approved rows only** — if it is in this table, it is canonical. No Draft status field.

| Field | Type | Notes |
|-------|------|-------|
| Title | singleLineText | Primary |
| Canonical Text | multilineText | |
| Category | singleSelect | Canonical taxonomy — set at promote, not copied from draft |
| Scope | singleSelect | Grant match key — Trusted only. Format: `read:brain-context:<area>` |
| Authority | singleLineText | Approver or source doc |
| Freshness | singleSelect | Current, Review soon, Stale |
| Last Reviewed | date | ISO date |

**Trusted Brain Context — Category options (Chapter 1 / AstraJax):**  
Business Definition, Positioning, Method, Offers, Proof, Workflow Rule, Governance

**Trusted Brain Context — Scope options (Chapter 1 demo):**  
`read:brain-context:positioning`, `read:brain-context:governance`

Per brain theme: document Category and Scope option sets in this file when standing up a new Trusted Brain. New scopes require human adding a select option (governance), not agent free text.

### Table: Personas

Primary field: **Persona Name** (singleLineText). Approved agent behaviour — not business truth.

| Field | Type | Notes |
|-------|------|-------|
| Persona Name | singleLineText | Primary. Clive, Pam, Doc |
| Role | singleSelect | Reason, Challenge, Act, Coach |
| Operational System Prompt | multilineText | |
| Rules Section | multilineText | Engineering guardrails |
| Skin Brain | multilineText | Tone, boundaries |
| Status | singleSelect | Approved, Retired |

---

## MCP recreate checklist

1. Create **Registry** base with four tables above (field names must match exactly).
2. Create **Workshop** base with six tables.
3. Create **Trusted Brain** base for the theme with two tables.
4. Registry **Brains** row: slug, name, workshop + trusted base IDs, maturity Seedling, status Active.
5. Seed Trusted **Personas**: Clive, Pam, Doc (structure/placeholders — not client-approved content).
6. Seed Trusted **Brain Context** with scopes using `read:brain-context:<area>` convention.
7. Update [`airtable-ids.ts`](../../website/src/lib/brains/airtable-ids.ts) with new `app` / `tbl` IDs.
8. Create scoped Airtable tokens per base role (see credential map in `brain-key-wiring.md`).

**Live Chapter 1 migration (completed 24 Jun 2026):** Workshop `Proposed Category` (singleSelect) added; Trusted `Category` and `Scope` converted to singleSelect; seed rows updated. Delete the two `LEGACY … (delete in UI)` text columns in Airtable when convenient — MCP cannot remove fields.

---

## What not to put in schema

- API tokens or PAT values
- Approved business truth (client canonical content) in Trusted Brain during scaffold
- `Context Packs` table (deprecated naming)
- Draft rows in Trusted Brain Context
- **Scope or canonical Category on Workshop drafts** — access control and taxonomy live on Trusted only
- **Draft / Approved status on Trusted Brain Context** — physical separation replaces status toggles
- Pam gate on Brain Key Request flow (human approves read access directly)

---

## Related

- [Brain Key wiring](./brain-key-wiring.md) — access model, API routes, credentials
- [Brain Key build plan](./brain-key-build-plan.md) — application layer QA
- [Doc's Airtable Minion](../../.cursor/agents/doc-airtable-minion.md)
