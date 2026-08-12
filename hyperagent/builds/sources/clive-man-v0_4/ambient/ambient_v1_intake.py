#!/usr/bin/env python3
"""Ambient Capture V1 intake — CREATE_DRAFT_TRUTH to Context Amendment Versions only.

Governed pen: tblsuOKGjSGYv0Vov (NOT Draft Brain Truth tblswvXNYFDqnl6af).
Credential: AMBIENT_V1_CREATE (injected by Hyperagent RunWithCredentials).
Checkpoint: PENDING_RUTH_CHECKPOINT_STORE — production refuses when unresolved.
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
    AV,
    BACKOFF_SECONDS,
    BASE_ID,
    CAP_FAIL,
    CAPTURE_SOURCE_CHAT,
    CHECKPOINT,
    CHUNK_SIZE,
    CRED_ENV,
    DRAFT_TRUTH_TABLE,
    EXECUTOR_ADAPTER_VERSION,
    FORBIDDEN_TABLE,
    MAX_429_RETRIES,
    REQUIRED_CANDIDATE_KEYS,
    SEMANTIC_AFTER_KEYS,
    TABLE_ID,
    V1_STAGE,
    V1_VERDICT,
    ACTOR,
)

API = "https://api.airtable.com/v0"


class IntakeError(Exception):
    pass


class CheckpointBlocked(IntakeError):
    pass


def _token() -> str:
    tok = os.environ.get(CRED_ENV, "")
    if not tok:
        raise IntakeError(f"credential {CRED_ENV} not present")
    return tok


def _checkpoint_ok(*, dry_run: bool) -> None:
    store = os.environ.get("CLIVE_MAN_CHECKPOINT_STORE", CHECKPOINT)
    if dry_run:
        return
    if store == CHECKPOINT or not store or store.startswith("PENDING_"):
        raise CheckpointBlocked(
            f"checkpoint store unresolved ({store!r}); production intake blocked"
        )


def _airtable_request(
    method: str,
    path: str,
    token: str,
    body: dict[str, Any] | None = None,
    *,
    dry_run: bool = False,
) -> dict[str, Any]:
    if dry_run and method != "GET":
        return {"records": [], "dry_run": True, "method": method, "path": path}
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
            raise IntakeError(f"Airtable HTTP {exc.code} on {method} {path}: {detail}") from exc


def build_after_payload(candidate: dict[str, Any]) -> dict[str, Any]:
    """Semantic executor payload — field IDs mapped at execute time, not stored here."""
    payload: dict[str, Any] = {
        "title": candidate["title"],
        "canonical_text": candidate["canonical_text"],
        "brain_slug": candidate["brain_slug"],
        "capture_source": CAPTURE_SOURCE_CHAT,
    }
    for key in ("proposed_category", "brain_theme", "record_type", "horizon"):
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


def list_existing_by_dedupe(token: str, dedupe_keys: set[str], *, dry_run: bool) -> dict[str, str]:
    if dry_run or not dedupe_keys:
        return {}
    found: dict[str, str] = {}
    offset = None
    while True:
        q = f"/{BASE_ID}/{TABLE_ID}?pageSize=100&returnFieldsByFieldId=true"
        q += f"&fields[]={AV['dedupe_key']}&fields[]={AV['amendment_version_id']}"
        if offset:
            q += f"&offset={offset}"
        res = _airtable_request("GET", q, token, dry_run=False)
        for rec in res.get("records") or []:
            f = rec.get("fields") or {}
            dk = f.get(AV["dedupe_key"])
            if dk in dedupe_keys:
                found[dk] = rec.get("id", "")
        offset = res.get("offset")
        if not offset:
            break
    return found


def readback_record(record_id: str, token: str, *, dry_run: bool) -> dict[str, Any]:
    path = f"/{BASE_ID}/{TABLE_ID}/{record_id}"
    return _airtable_request("GET", path, token, dry_run=dry_run)


def create_batch(
    records: list[dict[str, Any]],
    token: str,
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
    return _airtable_request("POST", path, token, body, dry_run=False)


def verify_readback(
    sent: dict[str, Any],
    record_id: str,
    token: str,
    *,
    dry_run: bool,
) -> list[str]:
    if dry_run:
        return []
    live = readback_record(record_id, token, dry_run=False).get("fields") or {}
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
) -> dict[str, Any]:
    _checkpoint_ok(dry_run=dry_run)
    token = _token() if not dry_run else "dry-run-token"
    written: list[dict[str, Any]] = []
    skipped: list[dict[str, Any]] = []
    requeued: list[dict[str, Any]] = []
    failures = 0
    idx = 0
    budget_stop = interrupt_after if interrupt_after else len(candidates)
    fail_cap = CAP_FAIL.get("intake", 2)
    stop_reason: str | None = None

    dedupe_keys = {c["dedupe_key"] for c in candidates if c.get("dedupe_key")}
    existing = list_existing_by_dedupe(token, dedupe_keys, dry_run=dry_run)

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
                resp = create_batch(batch_fields, token, dry_run=dry_run)
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
                            batch_fields[i], rec["id"], token, dry_run=False
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

    return {
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
    }


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--manifest", type=str, help="JSON manifest path")
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--validate-manifest", action="store_true")
    parser.add_argument("--run-id", default="ambient-run")
    parser.add_argument("--interrupt-after", type=int, default=0)
    args = parser.parse_args()

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
        print(json.dumps({"ok": not errs, "errors": errs, "table_id": TABLE_ID}))
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
                "checkpoint": CHECKPOINT,
                "credential_env": CRED_ENV,
            }
        )
    )


if __name__ == "__main__":
    main()
