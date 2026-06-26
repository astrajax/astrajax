#!/usr/bin/env python3
"""Validate a Hyperagent export JSON against schema v1 and governed Clive defaults.

Usage:
  python3 hyperagent/scripts/validate_hyperagent_export.py path/to/export.json

Exit 0 on success; non-zero with a clear message on failure.
"""

from __future__ import annotations

import json
import sys
from pathlib import Path
from typing import Any

# Repo-relative import of catalogue constants
_REPO_ROOT = Path(__file__).resolve().parents[2]
_BUILDS = _REPO_ROOT / "hyperagent" / "builds"
if str(_BUILDS) not in sys.path:
    sys.path.insert(0, str(_BUILDS))

from _hyperagent_export import (  # noqa: E402
    EMBEDDED_SKILL_REQUIRED_FIELDS,
    GOVERNED_AUTO_SAVE_KEYS,
    GOVERNED_SKILL_LOAD_MODE,
    GOVERNED_SKILL_SCOPE,
    SKILL_EXPORT_DATA_FIELDS,
)


def _fail(message: str) -> None:
    print(f"validate_hyperagent_export: FAIL — {message}", file=sys.stderr)
    sys.exit(1)


def _require_json_string_field(data: dict[str, Any], field: str) -> None:
    value = data.get(field)
    if not isinstance(value, str):
        _fail(f"data.{field} must be a JSON-encoded string, got {type(value).__name__}")
    try:
        json.loads(value)
    except json.JSONDecodeError as exc:
        _fail(f"data.{field} is not valid JSON: {exc}")


def _validate_embedded_skill(skill: Any, index: int) -> None:
    if not isinstance(skill, dict):
        _fail(f"data.skills[{index}] must be an object")
    for field in EMBEDDED_SKILL_REQUIRED_FIELDS:
        if field not in skill:
            _fail(f"data.skills[{index}] missing required field '{field}'")


def _validate_skill_data(data: dict[str, Any]) -> None:
    for field in SKILL_EXPORT_DATA_FIELDS:
        if field not in data:
            _fail(f"data missing required skill field '{field}'")


def _validate_agent_data(data: dict[str, Any]) -> None:
    for key in GOVERNED_AUTO_SAVE_KEYS:
        if data.get(key) is not False:
            _fail(f"data.{key} must be false for governed agents (got {data.get(key)!r})")

    _require_json_string_field(data, "toolSettings")
    _require_json_string_field(data, "allowedIntegrations")

    if data.get("skillScope") != GOVERNED_SKILL_SCOPE:
        _fail(
            f"data.skillScope must be '{GOVERNED_SKILL_SCOPE}' "
            f"(got {data.get('skillScope')!r})"
        )
    if data.get("skillLoadMode") != GOVERNED_SKILL_LOAD_MODE:
        _fail(
            f"data.skillLoadMode must be '{GOVERNED_SKILL_LOAD_MODE}' "
            f"(got {data.get('skillLoadMode')!r})"
        )

    skills = data.get("skills")
    if skills is None:
        _fail("data.skills is required on agent exports")
    if not isinstance(skills, list):
        _fail("data.skills must be an array")
    for i, skill in enumerate(skills):
        _validate_embedded_skill(skill, i)


def validate_export(export: dict[str, Any]) -> None:
    version = export.get("version")
    if version != 1:
        _fail(f"version must be 1 (got {version!r})")

    export_type = export.get("type")
    if export_type not in ("agent", "skill"):
        _fail(f"type must be 'agent' or 'skill' (got {export_type!r})")

    data = export.get("data")
    if not isinstance(data, dict):
        _fail("data must be an object")

    if export_type == "agent":
        _validate_agent_data(data)
    else:
        _validate_skill_data(data)


def main() -> None:
    if len(sys.argv) != 2:
        print(
            "Usage: python3 hyperagent/scripts/validate_hyperagent_export.py <export.json>",
            file=sys.stderr,
        )
        sys.exit(2)

    path = Path(sys.argv[1])
    if not path.is_file():
        _fail(f"file not found: {path}")

    try:
        export = json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as exc:
        _fail(f"invalid JSON in {path}: {exc}")

    if not isinstance(export, dict):
        _fail("root must be a JSON object")

    validate_export(export)
    print(f"validate_hyperagent_export: OK {path}")


if __name__ == "__main__":
    main()
