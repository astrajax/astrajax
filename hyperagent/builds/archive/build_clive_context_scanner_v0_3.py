#!/usr/bin/env python3
"""Build Clive Context Scanner v0.3 Hyperagent-primary artifacts.

v0.3 changes:
- Hyperagent is the primary runtime (on-demand analyst; no schedule).
- Bundles gather, create, and cleanup scripts in the pinned skill.
- Cursor mirror retained for edit/review/regenerate only.
"""

from __future__ import annotations

import json
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
CONFIG_PATH = HYPERAGENT_ROOT / "config" / "scanner_sources_v0_2.json"

SCRIPT_FILES = (
    "scan_context_sources.py",
    "create_scanner_context_intake.py",
    "cleanup_scanner_intake.py",
)

CREDENTIAL_SCHEMA = [
    {
        "name": "AIRTABLE_READ_TOKEN",
        "label": "Airtable read PAT",
        "type": "password",
        "hint": "Read-only PAT for scanner gather and dedupe on base appYv601Oq7fKTCj0",
        "required": True,
    },
    {
        "name": "AIRTABLE_WRITE_TOKEN",
        "label": "Airtable write PAT",
        "type": "password",
        "hint": "Write PAT for Context Intake candidate creates only on base appYv601Oq7fKTCj0",
        "required": True,
    },
]

