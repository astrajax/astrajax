"""Load approved household standard skill objects for Clive's Man v0.4 exports."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any

from _hyperagent_export import embed_skill
from _repo_paths import CURSOR_SKILLS_DIR, EXPORTS_SKILLS_DIR, REPO_ROOT

HOUSEHOLD_SKILL_FILES = (
    "skill-household-communication-standard-v0_1.json",
    "skill-household-routing-standard-v0_1.json",
    "skill-household-conduct-standard-v0_1.json",
    "skill-household-activity-logging-v0_1.json",
)

ROUTING_SKILL_EXPORT_NAME = "skill-household-routing-standard-v0_1.json"
ROUTING_SKILL_MD = CURSOR_SKILLS_DIR / "household-routing-standard" / "SKILL.md"

FLEET_ACTIVITY_CRED_ENV = "FLEET_ACTIVITY_WRITE"


def _strip_frontmatter(text: str) -> str:
    if text.startswith("---"):
        parts = text.split("---", 2)
        if len(parts) == 3:
            return parts[2].lstrip("\n")
    return text


def _load_export(path: Path) -> dict[str, Any]:
    payload = json.loads(path.read_text(encoding="utf-8"))
    return payload["data"]


def _routing_skill_body_for_family() -> str:
    """Option 3 routing body from cleared Claude/Cursor source — not legacy v0_1 export."""
    if not ROUTING_SKILL_MD.is_file():
        raise FileNotFoundError(f"Missing routing skill source: {ROUTING_SKILL_MD}")
    return _strip_frontmatter(ROUTING_SKILL_MD.read_text(encoding="utf-8")).rstrip("\n")


def household_skill_embeds(*, pinned: bool = False) -> list[dict[str, Any]]:
    """Return four household standard embed objects for Clive's Man family exports."""
    out: list[dict[str, Any]] = []
    for name in HOUSEHOLD_SKILL_FILES:
        path = EXPORTS_SKILLS_DIR / name
        if not path.is_file():
            raise FileNotFoundError(f"Missing household skill export: {path.relative_to(REPO_ROOT)}")
        block = _load_export(path)
        if name == ROUTING_SKILL_EXPORT_NAME:
            body = _routing_skill_body_for_family()
            block = dict(block)
            block["documentation"] = body
            block["skillMdBody"] = body
        out.append(embed_skill(block, pinned=pinned))
    return out


def activity_logging_has_credential_schema() -> bool:
    path = EXPORTS_SKILLS_DIR / "skill-household-activity-logging-v0_1.json"
    data = _load_export(path)
    schema = data.get("credentialSchema") or []
    return any(entry.get("name") == FLEET_ACTIVITY_CRED_ENV for entry in schema)

