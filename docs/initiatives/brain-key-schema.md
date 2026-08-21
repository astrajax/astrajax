# Brain Key — Airtable Schema Blueprint

**Status:** Replicable schema reference (context-agnostic)  
**Owner:** Matthew  
**Last updated:** 21 August 2026 (Household Members → Registry sync `tblTfxGnA5xWx2nAG` confirmed); 20 August 2026 (Household Members owns roster identity; Registry Agents is Brain Key index only); 17 August 2026 Draft Brain Truth write contract; Context Health Phase 2 schema pending
**Use with:** [`brain-key-wiring.md`](./brain-key-wiring.md) (access model + API), [`architecture.md`](../business/architecture.md) (governance), [`chapter1-context-structure.md`](./chapter1-context-structure.md) (canonical brain themes + categories), [`doc-brain-base-builder.md`](./doc-brain-base-builder.md) (scaffold/extend bases via Doc Brain Base Builder)

Any agent (especially **@doc-brain-base-builder**) can recreate or extend Brain Key bases from this doc alone. No chat history required.

**Surfacing:** backstage governance only. Demo and product copy say **approved context for this task**, not Brain Key. Grants apply from **Working Brain** upward; Seedling = Workshop only.

**Live Chapter 1 field IDs:** exported constants in [`website/src/lib/brains/airtable-ids.ts`](../../website/src/lib/brains/airtable-ids.ts) (`BRAIN_REGISTRY_*_FIELDS`, `BRAIN_WORKSHOP_*_FIELDS`, `BRAIN_TRUSTED_*_FIELDS`). Update after schema changes.

---

## Four-base model

| Base shape | Name pattern | Purpose |
|------------|--------------|---------|
| **Registry** | `AstraJax Brain Registry` | Index, Brain Key Requests, Access Grants, Change Log, **Agents** index (Brain Key only — household roster identity lives on Household Members). No trusted context text. |
| **Workshop** | `AstraJax Brain Workshop` | Draft/propose only. One shared Workshop per environment (not per brain theme). |
| **Trusted Brain** | `AstraJax Trusted Brain — {Theme Label}` | Approved business context only. **One base per brain theme** (token scoping). |
| **Agent** | `AstraJax Agent — {Agent Label}` | Character + role memory for one agent. **One base per agent** (token scoping). |

After creating a new Trusted Brain: add a row to Registry **Brains** and update `airtable-ids.ts`.

After creating a new Agent base: add the household member on **Household Members** (Register `appPrpfvsAr71RPP3` / `tblJ70qtHUc1dUHhi`) — that table owns slug, name, purpose, Agent Base ID, repo path, status, and owner. Brain Registry mirrors that table as synced **Household Members** `tblTfxGnA5xWx2nAG`. Native Registry **Agents** (`tblmb7syHipyWfBzu`) is still the Brain Key index the website reads — not a second roster. Do not treat its native columns as a second source of truth. Update `airtable-ids.ts` only when Doc rewires consumers to the synced table.

**Product agents (Chapter 1):** Clive, Pam, Doc, Clive's Man (`clive-man`). Each gets its own Agent base.

**HyperAgent:** durable memory lives in Airtable Agent and Trusted Brain bases only — not in HyperAgent `/memories`. Runtimes fetch at session start; `autoSaveMemories = false` on governed HyperAgent exports remains the fleet default because HyperAgent must not own the brain. Persona Memories auto-form **into Airtable** under the rules below — that is governed auto-save, not runtime auto-save.

---

## Harness surfaces (governance)

**Decision (29 Jun 2026).** Every table sits on one of four surfaces. Agents must not write locked truth; humans control promotion.

| Surface | Tables / records | Agent rule |
|---------|------------------|------------|
| **Locked** | Trusted Brain Truth; approved Persona Config; Approved-Canonical Narrative Arch | Read only; Doc promote creates new Trusted rows |
| **Editable** | Workshop Draft Brain Truth; User Brains profile/competency fields; Source Documents (attachments + summaries) | Clive drafts; Clive's Man mines attachments → proposes drafts; human corrects |
| **Append-only** | Change Log; Brain Interactions; Brain Memories; Persona Memories | Append; steward may retire stale |
| **Human-controlled** | Approval Decisions; Pam Reviews at action gates; Doc Actions awaiting dispatch | Human decides; Doc acts from approved brief |

See `docs/initiatives/chapter1-context-structure.md` §6 for the full context-layer map.

---

## Scope convention (exact match)

Trusted **Brain Truth** `Scope` field uses:

```text
read:brain-truth:<area>
```

Grant `Scope` must match a Trusted row **exactly** for retrieve to return it.

Chapter 1 demo areas (legacy): `positioning`, `governance`. Brain theme scope areas: see `chapter1-context-structure.md` §3 and Scope options under Trusted Brain Truth.

---

## Registry base

### Table: Brains

Primary field: **Brain Slug** (singleLineText)

