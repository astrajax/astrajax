#!/usr/bin/env python3
"""
Provision Clive Context Architecture V1 in Airtable.

Creates the missing canonical tables if they do not exist, adds required fields,
captures table/field IDs to hyperagent/context_architecture_schema_v1.json, and
optionally seeds initial Context Packs and Agent Environments.

Requires AIRTABLE_API_KEY with schema.bases:read, schema.bases:write,
data.records:read, and data.records:write on base appYv601Oq7fKTCj0.
"""

from __future__ import annotations

import argparse
import json
import os
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

BASE_ID = "appYv601Oq7fKTCj0"
INTAKE_TABLE_ID = "tblJCmPGPUyszgFux"
REPO_ROOT = Path(__file__).resolve().parents[2]
SCHEMA_PATH = REPO_ROOT / "hyperagent" / "context_architecture_schema_v1.json"

STATUSES = ["Draft", "Proposed", "Needs decision", "Approved", "Rejected", "Published", "Deprecated"]
AUTHORITIES = ["Canonical candidate", "Supporting", "Anecdotal", "Historical", "Unknown"]
FRESHNESS = ["Current", "Ageing", "Stale", "Unknown"]
OWNERS = ["Matthew", "TL", "Unassigned"]
DESTINATIONS = ["Airtable", "Hyperagent", "Cursor/GitHub", "Notion", "Slack", "None"]
CHANGE_TYPES = ["Context item", "Context pack", "Agent environment", "Hyperagent skill", "GitHub markdown", "Notion doc", "Schema", "Other"]
CHANGE_STATUSES = ["Draft", "Prepared", "Published", "Deployed", "Rolled back", "Cancelled"]
PLATFORMS = ["Hyperagent", "Cursor", "Slack", "Airtable", "GitHub", "Notion", "Planned"]
AGENT_STATUSES = ["Active", "Planned", "Paused", "Deprecated"]
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


def fail(message: str, code: int = 1) -> None:
    print(json.dumps({"success": False, "error": message}))
    sys.exit(code)


def token() -> str:
    value = os.environ.get("AIRTABLE_API_KEY")
    if not value:
        fail("AIRTABLE_API_KEY not set")
    return value


def request_json(method: str, url: str, data: dict[str, Any] | None = None) -> dict[str, Any]:
    headers = {"Authorization": f"Bearer {token()}", "Content-Type": "application/json"}
    body = json.dumps(data).encode("utf-8") if data is not None else None
    req = urllib.request.Request(url, data=body, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req) as resp:
            raw = resp.read().decode("utf-8")
            return json.loads(raw) if raw else {}
    except urllib.error.HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="replace")
        fail(f"Airtable API error ({exc.code}) for {method} {url}: {detail}")


def meta_url(path: str) -> str:
    return f"https://api.airtable.com/v0/meta/bases/{BASE_ID}/{path}"


def records_url(table_id: str, query: dict[str, str] | None = None) -> str:
    base = f"https://api.airtable.com/v0/{BASE_ID}/{table_id}"
    if query:
        return base + "?" + urllib.parse.urlencode(query)
    return base


def select_options(values: list[str]) -> dict[str, Any]:
    return {"choices": [{"name": value} for value in values]}


def field(name: str, field_type: str, options: dict[str, Any] | None = None) -> dict[str, Any]:
    data: dict[str, Any] = {"name": name, "type": field_type}
    if options is not None:
        data["options"] = options
    return data