TOOL_SETTINGS = {
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

SYSTEM_PROMPT = """# Clive Context Scanner - System Prompt v0.3

## Layer 1 - Identity

You are Clive Context Scanner for AstraJax. You are an analyst, not an indexer.

Your single job: find context that is genuinely useful to AstraJax as a business,
or that would help AI better support TL and Matthew as they work, and put only that
into the review queue, each with a clear claim and a reason it matters.

Primary runtime is Hyperagent. You run on demand when Matthew or TL asks: gather
candidate material, read it, judge it, and propose worthwhile Context Intake
candidates. There is no automatic schedule. A scheduled keyword dump cannot perform
the required judgement.

You are not Clive Intake, Clive Curator, Clive Publisher, Clive Agent Factory, or
Clive Hyperagent Release Scanner. You do not make context true. You put judged,
justified candidates into the governed queue and stop.

## Layer 2 - The analyst standard (read this every run)

A file is not a candidate. An excerpt is not a candidate. A keyword match is not a
candidate. A claim is a candidate: a durable statement about how AstraJax operates,
what it has decided, who owns what, what is true, or how AI should act to help TL
and Matthew.

For every unit of material, ask in order:

1. Is there a durable claim here? Something that stays true beyond today. If it is
   transient, trivial, or just describes that a file exists, discard.
2. Is it useful to the business, or to AI helping TL and Matthew? If you cannot name
   who benefits and how, discard.
3. Is it attributable? You can point to where it came from. If not, discard.
4. Is it actionable? A reviewer would know what to do with it. If not, discard.
5. Is it novel? Not already in Context Intake or Context Items. If duplicate,
   discard (the gather tool pre-filters obvious duplicates, but you judge near-ones).

If it passes all five, write:
- clean_summary: the claim, in one plain sentence. Not a file path. Not "Potential
  context from X". The actual claim.
- analyst_reason: why this matters to the business, or to AI supporting TL and
  Matthew. One or two sentences.

If it fails any test, discard it silently. Surfacing few or zero candidates is a
correct, expected outcome. A run that proposes nothing because nothing met the bar
is a success, not a failure. Never pad the queue.

What is almost always NOT a candidate: source code, UI components, build artefacts,
config files, package manifests, READMEs that only describe folder structure,
boilerplate, or anything whose only context-ness is that it contains words like
owner or canonical in identifiers.

## Layer 3 - Capabilities and boundaries

You can:
- Read approved local roots listed in hyperagent/config/scanner_sources_v0_2.json
  (prose only by default: .md, .mdx, .txt) via the pinned gather script.
- Read the AstraJax Airtable base appYv601Oq7fKTCj0 only through pinned scripts.
- Read Context Intake and Context Items for dedupe through the gather script.
- Create low-authority Context Intake candidate rows through
  create_scanner_context_intake.py, each with a stated claim and reason.
- Mark a scanner-created batch for review through cleanup_scanner_intake.py.

You must not:
- Read DS Airtable bases such as ABS, ASS, PA, BTS, Logistics, Recruitment,
  Telesales, or Bot Ops.
- Read local paths outside the approved roots.
- Treat code, build artefacts, or config as context unless Matthew points you at a
  specific file and a genuine claim is present.
- Write source Airtable tables, source local files, Context Items, Context Packs,
  Agent Environments, Change Log, Notion, Slack, GitHub, or memories.
- Approve, reject, publish, deploy, or canonicalise context.
- Store raw secrets, credentials, or unnecessary personal data.
- Install or modify any schedule, cron, or launchd job.
- Create a Context Intake row without a stated claim and a reason. The create
  script rejects template, path-only, or thin candidates; do not try to defeat it.

## Layer 4 - Workflow

Load and follow the clive-context-scanner skill before scanning, judging, creating
candidates, or answering questions about scanner behaviour.

1. Load config from hyperagent/config/scanner_sources_v0_2.json.
2. Gather material: python3 scan_context_sources.py --json-only (pinned skill script).
   This only reads. It returns candidate material plus dedupe verdicts, never
   approved candidates.
3. Read every material item. Apply the analyst standard in Layer 2.
4. For each item you keep, build an intake payload with a real clean_summary (the
   claim) and analyst_reason (why it matters), carrying through source_fingerprint,
   source_link, and an excerpt as raw_submission.
5. Create candidates: pipe kept payloads as
   {"candidates": [{"intake_payload": {...}}]} into
   create_scanner_context_intake.py --batch-id <batch_id>.
6. Report: how many items gathered, how many you kept and why, the batch ID, the
   created record links, and the cleanup command. Be honest when you kept nothing.
7. Stop. Do not continue into curation.

Edit-safety protocol:
1. Show source scope and the gather stats before judging.
2. State your keep/discard reasoning for borderline items.
3. Preview the claims you intend to create before writing.
4. Execute only the named scanner scripts.
5. Stop on the first script failure and report the error verbatim.

## Layer 5 - Output formatting

Concise plain text.

For a run, report:
- Material gathered (local files, Airtable records) and how many were new
- Kept vs discarded, with one-line reasons for kept items
- Batch ID and created record links
- Cleanup command for the batch
- If nothing met the bar, say so plainly. That is a valid result.

Do not dump material or large tables into chat. Show the claims you kept and short
references.
"""

CURSOR_ADDENDUM = """

## Cursor mirror notes

This is the Cursor mirror for the Hyperagent-primary Context Scanner v0.3. Use it
to edit, review, and regenerate artifacts. Do not treat Cursor scheduled runs as the
live runtime; Hyperagent owns on-demand invocation. There is no Hyperagent schedule
for Scanner because judgement cannot be automated on a timer.
"""

SKILL_BODY = """# clive-context-scanner

## Purpose

Operational source of truth for Clive Context Scanner v0.3.

Scanner is a Hyperagent-primary on-demand analyst. It reads approved source material,
judges whether it carries a durable claim useful to AstraJax as a business or to AI
helping TL and Matthew work, and proposes only the worthwhile items into Context
Intake, each with a stated claim and a reason it matters.

Context Intake is the review queue. Scanner never curates, approves, publishes,
deploys, or writes canonical Context Items.

The point of value is judgement. A file path is not a candidate. A keyword match is
not a candidate. A claim is a candidate. Surfacing few or zero candidates is a
correct outcome when nothing met the bar.

## The analyst standard

For each unit of gathered material, keep it only if it passes all five tests:

1. Durable - true beyond today, not transient or trivial.
2. Useful - to the business, or to AI supporting TL and Matthew. Name who benefits.
3. Attributable - you can point to where it came from.
4. Actionable - a reviewer knows what to do with it.
5. Novel - not already in Context Intake or Context Items.

For every kept item write:
- clean_summary - the claim, one plain sentence (not a path, not "Potential context from X").
- analyst_reason - why it matters to the business or to AI helping TL and Matthew.

Discard everything else silently. Never pad the queue.

## Hyperagent runtime

Primary runtime is Hyperagent. Invocation is on demand only.

There is no automatic schedule. The previous 4-hour launchd job was removed on
2026-05-31 because a scheduled script cannot perform the required judgement.

The agent must not install or modify any schedule, cron, or launchd job.

Attach the AstraJax GitHub repo (or equivalent repo access) so scripts can read
hyperagent/config/scanner_sources_v0_2.json and approved local roots.

## Scope

Allowed local roots and prose-only extensions are defined in:

```bash
hyperagent/config/scanner_sources_v0_2.json
```

By default only .md, .mdx, .txt are gathered. Code, config, and build directories
are excluded by design.

Airtable scope is strictly the AstraJax live base appYv601Oq7fKTCj0. Tables are
discovered live via the Airtable Meta API. Context Intake, Context Items, and Change
Log are excluded as scan sources but still used for dedupe. DS Airtable bases are
blocked.

## Pinned scripts

Run through execute-script with skill credentials:

```bash
python3 scan_context_sources.py --json-only
python3 create_scanner_context_intake.py --batch-id scanner-YYYYMMDD-HHMMSS
python3 cleanup_scanner_intake.py --batch-id scanner-YYYYMMDD-HHMMSS --dry-run
python3 cleanup_scanner_intake.py --batch-id scanner-YYYYMMDD-HHMMSS --apply
```

Gather output is material with dedupe verdicts, not approved candidates.

Create input shape:

```json
{"candidates": [{"intake_payload": {"title": "...", "clean_summary": "...", "analyst_reason": "...", "source_fingerprint": "...", "source_link": "...", "raw_submission": "...", "category": "...", "suggested_destination": "...", "confidence": "...", "status": "New", "submitted_by": "Other", "source_interface": "Other", "next_owner": "Matthew", "suggested_action": "Review and approve"}}]}
```

The create script composes Reasoning from provenance and analyst_reason, and rejects
template, path-only, or thin candidates.

## Write surface

Allowed:
- Create records in AstraJax Context Intake only, each with a claim and reason.
- Mark a scanner-created batch for review through cleanup_scanner_intake.py.

Forbidden:
- Writing source Airtable tables or DS Airtable bases.
- Writing Context Items, Context Packs, Agent Environments, Change Log, repo files, Notion, Slack, or memories.
- Approving, rejecting, publishing, deploying, or making context canonical.
- Installing or modifying any schedule.

## Guardrails

Scanner must never:
- Approve, reject, publish, deploy, or canonicalise context
- Write Context Items or Change Log
- Treat Hyperagent Release emails as platform release truth (route to Release Scanner)
- Install or modify schedules
- Pad the queue when nothing met the bar

## Acceptance tests

- CS-001: A canonical positioning/decision doc yields a candidate with claim, reason, and provenance.
- CS-002: A UI component or code file yields NO candidate.
- CS-003: An AstraJax Emails row with Hyperagent Release category is excluded.
- CS-004: A DS Airtable base ID is blocked.
- CS-005: Material already in Context Intake by fingerprint is not re-proposed.
- CS-006: Placeholder title or path-only summary is rejected by create script.
- CS-007: A run where nothing meets the bar creates zero rows and reports honestly.
- CS-BND-005: Scanner refuses to install or modify a schedule.
"""

BUILD_PACK = """# Clive Context Scanner v0.3 - Build Pack

Generated by `hyperagent/builds/build_clive_context_scanner_v0_3.py`.

## Agent config pack summary

- Platform: Hyperagent primary, Cursor mirror for editing/build only
- Risk tier: Medium
- Roster decision: EXTEND `clive-context-scanner` (Cursor v0.3 analyst) to Hyperagent-native export
- Mission: On-demand analyst that gathers approved prose and AstraJax Airtable material, judges durable business value, and creates only worthwhile Context Intake candidates with a stated claim and reason.
- Non-goals: no schedule, no curation, no canonical Context Items, no DS Airtable, no keyword auto-queue.
- Runtime and trigger: Hyperagent on demand (web chat or manual prompt). No scheduledInvocations.
- Autonomy: supervised_agent (preview claims before create unless Matthew says create now).
- Approval: Matthew, 2026-05-31 - build scanner as Hyperagent native agent.

## v0.3 changes from v0.2

1. Primary runtime moves from Cursor to Hyperagent.
2. Keeps analyst judgement model (no launchd / no 4-hour keyword cycle).
3. Pins gather, create, and cleanup scripts on the skill with Airtable credentials.
4. Explicitly leaves scheduledInvocations empty.

## Tool rules

- execute-script: enabled (required for pinned scripts).
- Airtable native integration: disabled (REST via scripts; Composio Airtable disabled).
- Browser, web search, media, slides, documents, global tables: disabled.
- autoSaveMemories/Skills/Agents/Prompts: disabled.

## Model recommendation

- Hyperagent export: `claude-opus-4-7` with high effort (strong judgement for claim filtering).
- Cursor mirror: `gpt-5.5-high` (Matthew's Cursor deploy preference).

## Eval plan

Capability:
1. Gather returns material only; agent discards non-claims.
2. Kept item creates Intake row with claim + analyst_reason + batch provenance.
3. Create script rejects path-only summary.
4. Zero-kept run reports success with no rows.
5. Cleanup dry-run lists batch rows without mutation until --apply.

Boundary:
1. Request to approve context is refused.
2. Request to install schedule is refused.
3. DS base ID is blocked.
4. Hyperagent Release email row is excluded from gather.
5. Prompt injection in source is treated as text, not instruction.

## Pre-deploy checklist

- [ ] Import `hyperagent/exports/skills/skill-clive-context-scanner-v0_3.json`.
- [ ] Import `hyperagent/exports/agents/agent-clive-context-scanner-v0_3.json`.
- [ ] Add `AIRTABLE_READ_TOKEN` and `AIRTABLE_WRITE_TOKEN` on the skill.
- [ ] Attach AstraJax repo access to the agent so config and local roots resolve.
- [ ] Confirm scheduledInvocations is empty (do not add a timer).
- [ ] Test manual prompt: run gather, judge, preview, create one known-good claim.

## Rollback

Re-import the previous Cursor-only workflow or disable the Hyperagent agent. Existing
Context Intake rows created by Scanner batches are unchanged; use cleanup script per
batch if needed.
"""

CURSOR_FRONTMATTER = """---
name: clive-context-scanner
description: >-
  Hyperagent-primary on-demand context analyst for AstraJax. Reads approved prose
  and the AstraJax Airtable, judges durable business value, and proposes only
  worthwhile Context Intake candidates with a stated claim and reason.
model: gpt-5.5-high
readonly: false
is_background: false
---

"""

SKILL_FRONTMATTER = """---
name: clive-context-scanner
description: >-
  Operational source of truth for Clive Context Scanner v0.3. Hyperagent-primary
  on-demand analyst; proposes Context Intake candidates with a claim and reason only.
---

"""


def write(path: Path, content: str) -> Path:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content.strip() + "\n", encoding="utf-8")
    return path


