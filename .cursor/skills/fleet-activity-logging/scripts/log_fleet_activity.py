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
  agent_name, runtime, trigger, user, thread_url, model,
  dispatch_ticket (REQUIRED when parent_session_id is set), and the optional
  dispatch_ticket_event_id / dispatch_ticket_sequence / dispatch_ticket_context
Activity keys: summary, event_id, sequence, session_id, event_type,
  user_message, reply_digest, context_referenced, detail, outcome, target_url,
  model, cost_usd (Session End only), review_status (defaulted "Unreviewed"),
  dispatch_ticket (verbatim brief; writes User Message, waives reply_digest)
Reports keys: title, report_type, agent_slug, headline, body, period_start,
  period_end (YYYY-MM-DD dates), evidence, supersedes (list of Reports rec ids)

Raw Airtable field IDs (fld...) are also accepted and passed through unchanged.

Contract (Matthew Airtable redesign, 2026-08-08):
- CREATE ONLY; base hard-locked; at-least-once (retries reuse Event IDs).
- VALIDATES: refuses incomplete rows with a precise missing-keys error.
  Required (sessions): session_id, agent_slug, agent_name, runtime, trigger,
  user, thread_url, model.
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
- DISPATCH TICKET (Halvard equip, 2026-08-19): a child session — one whose
  parent_session_id is set — must record the verbatim brief it was dispatched
  with as its first-turn User Message, so the job ticket is readable and can be
  scored. The pen refuses a child Sessions row without `dispatch_ticket`, then
  FILLS the ticket itself: it creates the session's first Activity row with
  user_message = the brief, sequence 0 (override with
  dispatch_ticket_sequence), no event_type and no reply_digest. The ticket row
  is deliberately untyped, so AI still owns User/Agent Turn Type; nothing here
  writes Agent Quality, Human Quality, or a review score. The agent-to-agent
  marker is Parent Session ID + a first-turn User Message — NOT User Turn Type
  = "Brief", which is mostly Matthew briefing a head. Root sessions have no
  dispatcher, so `dispatch_ticket` is refused on them. An agent that writes the
  first row itself may instead pass `dispatch_ticket` on an Activity row: the
  pen writes it into User Message and waives reply_digest (a ticket has no
  reply yet).
- Do not write AI-owned fields (Session Summary, AI Turn Summary, Headline).
- Defaults: review_status="Unreviewed". Session link is injected from
  session_record_id. Reviewer-owned score fields are rejected.
- TIMESTAMP IS NEVER WRITTEN: timestamp / started keys are silently stripped.
  Airtable's createdTime ("Created") is authoritative for session and event
  time (Matthew, 2026-07-26 timestamp retirement). Do not map or require started.
- Reports (added 2026-07-26): complete reports are documents in the Reports
  table. Required: title, report_type, agent_slug, headline, body, plus
  session_record_id for the Session link. The authoring session's Completion
  row carries the headline and target_url to the report row; never duplicate
  the body into Activity. Reports are immutable; revisions are new rows
  linking the old via supersedes.
- Never prints the token. Credential: FLEET_ACTIVITY_WRITE.
  Hyperagent injects it via RunWithCredentials. Cursor/Claude have no injector,
  so the script also reads the repo's gitignored .env, trying FLEET_ACTIVITY_WRITE
  first, then HOUSEHOLD_ACTIVITY_WRITE_TOKEN, then AIRTABLE_WRITE_TOKEN. Only the
  SOURCE NAME is ever reported; the value is never printed.
  `--check` resolves the credential and probes write access without creating rows.
  From a git worktree, .env is also read from the primary checkout (gitignored
  files are not copied into worktrees).
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
# started / fldTOGhUjtylNV4ll retired with the Sessions "Started" field (2026-07-26);
# kept in STRIP so legacy payloads that still send them do not fail validation.
STRIP_KEYS = {"timestamp", "started", "fldTl7rXvf7YHgImz", "fldTOGhUjtylNV4ll"}

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
                     "trigger", "user", "thread_url", "model"]
