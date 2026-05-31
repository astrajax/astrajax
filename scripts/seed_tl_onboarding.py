#!/usr/bin/env python3
"""
Create TL Onboarding + Progress tables in AstraJax base and seed records.

Requires AIRTABLE_API_KEY with:
  - schema.bases:read + schema.bases:write
  - data.records:read + data.records:write

Usage:
  export AIRTABLE_API_KEY=pat...
  python3 scripts/seed_tl_onboarding.py

Optional:
  python3 scripts/seed_tl_onboarding.py --seed-only          # modules only (table exists)
  python3 scripts/seed_tl_onboarding.py --progress-only      # progress rows only
  python3 scripts/seed_tl_onboarding.py --sync-modules       # update HTML/summary by Title
"""

from __future__ import annotations

import argparse
import json
import os
import sys
import urllib.error
import urllib.request
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from tl_onboarding_content import MODULES

BASE_ID = "appYv601Oq7fKTCj0"
ONBOARDING_TABLE_ID = "tblSdWUBVWrxpislp"
PROGRESS_TABLE_ID = "tblqdV4mNxOUfMEEX"
ONBOARDING_TABLE = "TL Onboarding"
PROGRESS_TABLE = "TL Onboarding Progress"
IDEA_LOG_TABLE = "AI Idea Log"
IDEA_LOG_TABLE_ID = "tbl7e02rSqMefKSLa"
META_URL = f"https://api.airtable.com/v0/meta/bases/{BASE_ID}/tables"

ONBOARDING_FIELDS = {
    "title": "Title",
    "sort_order": "Sort Order",
    "section": "Section",
    "summary": "Summary",
    "html": "HTML Body",
    "read_time": "Read Time Min",
    "essential": "Essential",
    "video_url": "Video URL",
    "slides_url": "Slides URL",
}


def onboarding_record_fields(mod: dict) -> dict:
    fields = {
        ONBOARDING_FIELDS["title"]: mod["title"],
        ONBOARDING_FIELDS["sort_order"]: mod["sort_order"],
        ONBOARDING_FIELDS["section"]: mod["section"],
        ONBOARDING_FIELDS["summary"]: mod["summary"],
        ONBOARDING_FIELDS["html"]: mod["html"].strip(),
        ONBOARDING_FIELDS["read_time"]: mod["read_time"],
        ONBOARDING_FIELDS["essential"]: mod["essential"],
    }
    if mod.get("video_url"):
        fields[ONBOARDING_FIELDS["video_url"]] = mod["video_url"]
    if mod.get("slides_url"):
        fields[ONBOARDING_FIELDS["slides_url"]] = mod["slides_url"]
    return fields

PROGRESS_FIELDS = {
    "label": "Label",
    "module": "Module",
    "completed": "Completed",
    "tl_notes": "TL Notes",
    "question": "Question for Matthew",
    "question_status": "Question Status",
    "matthew_reply": "Matthew Reply",
}


def fail(message: str, code: int = 1) -> None:
    print(json.dumps({"success": False, "error": message}, indent=2))
    sys.exit(code)


def token() -> str:
    t = os.environ.get("AIRTABLE_API_KEY")
    if not t:
        fail("AIRTABLE_API_KEY not set")
    return t


def request(method: str, url: str, data: dict | None = None) -> dict:
    headers = {
        "Authorization": f"Bearer {token()}",
        "Content-Type": "application/json",
    }
    body = json.dumps(data).encode("utf-8") if data is not None else None
    req = urllib.request.Request(url, data=body, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="replace")
        fail(f"HTTP {exc.code}: {detail}")


def list_tables() -> dict[str, str]:
    result = request("GET", META_URL)
    return {t["name"]: t["id"] for t in result.get("tables", [])}


