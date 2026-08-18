#!/usr/bin/env python3
"""Read-only evidence helper for on-demand Proposer/Challenger.

Credential: CLIVE_MAN_WORKSHOP_READ — GET-only allowlist across Workshop,
Registry Brains discovery, and active Trusted Brain Truth tables.
"""

from __future__ import annotations

import argparse
import json
import os
import sys
import urllib.error
import urllib.parse
import urllib.request
from typing import Any

from clive_man_config import (
    BASE_REGISTRY,
    BASE_WORKSHOP,
    BR,
    CRED_READ,
    F_PROJECT,
    PROJECT_LIFECYCLE_ACTIVE,
    READ_TABLES,
    T_PROJECTS,
    T_REGISTRY_BRAINS,
)

API = "https://api.airtable.com/v0"


class ReadError(Exception):
    pass


class WriteRefused(ReadError):
    pass


def _token() -> str:
    tok = os.environ.get(CRED_READ, "")
    if not tok:
        raise ReadError(f"credential {CRED_READ} not present")
    return tok


def _req(method: str, path: str, token: str, body: dict[str, Any] | None = None) -> dict[str, Any]:
    if method != "GET":
        raise WriteRefused(f"{method} forbidden — read credential is GET-only")
    url = f"{API}{path}"
    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
    req = urllib.request.Request(url, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            return json.loads(resp.read().decode("utf-8") or "{}")
    except urllib.error.HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="replace")[:400]
        raise ReadError(f"Airtable HTTP {exc.code}: {detail}") from exc


def _sel(v):
    return v.get("name") if isinstance(v, dict) else v


def discover_trusted_allowlist(token: str) -> dict[str, set[str]]:
    """Registry Brains → active trusted base/table IDs only."""
    rows: list[dict] = []
    offset = None
    while True:
        q = f"/{BASE_REGISTRY}/{T_REGISTRY_BRAINS}?pageSize=100&returnFieldsByFieldId=true"
        if offset:
            q += f"&offset={offset}"
        res = _req("GET", q, token)
        rows.extend(res.get("records") or [])
        offset = res.get("offset")
        if not offset:
            break
    allow: dict[str, set[str]] = {}
    for rec in rows:
        f = rec.get("fields") or {}
        if _sel(f.get(BR["status"])) != "Active":
            continue
        base_id = f.get(BR["trusted_base_id"])
        if not base_id:
            continue
        allow.setdefault(base_id, set())
    return allow


def _validate_read_target(base_id: str, table_id: str, token: str) -> None:
    if base_id == BASE_WORKSHOP and table_id in READ_TABLES:
        return
    if base_id == BASE_REGISTRY and table_id == T_REGISTRY_BRAINS:
        return
    trusted = discover_trusted_allowlist(token)
    if base_id in trusted:
        return
    raise ReadError(f"read target {base_id}/{table_id} not in allowlist")


def read_record(base_id: str, table_id: str, record_id: str, token: str | None = None) -> dict[str, Any]:
    tok = token or _token()
    _validate_read_target(base_id, table_id, tok)
    path = f"/{base_id}/{table_id}/{record_id}?returnFieldsByFieldId=true"
    return _req("GET", path, tok)


def read_evidence(
    table_id: str,
    record_id: str,
    *,
    base_id: str = BASE_WORKSHOP,
    token: str | None = None,
) -> dict[str, Any]:
    tok = token or _token()
    rec = read_record(base_id, table_id, record_id, tok)
    return {
        "base_id": base_id,
        "table_id": table_id,
        "record_id": record_id,
        "fields": rec.get("fields") or {},
    }


def list_active_projects(token: str | None = None) -> list[dict[str, str]]:
    """Live Active Projects only. A read for Clive's Man the HEAD (Sol). Never create.

    Cheap proposer/executor must not use this list to choose a link.
    """
    tok = token or _token()
    _validate_read_target(BASE_WORKSHOP, T_PROJECTS, tok)
    rows: list[dict[str, str]] = []
    offset = None
    formula = urllib.parse.quote("{Lifecycle}='Active'")
    while True:
        path = (
            f"/{BASE_WORKSHOP}/{T_PROJECTS}"
            f"?filterByFormula={formula}"
            f"&pageSize=100&returnFieldsByFieldId=true"
        )
        if offset:
            path += f"&offset={offset}"
        res = _req("GET", path, tok)
        for rec in res.get("records") or []:
            fields = rec.get("fields") or {}
            rid = str(rec.get("id") or "").strip()
            if not rid.startswith("rec"):
                continue
            lifecycle = _sel(fields.get(F_PROJECT["lifecycle"]) or fields.get("Lifecycle"))
            if lifecycle != PROJECT_LIFECYCLE_ACTIVE:
                continue
            name = fields.get(F_PROJECT["project_name"]) or fields.get("Project Name") or ""
            rows.append({"record_id": rid, "project_name": str(name).strip()})
        offset = res.get("offset")
        if not offset:
            break
    return rows


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--list-active-projects", action="store_true")
    parser.add_argument("--table")
    parser.add_argument("--record")
    parser.add_argument("--base", default=BASE_WORKSHOP)
    args = parser.parse_args()
    try:
        if args.list_active_projects:
            print(json.dumps({"projects": list_active_projects()}, ensure_ascii=False))
            return
        if not args.table or not args.record:
            parser.error("--table and --record are required unless --list-active-projects")
        print(json.dumps(read_evidence(args.table, args.record, base_id=args.base), ensure_ascii=False))
    except (ReadError, WriteRefused) as exc:
        print(json.dumps({"ok": False, "error": str(exc)}))
        sys.exit(1)


if __name__ == "__main__":
    main()
