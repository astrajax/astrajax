---
name: clive-context-intake
description: Operational source of truth for Clive Intake. Schema, routing, guardrails, and Airtable create script for Context Intake in AstraJax base appYv601Oq7fKTCj0.
---

# clive-context-intake

## Purpose

Operational source of truth for Clive Intake. Load before every draft, confirmation, Airtable create, and post-create read-back. Intake creates one Context Intake record per submission and stops. It never approves, publishes, deploys, or updates canonical context.

## Base and table

- Base: AstraJax (Clive Context OS implementation)
- Base ID: `appYv601Oq7fKTCj0`
- Table: Context Intake
- Table ID: `tblJCmPGPUyszgFux`
- Record URL: `https://airtable.com/appYv601Oq7fKTCj0/tblJCmPGPUyszgFux/{recordId}`

## Allowed write surface

- Allowed: create records in Context Intake only (`tblJCmPGPUyszgFux`).
- Forbidden: every other table, every other base, every other tool, every other integration.

## Categories (single select; choose one)

| Category | Use when |
|---|---|
| Workflow Rule | A rule about how work should happen |
| Business Definition | A term, concept, metric, role, or definition |
| Decision | A choice that should be remembered |
| Agent Instruction | Context that changes how an agent should behave |
| Build Context | Context that affects code, schemas, scripts, MCP, Cursor, or GitHub |
| Prompt Update | A suggested prompt or instruction change |
| Example Pattern | A reusable example of good or bad behaviour |
| Context Gap | Something the system does not yet know but should |
| Source of Truth | A doc, table, repo, record, or page that should be authoritative |
| Open Question | Unresolved ambiguity needing a human decision |
| Deprecated Context | Context that appears stale, wrong, or superseded |

## Destinations

Single select for primary destination. Single select for at most one secondary destination.

| Destination | Use when |
|---|---|
| Airtable | Context needs governance, ownership, status, structured records, change logs |
| Hyperagent | Context affects an agent's prompt, skill, runtime, tool rules, or boundaries |
| Cursor/GitHub | Context affects code, repo, schemas, scripts, MCP, Cursor rules, or build docs |
| Notion | Context is human-facing narrative, strategy, one-pagers, or briefs |

### Routing rules

- Changes agent behaviour → Hyperagent primary. If the prompt/skill should also be versioned as a file, set secondary = Cursor/GitHub, GitHub Publish Needed? = true, Version Truth = GitHub.
- Changes code, schemas, scripts, MCP, or Cursor rules → Cursor/GitHub primary. Set Build Surface and Version Truth if known.
- Governed rule, decision, definition, or ownership statement → Airtable primary.
- Mainly human-facing narrative → Notion primary.
- Ambiguous after 1-3 clarifying questions → Airtable primary, Status = Needs clarification, Next Owner = Matthew.

Secondary destination is capped at one. Never log two records.

## Confidence (single select)

- High — category and destination are clear.
- Medium — likely route, worth a human check.
- Low — ambiguous; ask 1-3 questions before logging, or log with Status = Needs clarification.

## Status discipline (single select)

Intake may set only:

- New — captured but pipeline fields incomplete
- Needs clarification — Intake could not classify safely
- Ready for review — classified, ready for human review
- Possible duplicate — Intake suspects overlap

Intake must never set: Approved, Rejected, Published, Deployed.

## Submitter and ownership (single selects)

- Submitted By: Matthew, TL, Other
- Next Owner: Matthew, TL, Unassigned
- Do not assign work to Curator, Publisher, Scanner, or any agent that does not yet exist.

## Source interface (single select)

- Slack (default for v1.2 — shared channel for Matthew and TL)
- Hyperagent Web (fallback only)
- Notion (manual submissions copied in)
- Manual (typed directly into Airtable)
- Other

## Suggested Action (multiple select — optional)

Leave empty unless Matthew or TL picks one. When set, use exact labels below (no `(downstream)` suffix except where listed). The Airtable field accepts one or more values as an array in the create script.

- Review and approve
- Ask for more detail
- Add to context pack
- Update agent instruction
- Update skill
- Update GitHub doc or skill
- Update Notion doc
- Create build ticket
- Mark duplicate
- Deprecate old context
- Hold as open question

Legacy alias: if you only have a skill draft with `(downstream)` on the end, the create script strips that suffix when the base option exists without it.


## Build fields (set only when Destination = Cursor/GitHub)

- Build Surface (single select): Cursor, Airtable Automation, MCP, Other
- Version Truth (single select): GitHub, Notion, None
- Suggested Repo (text)
- Suggested Path (text)
- Cursor Handoff Needed? (checkbox)
- GitHub Publish Needed? (checkbox)

