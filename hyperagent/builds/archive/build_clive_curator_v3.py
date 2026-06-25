#!/usr/bin/env python3
"""Build Clive Curator V3 artifacts.

V3 changes:
- Adds read-only daily 8am scheduled review-pack preparation.
- Fixes the v2 Cursor prompt heading join bug.
- Makes scheduled mode explicitly non-writing.
- Keeps manual Proposed Context Item creation behind Matthew confirmation.
"""

from __future__ import annotations

import json
import os
import sys
from datetime import datetime, timezone
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from _repo_paths import (  # noqa: E402
    CURSOR_AGENTS_DIR,
    CURSOR_SKILLS_DIR,
    EXPORTS_AGENTS_DIR,
    EXPORTS_SKILLS_DIR,
    HYPERAGENT_ROOT,
    REPO_ROOT,
    SCRIPTS_DIR,
    registry_dir,
)

EXPORTED_AT = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%S.000Z")

SCRIPT_FILES = [
    "context_architecture_common.py",
    "read_context_intake.py",
    "read_context_items.py",
    "read_context_packs.py",
    "create_context_item.py",
    "draft_curator_daily_review.py",
]

CREDENTIAL_SCHEMA = [
    {
        "name": "AIRTABLE_READ_TOKEN",
        "label": "Airtable read PAT",
        "type": "password",
        "hint": "Read-only PAT for scheduled review packs and normal Curator reads.",
        "required": True,
    },
    {
        "name": "AIRTABLE_WRITE_TOKEN",
        "label": "Airtable write PAT",
        "type": "password",
        "hint": "Write PAT scoped to create Proposed Context Items only. Not used by scheduled mode.",
        "required": False,
    },
]

SYSTEM_PROMPT = """# Clive Curator - System Prompt V3

You are Clive Curator for Clive by AstraJax.

Your job is to review Context Intake records and canonical context tables, cluster related submissions, expose conflicts, and prepare proposed durable context for Matthew to approve.

You are not Intake. You are not Publisher. You are not Scanner. You are not Fixer. You are not Agent Factory.

## Core contract

Curator prepares context for approval. It does not make context canonical.

You may create Context Items with `Status = Proposed` only after Matthew explicitly confirms one proposal in chat. You must never approve, publish, deploy, edit repo files while acting as Curator, write Notion pages, or create memories.

## Required skill

Load and follow `clive-context-curator` before reading Airtable records, drafting review packs, creating Proposed Context Items, running scheduled mode, or answering questions about Curator behaviour.

If this prompt and the skill conflict, the skill wins.

## Allowed work

You may:

- Read small batches of Context Intake records (default 5, hard cap 10)
- Read Context Items, Context Packs, and Agent Environments
- Cluster related records and expose conflicts
- Draft Curator review packs for Matthew
- Create one Proposed Context Item after explicit Matthew confirmation
- Recommend context pack membership and downstream destinations
- In scheduled mode, prepare a read-only daily review pack file

## Forbidden work

You must never:

- Approve, reject, publish, deploy, or canonicalise context
- Edit Hyperagent agents, Cursor agents, skills, rules, or repo files while acting as Curator
- Write Notion pages, Change Log entries, or memories
- Create Context Items from the daily 8am schedule
- Process more than 10 intake records in one batch
- Invent IDs, sources, or approval state
- Bulk-create or bulk-update without per-record confirmation

## Daily scheduled mode

The daily 8am schedule is read-only. It gathers the current curation queue and writes an operational review pack to `hyperagent/reports/curator/`.

Scheduled mode may read Context Intake, Context Items, and Context Packs. It must not call `create_context_item.py`, approve anything, publish anything, or claim that the generated pack is canonical truth.

## Edit-safety protocol (manual creates)

Plan-Validate-Execute for every create:

1. **Plan** - parse the requested proposal from the review pack or Matthew's instruction.
2. **Validate** - show title, canonical statement, source intake IDs, authority, freshness, and the exact JSON payload. Set `proposed_by_agent` to `Clive Curator`.
3. **Execute** - only after explicit confirm (yes, create it, approved, go), pipe JSON to `create_context_item.py`, then read back with the Context Items record URL.
4. **Stop** - one record per confirm.

## Workflow

1. Load `clive-context-curator`.
2. Read only the requested records or a small batch.
3. Group by likely context item, pack, or handoff destination.
4. Produce a review pack.
5. Ask Matthew for the next decision.
6. On create confirm, run edit-safety then the write script.
7. Read back the created record.
8. Stop.

## Tone

Direct, concise, senior editor. No theatrics. No pet names. No em-dashes. Use Matthew, not Matt.
"""

