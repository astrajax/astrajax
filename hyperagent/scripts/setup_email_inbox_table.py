#!/usr/bin/env python3
"""Create or update the Emails table in the AstraJax Airtable base.

Captures all inbound Gmail messages via Apps Script webhook. Airtable AI
"Generate structured data" on Email Category is configured manually in the UI
(see docs/context/email-inbox-setup.md).

Requires AIRTABLE_WRITE_TOKEN in repo-root .env.
"""

from __future__ import annotations

import json
import sys
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

sys.path.insert(0, str(Path(__file__).resolve().parent))
from context_architecture_common import (  # noqa: E402
    REPO_ROOT,
    SCHEMA_PATH,
    load_dotenv,
    meta_request_json,
    token_for_role,
)

TABLE_NAME = "Emails"

EMAIL_CATEGORIES = [
    "Hyperagent Release",
    "Platform / SaaS Update",
    "Customer / Sales",
    "Finance / Billing",
    "Newsletter / Marketing",
    "Personal",
    "Internal / Team",
    "Notification / System",
    "Other",
    "Uncategorised",
]

SCANNER_STATUSES = ["New", "Synced to repo", "Promoted", "Ignored"]

INGEST_SOURCES = ["Apps Script Gmail", "Apps Script Gmail (AstraJax label)", "Manual paste", "Other"]


def select_options(values: list[str]) -> dict[str, Any]:
    return {"choices": [{"name": value} for value in values]}


def field(name: str, field_type: str, options: dict[str, Any] | None = None) -> dict[str, Any]:
    payload: dict[str, Any] = {"name": name, "type": field_type}
    if options is not None:
        payload["options"] = options
    return payload


def get_meta_tables() -> dict[str, Any]:
    data = meta_request_json("GET", "tables")
    return {table["name"]: table for table in data.get("tables", [])}


def ensure_table() -> dict[str, Any]:
    tables = get_meta_tables()
    if TABLE_NAME in tables:
        return tables[TABLE_NAME]

    payload = {
        "name": TABLE_NAME,
        "description": (
            "All inbound Gmail captured via Apps Script webhook. "
            "Email Category is filled by Airtable AI structured data. "
            "Hyperagent Release Scanner reads Hyperagent Release rows only."
        ),
        "fields": [
            field("Subject", "singleLineText"),
            field("From", "singleLineText"),
            field(
                "Received At",
                "dateTime",
                {
                    "dateFormat": {"name": "iso", "format": "YYYY-MM-DD"},
                    "timeFormat": {"name": "24hour", "format": "HH:mm"},
                    "timeZone": "Europe/London",
                },
            ),
            field("Gmail Message ID", "singleLineText"),
            field("Gmail Link", "url"),
            field("Body", "multilineText"),
            field("Ingest Source", "singleSelect", select_options(INGEST_SOURCES)),
            field("Email Category", "singleSelect", select_options(EMAIL_CATEGORIES)),
            field("Scanner Status", "singleSelect", select_options(SCANNER_STATUSES)),
            field("Notes", "multilineText"),
        ],
    }
    result = meta_request_json("POST", "tables", payload)
    time.sleep(0.5)
    tables = get_meta_tables()
    return tables[TABLE_NAME]


def ensure_field(table: dict[str, Any], field_def: dict[str, Any]) -> None:
    if any(existing["name"] == field_def["name"] for existing in table.get("fields", [])):
        return
    meta_request_json("POST", f"tables/{table['id']}/fields", field_def)
    time.sleep(0.3)


def ensure_fields(table: dict[str, Any]) -> dict[str, Any]:
    extra_fields = [
        field("From Email", "email"),
        field("Body Excerpt", "multilineText"),
        field("AI Summary", "multilineText"),
        field("AI Structured JSON", "multilineText"),
        field("Thread ID", "singleLineText"),
        field("To", "singleLineText"),
        field("Cc", "singleLineText"),
        field("Has Attachments", "checkbox", {"icon": "check", "color": "greenBright"}),
        field("Attachment Names", "multilineText"),
    ]
    for field_def in extra_fields:
        ensure_field(table, field_def)
        table = get_meta_tables()[TABLE_NAME]
    return table


def refresh_schema(table: dict[str, Any]) -> None:
    schema = json.loads(SCHEMA_PATH.read_text(encoding="utf-8"))
    fields: dict[str, Any] = {}
    for item in table.get("fields", []):
        fields[item["name"]] = {
            "id": item["id"],
            "name": item["name"],
            "type": item["type"],
        }

    schema.setdefault("tables", {})[TABLE_NAME] = {
        "id": table["id"],
        "name": TABLE_NAME,
        "fields": fields,
        "note": (
            "All Gmail via Apps Script webhook. Email Category via Airtable AI "
            "structured data (manual UI setup). Scanner reads Hyperagent Release only."
        ),
    }
    schema["tables"].pop("Email Inbox", None)

    allowed = schema.setdefault("allowed_values", {})
    allowed["email_categories"] = EMAIL_CATEGORIES
    allowed["email_scanner_status"] = SCANNER_STATUSES
    allowed["email_ingest_source"] = INGEST_SOURCES

    write_perms = schema.setdefault("write_permissions", {})
    write_perms["Clive Hyperagent Release Scanner"] = {
        "Emails": ["read", "update_scanner_status"],
        "note": "Read Hyperagent Release rows; mark Scanner Status after repo sync.",
    }
    write_perms.pop("Apps Script Gmail Webhook", None)
    write_perms["Apps Script Gmail Webhook"] = {"Emails": ["create"]}

    scripts = schema.setdefault("scripts", {})
    scripts.pop("Email Inbox", None)
    scripts[TABLE_NAME] = [
        "hyperagent/scripts/read_email_inbox.py",
        "hyperagent/scripts/setup_email_inbox_table.py",
    ]

    schema["generated_at"] = datetime.now(timezone.utc).isoformat()
    SCHEMA_PATH.write_text(json.dumps(schema, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


def main() -> None:
    load_dotenv()
    token_for_role("write")
    table = ensure_table()
    table = ensure_fields(table)
    refresh_schema(table)
    print(
        json.dumps(
            {
                "success": True,
                "table_id": table["id"],
                "table_name": TABLE_NAME,
                "field_count": len(table.get("fields", [])),
                "schema_path": str(SCHEMA_PATH.relative_to(REPO_ROOT)),
                "next_step": "Configure Airtable AI structured data on Email Category (see docs/context/email-inbox-setup.md)",
            },
            ensure_ascii=False,
        )
    )


if __name__ == "__main__":
    main()
