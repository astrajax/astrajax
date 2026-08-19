#!/usr/bin/env python3
"""Verify a Skill Forge Hyperagent thread against a Cursor skill brief.

Reads get_thread JSON (or raw thread markdown), extracts BEFORE/AFTER JSON
dumps, diffs AFTER-STATE against the brief.

Exit 0 on pass; 2 on verify fail; 1 on usage/parse errors.
Does not write Airtable and does not call MCP.
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path
from typing import Any

BEFORE_MARKER = "### SKILL-FORGE BEFORE-STATE"
AFTER_MARKER = "### SKILL-FORGE AFTER-STATE"
NONE_CREATING = "none — creating"

REQUIRED_DUMP_KEYS = (
    "name",
    "description",
    "whenToUse",
    "documentation",
    "scripts",
    "tags",
    "authType",
    "credentialSchema",
    "icon",
)

REFUSE_TRIGGERS = frozenset(
    {"slack", "schedule", "live", "webhook", "email", "unattended"}
)

FENCE_RE = re.compile(r"```(?:json)?\s*(\{.*?\})\s*```", re.DOTALL)


def refuse_reason(
    *,
    trigger: str | None = None,
    invented: bool = False,
    agent_identity: bool = False,
    enable_autosave: bool = False,
) -> str | None:
    if invented:
        return "refuse: no Cursor Skill Forge brief (do not invent the skill)"
    if agent_identity:
        return "refuse: agent identity/config is Self-Update, not Skill Forge"
    if enable_autosave:
        return "refuse: auto-save must stay off; Cursor persists draft_save"
    if trigger:
        lowered = trigger.strip().lower()
        if lowered in REFUSE_TRIGGERS:
            return f"refuse: trigger {lowered!r} is Slack/schedule/Live/unattended"
    return None


def _walk_strings(value: Any) -> list[str]:
    found: list[str] = []
    if isinstance(value, str):
        found.append(value)
    elif isinstance(value, dict):
        for item in value.values():
            found.extend(_walk_strings(item))
    elif isinstance(value, list):
        for item in value:
            found.extend(_walk_strings(item))
    return found


def thread_text(raw: Any) -> str:
    if isinstance(raw, str):
        return raw
    return "\n\n".join(_walk_strings(raw))


def _json_after_marker(text: str, marker: str) -> dict[str, Any]:
    index = text.find(marker)
    if index < 0:
        raise ValueError(f"missing marker {marker}")
    window = text[index + len(marker) :]
    next_marker = window.find("### SKILL-FORGE ")
    if next_marker >= 0:
        window = window[:next_marker]
    stripped = window.strip()
    if NONE_CREATING in stripped and "{" not in stripped:
        return {"existing": NONE_CREATING}
    match = FENCE_RE.search(window)
    payload = match.group(1) if match else stripped
    try:
        parsed = json.loads(payload)
    except json.JSONDecodeError as exc:
        raise ValueError(f"{marker} is not valid JSON: {exc}") from exc
    if not isinstance(parsed, dict):
        raise ValueError(f"{marker} must be a JSON object")
    return parsed


def extract_states(text: str) -> tuple[dict[str, Any], dict[str, Any]]:
    return _json_after_marker(text, BEFORE_MARKER), _json_after_marker(text, AFTER_MARKER)


def is_none_creating(state: dict[str, Any]) -> bool:
    existing = str(state.get("existing") or "").strip()
    return existing == NONE_CREATING or existing.lower() == "none -- creating"


def missing_dump_keys(state: dict[str, Any]) -> list[str]:
    if is_none_creating(state):
        return []
    return [key for key in REQUIRED_DUMP_KEYS if key not in state]


def _normalize(value: Any) -> Any:
    if isinstance(value, str):
        return value.replace("\r\n", "\n").strip()
    if isinstance(value, dict):
        return {str(k): _normalize(v) for k, v in value.items()}
    if isinstance(value, list):
        return [_normalize(item) for item in value]
    return value


def diff_expected(after: dict[str, Any], expected: dict[str, Any], prefix: str = "") -> list[str]:
    mismatches: list[str] = []
    for key, want in expected.items():
        path = f"{prefix}{key}"
        if key not in after:
            mismatches.append(f"missing {path}")
            continue
        got = after[key]
        if isinstance(want, dict) and isinstance(got, dict):
            mismatches.extend(diff_expected(got, want, prefix=f"{path}."))
            continue
        if _normalize(got) != _normalize(want):
            mismatches.append(f"mismatch {path}")
    return mismatches


def verify(
    *,
    thread: Any,
    brief: dict[str, Any],
) -> dict[str, Any]:
    reason = refuse_reason(
        trigger=brief.get("trigger"),
        invented=bool(brief.get("invented")),
        agent_identity=bool(brief.get("agent_identity")),
        enable_autosave=bool(brief.get("enable_autosave")),
    )
    if reason:
        return {"pass": False, "errors": [reason]}

    text = thread_text(thread)
    before, after = extract_states(text)
    errors: list[str] = []
    errors.extend(f"after.{key} missing" for key in missing_dump_keys(after))

    skill_name = str(brief.get("skill_name") or brief.get("name") or "").strip()
    if skill_name and str(after.get("name") or "").strip() != skill_name:
        errors.append(
            f"after.name {after.get('name')!r} is not target skill {skill_name!r}"
        )

    expected = brief.get("expected")
    if not isinstance(expected, dict) or not expected:
        errors.append("brief.expected must be a non-empty object")
    else:
        errors.extend(diff_expected(after, expected))

    return {
        "pass": not errors,
        "errors": errors,
        "before": before,
        "after": after,
        "creating": is_none_creating(before),
    }


def load_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--thread", type=Path, required=True, help="get_thread JSON or .md dump")
    parser.add_argument("--brief", type=Path, required=True, help="Cursor brief JSON")
    parser.add_argument("--write-after", type=Path)
    parser.add_argument("--write-before", type=Path)
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    if not args.thread.is_file():
        print(json.dumps({"success": False, "error": f"thread not found: {args.thread}"}))
        sys.exit(1)
    if not args.brief.is_file():
        print(json.dumps({"success": False, "error": f"brief not found: {args.brief}"}))
        sys.exit(1)

    thread_raw = args.thread.read_text(encoding="utf-8")
    try:
        thread = json.loads(thread_raw)
    except json.JSONDecodeError:
        thread = thread_raw

    brief = load_json(args.brief)
    if not isinstance(brief, dict):
        print(json.dumps({"success": False, "error": "brief must be a JSON object"}))
        sys.exit(1)

    try:
        result = verify(thread=thread, brief=brief)
    except ValueError as exc:
        print(json.dumps({"success": False, "error": str(exc)}))
        sys.exit(1)

    if args.write_before and "before" in result:
        args.write_before.write_text(
            json.dumps(result["before"], indent=2, ensure_ascii=False) + "\n",
            encoding="utf-8",
        )
    if args.write_after and "after" in result:
        args.write_after.write_text(
            json.dumps(result["after"], indent=2, ensure_ascii=False) + "\n",
            encoding="utf-8",
        )

    printable = {
        "success": True,
        "pass": result["pass"],
        "errors": result["errors"],
        "creating": result.get("creating", False),
    }
    print(json.dumps(printable, indent=2))
    sys.exit(0 if result["pass"] else 2)


if __name__ == "__main__":
    main()