BASE_TABLES: dict[str, list[dict[str, Any]]] = {
    "Context Items": [
        field("Title", "singleLineText"),
        field("Canonical Text", "multilineText"),
        field("Category", "singleSelect", select_options(ITEM_CATEGORIES)),
        field("Applies To", "multipleSelects", select_options(APPLIES_TO)),
        field("Owner", "singleSelect", select_options(OWNERS)),
        field("Status", "singleSelect", select_options(STATUSES)),
        field("Version", "singleLineText"),
        field("Authority", "singleSelect", select_options(AUTHORITIES)),
        field("Freshness", "singleSelect", select_options(FRESHNESS)),
        field("Published To", "multipleSelects", select_options(DESTINATIONS)),
        field("Source Notes", "multilineText"),
        field("Conflicts", "multilineText"),
        field("Risk if included", "multilineText"),
        field("Risk if omitted", "multilineText"),
        field("Approval Notes", "multilineText"),
        field("Last Reviewed", "dateTime", {"dateFormat": {"name": "iso"}, "timeFormat": {"name": "24hour"}, "timeZone": "client"}),
        field("Created at", "dateTime", {"dateFormat": {"name": "iso"}, "timeFormat": {"name": "24hour"}, "timeZone": "client"}),
    ],
    "Context Packs": [
        field("Pack Name", "singleLineText"),
        field("Purpose", "multilineText"),
        field("Primary Destination", "singleSelect", select_options(DESTINATIONS)),
        field("GitHub Path", "singleLineText"),
        field("Hyperagent Skill Name", "singleLineText"),
        field("Status", "singleSelect", select_options(STATUSES)),
        field("Version", "singleLineText"),
        field("Last Published", "dateTime", {"dateFormat": {"name": "iso"}, "timeFormat": {"name": "24hour"}, "timeZone": "client"}),
        field("Owner", "singleSelect", select_options(OWNERS)),
        field("Notes", "multilineText"),
        field("Created at", "dateTime", {"dateFormat": {"name": "iso"}, "timeFormat": {"name": "24hour"}, "timeZone": "client"}),
    ],
    "Agent Environments": [
        field("Agent Name", "singleLineText"),
        field("Platform", "multipleSelects", select_options(PLATFORMS)),
        field("Purpose", "multilineText"),
        field("Runtime Environment", "multilineText"),
        field("Skills", "multilineText"),
        field("Tool Permissions", "multilineText"),
        field("Owner", "singleSelect", select_options(OWNERS)),
        field("Status", "singleSelect", select_options(AGENT_STATUSES)),
        field("Last Config Review", "dateTime", {"dateFormat": {"name": "iso"}, "timeFormat": {"name": "24hour"}, "timeZone": "client"}),
        field("Notes", "multilineText"),
        field("Created at", "dateTime", {"dateFormat": {"name": "iso"}, "timeFormat": {"name": "24hour"}, "timeZone": "client"}),
        field("Trigger Curator", "checkbox", {"icon": "check", "color": "blueBright"}),
        field("Trigger Scanner", "checkbox", {"icon": "check", "color": "greenBright"}),
    ],
    "Change Log": [
        field("Change Summary", "singleLineText"),
        field("Change Type", "singleSelect", select_options(CHANGE_TYPES)),
        field("Destination", "multipleSelects", select_options(DESTINATIONS)),
        field("Changed By", "singleSelect", select_options(OWNERS)),
        field("Approved By", "singleSelect", select_options(OWNERS)),
        field("Published Path", "singleLineText"),
        field("Commit SHA", "singleLineText"),
        field("Status", "singleSelect", select_options(CHANGE_STATUSES)),
        field("Notes", "multilineText"),
        field("Created at", "dateTime", {"dateFormat": {"name": "iso"}, "timeFormat": {"name": "24hour"}, "timeZone": "client"}),
    ],
}


LINK_FIELDS = [
    ("Context Items", "Source Intake", INTAKE_TABLE_ID, "Context Items"),
    ("Context Items", "Context Pack", "Context Packs", "Context Items"),
    ("Agent Environments", "Context Packs", "Context Packs", "Related Agents"),
    ("Change Log", "Related Intake", INTAKE_TABLE_ID, "Change Log"),
    ("Change Log", "Related Context Item", "Context Items", "Change Log"),
]


PACK_SEEDS = [
    {
        "Pack Name": "AstraJax Core Positioning",
        "Purpose": "Stable AstraJax positioning, founder proof, Butternut proof points, claim-control, and sensitive-info guardrails.",
        "Primary Destination": "Cursor/GitHub",
        "GitHub Path": "docs/context/astrajax-core-positioning.md",
        "Hyperagent Skill Name": "",
        "Status": "Draft",
        "Version": "v1",
        "Owner": "Matthew",
        "Notes": "Seeded by Context Architecture V1 setup from astrajax_positioning.md, astrajax_ops_brief.md, and AGENTS.md.",
    },
    {
        "Pack Name": "Clive Operating Rules",
        "Purpose": "Intake, Curator, Publisher, Scanner boundaries and the human approval model.",
        "Primary Destination": "Cursor/GitHub",
        "GitHub Path": "docs/context/clive-operating-rules.md",
        "Hyperagent Skill Name": "clive-context-curator",
        "Status": "Draft",
        "Version": "v1",
        "Owner": "Matthew",
        "Notes": "Seeded from Intake and Curator skills plus clive_context_architecture_v1.md.",
    },
    {
        "Pack Name": "Model Collaboration",
        "Purpose": "Model-role routing for architecture, curation, implementation, scale, and evaluation.",
        "Primary Destination": "Cursor/GitHub",
        "GitHub Path": "docs/context/model-collaboration.md",
        "Hyperagent Skill Name": "",
        "Status": "Draft",
        "Version": "v1",
        "Owner": "Matthew",
        "Notes": "Seeded from agent-model-collaboration-stack-notion.md and best-models-for-context-environments-notion.md.",
    },
    {
        "Pack Name": "Context Architecture V1",
        "Purpose": "Schema, statuses, source hierarchy, approval gates, and publishing rules for the Clive Context OS.",
        "Primary Destination": "Cursor/GitHub",
        "GitHub Path": "docs/context/context-architecture-v1.md",
        "Hyperagent Skill Name": "",
        "Status": "Draft",
        "Version": "v1",
        "Owner": "Matthew",
        "Notes": "Seeded from clive_context_architecture_v1.md and hyperagent/context_architecture_schema_v1.json.",
    },
]


