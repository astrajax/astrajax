#!/usr/bin/env python3
"""
Migrate Clive Context Architecture to V2.

Migration order from clive_context_architecture_v2.md section 7:
1. Quarantine V1 bootstrap Context Items
2. Add provenance and hash fields
3. Refresh schema capture
4. Link Agent Environments to Context Packs

Requires AIRTABLE_WRITE_TOKEN (and read) in repo-root .env.
"""

from __future__ import annotations

import json
import time
from datetime import datetime, timezone
from typing import Any

from context_architecture_common import (
    ENV_PATH,
    REPO_ROOT,
    SCHEMA_PATH,
    append_audit_mirror,
    bootstrap_item_ids,
    compute_entry_hash,
    load_dotenv,
    meta_request_json,
    request_json,
    table_id,
    update_record,
    token_for_role,
)

ITEMS_TABLE = "Context Items"
CHANGE_LOG_TABLE = "Change Log"
AGENTS_TABLE = "Agent Environments"

ITEM_CATEGORIES = [
    "Workflow Rule",
    "Business Definition",
    "Decision",
    "Agent Instruction",
    "Build Context",
    "Prompt Update",
    "Example Pattern",
    "Context Gap",
    "Source of Truth",
    "Open Question",
    "Deprecated Context",
]
APPLIES_TO = [
    "AstraJax",
    "Clive",
    "Clive Intake",
    "Clive Curator",
    "Clive Publisher",
    "Clive Scanner",
    "Hyperagent",
    "Cursor/GitHub",
    "Notion",
    "Airtable",
    "Matthew",
    "TL",
]
CHANGE_TYPES = [
    "Context item",
    "Context pack",
    "Agent environment",
    "Hyperagent skill",
    "GitHub markdown",
    "Notion doc",
    "Schema",
    "Other",
]

CREATED_BY_VALUES = ["Agent", "Matthew", "TL"]
CONFIRMED_BY_VALUES = ["Matthew", "TL"]
CONFIRMATION_METHOD_VALUES = ["Airtable edit", "Interface button", "approver script"]
ITEM_STATUS_VALUES = [
    "Draft",
    "Agent proposed",
    "Proposed",
    "Needs decision",
    "Approved",
    "Rejected",
    "Published",
    "Deprecated",
]

BOOTSTRAP_SOURCES = {
    "recvWCNlwxlwqrQ0i": "docs/context/astrajax-core-positioning.md",
    "reckhCIz5AFhFhag4": "astrajax_ops_brief.md; AGENTS.md",
    "rec4E2xltxXeCsicl": "astrajax_positioning.md; clive_context_architecture_v1.md",
    "recoWcmc9fSwMwmDL": "clive-context-intake skill; clive_context_architecture_v1.md",
    "recuOM7itdyK3LBhS": "clive-context-curator skill; clive_context_architecture_v2.md",
    "recJabWSwJbZASaCq": "clive_context_architecture_v1.md; context_architecture_schema_v1.json",
    "recPQzHHxvayexRre": "clive_context_architecture_v1.md; docs/context/clive-operating-rules.md",
    "recUJaurBEHabB9DX": "agent-model-collaboration-stack-notion.md; docs/context/model-collaboration.md",
}

AGENT_PACK_LINKS = {
    "rec5n39XNLyQKQIXR": ["recIqqLt27DIBfZFv"],
    "recHRC39wGqAKyJyP": ["recIqqLt27DIBfZFv", "recuBYvdtJPUbSCLn", "recZBSmQuXxwfCbhH"],
    "recPSiXdnxF023qlj": ["rec5A88A99WgE06Xc", "recIqqLt27DIBfZFv", "recZBSmQuXxwfCbhH", "recuBYvdtJPUbSCLn"],
    "rec8tHO48vMkrf15Y": ["recuBYvdtJPUbSCLn"],
}


