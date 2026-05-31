#!/usr/bin/env python3
"""Shared Airtable helpers for Clive Context Architecture V2 scripts."""

from __future__ import annotations

import hashlib
import json
import os
import sys
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Literal

BASE_ID = "appYv601Oq7fKTCj0"
REPO_ROOT = Path(__file__).resolve().parents[2]
SCHEMA_PATH = Path(__file__).resolve().parents[1] / "context_architecture_schema_v1.json"
AUDIT_MIRROR_PATH = REPO_ROOT / "docs" / "context" / "audit" / "audit.jsonl"
ENV_PATH = REPO_ROOT / ".env"

TokenRole = Literal["read", "write", "approver"]


def fail(message: str, code: int = 1) -> None:
    print(json.dumps({"success": False, "error": message}))
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


def token_for_role(role: TokenRole) -> str:
    load_dotenv()
    if role == "read":
        token = os.environ.get("AIRTABLE_READ_TOKEN") or os.environ.get("AIRTABLE_API_KEY")
        if not token:
            fail("AIRTABLE_READ_TOKEN not set")
        return token
    if role == "write":
        token = os.environ.get("AIRTABLE_WRITE_TOKEN") or os.environ.get("AIRTABLE_API_KEY")
        if not token:
            fail("AIRTABLE_WRITE_TOKEN not set")
        return token
    token = os.environ.get("AIRTABLE_APPROVER_TOKEN")
    if not token:
        fail("AIRTABLE_APPROVER_TOKEN not set")
    return token


def load_schema() -> dict[str, Any]:
    if not SCHEMA_PATH.exists():
        fail(f"Schema file missing: {SCHEMA_PATH}")
    return json.loads(SCHEMA_PATH.read_text(encoding="utf-8"))


def table_id(table_name: str) -> str:
    schema = load_schema()
    try:
        return schema["tables"][table_name]["id"]
    except KeyError:
        fail(f"Table not found in schema: {table_name}")


def field_names(table_name: str) -> set[str]:
    schema = load_schema()
    try:
        return set(schema["tables"][table_name]["fields"])
    except KeyError:
        fail(f"Fields not found in schema for table: {table_name}")


def allowed_values(key: str) -> list[str]:
    schema = load_schema()
    values = schema.get("allowed_values", {}).get(key)
    if not values:
        fail(f"Allowed values missing in schema for: {key}")
    return values


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def request_json(
    method: str,
    table_or_path: str,
    data: dict[str, Any] | None = None,
    query: dict[str, Any] | None = None,
    *,
    token_role: TokenRole = "read",
) -> dict[str, Any]:
    path = table_or_path
    if query:
        path += "?" + urllib.parse.urlencode(query, doseq=True)
    url = f"https://api.airtable.com/v0/{BASE_ID}/{path}"
    headers = {
        "Authorization": f"Bearer {token_for_role(token_role)}",
        "Content-Type": "application/json",
    }
    body = json.dumps(data).encode("utf-8") if data is not None else None
    req = urllib.request.Request(url, data=body, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req) as resp:
            raw = resp.read().decode("utf-8")
            return json.loads(raw) if raw else {}
    except urllib.error.HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="replace")
        fail(f"Airtable API error ({exc.code}): {detail}")


def meta_request_json(method: str, path: str, data: dict[str, Any] | None = None) -> dict[str, Any]:
    url = f"https://api.airtable.com/v0/meta/bases/{BASE_ID}/{path}"
    headers = {
        "Authorization": f"Bearer {token_for_role('write')}",
        "Content-Type": "application/json",
    }
    body = json.dumps(data).encode("utf-8") if data is not None else None
    req = urllib.request.Request(url, data=body, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req) as resp:
            raw = resp.read().decode("utf-8")
            return json.loads(raw) if raw else {}
    except urllib.error.HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="replace")
        fail(f"Airtable meta API error ({exc.code}): {detail}")


def escape_formula(value: str) -> str:
    return value.replace("'", "\\'").replace('"', '\\"')


def eq_clause(field_name: str, value: str) -> str:
    return f"{{{field_name}}}='{escape_formula(value)}'"


def and_formula(clauses: list[str]) -> str | None:
    clauses = [clause for clause in clauses if clause]
    if not clauses:
        return None
    if len(clauses) == 1:
        return clauses[0]
    return "AND(" + ",".join(clauses) + ")"


def validate_single_select(field_key: str, value: str) -> None:
    if value not in allowed_values(field_key):
        fail(f"Invalid select value for {field_key}: {value}")


