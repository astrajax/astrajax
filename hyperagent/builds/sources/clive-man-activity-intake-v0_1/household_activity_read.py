#!/usr/bin/env python3
"""Household Activity source reader — GET-only on Sessions + Activity.

Pen: HOUSEHOLD_ACTIVITY_READ (future mint). Rejects writes, Reports table, and
any table outside the phase-one allowlist.
"""

from __future__ import annotations

import argparse
import json
import os
import sys
import time
import urllib.error
import urllib.request
from typing import Any

from household_activity_config import (
    ACT,
    ACTIVITY_TABLE,
    ALLOWED_HTTP_METHODS,
    CRED_ROLE_GET_TABLES,
    CRED_ROLE_READ,
    FORBIDDEN_HOUSEHOLD_TABLES,
    HA,
    HOUSEHOLD_BASE_ID,
    READ_ALLOWED_TABLES,
    READ_CRED_ENV,
    REPORTS_TABLE,
    SESSIONS_TABLE,
)

API = "https://api.airtable.com/v0"


class ReadPenError(Exception):
    pass


def _table_from_path(path: str) -> str | None:
    parts = path.strip("/").split("/")
    if len(parts) >= 2 and parts[0] == HOUSEHOLD_BASE_ID.lstrip("/"):
        return parts[1].split("?")[0]
    return None


def enforce_read_path(method: str, path: str) -> None:
    if method != "GET":
        raise ReadPenError(f"HOUSEHOLD_ACTIVITY_READ allows GET only (got {method!r})")
    if method not in ALLOWED_HTTP_METHODS:
        raise ReadPenError(f"forbidden HTTP method {method!r}")
    table = _table_from_path(path)
    if not table:
        if HOUSEHOLD_BASE_ID not in path:
            raise ReadPenError(f"read pen limited to base {HOUSEHOLD_BASE_ID!r}")
        return
    if table in FORBIDDEN_HOUSEHOLD_TABLES:
        raise ReadPenError(f"Reports table {REPORTS_TABLE!r} excluded in phase one")
    allowed = CRED_ROLE_GET_TABLES[CRED_ROLE_READ]
    if table not in allowed:
        raise ReadPenError(
            f"read pen may not GET table {table!r}; allowed: {sorted(allowed)}"
        )


def airtable_get(path: str, *, dry_run: bool = False) -> dict[str, Any]:
    enforce_read_path("GET", path)
    if dry_run:
        return {"records": [], "dry_run": True, "path": path}
    token = os.environ.get(READ_CRED_ENV, "")
    if not token:
        raise ReadPenError(f"{READ_CRED_ENV} not present (UNVERIFIED until minted)")
    url = f"{API}{path}"
    headers = {"Authorization": f"Bearer {token}"}
    attempt = 0
    while True:
        req = urllib.request.Request(url, headers=headers, method="GET")
        try:
            with urllib.request.urlopen(req, timeout=30) as resp:
                return json.loads(resp.read().decode("utf-8") or "{}")
        except urllib.error.HTTPError as exc:
            if exc.code == 429 and attempt < 3:
                time.sleep((2, 4, 8)[min(attempt, 2)])
                attempt += 1
                continue
            detail = exc.read().decode("utf-8", errors="replace")[:500]
            raise ReadPenError(f"Airtable HTTP {exc.code} on GET {path}: {detail}") from exc


def _field_text(fields: dict[str, Any], fid: str) -> str:
    val = fields.get(fid)
    if val is None:
        return ""
    if isinstance(val, list):
        return str(val[0]) if val else ""
    return str(val).strip()


def list_sessions(*, dry_run: bool = False, page_size: int = 100) -> list[dict[str, Any]]:
    rows: list[dict[str, Any]] = []
    offset = None
    while True:
        q = f"/{HOUSEHOLD_BASE_ID}/{SESSIONS_TABLE}?pageSize={page_size}&returnFieldsByFieldId=true"
        for fid in HA.values():
            q += f"&fields[]={fid}"
        if offset:
            q += f"&offset={offset}"
        res = airtable_get(q, dry_run=dry_run)
        rows.extend(res.get("records") or [])
        offset = res.get("offset")
        if not offset:
            break
    return rows


def list_activity(*, dry_run: bool = False, page_size: int = 100) -> list[dict[str, Any]]:
    rows: list[dict[str, Any]] = []
    offset = None
    while True:
        q = f"/{HOUSEHOLD_BASE_ID}/{ACTIVITY_TABLE}?pageSize={page_size}&returnFieldsByFieldId=true"
        for fid in ACT.values():
            q += f"&fields[]={fid}"
        if offset:
            q += f"&offset={offset}"
        res = airtable_get(q, dry_run=dry_run)
        rows.extend(res.get("records") or [])
        offset = res.get("offset")
        if not offset:
            break
    return rows


def session_agent_slug(session_fields: dict[str, Any]) -> str:
    return _field_text(session_fields, HA["agent_slug"])


def activity_event_type(activity_fields: dict[str, Any]) -> str:
    raw = activity_fields.get(ACT["event_type"])
    if isinstance(raw, dict):
        return str(raw.get("name") or raw.get("id") or "")
    return str(raw or "").strip()


def activity_user_message(activity_fields: dict[str, Any]) -> str:
    return _field_text(activity_fields, ACT["user_message"])


def activity_reply_digest(activity_fields: dict[str, Any]) -> str:
    return _field_text(activity_fields, ACT["reply_digest"])


def activity_session_record_id(activity_fields: dict[str, Any]) -> str:
    link = activity_fields.get(ACT["session_link"])
    if isinstance(link, list) and link:
        return str(link[0])
    sid = _field_text(activity_fields, ACT["session_id"])
    return sid if sid.startswith("rec") else ""


def main() -> int:
    parser = argparse.ArgumentParser(description="Household Activity GET-only reader")
    parser.add_argument("--table", choices=("sessions", "activity", "both"), default="both")
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--json-only", action="store_true")
    args = parser.parse_args()

    out: dict[str, Any] = {"pen": READ_CRED_ENV, "base_id": HOUSEHOLD_BASE_ID}
    if args.table in ("sessions", "both"):
        out["sessions"] = list_sessions(dry_run=args.dry_run)
    if args.table in ("activity", "both"):
        out["activity"] = list_activity(dry_run=args.dry_run)

    if args.json_only:
        print(json.dumps(out, ensure_ascii=False, indent=2))
    else:
        print(json.dumps({"counts": {k: len(v) for k, v in out.items() if isinstance(v, list)}}, indent=2))
    return 0


if __name__ == "__main__":
    sys.exit(main())
