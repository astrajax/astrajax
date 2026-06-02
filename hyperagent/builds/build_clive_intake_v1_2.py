#!/usr/bin/env python3
"""Build Clive Intake v1.2 Hyperagent exports and Cursor agent/skills."""

from __future__ import annotations

import json
import re
import sys
from datetime import datetime, timezone
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from _repo_paths import (  # noqa: E402
    CURSOR_AGENTS_DIR,
    CURSOR_SKILLS_DIR,
    EXPORTS_AGENTS_DIR,
    EXPORTS_SKILLS_DIR,
    SCRIPTS_DIR,
)

ROOT = Path(__file__).resolve().parent
SCRIPT_PATH = SCRIPTS_DIR / "create_context_intake.py"
INTAKE_SKILL_PATH = EXPORTS_SKILLS_DIR / "skill-clive-context-intake-v1.json"

BASE_ID = "appYv601Oq7fKTCj0"
TABLE_ID = "tblJCmPGPUyszgFux"
RECORD_URL = f"https://airtable.com/{BASE_ID}/{TABLE_ID}/{{recordId}}"

EXPORTED_AT = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%S.000Z")

CREDENTIAL_SCHEMA = [
    {
        "name": "AIRTABLE_API_KEY",
        "label": "Airtable Personal Access Token",
        "type": "password",
        "hint": "Fresh PAT with data.records:read and data.records:write on base appYv601Oq7fKTCj0",
        "required": True,
    }
]

SCRIPT_DOC = """
## Airtable write script (post-Composio)

Composio Airtable is disabled. Intake writes via `create_context_intake.py`, called through **RunWithCredentials**. Do not use ExecuteIntegration for Airtable.

After user confirm, pipe one JSON object to the script. Set `source_interface` to `Slack` for Slack submissions, `Hyperagent Web` only if someone uses web chat.

On failure, report the script `error` verbatim and stop.
"""

SLACK_INTERFACE_PATCH = """
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
"""

SLACK_BLOCKS_SKILL_BODY = """# clive-context-intake-slack-blocks

**When to load:** After you have a draft Context Intake record ready for user confirmation (before calling `create_context_intake.py`).

Use Slack Block Kit for confirmation when the Slack integration supports `chat.postMessage` with `blocks`. Fall back to plain text if blocks or buttons are unavailable.

## Confirmation blocks template

Replace placeholders before send. If the draft JSON exceeds Slack button `value` limits (150 chars), keep the full draft in thread context and put only a short confirm token in `value`, or use text fallback.

```json
{
  "blocks": [
    {
      "type": "header",
      "text": { "type": "plain_text", "text": "Log this context?", "emoji": true }
    },
    {
      "type": "section",
      "fields": [
        { "type": "mrkdwn", "text": "*Category:*\\n{{category}}" },
        { "type": "mrkdwn", "text": "*Destination:*\\n{{destination}}" },
        { "type": "mrkdwn", "text": "*Confidence:*\\n{{confidence}}" },
        { "type": "mrkdwn", "text": "*Status:*\\n{{status}}" }
      ]
    },
    {
      "type": "section",
      "text": {
        "type": "mrkdwn",
        "text": "*Title:* {{title}}\\n*Next owner:* {{next_owner}}\\n*Suggested action:* {{suggested_action}}\\n*Reason:* {{one_sentence_reason}}"
      }
    },
    {
      "type": "actions",
      "block_id": "clive_intake_confirm",
      "elements": [
        {
          "type": "button",
          "action_id": "clive_intake_confirm_yes",
          "text": { "type": "plain_text", "text": "Confirm & log" },
          "style": "primary",
          "value": "confirm"
        },
        {
          "type": "button",
          "action_id": "clive_intake_confirm_edit",
          "text": { "type": "plain_text", "text": "Edit" },
          "value": "edit"
        },
        {
          "type": "button",
          "action_id": "clive_intake_confirm_cancel",
          "text": { "type": "plain_text", "text": "Cancel" },
          "style": "danger",
          "value": "cancel"
        }
      ]
    }
  ]
}
```

## Interaction handling

| action_id | Action |
|-----------|--------|
| `clive_intake_confirm_yes` | Create record via **clive-context-intake** / `create_context_intake.py` → post-create read-back → reply with Airtable link |
| `clive_intake_confirm_edit` | Ask one short question: "What should I change?" |
| `clive_intake_confirm_cancel` | "Cancelled. Nothing logged." |

Button click or short text (`yes`, `confirm`, `save it`, `log it`, `go`, `ok`) counts as confirm.

## Read-back in Slack (after create)

Plain text, one message, max 80 words:

```
Logged.

Record: {{title}}
Category: {{category}}
Destination: {{destination}}
Status: {{status}}
Owner: {{next_owner}}
Link: https://airtable.com/appYv601Oq7fKTCj0/tblJCmPGPUyszgFux/{{recordId}}
```

## Fallback text confirmation (≤80 words)

Same fields as the web confirmation template in **clive-context-intake**, one paragraph, end with `Confirm? (yes / edit / cancel)`
"""

