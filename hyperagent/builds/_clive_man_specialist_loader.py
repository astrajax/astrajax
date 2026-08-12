"""Load governed Clive's Man v0.4 scheduled specialist skills for Hyperagent export."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any

from _hyperagent_export import skill_data

SOURCES_ROOT = Path(__file__).resolve().parent / "sources" / "clive-man-v0_4" / "specialists"

SPECIALIST_DIRS: dict[str, str] = {
    "clive-man-context-auditor": "context-estate-audit-propose",
    "clive-man-context-challenger": "context-estate-challenge",
    "clive-man-context-executor": "context-amendment-execute",
}

SCRIPT_FILES: dict[str, tuple[str, ...]] = {
    "context-estate-audit-propose": (
        "context_config.py",
        "context_estate_audit_propose.py",
    ),
    "context-estate-challenge": (
        "context_config.py",
        "context_estate_challenge.py",
    ),
    "context-amendment-execute": (
        "context_config.py",
        "context_amendment_execute.py",
    ),
}


def _read_json(path: Path) -> dict[str, Any]:
    return json.loads(path.read_text(encoding="utf-8"))


def _build_scripts_json(specialist_dir: Path, dir_key: str) -> str:
    entries: list[dict[str, str]] = []
    for filename in SCRIPT_FILES[dir_key]:
        content = (specialist_dir / filename).read_text(encoding="utf-8")
        entries.append(
            {
                "filename": filename,
                "content": content,
                "description": f"Governed specialist script {filename} (clive-man-v0_4).",
            }
        )
    return json.dumps(entries)


def load_specialist_skill(slug: str) -> dict[str, Any]:
    """Return skill_data block with live specialist scripts and credential schema."""
    if slug not in SPECIALIST_DIRS:
        raise KeyError(f"Unknown specialist slug: {slug}")
    dir_key = SPECIALIST_DIRS[slug]
    specialist_dir = SOURCES_ROOT / dir_key
    meta = _read_json(specialist_dir / "skill-meta.json")
    scripts = _build_scripts_json(specialist_dir, dir_key)
    return skill_data(
        meta["name"],
        meta["description"],
        meta.get("skillMdBody") or meta.get("documentation", ""),
        icon=meta.get("icon"),
        tags=meta["tags"],
        when_to_use=meta["whenToUse"],
        auth_type=meta["authType"],
        credential_schema=meta["credentialSchema"],
        skill_md_body=meta["skillMdBody"],
        scripts=scripts,
        references=meta.get("references"),
    )


def specialist_schedule(slug: str) -> list[dict[str, Any]]:
    dir_key = SPECIALIST_DIRS[slug]
    return _read_json(SOURCES_ROOT / dir_key / "schedule.json")
