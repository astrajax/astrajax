# Clive Context Architecture V1

**Status:** V1 operational architecture for Clive by AstraJax.  
**Audience:** Matthew, TL, and AI assistants working on context governance, agent instructions, skills, publishing, and context maintenance.  
**Last updated:** 30 May 2026

---

## 1. Purpose

Clive is the managed context environment for AstraJax. It keeps business rules,
source-of-truth documents, agent instructions, prompts, examples, approval
rules, workflow context, decision logs, and context packs clean enough for AI
agents to use safely.

Context Architecture V1 turns the current Intake-only setup into a governed
five-table system:

```text
Context Intake -> Context Items -> Context Packs -> Agent Environments
                                      |
                                      v
                                  Change Log
```

The system exists to make context easy to capture, review, approve, package,
publish, audit, and retire without turning any agent into an uncontrolled memory
or publishing machine.

---

## 2. Operating Principle

The V1 operating principle is:

```text
Airtable governs -> Hyperagent captures -> Cursor curates/builds -> GitHub versions -> humans approve
```

This is the Clive version of the AstraJax "boring layer first" rule. AI can help
with classification, curation, drafting, packaging, and implementation, but
human judgement owns approval and irreversible publication.

---

## 3. Source-Of-Truth Hierarchy

Use these sources in this order:

1. `clive_context_architecture_v1.md` for Context Architecture V1.
2. `agents/` (by platform), `.cursor/agents/`, `.cursor/skills/`, and
   `hyperagent/exports/` for live agent and skill behaviour.
3. `hyperagent/context_architecture_schema_v1.json` for Airtable table IDs,
   field IDs, allowed values, and write surfaces.
4. `astrajax_positioning.md`, `astrajax_ops_brief.md`, and `AGENTS.md` for
   AstraJax positioning, claim-control, and founder/background context.
5. `agent-model-collaboration-stack-notion.md` and
   `best-models-for-context-environments-notion.md` for model-role guidance.
6. Older draft packs such as `clive_intake_v1.md`,
   `clive_intake_first_draft_v0_2.md`, and
   `clive_intake_opus47_handover_v0_1.md` as historical reference only.

If sources conflict, prefer the higher-authority source and mark the conflict
rather than blending it silently.

---

## 4. Tables

### Context Intake

**Purpose:** Capture messy submissions and route them for human review.  
**Live table:** `tblJCmPGPUyszgFux` in base `appYv601Oq7fKTCj0`.

Allowed writer:

- Clive Intake only, via `hyperagent/scripts/create_context_intake.py`.

Allowed statuses for Intake writes:

- `New`
- `Needs clarification`
- `Ready for review`
- `Possible duplicate`

Intake must never set `Approved`, `Rejected`, `Published`, or `Deployed`.

### Context Items

**Purpose:** Store individual durable context records, from proposed candidates
through approved canonical context and eventual deprecation.

Allowed writers:

- Clive Curator may create `Proposed` records only after explicit Matthew
  confirmation.
- Matthew may approve, reject, or deprecate.
- Publisher may mark approved items as `Published` only as part of an approved
  publishing flow.

Required behaviour:

- Every item cites source records or source notes.
- Conflicts are visible.
- Authority and freshness are explicit.
- Pack membership is recommended by Curator but approved by Matthew.

### Context Packs

**Purpose:** Bundle approved context for a workflow, agent, audience, or
destination.

Examples:

- `AstraJax Core Positioning`
- `Clive Operating Rules`
- `Model Collaboration`
- `Context Architecture V1`

Allowed writers:

- Manual setup in V1.
- Curator may recommend membership.
- Publisher may update publication metadata after approval.

### Agent Environments

**Purpose:** Registry of agents, their platforms, responsibilities, skills, tool
permissions, and required context packs.

Initial records:

- Clive Intake
- Clive Curator
- Clive Publisher
- Clive Scanner

The table is seeded manually in V1 so the architecture can show future agents
without granting them operational authority before they exist.

### Change Log

**Purpose:** Append-only audit trail for approved and published changes.

Allowed writer:

- Publisher only, or a human acting explicitly as Publisher.

Rules:

- Never overwrite old audit entries.
- Every published pack or item needs a corresponding change log entry.
- If a publish is prepared but not completed, log it as `Draft` or
  `Prepared`, not `Published`.

### Emails

**Purpose:** Capture all inbound Gmail for audit and downstream routing.  
**Live table:** `tblq8QM5IegQxurYJ` in base `appYv601Oq7fKTCj0`.

Capture path:

```text
Gmail → Apps Script → Airtable webhook → Emails → AI category
```

Allowed writers:

- Apps Script webhook automation creates rows only.
- Clive Hyperagent Release Scanner may read Hyperagent Release rows and update
  `Scanner Status` after repo sync.

Rules:

- **Email Category** is set by Airtable AI structured data, not by agents.
- Scanner reads **Hyperagent Release** only; other categories are for future flows.
- Raw email in Airtable is capture evidence; curated platform truth stays in
  `docs/context/hyperagent-platform.md`.

Setup: `docs/context/email-inbox-setup.md`

---

## 5. Status Lifecycle