ACTIVITY_REQUIRED = ["event_id", "sequence", "session_id", "model"]
REPORTS_REQUIRED = ["title", "report_type", "agent_slug", "headline", "body"]
# Mechanical classes agents may still set when they know the event class.
TYPED_REQUIRE_SUMMARY = {
    "Decision", "Action", "Blocker", "Question", "Escalation", "Error", "Completion",
}
CONTEXT_REQUIRED_TYPES = {"Completion", "Decision"}

# Dispatch ticket keys are consumed by the pen; they are never Airtable fields.
# `dispatch_ticket` carries the verbatim brief a child session was dispatched
# with. On a Sessions row it is required whenever parent_session_id is set, and
# the pen turns it into that session's first Activity row. On an Activity row it
# writes User Message and waives reply_digest.
TICKET_KEY = "dispatch_ticket"
TICKET_OPTION_KEYS = ("dispatch_ticket_event_id", "dispatch_ticket_sequence",
                      "dispatch_ticket_context")
TICKET_KEYS = (TICKET_KEY,) + TICKET_OPTION_KEYS
TICKET_DEFAULT_CONTEXT = "dispatch brief"
TICKET_DEFAULT_SEQUENCE = 0
TICKET_MISSING_HINT = (
    'dispatch_ticket (the verbatim brief your dispatcher sent — a child session '
    "must log its job ticket as the first-turn User Message)"
)


# Credential resolution order. FLEET_ACTIVITY_WRITE is the intended base-scoped,
# write-only PAT and always wins. The rest are documented local fallbacks so the
# Cursor/Claude lane works without a credential injector; they are broader tokens,
# so setting FLEET_ACTIVITY_WRITE narrows the blast radius with no code change.
CREDENTIAL_KEYS = ("FLEET_ACTIVITY_WRITE", "HOUSEHOLD_ACTIVITY_WRITE_TOKEN",
                   "AIRTABLE_WRITE_TOKEN")
# Gitignored local credential files, relative to the repo root, in priority order.
ENV_FILES = (".env", "website/.env.local")


def _is_git_checkout(path: str) -> bool:
    """True for a primary clone (.git dir) or a linked worktree (.git file)."""
    git = os.path.join(path, ".git")
    return os.path.isdir(git) or os.path.isfile(git)


def _repo_root() -> str:
    """Walk up from this script until a git checkout is found."""
    path = os.path.dirname(os.path.abspath(__file__))
    while True:
        if _is_git_checkout(path):
            return path
        parent = os.path.dirname(path)
        if parent == path:
            return os.getcwd()
        path = parent


def _gitdir_from_pointer(git_file: str):
    """Read a worktree `.git` pointer file. Returns an absolute gitdir or None."""
    try:
        with open(git_file, "r", encoding="utf-8", errors="replace") as handle:
            for line in handle:
                line = line.strip()
                if line.lower().startswith("gitdir:"):
                    raw = line.split(":", 1)[1].strip()
                    if not raw:
                        return None
                    if not os.path.isabs(raw):
                        raw = os.path.abspath(os.path.join(os.path.dirname(git_file), raw))
                    return raw
    except OSError:
        return None
    return None


def _primary_checkout_root(repo_root: str):
    """If repo_root is a linked worktree, return the primary working tree.

    Git worktrees do not copy gitignored files. The logging credential lives in
    the primary checkout's .env; worktrees must be allowed to read it from there.
    """
    git = os.path.join(repo_root, ".git")
    if os.path.isdir(git) or not os.path.isfile(git):
        return None
    gitdir = _gitdir_from_pointer(git)
    if not gitdir:
        return None
    common = None
    try:
        with open(os.path.join(gitdir, "commondir"), "r", encoding="utf-8",
                  errors="replace") as handle:
            common = handle.read().strip()
    except OSError:
        common = None
    if common:
        common_abs = common if os.path.isabs(common) else os.path.abspath(
            os.path.join(gitdir, common)
        )
        if os.path.basename(common_abs) == ".git" and os.path.isdir(common_abs):
            return os.path.dirname(common_abs)
    marker = os.sep + ".git" + os.sep + "worktrees" + os.sep
    if marker in (gitdir + os.sep):
        main_git = gitdir.split(marker)[0] + os.sep + ".git"
        if os.path.isdir(main_git):
            return os.path.dirname(main_git)
    return None


