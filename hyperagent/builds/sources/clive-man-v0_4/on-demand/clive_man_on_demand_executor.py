#!/usr/bin/env python3
"""On-demand Clive's Man Executor pen — Option 3 Lane A/B only."""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import sys
import time
import urllib.error
import urllib.request
from typing import Any

from clive_man_config import (
    ALLOWED_DRAFT_STATUSES,
    BACKOFF_SECONDS,
    BASE_WORKSHOP,
    BI,
    BI_ALLOWED_FIELDS,
    CAPTURE_SOURCE_CHAT,
    CAPTURE_SOURCE_CHOICES,
    CRED_WRITE,
    DRAFT_ALLOWED_FIELDS,
    DRAFT_CREATE_FIELDS,
    F,
    FORBIDDEN_DRAFT_STATUSES,
    FORBIDDEN_ORIGINS,
    LANE_A_MAX_CREATES,
    LANE_A_SOURCE_CLASSES,
    MAX_429_RETRIES,
    T_BRAIN_INTERACTIONS,
    T_DRAFT_TRUTH,
    WRITE_TABLES,
)
from lane_a_allowlist import LANE_A_SOURCE_ACTORS

API = "https://api.airtable.com/v0"


class PenError(Exception):
    pass


def _token_required() -> bool:
    return os.environ.get(CRED_WRITE, "") != ""


def _token() -> str:
    tok = os.environ.get(CRED_WRITE, "")
    if not tok:
        raise PenError(f"credential {CRED_WRITE} not present")
    return tok


def _req(
    method: str,
    path: str,
    token: str,
    body: dict[str, Any] | None = None,
    *,
    dry_run: bool = False,
) -> dict[str, Any]:
    if dry_run and method != "GET":
        return {"dry_run": True, "method": method, "path": path}
    url = f"{API}{path}"
    data = json.dumps(body).encode("utf-8") if body is not None else None
    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
    attempt = 0
    while True:
        req = urllib.request.Request(url, data=data, headers=headers, method=method)
        try:
            with urllib.request.urlopen(req, timeout=30) as resp:
                return json.loads(resp.read().decode("utf-8") or "{}")
        except urllib.error.HTTPError as exc:
            if exc.code == 429 and attempt < MAX_429_RETRIES:
                time.sleep(BACKOFF_SECONDS[min(attempt, len(BACKOFF_SECONDS) - 1)])
                attempt += 1
                continue
            detail = exc.read().decode("utf-8", errors="replace")[:400]
            raise PenError(f"Airtable HTTP {exc.code}: {detail}") from exc


def _canonical(fields: dict[str, Any]) -> str:
    return json.dumps(fields, sort_keys=True, separators=(",", ":"), ensure_ascii=False)


def _hash_fields(fields: dict[str, Any]) -> str:
    return hashlib.sha256(_canonical(fields).encode()).hexdigest()


def _sel(v):
    return v.get("name") if isinstance(v, dict) else v


def _lane_a_actor_ok(source_actor: str | None) -> bool:
    if not source_actor:
        return False
    return source_actor in LANE_A_SOURCE_ACTORS


def _canonical_json(payload: dict[str, Any]) -> str:
    return json.dumps(payload, sort_keys=True, separators=(",", ":"), ensure_ascii=False)


def _payload_hash(payload: dict[str, Any]) -> str:
    return hashlib.sha256(_canonical_json(payload).encode()).hexdigest()


def validate_lane_a(brief: dict[str, Any]) -> list[str]:
    errors: list[str] = []
    if not brief.get("verbatim"):
        errors.append("Lane A requires verbatim=true")
    if brief.get("content_judgement"):
        errors.append("Lane A requires content_judgement=false")
    source_class = brief.get("source_class")
    if source_class not in LANE_A_SOURCE_CLASSES:
        errors.append(f"Lane A source_class must be human or household_agent, got {source_class!r}")
    origin = (brief.get("origin") or "").lower()
    if origin in FORBIDDEN_ORIGINS:
        errors.append(f"Lane A origin {origin!r} forbidden")
    if not _lane_a_actor_ok(brief.get("source_actor")):
        errors.append("Lane A requires source_actor Matthew/Tara-Lee or named household agent")
    actions = brief.get("actions") or []
    if len(actions) > LANE_A_MAX_CREATES:
        errors.append(f"Lane A allows at most {LANE_A_MAX_CREATES} creates")
    if not actions:
        errors.append("actions required")
    for action in actions:
        if action.get("operation") != "create":
            errors.append("Lane A is create-only")
        if action.get("table_id") != T_DRAFT_TRUTH:
            errors.append("Lane A writes Draft Brain Truth only")
        if action.get("table_id") == T_BRAIN_INTERACTIONS:
            errors.append("Lane A cannot patch Brain Interactions")
    return errors


