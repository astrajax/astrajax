---
name: clive-man-activity-intake
description: >-
  Governed Activity Intake skill for Clive's Man (Cursor adapter). Reads Household
  Activity Sessions + exchange Activity via HOUSEHOLD_ACTIVITY_READ; creates V1
  Proposed only via UNVERIFIED AMBIENT_V1_CREATE. On-demand; actor
  clive-man-activity-intake-cursor.
---

# clive-man-activity-intake

> **Runtime:** Cursor on-demand adapter (`clive-man-activity-intake-cursor`).
> HyperAgent twin: `clive-man-activity-intake-hyperagent` (schedule intent in build pack only).

## Purpose

Read proven **human↔agent exchange** evidence from the Household Activity base and
propose **V1 Context Amendment Version** rows only — never approve, never touch Trusted
canon, and **never write Draft Brain Truth directly**.

This lane replaces none of the legacy HyperAgent thread scanner; it adds a parallel
intake axis grounded in Household Activity Sessions + Activity.

## Actor and pens (frozen)

| Key | Value |
|-----|-------|
| Actor literal | `clive-man-activity-intake-cursor` |
| Read pen | `HOUSEHOLD_ACTIVITY_READ` — GET-only |
| Write pen | `AMBIENT_V1_CREATE` — POST create-only (**UNVERIFIED** until minted) |
| Read base / tables | `appF7jQD4ZKrDC7e1` — Sessions `tblUi4nmBKX2u8nFx`, Activity `tblNxNLyC31KDQbRl` |
| Write base / table | `appL2fdnGmhA02WXd` — Context Amendment Versions `tblsuOKGjSGYv0Vov` |
| Forbidden direct write | Draft Brain Truth `tblswvXNYFDqnl6af` |

Credential routing: **reads and writes on separate tokens**. No GET on write token.
No PATCH/PUT/DELETE anywhere in this lane.

Field maps: `website/src/lib/platform-activity/ids.ts` (Household Activity);
Amendment Version field IDs in governed Brain Workshop contract maps (actor differs
from legacy thread intake — do not copy legacy actor constants).

## V1 payload contract

Every V1 create must include:

| Payload element | Rule |
|-----------------|------|
| Stage | `V1` |
| Verdict | `Proposed` |
| Action class | `CREATE_DRAFT_TRUTH` |
| Created By Agent | `clive-man-activity-intake-cursor` |
| after_payload.capture_source | **Chat Session** (semantic) |
| Capture Source Chat Session | Household Activity **Sessions** record id (`rec…`) — **same create payload, never blank** |
| Adapter version | `context-amendment-adapters-v2.0` |
| v1_report_record_id | Reports row from run report — required when checkpoint append is live |

**Never:** Draft/Trusted/V2 stages; updates; deletes; blank Capture Source Chat Session.

### Carry the Draft write contract into `after_payload`

This lane still never writes Draft Brain Truth. But the Context Executor can only
materialise what the proposal carries, so every `CREATE_DRAFT_TRUTH` payload must
include the material for the 17 Aug 2026 contract (see `clive-man` skill):

| Payload key | Why |
|---|---|
| `canonical_text` | Complete agent register |
| `canonical_text_for_humans` | Plain register of the same claim, no record IDs |
| `brain_slug` **and** `brain_registry` | The executor links a live brain; a slug alone is not a destination |
| `related_projects` | Do **not** choose. Leave blank unless a HEAD brief already supplied live `rec…` IDs. Never load the Active list to judge. Never invent. A document is not a substitute. |
| `record_type`, `proposed_category`, `horizon` | Routing the reviewer relies on |

The executor writes `related_projects` only when the payload already has live
`rec…` IDs. Do not pass a project name. Morning pipe default is blank.

## Phase-one eligibility (Activity rows)

Include **only** human↔agent **exchange** rows where **both** are non-empty:

- User Message (`user_message` / `fldzSTdm15GQf88Ph`)
- Reply Digest (`reply_digest` / `fldBj92Hu9gDesX6u`)

**Exclude entirely:**

| Exclusion | Reason |
|-----------|--------|
| **Reports** table | Out of scope phase one |
| Legacy thread-intake actor | `clive-man-ambient-capture` sessions/activity |
| This Cursor adapter | `clive-man-activity-intake-cursor` |
| HA partner adapter | `clive-man-activity-intake-hyperagent` |
| Session End | Closure rows, not exchange evidence |
| Agent Turn Type Action / Completion / Question | Routine mechanical noise |
| Rows missing either message field | Not a complete exchange |
| Trusted-brain or client secret bodies | Pen hygiene |

