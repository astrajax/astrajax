#!/usr/bin/env python3
"""Read Context Packs for Clive Context Architecture V1."""

from __future__ import annotations

import argparse
import json

from context_architecture_common import and_formula, eq_clause, list_records

SELECT_FIELDS = [
    "Pack Name",
    "Purpose",
    "Primary Destination",
    "Agent Environments",
    "Context Items",
    "GitHub Path",
    "Hyperagent Skill Name",
    "Status",
    "Version",
    "Last Published",
    "Owner",
    "Notes",
    "Created at",
]


def main() -> None:
    parser = argparse.ArgumentParser(description="Read Clive Context Packs")
    parser.add_argument("--status")
    parser.add_argument("--destination")
    parser.add_argument("--max-records", type=int, default=20)
    args = parser.parse_args()

    clauses: list[str] = []
    if args.status:
        clauses.append(eq_clause("Status", args.status))
    if args.destination:
        clauses.append(eq_clause("Primary Destination", args.destination))

    records = list_records(
        "Context Packs",
        fields=SELECT_FIELDS,
        formula=and_formula(clauses),
        max_records=args.max_records,
        sort_field="Created at",
    )
    print(json.dumps({"success": True, "record_count": len(records), "records": records}, ensure_ascii=False))


if __name__ == "__main__":
    main()
