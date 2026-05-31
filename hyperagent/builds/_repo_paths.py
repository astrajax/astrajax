"""Shared repo paths for hyperagent build scripts."""

from __future__ import annotations

from pathlib import Path

BUILDS_DIR = Path(__file__).resolve().parent
HYPERAGENT_ROOT = BUILDS_DIR.parent
REPO_ROOT = HYPERAGENT_ROOT.parent

SCRIPTS_DIR = HYPERAGENT_ROOT / "scripts"
EXPORTS_AGENTS_DIR = HYPERAGENT_ROOT / "exports" / "agents"
EXPORTS_SKILLS_DIR = HYPERAGENT_ROOT / "exports" / "skills"
SCHEMA_PATH = HYPERAGENT_ROOT / "context_architecture_schema_v1.json"

AGENTS_DIR = REPO_ROOT / "agents"
CURSOR_AGENTS_DIR = REPO_ROOT / ".cursor" / "agents"
CURSOR_SKILLS_DIR = REPO_ROOT / ".cursor" / "skills"

PLATFORMS = ("cursor", "hyperagent")


def registry_dir(platform: str, family: str, slug: str) -> Path:
    """Human-readable agent home under agents/<platform>/<family>/<slug>/."""
    if platform not in PLATFORMS:
        raise ValueError(f"platform must be one of {PLATFORMS}, got {platform!r}")
    return AGENTS_DIR / platform / family / slug