def ensure_env_file() -> None:
    if ENV_PATH.exists():
        return
    mcp_path = REPO_ROOT / ".cursor" / "mcp.json"
    if not mcp_path.exists():
        raise SystemExit(".env missing and .cursor/mcp.json unavailable")
    token = (
        json.loads(mcp_path.read_text(encoding="utf-8"))
        ["mcpServers"]["airtable-astrajax"]["headers"]["Authorization"]
        .replace("Bearer ", "")
        .strip()
    )
    ENV_PATH.write_text(
        "\n".join(
            [
                "# Generated once for V2 migration. Split PATs when ready.",
                f"AIRTABLE_READ_TOKEN={token}",
                f"AIRTABLE_WRITE_TOKEN={token}",
                f"AIRTABLE_APPROVER_TOKEN={token}",
                "",
            ]
        ),
        encoding="utf-8",
    )


def load_schema() -> dict:
    return json.loads(SCHEMA_PATH.read_text(encoding="utf-8"))


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


def ensure_field(table_name: str, field_def: dict[str, Any], tables: dict[str, Any]) -> None:
    table = tables[table_name]
    if any(existing["name"] == field_def["name"] for existing in table.get("fields", [])):
        return
    meta_request_json("POST", f"tables/{table['id']}/fields", field_def)
    time.sleep(0.3)


def ensure_v2_fields() -> None:
    tables = get_meta_tables()
    item_fields = [
        field("Created By", "singleSelect", select_options(CREATED_BY_VALUES)),
        field("Proposed By Agent", "singleLineText"),
        field("Confirmed By Human", "singleSelect", select_options(CONFIRMED_BY_VALUES)),
        field("Confirmation Method", "singleSelect", select_options(CONFIRMATION_METHOD_VALUES)),
        field("Bootstrap Source", "singleLineText"),
    ]
    for field_def in item_fields:
        ensure_field(ITEMS_TABLE, field_def, tables)
        tables = get_meta_tables()

    log_fields = [
        field("Prev Hash", "singleLineText"),
        field("Entry Hash", "singleLineText"),
    ]
    for field_def in log_fields:
        ensure_field(CHANGE_LOG_TABLE, field_def, tables)
        tables = get_meta_tables()


def quarantine_bootstrap_items() -> list[dict[str, Any]]:
    updated: list[dict[str, Any]] = []
    for record_id in bootstrap_item_ids():
        record = update_record(
            ITEMS_TABLE,
            record_id,
            {
                "Status": "Draft",
                "Created By": "Agent",
                "Proposed By Agent": "Cursor implementation session V1 bootstrap",
                "Confirmed By Human": None,
                "Confirmation Method": None,
                "Bootstrap Source": BOOTSTRAP_SOURCES.get(record_id, "V1 bootstrap migration"),
                "Approval Notes": "Quarantined by Context Architecture V2 migration. Requires Matthew review before promotion.",
            },
            token_role="write",
        )
        updated.append({"id": record["id"], "title": record.get("fields", {}).get("Title"), "status": "Draft"})
    return updated


def backfill_change_log_hashes() -> list[dict[str, Any]]:
    """Compute Prev Hash / Entry Hash for existing Change Log rows (oldest first)."""
    records: list[dict[str, Any]] = []
    offset: str | None = None
    while True:
        query: dict[str, Any] = {
            "pageSize": 100,
            "sort[0][field]": "Created at",
            "sort[0][direction]": "asc",
            "fields[]": [
                "Change Summary",
                "Change Type",
                "Changed By",
                "Status",
                "Destination",
                "Approved By",
                "Published Path",
                "Commit SHA",
                "Notes",
                "Related Intake",
                "Related Context Item",
                "Created at",
                "Prev Hash",
                "Entry Hash",
            ],
        }
        if offset:
            query["offset"] = offset
        page = request_json("GET", table_id("Change Log"), query=query, token_role="read")
        records.extend(page.get("records", []))
        offset = page.get("offset")
        if not offset:
            break

    prev_hash = ""
    updated: list[dict[str, Any]] = []
    for record in records:
        fields = record.get("fields", {})
        if fields.get("Entry Hash"):
            prev_hash = fields["Entry Hash"]
            continue
        core = {
            "Change Summary": fields.get("Change Summary", ""),
            "Change Type": fields.get("Change Type", ""),
            "Changed By": fields.get("Changed By", ""),
            "Status": fields.get("Status", ""),
            "Created at": fields.get("Created at", ""),
        }
        for optional in (
            "Related Intake",
            "Related Context Item",
            "Destination",
            "Approved By",
            "Published Path",
            "Commit SHA",
            "Notes",
        ):
            if fields.get(optional):
                core[optional] = fields[optional]
        entry_hash = compute_entry_hash(core, prev_hash)
        update_record(
            CHANGE_LOG_TABLE,
            record["id"],
            {"Prev Hash": prev_hash, "Entry Hash": entry_hash},
            token_role="write",
        )
        mirrored_fields = {**fields, "Prev Hash": prev_hash, "Entry Hash": entry_hash}
        append_audit_mirror(record["id"], mirrored_fields)
        updated.append({"id": record["id"], "entry_hash": entry_hash})
        prev_hash = entry_hash
    return updated