| Field | Type | Notes |
|-------|------|-------|
| Brain Slug | singleLineText | Primary. e.g. `astrajax-chapter-1` |
| Brain Name | singleLineText | Display name |
| Purpose | multilineText | |
| Brain Type | singleSelect | Core, Domain — Core always present; Domain from operator template |
| Scope Area | singleLineText | Retrieval key slug, e.g. `core-governance`, `sales-forecasting`. Grants use `read:brain-truth:<area>` |
| Maturity | singleSelect | Seedling, House-Trained, Working, Sharp, Trusted, Elder |
| Workshop Base ID | singleLineText | `app…` ID |
| Trusted Base ID | singleLineText | `app…` ID |
| Status | singleSelect | Active, Paused, Retired |
| Domain Owner | singleLineText | |

### Table: Agents

Primary field: **Agent Slug** (singleLineText). Brain Key index of product and fleet agents with Agent bases.

**Roster authority (21 August 2026).** Shared identity and status — Agent Slug, Agent Name, Purpose, Agent Base ID, Repo Path, Status, Owner — are owned by Household Register **Household Members** (`tblJ70qtHUc1dUHhi`). Brain Registry mirrors that table as synced **Household Members** `tblTfxGnA5xWx2nAG` (do not write those synced columns). Registry **Agents** owns no native roster fact. Native columns below remain on this live table as copies until Doc rewires `airtable-ids.ts`. Do not recreate those columns. Do not delete this table to “make room” for sync.

| Field | Type | Notes |
|-------|------|-------|
| Agent Slug | singleLineText | Primary. e.g. `clive`, `pam`, `doc`, `clive-man`. Supplied by Household Members. |
| Agent Name | singleLineText | Display name. Supplied by Household Members. |
| Purpose | multilineText | Supplied by Household Members. |
| Agent Base ID | singleLineText | `app…` ID of the Agent base. Supplied by Household Members. |
| Repo Path | singleLineText | Canonical build pack / agent definition in repo. Supplied by Household Members. |
| Status | singleSelect | Active, Paused, Retired. Supplied by Household Members. |
| Owner | singleLineText | Supplied by Household Members. |

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

### Table: Implementation Jobs

Primary field: **Job ID** (singleLineText). Live table `tblkNN9hqnPPAseMl` (2 Aug 2026). Architecture §9 thin slice — see [`build-velocity-tracks.md`](./build-velocity-tracks.md).

| Field | Type | Notes |
|-------|------|-------|
| Job ID | singleLineText | Primary |
| Approved Brief ID | singleLineText | Required — no orphan worker runs |
| Action Type | singleSelect | hyperagent_export_regen, cursor_repo_build, other |
| Status | singleSelect | Approved, Running, Draft ready, Failed, Needs review |
| Idempotency Key | singleLineText | brief+action; refuse duplicate Draft ready |
| Prompt Hash | singleLineText | |
| Execution Prompt | multilineText | No secrets |
| Generator Path | singleLineText | Repo-relative for regen jobs |
| Artifact Paths | multilineText | Draft outputs |
| Diff Summary | multilineText | |
| Error | multilineText | |
| Executing Agent | singleLineText | |
| Approved By | singleLineText | |
| Change Log Entry ID | singleLineText | String link to Change Log |
| Notes | multilineText | Never secrets |

Worker: `scripts/process_implementation_job.py`. Owner: Cursor Doc dispatch + worker (not HA On-Platform Doc).

### Table: Operator State