CURSOR_ADDENDUM = """

## Primary interface: Cursor chat

Matthew drives manual curation in this Cursor agent chat.

### Cursor hard rules

- Be direct and concise. No theatrics. No em-dashes.
- **No pet names.** First name only, or no name.
- **No closing fluff.** End on the action.
- **No research narration** ("I'm checking..."). Work silently.
- Short affirmatives = confirm: yes, create it, approved, go, ok.
- One focused reply per turn.

### Airtable access in Cursor

**Reads** - prefer repo scripts (see skill). Airtable MCP read-only is allowed for discovery.

**Writes** - only via `create_context_item.py` after edit-safety confirm. Requires `AIRTABLE_WRITE_TOKEN` in `.env`. Do not use Airtable MCP or Composio for creates.

```bash
python3 hyperagent/scripts/read_context_intake.py --status "Ready for review" --max-records 10
python3 hyperagent/scripts/read_context_items.py --status "Proposed" --max-records 10
python3 hyperagent/scripts/read_context_packs.py --max-records 10
python3 hyperagent/scripts/draft_curator_daily_review.py --max-records 10
echo '<json-one-line>' | python3 hyperagent/scripts/create_context_item.py
```

### Mode switch

Do not edit repo files while acting as Curator unless Matthew explicitly asks to change Curator artifacts or to switch into implementation work.
"""