def link_agent_environments() -> list[dict[str, Any]]:
    linked: list[dict[str, Any]] = []
    for agent_id, pack_ids in AGENT_PACK_LINKS.items():
        record = update_record(
            AGENTS_TABLE,
            agent_id,
            {"Context Packs": pack_ids},
            token_role="write",
        )
        linked.append(
            {
                "id": record["id"],
                "agent_name": record.get("fields", {}).get("Agent Name"),
                "context_packs": pack_ids,
            }
        )
    return linked


def table_to_schema(table: dict[str, Any]) -> dict[str, Any]:
    return {
        "id": table["id"],
        "name": table["name"],
        "fields": {
            field_data["name"]: {
                "id": field_data["id"],
                "name": field_data["name"],
                "type": field_data["type"],
            }
            for field_data in table.get("fields", [])
        },
    }


def write_schema() -> None:
    tables = get_meta_tables()
    schema = load_schema()
    schema["version"] = "v2"
    schema["generated_at"] = datetime.now(timezone.utc).isoformat()
    schema["tables"]["Context Items"] = table_to_schema(tables[ITEMS_TABLE])
    schema["tables"]["Context Packs"] = table_to_schema(tables["Context Packs"])
    schema["tables"]["Agent Environments"] = table_to_schema(tables[AGENTS_TABLE])
    schema["tables"]["Change Log"] = table_to_schema(tables[CHANGE_LOG_TABLE])
    schema["allowed_values"]["item_status"] = ITEM_STATUS_VALUES
    schema["allowed_values"]["created_by"] = CREATED_BY_VALUES
    schema["allowed_values"]["confirmed_by_human"] = CONFIRMED_BY_VALUES
    schema["allowed_values"]["confirmation_method"] = CONFIRMATION_METHOD_VALUES
    schema["allowed_values"]["item_categories"] = ITEM_CATEGORIES
    schema["allowed_values"]["applies_to"] = APPLIES_TO
    schema["allowed_values"]["change_types"] = CHANGE_TYPES
    schema["write_permissions"]["Clive Curator"]["Context Items"] = ["read", "create_proposed"]
    schema["write_permissions"]["Matthew approver"] = {
        "Context Items": ["approve", "reject", "deprecate", "publish"],
        "Change Log": ["append_published"],
    }
    schema["credentials"] = {
        "read": "AIRTABLE_READ_TOKEN",
        "write": "AIRTABLE_WRITE_TOKEN",
        "approver": "AIRTABLE_APPROVER_TOKEN",
    }
    schema["scripts"]["Context Items"] = list(
        dict.fromkeys(
            schema["scripts"].get("Context Items", [])
            + [
                "hyperagent/scripts/approve_context_item.py",
                "hyperagent/scripts/quarantine_context_items.py",
            ]
        )
    )
    schema["scripts"]["Validation"] = ["hyperagent/scripts/validate_context_architecture_v2.py"]
    SCHEMA_PATH.write_text(json.dumps(schema, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


def main() -> None:
    ensure_env_file()
    load_dotenv()
    token_for_role("write")
    ensure_v2_fields()
    write_schema()
    backfilled = backfill_change_log_hashes()
    quarantined = quarantine_bootstrap_items()
    linked = link_agent_environments()
    write_schema()
    print(
        json.dumps(
            {
                "success": True,
                "backfilled_change_log_count": len(backfilled),
                "backfilled_change_log": backfilled,
                "quarantined_count": len(quarantined),
                "quarantined": quarantined,
                "linked_agents": linked,
                "schema_path": str(SCHEMA_PATH),
            },
            ensure_ascii=False,
            indent=2,
        )
    )


if __name__ == "__main__":
    main()
