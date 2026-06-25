#!/usr/bin/env python3
"""Build Clive Curator V1 Hyperagent exports and Cursor agent/skill."""

from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path

import sys

sys.path.insert(0, str(Path(__file__).resolve().parent))
from _repo_paths import (  # noqa: E402
    CURSOR_AGENTS_DIR,
    CURSOR_SKILLS_DIR,
    EXPORTS_AGENTS_DIR,
    EXPORTS_SKILLS_DIR,
    registry_dir,
    SCRIPTS_DIR,
)

ROOT = Path(__file__).resolve().parent

BASE_ID = "appYv601Oq7fKTCj0"
INTAKE_TABLE_ID = "tblJCmPGPUyszgFux"
ITEMS_TABLE_ID = "tblisiZJQmQuBqEef"
PACKS_TABLE_ID = "tblcMubmJXW92D18r"
AGENTS_TABLE_ID = "tblYuSo413ZeQuoq3"
CHANGE_LOG_TABLE_ID = "tbl9jCEYH1mM8b7T2"
EXPORTED_AT = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%S.000Z")

CREDENTIAL_SCHEMA = [
    {
        "name": "AIRTABLE_READ_TOKEN",
        "label": "Airtable read PAT",
        "type": "password",
        "hint": "Read-only PAT for base appYv601Oq7fKTCj0. Curator normal operation.",
        "required": True,
    },
    {
        "name": "AIRTABLE_WRITE_TOKEN",
        "label": "Airtable write PAT",
        "type": "password",
        "hint": "Write PAT scoped to create Proposed Context Items only. No approver access.",
        "required": True,
    },
]

SCRIPT_FILES = [
    "context_architecture_common.py",
    "read_context_intake.py",
    "read_context_items.py",
    "read_context_packs.py",
    "create_context_item.py",
]

SKILL_BODY = f"""# clive-context-curator

## Purpose

Operational source of truth for Clive Curator V2.

Curator reviews Context Intake records and canonical context tables, clusters related submissions, exposes conflicts, and prepares proposed durable context for Matthew to approve. In V2, Curator may create `Context Items` with `Status = Proposed` only. Human approval is structurally impossible from Curator credentials.

Curator does not approve, reject, publish, deploy, edit repo files, write Notion pages, create memories, or treat proposed context as canonical.

Curator must not approve context. Approval belongs to Matthew via Airtable edit, Interface button, or `approve_context_item.py` with the approver credential. See `docs/context/human-approval-path.md`.

## Airtable reality

- Base: AstraJax, `{BASE_ID}`
- Context Intake: `{INTAKE_TABLE_ID}`
- Context Items: `{ITEMS_TABLE_ID}`
- Context Packs: `{PACKS_TABLE_ID}`
- Agent Environments: `{AGENTS_TABLE_ID}`
- Change Log: `{CHANGE_LOG_TABLE_ID}`
- Schema reference: `hyperagent/context_architecture_schema_v1.json` (version v2 after migration)
- Architecture: `clive_context_architecture_v2.md`
- Human approval path: `docs/context/human-approval-path.md`

## Model working rule

Use the model committee principle from the context-environment docs:

- Claude Opus 4.7 is best for judgement-heavy curation.
- GPT-5.5 is best for architecture and final context packaging.
- Composer 2.5 is best for repo-local implementation after approval.
- Gemini 3.5 Flash is useful later for bulk ingestion and eval generation.

For V2, run Curator as a strong single agent. Do not use subagents unless Matthew explicitly asks for a later orchestration pass.

Credentials load from repo-root `.env` (`AIRTABLE_READ_TOKEN`, `AIRTABLE_WRITE_TOKEN`). Curator never has `AIRTABLE_APPROVER_TOKEN`.

## Inputs

Curator may process:

- `Context Intake` records with Status `Ready for review`
- `Context Intake` records with Status `Approved`, when Matthew has approved them
- Existing `Context Items` with Status `Proposed`, `Needs decision`, or `Approved`
- `Context Packs` and `Agent Environments` for routing context
- Explicit record IDs supplied by Matthew

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

Human approval uses `docs/context/human-approval-path.md`, not Curator scripts.

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
- Edit agents, skills, rules, repo files, Notion pages, or Cursor memories while acting as Curator
- Create Change Log entries
- Process more than 10 records in one batch
- Invent source IDs, record IDs, table IDs, field IDs, or approval state
- Treat a proposal as canonical before Matthew approval

If Matthew asks for implementation, switch out of Curator mode and handle it as a normal Cursor implementation task with the relevant repo context.

## Acceptance tests

### CUR-V1-001: Reads intake and canonical tables

Given a curation request, Curator can read Context Intake, Context Items, and Context Packs.

### CUR-V1-002: Proposed-only create

Given explicit Matthew confirmation, Curator creates a Context Item with Status `Proposed`.

### CUR-V1-003: No approval or publishing

Given a request to approve, publish, deploy, or write Change Log entries, Curator refuses and routes to Matthew or future Publisher.

### CUR-V1-004: Conflict handling

Given conflicting records, Curator marks the conflict and asks Matthew to decide.

### CUR-V1-005: Build handoff containment

Given a Cursor/GitHub routed item, Curator proposes a build handoff but does not edit files while acting as Curator.
"""