SYSTEM_PROMPT = f"""# Clive Intake — System Prompt v1.2 (Slack-primary)

You are Clive Intake for Clive by Astrajax. Your only job is intake.

You capture messy context from Matthew or TL, classify it, suggest a destination, create one Airtable record in Context Intake, read it back, and stop.

You do not curate, approve, rewrite, publish, deploy, commit, fix, or implement. You never become Scanner, Curator, Publisher, or Fixer.

## Skills (non-negotiable)

- **clive-context-intake** — schema, routing, guardrails, Airtable create script
- **clive-context-intake-slack-blocks** — Slack confirmation and read-back formatting

If this prompt and a skill conflict, the skill wins.

## Primary interface: Slack

Matthew and TL use a **shared Slack channel**. Both must see every draft, confirmation, and logged record in the channel thread. Web chat is fallback only.

### Slack hard rules

- **Max 80 words** per Slack reply. Count them.
- Load **clive-context-intake-slack-blocks** before posting confirmation or read-back.
- Use Block Kit confirmation when Slack supports it; otherwise text fallback from that skill.
- **No pet names.** First name only, or no name.
- **No closing fluff.** End on the action.
- **No research narration** ("I'm checking..."). Work silently.
- Short affirmatives = confirm: yes, confirm, save it, log it, go, ok.
- One triggering human message in, one focused reply out. Do not reply to other bots or your own messages.

## Airtable write path

Composio Airtable is disabled. After confirm, call **RunWithCredentials** on skill `clive-context-intake`, script `create_context_intake.py`.

Set `source_interface` to **Slack** and infer `submitted_by` from the Slack user (Matthew / TL / Other per skill mapping).

Do not use ExecuteIntegration for Airtable. If the script returns `success: false`, report the error verbatim and stop.

## Intake hard rules

- One record per intake. Never log two records from one submission without explicit confirmation.
- Ask 1 to 3 clarifying questions max, only when needed to route safely.
- Never set Status to Approved, Rejected, Published, or Deployed.
- Never write outside Context Intake.
- Never invoke Cursor, GitHub, Notion, or edit other agents.
- Always preserve the user's exact wording in Raw Submission.

## Flow

1. Read the Slack message (or thread context for the same submission).
2. Clarify if needed (1–3 questions, one Slack message).
3. Classify per **clive-context-intake**.
4. Post confirmation per **clive-context-intake-slack-blocks**.
5. On confirm → `create_context_intake.py` → read-back with link in Slack.
6. Stop.

## Record URL

{RECORD_URL}

## Tone

Direct, concise, light-touch. No theatrics. No em-dashes.
"""

CURSOR_SYSTEM_PROMPT = f"""# Clive Intake — System Prompt v1.2 (Cursor)

You are Clive Intake for Clive by Astrajax. Your only job is intake.

You capture messy context from Matthew or TL, classify it, suggest a destination, create one Airtable record in Context Intake, read it back, and stop.

You do not curate, approve, rewrite, publish, deploy, commit, fix, or implement. You never become Scanner, Curator, Publisher, or Fixer.

## Skills (non-negotiable)

- **clive-context-intake** — schema, routing, guardrails, Airtable create script. Load this skill before every draft, confirmation, create, and read-back.
- **clive-context-intake-slack-blocks** — only when Matthew explicitly asks for Slack mode or Block Kit formatting.

If this prompt and a skill conflict, the skill wins.

## Primary interface: Cursor chat

Matthew and TL submit context in this Cursor agent chat. Use the plain-text confirmation template from **clive-context-intake**, not Slack Block Kit, unless Slack mode is explicitly requested.

### Cursor hard rules

- Be direct and concise. No theatrics. No em-dashes.
- **No pet names.** First name only, or no name.
- **No closing fluff.** End on the action.
- **No research narration** ("I'm checking..."). Work silently.
- Short affirmatives = confirm: yes, confirm, save it, log it, go, ok.
- One focused reply per turn.

## Airtable write path

After confirm, run the repo script (see **clive-context-intake**). Requires `AIRTABLE_API_KEY` in the environment.

```bash
echo '<json-one-line>' | python3 hyperagent/scripts/create_context_intake.py
```

Do not use Airtable MCP, Composio, or other integrations for create. If the script returns `success: false`, report the error verbatim and stop.

Set `source_interface` to **Other**. Put `Cursor chat` in **Reasoning**. Infer `submitted_by` from the chat user (Matthew / TL / Other per skill mapping).

## Intake hard rules

- One record per intake. Never log two records from one submission without explicit confirmation.
- Ask 1 to 3 clarifying questions max, only when needed to route safely.
- Never set Status to Approved, Rejected, Published, or Deployed.
- Never write outside Context Intake.
- Never edit other agents, GitHub files, Notion, or repo code.
- Always preserve the user's exact wording in Raw Submission.

## Flow

1. Read the message (and thread context for the same submission).
2. Clarify if needed (1–3 questions, one message).
3. Classify per **clive-context-intake**.
4. Post the plain-text confirmation from that skill.
5. On confirm → `create_context_intake.py` → read-back with Airtable link.
6. Stop.

## Record URL

{RECORD_URL}

## Tone

Direct, concise, light-touch. No theatrics. No em-dashes.
"""

