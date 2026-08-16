#!/usr/bin/env python3
"""Build Clive's Man Activity Intake HyperAgent twin v0.1.

Outputs:
  hyperagent/builds/sources/clive-man-activity-intake-v0_1/*.py (source of truth)
  hyperagent/exports/agents/agent-clive-man-activity-intake-hyperagent-v0_1.json
  agents/registry/hyperagent/clive/activity-intake/build-pack-v0.1.md

Run:
  python3 hyperagent/builds/build_clive_man_activity_intake_v0_1.py
Then:
  python3 hyperagent/scripts/handoff_hyperagent_export.py \\
    hyperagent/exports/agents/agent-clive-man-activity-intake-hyperagent-v0_1.json
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from _hyperagent_export import (  # noqa: E402
    agent_data,
    agent_export,
    default_tool_settings,
    embed_skill,
    exported_at_now,
    skill_data,
)
from _repo_paths import EXPORTS_AGENTS_DIR, REPO_ROOT, registry_dir  # noqa: E402

SOURCE_ROOT = Path(__file__).resolve().parent / "sources" / "clive-man-activity-intake-v0_1"
CONFIG_FILE = "household_activity_config.py"
READER_FILE = "household_activity_read.py"
INTAKE_FILE = "household_activity_intake.py"

AGENT_SLUG = "clive-man-activity-intake-hyperagent"
AGENT_NAME = "Clive's Man — Activity Intake (HyperAgent)"
AGENT_DESCRIPTION = (
    "Scheduled HyperAgent adapter for Clive's Man. Reads proven human↔agent exchange "
    "rows from Household Activity Sessions + Activity via sealed GET pen; creates V1 "
    "Context Amendment Version proposals only via AMBIENT_V1_CREATE (UNVERIFIED until "
    "minted). Never approves, never writes Draft Brain Truth directly. Parallel to "
    "legacy thread intake — does not advance hyperagent:eligible-threads stream."
)
SKILL_NAME = "clive-man-activity-intake"
SKILL_DESCRIPTION = (
    "Governed Activity Intake skill for Clive's Man (HyperAgent adapter). Reads "
    "Household Activity Sessions + exchange Activity via HOUSEHOLD_ACTIVITY_READ; "
    "creates V1 Proposed only via UNVERIFIED AMBIENT_V1_CREATE. Actor "
    "clive-man-activity-intake-hyperagent."
)

SYSTEM_PROMPT = """# Clive's Man — Activity Intake (HyperAgent) — System Prompt v0.1

> **Runtime:** HyperAgent scheduled adapter — not the Cursor on-demand twin.

You are **Clive's Man — Activity Intake (HyperAgent)** for AstraJax.

Your job is to read proven human↔agent exchange rows from the **Household Activity**
base, judge whether they carry durable context worth proposing, and create **V1
Context Amendment Version** rows (Stage=V1, Verdict=Proposed) only — never approve,
never touch Trusted canon, and never write Draft Brain Truth directly.

You are not Clive's Man (the steward), not the Cursor activity-intake adapter
(`clive-man-activity-intake-cursor`), not the legacy HyperAgent thread scanner
(`clive-man-ambient-capture`), and not Context Auditor / Challenger / Executor.

## Required skill

Load and follow **`clive-man-activity-intake`** before every run. Also load
**`fleet-activity-logging`** — silent session logging (Household Activity base).
If this prompt and the skill conflict, the skill wins.

## Pens (sealed — never print values)

| Pen | Role |
|-----|------|
| `HOUSEHOLD_ACTIVITY_READ` | GET-only on Household Activity **Sessions** + **Activity** |
| `AMBIENT_V1_CREATE` | POST create-only on Context Amendment Versions `tblsuOKGjSGYv0Vov` (Brain Workshop `appL2fdnGmhA02WXd`) — **UNVERIFIED** until minted |

**Hard routing:** reads and writes use separate tokens. No GET on the write token.
No PATCH, PUT, DELETE, or Draft/Trusted/V2 mutation paths.

## Tool boundary

Allowed:

- Run `household_activity_read.py` and `household_activity_intake.py` via execute-script with injected pens

Forbidden:

