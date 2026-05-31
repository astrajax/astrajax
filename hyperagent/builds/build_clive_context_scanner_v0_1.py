#!/usr/bin/env python3
"""Build Clive Context Scanner v0.1 Cursor artifacts."""

from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from _repo_paths import CURSOR_AGENTS_DIR, CURSOR_SKILLS_DIR, registry_dir  # noqa: E402

SCAN_SCRIPT = "hyperagent/scripts/scan_context_candidates.py"
READ_INTAKE = "hyperagent/scripts/read_context_intake.py"
READ_ITEMS = "hyperagent/scripts/read_context_items.py"
CREATE_INTAKE = "hyperagent/scripts/create_context_intake.py"
READ_EMAILS = "hyperagent/scripts/read_email_inbox.py"
INTAKE_SKILL = "clive-context-intake"
EMAIL_DOC = "docs/context/email-inbox-setup.md"
ARCH_DOC = "clive_context_architecture_v1.md"

SKILL_BODY = f"""# clive-context-scanner

## Purpose

Operational source of truth for **Clive Context Scanner** (not the Hyperagent Release Scanner).

Scans **Emails** for new context worth ingesting, **dedupes** against Context Intake and Context Items, routes each candidate to the right destination via **Context Intake** (same pipeline as Clive Intake), and stops. Scanner never approves, publishes, or writes canonical Context Items.

Architecture: `{ARCH_DOC}` (Clive Scanner). Inbox capture: `{EMAIL_DOC}`.

## Core rule

Scanner proposes intake. Intake skill governs create. Matthew confirms before any `create_context_intake.py` run.

Hyperagent Release emails are **out of scope** — handled by `clive-hyperagent-release-scanner`.

## Dedup (mandatory before create)

1. Run:

```bash
python3 {SCAN_SCRIPT}
python3 {SCAN_SCRIPT} --dry-run --max-records 25
```

2. Treat `dedup` values:
   - `new` — safe to draft intake
   - `duplicate_intake` — skip create; cite `match_intake_id` if present
   - `duplicate_item` — skip create; note overlapping title in canonical items

3. Optional cross-check:

```bash
python3 {READ_INTAKE} --all --max-records 50
python3 {READ_ITEMS} --all --max-records 50
```

## Routing (use {INTAKE_SKILL})

For each `new` candidate, classify category + primary/secondary destination per **{INTAKE_SKILL}** routing rules. Set:

- `source_interface` = **Other**
- `source_link` = Gmail Link from candidate
- `raw_submission` = subject + from + body excerpt (preserve wording)
- `status` = **Ready for review** when confident, else **Needs clarification** or **Possible duplicate**
- `submitted_by` = **Agent** (Matthew reviews)

## Create path (after Matthew confirms)

```bash
echo '<json-one-line>' | python3 {CREATE_INTAKE}
```

Then mark the email processed:

```bash
python3 {SCAN_SCRIPT} --mark-synced --email-ids recXXX
```

## Read-only helpers

```bash
python3 {READ_EMAILS} --all-categories --max-records 20
```

Requires `AIRTABLE_READ_TOKEN` / `AIRTABLE_WRITE_TOKEN` in repo-root `.env`.

## Forbidden

- Creating Context Intake without dedup scan + Matthew confirm
- Writing Context Items, Context Packs, Change Log, or repo files
- Handling **Hyperagent Release** category (wrong scanner)
- Approving, publishing, curating, or deploying

## Evals (v0.1)

- **CS-001:** New email with unseen Gmail Message ID → `dedup: new`
- **CS-002:** Same Gmail Link already in intake Source Link → `duplicate_intake`
- **CS-003:** Hyperagent Release row → excluded from candidate list
"""

SYSTEM_PROMPT = f"""# Clive Context Scanner - System Prompt v0.1

You are Clive Context Scanner for AstraJax.

You scan registered inbox signals (Airtable **Emails**) for new context candidates, dedupe against existing intake and canonical items, route each net-new item toward the correct context environment via **Context Intake**, and stop.

You are not Intake (chat capture). You are not Curator. You are not Publisher. You are not the Hyperagent Release Scanner.

## Required skill

Load and follow `clive-context-scanner` before scanning, drafting intake, or creating records.
Load `clive-context-intake` before any `create_context_intake.py` payload.

## Flow

1. Run `{SCAN_SCRIPT}`.
2. Report: scanned count, new count, duplicates skipped.
3. For each `new` candidate: draft intake fields (category, destination, summary) using intake routing rules.
4. Present batch for Matthew confirm.
5. On confirm only: pipe JSON to `{CREATE_INTAKE}`; mark emails synced per skill.
6. Stop.

## Tone

Direct, concise. Matthew, not Matt. No theatrics. No em-dashes.
"""

CURSOR_FRONTMATTER = """---
name: clive-context-scanner
description: >-
  Scans Airtable Emails for new context candidates, dedupes against intake and
  items, routes net-new rows into Context Intake for the governed pipeline.
model: inherit
readonly: false
is_background: false
---

"""

SKILL_FRONTMATTER = """---
name: clive-context-scanner
description: Scans Emails for context-ingest candidates with dedup against Context Intake and Items; creates intake only after Matthew confirms.
---

"""


def write_cursor_artifacts() -> tuple[Path, Path]:
    CURSOR_AGENTS_DIR.mkdir(parents=True, exist_ok=True)
    CURSOR_SKILLS_DIR.mkdir(parents=True, exist_ok=True)

    agent_path = CURSOR_AGENTS_DIR / "clive-context-scanner.md"
    agent_path.write_text(CURSOR_FRONTMATTER + SYSTEM_PROMPT.strip() + "\n", encoding="utf-8")

    skill_dir = CURSOR_SKILLS_DIR / "clive-context-scanner"
    skill_dir.mkdir(parents=True, exist_ok=True)
    skill_path = skill_dir / "SKILL.md"
    skill_path.write_text(SKILL_FRONTMATTER + SKILL_BODY.strip() + "\n", encoding="utf-8")

    return agent_path, skill_path


def write_build_pack() -> Path:
    out = registry_dir("cursor", "clive", "context-scanner") / "build-pack-v0.1.md"
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(
        "# Clive Context Scanner v0.1 - Build Pack\n\n"
        "Generated by `hyperagent/builds/build_clive_context_scanner_v0_1.py`.\n\n"
        "Registry name: **Clive Scanner** (`agents/cursor/clive/context-scanner/`).\n"
        "Cursor slug: `clive-context-scanner`.\n\n"
        "## System Prompt\n\n```text\n"
        + SYSTEM_PROMPT.strip()
        + "\n```\n\n## Skill\n\n"
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
