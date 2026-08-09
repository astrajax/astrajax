#!/usr/bin/env python3
"""Fleet Activity Logging helper — VALIDATING, SEMANTIC-KEY, create-only writer.

Usage:
  python3 log_fleet_activity.py --payload /path/to/payload.json

Payload (SEMANTIC KEYS — the script owns the field-ID mapping):
  {
    "table": "sessions" | "activity" | "reports",
    "session_record_id": "recXXXXXXXXXXXXXX",   # activity + reports; injected as the Session link
    "records": [ { "<semantic_key>": value, ... }, ... ]
  }

Sessions keys: session_id, parent_session_id, root_session_id, agent_slug,
  agent_name, runtime, trigger, user, started, thread_url, model
Activity keys: summary, event_id, sequence, session_id, event_type,
  user_message, reply_digest, context_referenced, detail, outcome, target_url,
  model, cost_usd (Session End only), review_status (defaulted "Unreviewed")
Reports keys: title, report_type, agent_slug, headline, body, period_start,
  period_end (YYYY-MM-DD dates), evidence, supersedes (list of Reports rec ids)

Raw Airtable field IDs (fld...) are also accepted and passed through unchanged.

Contract (Matthew Airtable redesign, 2026-08-08):
- CREATE ONLY; base hard-locked; at-least-once (retries reuse Event IDs).
- VALIDATES: refuses incomplete rows with a precise missing-keys error.
  Required (sessions): session_id, agent_slug, agent_name, runtime, trigger,
  user, started, thread_url, model.
  Required (activity, always): event_id, sequence, session_id, model.
  event_type maps to Agent Turn Type only (never User Turn Type).
  Optional for ordinary exchanges — AI owns User Turn Type and Agent Turn
  Type on chat. Required only when the agent writes Session End
  (must be "Session End"). Agents may set a mechanical Agent Turn Type
  (Action / Completion / Error / Blocker / Decision / Escalation / Question)
  when they know it; omit for conversational exchanges.
  User Turn Type is AI-owned and rejected if passed.
  Exchange rows (no event_type): require user_message + reply_digest
  (verbatim agent reply; semantic key reply_digest; Airtable still named
  Reply Digest) + context_referenced ("none" if nothing consulted).
  summary optional on exchanges (AI Turn Summary owns turn prose).
  Typed mechanical rows (except Session End): require summary.
  Session End: require outcome; summary optional.
  Completion/Decision (when typed): require context_referenced.
- Do not write AI-owned fields (Session Summary, AI Turn Summary, Headline).
- Defaults: review_status="Unreviewed". Session link is injected from
  session_record_id. Reviewer-owned score fields are rejected.
- TIMESTAMP IS NEVER WRITTEN: timestamp keys are silently stripped. Airtable's
  createdTime field is authoritative for event time (Matthew, 2026-07-26).
- Reports (added 2026-07-26): complete reports are documents in the Reports
  table. Required: title, report_type, agent_slug, headline, body, plus
  session_record_id for the Session link. The authoring session's Completion
  row carries the headline and target_url to the report row; never duplicate
  the body into Activity. Reports are immutable; revisions are new rows
  linking the old via supersedes.
- Never prints the token. Credential: FLEET_ACTIVITY_WRITE (RunWithCredentials).
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
BATCH = 10

TABLES = {"sessions": "tblUi4nmBKX2u8nFx", "activity": "tblNxNLyC31KDQbRl",
          "reports": "tblFzWUIPSiIGZPln"}

# Timestamp is Airtable-owned (createdTime); these keys are stripped, never written.
STRIP_KEYS = {"timestamp", "fldTl7rXvf7YHgImz"}

# AI-owned fields — agents must not write these (rejected if present).
AI_OWNED_KEYS = {
    "ai_turn_summary", "session_summary", "headline_ai",
    "user_turn_type",  # User Turn Type — AI-owned; never agent-written
    "fldwmWz6k1ws9TpmP",  # Activity: AI Turn Summary
    "fldEzckbthD1HjlZe",  # Sessions: Session Summary
    "fldYzD3HHymxRwD4M",  # Sessions: Headline (AI assist)
    "fldTCd93XF8XhsVoZ",  # Activity: User Turn Type (AI-owned)
}

SESSIONS_MAP = {
    "session_id": "fldHTqDQeAEqE4JCb",
    "parent_session_id": "fldVFuT8AHFFU28al",
    "root_session_id": "fld5OjB9QLjNTgsKT",
    "agent_slug": "fldzed2cCR3HyCCOb",
    "agent_name": "fld4jizroZZZVxDtb",
    "runtime": "fldoE8uXllbSMAPPS",
    "trigger": "fldG3t3bCjY8tklgv",
    "user": "fldMg0dpNURUNEkWW",
    "started": "fldTOGhUjtylNV4ll",
    "thread_url": "fldqEN6EC48KcsZrS",
    "model": "fld5Rjoxc2q5hxR4R",
}
ACTIVITY_MAP = {
    "summary": "fldoVtBIAKanaafMg",
    "event_id": "fldxIVVOp7VvfVQ5j",
    "sequence": "fldeQ8SjlrZfj3a6M",
    "session_id": "fldz1skahzUvg1vzX",
    "session_link": "fldRD3GFz3PqYTANC",
    "event_type": "fldvskIDzutu4JzQt",  # Agent Turn Type only; never User Turn Type
    "user_message": "fldzSTdm15GQf88Ph",
    "reply_digest": "fldBj92Hu9gDesX6u",  # verbatim agent reply; field still named Reply Digest
    "context_referenced": "fldkSONM4RjGmHjZT",
    "detail": "fldjXdEnPfc6BeKqv",
    "outcome": "fldYYSYt5yVgN8dc1",
    "target_url": "fld76GAzl1Q0Brqux",
    "model": "fldXYLfw560tuXFk8",
    "review_status": "fldCtTcdklAcDa9tW",
    "cost_usd": "fldyk34Wd33W2xofh",
    "tokens_in": "fldoPEuPYgLCsbYgz",    # mechanical writers only
    "tokens_out": "fldmGBFPPUouTtn5Y",   # mechanical writers only
}
REPORTS_MAP = {
    "title": "fldr0pNUAYm9jEITx",
    "report_type": "fld3uIBw78HahcUms",
    "agent_slug": "fldijGsAXxwMikENa",
    "session_link": "fldO6ZbXNsWduNlov",
    "period_start": "fldnbnJgwJhjpOPz2",
    "period_end": "fldc1uSKfB1wE0MfE",
    "headline": "fldyI1UVIyIcSVhkj",
    "body": "fldt5UAqRVsm0mICy",
    "evidence": "fldGnweCWJkjXVRxu",
    "supersedes": "fldGbXhILELIuJ0vZ",
}
REVIEWER_ONLY_IDS = {"fldlKDwCGDAj6fah5": "human_quality", "fldLExhD3nr41nir6": "agent_quality"}

MAPS = {"sessions": SESSIONS_MAP, "activity": ACTIVITY_MAP, "reports": REPORTS_MAP}

SESSIONS_REQUIRED = ["session_id", "agent_slug", "agent_name", "runtime",
                     "trigger", "user", "started", "thread_url", "model"]
ACTIVITY_REQUIRED = ["event_id", "sequence", "session_id", "model"]
REPORTS_REQUIRED = ["title", "report_type", "agent_slug", "headline", "body"]
# Mechanical classes agents may still set when they know the event class.
TYPED_REQUIRE_SUMMARY = {
    "Decision", "Action", "Blocker", "Question", "Escalation", "Error", "Completion",
}
CONTEXT_REQUIRED_TYPES = {"Completion", "Decision"}


def fail(payload) -> None:
    print(json.dumps({"success": False, "error": payload}, ensure_ascii=False), file=sys.stderr)
    sys.exit(1)


def now_iso() -> str:
    return datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%S.000Z")


def _empty(value) -> bool:
    return value in (None, "", [])


def normalise(table: str, rec: dict, problems: list, idx: int) -> dict:
    """Map semantic keys to field IDs; pass raw fld* keys through; reject unknowns."""
    mapping = MAPS[table]
    out = {}
    for key, value in rec.items():
        if key in STRIP_KEYS:
            continue  # timestamp is Airtable-owned (createdTime); never written
        if key in AI_OWNED_KEYS or (key.startswith("fld") and key in AI_OWNED_KEYS):
            problems.append({"record_index": idx,
                             "error": f"{key} is AI-owned — remove it"})
            continue
        if key.startswith("fld") and len(key) == 17:
            if key in REVIEWER_ONLY_IDS:
                problems.append({"record_index": idx,
                                 "error": f"{REVIEWER_ONLY_IDS[key]} is reviewer-owned — remove it"})
                continue
            if key in AI_OWNED_KEYS:
                problems.append({"record_index": idx,
                                 "error": f"{key} is AI-owned — remove it"})
                continue
            out[key] = value
        elif key in ("human_quality", "agent_quality"):
            problems.append({"record_index": idx, "error": f"{key} is reviewer-owned — remove it"})
        elif key in mapping:
            out[mapping[key]] = value
        else:
            problems.append({"record_index": idx, "error": f"unknown key: {key}"})
    return out


def validate_and_default(table: str, records: list, session_record_id):
    problems, ready = [], []
    mapping = MAPS[table]
    for idx, rec in enumerate(records):
        fields = normalise(table, rec, problems, idx)
        missing = []
        if table == "sessions":
            # Pure default: a session with no root_session_id given is its own root.
            if fields.get(mapping["root_session_id"]) in (None, ""):
                fields[mapping["root_session_id"]] = fields.get(mapping["session_id"])
            for k in SESSIONS_REQUIRED:
                if fields.get(mapping[k]) in (None, "", []):
                    missing.append(k)
        elif table == "reports":
            if not fields.get(mapping["session_link"]):
                if session_record_id:
                    fields[mapping["session_link"]] = [session_record_id]
                else:
                    missing.append("session_link (set session_record_id in payload)")
            for k in REPORTS_REQUIRED:
                if fields.get(mapping[k]) in (None, "", []):
                    missing.append(k)
        else:
            fields.setdefault(mapping["review_status"], "Unreviewed")
            if not fields.get(mapping["session_link"]):
                if session_record_id:
                    fields[mapping["session_link"]] = [session_record_id]
                else:
                    missing.append("session_link (set session_record_id in payload)")
            for k in ACTIVITY_REQUIRED:
                if fields.get(mapping[k]) in (None, "", []):
                    missing.append(k)

            etype = fields.get(mapping["event_type"])
            has_user = not _empty(fields.get(mapping["user_message"]))
            has_reply = not _empty(fields.get(mapping["reply_digest"]))

            if has_user or has_reply:
                if not has_user:
                    missing.append("user_message")
                if not has_reply:
                    missing.append("reply_digest")

            if etype == "Session End":
                if _empty(fields.get(mapping["outcome"])):
                    missing.append("outcome")
            elif etype in TYPED_REQUIRE_SUMMARY:
                if _empty(fields.get(mapping["summary"])):
                    missing.append("summary")
                if etype in CONTEXT_REQUIRED_TYPES:
                    if _empty(fields.get(mapping["context_referenced"])):
                        missing.append('context_referenced (write "none" if nothing consulted)')
            elif _empty(etype):
                # Ordinary exchange — AI owns type fields; agents omit event_type.
                if not has_user:
                    missing.append("user_message")
                if not has_reply:
                    missing.append("reply_digest")
                if _empty(fields.get(mapping["context_referenced"])):
                    missing.append('context_referenced (write "none" if nothing consulted)')
            else:
                # Unexpected choice (e.g. legacy Turn, Open Ended set by agent).
                if _empty(fields.get(mapping["summary"])):
                    missing.append("summary")

        if missing:
            problems.append({"record_index": idx, "missing": missing})
        ready.append(fields)
    if problems:
        fail({"validation": problems,
              "hint": "Fix the listed keys and retry with the SAME event_ids."})
    return ready


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
            time.sleep(30)  # single retry, same payload (same event_ids)
            try:
                with urllib.request.urlopen(req, timeout=30) as resp:
                    return json.load(resp)
            except urllib.error.HTTPError as e2:
                fail(f"HTTP {e2.code} after 429 retry: {e2.read().decode()[:300]}")
        fail(f"HTTP {e.code}: {e.read().decode()[:300]}")


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--payload", required=True)
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
            time.sleep(0.25)
    print(json.dumps({"success": True, "table": table, "created": created}))


if __name__ == "__main__":
    main()
