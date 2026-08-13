#!/usr/bin/env python3
"""Apply prepared Skills script updates via Airtable REST API.

Requires AIRTABLE_PAT in environment (same account as MCP).
Reads remaining-script-*.json and remaining-attach-*.json from initiative folder.
"""

from __future__ import annotations

import json
import os
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
INIT = ROOT / "docs/initiatives/household-skills-ssot-2026-08-11"
API = "https://api.airtable.com/v0"
BATCH = 10


def patch_records(base_id: str, table_id: str, records: list[dict], token: str) -> dict:
    updated: list[dict] = []
    for i in range(0, len(records), BATCH):
        chunk = records[i : i + BATCH]
        body = json.dumps({"records": chunk}).encode("utf-8")
        req = urllib.request.Request(
            f"{API}/{base_id}/{table_id}",
            data=body,
            method="PATCH",
            headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
        )
        try:
            with urllib.request.urlopen(req, timeout=120) as resp:
                out = json.load(resp)
        except urllib.error.HTTPError as e:
            if e.code == 429:
                time.sleep(30)
                with urllib.request.urlopen(req, timeout=120) as resp:
                    out = json.load(resp)
            else:
                raise
        updated.extend(out.get("records", []))
        if i + BATCH < len(records):
            time.sleep(0.25)
    return {"records": updated}


def main() -> int:
    token = os.environ.get("AIRTABLE_PAT") or os.environ.get("AIRTABLE_API_KEY")
    if not token:
        print("Set AIRTABLE_PAT to apply updates via REST API", file=sys.stderr)
        return 2

    files = sorted(INIT.glob("remaining-script-*.json")) + sorted(
        INIT.glob("remaining-attach-*.json")
    )
    if not files:
        print("No remaining-*.json payloads found", file=sys.stderr)
        return 1

    total = 0
    for path in files:
        if path.name in ("remaining-script-all.json",):
            continue
        payload = json.loads(path.read_text(encoding="utf-8"))
        records = payload["records"]
        if not records:
            continue
        out = patch_records(payload["baseId"], payload["tableId"], records, token)
        total += len(out.get("records", []))
        print(f"applied {path.name}: {len(records)} records")
        time.sleep(0.25)

    print(json.dumps({"success": True, "updated": total}))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
