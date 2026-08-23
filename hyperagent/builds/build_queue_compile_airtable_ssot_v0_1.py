#!/usr/bin/env python3
"""Build Queue compile — Airtable SSOT skill v0.1 (HA Doc Airtable packs).

Members unify: Target Worker on Household Members overlay; leftover Minions
are not the apply target. Never create_thread.

Outputs:
- hyperagent/exports/skills/skill-queue-compile-airtable-ssot-v0_1.json
Canonical body: .cursor/skills/queue-compile-airtable-ssot/SKILL.md
"""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from _hyperagent_export import skill_data, skill_export  # noqa: E402
from _repo_paths import CURSOR_SKILLS_DIR, EXPORTS_SKILLS_DIR, REPO_ROOT  # noqa: E402

SKILL_SLUG = "queue-compile-airtable-ssot"
SKILL_NAME = "Queue compile — Airtable SSOT"
SKILL_ICON = "🗂️"
SKILL_TAGS = '["astrajax", "queue", "doc", "compile", "governance"]'
WHEN_TO_USE = (
    "HA Doc compile of scout Recommendations into Agent Update Actions. "
    "Airtable writes only: classify surface from Register Members Kind, set "
    "Rec Target Surface Type + Target Skill, Target Worker on Members overlay "
    "for Head/Minion, Execute off, one open pack per surface. Never write "
    "leftover Minions. Never create_thread, Self-Update, or Skill Forge."
)
DESCRIPTION = (
    "Queue v1.2 compile: HA Doc (Opus) packs Recs into Agent Update Actions "
    "with Execute off and Target Worker on the Household Members overlay. "
    "Cursor Grok drains after Matthew ticks Execute. Leftover Minions are "
    "not the apply target. Rec Execute is not the implement gate."
)
EXPORT_NAME = "skill-queue-compile-airtable-ssot-v0_1.json"


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
