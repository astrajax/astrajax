---
name: physician-activity-reviewer
description: >-
  The Physician's field-whitelisted write path for scoring Household Activity rows —
  Agent Quality and Review Status only. Dry-run by default; FLEET_ACTIVITY_REVIEW credential.
---

# Physician Activity Reviewer

**Commission:** Matthew, 2026-07-26, via Doc Albright (thread cmrdixxrt0bpg07adhbc47keg): the Physician is designated reviewer for EXACTLY two fields on Household Activity rows (base `appF7jQD4ZKrDC7e1`, Activity table `tblNxNLyC31KDQbRl`):

- **Agent Quality** `fldLExhD3nr41nir6` — number 1-5
- **Review Status** `fldCtTcdklAcDa9tW` — set to `Reviewed` once scored

**Hard boundaries (from the commission, non-negotiable):**
- NEVER write Human Quality `fldlKDwCGDAj6fah5` (scoring Matthew's and Tara-Lee's own messages is a separate decision Matthew has not made).
- NEVER modify any content field on any row; events are immutable, corrections are new rows.
- The write path is this skill's script ONLY — never a general update capability (no MCP `update_records`, no ad-hoc PATCH).
- The Physician never scores his own rows.

## Cursor runtime

Hyperagent `RunWithCredentials` → env var `FLEET_ACTIVITY_REVIEW` in the agent shell.

```bash
# Dry run (default)
python3 .cursor/skills/physician-activity-reviewer/scripts/score_update.py \
  --staged /tmp/score_staged.json

# Land writes
python3 .cursor/skills/physician-activity-reviewer/scripts/score_update.py \
  --staged /tmp/score_staged.json --apply
```

Convenience mirror: `python3 scripts/physician/score_update.py ...` (same script).

If `FLEET_ACTIVITY_REVIEW` is absent, stage judgements to a JSON file and report
STAGED — never land via another route.

## Shared Review Status convention (2026-07-26)

Three reviewer lanes run in parallel on this base: Hal (Agent Quality), Clive Wigglesworth (Human Quality), Horace (spend, read-only). `Reviewed` means AT LEAST ONE reviewer pass has happened, never both; the empty score field shows which side remains. Consequences for this script: Review Status alone is NOT a skip signal (a Clive-Reviewed row with empty Agent Quality still gets scored); the skip keys on Agent Quality presence; Review Status is set to `Reviewed` on every scored row, and re-setting an already-Reviewed row is harmless and expected. Never write `Unreviewed` or reset the field.

## Scoring scale (anchored)

| Score | Anchor |
|---|---|
| 5 | Excellent — above what the turn required: a non-obvious catch, real added value |
| 4 | Fully sound — did exactly what was asked, cleanly |
| 3 | Adequate — rough edges, or a position that did not survive challenge |
| 2 | Defective — wrong, incomplete, off-mandate, or dishonest digest |
| 1 | Harmful — hallucinated action, boundary breach, misleading row |
| CANNOT_ASSESS | No score; row stays Unreviewed; reason reported |

Scope: Turn and Completion rows. Judge each row against its own evidence (summary, user_message, reply_digest, context_referenced, outcome, detail) plus in-chain corroboration. Deliberately ignore: digest length (verbosity bias), model identity. While log fidelity is unproven these scores are PROVISIONAL vitals — they judge the logged exchange, and they are never house-ladder grades (grades still require an adopted rubric, mapping, and evidence floor).

## Write path (two steps, replay-safe)

1. Stage judgements to a JSON file: `{"scores": {"<recId>": {"score": 1-5, "rationale": "one line"}, ...}}`
2. Run the updater with `FLEET_ACTIVITY_REVIEW` in env (dry run by default; `--apply` to land).

The script: verifies the credential can READ before doing anything (stops with a scope-gap report if not); ONE GET per target row (field-id keyed); skips rows whose Agent Quality is already set; skips non-Turn/Completion rows with a reason; PATCHes only the two whitelisted field IDs; batches of 10; single 30 s retry on 429; stops on the first ambiguous or failed write and reports. Never creates, never deletes, never prints the token.

## Credential

`FLEET_ACTIVITY_REVIEW` — an Airtable PAT with scopes `data.records:read` + `data.records:write`, granted ONLY to base `appF7jQD4ZKrDC7e1`. Create at airtable.com/create/tokens.

This is deliberately a SEPARATE credential from the logging skill's `FLEET_ACTIVITY_WRITE`, which stays a sealed create-only writer with NO read scope (verified 403 on read, 2026-07-26). Field-level restriction is impossible in Airtable PATs — the whitelist lives in this script's code.

## Provenance

First scored pass (70 rows) staged 2026-07-26. Credential landed and first dry run executed 2026-07-29: 68 clean, 2 rows wrongly skipped by v1 Review-Status skip rule — v2 keys the skip on Agent Quality presence. Cursor twin 2026-08-08.
