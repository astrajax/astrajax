# Ristral — Cursor full twin v0.1

Ported from Hyperagent export `agent-ristral (2).json` (2026-08-08).

## Platform split

| Runtime | Invoke | Schedule | Web research | Writes |
|---|---|---|---|---|
| Hyperagent | Ristral thread | Mon 07:30 Europe/London | HA `web-search` | Airtable integration + RunWithCredentials script |
| Cursor | `@ristral` | Manual / Matthew asks | WebSearch / WebFetch | Airtable MCP (when granted) + cursor script; paste-ready fallback |

Same character, same bounded scout function. Cursor is manual unless Matthew
explicitly asks for a full weekly pass.

## Cursor files

**Agents**

- `.cursor/agents/ristral.md`
- `.claude/agents/ristral.md` (mirror)

**Skills**

- `ristral-weekly-scout` (+ `scripts/ristral_cursor_write.py`)
- uses existing `household-routing-standard`, `household-conduct-standard`,
  `household-communication-standard`, `fleet-activity-logging`

**Scripts convenience path:** `scripts/ristral/`

**Registry:** this file

## HA export snapshot

| Field | Value |
|---|---|
| modelId | `claude-sonnet-5` |
| effort | high |
| maxThinkingTokens | 16000 |
| maxBudgetUsd | 10 (Pam B1 tripwire at USD 5.00) |
| toolSettings | web-search on; browser/documents/tables off |
| allowedIntegrations | airtable |
| skillLoadMode | preload (`ristral-weekly-scout` pinned) |

Cursor agent uses `model: inherit` — Matthew picks model per session.

## Credentials

| Env | Purpose | Scope |
|---|---|---|
| `RISTRAL_SCOUT_CURSOR_WRITE` | Last Scanned cursor write (D1) | Workshop base `appL2fdnGmhA02WXd` read+write |
| `RISTRAL_SCOUT_ROSTER_TABLE_ID` | Workshop Household Members overlay | defaults to `tblUXYgkTpbxakFjc` |
| `RISTRAL_SCOUT_CHANGE_LOG_TABLE_ID` | Scout cursor change log table | `tbl...` after Ruth build |
| `FLEET_ACTIVITY_WRITE` | Session/Activity logging | Fleet Activity base `appF7jQD4ZKrDC7e1` write-only |

Workshop create-only writes (Scout Reports, Recommendations) require Airtable MCP
access to the Brain Workshop base — grant via Cursor MCP / PAT when Ruth's tables
are live. Without credentials, Ristral delivers paste-ready row blocks only.

## Table IDs

Last Scanned writes target Workshop Household Members (`tblUXYgkTpbxakFjc`)
unless `RISTRAL_SCOUT_ROSTER_TABLE_ID` overrides. `RISTRAL_SCOUT_CHANGE_LOG_TABLE_ID`
is still required for the append-only cursor log; without it the helper refuses
after preflight.

## Smoke tests

1. **`@ristral` ad-hoc (Green):** "Scout `@doc` for operating deltas in the last
   14 days against Anthropic docs allowlist." Expect: per-agent grounding plan,
   WebSearch on allowlisted sources only, paste-ready Recommendations blocks
   (Source Lane = RISTRAL_CAPABILITY_WATCH, Decision Status = Awaiting approval),
   injection fence honoured, no skill edits, no Doc dispatch.

2. **Script preflight (offline):** with env unset, expect clean fail:
   `python3 scripts/ristral/ristral_cursor_write.py --payload /tmp/bad.json`
   → `RISTRAL_SCOUT_CURSOR_WRITE env var not set`.

3. **Script allowlist (offline):** with a payload naming a forbidden field, expect
   refuse-before-write (no network if preflight catches it).

4. **Routing:** misrouted build request → bounce to `@doc` per
   `household-routing-standard` Route 10 notes.

## Explicitly not ported as Cursor schedules

- Hyperagent `Ristral weekly scout` RRULE (Mon 07:30 Europe/London)
- Hyperagent email slug `ristral@` (HA-only unless separately wired)

## Honest gaps remaining

- Fly list is Workshop Household Members overlay (Scout Active, Topics,
  Trusted Sources, Delta Format, Last Scanned). Watch Roster is retired.
- Findings link to Household Members. Recommendations Target Agent Slug
  Snapshot is a Members link; Base ID and Register rec are lookups.
- No dedicated Workshop create-only PAT documented for Cursor yet (MCP or future
  pen may be needed for Scout Reports + Recommendations creates).
- Doc scheduled queue pull remains Hyperagent/Vercel-side — Cursor Ristral only
  projects findings into the queue or paste-ready drafts.
- Fleet activity logging uses synced `hyperagent/scripts/log_fleet_activity.py`
  when `FLEET_ACTIVITY_WRITE` is present.

## Source export

`agent-ristral (2).json` — systemPrompt v0.2, skill `ristral-weekly-scout`
(full body + `ristral_cursor_write.py`), schedule + email invocation metadata.
