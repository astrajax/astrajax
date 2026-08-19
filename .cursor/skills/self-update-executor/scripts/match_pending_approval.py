#!/usr/bin/env python3
"""Match hosted-MCP pending approvals for the live-apply persist step.

Cursor calls user-hyperagent list_pending_approvals, then this script picks the
draft_save row to approve (or deny on restore). It does not call MCP itself.

Usage:
  python3 match_pending_approval.py --pending /tmp/pending.json \\
    --target-name "Doc Albright" --entity agent --decision approve
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path
from typing import Any

HOSTED_MCP = "https://hyperagent.com/api/mcp"
CURSOR_SERVER_ID = "user-hyperagent"
RESOLVE_KIND = "draft_save"


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


def iter_rows(payload: Any) -> list[dict[str, Any]]:
    if isinstance(payload, list):
        return [row for row in payload if isinstance(row, dict)]
    if not isinstance(payload, dict):
        return []
    for key in ("rows", "approvals", "pending", "items", "data"):
        value = payload.get(key)
        if isinstance(value, list):
            return [row for row in value if isinstance(row, dict)]
    return []


def _row_kind(row: dict[str, Any]) -> str:
    return str(row.get("kind") or row.get("type") or "").strip()


def _approval_id(row: dict[str, Any]) -> str:
    return str(row.get("approvalId") or row.get("approval_id") or row.get("id") or "").strip()


def _can_resolve(row: dict[str, Any]) -> bool:
    if "canResolve" in row:
        return bool(row.get("canResolve"))
    if "can_resolve" in row:
        return bool(row.get("can_resolve"))
    return True


def _entity(row: dict[str, Any]) -> str:
    raw = row.get("entity") or row.get("draftEntity") or row.get("draft_entity") or ""
    return str(raw).strip().lower()


def _matches_target(row: dict[str, Any], target_name: str, entity: str | None) -> bool:
    needle = target_name.strip().lower()
    if not needle:
        return False
    if entity:
        row_entity = _entity(row)
        agent_aliases = {"agent", "agents", "agent_update", "agent-update"}
        skill_aliases = {"skill", "skills", "skill_update", "skill-update"}
        if row_entity and row_entity not in {entity.lower(), "agent/skill", "draft"}:
            if entity.lower() == "agent" and row_entity not in agent_aliases:
                return False
            if entity.lower() == "skill" and row_entity not in skill_aliases:
                return False
    haystack = " ".join(_walk_strings(row)).lower()
    return needle in haystack


def match_draft_save(
    pending: Any,
    *,
    target_name: str,
    entity: str | None = None,
    decision: str = "approve",
) -> dict[str, Any]:
    """Return the first matching draft_save row and the resolve_approval args."""
    if decision not in {"approve", "deny"}:
        raise ValueError("decision must be approve or deny")

    matches: list[dict[str, Any]] = []
    skipped: list[dict[str, Any]] = []
    for row in iter_rows(pending):
        if _row_kind(row) != RESOLVE_KIND:
            continue
        if not _matches_target(row, target_name, entity):
            continue
        approval_id = _approval_id(row)
        record = {
            "kind": RESOLVE_KIND,
            "approvalId": approval_id,
            "canResolve": _can_resolve(row),
            "entity": _entity(row) or (entity or ""),
            "row": row,
        }
        if not approval_id or not _can_resolve(row):
            skipped.append(record)
            continue
        matches.append(record)

    chosen = matches[0] if matches else None
    return {
        "success": True,
        "hosted_mcp": HOSTED_MCP,
        "cursor_server_id": CURSOR_SERVER_ID,
        "custom_mcp": False,
        "decision": decision,
        "matched": chosen is not None,
        "match_count": len(matches),
        "skipped_unresolvable": skipped,
        "resolve": (
            {
                "kind": RESOLVE_KIND,
                "approvalId": chosen["approvalId"],
                "decision": decision,
            }
            if chosen
            else None
        ),
        "break_glass": (
            None
            if chosen or not skipped
            else "pending draft_save exists but canResolve is false — handle in the Hyperagent thread"
        ),
    }


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--pending", type=Path, required=True, help="list_pending_approvals JSON")
    parser.add_argument("--target-name", required=True, help="Agent or skill display name")
    parser.add_argument(
        "--entity",
        choices=("agent", "skill"),
        help="Optional draft entity hint",
    )
    parser.add_argument(
        "--decision",
        choices=("approve", "deny"),
        default="approve",
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    if not args.pending.is_file():
        print(json.dumps({"success": False, "error": f"pending not found: {args.pending}"}))
        sys.exit(1)
    pending = json.loads(args.pending.read_text(encoding="utf-8"))
    try:
        result = match_draft_save(
            pending,
            target_name=args.target_name,
            entity=args.entity,
            decision=args.decision,
        )
    except ValueError as exc:
        print(json.dumps({"success": False, "error": str(exc)}))
        sys.exit(1)
    print(json.dumps(result, indent=2, ensure_ascii=False))
    if result.get("break_glass"):
        sys.exit(3)
    sys.exit(0 if result["matched"] or result["decision"] == "deny" else 2)


if __name__ == "__main__":
    main()
