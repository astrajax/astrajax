#!/usr/bin/env python3
"""Append one tamper-evident Change Log entry for Context Architecture V2."""

from __future__ import annotations

import json
import sys

from context_architecture_common import (
    append_audit_mirror,
    clean_fields,
    compute_entry_hash,
    create_record,
    fail,
    latest_change_log_entry,
    now_iso,
    validate_multi_select,
    validate_single_select,
)

REQUIRED_KEYS = ("change_summary", "change_type", "changed_by", "status")
PUBLISH_STATUSES = {"Published", "Deployed"}


def build_fields(payload: dict) -> dict:
    for key in REQUIRED_KEYS:
        value = payload.get(key)
        if value is None or (isinstance(value, str) and not value.strip()):
            fail(f"Missing required field: {key}")

    status = payload["status"]
    validate_single_select("change_status", status)
    validate_single_select("change_types", payload["change_type"])
    validate_single_select("owner", payload["changed_by"])
    if payload.get("destination"):
        validate_multi_select("destination", payload["destination"])
    if payload.get("approved_by"):
        validate_single_select("confirmed_by_human", payload["approved_by"])

    if status in PUBLISH_STATUSES:
        if payload.get("approved_by") != "Matthew":
            fail("Published or Deployed Change Log entries require approved_by = Matthew")

    latest = latest_change_log_entry()
    prev_hash = ""
    if latest:
        prev_hash = latest.get("fields", {}).get("Entry Hash") or ""

    core = {
        "Change Summary": payload["change_summary"],
        "Change Type": payload["change_type"],
        "Changed By": payload["changed_by"],
        "Status": status,
        "Created at": now_iso(),
    }
    optional_map = {
        "related_intake_ids": "Related Intake",
        "related_context_item_ids": "Related Context Item",
        "destination": "Destination",
        "approved_by": "Approved By",
        "published_path": "Published Path",
        "commit_sha": "Commit SHA",
        "notes": "Notes",
    }
    for key, airtable_name in optional_map.items():
        if key in payload and payload[key] not in (None, "", [], {}):
            core[airtable_name] = payload[key]

    entry_hash = compute_entry_hash(core, prev_hash)
    core["Prev Hash"] = prev_hash
    core["Entry Hash"] = entry_hash
    return clean_fields("Change Log", core)


def main() -> None:
    raw = sys.stdin.read()
    if not raw.strip():
        fail("No JSON input on stdin")
    try:
        payload = json.loads(raw)
    except json.JSONDecodeError as exc:
        fail(f"Invalid JSON input: {exc}")

    fields = build_fields(payload)
    token_role = "approver" if payload["status"] in PUBLISH_STATUSES else "write"
    created = create_record("Change Log", fields, token_role=token_role)
    append_audit_mirror(created["id"], created.get("fields", {}))
    print(json.dumps({"success": True, "record_id": created["id"], "fields": created.get("fields", {})}, ensure_ascii=False))


if __name__ == "__main__":
    main()
