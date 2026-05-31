#!/usr/bin/env python3
"""Read Agent Environments for Clive Context Architecture V1."""

from __future__ import annotations

import argparse
import json

from context_architecture_common import and_formula, eq_clause, list_records

SELECT_FIELDS = [
    "Agent Name",
    "Platform",
    "Repo Path",
    "Context Packs",
    "Purpose",
    "Runtime Environment",
    "Skills",
    "Tool Permissions",
    "Owner",
    "Status",
    "Last Config Review",
    "Notes",
    "Created at",
]


def main() -> None:
    parser = argparse.ArgumentParser(description="Read Clive Agent Environments")
    parser.add_argument("--status")
    parser.add_argument("--platform")
    parser.add_argument("--max-records", type=int, default=20)
    args = parser.parse_args()

    clauses: list[str] = []
    if args.status:
        clauses.append(eq_clause("Status", args.status))
    if args.platform:
        clauses.append(eq_clause("Platform", args.platform))

    records = list_records(
        "Agent Environments",
        fields=SELECT_FIELDS,
        formula=and_formula(clauses),
        max_records=args.max_records,
        sort_field="Created at",
    )
    print(json.dumps({"success": True, "record_count": len(records), "records": records}, ensure_ascii=False))


if __name__ == "__main__":
    main()
