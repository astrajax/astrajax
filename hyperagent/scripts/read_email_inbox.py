#!/usr/bin/env python3
"""Read Emails records from the AstraJax Airtable base."""

from __future__ import annotations

import argparse
import json
import sys
from typing import Any

from context_architecture_common import and_formula, eq_clause, table_id

SELECT_FIELDS = [
    "Subject",
    "From",
    "From Email",
    "To",
    "Cc",
    "Received At",
    "Gmail Message ID",
    "Gmail Link",
    "Thread ID",
    "Body",
    "Body Excerpt",
    "Ingest Source",
    "Email Category",
    "AI Summary",
    "AI Structured JSON",
    "Scanner Status",
    "Has Attachments",
    "Attachment Names",
    "Notes",
]


def list_records_paginated(
    *,
    fields: list[str],
    formula: str | None,
    max_records: int,
    sort_field: str | None,
) -> list[dict[str, Any]]:
    from context_architecture_common import BASE_ID, request_json

    query: dict[str, Any] = {"pageSize": min(max_records, 100)}
    if fields:
        query["fields[]"] = fields
    if formula:
        query["filterByFormula"] = formula
    if sort_field:
        query["sort[0][field]"] = sort_field
        query["sort[0][direction]"] = "desc"

    records: list[dict[str, Any]] = []
    offset: str | None = None
    while len(records) < max_records:
        page_query = dict(query)
        if offset:
            page_query["offset"] = offset
        result = request_json("GET", table_id("Emails"), query=page_query, token_role="read")
        for record in result.get("records", []):
            records.append(
                {
                    "id": record["id"],
                    "createdTime": record.get("createdTime"),
                    "fields": record.get("fields", {}),
                    "url": f"https://airtable.com/{BASE_ID}/{table_id('Emails')}/{record['id']}",
                }
            )
            if len(records) >= max_records:
                break
        offset = result.get("offset")
        if not offset:
            break
    return records


def main() -> None:
    parser = argparse.ArgumentParser(description="Read Clive Emails records")
    parser.add_argument("--category", default="Hyperagent Release")
    parser.add_argument("--scanner-status", default="New")
    parser.add_argument("--all-categories", action="store_true")
    parser.add_argument("--all-statuses", action="store_true")
    parser.add_argument("--max-records", type=int, default=50)
    args = parser.parse_args()

    clauses: list[str] = []
    if not args.all_categories and args.category:
        clauses.append(eq_clause("Email Category", args.category))
    if not args.all_statuses and args.scanner_status:
        clauses.append(eq_clause("Scanner Status", args.scanner_status))

    records = list_records_paginated(
        fields=SELECT_FIELDS,
        formula=and_formula(clauses),
        max_records=args.max_records,
        sort_field="Received At",
    )
    print(json.dumps({"success": True, "record_count": len(records), "records": records}, ensure_ascii=False))


if __name__ == "__main__":
    main()
