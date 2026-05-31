#!/usr/bin/env python3
"""List versioned agents and skills from the AstraJax repo (no Airtable)."""

from __future__ import annotations

import argparse
import json
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
HYPERAGENT_ROOT = REPO_ROOT / "hyperagent"
EXPORTS_AGENTS_DIR = HYPERAGENT_ROOT / "exports" / "agents"
AGENTS_DIR = REPO_ROOT / "agents"
CURSOR_AGENTS_DIR = REPO_ROOT / ".cursor" / "agents"
CURSOR_SKILLS_DIR = REPO_ROOT / ".cursor" / "skills"
PLATFORMS = ("cursor", "hyperagent")


def parse_cursor_agent(path: Path) -> dict:
    text = path.read_text(encoding="utf-8")
    name = path.stem
    description = ""
    if text.startswith("---"):
        front = text.split("---", 2)[1]
        for line in front.splitlines():
            if line.startswith("name:"):
                name = line.split(":", 1)[1].strip()
            elif line.startswith("description:"):
                description = line.split(":", 1)[1].strip().strip(">- ").strip("'\"")
    return {
        "platform": "cursor",
        "source": "cursor_agent",
        "path": str(path.relative_to(REPO_ROOT)),
        "name": name,
        "description": description,
    }


def parse_hyperagent_export(path: Path) -> dict:
    payload = json.loads(path.read_text(encoding="utf-8"))
    data = payload.get("data") or payload
    skills = data.get("skills") or []
    skill_names = [s.get("name") for s in skills if isinstance(s, dict) and s.get("name")]
    return {
        "platform": "hyperagent",
        "source": "hyperagent_export",
        "path": str(path.relative_to(REPO_ROOT)),
        "name": data.get("name") or path.stem,
        "description": data.get("description") or "",
        "model_id": data.get("modelId"),
        "skill_names": skill_names,
        "skill_count": len(skill_names),
    }


def parse_registry_build_pack(path: Path) -> dict:
    rel = path.relative_to(REPO_ROOT)
    parts = rel.parts
    platform = parts[1] if len(parts) > 1 else ""
    family = parts[2] if len(parts) > 2 else ""
    short_name = parts[3] if len(parts) > 3 else ""
    return {
        "platform": platform,
        "source": "registry_build_pack",
        "path": str(rel),
        "family": family,
        "short_name": short_name,
        "version_file": path.name,
    }


def parse_cursor_skills() -> list[dict]:
    skills: list[dict] = []
    if not CURSOR_SKILLS_DIR.exists():
        return skills
    for skill_dir in sorted(CURSOR_SKILLS_DIR.iterdir()):
        skill_md = skill_dir / "SKILL.md"
        if not skill_dir.is_dir() or not skill_md.exists():
            continue
        text = skill_md.read_text(encoding="utf-8")
        name = skill_dir.name
        description = ""
        if text.startswith("---"):
            front = text.split("---", 2)[1]
            for line in front.splitlines():
                if line.startswith("name:"):
                    name = line.split(":", 1)[1].strip()
                elif line.startswith("description:"):
                    description = line.split(":", 1)[1].strip()
        skills.append(
            {
                "platform": "cursor",
                "source": "cursor_skill",
                "path": str(skill_md.relative_to(REPO_ROOT)),
                "name": name,
                "description": description,
            }
        )
    return skills


def list_registry(platform: str | None = None) -> list[dict]:
    registry: list[dict] = []
    if not AGENTS_DIR.exists():
        return registry
    platforms = [platform] if platform else list(PLATFORMS)
    for plat in platforms:
        plat_dir = AGENTS_DIR / plat
        if not plat_dir.exists():
            continue
        for path in sorted(plat_dir.glob("*/*/build-pack-*.md")):
            registry.append(parse_registry_build_pack(path))
    return registry


def list_runtime_agents(platform: str | None = None) -> list[dict]:
    agents: list[dict] = []
    if platform in (None, "hyperagent") and EXPORTS_AGENTS_DIR.exists():
        for path in sorted(EXPORTS_AGENTS_DIR.glob("agent-*.json")):
            agents.append(parse_hyperagent_export(path))
    if platform in (None, "cursor") and CURSOR_AGENTS_DIR.exists():
        for path in sorted(CURSOR_AGENTS_DIR.glob("*.md")):
            agents.append(parse_cursor_agent(path))
    return agents


def group_by_platform(items: list[dict]) -> dict[str, list[dict]]:
    grouped: dict[str, list[dict]] = {p: [] for p in PLATFORMS}
    for item in items:
        plat = item.get("platform")
        if plat in grouped:
            grouped[plat].append(item)
    return grouped


def main() -> None:
    parser = argparse.ArgumentParser(description="List repo agents and skills")
    parser.add_argument("--include-skills", action="store_true")
    parser.add_argument("--include-registry", action="store_true")
    parser.add_argument("--platform", choices=PLATFORMS, help="Filter to one runtime")
    args = parser.parse_args()

    agents = list_runtime_agents(args.platform)
    registry = list_registry(args.platform) if args.include_registry else []

    result: dict = {
        "success": True,
        "repo_root": str(REPO_ROOT),
        "agent_count": len(agents),
        "agents": agents,
        "by_platform": group_by_platform(agents),
    }
    if args.include_registry:
        result["registry_count"] = len(registry)
        result["registry"] = registry
        result["registry_by_platform"] = group_by_platform(registry)
    if args.include_skills:
        skills = parse_cursor_skills()
        if args.platform:
            skills = [s for s in skills if s.get("platform") == args.platform]
        result["skill_count"] = len(skills)
        result["skills"] = skills

    print(json.dumps(result, ensure_ascii=False))


if __name__ == "__main__":
    main()