def create_onboarding_table() -> str:
    payload = {
        "name": ONBOARDING_TABLE,
        "description": "TL onboarding reference modules — rendered in the TL Onboarding interface extension.",
        "fields": [
            {"name": ONBOARDING_FIELDS["title"], "type": "singleLineText"},
            {
                "name": ONBOARDING_FIELDS["sort_order"],
                "type": "number",
                "options": {"precision": 0},
            },
            {
                "name": ONBOARDING_FIELDS["section"],
                "type": "singleSelect",
                "options": {
                    "choices": [
                        {"name": "Start Here"},
                        {"name": "The Business"},
                        {"name": "Your Role"},
                        {"name": "Proof and Claims"},
                        {"name": "Reference"},
                    ]
                },
            },
            {"name": ONBOARDING_FIELDS["summary"], "type": "singleLineText"},
            {"name": ONBOARDING_FIELDS["html"], "type": "multilineText"},
            {
                "name": ONBOARDING_FIELDS["read_time"],
                "type": "number",
                "options": {"precision": 0},
            },
            {
                "name": ONBOARDING_FIELDS["essential"],
                "type": "checkbox",
                "options": {"icon": "star", "color": "yellowBright"},
            },
        ],
    }
    result = request("POST", META_URL, payload)
    table_id = result["id"]
    print(f"Created table {ONBOARDING_TABLE} ({table_id})")
    return table_id


def create_idea_log_table() -> str:
    """AI-first idea capture: 'Could AI do this quicker or better?' Logged from the interface."""
    payload = {
        "name": IDEA_LOG_TABLE,
        "description": "AI-first idea log. Captured via the 'Log an idea' button in AstraJax interfaces.",
        "fields": [
            {"name": "Idea", "type": "singleLineText"},
            {"name": "Detail", "type": "multilineText"},
            {
                "name": "Type",
                "type": "singleSelect",
                "options": {
                    "choices": [
                        {"name": "AI could do this"},
                        {"name": "Process improvement"},
                        {"name": "New asset idea"},
                        {"name": "Other"},
                    ]
                },
            },
            {
                "name": "Status",
                "type": "singleSelect",
                "options": {
                    "choices": [
                        {"name": "New"},
                        {"name": "Exploring"},
                        {"name": "Building"},
                        {"name": "Parked"},
                        {"name": "Done"},
                    ]
                },
            },
            {"name": "Source", "type": "singleLineText"},
            {"name": "Logged By", "type": "singleLineText"},
        ],
    }
    result = request("POST", META_URL, payload)
    table_id = result["id"]
    print(f"Created table {IDEA_LOG_TABLE} ({table_id})")
    return table_id


def create_progress_table(onboarding_table_id: str) -> str:
    payload = {
        "name": PROGRESS_TABLE,
        "description": "Tara's notes, completion, and questions per onboarding module.",
        "fields": [
            {"name": PROGRESS_FIELDS["label"], "type": "singleLineText"},
            {
                "name": PROGRESS_FIELDS["module"],
                "type": "multipleRecordLinks",
                "options": {"linkedTableId": onboarding_table_id},
            },
            {
                "name": PROGRESS_FIELDS["completed"],
                "type": "checkbox",
                "options": {"icon": "check", "color": "greenBright"},
            },
            {"name": PROGRESS_FIELDS["tl_notes"], "type": "multilineText"},
            {"name": PROGRESS_FIELDS["question"], "type": "multilineText"},
            {
                "name": PROGRESS_FIELDS["question_status"],
                "type": "singleSelect",
                "options": {
                    "choices": [
                        {"name": "Open"},
                        {"name": "Answered"},
                    ]
                },
            },
            {"name": PROGRESS_FIELDS["matthew_reply"], "type": "multilineText"},
        ],
    }
    result = request("POST", META_URL, payload)
    table_id = result["id"]
    print(f"Created table {PROGRESS_TABLE} ({table_id})")
    return table_id


