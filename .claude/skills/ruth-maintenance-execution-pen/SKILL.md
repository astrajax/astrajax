---
name: ruth-maintenance-execution-pen
description: >-
  Applies Cleared-V2 Ruth maintenance actions on an allowlist (append rows, description-repair). Fail-closed.
---

# Ruth Maintenance Execution Pen (v1.0.0)


## Cursor runtime

Hyperagent `RunWithCredentials` is optional here. In Cursor:

1. Put required tokens in the environment the agent shell inherits (never print them).
2. Run skill scripts via `python3 .cursor/skills/<skill>/scripts/<file.py> ...` (mirrors under `.claude/skills/` and often `scripts/ruth/` for convenience).
3. Prefer Airtable MCP for discovery reads when available; pens remain the only mutation path for signed builds / Cleared-V2 maintenance.
4. If a credential or control-plane base is missing, refuse mutation and report the gap — do not improvise.

Action-specific live-estate adapters. **Fail closed**: anything outside the Cleared-V2 + allowlisted + before-hash-matching shape is rejected BEFORE any mutation and recorded as a Skip/Failure event.

## v0.1 unattended allowlist

- `append-control-row` — control-plane rows (reports, amendments, events).
- `append-docs-row` — missing-documentation rows in a maintenance-owned table.
- `description-repair` — description-only field/table repairs on enumerated targets (may ONLY set `description`).

**Never unattended:** operational-record updates; field/table creation in live bases; rename/type/select/computed changes; automation/interface changes; deletes; permissions; canon; reviewer fields; money; sends.

## Reversibility (every action)

`Native Revert` | `Validated Compensating Mutation` | `No Safe Rollback` (= Red, never unattended).

## Per-action contract

1. **Validate:** stage=V2, verdict=Cleared, action_class allowlisted, reversibility known (No Safe Rollback refused), target within the enumerated estate, description-repair sets only `description` and carries before_hash+before_snapshot, no duplicate amendment_version_id in the job (replay/dedupe).
2. **Mutation cap** (default 5/run): a valid action over budget is Skipped (not rejected).
3. **Read-before-mutate** for description-repair: re-read the target, enforce the observed before-state hash equals the amendment's before_hash. Mismatch = reject "target changed since challenge; returning to Ruth" (never silently repair).
4. **Execute** via the host native surface (fixture shim in fixtures).
5. **Reread** after mutation; append Attempt/Success/Failure/Readback/Compensation events with hashes.

## Caps / kill

Enumerated bases only; bounded changed objects/sample; candidate cap; max mutations/run; no bulk updates; stop on wrong base, before mismatch, hash failure, or **two consecutive failures** (halts the run).

## Retry / idempotency

A re-applied action finds the target already in the after-state, so its before-hash no longer matches and the retry is REFUSED rather than double-applied. This is the idempotent-retry contract (proven by fixture run D).

## Usage

`python3 maintenance_execution_pen.py --job /tmp/job.json [--fixture-drive] [--out report.json]`. Job carries `estate_allowlist` (bases/tables), `caps.max_mutations`, and the `actions[]` (each an amendment). `--fixture-drive` executes through the deterministic shim (fixtures only).

Credential schema carries `RUTH_CONTROL_PLANE_WRITE` (control-plane event logging via the writer). Live-estate target adapters use per-engagement scoped credentials configured at §9.1, not embedded here.