SKILL_BODY = """# clive-context-curator

## Purpose

Operational source of truth for Clive Curator V3.

Curator reviews Context Intake records and canonical context tables, clusters related submissions, exposes conflicts, and prepares proposed durable context for Matthew to approve. Curator may create `Context Items` with `Status = Proposed` only after Matthew explicitly confirms one proposal in chat.

Curator does not approve, reject, publish, deploy, edit repo files while acting as Curator, write Notion pages, create memories, or treat proposed context as canonical.

Curator must not approve context. Approval belongs to Matthew via Airtable edit, Interface button, or `approve_context_item.py` with the approver credential. See `docs/context/human-approval-path.md`.

## Airtable reality

- Base: AstraJax, `appYv601Oq7fKTCj0`
- Context Intake: `tblJCmPGPUyszgFux`
- Context Items: `tblisiZJQmQuBqEef`
- Context Packs: `tblcMubmJXW92D18r`
- Agent Environments: `tblYuSo413ZeQuoq3`
- Change Log: `tbl9jCEYH1mM8b7T2`
- Schema reference: `hyperagent/context_architecture_schema_v1.json`
- Architecture: `clive_context_architecture_v2.md`
- Human approval path: `docs/context/human-approval-path.md`

## Daily scheduled mode

V3 adds a local daily schedule for review-pack preparation:

```bash
hyperagent/scripts/run_curator_daily.sh
hyperagent/schedule/com.astrajax.clive-curator-daily.plist
```

Schedule: daily at 08:00 local time.

Scheduled mode is read-only. It runs:

```bash
python3 hyperagent/scripts/draft_curator_daily_review.py --max-records 10
```

Outputs:

- Markdown review pack: `hyperagent/reports/curator/curator-daily-YYYY-MM-DD.md`
- JSON companion: `hyperagent/reports/curator/curator-daily-YYYY-MM-DD.json`
- Log file: `hyperagent/logs/curator-daily-YYYYMMDD.log`

Scheduled mode may read Context Intake, Context Items, and Context Packs. It must not call `create_context_item.py`, approve anything, publish anything, or create Change Log entries.

Install or reload the launchd job only when Matthew asks:

```bash
cp hyperagent/schedule/com.astrajax.clive-curator-daily.plist ~/Library/LaunchAgents/
launchctl unload ~/Library/LaunchAgents/com.astrajax.clive-curator-daily.plist 2>/dev/null || true
launchctl load -w ~/Library/LaunchAgents/com.astrajax.clive-curator-daily.plist
```

## Model working rule

Use the model committee principle from the context-environment docs:

- Claude Opus 4.7 is best for judgement-heavy curation.
- GPT-5.5 is best for architecture and final context packaging.
- Composer 2.5 is best for repo-local implementation after approval.
- Gemini 3.5 Flash is useful later for bulk ingestion and eval generation.

For V3, run Curator as a strong single agent. Do not use subagents unless Matthew explicitly asks for a later orchestration pass.

Credentials load from repo-root `.env` (`AIRTABLE_READ_TOKEN`, `AIRTABLE_WRITE_TOKEN`). Curator never has `AIRTABLE_APPROVER_TOKEN`.

## Inputs

Curator may process:

- `Context Intake` records with Status `Ready for review`
- `Context Intake` records with Status `Approved`, when Matthew has approved them
- Existing `Context Items` with Status `Proposed`, `Needs decision`, or `Approved`
- `Context Packs` and `Agent Environments` for routing context
- Explicit record IDs supplied by Matthew
- The daily generated review pack in `hyperagent/reports/curator/`

Batch discipline:

- Default batch: 5 records
- Hard cap: 10 intake records or 10 proposed items per review pack
- Never pretend a scan was complete if a required tool or table is unavailable

## Read paths

Use the repo scripts when Airtable data is needed:

```bash
python3 hyperagent/scripts/read_context_intake.py --status "Ready for review" --max-records 10
python3 hyperagent/scripts/read_context_items.py --status "Proposed" --max-records 10
python3 hyperagent/scripts/read_context_packs.py --max-records 10
```

Do not use Airtable MCP writes, Composio, ad hoc table writes, or manual API calls for curation.

## Proposed Context Item write path

After Matthew confirms the exact proposal in chat, create one Proposed Context Item by piping JSON to:

```bash
echo '<json-one-line>' | python3 hyperagent/scripts/create_context_item.py
```

Required JSON keys:

| Key | Airtable field |
|---|---|
| `title` | Title |
| `canonical_text` | Canonical Text |
| `category` | Category |
| `owner` | Owner |
| `authority` | Authority |
| `freshness` | Freshness |
| `proposed_by_agent` | Proposed By Agent |
| traceability | `source_intake_ids` OR `bootstrap: true` plus `source_doc` |

Optional JSON keys:

`applies_to`, `context_pack_ids`, `source_intake_ids`, `version`, `published_to`, `conflicts`, `risk_if_included`, `risk_if_omitted`, `approval_notes`, `bootstrap_source`

The script rejects any status other than `Proposed`. It sets `Created By = Agent`. It does not accept `matthew_confirmation`. Duplicate titles return the existing record instead of creating again.

Always set `proposed_by_agent` to `Clive Curator` (exact string).

Human approval uses `docs/context/human-approval-path.md`, not Curator scripts.

## Edit-safety protocol (creates)

Before calling `create_context_item.py`:

1. Parse what Matthew asked to create.
2. Show title, canonical statement, source intake IDs, and suggested context pack.
3. Preview the exact one-line JSON payload.
4. Wait for explicit confirm (yes, create it, approved, go).
5. Execute the script only after yes. One record per confirm.

Do not use Airtable MCP, Composio, or ad hoc API calls for creates. Reads may use repo scripts or Airtable MCP (read-only).

## Record URL (Context Items)

https://airtable.com/appYv601Oq7fKTCj0/tblisiZJQmQuBqEef/{recordId}

## Review pack format

Use this structure before any create:

```text
Curator review pack

Batch:
Source records:

Proposal 1
Title:
Canonical statement:
Source intake records:
Suggested context pack:
Destination:
Affected surface:
Authority:
Freshness:
Conflicts:
Duplicate or superseded context:
Risk if included:
Risk if omitted:
Recommended action:
Human decision needed:
```

If Matthew says to create a proposal, repeat the exact Context Item payload and ask for confirmation before calling the script.

## Classification rules

### Proposed canonical context

Use when the source contains a stable rule, definition, decision, source-of-truth claim, agent instruction, reusable example, or approval policy.

### Needs more evidence

Use when the source is directionally useful but lacks source links, owner, date, approval, or enough detail to become reusable context.

### Duplicate or superseded

Use when the same claim already appears in the batch or existing Context Items. Mark overlap clearly. Do not merge conflicting context without Matthew's decision.

### Build handoff

Use when the source should become a Cursor/GitHub change, schema update, script change, prompt update, or repo doc change. Curator may propose the handoff but must not implement it while acting as Curator.

### Human-facing doc

Use when the source should become a Notion brief, one-pager, case study, or narrative doc. Curator may propose the target but must not write it.

## Authority and freshness

Assign every proposal:

- Authority: Canonical candidate, Supporting, Anecdotal, Historical, Unknown
- Freshness: Current, Ageing, Stale, Unknown

Prefer:

1. `clive_context_architecture_v2.md` and `hyperagent/context_architecture_schema_v1.json`
2. Current approved AstraJax/Clive docs and repo files
3. Approved Airtable review records and Context Items
4. Matthew's explicit decisions
5. TL operational context
6. Historical drafts or old agent exports

Never silently blend conflicting sources. Mark conflict and ask Matthew to decide.

## Guardrails

Curator must never:

- Set `Status` to `Approved`, `Rejected`, `Published`, `Deployed`, or `Deprecated`
- Publish to Hyperagent, Cursor/GitHub, Notion, Slack, or Airtable as final truth
- Create Context Items from the daily scheduled run
- Edit agents, skills, rules, repo files, Notion pages, or Cursor memories while acting as Curator
- Create Change Log entries
- Process more than 10 records in one batch
- Invent source IDs, record IDs, table IDs, field IDs, or approval state
- Treat a proposal as canonical before Matthew approval

If Matthew asks for implementation, switch out of Curator mode and handle it as a normal Cursor implementation task with the relevant repo context.

## Acceptance tests

### CUR-V3-001: Reads intake and canonical tables

Given a curation request, Curator can read Context Intake, Context Items, and Context Packs.

### CUR-V3-002: Proposed-only create

Given explicit Matthew confirmation, Curator creates a Context Item with Status `Proposed`.

### CUR-V3-003: No approval or publishing

Given a request to approve, publish, deploy, or write Change Log entries, Curator refuses and routes to Matthew or future Publisher.

### CUR-V3-004: Conflict handling

Given conflicting records, Curator marks the conflict and asks Matthew to decide.

### CUR-V3-005: Build handoff containment

Given a Cursor/GitHub routed item, Curator proposes a build handoff but does not edit files while acting as Curator.

### CUR-V3-006: Scheduled mode read-only

Given the daily 8am schedule runs, it writes only a review-pack file and JSON companion, and it never creates Context Items.
"""

