#!/usr/bin/env python3
"""
Clive Context Intake — create one record in Context Intake and read it back.

Hardcoded to AstraJax base appYv601Oq7fKTCj0, table tblJCmPGPUyszgFux only.
Requires AIRTABLE_WRITE_TOKEN in repo-root .env (see .env.example).

Usage (JSON via stdin):
    echo '{"title":"...", "raw_submission":"...", ...}' | python3 create_context_intake.py

Output: JSON on stdout with record_id, fields, url, and success flag.
Errors: JSON with "error" key and non-zero exit code.
"""

from __future__ import annotations

import json
import sys
import urllib.error
import urllib.request

from context_architecture_common import load_dotenv, token_for_role

BASE_ID = "appYv601Oq7fKTCj0"
TABLE_ID = "tblJCmPGPUyszgFux"
RECORD_URL = f"https://airtable.com/{BASE_ID}/{TABLE_ID}/{{record_id}}"

REQUIRED_KEYS = (
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
)

ALLOWED_STATUSES = {
    "New",
    "Needs clarification",
    "Ready for review",
    "Possible duplicate",
}

FORBIDDEN_STATUSES = {
    "Approved",
    "Rejected",
    "Published",
    "Deployed",
}

# JSON key -> Airtable field name
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
}

CHECKBOX_KEYS = {
    "user_confirmation": "User Confirmation",
    "cursor_handoff_needed": "Cursor Handoff Needed?",
    "github_publish_needed": "GitHub Publish Needed?",
}


def fail(message: str, code: int = 1) -> None:
    print(json.dumps({"success": False, "error": message}))
    sys.exit(code)


def airtable_request(method: str, path: str, data: dict | None = None) -> dict:
    load_dotenv()
    token = token_for_role("write")

    url = f"https://api.airtable.com/v0/{BASE_ID}/{path}"
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
    }
    body = json.dumps(data).encode("utf-8") if data is not None else None
    req = urllib.request.Request(url, data=body, headers=headers, method=method)

    try:
        with urllib.request.urlopen(req) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="replace")
        fail(f"Airtable API error ({exc.code}): {detail}")


def build_fields(payload: dict) -> dict:
    fields: dict = {}

    for key in REQUIRED_KEYS:
        value = payload.get(key)
        if value is None or (isinstance(value, str) and not value.strip()):
            fail(f"Missing required field: {key}")
        fields[FIELD_MAP[key]] = value

    status = fields["Status"]
    if status in FORBIDDEN_STATUSES:
        fail(f"Status '{status}' is not allowed for Intake")
    if status not in ALLOWED_STATUSES:
        fail(f"Status '{status}' is not a valid Intake status")

    user_confirmed = payload.get("user_confirmation")
    if user_confirmed is not True:
        fail("user_confirmation must be true before create")

    fields["User Confirmation"] = True

    for key, airtable_name in FIELD_MAP.items():
        if key in REQUIRED_KEYS:
            continue
        value = payload.get(key)
        if value is not None and value != "":
            fields[airtable_name] = value

    for key, airtable_name in CHECKBOX_KEYS.items():
        if key == "user_confirmation":
            continue
        value = payload.get(key)
        if value is not None:
            fields[airtable_name] = bool(value)

    return fields


def create_record(fields: dict) -> dict:
    result = airtable_request("POST", TABLE_ID, {"records": [{"fields": fields}]})
    records = result.get("records") or []
    if not records:
        fail("Airtable create returned no records")
    return records[0]


def get_record(record_id: str) -> dict:
    result = airtable_request("GET", f"{TABLE_ID}/{record_id}")
    return result


def main() -> None:
    raw = sys.stdin.read()
    if not raw.strip():
        fail("No JSON input on stdin")

    try:
        payload = json.loads(raw)
    except json.JSONDecodeError as exc:
        fail(f"Invalid JSON input: {exc}")

    fields = build_fields(payload)
    created = create_record(fields)
    record_id = created["id"]
    stored = get_record(record_id)
    stored_fields = stored.get("fields") or {}

    out = {
        "success": True,
        "record_id": record_id,
        "url": RECORD_URL.format(record_id=record_id),
        "fields": stored_fields,
    }
    print(json.dumps(out, ensure_ascii=False))


if __name__ == "__main__":
    main()
