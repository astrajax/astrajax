#!/usr/bin/env python3
"""Mark scanner-created Context Intake rows for human review by batch ID."""

from __future__ import annotations

import argparse
import json
import os
import sys
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path
from typing import Any

REPO_ROOT = Path(__file__).resolve().parents[2]
ENV_PATH = REPO_ROOT / ".env"
BASE_ID = "appYv601Oq7fKTCj0"
TABLE_ID = "tblJCmPGPUyszgFux"
SAFE_STATUSES = {"New", "Needs clarification", "Possible duplicate"}


def fail(message: str, code: int = 1) -> None:
    print(json.dumps({"success": False, "error": message}, ensure_ascii=False))
    sys.exit(code)


def load_dotenv() -> None:
    if not ENV_PATH.exists():
        return
    for raw_line in ENV_PATH.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        key = key.strip()
        value = value.strip().strip('"').strip("'")
        if key and key not in os.environ:
            os.environ[key] = value


def token_for(role: str) -> str:
    load_dotenv()
    if role == "read":
        token = os.environ.get("AIRTABLE_READ_TOKEN") or os.environ.get("AIRTABLE_API_KEY")
        if not token:
            fail("AIRTABLE_READ_TOKEN not set")
        return token
    token = os.environ.get("AIRTABLE_WRITE_TOKEN") or os.environ.get("AIRTABLE_API_KEY")
    if not token:
        fail("AIRTABLE_WRITE_TOKEN not set")
    return token


def request(method: str, path: str, *, query: dict[str, Any] | None = None, data: dict[str, Any] | None = None, role: str = "read") -> dict[str, Any]:
    if query:
        path += "?" + urllib.parse.urlencode([(k, str(v)) for k, v in query.items()])
    url = f"https://api.airtable.com/v0/{BASE_ID}/{path}"
    body = json.dumps(data).encode("utf-8") if data is not None else None
    req = urllib.request.Request(
        url,
        data=body,
        headers={
            "Authorization": f"Bearer {token_for(role)}",
            "Content-Type": "application/json",
        },
        method=method,
    )
    try:
        with urllib.request.urlopen(req) as resp:
            raw = resp.read().decode("utf-8")
            return json.loads(raw) if raw else {}
    except urllib.error.HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="replace")
        fail(f"Airtable API error ({exc.code}): {detail}")


def find_batch(batch_id: str) -> list[dict[str, Any]]:
    formula = f'FIND("{batch_id}", {{Reasoning}})'
    data = request(
        "GET",
        TABLE_ID,
        query={
            "filterByFormula": formula,
            "maxRecords": 100,
            "fields[]": ["Title", "Status", "Reasoning", "Duplicate Candidate Note", "Approval Notes"],
        },
        role="read",
    )
    return data.get("records", [])


def mark_for_review(record: dict[str, Any], batch_id: str) -> dict[str, Any]:
    fields = record.get("fields", {})
    status = fields.get("Status")
    if status not in SAFE_STATUSES:
        fail(f"Refusing cleanup for {record['id']} because Status is {status!r}")
    note = f"Scanner cleanup requested for batch {batch_id}. Review before curation."
    payload = {
        "records": [
            {
                "id": record["id"],
                "fields": {
                    "Status": "Needs clarification",
                    "Duplicate Candidate Note": note,
                    "Approval Notes": note,
                },
            }
        ]
    }
    return request("PATCH", TABLE_ID, data=payload, role="write")


def main() -> None:
    parser = argparse.ArgumentParser(description="Mark scanner-created intake rows for review")
    parser.add_argument("--batch-id", required=True)
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--apply", action="store_true")
    args = parser.parse_args()
    if args.dry_run == args.apply:
        fail("Choose exactly one of --dry-run or --apply")
    records = find_batch(args.batch_id)
    if args.dry_run:
        print(
            json.dumps(
                {
                    "success": True,
                    "dry_run": True,
                    "batch_id": args.batch_id,
                    "matching_records": [
                        {"record_id": r["id"], "title": r.get("fields", {}).get("Title"), "status": r.get("fields", {}).get("Status")}
                        for r in records
                    ],
                },
                ensure_ascii=False,
            )
        )
        return
    updated = [mark_for_review(record, args.batch_id) for record in records]
    print(json.dumps({"success": True, "batch_id": args.batch_id, "updated_count": len(updated)}, ensure_ascii=False))


if __name__ == "__main__":
    main()