AGENT_SEEDS = [
    {
        "Agent Name": "Clive Intake",
        "Platform": ["Hyperagent", "Cursor", "Slack"],
        "Purpose": "Capture one messy context submission, classify it, create one Context Intake record, read it back, and stop.",
        "Runtime Environment": "Hyperagent with Slack primary; Cursor agent available for repo-local intake.",
        "Skills": "clive-context-intake; clive-context-intake-slack-blocks",
        "Tool Permissions": "Create Context Intake only. No canonical writes, publishing, commits, or memory writes.",
        "Owner": "Matthew",
        "Status": "Active",
        "Notes": "Live v1.2 Intake surface.",
    },
    {
        "Agent Name": "Clive Curator",
        "Platform": ["Cursor", "Hyperagent"],
        "Purpose": "Review Context Intake records, cluster related context, expose conflicts, and create Proposed Context Items after explicit Matthew confirmation.",
        "Runtime Environment": "Cursor-primary; Hyperagent export retained for portability.",
        "Skills": "clive-context-curator",
        "Tool Permissions": "Read Intake and canonical tables. Create Context Items with Status = Proposed only. No approval or publishing.",
        "Owner": "Matthew",
        "Status": "Active",
        "Notes": "Upgraded to V1 by Context Architecture V1 setup.",
    },
    {
        "Agent Name": "Clive Publisher",
        "Platform": ["Cursor", "GitHub", "Hyperagent", "Notion"],
        "Purpose": "Prepare approved context pack exports and append Change Log entries after approval.",
        "Runtime Environment": "Planned Cursor agent.",
        "Skills": "clive-context-publisher planned",
        "Tool Permissions": "Planned. Read approved Context Items/Packs; prepare exports; append Change Log after approval.",
        "Owner": "Matthew",
        "Status": "Planned",
        "Notes": "Do not operationalise until Curator produces enough approved items.",
    },
    {
        "Agent Name": "Clive Scanner",
        "Platform": ["Cursor"],
        "Purpose": "Later source scanning for stale, missing, or conflicting context candidates.",
        "Runtime Environment": "Planned Cursor or scheduled workflow.",
        "Skills": "Not built",
        "Tool Permissions": "Planned read-only source scans routed back to Intake/Curator.",
        "Owner": "Matthew",
        "Status": "Planned",
        "Notes": "Explicitly deferred until V1 is stable.",
    },
]


def get_tables() -> dict[str, Any]:
    data = request_json("GET", meta_url("tables"))
    return {table["name"]: table for table in data.get("tables", [])}


def create_table(name: str, fields: list[dict[str, Any]]) -> dict[str, Any]:
    print(f"Creating table: {name}")
    result = request_json("POST", meta_url("tables"), {"name": name, "fields": fields})
    time.sleep(0.4)
    return result


def field_exists(table: dict[str, Any], name: str) -> bool:
    return any(existing["name"] == name for existing in table.get("fields", []))


def create_field(table_id: str, field_def: dict[str, Any]) -> None:
    print(f"Creating field: {table_id}.{field_def['name']}")
    request_json("POST", meta_url(f"tables/{table_id}/fields"), field_def)
    time.sleep(0.3)


def ensure_tables_and_fields() -> dict[str, Any]:
    tables = get_tables()
    for name, fields in BASE_TABLES.items():
        if name not in tables:
            create_table(name, fields[:1])
            tables = get_tables()
        table = tables[name]
        for field_def in fields[1:]:
            if not field_exists(table, field_def["name"]):
                create_field(table["id"], field_def)
                tables = get_tables()
                table = tables[name]

    tables = get_tables()
    for table_name, field_name, linked_table, _inverse_name in LINK_FIELDS:
        table = tables[table_name]
        if field_exists(table, field_name):
            continue
        linked_id = tables[linked_table]["id"] if linked_table in tables else linked_table
        create_field(
            table["id"],
            {
                "name": field_name,
                "type": "multipleRecordLinks",
                "options": {"linkedTableId": linked_id},
            },
        )
        tables = get_tables()

    return get_tables()