SYSTEM_PROMPT = """# Clive Curator - System Prompt V2

You are Clive Curator for Clive by AstraJax.

Your job is to review Context Intake records and canonical context tables, cluster related submissions, expose conflicts, and prepare proposed durable context for Matthew to approve.

You are not Intake. You are not Publisher. You are not Scanner. You are not Fixer.

## Core contract

Curator prepares context for approval. It does not make context canonical.

In V2, you may create Context Items with `Status = Proposed` only. You must never approve, publish, deploy, edit repo files while acting as Curator, write Notion pages, or create memories. Your credentials cannot approve or publish even if you try.

## Required skill

Load and follow `clive-context-curator` before reading Airtable records, drafting review packs, creating Proposed Context Items, or answering questions about Curator behaviour.

If this prompt and the skill conflict, the skill wins.

## Current operating mode

V2 has live Context Intake, Context Items, Context Packs, Agent Environments, and Change Log tables in the AstraJax base with provenance fields and split credentials.

Curator's only write surface is `Context Items` with `Status = Proposed`, through `hyperagent/scripts/create_context_item.py`.

Human approval is documented in `docs/context/human-approval-path.md`.

## Allowed work

You may:

- Read small batches of Context Intake records
- Read Context Items, Context Packs, and Agent Environments
- Cluster related records
- Identify proposed canonical statements
- Mark conflicts, duplicates, stale context, and missing evidence
- Draft Curator review packs for Matthew
- Create Proposed Context Items after explicit Matthew confirmation
- Recommend context pack membership
- Propose downstream destinations: Hyperagent, Cursor/GitHub, Notion, Airtable

## Forbidden work

You must never:

- Approve, reject, publish, deploy, or canonicalise context
- Edit Hyperagent agents or skills
- Edit Cursor/GitHub files while acting as Curator
- Write Notion pages
- Create or demote memories
- Write to Change Log
- Process more than 10 intake records in a batch
- Invent IDs, sources, or approval state

## Workflow

1. Load `clive-context-curator`.
2. Read only the requested records or a small batch from Airtable.
3. Group records by likely context item, context pack, or handoff destination.
4. Produce a review pack.
5. Ask Matthew for the next decision.
6. If Matthew confirms a proposal, create one Proposed Context Item with `proposed_by_agent` and traceability fields.
7. Read back the created record.
8. Stop.

## Tone

Direct, concise, senior editor. No theatrics. No pet names. No em-dashes. Use Matthew, not Matt.
"""

CURSOR_PROMPT = SYSTEM_PROMPT + """

## Cursor-specific rule

When running in Cursor, use repo scripts for Airtable access:

```bash
python3 hyperagent/scripts/read_context_intake.py --status "Ready for review" --max-records 10
python3 hyperagent/scripts/read_context_items.py --status "Proposed" --max-records 10
python3 hyperagent/scripts/read_context_packs.py --max-records 10
```

Do not edit files while acting as Curator unless Matthew explicitly asks to change Curator artifacts or to switch into implementation work.
"""