```text
New / Ready for review
  -> Proposed
  -> Needs decision
  -> Approved
  -> Published
  -> Deprecated
```

Supporting statuses:

- `Rejected` for context that should not proceed.
- `Draft` for manual seed records or publishing work not yet ready for review.

Approval gates:

1. Intake may only create review candidates.
2. Curator may only create proposed canonical candidates.
3. Matthew approves or rejects context.
4. Publisher publishes approved context only.
5. Change Log records the action.

---

## 6. Agent Boundaries

### Clive Intake

Clive Intake captures one context submission, classifies it, suggests a
destination, creates one `Context Intake` record, reads it back, and stops.

It must not curate, approve, publish, deploy, edit repo files, create memories,
or write outside `Context Intake`.

### Clive Curator

Clive Curator reviews intake records and approved source material, clusters
related context, exposes conflicts, and prepares review-ready context proposals.

In V1 it may create `Context Items` with `Status = Proposed` only after Matthew
confirms the exact proposal. It must not approve, publish, deploy, edit files
while acting as Curator, or process unbounded batches.

### Clive Publisher

Clive Publisher is the later export layer. It reads approved context items and
packs, prepares GitHub/Hyperagent/Notion updates, appends Change Log entries,
and stops for Matthew approval before any deployment or commit.

Publisher is not required for the first V1 setup, but the tables and schema must
leave a clean place for it.

### Clive Scanner

v0.4 is live on Hyperagent (`agent-clive-context-scanner-v0_4.json`). It scans
Airtable **Emails** (excluding Hyperagent Release), dedupes against Context Intake
and Context Items, and creates Context Intake records only after Matthew confirms.
A Cursor mirror exists for local dev. Hyperagent Release traffic stays with Clive
Hyperagent Release Scanner (Cursor-native).

---

## 7. Model Policy

Use the model committee principle, but start with the smallest reliable
operating loop.

- GPT-5.5: architecture, schema design, context packaging, eval design.
- Claude Opus 4.7: judgement-heavy curation, conflict review, risk review.
- Composer 2.5: Cursor-native implementation and repo changes after approval.
- Gemini 3.5 Flash: later bulk ingestion, eval generation, and scale work.
- Smaller models: later repeatable worker tasks once the quality bar is proven.

V1 does not require multi-model subagent orchestration. Document routing now;
activate subagents only after real batches show a clear need.

---

## 8. Bootstrap Workflow

The initial large content load is a controlled migration, not normal Intake
traffic.

1. Draft context maps, pack definitions, and source registries from existing
   repo documents.
2. Curate them into proposed Context Items.
3. Keep proposed records source-linked and reviewable.
4. Matthew approves or rejects records.
5. Approved records are linked into Context Packs.
6. Publisher or a human prepares versioned GitHub/Hyperagent/Notion outputs.

Ongoing work after bootstrap returns to the normal loop:

```text
Intake -> Review -> Curator -> Approval -> Publisher -> Change Log
```

---

## 9. Initial Packs

### AstraJax Core Positioning

Purpose: stable AstraJax positioning, founder proof, Butternut proof points,
claim-control, and sensitive-info guardrails.

Primary sources:

- `astrajax_positioning.md`
- `astrajax_ops_brief.md`
- `AGENTS.md`

### Clive Operating Rules

Purpose: Intake, Curator, Publisher, Scanner boundaries and the human approval
model.

Primary sources:

- `.cursor/skills/clive-context-intake/SKILL.md`
- `.cursor/skills/clive-context-curator/SKILL.md`
- `clive_context_architecture_v1.md`

### Model Collaboration

Purpose: practical model-role routing for architecture, curation, implementation,
scale, and evaluation.

Primary sources:

- `agent-model-collaboration-stack-notion.md`
- `best-models-for-context-environments-notion.md`

### Context Architecture V1

Purpose: table schema, lifecycle, write permissions, approval gates, and
publishing rules.

Primary sources:

- `clive_context_architecture_v1.md`
- `hyperagent/context_architecture_schema_v1.json`

---

## 10. V1 Acceptance Tests

V1 is operational only when these tests pass:

- Intake creates only `Context Intake` records.
- Intake cannot create approved, published, deployed, or canonical records.
- Curator can read intake and canonical tables.
- Curator can create only `Proposed` Context Items after explicit confirmation.
- Curator cannot approve, publish, deploy, or edit repo files while acting as
  Curator.
- Every Context Item has source evidence or source notes.
- Conflicts are marked and routed to Matthew.
- Context Packs link only intended context.
- Change Log is append-only.
- Publisher, when built, does not publish without Matthew approval.

---

## 11. Do Not Build Yet

Defer until the core approval pipeline is stable:

- Stale-context scans beyond Curator V5 scheduled audits.
- Autonomous GitHub commits or PRs.
- Automated Notion publishing.
- Memory creation or demotion.
- Large batch writes without Matthew review.
- Multi-model subagent routing.

Note: Context Scanner v0.4 and Curator V5 are live on Hyperagent; they operate
within the Intake/Proposed boundaries above.

The first win is a boring, inspectable context pipeline. Cleverness comes after
the audit trail works.