- Airtable MCP, browser automation, web search
- Direct Airtable writes outside sealed pens
- Minting credentials or enabling schedules without Matthew

## Frozen actor and payload

| Field | Value |
|-------|-------|
| Actor literal | `clive-man-activity-intake-hyperagent` (never alias) |
| Action class | `CREATE_DRAFT_TRUTH` — V1 proposal queue only |
| Capture Source (after_payload) | **Chat Session** only — executor allowlist; no extra keys |
| Sessions provenance | Household Activity **Sessions** `rec…` on the candidate + evidence JSON — **never** in `after_payload` (executor terminal Refusal) |

## Phase-one read filter

Eligible rows are **human↔agent exchange Activity rows only**:

- **User Message** and **Reply Digest** both present (non-empty)
- **Reports** table excluded entirely
- Exclude: legacy thread-intake actor sessions, both activity-intake adapter slugs,
  **Session End**, routine **Action** / **Completion** / **Question**, and noise rows

## Throughput caps (live)

| Phase | Cap |
|-------|-----|
| First live run | **1** V1 create |
| After first successful cycle | **10** per run |

## Checkpoint stream (shared table, distinct key)

| Property | Value |
|----------|-------|
| Stream key | `household-activity:activity:clive-man-activity-intake:v1` |
| Table | Ambient Checkpoint Versions `tblRbjD0PHtuTWsIL` (append-only; shared infrastructure) |
| Runtime lease | `cursor_token_json` must carry `runtime_owner` + `lease_until_utc` |

**Lease interlock:** before advancing checkpoint, read tip `cursor_token_json`. If another
runtime holds a **fresh** lease (`lease_until_utc` > now UTC), **refuse** and report hold —
do not fork the stream. The legacy HyperAgent thread stream
(`hyperagent:eligible-threads:clive-man-ambient-capture:v1`) is **untouched**.

## Workflow

1. Confirm pens present (or stop with explicit blocked reason — do not guess).
2. Acquire or validate runtime lease in checkpoint cursor JSON (`runtime_owner`: `hyperagent`).
3. Read Sessions + Activity through `HOUSEHOLD_ACTIVITY_READ` from checkpoint cursor forward.
4. Apply phase-one filters; score survivors against the Context Proposal rubric in the skill.
5. Create at most the live cap of V1 Proposed rows via `AMBIENT_V1_CREATE`.
6. Append one checkpoint advance row when `AMBIENT_CHECKPOINT_APPEND` is minted.
7. Return structured run summary — counts, holds, next human gate.

## Must not

- Write Draft Brain Truth (`tblswvXNYFDqnl6af`) directly
- Update or delete existing Amendment Version rows
- Create V2, Trusted, or Approved records
- Put `capture_source_chat_session` (or any non-allowlisted key) in `after_payload`
- Leave Sessions provenance blank on the candidate / evidence for any V1 create
- Touch v0.4 legacy thread-intake artifacts
- Commit, push, deploy, mint credentials, or write Airtable outside sealed pens

## Tone

Direct, concise, paper-trail minded. Matthew, not Matt. No theatrics.
"""

SKILL_BODY = """# clive-man-activity-intake

> **Runtime:** HyperAgent scheduled adapter (`clive-man-activity-intake-hyperagent`).
> Cursor twin: `clive-man-activity-intake-cursor` (on-demand only).

## Purpose

Read proven **human↔agent exchange** evidence from the Household Activity base and
propose **V1 Context Amendment Version** rows only — never approve, never touch Trusted
canon, and **never write Draft Brain Truth directly**.

This lane replaces none of the legacy HyperAgent thread scanner; it adds a parallel
intake axis grounded in Household Activity Sessions + Activity.

## Actor and pens (frozen)

| Key | Value |
|-----|-------|
| Actor literal | `clive-man-activity-intake-hyperagent` |
| Read pen | `HOUSEHOLD_ACTIVITY_READ` — GET-only |
| Write pen | `AMBIENT_V1_CREATE` — POST create-only (**UNVERIFIED** until minted) |
| Read base / tables | `appF7jQD4ZKrDC7e1` — Sessions `tblUi4nmBKX2u8nFx`, Activity `tblNxNLyC31KDQbRl` |
| Write base / table | `appL2fdnGmhA02WXd` — Context Amendment Versions `tblsuOKGjSGYv0Vov` |
| Forbidden direct write | Draft Brain Truth `tblswvXNYFDqnl6af` |

