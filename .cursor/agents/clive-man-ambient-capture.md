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

- Cron: `0 5 * * *` Europe/London — **present, disabled** until boundary + UI verify
- `readOnlyMode=false` — metadata only; UI verification is a hard stop before enablement
- Model: Kimi K3, effort **low**, `maxBudgetUsd`: **20**

## Checkpoint (schema resolved — activation gated)

| Property | Value |
|----------|-------|
| Table | Ambient Checkpoint Versions `tblRbjD0PHtuTWsIL` |
| Bootstrap | `recHsDmDx00c636BP` — event `acp-genesis-hyperagent-ambient-v1` |
| Append pen env | `AMBIENT_CHECKPOINT_APPEND` — **not minted** |

**Checkpoint schema resolved** (Ruth V2, 12 Aug 2026). Distinct from live enablement:
append credential not minted, 05:00 schedule disabled, **initial scan boundary not
selected**, **UI source-order verification pending**. Persona Config v0.4 may still
record design-time sentinel — runtime sources use this table ID.

## Required skill

Load `clive-man-ambient-capture` when implementing or reviewing this minion.