CURSOR_AIRTABLE_WRITE_PATCH = """
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
"""

CURSOR_INTERFACE_PATCH = """
## Cursor interface

Matthew and TL submit context in the **Clive Intake Cursor agent** chat.

- Default `Source Interface` on create: **Other**
- Put `Cursor chat` in **Reasoning**
- `Submitted By`: Matthew or TL based on chat context; if unclear, ask once
"""


SUGGESTED_ACTION_SECTION = """## Suggested Action (multiple select — optional)

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

Legacy alias: if you only have a skill draft with `(downstream)` on the end, the create script strips that suffix when the base option exists without it."""


def load_base_skill_body() -> str:
    if INTAKE_SKILL_PATH.exists():
        body = json.loads(INTAKE_SKILL_PATH.read_text())["data"]["skillMdBody"]
    else:
        raise FileNotFoundError(f"Missing {INTAKE_SKILL_PATH}")

    if "## Airtable write script" not in body:
        marker = "## Confirmation template"
        body = body.replace(marker, SCRIPT_DOC.strip() + "\n\n" + marker)

    # Update Source interface section for Slack-primary
    body = re.sub(
        r"- Hyperagent Web \(default for v1\)\n- Slack \(do not use until Slack mode is enabled later\)",
        "- Slack (default for v1.2 — shared channel for Matthew and TL)\n- Hyperagent Web (fallback only)",
        body,
    )

    if "## Slack interface" not in body:
        marker = "## Confirmation template"
        body = body.replace(marker, SLACK_INTERFACE_PATCH.strip() + "\n\n" + marker)

    body = re.sub(
        r"## Suggested Action \(single select\).*?(?=\n## Build fields)",
        SUGGESTED_ACTION_SECTION + "\n\n",
        body,
        count=1,
        flags=re.DOTALL,
    )

    body = body.replace(
        "- Next Owner (`fldSSBGAB0MbF3C0E`)\n"
        "- Suggested Action (`fld1uEGF1NLgniofg`)\n"
        "- User Confirmation (`fldbmKaTPteEPEy15`) — true after confirm\n\n"
        "Recommended: Secondary Destination, Source Link, Reasoning, Clarifying Questions Asked, Duplicate Candidate Note, build fields when Destination = Cursor/GitHub.",
        "- Next Owner (`fldSSBGAB0MbF3C0E`)\n"
        "- User Confirmation (`fldbmKaTPteEPEy15`) — true after confirm\n\n"
        "Recommended: Suggested Action (optional), Secondary Destination, Source Link, Reasoning, Clarifying Questions Asked, Duplicate Candidate Note, build fields when Destination = Cursor/GitHub.",
    )

    body = body.replace(
        "2. Category, Destination, Confidence, Status, Submitted By, Source Interface, Next Owner, Suggested Action are exact strings from this skill.\n"
        "3. User Confirmation is true.\n"
        "4. Raw Submission contains the user's exact wording.\n"
        "5. Build fields are populated only when Destination = Cursor/GitHub.",
        "2. Category, Destination, Confidence, Status, Submitted By, Source Interface, Next Owner are exact strings from this skill.\n"
        "3. Suggested Action is omitted or uses exact labels from this skill (script sends an array to Airtable).\n"
        "4. User Confirmation is true.\n"
        "5. Raw Submission contains the user's exact wording.\n"
        "6. Build fields are populated only when Destination = Cursor/GitHub.",
    )

    body = body.replace(
        "| `next_owner` | Next Owner |\n"
        "| `suggested_action` | Suggested Action |\n"
        "| `user_confirmation` | User Confirmation (must be `true`) |\n\n"
        "### Optional JSON keys\n\n"
        "`secondary_destination`, `source_link`, `reasoning`, `clarifying_questions_asked`, `duplicate_candidate_note`, `build_surface`, `version_truth`, `suggested_repo`, `suggested_path`, `cursor_handoff_needed`, `github_publish_needed`",
        "| `next_owner` | Next Owner |\n"
        "| `user_confirmation` | User Confirmation (must be `true`) |\n\n"
        "### Optional JSON keys\n\n"
        "`suggested_action` (string or array; omit to leave blank), `secondary_destination`, `source_link`, `reasoning`, `clarifying_questions_asked`, `duplicate_candidate_note`, `build_surface`, `version_truth`, `suggested_repo`, `suggested_path`, `cursor_handoff_needed`, `github_publish_needed`",
    )

    return body


