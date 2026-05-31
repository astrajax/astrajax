#!/usr/bin/env python3
"""
Create one Proposed Context Item for Clive Curator V2.

Agents may only create Status = Proposed. No human confirmation flag in payload.
Human approval uses Airtable edit, Interface button, or approve_context_item.py
with AIRTABLE_APPROVER_TOKEN (Matthew only).
"""

from __future__ import annotations

import json
import sys

from context_architecture_common import (
    clean_fields,
    create_record,
    fail,
    find_record_by_title,
    now_iso,
    validate_multi_select,
    validate_single_select,
)

ALLOWED_STATUS = "Proposed"

REQUIRED_KEYS = (
    "title",
    "canonical_text",
    "category",
    "owner",
    "authority",
    "freshness",
    "proposed_by_agent",
)

FIELD_MAP = {
    "title": "Title",
    "canonical_text": "Canonical Text",
    "category": "Category",
    "applies_to": "Applies To",
    "context_pack_ids": "Context Pack",
    "source_intake_ids": "Source Intake",
    "owner": "Owner",
    "version": "Version",
    "authority": "Authority",
    "freshness": "Freshness",
    "published_to": "Published To",
    "source_notes": "Source Notes",
    "bootstrap_source": "Bootstrap Source",
    "conflicts": "Conflicts",
    "risk_if_included": "Risk if included",
    "risk_if_omitted": "Risk if omitted",
    "approval_notes": "Approval Notes",
}


def validate_traceability(payload: dict) -> None:
    source_intake_ids = payload.get("source_intake_ids") or []
    bootstrap = payload.get("bootstrap") is True
    source_doc = (payload.get("source_doc") or "").strip()
    bootstrap_source = (payload.get("bootstrap_source") or "").strip()

    if source_intake_ids:
        return
    if bootstrap and (source_doc or bootstrap_source):
        if source_doc and not bootstrap_source:
            payload["bootstrap_source"] = source_doc
        return
    fail("Requires source_intake_ids or bootstrap=true with source_doc/bootstrap_source")


def build_fields(payload: dict) -> dict:
    for key in REQUIRED_KEYS:
        value = payload.get(key)
        if value is None or (isinstance(value, str) and not value.strip()):
            fail(f"Missing required field: {key}")

    status = payload.get("status", ALLOWED_STATUS)
    if status != ALLOWED_STATUS:
        fail("Curator may create Context Items only with Status = Proposed")

    validate_traceability(payload)
    validate_single_select("item_categories", payload["category"])
    validate_single_select("owner", payload["owner"])
    validate_single_select("authority", payload["authority"])
    validate_single_select("freshness", payload["freshness"])
    if payload.get("applies_to"):
        validate_multi_select("applies_to", payload["applies_to"])

    fields: dict = {
        "Status": ALLOWED_STATUS,
        "Created By": "Agent",
        "Proposed By Agent": payload["proposed_by_agent"],
        "Created at": now_iso(),
    }
    for key, airtable_name in FIELD_MAP.items():
        if key in payload and payload[key] not in (None, "", [], {}):
            fields[airtable_name] = payload[key]
    if payload.get("source_notes"):
        fields["Source Notes"] = payload["source_notes"]
    return clean_fields("Context Items", fields)


def main() -> None:
    raw = sys.stdin.read()
    if not raw.strip():
        fail("No JSON input on stdin")
    try:
        payload = json.loads(raw)
    except json.JSONDecodeError as exc:
        fail(f"Invalid JSON input: {exc}")

    existing = find_record_by_title("Context Items", payload.get("title", ""))
    if existing:
        print(
            json.dumps(
                {
                    "success": True,
                    "duplicate": True,
                    "record_id": existing["id"],
                    "fields": existing.get("fields", {}),
                    "status": existing.get("fields", {}).get("Status"),
                },
                ensure_ascii=False,
            )
        )
        return

    fields = build_fields(payload)
    created = create_record("Context Items", fields, token_role="write")
    print(
        json.dumps(
            {
                "success": True,
                "duplicate": False,
                "record_id": created["id"],
                "fields": created.get("fields", {}),
                "status": created.get("fields", {}).get("Status"),
            },
            ensure_ascii=False,
        )
    )


if __name__ == "__main__":
    main()
