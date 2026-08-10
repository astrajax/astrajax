#!/usr/bin/env python3
"""Ristral cursor-write helper (D1) — Scout Watch Roster Last Scanned only.

Structural bound (Pam D1; mirrors the Context Amendment Execute rail):

- Field-ID allowlist containing exactly `Last Scanned`. A payload naming any
  other field is structurally refused BEFORE any write.
- Whole-call preflight -> write -> readback-by-field-ID with exact compare ->
  append-only change-log row per cursor write.
- Scoped credential (create+update on the Workshop base ONLY), injected as env
  var RISTRAL_SCOUT_CURSOR_WRITE at run time (RunWithCredentials pattern),
  never printed or logged.

Usage (staged payload):
  RISTRAL_SCOUT_CURSOR_WRITE=... python3 ristral_cursor_write.py --payload /tmp/cursor.json

Payload shape:
  {"record_id": "recXXXXXXXXXXXXXX", "fields": {"Last Scanned": "YYYY-MM-DD"}}

Only the single field "Last Scanned" is permitted. Any other key aborts the
whole call before any network write.
"""

from __future__ import annotations

import argparse
import json
import os
import sys
import urllib.error
import urllib.request
from datetime import datetime, timezone

WORKSHOP_BASE_ID = "appL2fdnGmhA02WXd"  # AstraJax Brain Workshop base
ROSTER_TABLE_PLACEHOLDER = "SCOUT_WATCH_ROSTER_TABLE_ID"
CHANGE_LOG_TABLE_PLACEHOLDER = "SCOUT_CHANGE_LOG_TABLE_ID"
ROSTER_TABLE_ID = os.environ.get("RISTRAL_SCOUT_ROSTER_TABLE_ID", ROSTER_TABLE_PLACEHOLDER)
CHANGE_LOG_TABLE_ID = os.environ.get(
    "RISTRAL_SCOUT_CHANGE_LOG_TABLE_ID", CHANGE_LOG_TABLE_PLACEHOLDER
)

# The structural allowlist: exactly one field name is writable through this rail.
ALLOWLIST_FIELD_NAMES = ("Last Scanned",)

_API = "https://api.airtable.com/v0"


def _fail(message: str) -> None:
    # Never echo the token; only ever print a safe failure reason.
    print(f"ristral_cursor_write: FAIL — {message}", file=sys.stderr)
    sys.exit(1)


def _require_table_id(table_id: str, env_key: str, placeholder: str) -> str:
    if table_id == placeholder or not table_id.startswith("tbl"):
        _fail(
            f"{env_key} not configured — set after Ruth resolves scout table ids "
            f"(expected Airtable table id tbl...)"
        )
    return table_id


def _token() -> str:
    token = os.environ.get("RISTRAL_SCOUT_CURSOR_WRITE")
    if not token:
        _fail("RISTRAL_SCOUT_CURSOR_WRITE env var not set (RunWithCredentials)")
    return token


def _request(method: str, url: str, body: dict | None = None) -> dict:
    data = None
    headers = {
        "Authorization": f"Bearer {_token()}",
        "Content-Type": "application/json",
    }
    if body is not None:
        data = json.dumps(body).encode("utf-8")
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as exc:
        # Do not surface response bodies that might echo request metadata.
        _fail(f"HTTP {exc.code} on {method} {url.split('/v0/')[-1]}")
    except urllib.error.URLError as exc:
        _fail(f"network error: {exc.reason}")


def _resolve_last_scanned_field_id(roster_table_id: str) -> str:
    """Resolve the Last Scanned field ID from the live schema (name -> id)."""
    url = f"{_API}/meta/bases/{WORKSHOP_BASE_ID}/tables"
    schema = _request("GET", url)
    for table in schema.get("tables", []):
        if table.get("id") == roster_table_id:
            for field in table.get("fields", []):
                if field.get("name") == "Last Scanned":
                    return field.get("id")
    _fail("could not resolve 'Last Scanned' field ID on the roster table")


def _preflight(payload: dict) -> tuple[str, dict]:
    """Whole-call preflight. Refuse any field outside the allowlist BEFORE write."""
    if not isinstance(payload, dict):
        _fail("payload must be an object")
    record_id = payload.get("record_id")
    fields = payload.get("fields")
    if not isinstance(record_id, str) or not record_id.startswith("rec"):
        _fail("payload.record_id must be an Airtable record id (rec...)")
    if not isinstance(fields, dict) or not fields:
        _fail("payload.fields must be a non-empty object")

    requested = set(fields.keys())
    not_allowed = requested - set(ALLOWLIST_FIELD_NAMES)
    if not_allowed:
        _fail(
            "field(s) outside the Last Scanned allowlist refused before any "
            f"write: {sorted(not_allowed)}"
        )
    if requested != set(ALLOWLIST_FIELD_NAMES):
        _fail("payload.fields must contain exactly the Last Scanned field")
    value = fields["Last Scanned"]
    if not isinstance(value, str):
        _fail("Last Scanned must be an ISO date string (YYYY-MM-DD)")
    return record_id, {"Last Scanned": value}


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--payload", required=True, help="path to the JSON payload")
    args = parser.parse_args()

    try:
        with open(args.payload, encoding="utf-8") as handle:
            payload = json.load(handle)
    except (OSError, json.JSONDecodeError) as exc:
        _fail(f"cannot read payload: {exc}")

    # 1. Whole-call preflight (structural allowlist enforced before any write).
    record_id, safe_fields = _preflight(payload)
    _token()  # fail fast before table-id or network work
    roster_table_id = _require_table_id(
        ROSTER_TABLE_ID, "RISTRAL_SCOUT_ROSTER_TABLE_ID", ROSTER_TABLE_PLACEHOLDER
    )
    change_log_table_id = _require_table_id(
        CHANGE_LOG_TABLE_ID,
        "RISTRAL_SCOUT_CHANGE_LOG_TABLE_ID",
        CHANGE_LOG_TABLE_PLACEHOLDER,
    )
    field_id = _resolve_last_scanned_field_id(roster_table_id)

    # 2. Write by FIELD ID (never by name) so the allowlist binding is exact.
    write_url = f"{_API}/{WORKSHOP_BASE_ID}/{roster_table_id}/{record_id}"
    written = _request(
        "PATCH",
        write_url,
        {"fields": {field_id: safe_fields["Last Scanned"]}},
    )

    # 3. Readback-by-field-ID with exact compare.
    readback = _request("GET", write_url + "?fields%5B%5D=" + field_id)
    got = readback.get("fields", {}).get("Last Scanned")
    if got != safe_fields["Last Scanned"]:
        _fail(
            "readback mismatch on Last Scanned: wrote "
            f"{safe_fields['Last Scanned']!r}, read {got!r}"
        )

    # 4. Append-only change-log row per cursor write (create-only).
    log_url = f"{_API}/{WORKSHOP_BASE_ID}/{change_log_table_id}"
    _request(
        "POST",
        log_url,
        {
            "records": [
                {
                    "fields": {
                        "Record": record_id,
                        "Field": "Last Scanned",
                        "New Value": safe_fields["Last Scanned"],
                        "Written At": datetime.now(timezone.utc).isoformat(),
                        "Actor": "ristral",
                        "Write ID": written.get("id", record_id),
                    }
                }
            ]
        },
    )

    print(
        "ristral_cursor_write: OK — Last Scanned advanced to "
        f"{safe_fields['Last Scanned']} on {record_id} (readback verified, logged)"
    )


if __name__ == "__main__":
    main()
