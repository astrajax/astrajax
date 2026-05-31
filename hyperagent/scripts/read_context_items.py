#!/usr/bin/env python3
"""Read Context Items for Clive Curator V2."""

from __future__ import annotations

import argparse
import json

from context_architecture_common import and_formula, eq_clause, list_records

SELECT_FIELDS = [
    "Title",
    "Canonical Text",
    "Category",
    "Applies To",
    "Context Pack",
    "Source Intake",
    "Owner",
    "Status",
    "Version",
    "Authority",
    "Freshness",
    "Published To",
    "Source Notes",
    "Conflicts",
    "Risk if included",
    "Risk if omitted",
    "Approval Notes",
    "Last Reviewed",
    "Created By",
    "Proposed By Agent",
    "Confirmed By Human",
    "Confirmation Method",
    "Bootstrap Source",
    "Created at",
]


def main() -> None:
    parser = argparse.ArgumentParser(description="Read Clive Context Items")
    parser.add_argument("--status", default="Proposed")
    parser.add_argument("--owner")
    parser.add_argument("--category")
    parser.add_argument("--max-records", type=int, default=20)
    parser.add_argument("--all", action="store_true", help="Do not filter by status")
    args = parser.parse_args()

    clauses: list[str] = []
    if not args.all and args.status:
        clauses.append(eq_clause("Status", args.status))
    if args.owner:
        clauses.append(eq_clause("Owner", args.owner))
    if args.category:
        clauses.append(eq_clause("Category", args.category))

    records = list_records(
        "Context Items",
        fields=SELECT_FIELDS,
        formula=and_formula(clauses),
        max_records=args.max_records,
        sort_field="Created at",
    )
    print(json.dumps({"success": True, "record_count": len(records), "records": records}, ensure_ascii=False))


if __name__ == "__main__":
    main()
