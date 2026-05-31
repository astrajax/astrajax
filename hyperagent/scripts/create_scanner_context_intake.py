#!/usr/bin/env python3
"""Create low-authority Context Intake rows from scanner output."""

from __future__ import annotations

import argparse
import json
import os
import sys
import urllib.error
import urllib.request
from pathlib import Path
from typing import Any

REPO_ROOT = Path(__file__).resolve().parents[2]
ENV_PATH = REPO_ROOT / ".env"
BASE_ID = "appYv601Oq7fKTCj0"
TABLE_ID = "tblJCmPGPUyszgFux"
RECORD_URL = f"https://airtable.com/{BASE_ID}/{TABLE_ID}/{{record_id}}"

ALLOWED_STATUSES = {"New", "Needs clarification", "Possible duplicate"}
# Live Context Intake field only exposes a subset of the intake skill options.
SAFE_SUGGESTED_ACTIONS = {"Review and approve", "Ask for more detail"}
DEFAULT_SUGGESTED_ACTION = "Review and approve"
FIELD_MAP = {
    "title": "Title",
    "raw_submission": "Raw Submission",
    "clean_summary": "Clean Summary",
    "category": "Category",
    "suggested_destination": "Suggested Destination",
    "secondary_destination": "Secondary Destination",
    "confidence": "Confidence",
    "status": "Status",
    "submitted_by": "Submitted By",
    "source_interface": "Source Interface",
    "source_link": "Source Link",
    "suggested_action": "Suggested Action",
    "next_owner": "Next Owner",
    "reasoning": "Reasoning",
    "clarifying_questions_asked": "Clarifying Questions Asked",
    "duplicate_candidate_note": "Duplicate Candidate Note",
    "build_surface": "Build Surface",
    "version_truth": "Version Truth",
    "suggested_repo": "Suggested Repo",
    "suggested_path": "Suggested Path",
    "approval_notes": "Approval Notes",
}
CHECKBOX_MAP = {
    "cursor_handoff_needed": "Cursor Handoff Needed?",
    "github_publish_needed": "GitHub Publish Needed?",
}
REQUIRED = {
    "title",
    "raw_submission",
    "clean_summary",
    "category",
    "suggested_destination",
    "confidence",
    "status",
    "submitted_by",
    "source_interface",
    "next_owner",
    "suggested_action",
    "analyst_reason",
    "source_fingerprint",
}


def fail(message: str, code: int = 1) -> None:
    print(json.dumps({"success": False, "error": message}, ensure_ascii=False))
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


def token_for_write() -> str:
    load_dotenv()
    token = os.environ.get("AIRTABLE_WRITE_TOKEN") or os.environ.get("AIRTABLE_API_KEY")
    if not token:
        fail("AIRTABLE_WRITE_TOKEN not set")
    return token


def airtable_request(method: str, path: str, data: dict[str, Any] | None = None) -> dict[str, Any]:
    url = f"https://api.airtable.com/v0/{BASE_ID}/{path}"
    body = json.dumps(data).encode("utf-8") if data is not None else None
    req = urllib.request.Request(
        url,
        data=body,
        headers={
            "Authorization": f"Bearer {token_for_write()}",
            "Content-Type": "application/json",
        },
        method=method,
    )
    try:
        with urllib.request.urlopen(req) as resp:
            raw = resp.read().decode("utf-8")
            return json.loads(raw) if raw else {}
    except urllib.error.HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="replace")
        raise RuntimeError(f"Airtable API error ({exc.code}): {detail}") from exc


# Minimum substance for analyst-authored fields. The hard gate against file dumps.
MIN_CLAIM_CHARS = 24
MIN_REASON_CHARS = 24
BANNED_SUMMARY_PREFIXES = ("Potential context from", "Source:", "Scanner candidate:")


def _looks_like_path(text: str) -> bool:
    stripped = text.strip()
    return stripped.startswith(("/", "file://", "http")) and " " not in stripped


def _reject(reason: str) -> None:
    """Raise so the batch loop can record this and continue to the next candidate."""
    raise ValueError(reason)