def validate_lane_b(brief: dict[str, Any]) -> list[str]:
    errors: list[str] = []
    handoff = brief.get("proposer_handoff")
    if not isinstance(handoff, dict) or not handoff:
        errors.append("Lane B requires complete proposer_handoff")
    verdict = brief.get("challenger_verdict")
    if verdict != "proceed":
        errors.append(f"Lane B requires challenger_verdict=proceed, got {verdict!r}")
    top_actions = brief.get("actions") or []
    final_brief = brief.get("final_brief")
    if not isinstance(final_brief, dict) or not final_brief:
        errors.append("Lane B requires final_brief object")
        return errors
    if "actions" not in final_brief:
        errors.append("final_brief must contain actions")
    elif final_brief.get("actions") != top_actions:
        errors.append("final_brief.actions must equal top-level actions")
    if not handoff:
        return errors
    expected_handoff_hash = final_brief.get("proposer_handoff_hash")
    actual_handoff_hash = _payload_hash(handoff)
    if not expected_handoff_hash:
        errors.append("final_brief requires proposer_handoff_hash")
    elif expected_handoff_hash != actual_handoff_hash:
        errors.append("proposer_handoff_hash mismatch")
    expected_hash = brief.get("final_brief_hash")
    if not expected_hash:
        errors.append("Lane B requires final_brief_hash")
    else:
        actual = _payload_hash(final_brief)
        if actual != expected_hash:
            errors.append("final_brief_hash mismatch")
    if not top_actions:
        errors.append("actions required")
    return errors


def validate_brief(brief: dict[str, Any]) -> list[str]:
    lane = brief.get("lane")
    if lane not in ("A", "B"):
        return ["lane must be A or B"]
    if lane == "A":
        return validate_lane_a(brief)
    return validate_lane_b(brief)


def _validate_action(action: dict[str, Any], *, lane: str) -> list[str]:
    errors: list[str] = []
    op = action.get("operation")
    table = action.get("table_id")
    if table not in WRITE_TABLES:
        errors.append(f"forbidden write table {table!r}")
    if op == "delete":
        errors.append("delete forbidden")
    if op not in ("create", "patch"):
        errors.append(f"unsupported operation {op!r}")
    fields = action.get("fields") or {}
    if table == T_DRAFT_TRUTH:
        status = fields.get(F["status"])
        if status in FORBIDDEN_DRAFT_STATUSES:
            errors.append(f"forbidden Draft status {status!r}")
        if status and status not in ALLOWED_DRAFT_STATUSES:
            errors.append(f"Draft status must be Draft or Quarantined, got {status!r}")
        unknown = [k for k in fields if k not in DRAFT_ALLOWED_FIELDS]
        if unknown:
            errors.append(f"unknown Draft field ids: {unknown}")
        if op == "create":
            if lane == "A":
                if not fields.get(F["canonical_text"]):
                    errors.append("Lane A create requires canonical_text")
            cs = fields.get(F["capture_source"])
            cs_name = _sel(cs) if isinstance(cs, dict) else cs
            if cs_name and cs_name not in CAPTURE_SOURCE_CHOICES:
                errors.append("capture_source must be exact allowed choice name")
            fields.setdefault(F["status"], "Draft")
            if lane == "A" and not cs_name:
                fields[F["capture_source"]] = CAPTURE_SOURCE_CHAT
    if table == T_BRAIN_INTERACTIONS:
        unknown = [k for k in fields if k not in BI_ALLOWED_FIELDS]
        if unknown:
            errors.append(f"Brain Interaction patch allows review fields only: {unknown}")
        if lane == "A":
            errors.append("Lane A cannot patch Brain Interactions")
    if op == "patch":
        if lane == "A":
            errors.append("Lane A cannot patch Draft records")
        if not action.get("record_id"):
            errors.append("patch requires record_id")
        if not action.get("before_snapshot"):
            errors.append("patch requires before_snapshot")
        if not action.get("before_hash"):
            errors.append("patch requires before_hash")
    return errors


def validate_brief_full(brief: dict[str, Any]) -> list[str]:
    errors = validate_brief(brief)
    lane = brief.get("lane")
    for action in brief.get("actions") or []:
        errors.extend(_validate_action(action, lane=lane))
    if lane == "A" and not brief.get("idempotency_key"):
        errors.append("Lane A requires deterministic idempotency_key")
    return errors


def preview(brief: dict[str, Any]) -> dict[str, Any]:
    errs = validate_brief_full(brief)
    return {
        "ok": not errs,
        "errors": errs,
        "lane": brief.get("lane"),
        "action_count": len(brief.get("actions") or []),
        "idempotency_key": brief.get("idempotency_key"),
    }


def _idempotency_key(brief: dict[str, Any]) -> str:
    if brief.get("idempotency_key"):
        return str(brief["idempotency_key"])
    payload = json.dumps(brief.get("actions") or [], sort_keys=True)
    return hashlib.sha256(payload.encode()).hexdigest()


