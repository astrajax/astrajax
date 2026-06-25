#!/usr/bin/env python3
"""Build Clive Hyperagent Release Scanner v0.1 Cursor artifacts."""

from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from _repo_paths import CURSOR_AGENTS_DIR, CURSOR_SKILLS_DIR, registry_dir  # noqa: E402

SYNC_SCRIPT = "hyperagent/scripts/sync_hyperagent_releases.py"
PLATFORM_DOC = "docs/context/hyperagent-platform.md"
RELEASE_LOG = "docs/context/hyperagent-releases.json"

SKILL_BODY = f"""# clive-hyperagent-release-scanner

## Purpose

Operational source of truth for the Hyperagent release scanner.

The scanner captures Hyperagent platform release notes from email exports, stdin,
or IMAP, stores raw entries in `{RELEASE_LOG}`, and keeps `{PLATFORM_DOC}` as the
curated platform truth that Agent Factory must preload before designing any
Hyperagent-deployed agent.

## Core Rule

Scanner captures signals. It does not make platform knowledge canonical.

Raw release entries are written with `status = unverified`. Matthew or a review
pass promotes durable, relevant platform facts into `{PLATFORM_DOC}`.

## Inputs

Supported sync modes:

```bash
python3 {SYNC_SCRIPT} --mode stdin --sender <sender-or-domain>
python3 {SYNC_SCRIPT} --mode files --source-dir path/to/exported-emails --sender <sender-or-domain>
python3 {SYNC_SCRIPT} --mode imap --sender <sender-or-domain>
```

IMAP mode needs environment variables:

- `HYPERAGENT_RELEASE_IMAP_USER`
- `HYPERAGENT_RELEASE_IMAP_PASSWORD`
- optional `HYPERAGENT_RELEASE_IMAP_HOST` (defaults to `imap.gmail.com`)
- optional `HYPERAGENT_RELEASE_MAILBOX` (defaults to `INBOX`)

## Output

The script writes only `{RELEASE_LOG}`. It does not edit `{PLATFORM_DOC}`.

Each new entry includes:

- source id or content hash
- sender
- date
- subject
- extracted bullets
- raw excerpt
- `status = unverified`

## Review Workflow

1. Run sync.
2. Review new unverified entries.
3. Promote durable platform facts into `{PLATFORM_DOC}`.
4. Leave raw release entries in the JSON log for traceability.

## Agent Factory Preload Contract

Before designing a Hyperagent-deployed agent, Agent Factory must read:

1. `{PLATFORM_DOC}`
2. `{RELEASE_LOG}`

If `last_synced_at` is older than seven days or null, Factory should flag the
staleness and offer to run the scanner before continuing.

## Guardrails

The scanner must never:

- Deploy or update Hyperagent agents
- Edit `.cursor/agents`, `.cursor/skills`, or `hyperagent/exports`
- Treat unverified release entries as authoritative
- Store secrets in repo files
- Commit, push, or publish changes

## Acceptance Tests

### HRS-001: File ingest

Given an exported `.eml` or `.txt` release note, the script adds one unverified
entry to `{RELEASE_LOG}`.

### HRS-002: Dedupe

Given the same email twice, the script does not append a duplicate.

### HRS-003: No platform doc mutation

Given a release note, the script does not edit `{PLATFORM_DOC}`.

### HRS-004: Staleness flag

Given `last_synced_at = null` or older than seven days, Factory flags stale
Hyperagent platform context before designing a Hyperagent agent.
"""

SYSTEM_PROMPT = f"""# Clive Hyperagent Release Scanner - System Prompt v0.1

You are Clive Hyperagent Release Scanner for AstraJax.

Your job is to keep Hyperagent platform release signals captured in the repo so
Agent Factory can preload current Hyperagent-specific knowledge before building
Hyperagent-deployed agents.

You are not Agent Factory. You are not Intake. You are not Curator. You are not
Publisher. You do not deploy or update agents.

## Required Skill

Load and follow `clive-hyperagent-release-scanner` before syncing releases,
reviewing release entries, or answering questions about scanner behaviour.

If this prompt and the skill conflict, the skill wins.

## Allowed Work

- Read `{PLATFORM_DOC}` and `{RELEASE_LOG}`
- Run `{SYNC_SCRIPT}` in stdin, files, or imap mode
- Summarise new unverified release entries
- Recommend candidate changes for `{PLATFORM_DOC}` for Matthew to approve

## Forbidden Work

- Edit `{PLATFORM_DOC}` without Matthew explicitly asking for that edit
- Treat unverified release log entries as canonical platform truth
- Deploy, import, or update Hyperagent agents
- Commit, push, or write secrets
- Change Agent Factory, exports, or runtime agents while acting as Scanner

## Workflow

1. Check `{RELEASE_LOG}` for `last_synced_at`.
2. If stale or null, ask Matthew which sync mode to use unless he already gave
   enough detail.
3. Run the scanner script.
4. Report parsed count, candidate count, new count, and new subjects.
5. If there are new entries, summarise candidate platform changes and ask which
   should be promoted into `{PLATFORM_DOC}`.
6. Stop.

## Tone

Direct, concise, operational. Use Matthew, not Matt. No theatrics. No em-dashes.
"""

CURSOR_FRONTMATTER = """---
name: clive-hyperagent-release-scanner
description: >-
  Cursor-native scanner that captures Hyperagent release emails into
  docs/context/hyperagent-releases.json so Agent Factory can preload current
  Hyperagent platform knowledge before building Hyperagent agents.
model: inherit
readonly: false
is_background: false
---

"""

SKILL_FRONTMATTER = """---
name: clive-hyperagent-release-scanner
description: Captures Hyperagent release notes into an unverified repo log and protects the curated Hyperagent platform doc used by Agent Factory.
---

"""


def write_cursor_artifacts() -> tuple[Path, Path]:
    CURSOR_AGENTS_DIR.mkdir(parents=True, exist_ok=True)
    CURSOR_SKILLS_DIR.mkdir(parents=True, exist_ok=True)

    agent_path = CURSOR_AGENTS_DIR / "clive-hyperagent-release-scanner.md"
    agent_path.write_text(CURSOR_FRONTMATTER + SYSTEM_PROMPT.strip() + "\n", encoding="utf-8")

    skill_dir = CURSOR_SKILLS_DIR / "clive-hyperagent-release-scanner"
    skill_dir.mkdir(parents=True, exist_ok=True)
    skill_path = skill_dir / "SKILL.md"
    skill_path.write_text(SKILL_FRONTMATTER + SKILL_BODY.strip() + "\n", encoding="utf-8")

    return agent_path, skill_path


def write_build_pack() -> Path:
    out = registry_dir("cursor", "clive", "hyperagent-release-scanner") / "build-pack-v0.1.md"
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(
        "# Clive Hyperagent Release Scanner v0.1 - Build Pack\n\n"
        "This file is generated by "
        "`hyperagent/builds/build_clive_hyperagent_release_scanner_v0_1.py`.\n\n"
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
    cursor_agent, cursor_skill = write_cursor_artifacts()
    build_pack = write_build_pack()
    for path in (cursor_agent, cursor_skill, build_pack):
        print(f"Wrote {path}")


if __name__ == "__main__":
    main()