def validate_multi_select(field_key: str, values: list[str]) -> None:
    allowed = set(allowed_values(field_key))
    invalid = [value for value in values if value not in allowed]
    if invalid:
        fail(f"Invalid select values for {field_key}: {', '.join(invalid)}")


def list_records(
    table_name: str,
    *,
    fields: list[str] | None = None,
    formula: str | None = None,
    max_records: int = 20,
    sort_field: str | None = None,
) -> list[dict[str, Any]]:
    query: dict[str, Any] = {"maxRecords": max_records}
    if fields:
        query["fields[]"] = fields
    if formula:
        query["filterByFormula"] = formula
    if sort_field:
        query["sort[0][field]"] = sort_field
        query["sort[0][direction]"] = "desc"
    result = request_json("GET", table_id(table_name), query=query, token_role="read")
    return [
        {
            "id": record["id"],
            "createdTime": record.get("createdTime"),
            "fields": record.get("fields", {}),
            "url": f"https://airtable.com/{BASE_ID}/{table_id(table_name)}/{record['id']}",
        }
        for record in result.get("records", [])
    ]


def find_record_by_title(table_name: str, title: str) -> dict[str, Any] | None:
    records = list_records(
        table_name,
        formula=eq_clause("Title", title) if table_name == "Context Items" else eq_clause("Pack Name", title),
        max_records=1,
        fields=["Title", "Status", "Created By", "Confirmed By Human", "Source Intake", "Bootstrap Source"],
    )
    return records[0] if records else None


def create_record(table_name: str, fields: dict[str, Any], *, token_role: TokenRole = "write") -> dict[str, Any]:
    result = request_json(
        "POST",
        table_id(table_name),
        {"records": [{"fields": fields}]},
        token_role=token_role,
    )
    records = result.get("records") or []
    if not records:
        fail("Airtable create returned no records")
    return records[0]


def update_record(
    table_name: str,
    record_id: str,
    fields: dict[str, Any],
    *,
    token_role: TokenRole = "write",
) -> dict[str, Any]:
    allowed = field_names(table_name)
    payload_fields = {key: value for key, value in fields.items() if key in allowed}
    result = request_json(
        "PATCH",
        table_id(table_name),
        {"records": [{"id": record_id, "fields": payload_fields}]},
        token_role=token_role,
    )
    records = result.get("records") or []
    if not records:
        fail("Airtable update returned no records")
    return records[0]


def clean_fields(table_name: str, fields: dict[str, Any]) -> dict[str, Any]:
    allowed = field_names(table_name)
    cleaned: dict[str, Any] = {}
    for key, value in fields.items():
        if key not in allowed:
            continue
        if value in (None, "", [], {}):
            continue
        cleaned[key] = value
    return cleaned


def canonical_json(data: dict[str, Any]) -> str:
    return json.dumps(data, sort_keys=True, ensure_ascii=False, separators=(",", ":"))


def compute_entry_hash(entry: dict[str, Any], prev_hash: str) -> str:
    payload = {"entry": entry, "prev_hash": prev_hash}
    return hashlib.sha256(canonical_json(payload).encode("utf-8")).hexdigest()


def latest_change_log_entry() -> dict[str, Any] | None:
    records = list_records(
        "Change Log",
        fields=["Change Summary", "Entry Hash", "Prev Hash", "Status", "Created at"],
        max_records=1,
        sort_field="Created at",
    )
    return records[0] if records else None


def append_audit_mirror(record_id: str, fields: dict[str, Any]) -> None:
    AUDIT_MIRROR_PATH.parent.mkdir(parents=True, exist_ok=True)
    mirror = {
        "record_id": record_id,
        "mirrored_at": now_iso(),
        "fields": fields,
    }
    with AUDIT_MIRROR_PATH.open("a", encoding="utf-8") as handle:
        handle.write(canonical_json(mirror) + "\n")


def item_has_traceability(fields: dict[str, Any]) -> bool:
    source_intake = fields.get("Source Intake") or []
    bootstrap_source = (fields.get("Bootstrap Source") or "").strip()
    return bool(source_intake) or bool(bootstrap_source)


def bootstrap_item_ids() -> list[str]:
    return [
        "recvWCNlwxlwqrQ0i",
        "reckhCIz5AFhFhag4",
        "rec4E2xltxXeCsicl",
        "recoWcmc9fSwMwmDL",
        "recuOM7itdyK3LBhS",
        "recJabWSwJbZASaCq",
        "recPQzHHxvayexRre",
        "recUJaurBEHabB9DX",
    ]
