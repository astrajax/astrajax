#!/usr/bin/env python3
"""Verify a Self-Update Executor Hyperagent thread against a Cursor brief.

Reads get_thread JSON (or raw thread markdown), extracts BEFORE/AFTER JSON
dumps, diffs AFTER-STATE against the brief, and checks the auto-save contract.

Exit 0 on pass; 2 on verify fail; 1 on usage/parse errors.
Does not write Airtable.
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path
from typing import Any

BEFORE_MARKER = "### SELF-UPDATE BEFORE-STATE"
AFTER_MARKER = "### SELF-UPDATE AFTER-STATE"

REQUIRED_DUMP_KEYS = (
    "name",
    "description",
    "systemPrompt",
    "toolSettings",
    "allowedIntegrations",
    "skillScope",
    "skillLoadMode",
    "modelId",
    "effort",
    "maxThinkingTokens",
    "autoSaveMemories",
    "autoSaveSkills",
    "autoSaveAgents",
    "autoSavePrompts",
    "enableMemorySuggestions",
    "enableSkillSuggestions",
    "enablePromptSuggestions",
    "skills",
)

REFUSE_TRIGGERS = frozenset(
    {"slack", "schedule", "live", "webhook", "email", "unattended"}
)

FENCE_RE = re.compile(r"```(?:json)?\s*(\{.*?\})\s*```", re.DOTALL)


def refuse_reason(
    *,
    trigger: str | None = None,
    invented: bool = False,
    other_agent: bool = False,
    enable_memory_skill_prompt_autosave: bool = False,
) -> str | None:
    """Cursor-side refuse gate matching the Hyperagent skill contract."""
    if invented:
        return "refuse: no Cursor Self-Update brief (do not invent the change)"
    if other_agent:
        return "refuse: brief asks to update a different agent"
    if enable_memory_skill_prompt_autosave:
        return "refuse: memory/skill/prompt auto-save must stay off"
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
    next_marker = window.find("### SELF-UPDATE ")
    if next_marker >= 0:
        window = window[:next_marker]
    match = FENCE_RE.search(window)
    payload = match.group(1) if match else window.strip()
    try:
        parsed = json.loads(payload)
    except json.JSONDecodeError as exc:
        raise ValueError(f"{marker} is not valid JSON: {exc}") from exc
    if not isinstance(parsed, dict):
        raise ValueError(f"{marker} must be a JSON object")
    return parsed


def extract_states(text: str) -> tuple[dict[str, Any], dict[str, Any]]:
    return _json_after_marker(text, BEFORE_MARKER), _json_after_marker(text, AFTER_MARKER)


def missing_dump_keys(state: dict[str, Any]) -> list[str]:
    return [key for key in REQUIRED_DUMP_KEYS if key not in state]


def autosave_violations(state: dict[str, Any]) -> list[str]:
    """Governed default: all four auto-save flags stay off. Persist is draft_save."""
    violations: list[str] = []
    for key in (
        "autoSaveMemories",
        "autoSaveSkills",
        "autoSaveAgents",
        "autoSavePrompts",
    ):
        if key in state and state.get(key) is not False:
            violations.append(f"{key} must be false (got {state.get(key)!r})")
    return violations


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
        other_agent=bool(brief.get("other_agent")),
        enable_memory_skill_prompt_autosave=bool(
            brief.get("enable_memory_skill_prompt_autosave")
        ),
    )
    if reason:
        return {"pass": False, "errors": [reason]}

    text = thread_text(thread)
    before, after = extract_states(text)
    errors: list[str] = []
    errors.extend(f"after.{key} missing" for key in missing_dump_keys(after))
    errors.extend(autosave_violations(after))

    target_name = str(brief.get("target_agent_name") or brief.get("agent_name") or "").strip()
    if target_name and str(after.get("name") or "").strip() != target_name:
        errors.append(
            f"after.name {after.get('name')!r} is not target {target_name!r} "
            "(refuse other-agent update)"
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
    }


def load_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--thread", type=Path, required=True, help="get_thread JSON or .md dump")
    parser.add_argument("--brief", type=Path, required=True, help="Cursor brief JSON")
    parser.add_argument(
        "--write-after",
        type=Path,
        help="Optional path to write the parsed AFTER-STATE JSON",
    )
    parser.add_argument(
        "--write-before",
        type=Path,
        help="Optional path to write the parsed BEFORE-STATE JSON",
    )
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
    }
    print(json.dumps(printable, indent=2))
    sys.exit(0 if result["pass"] else 2)


if __name__ == "__main__":
    main()
