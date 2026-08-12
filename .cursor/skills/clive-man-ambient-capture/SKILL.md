---
name: clive-man-ambient-capture
description: >-
  Governed Ambient Capture skill for Clive's Man. HyperAgent 05:00 Europe/London;
  CREATE_DRAFT_TRUTH only; actor clive-man-ambient-capture; searchthreads +
  execute-script tools only.
---

# clive-man-ambient-capture

> **Runtime:** HyperAgent minion — Cursor registry mirror for fleet sync / Builder handoff.

## Purpose

Scheduled unattended capture from eligible Hyperagent workspace threads. Creates
**V1 Context Amendment Version** proposal rows only — never approves, never
touches Trusted canon, and **never writes Draft Brain Truth directly**.

## Schedule (repo contract)

| Property | Value |
|----------|-------|
| Cron | `0 5 * * *` Europe/London |
| Enabled | **false** until append credential + boundary + UI verification |
| readOnlyMode | `false` (metadata; UI verify required) |
| Model | Kimi K3, effort **low** |
| maxBudgetUsd | **20** |

## Actor and payload (frozen)

| Key | Value |
|-----|-------|
| Actor literal | `clive-man-ambient-capture` |
| Pen | `CREATE_DRAFT_TRUTH` (V1-only create; Stage=V1 immutable proposal rows) |
| Status field | `fldiMCxuBITyZIOXW` = **Draft** |
| Proposed By Agent | `flde1d1sda9lWwrj9` = `clive-man-ambient-capture` |
| Capture Source | `fld9zhLHPvjnq8lHT` = **Chat Session** (`sel16ONJz9yPx76hH`) |

## Tools (exact boundary)

Enabled only:

- `searchthreads`
- `execute-script`

All other tools **false**. Global tables **false**. Native integrations **none**.

## Credential

One create-only credential to Brain Workshop `appL2fdnGmhA02WXd` /
Context Amendment Versions `tblsuOKGjSGYv0Vov` (V1 proposal queue only).
PAT is **base-scoped read+write** (dedupe preflight + readback); the typed script
enforces writes to Amendment Versions only — never Draft Brain Truth directly.

## Run order (mandatory)

1. **Household Activity Logging** — create the V1 run report (`FLEET_ACTIVITY_WRITE`).
2. Pass the returned report record id as `v1_report_record_id` on every candidate
   submitted to `ambient_v1_intake.py`.

## Checkpoint (schema resolved — activation gated)

| Property | Value |
|----------|-------|
| Table | Ambient Checkpoint Versions `tblRbjD0PHtuTWsIL` |
| Bootstrap | `recHsDmDx00c636BP` — event `acp-genesis-hyperagent-ambient-v1`, revision 0 |
| Append pen env | `AMBIENT_CHECKPOINT_APPEND` — **not minted** |

**Checkpoint schema resolved** (Ruth V2, 12 Aug 2026). Live import and 05:00
enablement remain blocked until: `AMBIENT_CHECKPOINT_APPEND` minted, **initial scan
boundary selected**, **UI source-order verification** complete. Schedule metadata:
present, **disabled**.

Field and choice IDs: `AMBIENT_CHECKPOINT_*` in `website/src/lib/brains/airtable-ids.ts`.
Signed build: `AMBIENT_CHECKPOINT_BUILD_EVIDENCE`.

## Throughput

Scan every eligible thread after durable UTC checkpoint. **No** record-count cap.
Intake chunks drain uncapped with requeue. Maintenance cap **5** only (separate lane).

## Failure policy

Per-lane failure cap **2**. Three-run backlog report alarm only — not a hard stop
on first miss.

## Must not

- Approve, promote, or write Trusted Brain Truth.
- Write Draft Brain Truth directly — V1 proposal queue only.
- Enable tools beyond searchthreads + execute-script.
- Alias the actor slug to another name.
- Enable schedule without UI verification pass.
- Claim checkpoint append credential minted or 05:00 schedule enabled.

## Acceptance tests

- AMB-001: Actor literal exactly `clive-man-ambient-capture`.
- AMB-002: Payload status Draft + Capture Source Chat Session choice ID.
- AMB-003: Only searchthreads + execute-script enabled.
- AMB-004: Create credential scoped to Context Amendment Versions (`tblsuOKGjSGYv0Vov`) V1 queue only — not Draft Brain Truth.
- AMB-005: Checkpoint table `tblRbjD0PHtuTWsIL` + bootstrap `recHsDmDx00c636BP` documented; activation gates explicit.
- AMB-006: Schedule present and disabled in repo metadata.
