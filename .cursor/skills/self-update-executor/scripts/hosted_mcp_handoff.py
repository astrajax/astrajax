#!/usr/bin/env python3
"""Build hosted-MCP Self-Update briefs. Does not add a custom MCP server.

Hosted MCP: https://hyperagent.com/api/mcp
Tools: list_agents, create_thread, send_message, get_thread, list_threads,
       create_attachment_upload

Cursor uses those tools. This script only prints the self-contained message
and the ordered tool sequence.
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
SKILL_NAME = "Self-Update Executor"

APPLY_INSTRUCTIONS = """You are running Self-Update Executor on YOURSELF only.

This is a Cursor Self-Update thread. Do not invent a change. Do not update any
other agent. Do not run if this thread is Slack, schedule, Live, webhook, email,
or unattended. All auto-save flags stay OFF. Cursor will persist the agent draft
with draft_save. Do not wait for Matthew to click Learning.

Do not read uncommitted files from GitHub or the attached repo. If Cursor
attached a file, that attachment is the source. If no attachment, use only
the brief text and a native own-config read.

1. Dump ### SELF-UPDATE BEFORE-STATE as a fenced JSON object (every field).
2. Apply the expected end-state below to yourself. Leave a draft if the platform
   will not auto-save.
3. Dump ### SELF-UPDATE AFTER-STATE as the same JSON shape (every field).
4. Stop. Do not write Airtable. Do not edit the repo.
"""

RESTORE_INSTRUCTIONS = """You are running Self-Update Executor RESTORE on YOURSELF only.

Cursor verify failed. Re-apply the BEFORE-STATE JSON below to yourself.
All auto-save flags stay OFF. Cursor will persist or deny drafts.

1. Dump ### SELF-UPDATE BEFORE-STATE (current config, full JSON).
2. Restore the JSON in RESTORE-TO.
3. Dump ### SELF-UPDATE AFTER-STATE of the restored config (full JSON).
4. Stop. Do not write Airtable.
"""

BOOTSTRAP_INSTRUCTIONS = """You are attaching a shared method skill. You stay yourself.

1. Attach workspace skill "Self-Update Executor" if it is not already attached.
2. Leave ALL auto-save flags OFF. Cursor persists drafts with draft_save.
3. Dump ### SELF-UPDATE BEFORE-STATE then ### SELF-UPDATE AFTER-STATE as full JSON
   so Cursor can confirm attachment without a Matthew click.
4. Stop. Do not invent any other config change.
"""


def load_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


def build_message(*, mode: str, target_name: str, payload: dict[str, Any] | None) -> str:
    if mode == "bootstrap":
        return (
            f"Target agent: {target_name}\nSkill: {SKILL_NAME}\n\n"
            f"{BOOTSTRAP_INSTRUCTIONS}"
        )
    if payload is None:
        raise ValueError(f"{mode} requires a JSON payload")
    if mode == "restore":
        restore_to = payload.get("restore_to") or payload.get("before") or payload
        return (
            f"Target agent: {target_name}\nSkill: {SKILL_NAME}\n\n"
            f"{RESTORE_INSTRUCTIONS}\n\nRESTORE-TO:\n"
            f"```json\n{json.dumps(restore_to, indent=2, ensure_ascii=False)}\n```\n"
        )
    expected = payload.get("expected") or payload
    extra = payload.get("instructions") or ""
    return (
        f"Target agent: {target_name}\nSkill: {SKILL_NAME}\n\n"
        f"{APPLY_INSTRUCTIONS}\n"
        f"{extra}\n\nEXPECTED END-STATE:\n"
        f"```json\n{json.dumps(expected, indent=2, ensure_ascii=False)}\n```\n"
    )


def tool_sequence(target_name: str) -> list[dict[str, str]]:
    return [
        {
            "tool": "list_agents",
            "purpose": f"Resolve Hyperagent agent id for {target_name!r}",
        },
        {
            "tool": "create_thread",
            "purpose": "Start a thread on that target agent (not a different agent)",
        },
        {
            "tool": "send_message",
            "purpose": "Send the self-contained Self-Update brief from this script",
        },
        {
            "tool": "get_thread",
            "purpose": "Read BEFORE-STATE and AFTER-STATE for Cursor verify",
        },
        {
            "tool": "list_pending_approvals",
            "purpose": "Find the agent draft_save row after apply",
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
        choices=("apply", "restore", "bootstrap"),
        required=True,
    )
    parser.add_argument("--target-name", required=True, help="Live Hyperagent agent display name")
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
        if args.mode == "apply" and not (payload.get("expected") or payload):
            print(json.dumps({"success": False, "error": "apply brief missing expected end-state"}))
            sys.exit(1)

    try:
        message = build_message(mode=args.mode, target_name=args.target_name, payload=payload)
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
                "target_name": args.target_name,
                "skill": SKILL_NAME,
                "tools": tool_sequence(args.target_name),
                "message": message,
            },
            indent=2,
            ensure_ascii=False,
        )
    )


if __name__ == "__main__":
    main()
