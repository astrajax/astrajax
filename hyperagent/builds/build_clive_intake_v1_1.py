#!/usr/bin/env python3
"""Build Clive Intake v1.1 Hyperagent export JSON (skill + agent)."""

from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent
SCRIPT_PATH = ROOT / "scripts" / "create_context_intake.py"

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
## Airtable write script (v1.1 — post-Composio)

Composio integrations are disabled platform-wide. Intake writes via `create_context_intake.py` in this skill, called through **RunWithCredentials**. Do not use ExecuteIntegration or Composio.

### When to call

After the user confirms the draft, pipe one JSON object to the script via RunWithCredentials.

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
| `suggested_action` | Suggested Action |
| `user_confirmation` | User Confirmation (must be `true`) |

### Optional JSON keys

`secondary_destination`, `source_link`, `reasoning`, `clarifying_questions_asked`, `duplicate_candidate_note`, `build_surface`, `version_truth`, `suggested_repo`, `suggested_path`, `cursor_handoff_needed`, `github_publish_needed`

### Example

```json
{
  "title": "Clive default framing for AI assistants",
  "raw_submission": "When helping with Astrajax...",
  "clean_summary": "Default Astrajax/Clive framing for AI assistants.",
  "category": "Agent Instruction",
  "suggested_destination": "Hyperagent",
  "confidence": "High",
  "status": "Ready for review",
  "submitted_by": "Matthew",
  "source_interface": "Hyperagent Web",
  "next_owner": "Matthew",
  "suggested_action": "Update agent instruction",
  "user_confirmation": true
}
```

### Script response

On success, stdout is JSON: `{ "success": true, "record_id": "rec...", "url": "...", "fields": {...} }`

Use `fields` for read-back. If values differ from the draft, report mismatch per the read-back template.

On failure, stdout is JSON: `{ "success": false, "error": "..." }` — report the error verbatim and stop.
"""

SYSTEM_PROMPT = f"""# Clive Intake — System Prompt v1.1

You are Clive Intake for Clive by Astrajax. Your only job is intake.

You capture messy context from Matthew or TL, classify it, suggest a destination, create one Airtable record in Context Intake, read it back, and stop.

You do not curate, approve, rewrite, publish, deploy, commit, fix, or implement. You never become Scanner, Curator, Publisher, or Fixer.

## Skill load rule (non-negotiable)

The skill `clive-context-intake` is preloaded. Follow it in full for fields, categories, statuses, destinations, confirmation format, read-back format, and guardrails. If this prompt and the skill conflict, the skill wins.

## Airtable write path (v1.1)

Composio is disabled. After user confirm, create the record by calling **RunWithCredentials** on skill `clive-context-intake`, script `create_context_intake.py`, with a JSON payload matching the skill's required keys.

Do not use ExecuteIntegration, SearchIntegrations, or any Composio integration.

If the script returns `success: false`, report the `error` verbatim and stop. Do not retry silently. Do not invent a record link.

## Hard rules

- One record per intake. Never log two records from one submission without explicit confirmation.
- Ask 1 to 3 clarifying questions max, only when needed to route safely. Otherwise log directly.
- Short affirmatives count as confirm: yes, confirm, save it, log it, go, ok.
- Never set Status to Approved, Rejected, Published, or Deployed. Those are downstream-only.
- Never write to any table except Context Intake.
- Never invoke Cursor, write to GitHub, edit code, publish to Notion, or update any other agent's prompt or skill.
- Never auto-save memories. Never auto-save skills. Never modify the agent configuration.
- Always preserve the user's exact wording in Raw Submission.
- If confidence is low after clarifying, set Status = Needs clarification, Next Owner = Matthew, and stop asking.

## Interface

For v1, Matthew and TL use you through the Hyperagent web interface. Do not use Slack-only formatting, Block Kit, channels, threads, or emojis as control characters. Plain text, concise, structured.

## Flow

1. Read the user's input.
2. Decide if it is clear enough to log. If not, ask 1 to 3 questions in one reply.
3. Classify per skill categories. Choose primary destination per skill rules. Choose at most one secondary destination if needed.
4. Draft the confirmation per skill template.
5. On short-affirmative confirm, call `create_context_intake.py` via RunWithCredentials with the JSON payload.
6. Read back from the script response per skill template, including the record URL.
7. Stop.

## Record URL

{RECORD_URL}

## Tone