DAILY_REVIEW_SCRIPT = r'''#!/usr/bin/env python3
"""Draft a read-only daily Curator review pack from Airtable context tables."""

from __future__ import annotations

import argparse
import json
import subprocess
import sys
from datetime import datetime
from pathlib import Path
from typing import Any

REPO_ROOT = Path(__file__).resolve().parents[2]
DEFAULT_OUTPUT_DIR = REPO_ROOT / "hyperagent" / "reports" / "curator"


def run_json(command: list[str]) -> dict[str, Any]:
    result = subprocess.run(
        [sys.executable, *command],
        cwd=REPO_ROOT,
        text=True,
        capture_output=True,
        check=False,
    )
    if result.returncode != 0:
        return {
            "success": False,
            "command": command,
            "error": result.stderr.strip() or result.stdout.strip(),
        }
    try:
        return json.loads(result.stdout)
    except json.JSONDecodeError as exc:
        return {
            "success": False,
            "command": command,
            "error": f"Invalid JSON: {exc}",
            "raw": result.stdout,
        }


def text(value: Any, fallback: str = "") -> str:
    if value is None:
        return fallback
    if isinstance(value, list):
        return ", ".join(str(item) for item in value)
    return str(value)


def excerpt(value: Any, limit: int = 500) -> str:
    raw = " ".join(text(value).split())
    if len(raw) <= limit:
        return raw
    return raw[: limit - 3] + "..."


def normalise_title(value: str) -> str:
    return "".join(ch.lower() for ch in value if ch.isalnum() or ch.isspace()).strip()


def record_lines(records: list[dict[str, Any]], kind: str) -> list[str]:
    if not records:
        return [f"No {kind} returned."]

    lines: list[str] = []
    for idx, record in enumerate(records, start=1):
        fields = record.get("fields", {})
        title = fields.get("Title") or fields.get("Pack Name") or "Untitled"
        lines.extend(
            [
                f"### {idx}. {title}",
                "",
                f"- Record ID: `{record.get('id', 'unknown')}`",
                f"- URL: {record.get('url', 'not returned')}",
            ]
        )
        for field in (
            "Status",
            "Category",
            "Suggested Destination",
            "Secondary Destination",
            "Confidence",
            "Submitted By",
            "Next Owner",
            "Authority",
            "Freshness",
            "Owner",
            "Primary Destination",
            "Version",
            "Created at",
        ):
            if field in fields:
                lines.append(f"- {field}: {text(fields[field])}")
        summary = fields.get("Clean Summary") or fields.get("Canonical Text") or fields.get("Purpose")
        if summary:
            lines.extend(["", f"Summary: {excerpt(summary, 700)}"])
        raw = fields.get("Raw Submission")
        if raw:
            lines.extend(["", f"Raw excerpt: {excerpt(raw, 700)}"])
        if fields.get("Reasoning"):
            lines.extend(["", f"Reasoning: {excerpt(fields['Reasoning'], 500)}"])
        lines.append("")
    return lines


def duplicate_hints(intake_records: list[dict[str, Any]], item_records: list[dict[str, Any]]) -> list[str]:
    item_titles = {
        normalise_title(text(record.get("fields", {}).get("Title", ""))): record
        for record in item_records
        if record.get("fields", {}).get("Title")
    }
    hints: list[str] = []
    for record in intake_records:
        fields = record.get("fields", {})
        title = normalise_title(text(fields.get("Title", "")))
        if title and title in item_titles:
            existing = item_titles[title]
            hints.append(
                f"- Intake `{record.get('id')}` may duplicate Context Item `{existing.get('id')}`: {fields.get('Title')}"
            )
    return hints or ["No exact title duplicates detected in this small batch."]


def build_pack(run_date: str, intake: dict[str, Any], items: dict[str, Any], packs: dict[str, Any]) -> str:
    intake_records = intake.get("records", []) if intake.get("success") else []
    item_records = items.get("records", []) if items.get("success") else []
    pack_records = packs.get("records", []) if packs.get("success") else []
    generated_at = datetime.now().isoformat(timespec="seconds")

    lines = [
        f"# Clive Curator Daily Review Pack - {run_date}",
        "",
        f"Generated at: {generated_at}",
        "",
        "Safety: this scheduled pack is read-only. It did not create Context Items, approve context, publish context, or write Change Log entries.",
        "",
        "## Summary",
        "",
        f"- Ready intake records returned: {len(intake_records)}",
        f"- Proposed context items returned: {len(item_records)}",
        f"- Context packs returned: {len(pack_records)}",
        "",
        "## Data Read Status",
        "",
        f"- Context Intake: {'OK' if intake.get('success') else intake.get('error', 'failed')}",
        f"- Context Items: {'OK' if items.get('success') else items.get('error', 'failed')}",
        f"- Context Packs: {'OK' if packs.get('success') else packs.get('error', 'failed')}",
        "",
        "## Duplicate Hints",
        "",
        *duplicate_hints(intake_records, item_records),
        "",
        "## Ready Intake Queue",
        "",
        *record_lines(intake_records, "ready intake records"),
        "## Existing Proposed Context Items",
        "",
        *record_lines(item_records, "proposed context items"),
        "## Context Packs",
        "",
        *record_lines(pack_records, "context packs"),
        "## Curator Review Template",
        "",
        "Use `@clive-curator` to turn this briefing into a judgement-heavy review pack.",
        "",
        "```text",
        "Curator review pack",
        "",
        "Batch: daily-" + run_date,
        "Source records:",
        "",
        "Proposal 1",
        "Title:",
        "Canonical statement:",
        "Source intake records:",
        "Suggested context pack:",
        "Destination:",
        "Affected surface:",
        "Authority:",
        "Freshness:",
        "Conflicts:",
        "Duplicate or superseded context:",
        "Risk if included:",
        "Risk if omitted:",
        "Recommended action:",
        "Human decision needed:",
        "```",
        "",
    ]
    return "\n".join(lines)


def main() -> None:
    parser = argparse.ArgumentParser(description="Create a read-only daily Curator review pack")
    parser.add_argument("--max-records", type=int, default=10)
    parser.add_argument("--output-dir", default=str(DEFAULT_OUTPUT_DIR))
    parser.add_argument("--date", default=datetime.now().strftime("%Y-%m-%d"))
    args = parser.parse_args()

    if args.max_records > 10:
        raise SystemExit("--max-records may not exceed 10")

    intake = run_json([
        "hyperagent/scripts/read_context_intake.py",
        "--status",
        "Ready for review",
        "--max-records",
        str(args.max_records),
    ])
    items = run_json([
        "hyperagent/scripts/read_context_items.py",
        "--status",
        "Proposed",
        "--max-records",
        "10",
    ])
    packs = run_json(["hyperagent/scripts/read_context_packs.py", "--max-records", "20"])

    output_dir = Path(args.output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)
    md_path = output_dir / f"curator-daily-{args.date}.md"
    json_path = output_dir / f"curator-daily-{args.date}.json"

    payload = {
        "success": all(source.get("success") for source in (intake, items, packs)),
        "date": args.date,
        "generated_at": datetime.now().isoformat(timespec="seconds"),
        "sources": {
            "context_intake": intake,
            "context_items": items,
            "context_packs": packs,
        },
        "markdown_path": str(md_path),
    }

    md_path.write_text(build_pack(args.date, intake, items, packs), encoding="utf-8")
    json_path.write_text(json.dumps(payload, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")

    print(json.dumps({"success": payload["success"], "markdown_path": str(md_path), "json_path": str(json_path)}))
    if not payload["success"]:
        sys.exit(1)


if __name__ == "__main__":
    main()
'''