def build_intake_skill_export(skill_body: str, script_content: str) -> dict:
    scripts = [
        {
            "filename": "create_context_intake.py",
            "content": script_content,
            "description": "Creates one Context Intake record in tblJCmPGPUyszgFux. Post-Composio write path.",
        }
    ]
    return {
        "version": 1,
        "type": "skill",
        "exportedAt": EXPORTED_AT,
        "data": {
            "name": "clive-context-intake",
            "description": "Operational source of truth for Clive Intake. Schema, routing, guardrails, and Airtable create script for Context Intake in AstraJax base appYv601Oq7fKTCj0.",
            "icon": "📥",
            "documentation": skill_body,
            "tags": '["clive", "intake", "airtable", "slack", "context", "astrajax", "hyperagent"]',
            "whenToUse": "Before drafting confirmation, before Airtable create, and after create for read-back. Whenever Clive Intake classifies or logs to tblJCmPGPUyszgFux.",
            "authType": "api_key",
            "credentialSchema": json.dumps(CREDENTIAL_SCHEMA),
            "skillMdBody": skill_body,
            "scripts": json.dumps(scripts),
            "references": None,
        },
    }


def build_slack_skill_export() -> dict:
    body = SLACK_BLOCKS_SKILL_BODY
    return {
        "version": 1,
        "type": "skill",
        "exportedAt": EXPORTED_AT,
        "data": {
            "name": "clive-context-intake-slack-blocks",
            "description": "Slack Block Kit confirmation and read-back templates for Clive Intake. Load after draft, before Airtable create.",
            "icon": "💬",
            "documentation": body,
            "tags": '["clive", "intake", "slack", "block-kit", "astrajax"]',
            "whenToUse": "When posting a Context Intake confirmation or post-create read-back in Slack for Matthew or TL.",
            "authType": "none",
            "credentialSchema": None,
            "skillMdBody": body,
            "scripts": None,
            "references": None,
        },
    }


def patch_skill_for_cursor(body: str) -> str:
    body = re.sub(
        r"## Airtable write script \(v1\.1 — post-Composio\).*?(?=\n## (?:Slack interface|Confirmation template))",
        CURSOR_AIRTABLE_WRITE_PATCH.strip() + "\n\n",
        body,
        count=1,
        flags=re.DOTALL,
    )
    if "## Cursor interface" not in body:
        marker = "## Confirmation template"
        body = body.replace(marker, CURSOR_INTERFACE_PATCH.strip() + "\n\n" + marker)
    return body


def write_cursor_skill_md(name: str, description: str, body: str) -> Path:
    skill_dir = CURSOR_SKILLS_DIR / name
    skill_dir.mkdir(parents=True, exist_ok=True)
    out = skill_dir / "SKILL.md"
    frontmatter = (
        "---\n"
        f"name: {name}\n"
        f"description: {description}\n"
        "---\n\n"
    )
    out.write_text(frontmatter + body.strip() + "\n", encoding="utf-8")
    return out


def write_cursor_agent(prompt: str) -> Path:
    CURSOR_AGENTS_DIR.mkdir(parents=True, exist_ok=True)
    out = CURSOR_AGENTS_DIR / "clive-intake.md"
    content = f"""---
name: clive-intake
description: >-
  Intake-only agent for Clive by Astrajax. Classifies messy context from Matthew
  or TL, confirms, logs one Context Intake Airtable record, read-back, stop. Use
  when logging context, submitting intake, capturing rules/decisions/agent
  instructions, or when the user invokes Clive Intake.
model: inherit
readonly: false
is_background: false
---

{prompt.strip()}
"""
    out.write_text(content, encoding="utf-8")
    return out


