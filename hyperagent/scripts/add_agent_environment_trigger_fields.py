#!/usr/bin/env python3
"""Add Trigger Curator / Trigger Scanner checkbox fields to Agent Environments.

Used by the Clive Context Workbench custom interface: the extension sets these
checkboxes; Airtable automations watch them and fire Hyperagent webhooks (or clear
after run).

Requires AIRTABLE_WRITE_TOKEN (schema + field create) in repo-root .env.
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
    table_id,
    token_for_role,
)

TABLE_NAME = "Agent Environments"

TRIGGER_FIELDS = [
    {
        "name": "Trigger Curator",
        "type": "checkbox",
        "description": (
            "Set true from Clive Workbench to run a Curator context-health audit "
            "(Hyperagent webhook). Automation clears after successful POST."
        ),
        "options": {"icon": "check", "color": "blueBright"},
    },
    {
        "name": "Trigger Scanner",
        "type": "checkbox",
        "description": (
            "Set true from Clive Workbench to run an on-demand Context Scanner pass. "
            "Automation clears after successful trigger."
        ),
        "options": {"icon": "check", "color": "greenBright"},
    },
]


def get_meta_tables() -> dict[str, Any]:
    data = meta_request_json("GET", "tables")
    return {table["name"]: table for table in data.get("tables", [])}


def field_exists(table: dict[str, Any], name: str) -> bool:
    return any(item.get("name") == name for item in table.get("fields", []))


def ensure_field(table: dict[str, Any], field_def: dict[str, Any]) -> None:
    if field_exists(table, field_def["name"]):
        print(f"Field already exists: {field_def['name']}")
        return
    payload = {
        "name": field_def["name"],
        "type": field_def["type"],
        "description": field_def.get("description", ""),
        "options": field_def.get("options"),
    }
    if payload["options"] is None:
        del payload["options"]
    print(f"Creating field: {TABLE_NAME}.{field_def['name']}")
    meta_request_json("POST", f"tables/{table['id']}/fields", payload)
    time.sleep(0.35)


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
    }
    schema["generated_at"] = datetime.now(timezone.utc).isoformat()
    SCHEMA_PATH.write_text(json.dumps(schema, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


def main() -> None:
    load_dotenv()
    token_for_role("write")

    tables = get_meta_tables()
    if TABLE_NAME not in tables:
        raise SystemExit(f"Table not found: {TABLE_NAME}")

    table = tables[TABLE_NAME]
    for field_def in TRIGGER_FIELDS:
        ensure_field(table, field_def)
        table = get_meta_tables()[TABLE_NAME]

    refresh_schema(table)

    trigger_curator = next(
        (f for f in table.get("fields", []) if f.get("name") == "Trigger Curator"),
        None,
    )
    trigger_scanner = next(
        (f for f in table.get("fields", []) if f.get("name") == "Trigger Scanner"),
        None,
    )

    print(
        json.dumps(
            {
                "success": True,
                "table_id": table_id(TABLE_NAME),
                "trigger_curator_field_id": trigger_curator["id"] if trigger_curator else None,
                "trigger_scanner_field_id": trigger_scanner["id"] if trigger_scanner else None,
                "schema_path": str(SCHEMA_PATH.relative_to(REPO_ROOT)),
                "next_steps": [
                    "Interface Designer → Workbench extension → expose Trigger Curator + Trigger Scanner (Edit)",
                    "Create automations on Agent Environments when each checkbox becomes true",
                ],
            },
            ensure_ascii=False,
            indent=2,
        )
    )


if __name__ == "__main__":
    main()