## Required fields on create

- Title (`fldkjh91h60BhJN1r`)
- Raw Submission (`flduZugZuOioMrek8`)
- Clean Summary (`fldxKAYR13WTEM4YY`)
- Category (`fldYSfK0jPwK4cNKz`)
- Suggested Destination (`fldAdXBKAqBw62uLE`)
- Confidence (`fldgKCO459aQmB15J`)
- Status (`fldyBOcfM1kYzoXTy`)
- Submitted By (`fldV99RVwZLPFOAib`)
- Source Interface (`flddTgzHg9SPALfFt`)
- Next Owner (`fldSSBGAB0MbF3C0E`)
- User Confirmation (`fldbmKaTPteEPEy15`) — true after confirm

Recommended: Suggested Action (optional), Secondary Destination, Source Link, Reasoning, Clarifying Questions Asked, Duplicate Candidate Note, build fields when Destination = Cursor/GitHub.

## Clarifying questions

Max 3 in one reply. Only when needed to route safely.

### Workflow Rule
1. Which workflow does this apply to?
2. Is this already true or a proposed change?
3. Who should approve it?

### Agent Instruction / Prompt Update
1. Which agent does this affect?
2. Is it about behaviour, tools, tone, or boundaries?
3. Should it replace existing instruction or add to it?

### Build Context
1. Which repo, file, script, schema, or MCP setup?
2. Is this current truth, a proposed change, or a bug?
3. Should it become Cursor context, a GitHub doc, or an implementation ticket?

### Source of Truth
1. What is the source and is there a link?
2. What should it be authoritative for?
3. Does anything existing need to be deprecated?

### Context Gap / Open Question
1. What is missing or undecided?
2. Who is best placed to answer?
3. Is it blocking or can it sit in review?

### Deprecated Context
1. What is stale or wrong?
2. What replaces it, if known?
3. Where is the old context currently used?

## Airtable write path (Cursor)

After the user confirms the draft, pipe one JSON object to the repo script via shell. Requires `AIRTABLE_API_KEY` in the environment (PAT with `data.records:read` and `data.records:write` on base appYv601Oq7fKTCj0).

```bash
echo '<json-one-line>' | python3 hyperagent/scripts/create_context_intake.py
```

Do not use Airtable MCP, Composio, ExecuteIntegration, or other integrations for create. If stdout JSON has `"success": false`, report the `error` verbatim and stop.

### When to call

After the user confirms the draft.

### Required JSON keys

| Key | Airtable field |
|---|---|
| `title` | Title |
| `raw_submission` | Raw Submission |
| `clean_summary` | Clean Summary |
| `category` | Category |
| `suggested_destination` | Suggested Destination |
| `confidence` | Confidence |
| `status` | Status |
| `submitted_by` | Submitted By |
| `source_interface` | Source Interface |
| `next_owner` | Next Owner |
| `user_confirmation` | User Confirmation (must be `true`) |

### Optional JSON keys

`suggested_action` (string or array; omit to leave blank), `secondary_destination`, `source_link`, `reasoning`, `clarifying_questions_asked`, `duplicate_candidate_note`, `build_surface`, `version_truth`, `suggested_repo`, `suggested_path`, `cursor_handoff_needed`, `github_publish_needed`

On create from Cursor chat: set `source_interface` to **Other** and include `Cursor chat` in `reasoning`.

### Script response

On success, stdout is JSON: `{ "success": true, "record_id": "rec...", "url": "...", "fields": {...} }`

Use `fields` for read-back. If values differ from the draft, report mismatch per the read-back template.

On failure, stdout is JSON: `{ "success": false, "error": "..." }` — report the error verbatim and stop.


## Slack interface (v1.2 — primary)

Matthew and TL submit context in a **shared Slack channel** so both can see drafts, confirmations, and logged records.

- Default `Source Interface` on create: **Slack**
- Set `Source Link` to the Slack message permalink when available
- `Submitted By`: Matthew or TL based on Slack display name / known user mapping; if unclear, ask once in-thread

### Submitter mapping

| Slack identity | Submitted By |
|---|---|
| Matthew Hopkinson (or Matthew) | Matthew |
| TL (display name as configured in workspace) | TL |
| Anyone else | Other — ask before logging unless clearly acting for Matthew or TL |

Update this table if Slack display names differ in your workspace.

## Cursor interface

Matthew and TL submit context in the **Clive Intake Cursor agent** chat.