RUNNER_SH = r'''#!/bin/bash
# Clive Curator daily cycle: prepare a read-only review pack at 8am local time.
set -euo pipefail

REPO_ROOT="/Users/matthewhopkinson/Documents/AstraJax"
cd "$REPO_ROOT"

LOG_DIR="$REPO_ROOT/hyperagent/logs"
mkdir -p "$LOG_DIR"
LOG_FILE="$LOG_DIR/curator-daily-$(date +%Y%m%d).log"

{
  echo "=== curator daily start $(date -u +%Y-%m-%dT%H:%M:%SZ) ==="
  python3 hyperagent/scripts/draft_curator_daily_review.py --max-records 10
  echo "=== curator daily end $(date -u +%Y-%m-%dT%H:%M:%SZ) ==="
} >>"$LOG_FILE" 2>&1
'''

SCHEDULE_PLIST = """<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.astrajax.clive-curator-daily</string>
    <key>ProgramArguments</key>
    <array>
        <string>/bin/bash</string>
        <string>/Users/matthewhopkinson/Documents/AstraJax/hyperagent/scripts/run_curator_daily.sh</string>
    </array>
    <key>StartCalendarInterval</key>
    <dict>
        <key>Hour</key>
        <integer>8</integer>
        <key>Minute</key>
        <integer>0</integer>
    </dict>
    <key>RunAtLoad</key>
    <false/>
    <key>StandardOutPath</key>
    <string>/Users/matthewhopkinson/Documents/AstraJax/hyperagent/logs/curator-launchd-stdout.log</string>
    <key>StandardErrorPath</key>
    <string>/Users/matthewhopkinson/Documents/AstraJax/hyperagent/logs/curator-launchd-stderr.log</string>
</dict>
</plist>
"""

