#!/usr/bin/env python3
"""
Read Context Intake records for Clive Curator.

Hardcoded to AstraJax base appYv601Oq7fKTCj0, table tblJCmPGPUyszgFux only.
Requires AIRTABLE_READ_TOKEN in repo-root .env (see .env.example).

Usage:
  python3 hyperagent/scripts/read_context_intake.py --status "Ready for review" --max-records 20
  python3 hyperagent/scripts/read_context_intake.py --all
"""

from __future__ import annotations

import argparse
import json
import sys
import urllib.error
import urllib.parse
import urllib.request

from context_architecture_common import load_dotenv, token_for_role

BASE_ID = "appYv601Oq7fKTCj0"
TABLE_ID = "tblJCmPGPUyszgFux"

SELECT_FIELDS = [
    "Title",
    "Raw Submission",
    "Clean Summary",
    "Category",
    "Suggested Destination",
    "Secondary Destination",
    "Confidence",
    "Status",
    "Submitted By",
    "Source Interface",
    "Source Link",
    "Suggested Action",
    "Next Owner",
    "Reasoning",
    "Clarifying Questions Asked",
    "Duplicate Candidate Note",
    "Build Surface",
    "Version Truth",
    "Suggested Repo",
    "Suggested Path",
    "Cursor Handoff Needed?",
    "GitHub Publish Needed?",
    "Approval Notes",
    "Created at",
    "Last Reviewed At",
]


def fail(message: str, code: int = 1) -> None:
    print(json.dumps({"success": False, "error": message}))
    sys.exit(code)


def airtable_get(params: dict[str, str | int | list[str]]) -> dict:
    load_dotenv()
    token = token_for_role("read")

    query_items: list[tuple[str, str]] = []
    for key, value in params.items():
        if isinstance(value, list):
            query_items.extend((key, item) for item in value)
        else:
            query_items.append((key, str(value)))

    query = urllib.parse.urlencode(query_items)
    url = f"https://api.airtable.com/v0/{BASE_ID}/{TABLE_ID}?{query}"
    req = urllib.request.Request(url, headers={"Authorization": f"Bearer {token}"})

    try:
        with urllib.request.urlopen(req) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="replace")
        fail(f"Airtable API error ({exc.code}): {detail}")


def build_formula(status: str | None, owner: str | None, destination: str | None) -> str | None:
    clauses: list[str] = []
    if status:
        clauses.append(f"{{Status}}='{status}'")
    if owner:
        clauses.append(f"{{Next Owner}}='{owner}'")
    if destination:
        clauses.append(f"{{Suggested Destination}}='{destination}'")
    if not clauses:
        return None
    if len(clauses) == 1:
        return clauses[0]
    return "AND(" + ",".join(clauses) + ")"


def main() -> None:
    parser = argparse.ArgumentParser(description="Read Clive Context Intake candidates")
    parser.add_argument("--status", default="Ready for review")
    parser.add_argument("--owner")
    parser.add_argument("--destination")
    parser.add_argument("--max-records", type=int, default=20)
    parser.add_argument("--all", action="store_true", help="Do not filter by status")
    args = parser.parse_args()

    formula = build_formula(
        status=None if args.all else args.status,
        owner=args.owner,
        destination=args.destination,
    )

    params: dict[str, str | int | list[str]] = {
        "maxRecords": args.max_records,
        "sort[0][field]": "Created at",
        "sort[0][direction]": "desc",
        "fields[]": SELECT_FIELDS,
    }
    if formula:
        params["filterByFormula"] = formula

    data = airtable_get(params)
    records = [
        {
            "id": record["id"],
            "url": f"https://airtable.com/{BASE_ID}/{TABLE_ID}/{record['id']}",
            "createdTime": record.get("createdTime"),
            "fields": record.get("fields", {}),
        }
        for record in data.get("records", [])
    ]

    print(
        json.dumps(
            {
                "success": True,
                "base_id": BASE_ID,
                "table_id": TABLE_ID,
                "record_count": len(records),
                "records": records,
            },
            ensure_ascii=False,
        )
    )


if __name__ == "__main__":
    main()