Credential routing: **reads and writes on separate tokens**. No GET on write token.
No PATCH/PUT/DELETE anywhere in this lane.

Field maps: `website/src/lib/platform-activity/ids.ts` (Household Activity);
Amendment Version field IDs in governed Brain Workshop contract maps.

## V1 payload contract

Every V1 create must include:

| Payload element | Rule |
|-----------------|------|
| Stage | `V1` |
| Verdict | `Proposed` |
| Action class | `CREATE_DRAFT_TRUTH` |
| Created By Agent | `clive-man-activity-intake-hyperagent` |
| after_payload.capture_source | **Chat Session** (semantic) — executor allowlist only |
| Sessions provenance | Household Activity **Sessions** record id (`rec…`) on candidate + evidence — **never** in `after_payload` |
| Adapter version | `context-amendment-adapters-v2.0` |
| v1_report_record_id | Reports row from run report — required when checkpoint append is live |

**Never:** Draft/Trusted/V2 stages; updates; deletes; blank Sessions provenance; unknown `after_payload` keys.

## Phase-one eligibility (Activity rows)

Include **only** human↔agent **exchange** rows where **both** are non-empty:

- User Message (`user_message` / `fldzSTdm15GQf88Ph`)
- Reply Digest (`reply_digest` / `fldBj92Hu9gDesX6u`)

**Exclude entirely:**

| Exclusion | Reason |
|-----------|--------|
| **Reports** table | Out of scope phase one |
| Legacy thread-intake actor | `clive-man-ambient-capture` sessions/activity |
| Cursor adapter | `clive-man-activity-intake-cursor` |
| HA adapter | `clive-man-activity-intake-hyperagent` |
| Session End | Closure rows, not exchange evidence |
| Agent Turn Type Action / Completion / Question | Routine mechanical noise |
| Rows missing either message field | Not a complete exchange |

Join Activity → Sessions on session link; carry Sessions record id on the
candidate + evidence JSON (not in `after_payload`).

## Analyst rubric (Context Proposal)

Keep a candidate only if it passes all five tests:

1. **Durable** — true beyond today, not transient logging noise.
2. **Useful** — to AstraJax or to AI supporting Matthew/TL.
3. **Attributable** — Sessions record + Activity event id prove source.
4. **Actionable** — a reviewer knows what to do with it.
5. **Novel** — dedupe against existing V1 dedupe keys / prior proposals.

Low-confidence or ambiguous source → skip (report in run summary, no V1).

## Throughput caps

| Mode | Max V1 creates per run |
|------|------------------------|
| First live | **1** |
| Steady state | **10** |

Dedupe preflight is mandatory before POST. Requeue skipped rows; do not lossy-drop on pen errors.

## Checkpoint stream

| Property | Value |
|----------|-------|
| Stream key | `household-activity:activity:clive-man-activity-intake:v1` |
| Storage | Ambient Checkpoint Versions `tblRbjD0PHtuTWsIL` (shared append-only table) |
| Append pen env | `AMBIENT_CHECKPOINT_APPEND` — shared infra; **not minted** in this build |

**Distinct from** legacy thread stream
`hyperagent:eligible-threads:clive-man-ambient-capture:v1` — **do not read, advance, or mutate**.

### Runtime lease interlock (`cursor_token_json`)

On every checkpoint **advance** observation, persist JSON:

```json
{
  "runtime_owner": "hyperagent",
  "lease_until_utc": "<ISO-8601 UTC>",
  "activity_cursor": { "last_event_id": "...", "last_created_time": "..." }
}
```

Before work:

1. Read stream tip.
2. Parse tip `cursor_token_json`.
3. If `runtime_owner` is set, not `hyperagent`, and `lease_until_utc` > now UTC → **refuse** fresh
   takeover; emit hold summary (no checkpoint fork).
4. If lease expired or owner is this runtime → acquire/extend lease, then proceed.

## Scripts (execute-script)

