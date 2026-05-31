#!/usr/bin/env python3
"""
Add Repo Path to Agent Environments, populate paths, verify Context Pack links.

Run after V2 migration. Requires AIRTABLE_WRITE_TOKEN in repo-root .env.
"""

from __future__ import annotations

import json
import time
from datetime import datetime, timezone
from typing import Any

from context_architecture_common import (
    SCHEMA_PATH,
    load_dotenv,
    meta_request_json,
    request_json,
    table_id,
    token_for_role,
    update_record,
)

AGENTS_TABLE = "Agent Environments"

# Registry build-pack folder per agent (source of truth lives in repo, not Airtable text fields).
AGENT_REPO_PATHS: dict[str, str] = {
    "Clive Intake": "agents/hyperagent/clive/intake/",
    "Clive Curator": "agents/hyperagent/clive/curator/",
    "Clive Publisher": "agents/hyperagent/clive/publisher/",
    "Clive Scanner": "agents/cursor/clive/context-scanner/",
    "Clive Agent Factory": "agents/cursor/clive/agent-factory/",
    "Clive Hyperagent Release Scanner": "agents/cursor/clive/hyperagent-release-scanner/",
}

# From migrate_context_architecture_v2.py — re-apply if links were lost.
AGENT_PACK_LINKS: dict[str, list[str]] = {
    "rec5n39XNLyQKQIXR": ["recIqqLt27DIBfZFv"],
    "recHRC39wGqAKyJyP": ["recIqqLt27DIBfZFv", "recuBYvdtJPUbSCLn", "recZBSmQuXxwfCbhH"],
    "recPSiXdnxF023qlj": ["rec5A88A99WgE06Xc", "recIqqLt27DIBfZFv", "recZBSmQuXxwfCbhH", "recuBYvdtJPUbSCLn"],
    "rec8tHO48vMkrf15Y": ["recuBYvdtJPUbSCLn"],
}


def get_meta_tables() -> dict[str, Any]:
    data = meta_request_json("GET", "tables")
    return {table["name"]: table for table in data.get("tables", [])}


def ensure_repo_path_field(tables: dict[str, Any]) -> None:
    table = tables[AGENTS_TABLE]
    if any(f["name"] == "Repo Path" for f in table.get("fields", [])):
        return
    meta_request_json(
        "POST",
        f"tables/{table['id']}/fields",
        {"name": "Repo Path", "type": "singleLineText"},
    )
    time.sleep(0.3)


def list_agents() -> list[dict[str, Any]]:
    records: list[dict[str, Any]] = []
    offset: str | None = None
    while True:
        query: dict[str, Any] = {
            "pageSize": 100,
            "fields[]": ["Agent Name", "Repo Path", "Context Packs"],
        }
        if offset:
            query["offset"] = offset
        page = request_json("GET", table_id(AGENTS_TABLE), query=query, token_role="read")
        records.extend(page.get("records", []))
        offset = page.get("offset")
        if not offset:
            break
    return records


def populate_repo_paths(records: list[dict[str, Any]]) -> list[dict[str, Any]]:
    updated: list[dict[str, Any]] = []
    for record in records:
        name = (record.get("fields") or {}).get("Agent Name", "")
        path = AGENT_REPO_PATHS.get(name)
        if not path:
            continue
        current = (record.get("fields") or {}).get("Repo Path", "")
        if current == path:
            continue
        row = update_record(AGENTS_TABLE, record["id"], {"Repo Path": path}, token_role="write")
        updated.append({"id": record["id"], "agent_name": name, "repo_path": path})
    return updated


def ensure_pack_links() -> list[dict[str, Any]]:
    linked: list[dict[str, Any]] = []
    records = {row["id"]: row for row in list_agents()}
    for agent_id, pack_ids in AGENT_PACK_LINKS.items():
        record = records.get(agent_id)
        if not record:
            continue
        current = (record.get("fields") or {}).get("Context Packs") or []
        if set(current) == set(pack_ids):
            continue
        row = update_record(AGENTS_TABLE, agent_id, {"Context Packs": pack_ids}, token_role="write")
        linked.append(
            {
                "id": agent_id,
                "agent_name": row.get("fields", {}).get("Agent Name"),
                "context_packs": pack_ids,
            }
        )
    return linked


def write_schema() -> None:
    tables = get_meta_tables()
    schema = json.loads(SCHEMA_PATH.read_text(encoding="utf-8"))
    schema["generated_at"] = datetime.now(timezone.utc).isoformat()
    schema["tables"]["Agent Environments"] = {
        "id": tables[AGENTS_TABLE]["id"],
        "name": AGENTS_TABLE,
        "fields": {
            field["name"]: {
                "id": field["id"],
                "name": field["name"],
                "type": field["type"],
            }
            for field in tables[AGENTS_TABLE].get("fields", [])
        },
    }
    SCHEMA_PATH.write_text(json.dumps(schema, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


def audit_links(records: list[dict[str, Any]]) -> list[dict[str, Any]]:
    report: list[dict[str, Any]] = []
    for record in records:
        fields = record.get("fields") or {}
        packs = fields.get("Context Packs") or []
        report.append(
            {
                "id": record["id"],
                "agent_name": fields.get("Agent Name"),
                "repo_path": fields.get("Repo Path") or "",
                "pack_count": len(packs),
                "pack_ids": packs,
            }
        )
    return report


def main() -> None:
    load_dotenv()
    token_for_role("write")
    tables = get_meta_tables()
    ensure_repo_path_field(tables)
    write_schema()
    records = list_agents()
    paths_updated = populate_repo_paths(records)
    packs_linked = ensure_pack_links()
    records = list_agents()
    write_schema()
    print(
        json.dumps(
            {
                "success": True,
                "repo_paths_updated": paths_updated,
                "pack_links_refreshed": packs_linked,
                "agent_audit": audit_links(records),
                "schema_path": str(SCHEMA_PATH),
            },
            ensure_ascii=False,
            indent=2,
        )
    )


if __name__ == "__main__":
    main()
