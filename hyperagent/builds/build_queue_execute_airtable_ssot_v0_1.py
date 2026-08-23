#!/usr/bin/env python3
"""Build Queue execute — Airtable SSOT skill v0.1 (Cursor drain, Queue v1.2).

Members unify: Target Worker on Household Members overlay; leftover Minions
are not the apply target.

Outputs:
- hyperagent/exports/skills/skill-queue-execute-airtable-ssot-v0_1.json
Canonical body: .cursor/skills/queue-execute-airtable-ssot/SKILL.md
"""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from _hyperagent_export import skill_data, skill_export  # noqa: E402
from _repo_paths import CURSOR_SKILLS_DIR, EXPORTS_SKILLS_DIR, REPO_ROOT  # noqa: E402

SKILL_SLUG = "queue-execute-airtable-ssot"
SKILL_NAME = "Queue execute — Airtable SSOT"
SKILL_ICON = "📋"
SKILL_TAGS = '["astrajax", "queue", "doc", "self-update", "governance"]'
WHEN_TO_USE = (
    "Cursor Automation Grok 4.6 daily ~09:00 drain of Agent Update Actions "
    "where Execute is ticked and Status is Pending Review. Group/serialise by "
    "Target Worker (Members overlay). Ignore Rec Execute and leftover Target "
    "Minion. Register Members after verify, never leftover Minions. Not HA "
    "Doc apply. Not a custom MCP."
)
DESCRIPTION = (
    "Queue v1.2 drain: Cursor Grok applies Matthew-ticked Agent Update Actions. "
    "Head/Minion Target Worker → Self-Update that Members row; skill patch → "
    "Register + Provenance webhook; new skill → Skill Forge create. Rec Execute "
    "is not the gate. Leftover Minions are not the apply target."
)
EXPORT_NAME = "skill-queue-execute-airtable-ssot-v0_1.json"


def _strip_frontmatter(text: str) -> str:
    if not text.startswith("---"):
        return text.strip()
    match = re.match(r"^---\n.*?\n---\n(.*)$", text, flags=re.DOTALL)
    return (match.group(1) if match else text).strip()


def load_skill_body() -> str:
    path = CURSOR_SKILLS_DIR / SKILL_SLUG / "SKILL.md"
    if not path.is_file():
        raise SystemExit(f"Missing Cursor skill body: {path}")
    return _strip_frontmatter(path.read_text(encoding="utf-8"))


def main() -> None:
    body = load_skill_body()
    data = skill_data(
        SKILL_NAME,
        DESCRIPTION,
        body,
        icon=SKILL_ICON,
        tags=SKILL_TAGS,
        when_to_use=WHEN_TO_USE,
        auth_type="none",
        credential_schema=None,
        skill_md_body=body,
        scripts=None,
        references=None,
    )
    export = skill_export(data)
    EXPORTS_SKILLS_DIR.mkdir(parents=True, exist_ok=True)
    export_path = EXPORTS_SKILLS_DIR / EXPORT_NAME
    export_path.write_text(
        json.dumps(export, indent=2, ensure_ascii=False) + "\n",
        encoding="utf-8",
    )
    print(f"Wrote {export_path.relative_to(REPO_ROOT)}")


if __name__ == "__main__":
    main()