def sync_onboarding_records(table_id: str) -> int:
    """Upsert module content matched by Title: update existing, create new."""
    existing = fetch_onboarding_records(table_id)
    by_title: dict[str, str] = {
        rec.get("fields", {}).get(ONBOARDING_FIELDS["title"]): rec["id"]
        for rec in existing
        if rec.get("fields", {}).get(ONBOARDING_FIELDS["title"])
    }

    url = f"https://api.airtable.com/v0/{BASE_ID}/{table_id}"
    updated = 0
    to_create: list[dict] = []
    for mod in MODULES:
        record_id = by_title.get(mod["title"])
        if record_id:
            request(
                "PATCH",
                url,
                {"records": [{"id": record_id, "fields": onboarding_record_fields(mod)}]},
            )
            updated += 1
        else:
            to_create.append({"fields": onboarding_record_fields(mod)})

    created = 0
    for i in range(0, len(to_create), 10):
        batch = to_create[i : i + 10]
        result = request("POST", url, {"records": batch})
        created += len(result.get("records", []))

    print(f"Synced {updated} updated, {created} created onboarding modules")
    return updated + created


def backfill_progress_rows(onboarding_table_id: str, progress_table_id: str) -> int:
    """Ensure every onboarding module has a matching Progress row (by Label)."""
    modules = fetch_onboarding_records(onboarding_table_id)
    id_by_title = {
        rec.get("fields", {}).get(ONBOARDING_FIELDS["title"]): rec["id"]
        for rec in modules
        if rec.get("fields", {}).get(ONBOARDING_FIELDS["title"])
    }

    prog_url = f"https://api.airtable.com/v0/{BASE_ID}/{progress_table_id}"
    existing_labels: set[str] = set()
    offset = None
    while True:
        query = "?pageSize=100"
        if offset:
            query += f"&offset={offset}"
        result = request("GET", prog_url + query)
        for rec in result.get("records", []):
            label = rec.get("fields", {}).get(PROGRESS_FIELDS["label"])
            if label:
                existing_labels.add(label)
        offset = result.get("offset")
        if not offset:
            break

    to_create = []
    for mod in MODULES:
        if mod["title"] in existing_labels:
            continue
        module_id = id_by_title.get(mod["title"])
        if not module_id:
            continue
        to_create.append({
            "fields": {
                PROGRESS_FIELDS["label"]: mod["title"],
                PROGRESS_FIELDS["module"]: [module_id],
                PROGRESS_FIELDS["completed"]: False,
            }
        })

    created = 0
    for i in range(0, len(to_create), 10):
        batch = to_create[i : i + 10]
        result = request("POST", prog_url, {"records": batch})
        created += len(result.get("records", []))
    print(f"Backfilled {created} progress rows")
    return created


def seed_onboarding_records(table_id: str) -> list[dict]:
    records = []
    for mod in MODULES:
        records.append({"fields": onboarding_record_fields(mod)})

    url = f"https://api.airtable.com/v0/{BASE_ID}/{table_id}"
    created_records: list[dict] = []
    for i in range(0, len(records), 10):
        batch = records[i : i + 10]
        result = request("POST", url, {"records": batch})
        created_records.extend(result.get("records", []))
    print(f"Seeded {len(created_records)} onboarding modules")
    return created_records


def fetch_onboarding_records(table_id: str) -> list[dict]:
    url = f"https://api.airtable.com/v0/{BASE_ID}/{table_id}"
    records: list[dict] = []
    offset = None
    while True:
        query = "?pageSize=100"
        if offset:
            query += f"&offset={offset}"
        result = request("GET", url + query)
        records.extend(result.get("records", []))
        offset = result.get("offset")
        if not offset:
            break
    return records


def seed_progress_records(progress_table_id: str, module_records: list[dict]) -> None:
    by_title: dict[str, str] = {}
    for rec in module_records:
        title = rec.get("fields", {}).get(ONBOARDING_FIELDS["title"])
        if title:
            by_title[title] = rec["id"]

    records = []
    for mod in MODULES:
        module_id = by_title.get(mod["title"])
        if not module_id:
            fail(f"No module record for title: {mod['title']}")
        records.append({
            "fields": {
                PROGRESS_FIELDS["label"]: mod["title"],
                PROGRESS_FIELDS["module"]: [module_id],
                PROGRESS_FIELDS["completed"]: False,
            }
        })

    url = f"https://api.airtable.com/v0/{BASE_ID}/{progress_table_id}"
    created = 0
    for i in range(0, len(records), 10):
        batch = records[i : i + 10]
        result = request("POST", url, {"records": batch})
        created += len(result.get("records", []))
    print(f"Seeded {created} progress rows")