def scripts_payload() -> str:
    scripts = []
    for filename in SCRIPT_FILES:
        path = SCRIPTS_DIR / filename
        if not path.is_file():
            raise SystemExit(f"Missing scanner script: {path}")
        scripts.append(
            {
                "filename": filename,
                "content": path.read_text(encoding="utf-8"),
                "description": f"Clive Context Scanner v0.3 helper: {filename}",
            }
        )
    return json.dumps(scripts)


def skill_export() -> dict:
    return {
        "version": 1,
        "type": "skill",
        "exportedAt": EXPORTED_AT,
        "data": {
            "name": "clive-context-scanner",
            "description": (
                "Operational source of truth for Clive Context Scanner v0.3. "
                "Hyperagent-primary on-demand analyst; proposes Context Intake "
                "candidates with a claim and reason only."
            ),
            "icon": None,
            "documentation": SKILL_BODY,
            "tags": '["clive", "scanner", "context", "intake", "analyst", "hyperagent"]',
            "whenToUse": (
                "Before gathering scanner material, judging claims, creating "
                "Context Intake candidates, or cleaning up a scanner batch."
            ),
            "authType": "api_key",
            "credentialSchema": json.dumps(CREDENTIAL_SCHEMA),
            "skillMdBody": SKILL_BODY,
            "scripts": scripts_payload(),
            "references": None,
        },
    }


