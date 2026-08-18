---
name: fleet-activity-logging
description: >-
  Cursor/Claude twin of Hyperagent **Household Activity Logging** (renamed from
  Fleet Activity Logging 2026-07-16). The logging mechanics for the AstraJax Household Activity base: session flow, event identity, semantic-key write path via the validating script, content and failure rules, Session End semantics, cost capture. Pure mechanics — closure conduct and disclosure policy live in the Household Conduct Standard. 2026-08-08: verbatim replies; AI owns Turn Type + summaries; agents stop classifying ordinary exchanges.
  Invoke as `/fleet-activity-logging`; Hyperagent display name is
  "Household Activity Logging". Writes via validating script +
  `FLEET_ACTIVITY_WRITE`. Closure conduct: `household-conduct-standard`.
  Whenever a wired household agent logs its session (Sessions row at start, Activity events during, Session End at close) or writes a complete standing report (Reports table). The contract for silent, validated, create-only logging across the AstraJax estate. Not a read surface: reviewer reads and score updates go through Household Activity Review.
---

# fleet-activity-logging

> **Alias:** Hyperagent skill **Household Activity Logging** (same skill object;
> slug here stays `fleet-activity-logging` so agent Required-skills paths keep working).
> **Canonical import:** Hyperagent export `skill-household-activity-logging` (2026-08-08).
> If this mirror and a newer Hyperagent export disagree, the export wins.

## Cursor runtime

Ported from Hyperagent export `skill-household-activity-logging` (2026-08-08).
Hyperagent mechanics map to Cursor as follows:

| Hyperagent | Cursor |
|---|---|
| `RunWithCredentials("Household Activity Logging", "python3 log_fleet_activity.py …")` | Env var `FLEET_ACTIVITY_WRITE` in the agent shell + run the validating script (below) |
| Skill script beside HA skill | `hyperagent/scripts/log_fleet_activity.py` (canonical); mirrors at `.cursor/skills/fleet-activity-logging/scripts/` and `.claude/skills/fleet-activity-logging/scripts/` |
| Airtable integration create path (Doc) | **Airtable MCP** `create_records_for_table` when the agent already holds suitable write access — create-only, same required keys |
| Platform mechanical token/cost rows | **Not Cursor** — pipeline flip (Kate lane) writes those server-side |

**Write command (Cursor lane):**

```bash
python3 hyperagent/scripts/log_fleet_activity.py --payload /tmp/events.json
# mirror: .cursor/skills/fleet-activity-logging/scripts/log_fleet_activity.py
```

- **Credential:** `FLEET_ACTIVITY_WRITE` — write-only PAT, `data.records:write` ONLY on base
  `appF7jQD4ZKrDC7e1`. Never print, never commit, never paste into chat.
- **How Cursor gets it:** Cursor has no credential injector, so the script resolves the
  credential itself — environment first (`FLEET_ACTIVITY_WRITE`,
  `HOUSEHOLD_ACTIVITY_WRITE_TOKEN`, `AIRTABLE_WRITE_TOKEN`), then the repo's gitignored
  `.env` / `website/.env.local` in the same order (current checkout first, then the
  primary git checkout if this is a worktree). Agents do NOT export anything or read
  `.env` themselves; just run the script. Confirm with `--check` (source name only; no rows).
- **Silent operation:** logging is background bookkeeping. Never announce, narrate, or discuss
  it in conversation or PR bodies. The sole permitted trace is the §6 failure line in the
  contract below.
- **If `FLEET_ACTIVITY_WRITE` is absent:** skip all log writes silently; at session end add
  one terse line only: `(household log write failed this session)`. Never block the work.
- **Cursor agents:** Runtime = `Cursor`; **Session End is mandatory** (this class always
  knows when its job completes). Log exchange/action evidence, then **Session End** with
  Outcome (`event_type`: Session End → Agent Turn Type). Omit type fields on ordinary exchanges — AI owns User/Agent Turn Type.
- **Semantic keys preferred;** the script owns field-ID mapping. Raw `fld…` IDs also accepted.

---

# Household Activity Logging

