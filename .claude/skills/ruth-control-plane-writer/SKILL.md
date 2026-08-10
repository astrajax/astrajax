---
name: ruth-control-plane-writer
description: >-
  Append-only writer for Ruth Hadley control-plane tables (proposals, reports, amendments, execution events). Create-only; never update/delete.
---

# Ruth Control Plane Writer (v1.0.0)


## Cursor runtime

Hyperagent `RunWithCredentials` is optional here. In Cursor:

1. Put required tokens in the environment the agent shell inherits (never print them).
2. Run skill scripts via `python3 .cursor/skills/<skill>/scripts/<file.py> ...` (mirrors under `.claude/skills/` and often `scripts/ruth/` for convenience).
3. Prefer Airtable MCP for discovery reads when available; pens remain the only mutation path for signed builds / Cleared-V2 maintenance.
4. If a credential or control-plane base is missing, refuse mutation and report the gap — do not improvise.

Append-only writer for the Ruth Hadley control plane. **Base:** `appubDI76O0t8xisg` ("AstraJax Agent — Ruth Hadley (Data-Layer Architect)", workspace AstraJax Brains `wspieqyIX8DKJUPIm`).

## Contract

- **Append-only.** There is deliberately NO update/delete/upsert path. Control-plane rows are immutable history; a correction is a NEW row that supersedes the old, never an edit. Any payload key containing update/delete/patch/overwrite/upsert is rejected.
- **One codebase, V1/V2 command profiles.** `command_profile` must be `V1` or `V2`; it is recorded in the row's Skill/Version where the table carries one. Per the V2 build authority §8.3, the two profiles are separately allowlisted at the credential/profile layer.
- **Semantic keys only.** Agents write semantic field keys; the script owns the field-ID mapping. Unknown table/field keys are rejected with precise errors listing the known keys.
- **Required keys enforced** per table (see below); incomplete rows refused.
- **Adapter provenance stamped** automatically (`ruth-control-plane-writer/1.0.0 profile=Vn`) where the table carries Skill/Version or Adapter Version.
- **Batch cap 10**; single 30s retry on 429.

## Tables (semantic key → purpose)

| Key | Purpose (required keys) |
|---|---|
| `engagements` | Stable engagement identity (engagement_id, client_label, workspace_id, owner, created_by) |
| `scope_versions` | Immutable reach/caps/credential-profile ref (scope_version_id, engagement_id, workspace_id, action_classes, signed_caps) |
| `proposal_versions` | Immutable maps/proposals (proposal_version_id, engagement_id, stage, typed_manifest, canonical_hash) |
| `reports` | Immutable evidence reports (report_id, engagement_id, report_type, stage, headline, body) |
| `amendment_versions` | Immutable V1/V2 atomic actions (amendment_version_id, engagement_id, stage, action_class, created_by_agent) |
| `execution_events` | Append-only attempts/skips/success/failure/readback/compensation (execution_event_id, engagement_id, event_type, skill_version, executing_agent) |

## Usage

```json
{"command_profile": "V1", "table": "execution_events", "records": [
  {"execution_event_id": "exe-<build>-001", "engagement_id": "eng-...",
   "event_type": "Attempt", "skill_version": "...", "executing_agent": "ruth-build-executor",
   "parent_session_id": "...", "root_session_id": "..."}
]}
```

Run (Cursor): `python3 .cursor/skills/ruth-control-plane-writer/scripts/control_plane_writer.py --payload /tmp/cpw.json` with `RUTH_CONTROL_PLANE_WRITE` in env.

## Credential

`RUTH_CONTROL_PLANE_WRITE` — Airtable PAT scoped ONLY to base `appubDI76O0t8xisg`, scope `data.records:write` ONLY (no read scope). PAT write includes update/delete on the granted base; create-only is enforced by this script (the Household Activity Logging pattern). Never printed.

## Never

Never update or delete a control-plane row; never write a credential value into any field; never synthesize IDs or URLs; never print the token.