#!/usr/bin/env python3
"""
Human-only Context Item status promotion for Context Architecture V2.

Requires AIRTABLE_APPROVER_TOKEN in repo-root .env. Not available to agents.
See docs/context/human-approval-path.md
"""

from __future__ import annotations

import argparse
import json

from context_architecture_common import clean_fields, fail, now_iso, update_record, validate_single_select

HUMAN_STATUSES = {"Needs decision", "Approved", "Rejected", "Deprecated", "Published"}
PUBLISHER_STATUSES = {"Published"}


def main() -> None:
    parser = argparse.ArgumentParser(description="Approve or reject Context Items (Matthew only)")
    parser.add_argument("record_id")
    parser.add_argument("--status", required=True)
    parser.add_argument("--confirmed-by", choices=["Matthew", "TL"])
    parser.add_argument("--confirmation-method", default="approver script")
    parser.add_argument("--approval-notes")
    parser.add_argument("--published-to", action="append", default=[])
    args = parser.parse_args()

    if args.status not in HUMAN_STATUSES:
        fail(f"Unsupported status transition: {args.status}")

    if args.status == "Approved":
        if args.confirmed_by not in {"Matthew", "TL"}:
            fail("Approved requires --confirmed-by Matthew or TL")

    validate_single_select("confirmation_method", args.confirmation_method)

    fields: dict = {
        "Status": args.status,
        "Last Reviewed": now_iso(),
        "Confirmation Method": args.confirmation_method,
        "Approval Notes": args.approval_notes
        or f"Status set to {args.status} via approver script.",
    }
    if args.confirmed_by:
        validate_single_select("confirmed_by_human", args.confirmed_by)
        fields["Confirmed By Human"] = args.confirmed_by
    if args.published_to:
        fields["Published To"] = args.published_to

    updated = update_record(
        "Context Items",
        args.record_id,
        clean_fields("Context Items", fields),
        token_role="approver",
    )
    print(json.dumps({"success": True, "record_id": updated["id"], "fields": updated.get("fields", {})}, ensure_ascii=False))


if __name__ == "__main__":
    main()