**Base:** Household Activity `appF7jQD4ZKrDC7e1` (workspace: AstraJax Brains; renamed from "Fleet Activity" by Matthew 2026-07-16 — always key on the ID). Tables: **Sessions** `tblUi4nmBKX2u8nFx`, **Activity** `tblNxNLyC31KDQbRl`, **Reports** `tblFzWUIPSiIGZPln` (added 2026-07-26).
**Provenance:** design v0.4, Matthew-approved 2026-07-10; Household rename 2026-07-16; Reports + timestamp retirement 2026-07-26; **AI Turn Type / verbatim reply / AI summaries** redesign Matthew 2026-08-08. Session-closure conduct and disclosure policy live in the **Household Conduct Standard**; the logging duty and its silence live in each agent's standing-duties pointer.
**Contract headline:** append-only, at-least-once, create-only, SILENT (never discuss logging in conversation; the sole permitted trace is the §5 failure line), and **validated at the pen** — the script refuses incomplete rows. Events are immutable after creation. Human Quality / Agent Quality / Review Status are reviewer-owned; loggers never write the two scores. **AI owns** User Turn Type, Agent Turn Type (on ordinary exchanges), AI Turn Summary, Session Summary, and Headline — agents do not write competing classification or session-level summary prose. Optional exception: mechanical `event_type` → **Agent Turn Type** only (Session End / Action / Completion / …).

## 1. Session flow

1. At session start, generate a **Session ID** once: `<agent-slug>--<YYYYMMDD>T<HHMM>Z--<2-4 char suffix>`. One session per agent invocation — a thread ID alone is NOT a session. Reuse the same ID on any retry.
2. Create the Sessions row first; carry its record id; every Activity row links to it (the script injects the link from payload-level `session_record_id`).
3. **Minions:** write **parent_session_id** from your dispatch brief and create your OWN Sessions row. **Orchestrators: ALWAYS include your Session ID (and your Root Session ID — see §8) in every dispatch brief.**
4. **Follow-up invocations:** a new message arriving in a thread whose session already closed (a minion answering a post-completion clarification, or an interactive head resuming after a long gap) is a NEW invocation → new Session ID, new Sessions row, same thread_url; carry the same parent_session_id/root_session_id as the original where they existed.
5. **Session End** is an Activity row carrying the session's Outcome (Sessions rows are never updated). Set `event_type` to **Session End** on that row only — it is a closure event, not a summary. Class semantics: **mandatory** for minions, proposer/challengers, executors, and scheduled runs; **mechanical** for the AstraJax Platform pipeline; **best-effort** for interactive reasoning heads when a close is visible. An interactive session without one is normal; Session Status is inferred from last Activity age (>30 min) + pause flag. No agent ever polls.

## 2. Who logs

- Only **registry-indexed named agents** log sessions. Ephemeral subagents and tool-internal model calls never log their own — their outcomes are the dispatching agent's events.
- Named minions ARE actors: own session + parent_session_id (+ root_session_id, §8).
- **AstraJax Platform personas** are logged server-side by the serving pipeline (Runtime = AstraJax Platform, mechanical context and token counts, at the flip); until then their turns live in Brain Interactions.

## 3. What to log (by class)

| Class | Log |
|---|---|
| Reasoning heads, interactive | One Activity row per user↔agent exchange (**omit `event_type`** — AI fills User/Agent Turn Type); write verbatim user message + verbatim reply; **Session End** at visible closes |
| Executor minions | One row per write batch (target link + outcome + what you acted from); may set `event_type` **Action** when that is the mechanical class; **Error** / **Blocker** when known; **Session End** |
| Proposer / Challenger minions | One row for the handoff/verdict; may set `event_type` **Completion**; **Error** / **Blocker** when known; **Session End** |
| Scheduled / unattended runs | May set **Completion** or **Error** when known; **Session End**. Integration-writes toggle must be on or logging lands only in the digest |
| Cursor agents | May set **Action** per commit/PR; **Blocker** / **Error** when known; **Session End** — same script, base-scoped PAT |

Meaningful events, never every tool call. An **exchange row is one full exchange** (message + reply in one row; no speaker field). **Do not categorise ordinary chat** — omit `event_type` and let AI fill **User Turn Type** / **Agent Turn Type**. When you *know* a mechanical class, set `event_type` (lands in **Agent Turn Type** only: Decision, Action, Blocker, Question, Escalation, Error, Completion, Session End). Never write User Turn Type. **Write `model` on every row.**

**Do not write:** User Turn Type, Session Summary, AI Turn Summary, Headline (AI assist), or any session-level end-summary prose competing with those AI fields.

**Standing reports (added 2026-07-26):** lanes producing complete reports write the FULL report as a row in the **Reports** table (§5b) and reference it from their session's Completion-class Activity row (`summary` + `target_url` to the report record). Never duplicate a report body into Activity.

