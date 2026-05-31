#!/usr/bin/env python3
"""Sync Hyperagent release notes into the repo as unverified context.

The scanner is deliberately conservative:
- It writes only to docs/context/hyperagent-releases.json.
- New entries are status="unverified" until Matthew promotes them into
  docs/context/hyperagent-platform.md.
- It deduplicates by Message-ID when available, otherwise by content hash.

Inputs:
  airtable: read Emails rows categorised as Hyperagent Release (primary path)
  files: parse .eml/.txt/.md files from a local folder
  stdin: parse one pasted/exported email from stdin
  imap:  search an IMAP mailbox using env vars (Gmail app password or equivalent)
"""

from __future__ import annotations

import argparse
import hashlib
import imaplib
import json
import os
import re
import sys
from datetime import datetime, timedelta, timezone
from email import policy
from email.parser import BytesParser, Parser
from pathlib import Path
from typing import Any

REPO_ROOT = Path(__file__).resolve().parents[2]
RELEASE_LOG = REPO_ROOT / "docs" / "context" / "hyperagent-releases.json"
PLATFORM_DOC = REPO_ROOT / "docs" / "context" / "hyperagent-platform.md"

DEFAULT_KEYWORDS = (
    "hyperagent",
    "release",
    "changelog",
    "what's new",
    "whats new",
    "new feature",
    "mcp",
    "integration",
    "skill",
    "agent",
    "model",
    "composio",
)


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def fail(message: str, code: int = 1) -> None:
    print(json.dumps({"success": False, "error": message}, ensure_ascii=False))
    sys.exit(code)


def content_hash(text: str) -> str:
    return hashlib.sha256(text.encode("utf-8", errors="replace")).hexdigest()


def load_log() -> dict[str, Any]:
    if not RELEASE_LOG.exists():
        return {
            "schema_version": 1,
            "last_synced_at": None,
            "last_sync_source": None,
            "curation_rule": (
                "Scanner entries are unverified until Matthew promotes durable "
                "facts into docs/context/hyperagent-platform.md."
            ),
            "releases": [],
        }
    return json.loads(RELEASE_LOG.read_text(encoding="utf-8"))


