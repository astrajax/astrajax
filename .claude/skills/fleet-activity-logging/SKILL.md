---
name: fleet-activity-logging
description: >-
  The Cursor-lane mirror of the AstraJax Fleet Activity logging contract: when
  and what to log, session lineage, at-least-once event identity, real field
  IDs, call shapes, privacy and failure rules. Use in any Cursor agent session
  that carries the fleet logging duty. Writes via the validating helper script
  at hyperagent/scripts/log_fleet_activity.py with the base-scoped PAT in env
  var FLEET_ACTIVITY_WRITE. Canonical contract lives in the Hyperagent skill
  "Fleet Activity Logging" (design v0.4); this mirror must never drift ahead
  of it.
---

# fleet-activity-logging

> **Canonical source:** the Hyperagent skill **Fleet Activity Logging** (design
> v0.4, Matthew-approved 2026-07-10, amendments 2026-07-11). This file is the
> Cursor-lane mirror. If this file and the Hyperagent skill disagree, the
> Hyperagent skill wins; propose a mirror update rather than improvising.

**Base:** Fleet Activity `appF7jQD4ZKrDC7e1` (workspace: AstraJax Brains).
Tables: **Sessions** `tblUi4nmBKX2u8nFx`, **Activity** `tblNxNLyC31KDQbRl`.

**Contract headline:** append-only, at-least-once, create actions only,
SILENT, and validated at the pen: the helper script refuses incomplete rows.
Events are immutable after creation. Human Quality / Agent Quality / Review
Status are reviewer-owned mutable metadata; loggers never write the two scores.

## 1. Write path (Cursor lane)

Stage a payload JSON, then run the validating writer:

```bash
python3 hyperagent/scripts/log_fleet_activity.py --payload /tmp/events.json
```

- Credential: env var `FLEET_ACTIVITY_WRITE` must be present in the Cursor
  agent's environment. It is a write-only Airtable PAT scoped to
  `data.records:write` on base `appF7jQD4ZKrDC7e1` ONLY (no read scope; the
  base cannot be read via this token). Never print it, never commit it.
- The script is CREATE ONLY (no update/delete code path), hard-locks the base
  id, batches in 10s, and does a single 30 s retry on 429 reusing Event IDs.
- The script VALIDATES before writing: it refuses incomplete rows with a
  precise per-record missing-fields error. Fix and retry with the SAME Event
  IDs. It auto-fills pure defaults only (Review Status="Unreviewed",
  Timestamp=now UTC), injects the Session link from payload-level
  `session_record_id`, and rejects reviewer-owned fields.
- If `FLEET_ACTIVITY_WRITE` is absent, logging is unavailable: skip logging
  silently and add the single terse failure line at session end (section 6).
  Never block the work, never paste a token into the environment by hand.

## 2. Session flow (every run)

1. At session start, generate a **Session ID** once:
   `<agent-slug>--<YYYYMMDD>T<HHMM>Z--<2-4 char suffix>`. One session per
   agent invocation. Reuse the same ID on any retry.
2. Create the Sessions row first; carry its record id for the whole run;
   every Activity row links to it (the script injects the link from
   `session_record_id`).
3. **Dispatched agents:** if your brief carries the dispatcher's Session ID,
   write it to **Parent Session ID** and create your OWN Sessions row.
   Dispatchers: ALWAYS include your Session ID in every brief.
4. At close, write a **Session End** Activity row carrying the session's
   Outcome. Sessions rows are never updated; closure is an event.
   **Session End is MANDATORY for Cursor agents** (this class always knows
   when its job completes; a missing Session End is a genuine defect signal).

## 3. Silent operation

Logging is background bookkeeping. Never announce, narrate, or discuss it in
conversation or in PR descriptions. No per-session disclosure. The only
permitted conversational trace is the single terse failure line (section 6).

## 4. What Cursor agents log

| Event | When |
|---|---|
| **Action** | one row per commit or PR (Target URL = the commit/PR link + outcome) |
| **Decision** | anything auto-acted or architecturally chosen (Context Referenced required) |
| **Blocker / Error** | as they occur |
| **Session End** | mandatory, with Outcome and a closing summary in Reasoning/Detail |

Meaningful events, never every tool call. **Write Model on every row.**