| Script | Role |
|--------|------|
| `household_activity_config.py` | Frozen constants and field maps |
| `household_activity_read.py` | GET-only reader (`HOUSEHOLD_ACTIVITY_READ`) |
| `household_activity_intake.py` | Filter, rubric, V1 create, lease interlock |

Example:

```bash
python3 household_activity_read.py --dry-run --json-only
python3 household_activity_intake.py --run-id RUN1 --v1-report-record-id recReport --dry-run --json-only
```

## Tool boundary

| Allowed | Forbidden |
|---------|-----------|
| Sealed GET/POST scripts above | Airtable MCP |
| Silent `fleet-activity-logging` | Browser / web search |
| Repo reads for contract | Direct workshop writes outside pen |

## Run order (mandatory when live)

1. **Household Activity Logging** — session + run report (`FLEET_ACTIVITY_WRITE`).
2. Pass report record id as `v1_report_record_id` on every V1 candidate.
3. Read → filter → propose → checkpoint (when pens minted).

## HyperAgent schedule (intent only — disabled in export)

Suggested: daily Europe/London after Household Activity rollups stable. Matthew enables
in UI after pen mint + Cursor/HA parity verified. **Export carries empty** `scheduledInvocations`.

## Must not

- Approve, promote, or write Trusted Brain Truth.
- Write Draft Brain Truth directly.
- Use Airtable MCP, browser, or web search in this lane.
- Alias the actor slug.
- Put Sessions provenance in `after_payload`, or omit it from the candidate / evidence.
- Modify legacy v0.4 thread-intake artifacts (hash-preservation list in build pack).
- Mint credentials, import agents, or enable schedules (human gates).

## Acceptance tests

See `scripts/test_clive_man_activity_intake.py` (ACT-INT-* capability + boundary cases).
"""

CREDENTIAL_SCHEMA = json.dumps([
    {
        "name": "HOUSEHOLD_ACTIVITY_READ",
        "label": "HOUSEHOLD_ACTIVITY_READ",
        "required": True,
        "type": "password",
        "hint": (
            "GET-only PAT for Household Activity base appF7jQD4ZKrDC7e1. Typed script "
            "allows Sessions tblUi4nmBKX2u8nFx and Activity tblNxNLyC31KDQbRl only — "
            "no Reports, no writes. **Future mint** — UNVERIFIED until Ruth + Matthew gate."
        ),
    },
    {
        "name": "AMBIENT_V1_CREATE",
        "label": "AMBIENT_V1_CREATE",
        "required": True,
        "type": "password",
        "hint": (
            "POST create-only PAT for Brain Workshop appL2fdnGmhA02WXd Context Amendment "
            "Versions tblsuOKGjSGYv0Vov. Script enforces V1 Proposed CREATE_DRAFT_TRUTH "
            "only; never Draft Brain Truth tblswvXNYFDqnl6af. **UNVERIFIED** until minted."
        ),
    },
    {
        "name": "AMBIENT_CHECKPOINT_APPEND",
        "label": "AMBIENT_CHECKPOINT_APPEND",
        "required": False,
        "type": "password",
        "hint": (
            "Append-only PAT for Ambient Checkpoint Versions tblRbjD0PHtuTWsIL. "
            "Shared infra — not minted in this build. Activity Intake stream key "
            "household-activity:activity:clive-man-activity-intake:v1 only."
        ),
    },
])

BUILD_PACK = """# Clive's Man — Activity Intake (HyperAgent) v0.1 — Build Pack

Generated by `hyperagent/builds/build_clive_man_activity_intake_v0_1.py`.

Workshop Challenger: **PROCEED**. Matthew: "Build it now. One cursor native, one HA."

## Summary

| Property | Value |
|----------|-------|
| HA slug | `clive-man-activity-intake-hyperagent` |
| Display | Clive's Man — Activity Intake (HyperAgent) — **no word ambient in display** |
| Cursor twin | `clive-man-activity-intake-cursor` (separate Phase B pack) |
| Model | `moonshotai/kimi-k3`, effort **low**, maxBudgetUsd **10** |
| Tools | `execute-script` only; globalTables false; integrations `[]` |
| Schedule | Intent in pack; **empty** in export JSON until Matthew enables |

## Pens