BUILD_PACK = """# Clive Curator V3 - Build Pack

Generated by `hyperagent/builds/build_clive_curator_v3.py`.

## Agent config pack summary

- **Platform:** Cursor subagent primary, Hyperagent export optional
- **Risk tier:** Medium
- **Roster decision:** EXTEND `clive-curator` v2 (same mission; adds safe scheduled preparation)
- **Runtime and trigger:** Cursor chat for manual curation; local launchd daily 08:00 for read-only preparation
- **Autonomy:** supervised_agent for manual creates; autonomous read-only preparation for scheduled mode
- **Model (Cursor):** `claude-opus-4-7-thinking-xhigh`
- **Model (Hyperagent export):** `claude-opus-4-7`
- **Approval:** Matthew, 2026-05-31 - requested red-team and next iteration with daily 8am schedule

## Red-team findings folded into V3

1. **Schedule danger:** a daily run with write credentials could create Proposed Context Items while Matthew is asleep. V3 scheduled mode is read-only and cannot call `create_context_item.py`.
2. **Ambiguous output:** v2 had no place for unattended output. V3 writes a markdown briefing and JSON companion under `hyperagent/reports/curator/`.
3. **Prompt bug:** v2 joined the tone sentence and next heading without a newline in `.cursor/agents/clive-curator.md`. V3 fixes the generator.
4. **Overclaim risk:** a deterministic scheduled script cannot do model-quality judgement. V3 calls the output a daily briefing/review pack, not canonical curation.
5. **Schedule install risk:** V3 writes a launchd plist but records install as a separate local action.

## Schedule

- Runner: `hyperagent/scripts/run_curator_daily.sh`
- launchd plist: `hyperagent/schedule/com.astrajax.clive-curator-daily.plist`
- Time: daily at 08:00 local time
- Output: `hyperagent/reports/curator/curator-daily-YYYY-MM-DD.md`
- Logs: `hyperagent/logs/curator-daily-YYYYMMDD.log`

## Evals

### Capability

1. Read ready intake records and include record IDs and links in the daily pack.
2. Read existing Proposed Context Items and include them for duplicate checking.
3. Read Context Packs and include routing context.
4. Create a markdown review pack and JSON companion.
5. Manual chat flow can still create one Proposed Context Item after Matthew confirms.
6. The launchd plist uses StartCalendarInterval Hour 8 Minute 0.

### Boundary

1. Scheduled mode never calls `create_context_item.py`.
2. Scheduled mode rejects `--max-records` over 10.
3. Curator refuses approval, publishing, Change Log writes, or memory creation.
4. Manual creates still require exact JSON preview and confirmation.

## Pre-deploy checklist

- [x] Risk tier set to Medium.
- [x] Schedule is read-only.
- [x] Edit-safety preserved for manual creates.
- [x] No em-dashes in prompt text.
- [x] `execute-script` enabled only because skills ship scripts.
- [x] Referenced skills and scripts exist.
- [ ] Install launchd plist if Matthew wants the local schedule active.
"""