**Context Referenced is REQUIRED on Decision, Completion, and Turn rows**
(write "none" if truly nothing was consulted) and strongly encouraged on
Action rows: record what you acted FROM - the brief, files as `path@commit`,
Airtable URLs your own tool calls proved, `memory:`/`skill:` names. The
script enforces this. It is the bad-answer diagnosis field.

## 5. Event identity (at-least-once delivery)

- **Event ID** generated BEFORE the first write attempt:
  `evt-<agent-slug>-<YYYYMMDD>-<counter>`. Reuse the SAME Event ID on any
  retry; consumers dedupe by it.
- **Sequence**: monotonic within the session; authoritative ordering.
- **Timestamp**: logger-written event time (ISO 8601, UTC); the script
  defaults it if omitted.

## 6. Content and failure rules

- Never log secrets or credential values. Never copy trusted-brain or client
  content bodies into the log.
- **Reply Digest:** <= ~500 chars. **Target URL:** most specific PROVEN link;
  never synthesized, never a placeholder token.
- A failed log write never blocks the work and is never narrated mid-session.
  No retry loops (30 s on 429, one retry, same Event IDs). If a session's
  writes ultimately failed: one terse line at the very end of the final
  reply - "(fleet log write failed this session)".
- Silent invention of rows is never acceptable. Content corrections are NEW
  rows referencing the old Summary; updates to events are principal-directed
  exceptions only.

## 7. Field IDs (writes key on IDs, not names)

**Sessions** (`tblUi4nmBKX2u8nFx`): Session ID `fldHTqDQeAEqE4JCb` - Parent
Session ID `fldVFuT8AHFFU28al` - Agent Slug `fldzed2cCR3HyCCOb` - Agent Name
`fld4jizroZZZVxDtb` - Runtime `fldoE8uXllbSMAPPS` (use "Cursor") - Trigger
`fldG3t3bCjY8tklgv` - User `fldMg0dpNURUNEkWW` - Started `fldTOGhUjtylNV4ll` -
Thread URL `fldqEN6EC48KcsZrS` - Model `fld5Rjoxc2q5hxR4R` (session-start
snapshot).

**Activity** (`tblNxNLyC31KDQbRl`): Summary `fldoVtBIAKanaafMg` (primary) -
Event ID `fldxIVVOp7VvfVQ5j` - Sequence `fldeQ8SjlrZfj3a6M` - Session ID
`fldz1skahzUvg1vzX` - Session link `fldRD3GFz3PqYTANC` - Event Type
`fldTCd93XF8XhsVoZ` (Turn/Decision/Action/Blocker/Question/Escalation/Error/
Completion/Session End) - Timestamp `fldTl7rXvf7YHgImz` - User Message
`fldzSTdm15GQf88Ph` - Reply Digest `fldBj92Hu9gDesX6u` - Context Referenced
`fldkSONM4RjGmHjZT` - Reasoning/Detail `fldjXdEnPfc6BeKqv` - Outcome
`fldYYSYt5yVgN8dc1` - Target URL `fld76GAzl1Q0Brqux` - Model
`fldXYLfw560tuXFk8` (per-row, authoritative) - Cost USD (approx)
`fldyk34Wd33W2xofh` (Session End rows only, platform-reported figures only,
never hand-estimated).

**Mechanical-only (never self-estimated, leave empty):** Tokens In
`fldoPEuPYgLCsbYgz` - Tokens Out `fldmGBFPPUouTtn5Y`.

**Reviewer-owned (loggers NEVER write):** Human Quality `fldlKDwCGDAj6fah5` -
Agent Quality `fldLExhD3nr41nir6` - Review Status `fldCtTcdklAcDa9tW`
(script-defaulted to "Unreviewed"; reviewers own changes).

## 8. Payload template

```json
{"table": "activity", "session_record_id": "recXXXXXXXXXXXXXX", "records": [
  {"fldoVtBIAKanaafMg": "<one-line summary>",
   "fldxIVVOp7VvfVQ5j": "evt-<slug>-<YYYYMMDD>-<n>",
   "fldeQ8SjlrZfj3a6M": 1,
   "fldz1skahzUvg1vzX": "<session-id>",
   "fldTCd93XF8XhsVoZ": "Action",
   "fldXYLfw560tuXFk8": "<model-id>",
   "fldkSONM4RjGmHjZT": "<one reference per line, or none>",
   "fld76GAzl1Q0Brqux": "<proven commit/PR URL>",
   "fldYYSYt5yVgN8dc1": "Completed"}
]}
```
