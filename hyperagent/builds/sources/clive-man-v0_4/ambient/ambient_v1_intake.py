#!/usr/bin/env python3
"""Ambient Capture V1 intake — CREATE_DRAFT_TRUTH + checkpoint append.

Governed pen: tblsuOKGjSGYv0Vov (NOT Draft Brain Truth tblswvXNYFDqnl6af).
Credentials: AMBIENT_V1_CREATE (V1 proposals); AMBIENT_CHECKPOINT_APPEND (checkpoint only).
Checkpoint table tblRbjD0PHtuTWsIL (schema resolved). Production append blocked until
AMBIENT_CHECKPOINT_APPEND minted plus initial scan boundary + UI verify gates.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path
from typing import Any

from ambient_config import (
    ACTION_CLASS,
    ALLOWED_HTTP_METHODS,
    AV,
    BACKOFF_SECONDS,
    BASE_ID,
    BOOTSTRAP_EVENT_ID,
    CAP_FAIL,
    CAPTURE_SOURCE_CHAT,
    CHECKPOINT,
    CHECKPOINT_APPEND_CRED_ENV,
    CHECKPOINT_BOOTSTRAP_RECORD,
    CHECKPOINT_TABLE,
    CHUNK_SIZE,
    CONTEXT_EVENTS_TABLE,
    CONTEXT_FINGERPRINTS_TABLE,
    CP,
    CP_BACKLOG,
    CP_BACKLOG_NAME,
    CP_EVENT_TYPE,
    CP_EVENT_TYPE_NAME,
    CP_STREAM_STATE,
    CP_STREAM_STATE_NAME,
    CRED_ENV,
    CRED_ROLE_CHECKPOINT_APPEND,
    CRED_ROLE_GET_TABLES,
    CRED_ROLE_POST_TABLES,
    CRED_ROLE_V1_CREATE,
    DEFAULT_STREAM_KEY,
    DRAFT_TRUTH_TABLE,
    EXECUTOR_ADAPTER_VERSION,
    FORBIDDEN_TABLE,
    FORBIDDEN_TABLES,
    INITIAL_SCAN_BOUNDARY_ENV,
    MAX_429_RETRIES,
    REQUIRED_CANDIDATE_KEYS,
    SEMANTIC_AFTER_KEYS,
    SOURCE_ORDER_VERIFIED_ENV,
    TABLE_ID,
    THREAD_ORDER_FIELDS_ENV,
    V1_STAGE,
    V1_VERDICT,
    ACTOR,
)

API = "https://api.airtable.com/v0"


class IntakeError(Exception):
    pass


class CheckpointBlocked(IntakeError):
    pass


class CheckpointRefused(IntakeError):
    pass


def _token_for_role(credential_role: str) -> str:
    if credential_role == CRED_ROLE_V1_CREATE:
        env_name = CRED_ENV
    elif credential_role == CRED_ROLE_CHECKPOINT_APPEND:
        env_name = CHECKPOINT_APPEND_CRED_ENV
    else:
        raise IntakeError(f"unknown credential role {credential_role!r}")
    tok = os.environ.get(env_name, "")
    if not tok:
        raise IntakeError(f"credential role {credential_role} ({env_name}) not present")
    return tok


def _checkpoint_ok(*, dry_run: bool) -> None:
    if dry_run:
        return
    if not os.environ.get(CHECKPOINT_APPEND_CRED_ENV, ""):
        raise CheckpointBlocked(
            f"{CHECKPOINT_APPEND_CRED_ENV} not minted; checkpoint append blocked "
            "(initial scan boundary + UI verification also required before enablement)"
        )


def _table_from_path(path: str) -> str | None:
    parts = path.strip("/").split("/")
    if len(parts) >= 2 and parts[0] == BASE_ID.lstrip("/"):
        return parts[1].split("?")[0]
    return None


def _enforce_path_for_role(method: str, path: str, credential_role: str) -> None:
    if method not in ALLOWED_HTTP_METHODS:
        raise IntakeError(f"forbidden HTTP method {method!r} for role {credential_role}")
    if credential_role not in CRED_ROLE_GET_TABLES:
        raise IntakeError(f"unknown credential role {credential_role!r}")
    table = _table_from_path(path)
    if not table:
        return
    if table in FORBIDDEN_TABLES:
        raise IntakeError(f"forbidden table {table!r} for role {credential_role}")
    if method == "GET":
        allowed = CRED_ROLE_GET_TABLES[credential_role]
        if table not in allowed:
            raise IntakeError(
                f"role {credential_role} may not GET table {table!r}; "
                f"allowed reads: {sorted(allowed)}"
            )
    elif method == "POST":
        allowed = CRED_ROLE_POST_TABLES[credential_role]
        if table not in allowed:
            raise IntakeError(
                f"role {credential_role} may not POST table {table!r}; "
                f"allowed writes: {sorted(allowed)}"
            )


def _airtable_request(
    method: str,
    path: str,
    *,
    credential_role: str,
    body: dict[str, Any] | None = None,
    dry_run: bool = False,
) -> dict[str, Any]:
    _enforce_path_for_role(method, path, credential_role)
    if dry_run and method != "GET":
        return {"records": [], "dry_run": True, "method": method, "path": path}
    token = _token_for_role(credential_role)
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
            detail = exc.read().decode("utf-8", errors="replace")[:500]
            if token in detail:
                detail = detail.replace(token, "<redacted>")
            raise IntakeError(
                f"Airtable HTTP {exc.code} on {method} {path} "
                f"(role {credential_role}): {detail}"
            ) from exc


def _select_value(raw: Any) -> str:
    if raw is None:
        return ""
    if isinstance(raw, dict):
        return str(raw.get("id") or raw.get("name") or "")
    return str(raw)


def _field_text(fields: dict[str, Any], key: str) -> str:
    return str(fields.get(CP[key]) or "")


def _field_number(fields: dict[str, Any], key: str) -> int | None:
    val = fields.get(CP[key])
    if val is None or val == "":
        return None
    return int(val)


def _canonical_json(obj: dict[str, Any]) -> str:
    return json.dumps(obj, sort_keys=True, separators=(",", ":"), ensure_ascii=False)


def _semantic_from_airtable_fields(fields: dict[str, Any]) -> dict[str, Any]:
    event_type_id = _select_value(fields.get(CP["event_type"]))
    stream_state_id = _select_value(fields.get(CP["stream_state"]))
    backlog_id = _select_value(fields.get(CP["backlog_measurement"]))
    return {
        "checkpoint_event_id": _field_text(fields, "checkpoint_event_id"),
        "stream_key": _field_text(fields, "stream_key"),
        "revision": _field_number(fields, "revision"),
        "event_type": CP_EVENT_TYPE_NAME.get(event_type_id, event_type_id),
        "stream_state": CP_STREAM_STATE_NAME.get(stream_state_id, stream_state_id),
        "previous_event_id": _field_text(fields, "previous_event_id"),
        "cursor_utc": _field_text(fields, "cursor_utc"),
        "cursor_token_json": _field_text(fields, "cursor_token_json"),
        "observed_through_utc": _field_text(fields, "observed_through_utc"),
        "backlog_lower_bound": _field_number(fields, "backlog_lower_bound"),
        "backlog_measurement": CP_BACKLOG_NAME.get(backlog_id, backlog_id),
        "disposition_unit_count": _field_number(fields, "disposition_unit_count"),
        "disposition_manifest_hash": _field_text(fields, "disposition_manifest_hash"),
        "run_id": _field_text(fields, "run_id"),
    }


def _hash_payload_from_semantic(semantic: dict[str, Any]) -> dict[str, Any]:
    """Canonical body for Event ID — all fields except checkpoint_event_id."""
    event_type = semantic["event_type"]
    stream_state = semantic["stream_state"]
    backlog = semantic["backlog_measurement"]
    return {
        "stream_key": semantic["stream_key"],
        "revision": semantic["revision"],
        "event_type": CP_EVENT_TYPE.get(event_type, event_type),
        "stream_state": CP_STREAM_STATE.get(stream_state, stream_state),
        "previous_event_id": semantic["previous_event_id"],
        "cursor_utc": semantic.get("cursor_utc") or "",
        "cursor_token_json": semantic.get("cursor_token_json") or "",
        "observed_through_utc": semantic.get("observed_through_utc") or "",
        "backlog_lower_bound": semantic.get("backlog_lower_bound"),
        "backlog_measurement": CP_BACKLOG.get(backlog, backlog),
        "disposition_unit_count": semantic.get("disposition_unit_count"),
        "disposition_manifest_hash": semantic.get("disposition_manifest_hash") or "",
        "run_id": semantic.get("run_id") or "",
    }


def compute_event_id(semantic: dict[str, Any]) -> str:
    body = _hash_payload_from_semantic(semantic)
    digest = hashlib.sha256(_canonical_json(body).encode("utf-8")).hexdigest()
    return f"acp-{digest}"


def semantic_to_airtable_fields(semantic: dict[str, Any]) -> dict[str, Any]:
    event_type = semantic["event_type"]
    stream_state = semantic["stream_state"]
    backlog = semantic["backlog_measurement"]
    fields: dict[str, Any] = {
        CP["checkpoint_event_id"]: semantic["checkpoint_event_id"],
        CP["stream_key"]: semantic["stream_key"],
        CP["revision"]: semantic["revision"],
        CP["event_type"]: CP_EVENT_TYPE.get(event_type, event_type),
        CP["stream_state"]: CP_STREAM_STATE.get(stream_state, stream_state),
        CP["previous_event_id"]: semantic["previous_event_id"],
        CP["run_id"]: semantic.get("run_id") or "",
    }
    if semantic.get("cursor_utc"):
        fields[CP["cursor_utc"]] = semantic["cursor_utc"]
    if semantic.get("cursor_token_json"):
        fields[CP["cursor_token_json"]] = semantic["cursor_token_json"]
    if semantic.get("observed_through_utc"):
        fields[CP["observed_through_utc"]] = semantic["observed_through_utc"]
    if semantic.get("backlog_lower_bound") is not None:
        fields[CP["backlog_lower_bound"]] = semantic["backlog_lower_bound"]
    fields[CP["backlog_measurement"]] = CP_BACKLOG.get(backlog, backlog)
    if semantic.get("disposition_unit_count") is not None:
        fields[CP["disposition_unit_count"]] = semantic["disposition_unit_count"]
    if semantic.get("disposition_manifest_hash"):
        fields[CP["disposition_manifest_hash"]] = semantic["disposition_manifest_hash"]
    return fields


def validate_chain_rows(rows: list[dict[str, Any]]) -> dict[str, Any]:
    """Validate append-only chain for one stream. Raises CheckpointRefused on fork/duplicate."""
    if not rows:
        raise CheckpointRefused("empty checkpoint stream")
    by_revision: dict[int, dict[str, Any]] = {}
    by_event: dict[str, dict[str, Any]] = {}
    by_prev: dict[str, list[str]] = {}
    for row in rows:
        sem = _semantic_from_airtable_fields(row["fields"])
        rev = sem["revision"]
        eid = sem["checkpoint_event_id"]
        prev = sem["previous_event_id"]
        if rev is None:
            raise CheckpointRefused("row missing revision")
        if rev in by_revision:
            raise CheckpointRefused(f"duplicate revision {rev}")
        if eid in by_event:
            raise CheckpointRefused(f"duplicate event id {eid}")
        by_revision[rev] = row
        by_event[eid] = row
        by_prev.setdefault(prev, []).append(eid)
    for prev, successors in by_prev.items():
        if prev and len(successors) > 1:
            raise CheckpointRefused(f"fork at previous_event_id {prev!r}: {successors}")
    revisions = sorted(by_revision)
    for i, rev in enumerate(revisions):
        if i > 0 and rev != revisions[i - 1] + 1:
            raise CheckpointRefused(f"non-contiguous revision gap before {rev}")
    for rev in revisions[1:]:
        sem = _semantic_from_airtable_fields(by_revision[rev]["fields"])
        pred_rev = rev - 1
        pred = _semantic_from_airtable_fields(by_revision[pred_rev]["fields"])
        if sem["previous_event_id"] != pred["checkpoint_event_id"]:
            raise CheckpointRefused(
                f"previous_event_id mismatch at revision {rev}: "
                f"expected {pred['checkpoint_event_id']!r}, got {sem['previous_event_id']!r}"
            )
    tip_rev = revisions[-1]
    tip_row = by_revision[tip_rev]
    tip_sem = _semantic_from_airtable_fields(tip_row["fields"])
    return {
        "tip_revision": tip_rev,
        "tip_event_id": tip_sem["checkpoint_event_id"],
        "tip_semantic": tip_sem,
        "tip_record_id": tip_row.get("id"),
        "by_event": by_event,
        "by_revision": by_revision,
    }


def list_checkpoint_stream(
    stream_key: str,
    *,
    dry_run: bool,
) -> list[dict[str, Any]]:
    if dry_run:
        bootstrap_fields = semantic_to_airtable_fields(
            {
                "checkpoint_event_id": BOOTSTRAP_EVENT_ID,
                "stream_key": stream_key,
                "revision": 0,
                "event_type": "bootstrap",
                "stream_state": "active",
                "previous_event_id": "",
                "backlog_measurement": "unknown",
                "backlog_lower_bound": 0,
                "disposition_unit_count": 0,
                "run_id": "ruth-build-bootstrap",
            }
        )
        return [{"id": CHECKPOINT_BOOTSTRAP_RECORD, "fields": bootstrap_fields}]
    rows: list[dict[str, Any]] = []
    offset = None
    while True:
        q = f"/{BASE_ID}/{CHECKPOINT_TABLE}?pageSize=100&returnFieldsByFieldId=true"
        for fid in CP.values():
            q += f"&fields[]={fid}"
        if offset:
            q += f"&offset={offset}"
        res = _airtable_request(
            "GET", q, credential_role=CRED_ROLE_CHECKPOINT_APPEND, dry_run=False
        )
        for rec in res.get("records") or []:
            f = rec.get("fields") or {}
            if _field_text(f, "stream_key") == stream_key:
                rows.append(rec)
        offset = res.get("offset")
        if not offset:
            break
    return rows


def read_stream_tip(
    stream_key: str = DEFAULT_STREAM_KEY,
    *,
    dry_run: bool = False,
) -> dict[str, Any]:
    _checkpoint_ok(dry_run=dry_run)
    rows = list_checkpoint_stream(stream_key, dry_run=dry_run)
    chain = validate_chain_rows(rows)
    return {
        "stream_key": stream_key,
        "tip_revision": chain["tip_revision"],
        "tip_event_id": chain["tip_event_id"],
        "tip_semantic": chain["tip_semantic"],
        "tip_record_id": chain["tip_record_id"],
        "row_count": len(rows),
    }


def activation_gates_met(*, for_advance: bool) -> tuple[bool, list[str]]:
    reasons: list[str] = []
    if not for_advance:
        return True, reasons
    if not os.environ.get(INITIAL_SCAN_BOUNDARY_ENV, "").strip():
        reasons.append(f"missing {INITIAL_SCAN_BOUNDARY_ENV}")
    if os.environ.get(SOURCE_ORDER_VERIFIED_ENV, "").lower() != "true":
        reasons.append(f"{SOURCE_ORDER_VERIFIED_ENV} not true")
    if not os.environ.get(THREAD_ORDER_FIELDS_ENV, "").strip():
        reasons.append(f"missing {THREAD_ORDER_FIELDS_ENV}")
    return (not reasons, reasons)


def verify_v1_dispositions(
    intake_result: dict[str, Any],
    run_id: str,
    *,
    dry_run: bool,
) -> list[str]:
    """Confirm written/skipped dedupe keys exist under run_id in Amendment Versions."""
    if dry_run:
        return []
    errors: list[str] = []
    keys_needed = {w["dedupe_key"] for w in intake_result.get("written") or []}
    keys_needed.update(s["dedupe_key"] for s in intake_result.get("skipped") or [])
    if not keys_needed:
        return errors
    found: set[str] = set()
    offset = None
    while True:
        q = f"/{BASE_ID}/{TABLE_ID}?pageSize=100&returnFieldsByFieldId=true"
        q += f"&fields[]={AV['dedupe_key']}&fields[]={AV['run_id']}"
        if offset:
            q += f"&offset={offset}"
        res = _airtable_request(
            "GET",
            q,
            credential_role=CRED_ROLE_CHECKPOINT_APPEND,
            dry_run=False,
        )
        for rec in res.get("records") or []:
            f = rec.get("fields") or {}
            if f.get(AV["run_id"]) == run_id:
                dk = f.get(AV["dedupe_key"])
                if dk in keys_needed:
                    found.add(dk)
        offset = res.get("offset")
        if not offset:
            break
    missing = keys_needed - found
    if missing:
        errors.append(f"v1 disposition mismatch: missing dedupe keys {sorted(missing)}")
    return errors


def derive_checkpoint_from_intake(
    intake_result: dict[str, Any],
    *,
    stream_key: str = DEFAULT_STREAM_KEY,
    run_id: str,
    tip_semantic: dict[str, Any],
    new_cursor_utc: str | None = None,
    observed_through_utc: str | None = None,
) -> dict[str, Any]:
    """Map intake run outcome to one checkpoint event semantic payload (without event id)."""
    remaining = int(intake_result.get("remaining") or 0)
    requeued = int(intake_result.get("requeued_count") or 0)
    stop_reason = intake_result.get("stop_reason")
    complete = bool(intake_result.get("complete"))
    written = intake_result.get("written") or []
    disposition_count = len(written) + len(intake_result.get("skipped") or [])

    manifest_hash = hashlib.sha256(
        _canonical_json(
            {
                "written": [w.get("dedupe_key") for w in written],
                "skipped": [s.get("dedupe_key") for s in intake_result.get("skipped") or []],
                "requeued": requeued,
                "stop_reason": stop_reason,
            }
        ).encode()
    ).hexdigest()

    partial = (
        requeued > 0
        or remaining > 0
        or stop_reason in ("failure_cap", "batch_error", "short_post", "budget_stop")
        or not complete
    )

    if partial:
        backlog = "lower_bound" if (remaining + requeued) > 0 else "unknown"
        backlog_lower = remaining + requeued if backlog == "lower_bound" else 0
        return {
            "stream_key": stream_key,
            "revision": tip_semantic["revision"] + 1,
            "event_type": "observation",
            "stream_state": tip_semantic.get("stream_state") or "active",
            "previous_event_id": tip_semantic["checkpoint_event_id"],
            "cursor_utc": tip_semantic.get("cursor_utc") or "",
            "cursor_token_json": json.dumps(
                {
                    "checkpoint_through_index": intake_result.get("checkpoint_through_index"),
                    "stop_reason": stop_reason,
                    "remaining": remaining,
                },
                sort_keys=True,
            ),
            "observed_through_utc": observed_through_utc or tip_semantic.get("observed_through_utc") or "",
            "backlog_lower_bound": backlog_lower,
            "backlog_measurement": backlog,
            "disposition_unit_count": disposition_count,
            "disposition_manifest_hash": manifest_hash,
            "run_id": run_id,
        }

    ok, gate_reasons = activation_gates_met(for_advance=True)
    if not ok:
        return {
            "stream_key": stream_key,
            "revision": tip_semantic["revision"] + 1,
            "event_type": "held",
            "stream_state": "held",
            "previous_event_id": tip_semantic["checkpoint_event_id"],
            "cursor_utc": tip_semantic.get("cursor_utc") or "",
            "cursor_token_json": json.dumps({"held_reasons": gate_reasons}, sort_keys=True),
            "observed_through_utc": observed_through_utc or "",
            "backlog_lower_bound": 0,
            "backlog_measurement": "unknown",
            "disposition_unit_count": disposition_count,
            "disposition_manifest_hash": manifest_hash,
            "run_id": run_id,
        }

    return {
        "stream_key": stream_key,
        "revision": tip_semantic["revision"] + 1,
        "event_type": "advance",
        "stream_state": "active",
        "previous_event_id": tip_semantic["checkpoint_event_id"],
        "cursor_utc": new_cursor_utc or tip_semantic.get("cursor_utc") or "",
        "cursor_token_json": json.dumps({"advanced": True, "written_count": intake_result.get("written_count")}),
        "observed_through_utc": observed_through_utc or new_cursor_utc or "",
        "backlog_lower_bound": 0,
        "backlog_measurement": "exact",
        "disposition_unit_count": disposition_count,
        "disposition_manifest_hash": manifest_hash,
        "run_id": run_id,
    }


def append_checkpoint_event(
    semantic: dict[str, Any],
    *,
    dry_run: bool = False,
    chain_override: dict[str, Any] | None = None,
) -> dict[str, Any]:
    """Append exactly one checkpoint row. Refuses fork/collision; skips exact replay."""
    _checkpoint_ok(dry_run=dry_run)
    stream_key = semantic["stream_key"]
    rows = list_checkpoint_stream(stream_key, dry_run=dry_run)
    chain = validate_chain_rows(rows)
    if chain_override is not None:
        chain = chain_override

    tip_sem = chain["tip_semantic"]

    if semantic.get("checkpoint_event_id"):
        eid = semantic["checkpoint_event_id"]
        if eid in chain["by_event"]:
            existing_sem = _semantic_from_airtable_fields(chain["by_event"][eid]["fields"])
            trial = dict(semantic)
            if _hash_payload_from_semantic(existing_sem) == _hash_payload_from_semantic(trial):
                return {
                    "skipped": True,
                    "reason": "exact replay",
                    "checkpoint_event_id": eid,
                    "record_id": chain["by_event"][eid].get("id"),
                }
            raise CheckpointRefused(f"event id collision non-identical: {eid}")

    proposed = dict(semantic)
    if proposed.get("previous_event_id") and proposed["previous_event_id"] != tip_sem["checkpoint_event_id"]:
        raise CheckpointRefused(
            f"previous_event_id must be tip {tip_sem['checkpoint_event_id']!r}, "
            f"got {proposed['previous_event_id']!r}"
        )
    proposed["previous_event_id"] = tip_sem["checkpoint_event_id"]
    proposed["revision"] = tip_sem["revision"] + 1

    event_id = compute_event_id(proposed)
    proposed["checkpoint_event_id"] = event_id

    if event_id in chain["by_event"]:
        existing = chain["by_event"][event_id]
        existing_sem = _semantic_from_airtable_fields(existing["fields"])
        if _hash_payload_from_semantic(existing_sem) == _hash_payload_from_semantic(proposed):
            return {
                "skipped": True,
                "reason": "exact replay",
                "checkpoint_event_id": event_id,
                "record_id": existing.get("id"),
            }
        raise CheckpointRefused(f"event id collision non-identical: {event_id}")

    if proposed.get("event_type") == "advance":
        ok, reasons = activation_gates_met(for_advance=True)
        if not ok:
            raise CheckpointRefused(f"advance blocked: {reasons}")

    fields = semantic_to_airtable_fields(proposed)
    path = f"/{BASE_ID}/{CHECKPOINT_TABLE}"
    body = {"records": [{"fields": fields}], "typecast": False}
    if dry_run:
        return {
            "appended": True,
            "dry_run": True,
            "checkpoint_event_id": event_id,
            "revision": proposed["revision"],
            "fields": fields,
        }
    resp = _airtable_request(
        "POST", path, credential_role=CRED_ROLE_CHECKPOINT_APPEND, body=body, dry_run=False
    )
    recs = resp.get("records") or []
    if len(recs) != 1:
        raise IntakeError("checkpoint POST did not return exactly one record")
    record_id = recs[0].get("id")
    live = _airtable_request(
        "GET",
        f"/{BASE_ID}/{CHECKPOINT_TABLE}/{record_id}",
        credential_role=CRED_ROLE_CHECKPOINT_APPEND,
        dry_run=False,
    )
    live_fields = live.get("fields") or {}
    mismatches = [k for k, v in fields.items() if live_fields.get(k) != v]
    if mismatches:
        raise IntakeError(f"checkpoint readback mismatch: {mismatches}")
    return {
        "appended": True,
        "checkpoint_event_id": event_id,
        "revision": proposed["revision"],
        "record_id": record_id,
        "event_type": proposed.get("event_type"),
    }


def append_checkpoint_after_intake(
    intake_result: dict[str, Any],
    *,
    run_id: str,
    dry_run: bool = False,
    new_cursor_utc: str | None = None,
    observed_through_utc: str | None = None,
) -> dict[str, Any]:
    if not intake_result.get("v1_report_record_id") and not dry_run:
        v1_in_written = any(True for _ in intake_result.get("written") or [])
        if v1_in_written:
            raise IntakeError("intake missing v1_report_record_id for checkpoint append")
    _checkpoint_ok(dry_run=dry_run)
    tip = read_stream_tip(dry_run=dry_run)
    rows = list_checkpoint_stream(DEFAULT_STREAM_KEY, dry_run=dry_run)
    chain = validate_chain_rows(rows)

    if intake_result.get("complete") and not intake_result.get("requeued_count"):
        disp_errors = verify_v1_dispositions(intake_result, run_id, dry_run=dry_run)
        if disp_errors:
            intake_result = dict(intake_result)
            intake_result["complete"] = False
            intake_result["requeued_count"] = intake_result.get("requeued_count", 0) + 1
            intake_result["stop_reason"] = intake_result.get("stop_reason") or "v1_disposition_mismatch"

    semantic = derive_checkpoint_from_intake(
        intake_result,
        run_id=run_id,
        tip_semantic=tip["tip_semantic"],
        new_cursor_utc=new_cursor_utc,
        observed_through_utc=observed_through_utc,
    )
    semantic["checkpoint_event_id"] = compute_event_id(semantic)
    return append_checkpoint_event(semantic, dry_run=dry_run)


# --- V1 intake (unchanged contract) -------------------------------------------------


def build_after_payload(candidate: dict[str, Any]) -> dict[str, Any]:
    payload: dict[str, Any] = {
        "title": candidate["title"],
        "canonical_text": candidate["canonical_text"],
        "brain_slug": candidate["brain_slug"],
        "capture_source": CAPTURE_SOURCE_CHAT,
    }
    for key in (
        "canonical_text_for_agents",
        "canonical_text_for_humans",
        "brain_registry",
        "proposed_category",
        "brain_theme",
        "record_type",
        "horizon",
        "source_documents",
        "supersedes_trusted_truth_id",
        # related_projects: copy only if already present. Do not judge or invent.
        "related_projects",
        "context_amendment_versions",
    ):
        if candidate.get(key):
            payload[key] = candidate[key]
    return payload


def validate_candidate(candidate: dict[str, Any]) -> list[str]:
    errors: list[str] = []
    for key in REQUIRED_CANDIDATE_KEYS:
        val = candidate.get(key)
        if val in (None, "", [], {}):
            errors.append(f"missing {key}")
    evidence = candidate.get("evidence") or candidate.get("source_quote")
    if not evidence or not str(evidence).strip():
        errors.append("evidence/source_quote required")
    conf = candidate.get("confidence")
    if conf is not None and not isinstance(conf, (int, float)):
        errors.append("confidence must be numeric")
    after = candidate.get("after_payload") or build_after_payload(candidate)
    if isinstance(after.get("fields"), dict):
        errors.append("after_payload must use semantic keys, not Draft field IDs")
    unknown = set(after) - SEMANTIC_AFTER_KEYS
    if unknown:
        errors.append(f"unknown after_payload keys: {sorted(unknown)}")
    if after.get("capture_source") and after.get("capture_source") != CAPTURE_SOURCE_CHAT:
        errors.append("after_payload capture_source must be Chat Session")
    return errors


def validate_manifest(manifest: dict[str, Any]) -> list[str]:
    errors: list[str] = []
    if manifest.get("created_by_agent") != ACTOR:
        errors.append(f"created_by_agent must be {ACTOR!r}")
    if manifest.get("action_class") != ACTION_CLASS:
        errors.append(f"action_class must be {ACTION_CLASS!r}")
    if manifest.get("stage") != V1_STAGE:
        errors.append(f"stage must be {V1_STAGE!r}")
    base = manifest.get("base_id") or manifest.get("target_base_id")
    if base and base != BASE_ID:
        errors.append(f"base_id must be {BASE_ID!r}")
    table = manifest.get("table_id") or manifest.get("write_table_id")
    if table == FORBIDDEN_TABLE:
        errors.append(f"forbidden direct write to Draft Brain Truth {FORBIDDEN_TABLE}")
    if table and table != TABLE_ID:
        errors.append(f"write table must be {TABLE_ID!r}")
    target_table = manifest.get("target_table_id")
    if target_table and target_table not in (DRAFT_TRUTH_TABLE, TABLE_ID):
        errors.append(f"unknown target_table_id {target_table!r}")
    if manifest.get("target_record_id"):
        errors.append("CREATE_DRAFT_TRUTH must not carry target_record_id")
    if not manifest.get("dedupe_key"):
        errors.append("dedupe_key required")
    evidence = manifest.get("evidence") or manifest.get("source_quote")
    if not evidence or not str(evidence).strip():
        errors.append("evidence required")
    if not manifest.get("v1_report_record_id"):
        errors.append("v1_report_record_id required")
    if manifest.get("confidence") in (None, ""):
        errors.append("confidence required")
    if manifest.get("adapter_version") and manifest.get("adapter_version") != EXECUTOR_ADAPTER_VERSION:
        errors.append(f"adapter_version must be {EXECUTOR_ADAPTER_VERSION!r}")
    after = manifest.get("after_payload") or {}
    if isinstance(after.get("fields"), dict):
        errors.append("after_payload uses Draft field IDs; expected semantic keys")
    return errors


def _amendment_version_id(dedupe_key: str, run_id: str) -> str:
    digest = hashlib.sha256(f"{run_id}:{dedupe_key}".encode()).hexdigest()[:12]
    return f"cav-ambient-{digest}-v1"


def build_v1_fields(candidate: dict[str, Any], run_id: str) -> dict[str, Any]:
    dedupe = candidate["dedupe_key"]
    after_payload = candidate.get("after_payload") or build_after_payload(candidate)
    fields = {
        AV["amendment_version_id"]: _amendment_version_id(dedupe, run_id),
        AV["run_id"]: run_id,
        AV["stage"]: V1_STAGE,
        AV["challenger_verdict"]: V1_VERDICT,
        AV["target_base_id"]: candidate.get("target_base_id") or BASE_ID,
        AV["target_table_id"]: candidate.get("target_table_id") or DRAFT_TRUTH_TABLE,
        AV["action_class"]: ACTION_CLASS,
        AV["adapter_version"]: EXECUTOR_ADAPTER_VERSION,
        AV["reason"]: candidate.get("reason") or "Ambient chat capture",
        AV["evidence"]: candidate.get("evidence") or candidate.get("source_quote"),
        AV["confidence"]: candidate.get("confidence"),
        AV["v1_report_record_id"]: candidate["v1_report_record_id"],
        AV["tier"]: candidate.get("tier") or "Amber",
        AV["dedupe_key"]: dedupe,
        AV["created_by_agent"]: ACTOR,
        AV["after_payload"]: json.dumps(after_payload, ensure_ascii=False),
    }
    return fields


def list_existing_by_dedupe(dedupe_keys: set[str], *, dry_run: bool) -> dict[str, str]:
    if dry_run or not dedupe_keys:
        return {}
    found: dict[str, str] = {}
    offset = None
    while True:
        q = f"/{BASE_ID}/{TABLE_ID}?pageSize=100&returnFieldsByFieldId=true"
        q += f"&fields[]={AV['dedupe_key']}&fields[]={AV['amendment_version_id']}"
        if offset:
            q += f"&offset={offset}"
        res = _airtable_request(
            "GET", q, credential_role=CRED_ROLE_V1_CREATE, dry_run=False
        )
        for rec in res.get("records") or []:
            f = rec.get("fields") or {}
            dk = f.get(AV["dedupe_key"])
            if dk in dedupe_keys:
                found[dk] = rec.get("id", "")
        offset = res.get("offset")
        if not offset:
            break
    return found


def readback_record(record_id: str, *, dry_run: bool) -> dict[str, Any]:
    path = f"/{BASE_ID}/{TABLE_ID}/{record_id}"
    return _airtable_request(
        "GET", path, credential_role=CRED_ROLE_V1_CREATE, dry_run=dry_run
    )


def create_batch(
    records: list[dict[str, Any]],
    *,
    dry_run: bool,
) -> dict[str, Any]:
    if not records:
        return {"records": [], "created": 0}
    path = f"/{BASE_ID}/{TABLE_ID}"
    body = {"records": [{"fields": r} for r in records], "typecast": False}
    if dry_run:
        return {
            "records": [{"id": f"recDRY{i}", "fields": r} for i, r in enumerate(records)],
            "created": len(records),
            "dry_run": True,
        }
    return _airtable_request(
        "POST", path, credential_role=CRED_ROLE_V1_CREATE, body=body, dry_run=False
    )


def verify_readback(
    sent: dict[str, Any],
    record_id: str,
    *,
    dry_run: bool,
) -> list[str]:
    if dry_run:
        return []
    live = readback_record(record_id, dry_run=False).get("fields") or {}
    mismatches: list[str] = []
    for key, expected in sent.items():
        if live.get(key) != expected:
            mismatches.append(key)
    return mismatches


def process_candidates(
    candidates: list[dict[str, Any]],
    *,
    run_id: str,
    dry_run: bool = False,
    interrupt_after: int = 0,
    chunk_size: int = CHUNK_SIZE,
    v1_report_record_id: str | None = None,
    append_checkpoint: bool = False,
    new_cursor_utc: str | None = None,
    observed_through_utc: str | None = None,
) -> dict[str, Any]:
    _checkpoint_ok(dry_run=dry_run)
    written: list[dict[str, Any]] = []
    skipped: list[dict[str, Any]] = []
    requeued: list[dict[str, Any]] = []
    failures = 0
    idx = 0
    budget_stop = interrupt_after if interrupt_after else len(candidates)
    fail_cap = CAP_FAIL.get("intake", 2)
    stop_reason: str | None = None

    dedupe_keys = {c["dedupe_key"] for c in candidates if c.get("dedupe_key")}
    existing = list_existing_by_dedupe(dedupe_keys, dry_run=dry_run)

    def _requeue_candidate(item: dict[str, Any], **extra: Any) -> None:
        entry: dict[str, Any] = {"candidate": item}
        entry.update(extra)
        requeued.append(entry)

    def _requeue_tail(from_index: int) -> None:
        for tail in candidates[from_index:]:
            _requeue_candidate(tail, reason=stop_reason or "no_loss_stop")

    while idx < len(candidates) and idx < budget_stop and stop_reason is None:
        chunk_end = min(idx + chunk_size, budget_stop)
        chunk = candidates[idx:chunk_end]
        batch_fields: list[dict[str, Any]] = []
        batch_meta: list[dict[str, Any]] = []
        chunk_cursor = 0

        for item in chunk:
            if stop_reason:
                break
            chunk_cursor += 1
            working = dict(item)
            if v1_report_record_id and not working.get("v1_report_record_id"):
                working["v1_report_record_id"] = v1_report_record_id
            cand_errs = validate_candidate(working)
            manifest = {
                "stage": V1_STAGE,
                "action_class": ACTION_CLASS,
                "created_by_agent": ACTOR,
                "adapter_version": EXECUTOR_ADAPTER_VERSION,
                "table_id": TABLE_ID,
                "base_id": BASE_ID,
                "target_base_id": working.get("target_base_id") or BASE_ID,
                "target_table_id": working.get("target_table_id") or DRAFT_TRUTH_TABLE,
                "dedupe_key": working.get("dedupe_key"),
                "evidence": working.get("evidence") or working.get("source_quote"),
                "confidence": working.get("confidence"),
                "v1_report_record_id": working.get("v1_report_record_id"),
                "after_payload": build_after_payload(working),
            }
            errs = cand_errs + validate_manifest(manifest)
            if errs:
                failures += 1
                _requeue_candidate(working, errors=errs)
                if failures >= fail_cap:
                    stop_reason = "failure_cap"
                    _requeue_tail(idx + chunk_cursor)
                continue
            dk = working["dedupe_key"]
            if dk in existing:
                skipped.append({"dedupe_key": dk, "record_id": existing[dk], "reason": "exact replay"})
                continue
            fields = build_v1_fields(working, run_id)
            if fields[AV["amendment_version_id"]] in {
                f.get(AV["amendment_version_id"]) for f in batch_fields
            }:
                failures += 1
                _requeue_candidate(working, errors=["duplicate amendment_version_id in batch"])
                if failures >= fail_cap:
                    stop_reason = "failure_cap"
                    _requeue_tail(idx + chunk_cursor)
                continue
            batch_fields.append(fields)
            batch_meta.append(working)

        if stop_reason:
            break

        if batch_fields:
            try:
                resp = create_batch(batch_fields, dry_run=dry_run)
                returned = resp.get("records") or []
                if len(returned) != len(batch_fields):
                    failures += len(batch_meta)
                    for meta in batch_meta:
                        _requeue_candidate(
                            meta,
                            error="Airtable POST returned fewer records than requested",
                            expected=len(batch_fields),
                            got=len(returned),
                        )
                    stop_reason = "short_post"
                    _requeue_tail(chunk_end)
                    break
                for i, rec in enumerate(returned):
                    meta = batch_meta[i]
                    entry = {
                        "record_id": rec.get("id"),
                        "dedupe_key": batch_fields[i][AV["dedupe_key"]],
                        "amendment_version_id": batch_fields[i][AV["amendment_version_id"]],
                    }
                    if not dry_run and rec.get("id"):
                        mismatch = verify_readback(
                            batch_fields[i], rec["id"], dry_run=False
                        )
                        if mismatch:
                            failures += 1
                            _requeue_candidate(meta, readback_mismatch=mismatch)
                            if failures >= fail_cap:
                                stop_reason = "failure_cap"
                                for rest in batch_meta[i + 1 :]:
                                    _requeue_candidate(rest, reason="failure_cap_batch_abort")
                                _requeue_tail(chunk_end)
                            continue
                        existing[batch_fields[i][AV["dedupe_key"]]] = rec["id"]
                    written.append(entry)
            except IntakeError as exc:
                failures += len(batch_meta)
                for meta in batch_meta:
                    _requeue_candidate(meta, error=str(exc))
                stop_reason = "batch_error"
                _requeue_tail(idx + len(chunk))
                break

        idx = chunk_end

    if stop_reason is None and idx < len(candidates):
        stop_reason = "budget_stop"

    remaining_candidates = list(candidates[idx:]) if idx < len(candidates) else []
    checkpoint_through = idx if stop_reason == "budget_stop" else min(idx, budget_stop)

    result: dict[str, Any] = {
        "written": written,
        "written_count": len(written),
        "skipped": skipped,
        "skipped_count": len(skipped),
        "requeued": requeued,
        "requeued_count": len(requeued),
        "failures": failures,
        "remaining": len(remaining_candidates),
        "remaining_candidates": remaining_candidates,
        "checkpoint_through_index": checkpoint_through,
        "stop_reason": stop_reason,
        "budget_stop": budget_stop,
        "checkpoint": CHECKPOINT,
        "dry_run": dry_run,
        "complete": not remaining_candidates and not requeued,
        "v1_report_record_id": v1_report_record_id,
    }

    if append_checkpoint:
        result["checkpoint_append"] = append_checkpoint_after_intake(
            result,
            run_id=run_id,
            dry_run=dry_run,
            new_cursor_utc=new_cursor_utc,
            observed_through_utc=observed_through_utc,
        )

    return result


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--manifest", type=str, help="JSON manifest path")
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--validate-manifest", action="store_true")
    parser.add_argument("--run-id", default="ambient-run")
    parser.add_argument("--interrupt-after", type=int, default=0)
    parser.add_argument("--append-checkpoint", action="store_true")
    parser.add_argument("--checkpoint-read-tip", action="store_true")
    parser.add_argument("--checkpoint-append-json", type=str, help="Semantic checkpoint JSON")
    args = parser.parse_args()

    if args.checkpoint_read_tip:
        tip = read_stream_tip(dry_run=args.dry_run)
        print(json.dumps(tip, ensure_ascii=False))
        sys.exit(0)

    if args.checkpoint_append_json:
        semantic = json.loads(args.checkpoint_append_json)
        out = append_checkpoint_event(semantic, dry_run=args.dry_run)
        print(json.dumps(out, ensure_ascii=False))
        sys.exit(0)

    if args.validate_manifest:
        sample_candidate = {
            "title": "Sample title",
            "canonical_text": "Canonical body text",
            "brain_slug": "clive",
            "dedupe_key": "test-key",
            "evidence": "quoted source text for review",
            "confidence": 0.85,
            "v1_report_record_id": "recReportSample",
        }
        sample = {
            "stage": V1_STAGE,
            "action_class": ACTION_CLASS,
            "created_by_agent": ACTOR,
            "adapter_version": EXECUTOR_ADAPTER_VERSION,
            "table_id": TABLE_ID,
            "dedupe_key": "test-key",
            "evidence": "quoted source text for review",
            "confidence": 0.85,
            "v1_report_record_id": "recReportSample",
            "after_payload": build_after_payload(sample_candidate),
        }
        errs = validate_manifest(sample) + validate_candidate(sample_candidate)
        print(json.dumps({"ok": not errs, "errors": errs, "table_id": TABLE_ID, "checkpoint_table": CHECKPOINT_TABLE}))
        sys.exit(0 if not errs else 1)

    if args.manifest:
        manifest = json.loads(Path(args.manifest).read_text(encoding="utf-8"))
        candidates = manifest.get("candidates") or manifest.get("records") or []
        result = process_candidates(
            candidates,
            run_id=manifest.get("run_id") or args.run_id,
            dry_run=args.dry_run,
            interrupt_after=args.interrupt_after,
            v1_report_record_id=manifest.get("v1_report_record_id"),
            append_checkpoint=args.append_checkpoint,
            new_cursor_utc=manifest.get("new_cursor_utc"),
            observed_through_utc=manifest.get("observed_through_utc"),
        )
        print(json.dumps(result, ensure_ascii=False))
        sys.exit(0 if result["written_count"] or result["skipped_count"] or result["dry_run"] else 1)

    print(
        json.dumps(
            {
                "actor": ACTOR,
                "base_id": BASE_ID,
                "table_id": TABLE_ID,
                "forbidden_table": FORBIDDEN_TABLE,
                "checkpoint_table": CHECKPOINT_TABLE,
                "checkpoint_bootstrap": CHECKPOINT_BOOTSTRAP_RECORD,
                "credential_env": CRED_ENV,
                "checkpoint_append_cred_env": CHECKPOINT_APPEND_CRED_ENV,
            }
        )
    )


if __name__ == "__main__":
    main()