def _credential_search_roots():
    """Current checkout first, then the primary checkout when this is a worktree."""
    root = _repo_root()
    roots = [root]
    primary = _primary_checkout_root(root)
    if primary and os.path.abspath(primary) != os.path.abspath(root):
        roots.append(primary)
    return roots, root, primary


def _read_env_file(path: str) -> dict:
    values = {}
    try:
        with open(path, "r", encoding="utf-8", errors="replace") as f:
            for line in f:
                line = line.strip()
                if not line or line.startswith("#"):
                    continue
                if line.startswith("export "):
                    line = line[7:].lstrip()
                key, sep, value = line.partition("=")
                if not sep:
                    continue
                value = value.strip()
                if len(value) >= 2 and value[0] == value[-1] and value[0] in "\"'":
                    value = value[1:-1]
                if value:
                    values[key.strip()] = value
    except OSError:
        pass
    return values


def resolve_credential():
    """Return (token, source_label). Never returns or logs the value elsewhere."""
    for key in CREDENTIAL_KEYS:
        token = os.environ.get(key)
        if token:
            return token, f"env:{key}"
    roots, current_root, _primary = _credential_search_roots()
    for root in roots:
        prefix = "" if os.path.abspath(root) == os.path.abspath(current_root) else "primary:"
        for rel in ENV_FILES:
            values = _read_env_file(os.path.join(root, rel))
            for key in CREDENTIAL_KEYS:
                if values.get(key):
                    return values[key], f"{prefix}{rel}:{key}"
    return None, None


def fail(payload) -> None:
    print(json.dumps({"success": False, "error": payload}, ensure_ascii=False), file=sys.stderr)
    sys.exit(1)


def now_iso() -> str:
    return datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%S.000Z")


def _empty(value) -> bool:
    return value in (None, "", [])


def split_ticket_keys(rec: dict):
    """Return (airtable_keys, ticket_keys) — ticket keys never reach Airtable."""
    fields, ticket = {}, {}
    for key, value in rec.items():
        if key in TICKET_KEYS:
            ticket[key] = value
        else:
            fields[key] = value
    return fields, ticket


def _ticket_event_id(session_id: str, agent_slug: str) -> str:
    """Deterministic id so an at-least-once retry re-sends the SAME event_id.

    Session IDs look like `<slug>--<YYYYMMDD>T<HHMM>Z--<suffix>`; fall back to
    today's UTC date and a "0" suffix when a caller uses another shape.
    """
    parts = [p for p in str(session_id).split("--") if p]
    date = datetime.datetime.now(datetime.timezone.utc).strftime("%Y%m%d")
    for part in parts[1:]:
        head = part[:8]
        if len(head) == 8 and head.isdigit():
            date = head
            break
    suffix = "".join(c for c in parts[-1] if c.isalnum() or c == "-") if len(parts) > 2 else ""
    return f"evt-{agent_slug}-{date}-ticket-{suffix or '0'}"


def derive_ticket_row(session_fields: dict, ticket: dict, problems: list, idx: int):
    """Build the first-turn Activity row for a child session from its ticket.

    Untyped on purpose: AI keeps User/Agent Turn Type, and no reviewer-owned or
    AI-owned field is written. The Session link is injected after the Sessions
    row exists.
    """
    sequence = ticket.get("dispatch_ticket_sequence", TICKET_DEFAULT_SEQUENCE)
    try:
        sequence = int(sequence)
    except (TypeError, ValueError):
        problems.append({"record_index": idx,
                         "error": "dispatch_ticket_sequence must be a whole number"})
        return None
    session_id = session_fields.get(SESSIONS_MAP["session_id"]) or ""
    agent_slug = session_fields.get(SESSIONS_MAP["agent_slug"]) or "agent"
    event_id = (ticket.get("dispatch_ticket_event_id")
                or _ticket_event_id(session_id, agent_slug))
    return {
        ACTIVITY_MAP["event_id"]: event_id,
        ACTIVITY_MAP["sequence"]: sequence,
        ACTIVITY_MAP["session_id"]: session_id,
        ACTIVITY_MAP["model"]: session_fields.get(SESSIONS_MAP["model"]),
        ACTIVITY_MAP["user_message"]: ticket.get(TICKET_KEY),
        ACTIVITY_MAP["context_referenced"]: (ticket.get("dispatch_ticket_context")
                                            or TICKET_DEFAULT_CONTEXT),
        ACTIVITY_MAP["review_status"]: "Unreviewed",
    }