CURSOR_FRONTMATTER = """---
name: clive-curator
description: >-
  Curator for Clive Context Architecture V3. Reviews Context Intake and
  canonical context tables, drafts review packs, creates Proposed Context Items
  only after Matthew confirms, and prepares a read-only daily 8am briefing.
model: claude-opus-4-7-thinking-xhigh
readonly: false
is_background: false
---

"""

SKILL_FRONTMATTER = """---
name: clive-context-curator
description: Operational source of truth for Clive Curator V3. Reads context tables, drafts review packs, creates Proposed Context Items only after Matthew confirms, and prepares daily read-only briefings.
---

"""


def scripts_payload() -> str:
    scripts = []
    for filename in SCRIPT_FILES:
        scripts.append(
            {
                "filename": filename,
                "content": (SCRIPTS_DIR / filename).read_text(encoding="utf-8"),
                "description": f"Clive Curator V3 helper: {filename}",
            }
        )
    return json.dumps(scripts)


def skill_export() -> dict:
    return {
        "version": 1,
        "type": "skill",
        "exportedAt": EXPORTED_AT,
        "data": {
            "name": "clive-context-curator",
            "description": "Operational source of truth for Clive Curator V3. Reads context tables, drafts review packs, creates Proposed Context Items only after Matthew confirms, and prepares daily read-only briefings.",
            "icon": "🧹",
            "documentation": SKILL_BODY,
            "tags": '["clive", "curator", "context", "airtable", "astrajax", "governance"]',
            "whenToUse": "Before reading Context Intake or Context Items, clustering context, drafting review packs, creating Proposed Context Items, or running scheduled review-pack preparation.",
            "authType": "api_key",
            "credentialSchema": json.dumps(CREDENTIAL_SCHEMA),
            "skillMdBody": SKILL_BODY,
            "scripts": scripts_payload(),
            "references": None,
        },
    }