## 4. Event identity (at-least-once)

- **event_id** generated BEFORE the first write attempt: `evt-<agent-slug>-<YYYYMMDD>-<counter>`; reuse the SAME id on any retry — consumers dedupe by it.
- **counter is unique within the agent-day:** a second session on the same day CONTINUES the day's counter, never restarts at 1. If you cannot know the day's last counter, start a new session's counters at a fresh hundred block (101, 201, ...).
- **sequence**: monotonic within the session; authoritative ordering.
- **Event time is Airtable-owned:** the createdTime field ("Created") stamps every row at creation. Loggers never write timestamps; the pen strips any `timestamp` key silently.

## 5. Write path — semantic keys via the validating script

Stage the payload, then `RunWithCredentials("Household Activity Logging", "python3 log_fleet_activity.py --payload /tmp/events.json")`. Env `FLEET_ACTIVITY_WRITE` is injected into the script only; the agent needs no Airtable integration. **The script owns the field-ID mapping — agents write semantic keys and never touch field IDs.**

**Exchange row** (omit `event_type`; omit `summary` — AI Turn Summary covers turn prose):

```json
{"table": "activity", "session_record_id": "recXXXXXXXXXXXXXX", "records": [
  {"event_id": "evt-<slug>-<YYYYMMDD>-<n>", "sequence": <n>,
   "session_id": "<session-id>", "model": "<model-id>",
   "user_message": "<verbatim>", "reply_digest": "<verbatim agent reply>",
   "context_referenced": "<one per line, or none>", "outcome": "Completed"}
]}
```

**Session End** (typed closure event — not a summary):

```json
{"table": "activity", "session_record_id": "recXXXXXXXXXXXXXX", "records": [
  {"event_id": "evt-<slug>-<YYYYMMDD>-<n>", "sequence": <n>,
   "session_id": "<session-id>", "event_type": "Session End", "model": "<model-id>",
   "outcome": "Completed", "cost_usd": <optional>}
]}
```

Sessions keys: session_id, parent_session_id, root_session_id (optional, §8), agent_slug, agent_name, runtime (Hyperagent/Cursor), trigger (Interactive/Scheduled/Webhook/Email/Slack), user (Matthew/Tara-Lee/System), thread_url, model. Do **not** write `started` — Sessions start time is Airtable's **Created** (`createdTime`); the pen strips `started` / retired timestamp keys if a legacy payload still sends them. Activity also accepts: summary (required only when you set a mechanical `event_type` other than Session End), detail, target_url, cost_usd (Session End only), review_status.

**Semantic key note:** `event_type` maps to Airtable **Agent Turn Type** (`fldvskIDzutu4JzQt`) only — Session End and known mechanical classes. Never write **User Turn Type** (`fldTCd93XF8XhsVoZ`); AI owns it (pen rejects it). `reply_digest` maps to Airtable **Reply Digest** (`fldBj92Hu9gDesX6u`) — keep the key; write the **verbatim** agent response (strip secrets), not a short paraphrase.

**Validation:** refuses incomplete rows with a precise missing-keys error (fix and retry, SAME event_ids). Required — sessions: session_id, agent_slug, agent_name, runtime, trigger, user, thread_url, model; activity always: event_id, sequence, session_id, model. Exchanges (no event_type): user_message + reply_digest + context_referenced. Session End: event_type + outcome. Other agent-typed mechanical classes: summary (+ context_referenced for Completion/Decision). Defaults: review_status "Unreviewed", root_session_id (self-reference, §8). Timestamp / `started` keys and AI-owned summary fields are STRIPPED/REJECTED. Reviewer-owned fields rejected. Batches of 10; single 30 s retry on 429.

**Alternative — platform integration** (only agents already holding suitable Airtable access, e.g. Doc): `airtable__create_records_for_table` with field IDs from the script's mapping tables; create actions ONLY, never update or delete this base; the required-key lists above are self-enforced.

## 5b. Reports table (added 2026-07-26)

Complete reports are documents, not events: `{"table": "reports", "session_record_id": "rec...", "records": [...]}` through the same pen.