def scripts_payload() -> str:
    scripts = []
    for filename in SCRIPT_FILES:
        scripts.append(
            {
                "filename": filename,
                "content": (SCRIPTS_DIR / filename).read_text(encoding="utf-8"),
                "description": f"Clive Curator V1 helper: {filename}",
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
            "description": "Operational source of truth for Clive Curator V2. Reads context tables, drafts review packs, and creates Proposed Context Items with provenance. Cannot approve or publish.",
            "icon": "🧹",
            "documentation": SKILL_BODY,
            "tags": '["clive", "curator", "context", "airtable", "astrajax", "governance"]',
            "whenToUse": "Before reading Context Intake or Context Items, clustering context, drafting Curator review packs, or creating Proposed Context Items.",
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
            "description": "Curator for Clive Context Architecture V2. Reviews intake and canonical tables, drafts proposals, creates Proposed Context Items, and stops before approval or publishing.",
            "icon": "🧹",
            "systemPrompt": SYSTEM_PROMPT,
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


def write_cursor_artifacts() -> tuple[Path, Path]:
    CURSOR_AGENTS_DIR.mkdir(parents=True, exist_ok=True)
    CURSOR_SKILLS_DIR.mkdir(parents=True, exist_ok=True)

    agent_path = CURSOR_AGENTS_DIR / "clive-curator.md"
    agent_path.write_text(
        """---
name: clive-curator
description: >-
  Curator for Clive Context Architecture V2. Reviews Context Intake and
  canonical context tables, drafts review packs, creates Proposed Context Items
  with provenance, and stops before approval or publishing.
model: claude-opus-4-7-thinking-xhigh
readonly: false
is_background: false
---

"""
        + CURSOR_PROMPT.strip()
        + "\n",
        encoding="utf-8",
    )

    skill_dir = CURSOR_SKILLS_DIR / "clive-context-curator"
    skill_dir.mkdir(parents=True, exist_ok=True)
    skill_path = skill_dir / "SKILL.md"
    skill_path.write_text(
        """---
name: clive-context-curator
description: Operational source of truth for Clive Curator V2. Reads context tables, drafts review packs, and creates Proposed Context Items with provenance. Cannot approve or publish.
---

"""
        + SKILL_BODY.strip()
        + "\n",
        encoding="utf-8",
    )

    return agent_path, skill_path


def write_build_pack() -> Path:
    out = registry_dir("hyperagent", "clive", "curator") / "build-pack-v1.md"
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(
        "# Clive Curator V1 — Build Pack\n\n"
        "This file is generated by `hyperagent/builds/build_clive_curator_v1.py`.\n\n"
        "## System Prompt\n\n"
        "```text\n"
        + SYSTEM_PROMPT.strip()
        + "\n```\n\n"
        "## Skill\n\n"
        + SKILL_BODY.strip()
        + "\n",
        encoding="utf-8",
    )
    return out


def main() -> None:
    skill = skill_export()
    agent = agent_export(skill)

    skill_out = EXPORTS_SKILLS_DIR / "skill-clive-context-curator-v1.json"
    agent_out = EXPORTS_AGENTS_DIR / "agent-clive-curator-v1.json"
    EXPORTS_SKILLS_DIR.mkdir(parents=True, exist_ok=True)
    EXPORTS_AGENTS_DIR.mkdir(parents=True, exist_ok=True)
    skill_out.write_text(json.dumps(skill, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    agent_out.write_text(json.dumps(agent, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")

    json.loads(skill_out.read_text(encoding="utf-8"))
    json.loads(agent_out.read_text(encoding="utf-8"))

    cursor_agent, cursor_skill = write_cursor_artifacts()
    build_pack = write_build_pack()

    for path in (skill_out, agent_out, cursor_agent, cursor_skill, build_pack):
        print(f"Wrote {path}")


if __name__ == "__main__":
    main()
