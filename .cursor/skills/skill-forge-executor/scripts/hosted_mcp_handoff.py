#!/usr/bin/env python3
"""Build hosted-MCP Skill Forge briefs. Does not add a custom MCP server.

Hosted MCP: https://hyperagent.com/api/mcp
Target: Skill Forge only (not the household agent whose skill is changing).
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path
from typing import Any

HOSTED_MCP = "https://hyperagent.com/api/mcp"
CURSOR_SERVER_NAME = "hyperagent"
CURSOR_SERVER_ID = "user-hyperagent"
CURSOR_MCP_CONFIG = "~/.cursor/mcp.json"
SKILL_NAME = "Skill Forge Executor"
DEFAULT_TARGET_NAME = "🛠️ Skill Forge (AstraJax)"
DEFAULT_TARGET_ID = "cmr6im5in1iw106ad59qx2cgr"

APPLY_INSTRUCTIONS = """You are running Skill Forge Executor on a Cursor Skill Forge thread.

This is a skill create/update job. Do not invent a change. Do not change any
agent's system prompt or identity (that is Self-Update). Do not run if this
thread is Slack, schedule, Live, webhook, email, or unattended. All auto-save
flags stay OFF. Cursor will persist the skill draft with draft_save.

Do not read uncommitted files from GitHub or the attached repo. If Cursor
attached a file, that attachment is the source. If no attachment, use only
the brief text and a native live-skill read.

1. Dump ### SKILL-FORGE BEFORE-STATE as a fenced JSON object (every field),
   or {"existing":"none — creating","name":"<skill>"} if the skill does not exist.
2. Apply the expected skill end-state below (create or update). Leave a draft
   if the platform will not auto-save. Do not wait for Matthew.
3. Dump ### SKILL-FORGE AFTER-STATE as full skill JSON (every field).
4. Stop. Do not write Airtable. Do not edit the repo.
"""

RESTORE_INSTRUCTIONS = """You are running Skill Forge Executor RESTORE.

Cursor verify failed. Re-apply the BEFORE-STATE JSON below to the SAME skill.
If before was none — creating, do not leave the new skill live.

All auto-save flags stay OFF. Cursor will persist or deny drafts.

1. Dump ### SKILL-FORGE BEFORE-STATE (current skill, full JSON).
2. Restore the JSON in RESTORE-TO.
3. Dump ### SKILL-FORGE AFTER-STATE of the restored skill (full JSON).
4. Stop. Do not write Airtable.
"""

TEACH_INSTRUCTIONS = """You are Skill Forge. Cursor is teaching you the live skill-apply contract.

From now on, when Cursor starts a thread with a Skill Forge apply brief:

1. Dump full current skill state (or none — creating).
2. Apply the brief. Do not wait for an in-thread Matthew click — Cursor already
   approved in Cursor. Leave a draft if you cannot auto-save.
3. Dump full after-state.
4. Stop. Cursor persists draft_save, verifies, and writes Airtable.

Keep propose-then-wait ONLY for Matthew chatting you in the Hyperagent UI
without a Cursor brief. Do not turn auto-save on.
"""


def load_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


def build_message(*, mode: str, payload: dict[str, Any] | None) -> str:
    header = (
        f"Target agent: {DEFAULT_TARGET_NAME}\n"
        f"Target agent id: {DEFAULT_TARGET_ID}\n"
        f"Skill: {SKILL_NAME}\n\n"
    )
    if mode == "teach":
        return header + TEACH_INSTRUCTIONS
    if payload is None:
        raise ValueError(f"{mode} requires a JSON payload")
    if mode == "restore":
        restore_to = payload.get("restore_to") or payload.get("before") or payload
        return (
            f"{header}{RESTORE_INSTRUCTIONS}\n\nRESTORE-TO:\n"
            f"```json\n{json.dumps(restore_to, indent=2, ensure_ascii=False)}\n```\n"
        )
    expected = payload.get("expected") or payload
    extra = payload.get("instructions") or ""
    return (
        f"{header}{APPLY_INSTRUCTIONS}\n"
        f"{extra}\n\nEXPECTED SKILL END-STATE:\n"
        f"```json\n{json.dumps(expected, indent=2, ensure_ascii=False)}\n```\n"
    )


def tool_sequence() -> list[dict[str, str]]:
    return [
        {
            "tool": "list_agents",
            "purpose": f"Confirm Skill Forge id {DEFAULT_TARGET_ID}",
        },
        {
            "tool": "create_thread",
            "purpose": "Start a thread on Skill Forge only",
        },
        {
            "tool": "send_message",
            "purpose": "Send the self-contained Skill Forge brief from this script",
        },
        {
            "tool": "get_thread",
            "purpose": "Read BEFORE-STATE and AFTER-STATE",
        },
        {
            "tool": "list_pending_approvals",
            "purpose": "Find the skill draft_save row after apply",
        },
        {
            "tool": "resolve_approval",
            "purpose": "Approve draft_save (or deny on restore). Matthew does not click Learning",
        },
    ]


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--mode",
        choices=("apply", "restore", "teach"),
        required=True,
    )
    parser.add_argument(
        "--brief",
        type=Path,
        help="Apply brief JSON (must include expected) or restore JSON (before-state)",
    )
    parser.add_argument(
        "--write-message",
        type=Path,
        help="Optional path to write the message body",
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    payload: dict[str, Any] | None = None
    if args.mode in {"apply", "restore"}:
        if not args.brief or not args.brief.is_file():
            print(json.dumps({"success": False, "error": "--brief is required for apply/restore"}))
            sys.exit(1)
        loaded = load_json(args.brief)
        if not isinstance(loaded, dict):
            print(json.dumps({"success": False, "error": "brief must be a JSON object"}))
            sys.exit(1)
        payload = loaded

    try:
        message = build_message(mode=args.mode, payload=payload)
    except ValueError as exc:
        print(json.dumps({"success": False, "error": str(exc)}))
        sys.exit(1)

    if args.write_message:
        args.write_message.write_text(message, encoding="utf-8")

    print(
        json.dumps(
            {
                "success": True,
                "hosted_mcp": HOSTED_MCP,
                "cursor_server_name": CURSOR_SERVER_NAME,
                "cursor_server_id": CURSOR_SERVER_ID,
                "cursor_mcp_config": CURSOR_MCP_CONFIG,
                "custom_mcp": False,
                "mode": args.mode,
                "target_name": DEFAULT_TARGET_NAME,
                "target_id": DEFAULT_TARGET_ID,
                "skill": SKILL_NAME,
                "tools": tool_sequence(),
                "message": message,
            },
            indent=2,
            ensure_ascii=False,
        )
    )


if __name__ == "__main__":
    main()