def save_log(log: dict[str, Any]) -> None:
    RELEASE_LOG.parent.mkdir(parents=True, exist_ok=True)
    RELEASE_LOG.write_text(json.dumps(log, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


def existing_ids(log: dict[str, Any]) -> set[str]:
    ids: set[str] = set()
    for entry in log.get("releases", []):
        if entry.get("source_id"):
            ids.add(entry["source_id"])
        if entry.get("content_hash"):
            ids.add(entry["content_hash"])
    return ids


def message_text(message) -> str:
    if message.is_multipart():
        parts: list[str] = []
        for part in message.walk():
            ctype = part.get_content_type()
            disp = (part.get("Content-Disposition") or "").lower()
            if "attachment" in disp:
                continue
            if ctype in {"text/plain", "text/html"}:
                payload = part.get_content()
                if isinstance(payload, str):
                    parts.append(payload)
        return "\n\n".join(parts)
    payload = message.get_content()
    return payload if isinstance(payload, str) else str(payload)


def parse_email_bytes(raw: bytes, source_hint: str) -> dict[str, str]:
    message = BytesParser(policy=policy.default).parsebytes(raw)
    return {
        "source_hint": source_hint,
        "message_id": (message.get("Message-ID") or "").strip(),
        "date": (message.get("Date") or "").strip(),
        "from": (message.get("From") or "").strip(),
        "subject": (message.get("Subject") or "").strip(),
        "body": message_text(message),
    }


def parse_text(raw: str, source_hint: str) -> dict[str, str]:
    message = Parser(policy=policy.default).parsestr(raw)
    if message.get("Subject") or message.get("From"):
        return {
            "source_hint": source_hint,
            "message_id": (message.get("Message-ID") or "").strip(),
            "date": (message.get("Date") or "").strip(),
            "from": (message.get("From") or "").strip(),
            "subject": (message.get("Subject") or "").strip(),
            "body": message_text(message),
        }
    return {
        "source_hint": source_hint,
        "message_id": "",
        "date": "",
        "from": "",
        "subject": source_hint,
        "body": raw,
    }


def relevant(text: str, keywords: tuple[str, ...]) -> bool:
    haystack = text.lower()
    return any(keyword.lower() in haystack for keyword in keywords)


def sender_matches(parsed: dict[str, str], sender: str | None) -> bool:
    if not sender:
        return True
    needle = sender.lower()
    return needle in (parsed.get("from") or "").lower() or needle in (
        parsed.get("source_hint") or ""
    ).lower()


def extract_bullets(body: str, limit: int = 12) -> list[str]:
    clean = re.sub(r"<[^>]+>", " ", body)
    clean = re.sub(r"\s+", " ", clean)
    sentences = re.split(r"(?<=[.!?])\s+", clean)
    bullets: list[str] = []
    for sentence in sentences:
        s = sentence.strip(" -\t\r\n")
        if len(s) < 35:
            continue
        if relevant(s, DEFAULT_KEYWORDS):
            bullets.append(s[:280])
        if len(bullets) >= limit:
            break
    return bullets


def build_entry(parsed: dict[str, str], *, source_type: str = "email") -> dict[str, Any]:
    body = parsed.get("body") or ""
    digest_basis = "\n".join(
        [
            parsed.get("message_id") or "",
            parsed.get("date") or "",
            parsed.get("from") or "",
            parsed.get("subject") or "",
            body,
        ]
    )
    digest = content_hash(digest_basis)
    source_id = parsed.get("message_id") or digest
    entry: dict[str, Any] = {
        "source_id": source_id,
        "content_hash": digest,
        "status": "unverified",
        "captured_at": now_iso(),
        "source_type": source_type,
        "source_hint": parsed.get("source_hint"),
        "date": parsed.get("date"),
        "from": parsed.get("from"),
        "subject": parsed.get("subject"),
        "extracted_bullets": extract_bullets(body),
        "raw_excerpt": body.strip()[:2000],
        "promotion_notes": "",
    }
    if parsed.get("airtable_record_id"):
        entry["airtable_record_id"] = parsed["airtable_record_id"]
    return entry


def iter_file_inputs(source_dir: Path) -> list[dict[str, str]]:
    if not source_dir.exists():
        fail(f"Source directory does not exist: {source_dir}")
    messages: list[dict[str, str]] = []
    for path in sorted(source_dir.iterdir()):
        if path.suffix.lower() not in {".eml", ".txt", ".md"}:
            continue
        raw = path.read_bytes()
        if path.suffix.lower() == ".eml":
            messages.append(parse_email_bytes(raw, str(path)))
        else:
            messages.append(parse_text(raw.decode("utf-8", errors="replace"), str(path)))
    return messages


def iter_stdin_input() -> list[dict[str, str]]:
    raw = sys.stdin.read()
    if not raw.strip():
        fail("No input on stdin")
    return [parse_text(raw, "stdin")]


def iter_airtable_inputs(args: argparse.Namespace) -> tuple[list[dict[str, str]], list[str]]:
    sys.path.insert(0, str(Path(__file__).resolve().parent))
    from read_email_inbox import list_records_paginated  # noqa: WPS433
    from context_architecture_common import and_formula, eq_clause  # noqa: WPS433

    clauses = [eq_clause("Email Category", args.category)]
    if not args.include_synced:
        clauses.append(eq_clause("Scanner Status", "New"))

    records = list_records_paginated(
        fields=[
            "Subject",
            "From",
            "From Email",
            "Received At",
            "Gmail Message ID",
            "Gmail Link",
            "Body",
            "Body Excerpt",
            "AI Summary",
            "Email Category",
            "Scanner Status",
        ],
        formula=and_formula(clauses),
        max_records=args.max_messages,
        sort_field="Received At",
    )

    parsed: list[dict[str, str]] = []
    record_ids: list[str] = []
    for record in records:
        fields = record.get("fields") or {}
        body = (fields.get("Body") or fields.get("Body Excerpt") or fields.get("AI Summary") or "")
        from_value = fields.get("From") or fields.get("From Email") or ""
        received = fields.get("Received At") or record.get("createdTime") or ""
        parsed.append(
            {
                "source_hint": f"airtable:{record['id']}",
                "airtable_record_id": record["id"],
                "message_id": (fields.get("Gmail Message ID") or "").strip(),
                "date": received if isinstance(received, str) else str(received),
                "from": from_value if isinstance(from_value, str) else str(from_value),
                "subject": (fields.get("Subject") or "").strip(),
                "body": body if isinstance(body, str) else str(body),
            }
        )
        record_ids.append(record["id"])
    return parsed, record_ids


def mark_airtable_synced(record_ids: list[str], *, dry_run: bool) -> None:
    if dry_run or not record_ids:
        return
    sys.path.insert(0, str(Path(__file__).resolve().parent))
    from context_architecture_common import update_record  # noqa: WPS433

    for record_id in record_ids:
        update_record(
            "Emails",
            record_id,
            {"Scanner Status": "Synced to repo"},
            token_role="write",
        )


def iter_imap_inputs(args: argparse.Namespace) -> list[dict[str, str]]:
    host = os.environ.get("HYPERAGENT_RELEASE_IMAP_HOST", "imap.gmail.com")
    user = os.environ.get("HYPERAGENT_RELEASE_IMAP_USER")
    password = os.environ.get("HYPERAGENT_RELEASE_IMAP_PASSWORD")
    mailbox = os.environ.get("HYPERAGENT_RELEASE_MAILBOX", "INBOX")
    if not user or not password:
        fail(
            "IMAP mode requires HYPERAGENT_RELEASE_IMAP_USER and "
            "HYPERAGENT_RELEASE_IMAP_PASSWORD"
        )

    since = (datetime.now() - timedelta(days=args.since_days)).strftime("%d-%b-%Y")
    criteria = [f'SINCE "{since}"']
    if args.sender:
        criteria.append(f'FROM "{args.sender}"')
    query = "(" + " ".join(criteria) + ")"

    messages: list[dict[str, str]] = []
    with imaplib.IMAP4_SSL(host) as conn:
        conn.login(user, password)
        conn.select(mailbox)
        status, data = conn.search(None, query)
        if status != "OK":
            fail(f"IMAP search failed: {status} {data}")
        ids = (data[0] or b"").split()
        for msg_id in ids[-args.max_messages :]:
            status, msg_data = conn.fetch(msg_id, "(RFC822)")
            if status != "OK":
                continue
            for part in msg_data:
                if isinstance(part, tuple):
                    messages.append(parse_email_bytes(part[1], f"imap:{mailbox}:{msg_id.decode()}"))
    return messages


def main() -> None:
    parser = argparse.ArgumentParser(description="Sync Hyperagent releases into docs/context")
    parser.add_argument(
        "--mode",
        choices=["airtable", "files", "stdin", "imap"],
        required=True,
    )
    parser.add_argument("--source-dir", type=Path, help="Directory of .eml/.txt/.md exports")
    parser.add_argument("--sender", help="Sender/domain filter, e.g. hyperagent.ai")
    parser.add_argument(
        "--category",
        default="Hyperagent Release",
        help="Emails category to sync (airtable mode)",
    )
    parser.add_argument(
        "--include-synced",
        action="store_true",
        help="Include Emails rows already marked Synced to repo",
    )
    parser.add_argument("--since-days", type=int, default=90)
    parser.add_argument("--max-messages", type=int, default=50)
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()

    airtable_record_ids: list[str] = []
    if args.mode == "airtable":
        parsed_messages, airtable_record_ids = iter_airtable_inputs(args)
    elif args.mode == "files":
        if not args.source_dir:
            fail("--source-dir is required for files mode")
        parsed_messages = iter_file_inputs(args.source_dir)
    elif args.mode == "stdin":
        parsed_messages = iter_stdin_input()
    else:
        parsed_messages = iter_imap_inputs(args)

    keywords = DEFAULT_KEYWORDS
    candidates = []
    for parsed in parsed_messages:
        combined = "\n".join([parsed.get("subject", ""), parsed.get("from", ""), parsed.get("body", "")])
        if args.mode not in {"imap", "airtable"} and not sender_matches(parsed, args.sender):
            continue
        if args.mode == "airtable" or relevant(combined, keywords):
            source_type = "airtable_email" if args.mode == "airtable" else "email"
            candidates.append(build_entry(parsed, source_type=source_type))

    log = load_log()
    seen = existing_ids(log)
    new_entries = [
        entry
        for entry in candidates
        if entry["source_id"] not in seen and entry["content_hash"] not in seen
    ]
    synced_record_ids = [
        entry["airtable_record_id"]
        for entry in new_entries
        if entry.get("airtable_record_id")
    ]

    if not args.dry_run:
        log.setdefault("releases", []).extend(new_entries)
        log["last_synced_at"] = now_iso()
        log["last_sync_source"] = args.mode
        save_log(log)
        mark_airtable_synced(synced_record_ids, dry_run=False)

    print(
        json.dumps(
            {
                "success": True,
                "mode": args.mode,
                "platform_doc": str(PLATFORM_DOC.relative_to(REPO_ROOT)),
                "release_log": str(RELEASE_LOG.relative_to(REPO_ROOT)),
                "parsed_count": len(parsed_messages),
                "candidate_count": len(candidates),
                "new_count": len(new_entries),
                "dry_run": args.dry_run,
                "new_subjects": [entry.get("subject") for entry in new_entries],
                "airtable_rows_marked_synced": len(synced_record_ids) if not args.dry_run else 0,
            },
            ensure_ascii=False,
        )
    )


if __name__ == "__main__":
    main()
