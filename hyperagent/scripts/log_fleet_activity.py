#!/usr/bin/env python3
"""Fleet Activity Logging helper — VALIDATING create-only writer for the Fleet Activity base.

Usage:
  python3 log_fleet_activity.py --payload /path/to/payload.json

Payload shape:
  {
    "table": "sessions" | "activity",
    "session_record_id": "recXXXXXXXXXXXXXX",   # activity only; script injects the
                                                 # Session link into every record
    "records": [ { "<fieldId>": value, ... }, ... ]
  }
  (Records may also be wrapped as {"fields": {...}} — both shapes are normalised.)

Contract (design v0.4; validation added 2026-07-11 after the first compliance miss):
- CREATE ONLY. No update/delete code path exists.
- Base hard-locked regardless of what the token could reach.
- VALIDATES every record before writing: refuses incomplete rows with a precise
  error listing what is missing, so the agent fixes and retries (same Event IDs).
- Auto-fills pure defaults only: Review Status="Unreviewed", Timestamp=now (UTC).
  Never invents content fields, and never fills token fields (mechanical only).
- At-least-once: retries reuse Event IDs; consumers dedupe.
- Never prints the token.

Credential: FLEET_ACTIVITY_WRITE env var (injected by RunWithCredentials).
"""
import argparse
import datetime
import json
import os
import sys
import time
import urllib.error
import urllib.request

BASE_ID = "appF7jQD4ZKrDC7e1"  # Fleet Activity — hard-locked, do not parameterise
API = "https://api.airtable.com/v0"
BATCH = 10  # REST API create limit per request

TABLES = {"sessions": "tblUi4nmBKX2u8nFx", "activity": "tblNxNLyC31KDQbRl"}

# --- Field IDs -------------------------------------------------------------
S = {  # Sessions
    "session_id": "fldHTqDQeAEqE4JCb", "parent": "fldVFuT8AHFFU28al",
    "slug": "fldzed2cCR3HyCCOb", "name": "fld4jizroZZZVxDtb",
    "runtime": "fldoE8uXllbSMAPPS", "trigger": "fldG3t3bCjY8tklgv",
    "user": "fldMg0dpNURUNEkWW", "started": "fldTOGhUjtylNV4ll",
    "thread_url": "fldqEN6EC48KcsZrS", "model": "fld5Rjoxc2q5hxR4R",
}
A = {  # Activity
    "summary": "fldoVtBIAKanaafMg", "event_id": "fldxIVVOp7VvfVQ5j",
    "sequence": "fldeQ8SjlrZfj3a6M", "session_id": "fldz1skahzUvg1vzX",
    "session_link": "fldRD3GFz3PqYTANC", "event_type": "fldTCd93XF8XhsVoZ",
    "timestamp": "fldTl7rXvf7YHgImz", "user_message": "fldzSTdm15GQf88Ph",
    "reply_digest": "fldBj92Hu9gDesX6u", "context_ref": "fldkSONM4RjGmHjZT",
    "detail": "fldjXdEnPfc6BeKqv", "outcome": "fldYYSYt5yVgN8dc1",
    "target_url": "fld76GAzl1Q0Brqux", "model": "fldXYLfw560tuXFk8",
    "review_status": "fldCtTcdklAcDa9tW",
    # mechanical-only, never validated/filled here:
    "tokens_in": "fldoPEuPYgLCsbYgz", "tokens_out": "fldmGBFPPUouTtn5Y",
    # reviewer-owned, loggers never write:
    "human_q": "fldlKDwCGDAj6fah5", "agent_q": "fldLExhD3nr41nir6",
}

SESSIONS_REQUIRED = {
    S["session_id"]: "Session ID", S["slug"]: "Agent Slug", S["name"]: "Agent Name",
    S["runtime"]: "Runtime", S["trigger"]: "Trigger", S["user"]: "User",
    S["started"]: "Started", S["thread_url"]: "Thread URL", S["model"]: "Model",
}
ACTIVITY_REQUIRED = {
    A["summary"]: "Summary", A["event_id"]: "Event ID", A["sequence"]: "Sequence",
    A["session_id"]: "Session ID", A["event_type"]: "Event Type", A["model"]: "Model",
}
TURN_EXTRA = {
    A["user_message"]: "User Message", A["reply_digest"]: "Reply Digest",
}
# Context Referenced is required on these event types (write "none" if truly nothing):
CONTEXT_REQUIRED_TYPES = {"Turn", "Completion", "Decision"}
REVIEWER_ONLY = {A["human_q"]: "Human Quality", A["agent_q"]: "Agent Quality"}