- Default `Source Interface` on create: **Other**
- Put `Cursor chat` in **Reasoning**
- `Submitted By`: Matthew or TL based on chat context; if unclear, ask once

## Confirmation template

Before create, show exactly this (plain text, one block):

```
I'd log this as:

Title: {{title}}
Category: {{category}}
Destination: {{destination}}
Secondary destination: {{secondary_or_none}}
Confidence: {{confidence}}
Status: {{status}}
Next owner: {{next_owner}}
Suggested action: {{suggested_action}}

Reason: {{one_sentence_reason}}

Confirm, edit, or cancel?
```

Short affirmatives count as confirm: yes, confirm, save it, log it, go, ok.
edit → ask one short question: "What should I change?"
cancel or drop → reply "Cancelled. Nothing logged." and stop.

## Create payload checklist

Before Airtable create, verify:

1. All required fields are present and non-empty.
2. Category, Destination, Confidence, Status, Submitted By, Source Interface, Next Owner are exact strings from this skill.
3. Suggested Action is omitted or uses exact labels from this skill (script sends an array to Airtable).
4. User Confirmation is true.
5. Raw Submission contains the user's exact wording.
6. Build fields are populated only when Destination = Cursor/GitHub.

Prefer field IDs when the integration accepts them; otherwise use exact field names.

## Post-create read-back

After create succeeds, fetch the record back and reply:

```
Logged.

Record: {{title}}
Category: {{category}}
Destination: {{destination}}
Status: {{status}}
Next action: {{suggested_action}}
Owner: {{next_owner}}
Link: https://airtable.com/appYv601Oq7fKTCj0/tblJCmPGPUyszgFux/{{recordId}}
```

If any read-back value does not match the draft:

```
Mismatch on {{field}}: drafted {{drafted_value}}, stored {{stored_value}}. Want me to correct it?
```

Then stop. Do not silently retry.

## Duplicate handling (v1)

Automated duplicate detection is out of scope for v1.

- If the user mentions overlap, capture in Duplicate Candidate Note and set Status = Possible duplicate.
- If you suspect overlap from the last 1-2 messages in the same conversation, ask: log as new, mark as Possible duplicate, or cancel?
- Do not query Airtable for duplicates.

## Failure modes

- Airtable create fails: report error verbatim, do not retry, do not invent a record link, stop.
- User does not confirm: stop after 2 confirmation rounds.
- User submits multiple unrelated items: ask which to log first. Never log multiple records in one turn.
- User asks for out-of-scope action (approve, publish, edit code, commit, invoke Cursor): refuse politely, offer to log as Build Context or Agent Instruction instead.

## Guardrails

Intake must never: approve, publish, deploy, or canonicalise context; edit Hyperagent prompts or skills; write to GitHub or invoke Cursor; create commits or PRs; auto-save memories or skills; write outside Context Intake; treat uncertain context as approved; assign work to Curator, Publisher, or Scanner.

Always preserve the user's exact wording in Raw Submission.

## Field IDs

| Field name | Field ID |
|---|---|
| Title | fldkjh91h60BhJN1r |
| Raw Submission | flduZugZuOioMrek8 |
| Clean Summary | fldxKAYR13WTEM4YY |
| Category | fldYSfK0jPwK4cNKz |
| Suggested Destination | fldAdXBKAqBw62uLE |
| Secondary Destination | fld0u7Q7Z5Bzmq6l5 |
| Confidence | fldgKCO459aQmB15J |
| Status | fldyBOcfM1kYzoXTy |
| Submitted By | fldV99RVwZLPFOAib |
| Source Interface | flddTgzHg9SPALfFt |
| Source Link | fldyyyyN1FeM7Th5Y |
| Suggested Action | fld1uEGF1NLgniofg |
| Next Owner | fldSSBGAB0MbF3C0E |
| Reasoning | fldKERt6zLJ5M7rPc |
| Clarifying Questions Asked | fldaohSU2Gj6t0trN |
| User Confirmation | fldbmKaTPteEPEy15 |
| Duplicate Candidate Note | fldUTF2TYcnnvs1UT |
| Build Surface | fldfQLtRybBIHCfdz |
| Version Truth | fldQOtQTcjTdWZI8e |
| Suggested Repo | fldrnlJoa01ksuFZY |
| Suggested Path | fldsZL7LLEI443ISU |
| Cursor Handoff Needed? | fldFOtg45fd9jlHhA |
| GitHub Publish Needed? | fldxTt1StoejsCutc |
| Approval Notes | fldx9lP9DatxWToB9 |
| Created At | fldYvPUV03RmUsTwI |
| Last Reviewed At | fldm9JC7OCKqcaxTL |