def normalise(table: str, rec: dict, problems: list, idx: int) -> dict:
    """Map semantic keys to field IDs; pass raw fld* keys through; reject unknowns."""
    mapping = MAPS[table]
    out = {}
    for key, value in rec.items():
        if key in STRIP_KEYS:
            continue  # timestamps / retired started are Airtable-owned; never written
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
    """Return (ready_rows, ticket_rows); ticket_rows aligns index-for-index."""
    problems, ready, tickets = [], [], []
    mapping = MAPS[table]
    for idx, rec in enumerate(records):
        rec, ticket = split_ticket_keys(rec)
        fields = normalise(table, rec, problems, idx)
        missing = []
        ticket_row = None
        if ticket and table == "reports":
            for key in ticket:
                problems.append({"record_index": idx, "error": f"unknown key: {key}"})
            ticket = {}
        stray = [k for k in TICKET_OPTION_KEYS if k in ticket]
        if stray and _empty(ticket.get(TICKET_KEY)):
            problems.append({"record_index": idx,
                             "error": f"{', '.join(stray)} needs dispatch_ticket"})
        if table == "sessions":
            # Pure default: a session with no root_session_id given is its own root.
            if fields.get(mapping["root_session_id"]) in (None, ""):
                fields[mapping["root_session_id"]] = fields.get(mapping["session_id"])
            for k in SESSIONS_REQUIRED:
                if fields.get(mapping[k]) in (None, "", []):
                    missing.append(k)
            is_child = not _empty(fields.get(mapping["parent_session_id"]))
            has_ticket = not _empty(ticket.get(TICKET_KEY))
            if is_child and not has_ticket:
                missing.append(TICKET_MISSING_HINT)
            elif has_ticket and not is_child:
                problems.append({
                    "record_index": idx,
                    "error": "dispatch_ticket belongs to child sessions only — set "
                             "parent_session_id, or drop the ticket on a root session",
                })
            elif has_ticket:
                ticket_row = derive_ticket_row(fields, ticket, problems, idx)
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

            ticket_text = ticket.get(TICKET_KEY)
            is_ticket = not _empty(ticket_text)
            if is_ticket:
                current = fields.get(mapping["user_message"])
                if _empty(current):
                    fields[mapping["user_message"]] = ticket_text
                elif str(current).strip() != str(ticket_text).strip():
                    problems.append({
                        "record_index": idx,
                        "error": "dispatch_ticket and user_message disagree — send the "
                                 "brief once",
                    })
                if _empty(fields.get(mapping["context_referenced"])):
                    fields[mapping["context_referenced"]] = TICKET_DEFAULT_CONTEXT
                if not _empty(fields.get(mapping["event_type"])):
                    problems.append({
                        "record_index": idx,
                        "error": "a dispatch ticket row stays untyped so AI keeps User "
                                 "and Agent Turn Type — remove event_type",
                    })

            etype = fields.get(mapping["event_type"])
            has_user = not _empty(fields.get(mapping["user_message"]))
            # A ticket is the prompt a child was handed; its reply comes later.
            has_reply = not _empty(fields.get(mapping["reply_digest"])) or is_ticket

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
            # dict.fromkeys keeps first-seen order while dropping repeats, so a key
            # flagged by two rules is reported once.
            problems.append({"record_index": idx, "missing": list(dict.fromkeys(missing))})
        ready.append(fields)
        tickets.append(ticket_row)
    if problems:
        fail({"validation": problems,
              "hint": "Fix the listed keys and retry with the SAME event_ids."})
    return ready, tickets