Join Activity → Sessions on session link / session id; carry Sessions record id into
**Capture Source Chat Session** on the V1 row.

## Analyst rubric (Context Proposal)

Keep a candidate only if it passes all five tests:

1. **Durable** — true beyond today, not transient logging noise.
2. **Useful** — to AstraJax or to AI supporting Matthew/TL.
3. **Attributable** — Sessions record + Activity event id prove source.
4. **Actionable** — a reviewer knows what to do with it.
5. **Novel** — dedupe against existing V1 dedupe keys / prior proposals.

Low-confidence or ambiguous source → skip (report in run summary, no V1).

## Throughput caps

| Mode | Max V1 creates per run |
|------|------------------------|
| First live | **1** |
| Steady state | **10** |

Dedupe preflight is mandatory before POST. Requeue skipped rows; do not lossy-drop on pen errors.

## Checkpoint stream

| Property | Value |
|----------|-------|
| Stream key | `household-activity:activity:clive-man-activity-intake:v1` |
| Storage | Ambient Checkpoint Versions `tblRbjD0PHtuTWsIL` (shared append-only table) |
| Append pen env | `AMBIENT_CHECKPOINT_APPEND` — shared infra; **not minted** in this build |

**Distinct from** legacy thread stream
`hyperagent:eligible-threads:clive-man-ambient-capture:v1` — **do not read, advance, or mutate**.

### Runtime lease interlock (`cursor_token_json`)

On every checkpoint **advance** observation, persist JSON:

```json
{
  "runtime_owner": "cursor",
  "lease_until_utc": "<ISO-8601 UTC>",
  "activity_cursor": { "last_event_id": "...", "last_created_time": "..." }
}
```

Before work:

1. Read stream tip.
2. Parse tip `cursor_token_json`.
3. If `runtime_owner` is set, not `cursor`, and `lease_until_utc` > now UTC → **refuse** fresh
   takeover; emit hold summary (no checkpoint fork).
4. If lease expired or owner is this runtime → acquire/extend lease, then proceed.

HyperAgent twin uses the same stream key and lease rules with `"runtime_owner": "hyperagent"`.

## Tool boundary

| Allowed | Forbidden |
|---------|-----------|
| Sealed GET script/path for Household Activity | Airtable MCP |
| Sealed POST script/path for V1 create | Browser |
| Repo reads for contract | Web search |
| Silent `fleet-activity-logging` | Direct workshop writes outside pen |

## Run order (mandatory when live)

1. **Household Activity Logging** — session + run report (`FLEET_ACTIVITY_WRITE`).
2. Pass report record id as `v1_report_record_id` on every V1 candidate.
3. Read → filter → propose → checkpoint (when pens minted).

## HyperAgent partner

| Slug | Role |
|------|------|
| `clive-man-activity-intake-hyperagent` | Scheduled HA adapter (same stream key + lease interlock) |

HA schedule metadata lives in `agents/registry/cursor/clive/activity-intake/build-pack-v0.1.md`
only — **not enabled in this Cursor build**.

## Must not

- Approve, promote, or write Trusted Brain Truth.
- Write Draft Brain Truth directly.
- Use Airtable MCP, browser, or web search in this lane.
- Alias the actor slug.
- Omit Capture Source Chat Session on any V1 create.
- Modify legacy v0.4 thread-intake artifacts (hash-preservation list in build pack).
- Mint credentials, import agents, or enable schedules (human gates).

## Acceptance tests

- ACT-INT-001: Actor literal exactly `clive-man-activity-intake-cursor`.
- ACT-INT-002: Read pen GET-only on Sessions + Activity; write pen POST-only on `tblsuOKGjSGYv0Vov`.
- ACT-INT-003: Exchange filter requires User Message **and** Reply Digest; Reports excluded.
- ACT-INT-004: Exclusion set includes legacy thread-intake + both adapter slugs + Session End + Action/Completion/Question noise.
- ACT-INT-005: Capture Source Chat Session populated on every V1 create payload.
- ACT-INT-006: First-live cap 1; steady cap 10.
- ACT-INT-007: Checkpoint stream key exactly `household-activity:activity:clive-man-activity-intake:v1`.
- ACT-INT-008: Fresh foreign runtime lease → refuse (no fork).
- ACT-INT-009: Legacy thread stream untouched.
- ACT-INT-010: No tool path uses Airtable MCP / browser / web search.

## Result format

```text
Action: Activity Intake (Cursor)
Executed: yes / no / blocked
Scanned:
Eligible:
V1 created:
Skipped:
Stream:
Lease:
Checkpoint:
Blocked pens:
Next human gate:
```