def agent_export(skill: dict) -> dict:
    tool_settings = {
        "execute-script": True,
        "persistent-sandbox": False,
        "tables": False,
        "documents": False,
        "searchthreads": False,
        "web-search": False,
        "browser": False,
        "image-generation": False,
        "video-generation": False,
        "audio-generation": False,
        "transcribeaudio": False,
        "avatar-video": False,
        "webpage": False,
        "slides": False,
        "exa-mode": False,
        "exafindsimilar": False,
        "exaanswer": False,
        "exaresearch": False,
        "exawebsets": False,
        "geocode": False,
        "hyperapps": False,
        "globalTablesEnabled": False,
    }
    data = skill["data"]
    return {
        "version": 1,
        "type": "agent",
        "exportedAt": EXPORTED_AT,
        "data": {
            "name": "Clive Curator",
            "description": "Curator for Clive Context Architecture V3. Reviews intake and canonical tables, drafts proposals, creates Proposed Context Items only after Matthew confirms, and prepares daily read-only briefings.",
            "icon": "🧹",
            "systemPrompt": SYSTEM_PROMPT.strip(),
            "themeColors": None,
            "visualMode": "off",
            "skillScope": "selected",
            "skillLoadMode": "preload",
            "toolSettings": json.dumps(tool_settings),
            "allowedIntegrations": "[]",
            "enableMemorySuggestions": False,
            "enableSkillSuggestions": False,
            "enablePromptSuggestions": False,
            "enableKnowledgeDiscovery": True,
            "autoSaveMemories": False,
            "autoSaveSkills": False,
            "autoSaveAgents": False,
            "autoSavePrompts": False,
            "modelId": "claude-opus-4-7",
            "maxThinkingTokens": 16000,
            "effort": "high",
            "maxBudgetUsd": None,
            "imageModel": None,
            "customBackgroundStyle": None,
            "customMessageCoverStyle": None,
            "skills": [
                {
                    "name": data["name"],
                    "description": data["description"],
                    "icon": data.get("icon"),
                    "documentation": data["documentation"],
                    "tags": data["tags"],
                    "whenToUse": data["whenToUse"],
                    "authType": data["authType"],
                    "credentialSchema": data.get("credentialSchema"),
                    "skillMdBody": data["skillMdBody"],
                    "scripts": data.get("scripts"),
                    "references": data.get("references"),
                    "isPinned": True,
                }
            ],
            "scheduledInvocations": [],
            "emailInvocations": [],
            "webhookEndpoints": [],
        },
    }


def write(path: Path, content: str) -> Path:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content.strip() + "\n", encoding="utf-8")
    return path


def write_executable(path: Path, content: str) -> Path:
    written = write(path, content)
    written.chmod(written.stat().st_mode | 0o755)
    return written


def main() -> None:
    daily_script = write_executable(SCRIPTS_DIR / "draft_curator_daily_review.py", DAILY_REVIEW_SCRIPT)
    runner = write_executable(SCRIPTS_DIR / "run_curator_daily.sh", RUNNER_SH)
    schedule = write(HYPERAGENT_ROOT / "schedule" / "com.astrajax.clive-curator-daily.plist", SCHEDULE_PLIST)

    skill = skill_export()
    agent = agent_export(skill)

    skill_out = EXPORTS_SKILLS_DIR / "skill-clive-context-curator-v3.json"
    agent_out = EXPORTS_AGENTS_DIR / "agent-clive-curator-v3.json"
    EXPORTS_SKILLS_DIR.mkdir(parents=True, exist_ok=True)
    EXPORTS_AGENTS_DIR.mkdir(parents=True, exist_ok=True)
    skill_out.write_text(json.dumps(skill, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    agent_out.write_text(json.dumps(agent, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    json.loads(skill_out.read_text(encoding="utf-8"))
    json.loads(agent_out.read_text(encoding="utf-8"))

    cursor_agent = write(CURSOR_AGENTS_DIR / "clive-curator.md", CURSOR_FRONTMATTER + SYSTEM_PROMPT + CURSOR_ADDENDUM)
    cursor_skill = write(CURSOR_SKILLS_DIR / "clive-context-curator" / "SKILL.md", SKILL_FRONTMATTER + SKILL_BODY)
    build_pack = write(registry_dir("cursor", "clive", "curator") / "build-pack-v3.md", BUILD_PACK)

    for path in (daily_script, runner, schedule, skill_out, agent_out, cursor_agent, cursor_skill, build_pack):
        try:
            print(f"Wrote {path.relative_to(REPO_ROOT)}")
        except ValueError:
            print(f"Wrote {path}")


if __name__ == "__main__":
    main()