def _dedupe_create_fields(fields: dict[str, Any], token: str, *, dry_run: bool) -> str | None:
    if dry_run:
        return None
    q = f"/{BASE_WORKSHOP}/{T_DRAFT_TRUTH}?pageSize=100&returnFieldsByFieldId=true"
    for fid in (F["canonical_text"], F["title"], F["brain_slug"], F["capture_source"]):
        q += f"&fields[]={fid}"
    res = _req("GET", q, token)
    canon = fields.get(F["canonical_text"])
    title = fields.get(F["title"])
    slug = fields.get(F["brain_slug"])
    source = _sel(fields.get(F["capture_source"]))
    for rec in res.get("records") or []:
        f = rec.get("fields") or {}
        if (
            f.get(F["canonical_text"]) == canon
            and f.get(F["title"]) == title
            and f.get(F["brain_slug"]) == slug
            and _sel(f.get(F["capture_source"])) == source
        ):
            return rec.get("id")
    return None


def _compare_readback(expected: dict[str, Any], live: dict[str, Any]) -> list[str]:
    mismatches: list[str] = []
    for fid, val in expected.items():
        got = live.get(fid)
        got = _sel(got) if isinstance(got, dict) else got
        want = _sel(val) if isinstance(val, dict) else val
        if got != want:
            mismatches.append(fid)
    return mismatches


def execute(brief: dict[str, Any], *, dry_run: bool = False) -> dict[str, Any]:
    errs = validate_brief_full(brief)
    if errs:
        raise PenError("; ".join(errs))
    idem = _idempotency_key(brief)
    token = _token() if not dry_run else "dry-run-token"
    results: list[dict[str, Any]] = []

    for action in brief.get("actions") or []:
        table = action["table_id"]
        op = action["operation"]
        fields = dict(action.get("fields") or {})

        if dry_run:
            results.append({"dry_run": True, "operation": op, "table_id": table})
            continue

        if op == "create":
            existing_id = _dedupe_create_fields(fields, token, dry_run=False)
            if existing_id:
                results.append({"record_id": existing_id, "outcome": "Skipped", "reason": "dedupe match"})
                continue
            path = f"/{BASE_WORKSHOP}/{table}"
            resp = _req("POST", path, token, {"records": [{"fields": fields}]})
            rec = (resp.get("records") or [{}])[0]
            rid = rec.get("id")
            if not rid:
                results.append({"error": "create returned no record", "outcome": "Failed"})
                raise PenError("create returned no record")
            live = _req("GET", f"/{BASE_WORKSHOP}/{table}/{rid}", token).get("fields") or {}
            mismatch = _compare_readback(fields, live)
            if mismatch:
                results.append(
                    {"record_id": rid, "outcome": "Failed", "readback_mismatch": mismatch, "live": live}
                )
                raise PenError(f"create readback mismatch on {mismatch}")
            results.append({"record_id": rid, "outcome": "Created", "readback": live})

        elif op == "patch":
            rid = action["record_id"]
            path = f"/{BASE_WORKSHOP}/{table}/{rid}"
            old = _req("GET", path, token)
            old_fields = old.get("fields") or {}
            live_hash = _hash_fields(old_fields)
            if live_hash != action["before_hash"]:
                raise PenError(f"stale before_hash: live {live_hash} != brief {action['before_hash']}")
            expected_before = action.get("before_snapshot")
            if expected_before and _canonical(old_fields) != expected_before:
                raise PenError("before_snapshot does not match live record")
            resp = _req("PATCH", path, token, {"fields": fields})
            new_fields = resp.get("fields") or fields
            live = _req("GET", path, token).get("fields") or new_fields
            mismatch = _compare_readback(fields, live)
            if mismatch:
                results.append(
                    {"record_id": rid, "outcome": "Failed", "readback_mismatch": mismatch, "live": live}
                )
                raise PenError(f"patch readback mismatch on {mismatch}")
            results.append(
                {
                    "record_id": rid,
                    "outcome": "Patched",
                    "old_state": old_fields,
                    "new_state": live,
                }
            )

    return {
        "executed": True,
        "lane": brief.get("lane"),
        "idempotency_key": idem,
        "results": results,
        "dry_run": dry_run,
    }


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--brief", required=True, help="JSON brief path")
    parser.add_argument("--preview", action="store_true")
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()
    brief = json.loads(open(args.brief, encoding="utf-8").read())
    if args.preview:
        print(json.dumps(preview(brief), ensure_ascii=False))
        sys.exit(0)
    try:
        print(json.dumps(execute(brief, dry_run=args.dry_run), ensure_ascii=False))
    except PenError as exc:
        print(json.dumps({"executed": False, "error": str(exc)}))
        sys.exit(1)


if __name__ == "__main__":
    main()
