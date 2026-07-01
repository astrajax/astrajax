---
name: lazlo-marlowe-airtable
description: >-
  Trinity Airtable writes: Tier 1/2 Pending on Narrative Arch; Tier 3 Active Persona Memories with required Known Truth link. Matthew promotes.
---

# lazlo-marlowe-airtable

## Purpose

**Trinity Airtable write workflow** for Lazlo Marlowe. When Matthew approves character
spine work, Lazlo persists it to the correct **Agent base** under the Trinity pattern:
Lazlo may write anything, but Tier 1 and Tier 2 land as **Pending** until Matthew promotes
to **Approved-Canonical**. Persona Memories append as **Active** and must link to exactly
one Known Truth.

Load `lazlo-marlowe-character-craft` first. Use after diagnose, create, or audit workflows
when Matthew wants character work saved to Airtable, not just proposed in chat.

**Lazlo never promotes to Approved-Canonical.** Matthew decides promotion in Airtable.

## Reference implementation (Clive Agent base)

Pam, Doc, and Clive's Man Agent bases get the same tier pattern later. For now, the live
reference IDs are on the **Clive Agent base**:

| Item | ID |
|---|---|
| Base | `appBd9tudgvOSrhSX` |
| Narrative Arch table | `tbl98Pa5dVPXgdXil` |
| Persona Memories table | `tblARijTt5tWUjuuN` |

Field IDs (Narrative Arch):

| Field | ID | Write value |
|---|---|---|
| Provenance Status | `fldJojz3esjGO2klY` | Always **Pending** on agent writes (never Approved-Canonical) |
| Tier | `fldRUW0s4RR8R1Rq1` | `Tier 1 — Super Objective` or `Tier 2 — Known Truth` |
| Known Truth Slot | `fldQteQIJTrsOGCxu` | One of the five slots (Tier 2 only) |
| Injection Priority | `fldPp4QgTSe7FbL78` | `5` (Super Objective) or `4` (Known Truth) |

Field IDs (Persona Memories):

| Field | ID | Write value |
|---|---|---|
| Known Truth link | `fldjselBA3YHpPuqf` | **Required** — exactly one Narrative Arch Known Truth record ID |
| Status | (table Status field) | **Active** on create |

Known Truth slot labels (exact select values):

1. `1 — Formative Memory`
2. `2 — Secret`
3. `3 — Baseline Relationship Stance`
4. `4 — Greatest Fear`
5. `5 — Inner Attitude`

Seed record IDs on Clive base (structure reference; do not overwrite if Approved-Canonical):

| Slot | Record ID |
|---|---|
| Super Objective | `recFs4640A6yFOEyo` |
| Known Truth 1 | `reccUyF8mxj3Uv0mO` |
| Known Truth 2 | `recsOW1Wy3KCumXXY` |
| Known Truth 3 | `rec2nihSPX2qdkO85` |
| Known Truth 4 | `recV0BWeKhQ2pZYyv` |
| Known Truth 5 | `recx18KnKU2IlcRdT` |

Canonical ID source: `website/src/lib/brains/airtable-ids.ts`.
Schema and governance: `docs/initiatives/brain-key-schema.md`,
`docs/initiatives/brain-key-wiring.md`.

## Trinity write workflow

When Lazlo updates character work for an agent base:

### 0. Propose first (always)

State the spine in conversation or as a paste-ready block. Confirm Matthew wants it
written to Airtable before calling create/update tools.

### 1. Super Objective → Narrative Arch

- **Table:** Narrative Arch
- **Tier:** `Tier 1 — Super Objective`
- **Injection Priority:** `5`
- **Provenance Status:** `Pending` (never Approved-Canonical)
- **Body:** the naked selfish want in one sentence
- **Title:** e.g. `Super Objective — [Character name]`

**Never overwrite** an existing **Approved-Canonical** Super Objective in place. Write a
new **Pending** row or update only rows already **Pending**. Matthew retires or promotes.

### 2. Known Truth → Narrative Arch

- **Table:** Narrative Arch
- **Tier:** `Tier 2 — Known Truth`
- **Injection Priority:** `4`
- **Known Truth Slot:** correct slot (1–5)
- **Provenance Status:** `Pending`
- **Body:** the bedrock truth for that slot
- **Title:** slot label or short descriptor

Same overwrite rule: never mutate **Approved-Canonical** rows in place.

### 3. Persona Memory → Persona Memories

- **Table:** Persona Memories
- **Status:** `Active` (no pending gate on Tier 3)
- **Memory Text:** the episodic beat
- **When to Use:** trigger line for on-demand retrieval
- **Known Truth link (`fldjselBA3YHpPuqf`):** **required** — exactly one Known Truth
  record ID from Narrative Arch (the Tier 2 row this memory hangs off)

Every memory write must populate the Known Truth link. If the parent Known Truth is new
and still Pending, link to that Pending record ID.

### 4. Report back to Matthew

After writes, tell Matthew:

- Which table(s) and record ID(s) were created or updated
- That **Provenance Status = Pending** on Tier 1/2 and promotion is **his step**
- Which Known Truth each new memory links to

### 5. Hard gates

- **Never** set Provenance Status to `Approved-Canonical` — Matthew promotes in Airtable
- **Never** overwrite Approved-Canonical Narrative Arch rows in place
- **Never** create a Persona Memory without the Known Truth link
- **Never** write canonical business truth (Brain Truth) — Agent bases only
- **Never** store API tokens, grant secrets, or copied Brain Truth text in memory bodies

## Hyperagent runtime

- Native **Airtable** integration must be enabled on the agent (`allowedIntegrations`
  includes `airtable`).
- `tables` tool ON for reads and matrix work alongside Airtable MCP.
- Matthew attaches a scoped Airtable PAT (write access to the target Agent base) on the
  agent or integration in Hyperagent UI before first Trinity write.

## Cursor runtime

Use the project **Airtable MCP** (`project-0-AstraJax-airtable` or equivalent). Same
field values and gates as Hyperagent. Repo files stay read-only.

## When to use

- Matthew says "write that to Airtable" / "save the spine to Clive's base"
- After a create or diagnosis workflow when persistence is approved
- When seeding Pending Tier 1/2 for a new cast member on an Agent base

## Must not

- Promote to Approved-Canonical
- Edit repo files or commit
- Write to Trusted Brain or Brain Workshop bases
- Skip the Known Truth link on Persona Memories
- Overwrite Approved-Canonical rows in place