def fail(payload) -> None:
    print(json.dumps({"success": False, "error": payload}, ensure_ascii=False), file=sys.stderr)
    sys.exit(1)


def now_iso() -> str:
    return datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%S.000Z")


def validate_and_default(table: str, records: list, session_record_id):
    """Refuse incomplete rows; fill pure defaults; inject the session link."""
    problems = []
    for idx, rec in enumerate(records):
        missing = []
        if table == "sessions":
            for fid, label in SESSIONS_REQUIRED.items():
                if rec.get(fid) in (None, "", []):
                    missing.append(label)
        else:
            # defaults first (pure defaults only)
            rec.setdefault(A["review_status"], "Unreviewed")
            rec.setdefault(A["timestamp"], now_iso())
            # session link: inject from payload-level session_record_id
            if not rec.get(A["session_link"]):
                if session_record_id:
                    rec[A["session_link"]] = [session_record_id]
                else:
                    missing.append("Session link (set session_record_id in payload)")
            for fid, label in ACTIVITY_REQUIRED.items():
                if rec.get(fid) in (None, "", []):
                    missing.append(label)
            if rec.get(A["event_type"]) == "Turn":
                for fid, label in TURN_EXTRA.items():
                    if rec.get(fid) in (None, "", []):
                        missing.append(label)
            if rec.get(A["event_type"]) in CONTEXT_REQUIRED_TYPES:
                if rec.get(A["context_ref"]) in (None, "", []):
                    missing.append('Context Referenced (write "none" if nothing was consulted)')
            for fid, label in REVIEWER_ONLY.items():
                if fid in rec:
                    missing.append(f"{label} is reviewer-owned — remove it")
        if missing:
            problems.append({"record_index": idx, "missing_or_invalid": missing})
    if problems:
        fail({"validation": problems,
              "hint": "Fix the listed fields and retry with the SAME Event IDs."})
    return records


def post_batch(token: str, table_id: str, records: list) -> dict:
    body = json.dumps({"records": [{"fields": r} for r in records]}).encode("utf-8")
    req = urllib.request.Request(
        f"{API}/{BASE_ID}/{table_id}", data=body, method="POST",
        headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
    )
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            return json.load(resp)
    except urllib.error.HTTPError as e:
        if e.code == 429:
            time.sleep(30)  # house rule: single retry after 30 s, same Event IDs
            try:
                with urllib.request.urlopen(req, timeout=30) as resp:
                    return json.load(resp)
            except urllib.error.HTTPError as e2:
                fail(f"HTTP {e2.code} after 429 retry: {e2.read().decode()[:300]}")
        fail(f"HTTP {e.code}: {e.read().decode()[:300]}")


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--payload", required=True, help="Path to payload JSON")
    args = ap.parse_args()

    token = os.environ.get("FLEET_ACTIVITY_WRITE")
    if not token:
        fail("FLEET_ACTIVITY_WRITE not set (run via RunWithCredentials)")

    with open(args.payload, "r", encoding="utf-8") as f:
        payload = json.load(f)

    table = str(payload.get("table", "")).lower()
    table_id = TABLES.get(table)
    if not table_id:
        fail("payload.table must be 'sessions' or 'activity'")

    records = [r.get("fields", r) for r in (payload.get("records") or [])]
    if not records:
        fail("no records in payload")

    records = validate_and_default(table, records, payload.get("session_record_id"))

    created = []
    for i in range(0, len(records), BATCH):
        out = post_batch(token, table_id, records[i : i + BATCH])
        created += [r["id"] for r in out.get("records", [])]
        if i + BATCH < len(records):
            time.sleep(0.25)  # stay well under 5 req/s per base

    print(json.dumps({"success": True, "table": table, "created": created}))


if __name__ == "__main__":
    main()