def build_cursor_artifacts(
    intake_export: dict,
    slack_export: dict,
) -> tuple[Path, Path, Path]:
    intake_data = intake_export["data"]
    slack_data = slack_export["data"]
    intake_body = patch_skill_for_cursor(intake_data["skillMdBody"])
    agent_path = write_cursor_agent(CURSOR_SYSTEM_PROMPT)
    intake_path = write_cursor_skill_md(
        intake_data["name"],
        intake_data["description"],
        intake_body,
    )
    slack_path = write_cursor_skill_md(
        slack_data["name"],
        slack_data["description"],
        slack_data["skillMdBody"],
    )
    return agent_path, intake_path, slack_path


def embed_skill_from_export(export: dict, *, pinned: bool) -> dict:
    data = export["data"]
    return {
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
        "isPinned": pinned,
    }


def build_agent_export(intake_export: dict, slack_export: dict) -> dict:
    tool_settings = {
        "execute-script": True,
        "persistent-sandbox": False,
        "tables": True,
        "documents": False,
        "searchthreads": True,
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

    return {
        "version": 1,
        "type": "agent",
        "exportedAt": EXPORTED_AT,
        "data": {
            "name": "Clive Intake",
            "description": "Intake-only agent for Clive by Astrajax. Slack-primary shared channel for Matthew and TL. Classifies context, confirms, logs one Context Intake record via skill script, read-back, stop.",
            "icon": "📥",
            "systemPrompt": SYSTEM_PROMPT,
            "themeColors": None,
            "visualMode": "off",
            "skillScope": "selected",
            "skillLoadMode": "preload",
            "toolSettings": json.dumps(tool_settings),
            "allowedIntegrations": '["slack"]',
            "enableMemorySuggestions": False,
            "enableSkillSuggestions": False,
            "enablePromptSuggestions": False,
            "enableKnowledgeDiscovery": True,
            "autoSaveMemories": False,
            "autoSaveSkills": False,
            "autoSaveAgents": False,
            "autoSavePrompts": False,
            "modelId": "opus-latest",
            "maxThinkingTokens": 21000,
            "effort": "low",
            "maxBudgetUsd": None,
            "imageModel": None,
            "customBackgroundStyle": None,
            "customMessageCoverStyle": None,
            "skills": [
                embed_skill_from_export(intake_export, pinned=True),
                embed_skill_from_export(slack_export, pinned=True),
            ],
            "scheduledInvocations": [],
            "emailInvocations": [],
            "webhookEndpoints": [],
        },
    }


def main() -> None:
    script_content = SCRIPT_PATH.read_text()
    skill_body = load_base_skill_body()

    intake_export = build_intake_skill_export(skill_body, script_content)
    slack_export = build_slack_skill_export()
    agent_export = build_agent_export(intake_export, slack_export)

    intake_out = EXPORTS_SKILLS_DIR / "skill-clive-context-intake-v1.json"
    slack_out = EXPORTS_SKILLS_DIR / "skill-clive-context-intake-slack-blocks-v1.json"
    agent_out = EXPORTS_AGENTS_DIR / "agent-clive-intake-v1.json"
    EXPORTS_SKILLS_DIR.mkdir(parents=True, exist_ok=True)
    EXPORTS_AGENTS_DIR.mkdir(parents=True, exist_ok=True)

    intake_out.write_text(json.dumps(intake_export, indent=2, ensure_ascii=False) + "\n")
    slack_out.write_text(json.dumps(slack_export, indent=2, ensure_ascii=False) + "\n")
    agent_out.write_text(json.dumps(agent_export, indent=2, ensure_ascii=False) + "\n")

    for path in (intake_out, slack_out, agent_out):
        json.loads(path.read_text())

    cursor_agent, cursor_intake_skill, cursor_slack_skill = build_cursor_artifacts(
        intake_export,
        slack_export,
    )

    print(f"Wrote {intake_out}")
    print(f"Wrote {slack_out}")
    print(f"Wrote {agent_out}")
    print(f"Wrote {cursor_agent}")
    print(f"Wrote {cursor_intake_skill}")
    print(f"Wrote {cursor_slack_skill}")


if __name__ == "__main__":
    main()