def formula_equals(field_name: str, value: str) -> str:
    safe = value.replace("'", "\\'")
    return f"{{{field_name}}}='{safe}'"


def find_record(table_id: str, key_field: str, key_value: str) -> str | None:
    data = request_json(
        "GET",
        records_url(table_id, {"maxRecords": "1", "filterByFormula": formula_equals(key_field, key_value)}),
    )
    records = data.get("records", [])
    if records:
        return records[0]["id"]
    return None


def create_record(table_id: str, fields_data: dict[str, Any]) -> str:
    result = request_json("POST", records_url(table_id), {"records": [{"fields": fields_data}]})
    return result["records"][0]["id"]


def seed_records(tables: dict[str, Any]) -> dict[str, list[str]]:
    created: dict[str, list[str]] = {"Context Packs": [], "Agent Environments": []}
    packs_id = tables["Context Packs"]["id"]
    agents_id = tables["Agent Environments"]["id"]

    for seed in PACK_SEEDS:
        if find_record(packs_id, "Pack Name", seed["Pack Name"]):
            continue
        created["Context Packs"].append(create_record(packs_id, seed))

    for seed in AGENT_SEEDS:
        if find_record(agents_id, "Agent Name", seed["Agent Name"]):
            continue
        created["Agent Environments"].append(create_record(agents_id, seed))

    return created


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


def write_schema(tables: dict[str, Any]) -> None:
    selected = {
        "Context Intake": {
            "id": INTAKE_TABLE_ID,
            "name": "Context Intake",
            "fields": {},
            "note": "See .cursor/skills/clive-context-intake/SKILL.md for complete live field IDs.",
        }
    }
    for name in ("Context Items", "Context Packs", "Agent Environments", "Change Log"):
        selected[name] = table_to_schema(tables[name])

    schema = {
        "version": "v1",
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "base_id": BASE_ID,
        "tables": selected,
        "allowed_values": {
            "item_status": STATUSES,
            "change_status": CHANGE_STATUSES,
            "authority": AUTHORITIES,
            "freshness": FRESHNESS,
            "owner": OWNERS,
            "destination": DESTINATIONS,
            "agent_status": AGENT_STATUSES,
        },
        "write_permissions": {
            "Clive Intake": {
                "Context Intake": ["create"],
                "Context Items": [],
                "Context Packs": [],
                "Agent Environments": [],
                "Change Log": [],
            },
            "Clive Curator": {
                "Context Intake": ["read"],
                "Context Items": ["read", "create_proposed"],
                "Context Packs": ["read"],
                "Agent Environments": ["read"],
                "Change Log": [],
            },
            "Clive Publisher": {
                "Context Items": ["read_approved"],
                "Context Packs": ["read_approved"],
                "Change Log": ["append"],
            },
        },
        "scripts": {
            "Context Intake": ["hyperagent/scripts/create_context_intake.py", "hyperagent/scripts/read_context_intake.py"],
            "Context Items": ["hyperagent/scripts/read_context_items.py", "hyperagent/scripts/create_context_item.py", "hyperagent/scripts/update_context_item_status.py"],
            "Context Packs": ["hyperagent/scripts/read_context_packs.py"],
            "Change Log": ["hyperagent/scripts/append_change_log.py"],
        },
    }
    SCHEMA_PATH.write_text(json.dumps(schema, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


def main() -> None:
    parser = argparse.ArgumentParser(description="Provision Clive Context Architecture V1")
    parser.add_argument("--seed", action="store_true", help="Seed initial Context Packs and Agent Environments")
    args = parser.parse_args()

    tables = ensure_tables_and_fields()
    seeded = seed_records(tables) if args.seed else {"Context Packs": [], "Agent Environments": []}
    tables = get_tables()
    write_schema(tables)

    print(
        json.dumps(
            {
                "success": True,
                "base_id": BASE_ID,
                "schema_path": str(SCHEMA_PATH),
                "tables": {name: tables[name]["id"] for name in ("Context Items", "Context Packs", "Agent Environments", "Change Log")},
                "seeded": seeded,
            },
            ensure_ascii=False,
        )
    )


if __name__ == "__main__":
    main()