def progress_row_count(progress_table_id: str) -> int:
    url = f"https://api.airtable.com/v0/{BASE_ID}/{progress_table_id}?pageSize=1"
    # list with maxRecords isn't in our simple GET - use records endpoint
    records = []
    offset = None
    while True:
        query = "?pageSize=100&fields%5B%5D=Label"
        if offset:
            query += f"&offset={offset}"
        result = request("GET", f"https://api.airtable.com/v0/{BASE_ID}/{progress_table_id}" + query)
        records.extend(result.get("records", []))
        offset = result.get("offset")
        if not offset:
            break
    return len(records)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--seed-only", action="store_true", help="Only seed onboarding modules")
    parser.add_argument("--progress-only", action="store_true", help="Only create/seed progress table")
    parser.add_argument(
        "--sync-modules",
        action="store_true",
        help="Upsert module content (by Title) and backfill any missing progress rows",
    )
    parser.add_argument(
        "--idea-log",
        action="store_true",
        help="Create the AI Idea Log table if it does not exist",
    )
    args = parser.parse_args()

    if args.sync_modules:
        sync_onboarding_records(ONBOARDING_TABLE_ID)
        backfill_progress_rows(ONBOARDING_TABLE_ID, PROGRESS_TABLE_ID)
        print(json.dumps({
            "success": True,
            "synced": True,
            "onboardingTableId": ONBOARDING_TABLE_ID,
            "progressTableId": PROGRESS_TABLE_ID,
        }, indent=2))
        return

    if args.idea_log:
        tables = list_tables()
        idea_id = tables.get(IDEA_LOG_TABLE)
        if idea_id:
            print(f"{IDEA_LOG_TABLE} already exists ({idea_id})")
        else:
            idea_id = create_idea_log_table()
        print(json.dumps({
            "success": True,
            "baseId": BASE_ID,
            "ideaLogTableId": idea_id,
        }, indent=2))
        return

    tables = list_tables()
    onboarding_id = tables.get(ONBOARDING_TABLE)
    progress_id = tables.get(PROGRESS_TABLE)

    if args.progress_only:
        if not onboarding_id:
            fail(f"{ONBOARDING_TABLE} must exist before progress seeding")
        if not progress_id:
            progress_id = create_progress_table(onboarding_id)
        if progress_row_count(progress_id) > 0:
            print(f"{PROGRESS_TABLE} already has rows — skipping seed")
        else:
            modules = fetch_onboarding_records(onboarding_id)
            seed_progress_records(progress_id, modules)
        print(json.dumps({
            "success": True,
            "baseId": BASE_ID,
            "onboardingTableId": onboarding_id,
            "progressTableId": progress_id,
        }, indent=2))
        return

    if not args.seed_only:
        if not onboarding_id:
            onboarding_id = create_onboarding_table()
        if not progress_id:
            progress_id = create_progress_table(onboarding_id)
    else:
        if not onboarding_id:
            fail(f"Table {ONBOARDING_TABLE} not found")

    existing = fetch_onboarding_records(onboarding_id) if onboarding_id else []
    if existing:
        print(f"{ONBOARDING_TABLE} already has {len(existing)} records — skipping module seed")
        module_records = existing
    else:
        module_records = seed_onboarding_records(onboarding_id)

    if progress_id and progress_row_count(progress_id) == 0:
        seed_progress_records(progress_id, module_records)
    elif progress_id:
        print(f"{PROGRESS_TABLE} already has rows — skipping progress seed")

    print(json.dumps({
        "success": True,
        "baseId": BASE_ID,
        "onboardingTableId": onboarding_id,
        "progressTableId": progress_id,
        "tableName": ONBOARDING_TABLE,
        "moduleCount": len(MODULES),
        "interfaceSetup": "Add interface-extensions/tl-onboarding to Interface page pagdg8ciA7vQswXrs",
    }, indent=2))


if __name__ == "__main__":
    main()