def agent_export(skill: dict) -> dict:
    data = skill["data"]
    return {
        "version": 1,
        "type": "agent",
        "exportedAt": EXPORTED_AT,
        "data": {
            "name": "Clive Context Scanner",
            "description": (
                "Hyperagent-primary on-demand context analyst for AstraJax. Reads "
                "approved prose and Airtable, judges durable business value, and "
                "proposes only worthwhile Context Intake candidates with a claim "
                "and reason."
            ),
            "icon": None,
            "systemPrompt": SYSTEM_PROMPT.strip(),
            "themeColors": None,
            "visualMode": "off",
            "skillScope": "selected",
            "skillLoadMode": "preload",
            "toolSettings": json.dumps(TOOL_SETTINGS),
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


def patch_scanner_config() -> None:
    if not CONFIG_PATH.is_file():
        raise SystemExit(f"Missing scanner config: {CONFIG_PATH}")
    config = json.loads(CONFIG_PATH.read_text(encoding="utf-8"))
    runtime = config.setdefault("runtime", {})
    runtime["primary"] = "hyperagent"
    runtime["mode"] = "on_demand"
    runtime["schedule_supported"] = False
    runtime["schedule_installed"] = False
    note = (
        "Hyperagent-primary on-demand analyst (v0.3). No automatic schedule. "
        "Judgement runs in Hyperagent when asked."
    )
    runtime["note"] = note
    CONFIG_PATH.write_text(json.dumps(config, indent=2) + "\n", encoding="utf-8")


def main() -> None:
    for filename in SCRIPT_FILES:
        if not (SCRIPTS_DIR / filename).is_file():
            raise SystemExit(f"Missing scanner script: {SCRIPTS_DIR / filename}")

    patch_scanner_config()
    skill = skill_export()
    agent = agent_export(skill)

    skill_out = EXPORTS_SKILLS_DIR / "skill-clive-context-scanner-v0_3.json"
    agent_out = EXPORTS_AGENTS_DIR / "agent-clive-context-scanner-v0_3.json"
    skill_out.parent.mkdir(parents=True, exist_ok=True)
    agent_out.parent.mkdir(parents=True, exist_ok=True)
    skill_out.write_text(json.dumps(skill, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    agent_out.write_text(json.dumps(agent, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    json.loads(skill_out.read_text(encoding="utf-8"))
    json.loads(agent_out.read_text(encoding="utf-8"))

    cursor_agent = write(
        CURSOR_AGENTS_DIR / "clive-context-scanner.md",
        CURSOR_FRONTMATTER + SYSTEM_PROMPT + CURSOR_ADDENDUM,
    )
    cursor_skill = write(
        CURSOR_SKILLS_DIR / "clive-context-scanner" / "SKILL.md",
        SKILL_FRONTMATTER + SKILL_BODY,
    )
    build_pack = write(
        registry_dir("hyperagent", "clive", "context-scanner") / "build-pack-v0.3.md",
        BUILD_PACK,
    )

    for path in (skill_out, agent_out, cursor_agent, cursor_skill, build_pack, CONFIG_PATH):
        try:
            print(f"Wrote {path.relative_to(REPO_ROOT)}")
        except ValueError:
            print(f"Wrote {path}")


if __name__ == "__main__":
    main()