Primary field: **Operator ID** (singleLineText). Live table `tblnomux0JXU29HhP` (4 Aug 2026, Phase 1 IA build, PR #64). One record per operator; the state contract's six authoritative facts (`website/src/lib/platform/operator-state.ts`).

| Field | Type | Notes |
|-------|------|-------|
| Operator ID | singleLineText | Primary. e.g. `op_…` |
| Email | singleLineText | |
| Role | singleSelect | `owner`, `member`, `internal` — Fact 5 (permissions). `internal` unlocks back-of-house (`/dispatch`, `/deploy`, `/fleet`, `/command`) |
| Journey Chapter | number | 1, 2, or 3. Null once journey is retired — Fact 1 |
| Journey Step | singleLineText | Free-form step id owned by the chapter's own step machine. Null with Journey Chapter |
| Completed Chapters | multilineText | JSON array of chapter numbers |
| Owned Brain Slugs | multilineText | JSON array of brain slugs — Fact 2 |
| Configured Functions | multilineText | JSON array of household function ids (`study`, `court`, `brain-vault`, `receiving-wall`, `workshop`, `lodge`, `physician`, `coach`) — Fact 3 |
| Introduced Members | multilineText | JSON array of Court role ids the curriculum has introduced — Fact 4 |
| Last Safe Destination | singleLineText | Server-authored resume URL. **Never client-supplied** — written only by `/api/journey/progress` and sign-in. Fact 6 |
| Updated At | dateTime | ISO 8601 |

**Field-name convention departure:** unlike other Registry/Workshop/Trusted tables, this table's Airtable backend (`website/src/lib/platform/operator-store/airtable-store.ts`, `OPERATOR_STATE_FIELDS`) addresses columns by **field name string**, not a `BRAIN_REGISTRY_*_FIELDS` field-ID map in `airtable-ids.ts`. Only the table ID (`BRAIN_REGISTRY_TABLES.operatorState`) is exported. Keep this doc in sync with `airtable-store.ts` if fields change — that file, not `airtable-ids.ts`, is the field-name source of truth for this table.

**Backend fallback:** `useMemoryOperatorStore()` selects the in-memory store instead of Airtable when `OPERATOR_STATE_TABLE_ID`/`BRAIN_REGISTRY_WRITE_TOKEN` (or `_READ_TOKEN`) are unset, or when `OPERATOR_STATE_USE_MEMORY=true`. Intentional graceful degradation, not a failure mode — same convention as other brains config fallbacks.

---

## Workshop base

### Table: User Brains

Primary field: **User Label** (singleLineText)

| Field | Type | Notes |
|-------|------|-------|
| User Label | singleLineText | Primary |
| Archetype | singleSelect | Founder, Function Leader |
| Primary Function | singleSelect | Sales, Marketing, Product, Operations, Finance, Customer Success, People, Other |
| Brain Set | multilineText | JSON or structured text: confirmed brain theme slugs from template |
| One Line Remit | multilineText | Plain-language ownership |
| Role Domain | singleLineText | Legacy free-text; prefer Archetype + Primary Function |
| Guide Mode | singleSelect | Full Story, Light Story, No Story |
| AI Confidence | singleSelect | New, Comfortable, Expert |
| Context Environment Confidence | singleSelect | New, Comfortable, Expert |
| Strengths | multilineText | **Required at Step 0C.** Self- or manager-reported; brief evidence encouraged |
| Weaknesses | multilineText | **Required at Step 0C.** Standing gaps or areas they want support — not duplicate of Development Focus |
| Coaching Preferences | multilineText | **Required at Step 0C.** Learning style preference — pace, tone, teach-as-you-go, how they learn |
| Development Focus | multilineText | Optional. 1–2 active growth areas (time-bound; may overlap a weakness) |
| Development Notes | multilineText | Optional Coach Whit context |
| Psychometric Reference | multilineText | Optional. Link/note/upload (Insights, MBTI, colour profile, etc.) — reference only, not clinical diagnosis |
| Notes | multilineText | Competency notes, hybrid remit, etc. |

**Operator Development — why and sensitivity (29 Jun 2026):** Strengths, Weaknesses, and Coaching Preferences exist so Clive calibrates pace, tone, and teaching style and Pam tunes coaching sensitivity — not to judge, rank, hire, or surveil. Workshop only; never Trusted Brain Truth. Required at Step 0C with bar **honest enough to be useful** (brief bullets OK). Psychometric Reference optional — no pressure. Pam treats unevidenced self-reports as soft claims. Full framing: `chapter1-context-structure.md` §2.4; product loop: `architecture.md` Step 0C.

### Table: Draft Brain Truth

Primary field: **Title** (singleLineText). **Workshop only** — never approved canonical truth.

One row is one proposed claim. Dual text is **one claim, two registers** — both can be canon if they keep the same meaning. Human-review fields are an **AstraJax platform-builder loop for Doc** (skills / agent configs). Not for clients. Not a per-row promotion queue. Recorded 17 Aug 2026 (`rpt-draft-truth-builder-overlay-20260817`, `rec7CebyrzBHYzELy`).

| Field | Type | Notes |
|-------|------|-------|
| Title | singleLineText | Primary |
| Canonical Text for Agents | multilineText | Complete register for agents. Same meaning as the human text; do not strip facts. Field ID `fld95ls0LG26rCNx4` |
| Canonical Text for Humans | multilineText | Plain register of the same claim (no record IDs). Capture agents write this at create. Field ID `fldbnsCNSXmLXE51y` |
| Brain Slug | singleLineText | Free text. **Not** a destination on its own — always link Brain Registry too |
| Brain Registry | link → Workshop Brain Registry (`tblsI93ayQm4hq5bw`) | The destination. Capture agents link a live brain at create. Field ID `fldB1vIzRA6NBxEYs` |
| Brain Theme | singleLineText | Theme slug, e.g. `core`, `sales-forecasting` |
| Proposed Category | singleSelect | Workshop sorting only — not access control. See universal set below. |
| Record Type | singleSelect | Truth Claim, Amendment, Open Question, Next Step, Test, Parked Idea. Field ID `fldCViiokjEMdp3vb` |
| Horizon | singleSelect | Persistent, Long-term, Short-term, Fleeting. Field ID `fldEgLQcvc6L4c9p1` |
| Capture Source | singleSelect | Chat Session, User Guided Capture, External Context Capture. Field ID `fld9zhLHPvjnq8lHT` |
| Source Documents | link → Source Documents | Inverse of that table's **Linked Drafts**. Link when a file is the evidence. Field ID `fldsspqpNL4vDUU50` |
| Context Amendment Versions | link → Context Amendment Versions | Inverse of **Target Draft**. Link when the row came from the V1 queue. Field ID `fldAeXTX1uLgkNa5d` |
| Status | singleSelect | Draft, Quarantined, Rejected, Promoted — agents write **Draft** / **Quarantined** only; **Rejected** / **Promoted** read-and-respect; **Approved** and **Accepted with amendments** are observed drift (never write); distinct from Source Document Mine Status **Proposed** |
| Proposed By Agent | singleLineText | e.g. clive |
| Created By | singleSelect | Matthew, Agent, Website, TL |
| Human Reviewed | checkbox | Sole “looked at” signal. Unticked = ignore overrides, scores, and notes. Does not mean approved or promoted. `fldi0T3Kq4psOpLoi` |
| Human Chosen Brain / Category / Record Type / Horizon | link or singleSelect | Overrides. Empty + reviewed = no correction. Empty + not reviewed = ignore |
| Readability Rating / Capture Quality / Context Importance | rating 1–5 | Optional builder scores. Ignore unless Human Reviewed. Blank + unreviewed is not a kill |
| Readability Notes / Capture Quality Notes / Builder Notes | multilineText | Why the score, or Matthew’s note for Doc. Ignore unless Human Reviewed |
| Should Have Been Auto-Handled | checkbox | Ticked = should have landed in Draft without human attention. Never a Trusted auto-promote. Ignore unless Human Reviewed. Was `Needed Human Review?`. `fldWEGX7L3cGuqxe9` |
| Follow-up Candidate | checkbox | Digest input only — not an instruction to ask |
| Related Projects | link → Projects | Optional. **Clive's Man the HEAD** (Sol) looks at the live Active Projects list and puts `rec…` IDs or none in the brief. Morning links come from the **scheduled head pass** (06:30, leave OFF) — not Auditor, not Intake, not the proposer. Cheap proposer/challenger/executor copy, veto, or write those IDs only — they do not choose. Blank is legal if the head said none. Inventing a project or creating a Projects row is forbidden. Challenger may veto (missing, not Active, unjustified) but veto is not a new choice. A document upload is not a substitute. Persistent truths may have none. `fld9wY5ncNSeMxVye` |

**Do not copy the builder-review overlay into client brain bases.**

**Draft Brain Truth rename warning (17 Aug 2026):** `Canonical Text` on this
table was renamed to **Canonical Text for Agents**. Website creates go through
`website/src/lib/brains/draft-truth-write.ts` and key Airtable REST writes on
**field IDs**, so a future rename cannot break capture again. HyperAgent writes
already use field IDs. The v0.4 family pack accepts the human register, Brain
Registry link, and optional Related Projects from HEAD-chosen IDs only, and
refuses the builder-review overlay; human re-import of the pack remains open.
Trusted **Brain Truth** still uses
`Canonical Text` — do not rename it there.

### Table: Projects

Primary field: **Project Name** (singleLineText). **Workshop only.** Live table `tbl5jo7EKBxAjjKbf` (17 Aug 2026). One row is one bounded piece of work Matthew has recognised, with a named outcome and a close point. Not a task tracker. Soft retire = Lifecycle Closed. Hard retire = delete the table.

| Field | Type | Notes |
|-------|------|-------|
| Project Name | singleLineText | Primary. Only home for the name. `fldonDAGcLRG2GEzD` |
| Intended Outcome | multilineText | What done looks like. `fldrb5LY13Feofm2l` |
| Lifecycle | singleSelect | Active / Paused / Closed. `fld4SAa3XCObipxa8` |
| Related Drafts | link → Draft Brain Truth | Reciprocal of Related Projects. `fldHUpN0X5IlvClU8` |

No owner, deadline, priority, next action, or weekly auto-create. Agents never create a project row. The HEAD decides the link (on-demand brief, or the scheduled 06:30 pass — leave that slot OFF). Cheap hands copy or write IDs only. Auditor, Activity Intake, and Ambient must not invent a project or write a guessed link. Do not copy into client brain bases. Recorded `rpt-projects-thin-table-20260817`.

**Seed projects (Active, live-observed 17 Aug 2026):**

| Project Name | Record ID |
|---|---|
| Establish K3 Open-Weights Fine-Tuning for AstraJax | `rec9deYmfHS8s39za` |
| Manage AstraJax Context On-Platform | `rechmkpaan4o4R6CT` |
| Prove Autonomous Agent Self-Improvement | `recH3hh1hPrLhsyVH` |

**Workshop Draft Brain Truth — Proposed Category options (canonical, 29 Jun 2026):**  
Definition, Goals & Priorities, Workflow, Data & Metrics, Rules & Guardrails, Knowledge, Examples & Edge Cases, Open Questions, Business Context, Adjacent Functions

Optional field (Goals rows): **Horizon** — Long-term, Active

**Legacy options (Chapter 1 — retire in Airtable UI when unused):**  
Business Definition, Positioning, Method, Offers, Proof, Workflow Rule, Governance

Mapping: `docs/initiatives/chapter1-context-structure.md` §4.2.

**Do not add to Workshop drafts:** `Scope`, `Category`, `Authority`, `Freshness`, or any Trusted-only field. Those are set on **new Trusted rows** at Doc promote.

### Table: Source Documents

Primary field: **Title** (singleLineText). **Workshop only** — uploaded source files for Clive's Man attachment mining. Not approved canonical truth.

| Field | Type | Notes |
|-------|------|-------|
| Title | singleLineText | Primary |
| Attachment | attachment | Source file |
| Attachment Summary | aiText OR multilineText | Native Airtable AI summarise of Attachment (manual UI conversion if MCP created multilineText placeholder) |
| Mine Status | singleSelect | Pending, Summarised, Proposed, Skipped |
| Brain Slug | singleLineText | Default `astrajax-chapter-1` |
| Proposed By Agent | singleLineText | Default `clive-man` |
| Created By | singleSelect | Matthew, Agent, Website, TL |
| Notes | multilineText | Optional sensitivity or source note |
| Linked Drafts | link → Draft Brain Truth | Draft rows proposed from this source |

**Mine Status workflow:**

- **Pending** — uploaded, awaiting summary
- **Summarised** — summary populated (Airtable AI or manual)
- **Proposed** — Clive's Man created draft rows
- **Skipped** — human opted out

**Manual UI follow-up (Phase B):** MCP cannot create `aiText` fields. Convert **Attachment Summary** from multilineText to Airtable AI summarise (source: **Attachment**). Set field defaults for **Brain Slug** and **Proposed By Agent** if desired.

Field IDs: `BRAIN_WORKSHOP_SOURCE_DOCUMENTS_FIELDS` in `airtable-ids.ts`.

### Table: Ambient Checkpoint Versions

Primary field: **Checkpoint Event ID** (`fld3ZfUhXoTx6UqLV`). **Workshop only** — append-only durable UTC cursor for Ambient Capture thread scans. Live table ID `tblRbjD0PHtuTWsIL` (Ruth V2 build, 12 Aug 2026).

| Field | Type | Notes |
|-------|------|-------|
| Checkpoint Event ID | singleLineText | Primary; immutable event key |
| Stream Key | singleLineText | e.g. `hyperagent:eligible-threads:clive-man-ambient-capture:v1` |
| Revision | number | Monotonic per stream |
| Event Type | singleSelect | Bootstrap, Observation, Advance, Pause, Resume, Held |
| Stream State | singleSelect | Active, Paused, Held |
| Previous Event ID | singleLineText | Hash-chain link |
| Cursor UTC | dateTime | Read back ISO/24h/timeZone `utc` |
| Cursor Token JSON | multilineText | Opaque restart token |
| Observed Through UTC | dateTime | Read back ISO/24h/timeZone `utc` |
| Backlog Lower Bound | number | |
| Backlog Measurement | singleSelect | Exact, Lower bound, Unknown |
| Disposition Unit Count | number | |
| Disposition Manifest Hash | singleLineText | |
| Run ID | singleLineText | |

**Grain:** one immutable row per checkpoint event. **Append-only** — no in-place edits or deletes by agents.

**Bootstrap (live-observed):** record `recHsDmDx00c636BP` — event `acp-genesis-hyperagent-ambient-v1`, revision 0, Bootstrap/Active, backlog 0/Unknown, run `ruth-build-bootstrap`.

**Activation boundary (distinct from schema):** checkpoint **schema resolved** (this table). Live Ambient still blocked on: `AMBIENT_CHECKPOINT_APPEND` credential **not minted**, 05:00 schedule **disabled**, **initial scan boundary not selected**, **UI source-order verification pending**. Persona Config v0.4 may still record the design-time sentinel `PENDING_RUTH_CHECKPOINT_STORE` — runtime sources use this table ID.

Field and choice IDs: `AMBIENT_CHECKPOINT_*` in `airtable-ids.ts`. Signed build: `AMBIENT_CHECKPOINT_BUILD_EVIDENCE`.

---

## Promote boundary (Workshop → Trusted)

Doc promote is a **copy-out**, not a status flip on one table.

1. Human approves via **Approval Decisions** (+ Pam at action gate if required).
2. Doc route reads draft **Title** and **Canonical Text for Agents** from Workshop only.
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

Standard tables: **Brain Truth** + **Brain Memories**. Theme bases may add companion tables for other grains (e.g. Creative **Media Assets**) — never put those grains into Brain Truth rows.

### Live: Trusted Brain — Creative (10 Aug 2026)

| | |
|---|---|
| Base | `AstraJax Trusted Brain — Creative` (`appvs1m7kP7lxRwcL`) |
| Registry slug | `creative` (`recf0bCHGNYlT7MU1`) |
| Brain Type | Domain |
| Scope areas | `creative-doctrine`, `creative-palette`, `creative-cast`, `creative-shipping` |
| IDs | `BRAIN_TRUSTED_CREATIVE_*` in `website/src/lib/brains/airtable-ids.ts` |

**Brain Truth Scope options (Creative):**  
`read:brain-truth:creative-doctrine`, `read:brain-truth:creative-palette`, `read:brain-truth:creative-cast`, `read:brain-truth:creative-shipping`

**Bytes:** Vercel Blob public website store. Airtable holds catalogue rows + Blob URLs — not duplicate attachment binaries.

### Table: Brain Truth

Primary field: **Title** (singleLineText). **Approved rows only** — if it is in this table, it is canonical. No Draft status field.

| Field | Type | Notes |
|-------|------|-------|
| Title | singleLineText | Primary |
| Canonical Text | multilineText | |
| Category | singleSelect | Canonical taxonomy — set at promote, not copied from draft |
| Scope | singleSelect | Grant match key — Trusted only. Format: `read:brain-truth:<area>` |
| Brain Theme | singleLineText | Theme slug matching Registry Brains / operator brain set |
| Authority | singleLineText | Approver or source doc |
| Freshness | singleSelect | Current, Review soon, Stale |
| Last Reviewed | date | ISO date |

**Trusted Brain Truth — Category options (canonical, 29 Jun 2026):**  
Definition, Goals & Priorities, Workflow, Data & Metrics, Rules & Guardrails, Knowledge, Examples & Edge Cases, Open Questions, Business Context, Adjacent Functions

Optional field (Goals rows): **Horizon** — Long-term, Active

**Legacy options (Chapter 1 — retire in Airtable UI when unused):**  
Business Definition, Positioning, Method, Offers, Proof, Workflow Rule, Governance

**Trusted Brain Truth — Scope options (Chapter 1 demo, legacy):**  
`read:brain-truth:positioning`, `read:brain-truth:governance` (canonical — use for grants until Core scope areas migrate)

**Scope options (brain theme areas — add via Airtable UI as templates roll out):**  
`read:brain-truth:core-identity`, `read:brain-truth:core-principles`, `read:brain-truth:core-governance`, `read:brain-truth:core-people`, `read:brain-truth:core-glossary`, `read:brain-truth:core-direction`, `read:brain-truth:core-business-context` (Function Leader overlay), `read:brain-truth:core-adjacent-functions` (Function Leader overlay), plus domain slugs from `chapter1-context-structure.md` §3.3

Legacy options still present in live Airtable (retire when unused): `read:brain-context:positioning`, `read:brain-context:governance`. Also delete the **LEGACY Scope (delete in UI)** text field on Brain Truth when convenient.

**Manual UI follow-up (Phase B):** MCP `update_field` cannot bulk-add singleSelect choices. Universal Category options and Scope options were only partially applied — add any missing choices and retire legacy options in the Airtable UI (not via MCP).

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

**Phase 2 — Context Health fields (pending, 29 Jun 2026):** Not yet in live Airtable. Phase 1 product UI uses demo data only (`website/src/lib/platform/brain-health.ts`). Add via `@doc-brain-base-builder` when Matthew approves schema work:

| Field | Type | Notes |
|-------|------|-------|
| Importance | number (1–5) | Curation score — see `architecture.md` §7 Context Health |
| Lifecycle | singleSelect | Draft, Working, Trusted, Retired — maps to §7 lifecycle (display "Working" for legacy Active rows) |
| Last Referenced At | dateTime | Agent telemetry — when memory was last used in a response |
| Retire Eligible At | dateTime | Optional — when auto-retire rule first flagged the row |
| Usage Count | number (integer) | Times referenced in agent responses (telemetry) |

**Registry Brains — Phase 2 pending:**

| Field | Type | Notes |
|-------|------|-------|
| Risk Tolerance | singleSelect | Conservative, Balanced, Assertive — curator latitude per brain |

**Brain Interactions — Phase 2 pending (telemetry):**

| Field | Type | Notes |
|-------|------|-------|
| Memory Records Touched | multilineText | Comma-separated Brain Memory record IDs used in the response |
| Truth Records Touched | multilineText | Comma-separated Trusted Brain Truth record IDs used in the response |

**Promotion (one direction only):** Brain Memory → Workshop **Draft Brain Truth** → Trusted **Brain Truth**. Never Persona Memory → Brain Memory without human review at promote boundary.

**Curation:** Clive's Man (or equivalent steward) may quarantine or retire stale Brain Memories without a per-record human approval gate. Human gate applies at **promotion** to canonical truth.

### Table: Media Assets (Creative Trusted — add-on)

Primary field: **Title** (singleLineText). **One row = one creative file.** Companion grain on the Creative Trusted base only (unless another theme explicitly adopts the same shape). Not Brain Truth.

| Field | Type | Notes |
|-------|------|-------|
| Title | singleLineText | Primary |
| Asset Key | singleLineText | Stable logical key for code/agents (e.g. `halvard.tower-loop`) |
| Blob Pathname | singleLineText | Path inside the public website Blob store |
| Blob URL | url | Public Vercel Blob URL — SSOT for bytes |
| Character Pack | singleSelect | Clive, Ruth Hadley, Halvard Bjornson, Brain Vault, Folio Furniture, Shared |
| Kind | singleSelect | Hero, Loop, Poster, Cutout, Matte, Furniture, Still, Other |
| Status | singleSelect | Rough, Locked, Retired — only **Locked** is agent-safe for production |
| Mime | singleLineText | e.g. `image/png`, `video/mp4` |
| Width | number (0dp) | Optional pixel width |
| Height | number (0dp) | Optional pixel height |
| Source SHA-256 | singleLineText | Hash of uploaded bytes |
| Authority | singleLineText | Approver or art director |
| Notes | multilineText | |
| Last Reviewed | date | ISO date |
| Governed By Truth | link → Brain Truth | Optional doctrine that governs this asset |

**Hard grain rule:** do not store file catalogues as Brain Truth rows. Doctrine → Truth; files → Media Assets.

**Promotion of status:** Rough → Locked is a human gate (Tara-Lee / Matthew). Agents may propose Rough rows; they must not self-promote to Locked.

---

## Agent base (one per agent)

Name pattern: `AstraJax Agent — {Agent Label}` (e.g. `AstraJax Agent — Clive`).

**Do not mix agents in one Agent base.** Character state, narrative arch, and persona memories stay isolated so business-truth retrieval never pulls Victorian subtext.

**This base is the authoring surface for the agent** (decision 25 Jun 2026; canonical statement in [`architecture.md`](../business/architecture.md) §7 → "Agent Authoring Surface"). HyperAgent is the primary runtime, so humans author the agent **here**: character backstory in **Narrative Arch**, system prompt / rules / output format in **Persona Config**, and the agent's **skills** here too (a skill is just text + a `whenToUse` trigger + a pinned/load flag, the same shape as the memory rows). A generator (a script that reads Airtable and writes out the agent files — the `hyperagent/builds/build_*.py` pattern, run by Doc) then emits **both** the HyperAgent export JSON and the Cursor `.cursor/agents/*.md` + `.cursor/skills/*/SKILL.md` files. The repo `.cursor/` files and build packs are **generated artifacts, not hand-authored sources of truth**. Skills authored here pass the **same human-approval gate** as Narrative Arch and Persona Config before generation or publish.

### Table: Narrative Arch

Primary field: **Title** (singleLineText). Slow-changing, approved **character spine** — not episodic memory. Holds **Tier 1 (Super Objective)** and **Tier 2 (Known Truths)** of the tiered character-context model below.

| Field | Type | Notes |
|-------|------|-------|
| Title | singleLineText | Primary. e.g. Super Objective, Inner Attitude |
| Body | multilineText | Approved narrative / dramaturgical content |
| Arch Type | singleSelect | Super Objective, Inner Attitude, Relationships, Outer Character, Other |
| Status | singleSelect | Approved, Retired — lifecycle (active vs retired) |
| Provenance Status | singleSelect | **Pending**, **Approved-Canonical** — the agent-write gate. Agent writes default to Pending; Matthew promotes to Approved-Canonical |
| Tier | singleSelect | `Tier 1 — Super Objective`, `Tier 2 — Known Truth` — which context tier this record is |
| Known Truth Slot | singleSelect | One of the fixed five (set only when Tier = Known Truth): `1 — Formative Memory`, `2 — Secret`, `3 — Baseline Relationship Stance`, `4 — Greatest Fear`, `5 — Inner Attitude` |
| Injection Priority | number (precision 0) | Out of 5. `5` = Super Objective (always inject), `4` = Known Truth (always inject, capped at five) |
| Last Reviewed | date | ISO date |
| Source Notes | multilineText | character-provenance, Lazlo brief, Matthew approval |

Human approves Narrative Arch changes. This is the **bible**, not the diary.

#### Tiered character context (Tiers 1 and 2)

Each agent's character truth is held in three tiers ordered by injection priority, so the most important truth is always in front of the runtime and context cannot bloat:

- **Tier 1 — Super Objective (5/5, always injected).** One selfish sentence (two at a push) that animates the character across its whole life. Canonical. **At most one active per character.** It holds the truth; everything else is colouring in.
- **Tier 2 — Known Truths (4/5, always injected, capped at five).** Exactly **five** canonical, never-changing bedrock records — one per slot:
  1. **Formative Memory** — the happiest and saddest memory, framed as the formative memory that set the Super Objective.
  2. **Secret** — something the character has never told anyone.
  3. **Baseline Relationship Stance** — the fixed baseline opinion of each other agent (evolving relationship developments live in Tier 3 Memories and link back here).
  4. **Greatest Fear** — immutable; it mirrors the Super Objective.
  5. **Inner Attitude** — the character's innate temperament, tempo, and animal (the *how*, not the *want*). Does not duplicate the Super Objective.
- **Tier 3 — Persona Memories (3/5, retrieved on demand).** See the **Persona Memories** table below.

**Five-record cap (Tier 2):** the "exactly five" rule is a curation discipline, not a database constraint — Airtable does not cap rows by slot. Keep one record per `Known Truth Slot`; the generator and any Interface view should surface the five-slot set so duplicates or gaps are obvious.

**Write-with-approval gate:** the Lazlo character-craft lane may write Tier 1 and Tier 2 records, but every agent write lands as **Provenance Status = Pending**. Only Matthew promotes to **Approved-Canonical**. Existing human-authored canon is **Approved-Canonical**.

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

**Canonical home for technical role specs (27 Jun 2026):** each Chapter 1 agent's operational contract lives here — not in `.cursor/skills/` or duplicated in `architecture.md` §4 prose. Record IDs: `website/src/lib/brains/airtable-ids.ts` (`*_PERSONA_CONFIG`). Character spine stays in **Narrative Arch** on the same base.

### Table: Persona Memories

Primary field: **Memory Text** (singleLineText). **Non-canonical tier (Tier 3)** — episodic role recall tracking how the character **develops** over time. Auto-form; **no human approval on create**. Retrieved on demand (3/5), not always injected.

| Field | Type | Notes |
|-------|------|-------|
| Memory Text | singleLineText | Primary |
| When to Use | multilineText | Trigger line for runtime injection |
| Known Truth | multipleRecordLinks → Narrative Arch | **The memory → truth link.** Every memory hangs off **exactly one** of the five Known Truths. See enforcement note below |
| User Scope | singleSelect | Global, User-specific, Session |
| User Label | singleLineText | When User Scope is not Global |
| Session ID | singleLineText | When User Scope is Session |
| Status | singleSelect | Active, Stale, Promoted, Retired — Tier 3 writes default to **Active** (non-canonical, no pending gate) |
| Freshness | singleSelect | Current, Review soon, Stale |
| Last Reviewed | date | ISO date |
| Created By | singleSelect | Agent, Matthew, TL, System |
| Source Notes | multilineText | Interaction ID or trigger — not full trusted text |

**Memory → truth link (Tier 3 → Tier 2):** every Persona Memory must link to exactly one Known Truth record in **Narrative Arch**, so a development hangs off the bedrock it belongs to (e.g. "Pam told me off, she can be so prickly" links to truth 3, the baseline stance on Pam; "worried people might find out" links to truth 2, the secret).

> **Enforcement note (MCP limitation):** Airtable's schema API (and the MCP server) cannot mark a linked-record field as *required* or as *single-link only*. The `Known Truth` field is a `multipleRecordLinks` field. "Exactly one, required" is therefore enforced at **two** layers, not at the table schema: (1) the **write path** — the Lazlo generator / any server write must populate exactly one Known Truth on every memory; and (2) an optional **Interface form** with the field toggled required and limited to one link (a Matthew manual step in the Airtable UI). Document any such form when built.

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
2. Create **Workshop** base with seven tables (includes **Source Documents** for Clive's Man attachment mining).
3. Create **Trusted Brain** base for the theme with **Brain Truth** + **Brain Memories** (no Personas table).
4. Create **Agent** base per agent with four tables: Narrative Arch, Persona Config, Persona Memories, Minions. For the tiered character-context model, add to **Narrative Arch**: `Provenance Status` (Pending / Approved-Canonical), `Tier`, `Known Truth Slot`, `Injection Priority`; and to **Persona Memories**: the `Known Truth` link field (→ Narrative Arch). Seed one Pending Super Objective and five Pending Known Truth slot records as structure (not canonical content).
5. Registry **Brains** row: slug, name, workshop + trusted base IDs, maturity Seedling, status Active.
6. Household Members row per agent (slug, name, purpose, agent base ID, repo path, status Active, owner). Brain Registry mirrors that table at `tblTfxGnA5xWx2nAG`. Native Registry **Agents** is still the Brain Key index the website reads — do not invent a second roster.
7. Seed Trusted **Brain Truth** with scopes using `read:brain-truth:<area>` convention.
8. Seed Agent bases with structure/placeholders only — not client-approved narrative or business truth.
9. Update [`airtable-ids.ts`](../../website/src/lib/brains/airtable-ids.ts) with new `app` / `tbl` IDs.
10. Create scoped Airtable tokens per base role (see credential map in `brain-key-wiring.md`).

**Live Chapter 1 migration (completed 24 Jun 2026):** Workshop `Proposed Category` (singleSelect) added; Trusted `Category` and `Scope` converted to singleSelect; seed rows updated. Delete the two `LEGACY ... (delete in UI)` text columns in Airtable when convenient — MCP cannot remove fields.

**Live Chapter 1 four-base migration (completed 25 Jun 2026):** Trusted Brain Chapter 1 now has **Brain Memories** and the legacy **Personas** rows have been migrated into per-agent Agent bases (Narrative Arch + Persona Config). Legacy Personas table removed in Airtable UI (26 Jun 2026).

**Live Chapter 1 Phase B migration (completed 29 Jun 2026):** Registry Brains `Brain Type` + `Scope Area`; Workshop User Brains identity + Operator Development fields; Draft/Trusted `Brain Theme` + `Horizon`. Field IDs in `airtable-ids.ts`. Manual UI: universal Category/Scope select options + LEGACY Scope field delete — see Trusted Brain Truth section above.

**Live Chapter 1 Source Documents (completed 29 Jun 2026):** Workshop **Source Documents** table for Clive's Man attachment mining. Field IDs in `BRAIN_WORKSHOP_SOURCE_DOCUMENTS_FIELDS`. Manual UI: convert **Attachment Summary** to Airtable AI summarise field.

**Live Operator State table (completed 4 Aug 2026, PR #64):** Registry **Operator State** table for the Phase 1 IA state contract. Field names (not a field-ID map) in `operator-store/airtable-store.ts`. See table section above.

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
- [Doc Brain Base Builder](./doc-brain-base-builder.md) — runbook + Chapter 1 inventory
- [Doc Brain Base Builder (Cursor)](../../.cursor/agents/doc-brain-base-builder.md) — Cursor subagent
- [Architecture](../business/architecture.md) §7 — four-base model governance
