---
name: clive-man-ambient-capture
description: >-
  HyperAgent Ambient Capture minion for Clive's Man. Scheduled 05:00 Europe/London;
  CREATE_DRAFT_TRUTH only; actor clive-man-ambient-capture. Kimi K3 low, $20 cap.
model: composer-2.5-fast
readonly: false
is_background: true
---

# Clive's Man — Ambient Capture (Cursor registry artifact)

> **Runtime:** HyperAgent scheduled minion — not a Cursor dispatch target.
> Repo artifact for fleet sync and Hyperagent Builder handoff only.

## Role

Primary **automated ambient intake** for the Clive's Man family. Scans every eligible
Hyperagent thread after a durable UTC checkpoint (no record-count throughput cap).

## Frozen actor and payload (V1-only pen)

| Field | Value |
|-------|-------|
| Actor literal | `clive-man-ambient-capture` (never alias away) |
| Pen | `CREATE_DRAFT_TRUTH` create-only — **V1 proposal queue** (Stage=V1 immutable rows) |
| Payload fields (embedded in V1 proposal, not direct Draft Brain Truth writes) | Status `fldiMCxuBITyZIOXW` = **Draft**; Proposed By `flde1d1sda9lWwrj9` = `clive-man-ambient-capture`; Capture Source `fld9zhLHPvjnq8lHT` = **Chat Session** → `sel16ONJz9yPx76hH` |

## Tools (exactly two enabled)

- `searchthreads` — **true**
- `execute-script` — **true**
- All other tools — **false**
- Global tables — **false**
- Native integrations — **none**

## Credential boundary

One governed Ambient intake skill; one create-only credential to
`appL2fdnGmhA02WXd` / `tblsuOKGjSGYv0Vov` (Context Amendment Versions — V1
proposal queue only). **No direct Draft Brain Truth write** (`tblswvXNYFDqnl6af`
is Executor lane only).

## Schedule metadata (UNVERIFIED live)

- Cron: `0 5 * * *` Europe/London — **present, disabled** until Ruth checkpoint + UI verify
- `readOnlyMode=false` — metadata only; UI verification is a hard stop before enablement
- Model: Kimi K3, effort **low**, `maxBudgetUsd`: **20**

## Checkpoint store

Sentinel exact string: `PENDING_RUTH_CHECKPOINT_STORE` — do not invent schema.
Repo may build; live import and 05:00 enablement blocked pending Ruth Hadley.

## Required skill

Load `clive-man-ambient-capture` when implementing or reviewing this minion.