| Pen | HTTP | Scope |
|-----|------|-------|
| `HOUSEHOLD_ACTIVITY_READ` | GET | Sessions + Activity only |
| `AMBIENT_V1_CREATE` | POST | Amendment Versions V1 queue (**UNVERIFIED**) |
| `AMBIENT_CHECKPOINT_APPEND` | POST | Checkpoint append — **not minted** |

## Stream

- **Activity Intake:** `household-activity:activity:clive-man-activity-intake:v1`
- **Legacy thread (untouched):** `hyperagent:eligible-threads:clive-man-ambient-capture:v1`

## Caps

First live **1** V1 create; steady **10**. Env `ACTIVITY_INTAKE_FIRST_LIVE_COMPLETE=true` lifts cap.

## Hash-preservation (do not modify)

Legacy v0.4 thread-intake artifacts remain byte-for-byte on their branch/path list in
`agents/registry/cursor/clive/activity-intake/build-pack-v0.1.md`.

## Import checklist (Matthew manual)

1. Import agent JSON only (embedded skill + scripts).
2. Mint `HOUSEHOLD_ACTIVITY_READ` and `AMBIENT_V1_CREATE` on skill credentials tab.
3. Verify execute-script only; no global tables; no integrations.
4. First live run at cap **1** after script smoke test.
5. Enable schedule in UI only after Cursor + HA parity and checkpoint pen when ready.

## Eval floor

10+ capability tests + 15+ boundary tests in `scripts/test_clive_man_activity_intake.py`.
"""


def _load_script(name: str) -> str:
    path = SOURCE_ROOT / name
    if not path.is_file():
        raise FileNotFoundError(path)
    return path.read_text(encoding="utf-8")


def scripts_payload() -> str:
    payload = [
        {
            "filename": CONFIG_FILE,
            "content": _load_script(CONFIG_FILE),
            "description": "Activity Intake v0.1 constants and field maps.",
        },
        {
            "filename": READER_FILE,
            "content": _load_script(READER_FILE),
            "description": "GET-only Household Activity reader (HOUSEHOLD_ACTIVITY_READ).",
        },
        {
            "filename": INTAKE_FILE,
            "content": _load_script(INTAKE_FILE),
            "description": (
                "Activity Intake: filter exchange rows, V1 CREATE_DRAFT_TRUTH, lease interlock."
            ),
        },
    ]
    return json.dumps(payload)


def main() -> None:
    exported_at = exported_at_now()
    skill_block = skill_data(
        SKILL_NAME,
        SKILL_DESCRIPTION,
        SKILL_BODY,
        tags='["astrajax", "clive-man", "activity-intake", "context"]',
        when_to_use=(
            "When Matthew or the HA schedule invokes Activity Intake to propose V1 rows "
            "from Household Activity exchange evidence."
        ),
        auth_type="api_key",
        credential_schema=CREDENTIAL_SCHEMA,
        scripts=scripts_payload(),
    )
    embedded = embed_skill(skill_block, pinned=True)
    tool_settings = default_tool_settings(**{"execute-script": True})
    data = agent_data(
        AGENT_NAME,
        AGENT_DESCRIPTION,
        SYSTEM_PROMPT,
        [embedded],
        tool_settings=tool_settings,
        allowed_integrations=[],
        model_id="moonshotai/kimi-k3",
        effort="low",
        max_thinking_tokens=8192,
        max_budget_usd=10,
        enable_knowledge_discovery=False,
        scheduled_invocations=[],
        email_invocations=[],
        webhook_endpoints=[],
    )
    export = agent_export(data, exported_at=exported_at)

    agent_out = EXPORTS_AGENTS_DIR / "agent-clive-man-activity-intake-hyperagent-v0_1.json"
    agent_out.parent.mkdir(parents=True, exist_ok=True)
    agent_out.write_text(json.dumps(export, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")

    build_pack = registry_dir("hyperagent", "clive", "activity-intake") / "build-pack-v0.1.md"
    build_pack.parent.mkdir(parents=True, exist_ok=True)
    build_pack.write_text(BUILD_PACK.strip() + "\n", encoding="utf-8")

    for path in (agent_out, build_pack):
        print(f"Wrote {path.relative_to(REPO_ROOT)}")


if __name__ == "__main__":
    main()
