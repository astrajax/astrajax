#!/usr/bin/env python3
"""Quarantine Context Items created in error (Context Architecture V2 L3)."""

from __future__ import annotations

import argparse
import json

from context_architecture_common import bootstrap_item_ids, fail, now_iso, list_records, update_record


def quarantine_record(record_id: str, note: str) -> dict:
    return update_record(
        "Context Items",
        record_id,
        {
            "Status": "Draft",
            "Created By": "Agent",
            "Confirmed By Human": None,
            "Confirmation Method": None,
            "Approval Notes": note,
            "Last Reviewed": now_iso(),
        },
        token_role="write",
    )


def main() -> None:
    parser = argparse.ArgumentParser(description="Quarantine Context Items back to Draft")
    parser.add_argument("--record-id", action="append", default=[])
    parser.add_argument("--bootstrap-v1", action="store_true", help="Quarantine the eight V1 bootstrap items")
    parser.add_argument("--all-proposed", action="store_true", help="Quarantine all Proposed items")
    parser.add_argument(
        "--note",
        default="Quarantined by quarantine_context_items.py. Requires Matthew review.",
    )
    args = parser.parse_args()

    target_ids: list[str] = list(args.record_id)
    if args.bootstrap_v1:
        target_ids.extend(bootstrap_item_ids())
    if args.all_proposed:
        records = list_records("Context Items", formula="{Status}='Proposed'", max_records=100)
        target_ids.extend(record["id"] for record in records)

    target_ids = sorted(set(target_ids))
    if not target_ids:
        fail("No record IDs to quarantine")

    updated = []
    for record_id in target_ids:
        record = quarantine_record(record_id, args.note)
        updated.append({"id": record["id"], "title": record.get("fields", {}).get("Title"), "status": "Draft"})

    print(json.dumps({"success": True, "quarantined_count": len(updated), "records": updated}, ensure_ascii=False))


if __name__ == "__main__":
    main()