- **Required keys:** title, report_type (Ward Round / Coaching Digest / Spend Digest / Fidelity Audit / Prescriptions / Handoff / Audit / Other), agent_slug, headline (one line), body (the complete report) — plus session_record_id for the Session link.
- **Optional keys:** period_start, period_end (YYYY-MM-DD), evidence (URLs one per line, proven links only), supersedes (list of Reports record ids).
- **Conventions:** reports are immutable — revisions are NEW rows linking the old via supersedes; the authoring session's Completion-class Activity row carries a short summary and a target_url to the report record; report bodies never contain secrets, tokens, or trusted-brain/client content bodies. (Reports.headline here is the Reports table field — not Sessions Headline AI assist.)

## 6. Content and failure rules

- **user_message:** verbatim on exchange rows; team's own messages only. Never secrets, tokens, or credential values.
- **reply_digest:** **verbatim agent reply** (same text you sent the user), secrets stripped. Not a digest or paraphrase. Field name in Airtable is still Reply Digest.
- **summary:** omit on ordinary exchanges. Write a short one-liner only when you set a mechanical `event_type` (Action / Completion / Error / …) that still needs a human-readable primary line. Never write Session Summary / AI Turn Summary / Headline.
- **event_type:** omit for conversational exchanges (AI fills User/Agent Turn Type). **Required** on Session End rows (`"Session End"`). Optional exception: set Action / Completion / Error / Blocker / Decision / Escalation / Question when you *know* that mechanical class — writes **Agent Turn Type** only; do not invent categories for chat.
- **context_referenced:** one per line — Airtable URLs only where your own tool calls proved access; repo files as `path@commit`; `memory:`/`skill:` names; or `none`. Honest self-report: this is the bad-answer diagnosis field.
- Never copy trusted-brain or client content bodies into the log. **target_url:** most specific PROVEN link; never synthesized, never a placeholder token.
- **cost_usd** (Session End only): the most recent platform budget figure seen this session, where a budget exists — never hand-estimated. **tokens_in/tokens_out: mechanical writers only**; agents never guess tokens.
- A failed log write never blocks the work and is never narrated mid-conversation. No retry loops (30 s on 429, one retry, same event_ids). If a session's writes ultimately failed: one terse line at the very end of the final reply — "(household log write failed this session)".
- Gaps stay detectable table-side (missing Session End on mandatory classes; coverage sampling). Silent invention of rows is never acceptable. Content corrections are NEW rows; updates to events are principal-directed exceptions only.

## 7. Status

Doc Albright wired (integration path); Workshop Executor wired (script path); full-household Route B wiring cards saved by Matthew 2026-07-16/26. Reviewer lanes commissioned 2026-07-26: Hal (Agent Quality + Review Status), Clive Wigglesworth (Human Quality + Review Status), Horace (spend, read-only) — reviewer reads AND two-field score updates ride the separate **Household Activity Review** skill (FLEET_ACTIVITY_REVIEW, read+update, base-scoped); the logging credential stays write-only and NEVER updates. Reports table + timestamp retirement landed 2026-07-26. **2026-08-08:** agents capture verbatim replies; stop classifying turns; stop writing AI summary fields; pen makes `event_type` optional except Session End. The pipeline flip (Kate's lane) brings AstraJax Platform rows with mechanical tokens and exact cost.

## 8. Root Session ID — added 2026-07-16 (Matthew's challenge on Trinity/minion chains)

A Trinity or dispatch chain (orchestrator → minions) is several genuinely separate agent invocations, not one — each has its own model, thread, and identity, so they cannot share one Sessions row, and Sequence's "monotonic, authoritative ordering" would need cross-process coordination if they shared one session_id. Root Session ID solves reading a whole chain as one unit without merging invocations:

- **`root_session_id`** (Sessions, field `fld5OjB9QLjNTgsKT`, optional): the top-level Session ID this session belongs to. **Pure default, script-applied:** if omitted, defaults to the session's own session_id.
- **Minions:** orchestrators should forward their OWN root_session_id (not just parent_session_id) in the brief. If an older dispatcher hasn't been updated, the minion falls back to parent_session_id — degrades gracefully, never blocks.
- **Reading a whole chain:** one filter on Root Session ID returns every session in the run, any depth. Parent Session ID still answers "who dispatched me, one hop."

## 9. Operational note — drafts do not chain (2026-07-16)

UpdateSkillAndScripts calls on this skill do NOT cumulatively build on prior unsaved drafts: any call that omits a field (documentation, scripts, tags, whenToUse) reverts that field to the last MATTHEW-CONFIRMED-SAVED version, not the most recent draft. Every future edit to this skill must resubmit the complete current documentation, not an addition assumed to layer onto an unsaved prior call.