Direct, concise, light-touch. No theatrics. No pet names. No research narration ("I'm checking..."). No filler sign-offs. No em-dashes.
"""


def load_skill_body() -> str:
    skill_path = ROOT / "skill-clive-context-intake-v1.json"
    data = json.loads(skill_path.read_text())["data"]
    body = data["skillMdBody"]
    # Insert script section before "## Confirmation template"
    marker = "## Confirmation template"
    if marker in body and "## Airtable write script" not in body:
        body = body.replace(marker, SCRIPT_DOC.strip() + "\n\n" + marker)
    elif "## Airtable write script" not in body:
        body = body + "\n" + SCRIPT_DOC.strip()
    return body


def build_skill_export(skill_body: str, script_content: str) -> dict:
    scripts = [
        {
            "filename": "create_context_intake.py",
            "content": script_content,
            "description": "Creates one Context Intake record in tblJCmPGPUyszgFux and read-backs via Airtable REST API. Post-Composio write path for Clive Intake v1.1.",
        }
    ]
    return {
        "version": 1,
        "type": "skill",
        "exportedAt": EXPORTED_AT,
        "data": {
            "name": "clive-context-intake",
            "description": "Operational source of truth for Clive Intake. Schema, categories, destinations, confirmation, read-back, guardrails, and Airtable create script for Context Intake in AstraJax base appYv601Oq7fKTCj0.",
            "icon": "📥",
            "documentation": skill_body,
            "tags": '["clive", "intake", "airtable", "context", "astrajax", "hyperagent"]',
            "whenToUse": "Before drafting a Context Intake confirmation, before Airtable create via create_context_intake.py, and again after create for read-back. Whenever Clive Intake classifies or logs context to table tblJCmPGPUyszgFux.",
            "authType": "api_key",
            "credentialSchema": json.dumps(CREDENTIAL_SCHEMA),
            "skillMdBody": skill_body,
            "scripts": json.dumps(scripts),
            "references": None,
        },
    }


def build_agent_export(skill_body: str, script_content: str) -> dict:
    scripts = json.loads(build_skill_export(skill_body, script_content)["data"]["scripts"])
    embedded_skill = {
        "name": "clive-context-intake",
        "description": "Operational source of truth for Clive Intake. Schema, categories, destinations, confirmation, read-back, guardrails, and Airtable create script for Context Intake in AstraJax base appYv601Oq7fKTCj0.",
        "icon": "📥",
        "documentation": skill_body,
        "tags": '["clive", "intake", "airtable", "context", "astrajax", "hyperagent"]',
        "whenToUse": "Before drafting a Context Intake confirmation, before Airtable create via create_context_intake.py, and again after create for read-back. Whenever Clive Intake classifies or logs context to table tblJCmPGPUyszgFux.",
        "authType": "api_key",
        "credentialSchema": json.dumps(CREDENTIAL_SCHEMA),
        "skillMdBody": skill_body,
        "scripts": json.dumps(scripts),
        "references": None,
        "isPinned": True,
    }

    tool_settings = {
        "execute-script": True,
        "persistent-sandbox": False,
        "tables": True,
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

    return {
        "version": 1,
        "type": "agent",
        "exportedAt": EXPORTED_AT,
        "data": {
            "name": "Clive Intake",
            "description": "Intake-only agent for Clive by Astrajax. Captures messy context from Matthew or TL, classifies it, suggests a destination, creates one Context Intake record in Airtable via skill script, reads it back, and stops.",
            "icon": "📥",
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
            "modelId": "opus-latest",
            "maxThinkingTokens": 21000,
            "effort": "low",
            "maxBudgetUsd": None,
            "imageModel": None,
            "customBackgroundStyle": None,
            "customMessageCoverStyle": None,
            "skills": [embedded_skill],
            "scheduledInvocations": [],
            "emailInvocations": [],
            "webhookEndpoints": [],
        },
    }


def main() -> None:
    script_content = SCRIPT_PATH.read_text()
    skill_body = load_skill_body()

    skill_export = build_skill_export(skill_body, script_content)
    agent_export = build_agent_export(skill_body, script_content)

    skill_out = ROOT / "skill-clive-context-intake-v1.json"
    agent_out = ROOT / "agent-clive-intake-v1.json"

    skill_out.write_text(json.dumps(skill_export, indent=2, ensure_ascii=False) + "\n")
    agent_out.write_text(json.dumps(agent_export, indent=2, ensure_ascii=False) + "\n")

    # Validate parse
    json.loads(skill_out.read_text())
    json.loads(agent_out.read_text())

    print(f"Wrote {skill_out}")
    print(f"Wrote {agent_out}")


if __name__ == "__main__":
    main()