def post_batch(token: str, table_id: str, records: list, context: dict = None) -> dict:
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
                _fail_http(e2, "after 429 retry", context)
        _fail_http(e, None, context)


def _fail_http(error, note, context: dict = None) -> None:
    detail = f"HTTP {error.code}"
    if note:
        detail += f" {note}"
    detail += f": {error.read().decode()[:300]}"
    if context:
        fail(dict(context, http=detail))
    fail(detail)


def check_credential(token: str) -> str:
    """Probe write access with a field name that cannot exist, so nothing is created.

    422 UNKNOWN_FIELD_NAME means the token authenticates and holds create scope on
    this base; 401/403 means it does not.
    """
    body = json.dumps({"records": [{"fields": {"__credential_probe__": "x"}}]}).encode("utf-8")
    req = urllib.request.Request(
        f"{API}/{BASE_ID}/{TABLES['sessions']}", data=body, method="POST",
        headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
    )
    try:
        with urllib.request.urlopen(req, timeout=30):
            return "unexpected-200"
    except urllib.error.HTTPError as e:
        if e.code == 422:
            return "ok"
        return f"denied-{e.code}"
    except urllib.error.URLError as e:
        return f"unreachable ({e.reason})"


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--payload")
    ap.add_argument("--check", action="store_true",
                    help="Report credential presence and write access; creates nothing.")
    args = ap.parse_args()

    token, source = resolve_credential()

    if args.check:
        print(json.dumps({
            "credential_found": bool(token),
            "credential_source": source,  # source NAME only; never the value
            "write_access": check_credential(token) if token else "no-credential",
        }))
        return

    if not args.payload:
        fail("--payload is required (or use --check)")
    if not token:
        fail("No logging credential found: set FLEET_ACTIVITY_WRITE in the "
             "environment or in the repo's gitignored .env (primary checkout "
             "if this is a worktree)")

    with open(args.payload, "r", encoding="utf-8") as f:
        payload = json.load(f)

    table = str(payload.get("table", "")).lower()
    table_id = TABLES.get(table)
    if not table_id:
        fail("payload.table must be 'sessions', 'activity', or 'reports'")

    records = [r.get("fields", r) for r in (payload.get("records") or [])]
    if not records:
        fail("no records in payload")

    records, tickets = validate_and_default(table, records,
                                            payload.get("session_record_id"))

    created = []
    for i in range(0, len(records), BATCH):
        out = post_batch(token, table_id, records[i : i + BATCH])
        created += [r["id"] for r in out.get("records", [])]
        if i + BATCH < len(records):
            time.sleep(0.25)

    # Child sessions carry their dispatch ticket; write it as the first Activity
    # row now that the Session record exists to link to.
    ticket_rows = []
    for session_record, ticket_row in zip(created, tickets):
        if ticket_row:
            ticket_rows.append(dict(ticket_row,
                                    **{ACTIVITY_MAP["session_link"]: [session_record]}))
    ticket_created = []
    for i in range(0, len(ticket_rows), BATCH):
        out = post_batch(
            token, TABLES["activity"], ticket_rows[i : i + BATCH],
            context={"sessions_created": created,
                     "dispatch_tickets_written": ticket_created,
                     "hint": "Sessions rows exist. Retry ONLY the ticket rows as an "
                             "activity payload with session_record_id and the same "
                             "event_ids; do not re-send the sessions row."},
        )
        ticket_created += [r["id"] for r in out.get("records", [])]
        if i + BATCH < len(ticket_rows):
            time.sleep(0.25)

    result = {"success": True, "table": table, "created": created,
              "credential_source": source}
    if ticket_created:
        result["dispatch_tickets"] = ticket_created
    print(json.dumps(result))


if __name__ == "__main__":
    main()