def fields_from_payload(payload: dict[str, Any], batch_id: str) -> dict[str, Any]:
    missing = [key for key in REQUIRED if payload.get(key) in (None, "")]
    if missing:
        _reject(f"Missing required candidate fields: {', '.join(sorted(missing))}")
    if payload["status"] not in ALLOWED_STATUSES:
        _reject(f"Scanner status not allowed: {payload['status']}")
    if payload["submitted_by"] != "Other":
        _reject("Scanner candidates must use Submitted By = Other")
    if payload["source_interface"] != "Other":
        _reject("Scanner candidates must use Source Interface = Other")

    # Hard analyst gate: a real claim and a real reason, never a file path or template.
    claim = str(payload["clean_summary"]).strip()
    reason = str(payload["analyst_reason"]).strip()
    title = str(payload["title"]).strip()
    if title.startswith("Scanner candidate:"):
        _reject("Title is a placeholder; analyst must name the claim")
    if claim.startswith(BANNED_SUMMARY_PREFIXES) or _looks_like_path(claim):
        _reject("Clean Summary is a template or file path, not a stated claim")
    if len(claim) < MIN_CLAIM_CHARS or " " not in claim:
        _reject("Clean Summary is too thin to be a claim")
    if len(reason) < MIN_REASON_CHARS or " " not in reason:
        _reject("analyst_reason is too thin to justify surfacing this")

    action = payload.get("suggested_action") or DEFAULT_SUGGESTED_ACTION
    if action not in SAFE_SUGGESTED_ACTIONS:
        action = DEFAULT_SUGGESTED_ACTION

    fingerprint = str(payload["source_fingerprint"]).strip()
    reasoning = (
        f"Created by Clive Context Scanner | batch_id={batch_id} | "
        f"source_fingerprint={fingerprint} | reason: {reason}"
    )

    payload = {**payload, "suggested_action": action, "reasoning": reasoning}

    fields: dict[str, Any] = {}
    for key, airtable_name in FIELD_MAP.items():
        value = payload.get(key)
        if value in (None, "", [], {}):
            continue
        fields[airtable_name] = value
    for key, airtable_name in CHECKBOX_MAP.items():
        if key in payload:
            fields[airtable_name] = bool(payload[key])
    fields["User Confirmation"] = False
    return fields


def create_record(fields: dict[str, Any]) -> dict[str, Any]:
    result = airtable_request("POST", TABLE_ID, {"records": [{"fields": fields}]})
    records = result.get("records") or []
    if not records:
        fail("Airtable create returned no records")
    return records[0]


def main() -> None:
    parser = argparse.ArgumentParser(description="Create Context Intake candidates from scanner JSON")
    parser.add_argument("--batch-id", required=True)
    parser.add_argument("--max-create", type=int, default=50)
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()

    raw = sys.stdin.read()
    if not raw.strip():
        fail("No scanner JSON on stdin")
    try:
        scan = json.loads(raw)
    except json.JSONDecodeError as exc:
        fail(f"Invalid scanner JSON: {exc}")
    candidates = scan.get("candidates") or []
    eligible = [c for c in candidates if c.get("intake_payload")]
    eligible = eligible[: args.max_create]

    if args.dry_run:
        print(json.dumps({"success": True, "dry_run": True, "would_create": len(eligible)}, ensure_ascii=False))
        return

    created: list[dict[str, Any]] = []
    failed: list[dict[str, Any]] = []
    for candidate in eligible:
        try:
            fields = fields_from_payload(candidate["intake_payload"], args.batch_id)
            record = create_record(fields)
            created.append(
                {
                    "record_id": record["id"],
                    "url": RECORD_URL.format(record_id=record["id"]),
                    "title": record.get("fields", {}).get("Title"),
                }
            )
        except Exception as exc:  # noqa: BLE001 — keep batch moving on single-record failures
            failed.append(
                {
                    "title": candidate.get("intake_payload", {}).get("title"),
                    "error": str(exc),
                }
            )

    if not created:
        fail(f"No records created; first error: {failed[0]['error'] if failed else 'unknown'}")

    print(
        json.dumps(
            {
                "success": True,
                "batch_id": args.batch_id,
                "created_count": len(created),
                "failed_count": len(failed),
                "created": created,
                "failed": failed,
            },
            ensure_ascii=False,
        )
    )


if __name__ == "__main__":
    main()
