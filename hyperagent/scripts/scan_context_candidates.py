#!/usr/bin/env python3
"""
Scan Airtable Emails for context-ingest candidates; dedupe against Context Intake
and Context Items before any create_context_intake.py run.

Usage:
  python3 hyperagent/scripts/scan_context_candidates.py
  python3 hyperagent/scripts/scan_context_candidates.py --dry-run --max-records 20
  python3 hyperagent/scripts/scan_context_candidates.py --mark-synced  # after intake logged
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from typing import Any

from context_architecture_common import (
    BASE_ID,
    eq_clause,
    list_records,
    load_dotenv,
    table_id,
    token_for_role,
)

EXCLUDED_CATEGORIES = {"Hyperagent Release"}
INTAKE_TABLE = "Context Intake"
ITEMS_TABLE = "Context Items"
EMAILS_TABLE = "Emails"

INTAKE_FIELDS = ["Title", "Source Link", "Status", "Raw Submission"]
ITEM_FIELDS = ["Title", "Status"]
EMAIL_FIELDS = [
    "Subject",
    "From",
    "Body Excerpt",
    "Gmail Message ID",
    "Gmail Link",
    "Email Category",
    "Scanner Status",
    "AI Summary",
]


def fail(message: str, code: int = 1) -> None:
    print(json.dumps({"success": False, "error": message}))
    sys.exit(code)


def norm(s: str) -> str:
    return re.sub(r"\s+", " ", (s or "").strip().lower())


def load_index() -> tuple[set[str], set[str], dict[str, str]]:
    """Returns (gmail_ids, titles, source_link_by_gmail)."""
    gmail_ids: set[str] = set()
    titles: set[str] = set()
    link_by_gmail: dict[str, str] = {}

    for table, fields in ((INTAKE_TABLE, INTAKE_FIELDS), (ITEMS_TABLE, ITEM_FIELDS)):
        try:
            records = list_records(table, fields=fields, max_records=200, token_role="read")
        except Exception:
            continue
        for rec in records:
            fields_data = rec.get("fields") or {}
            title = fields_data.get("Title") or ""
            if title:
                titles.add(norm(title))
            if table != INTAKE_TABLE:
                continue
            link = fields_data.get("Source Link") or ""
            if link:
                link_by_gmail[link] = rec.get("id", "")
            raw = fields_data.get("Raw Submission") or ""
            for token in (link, raw):
                m = re.search(r"Gmail Message ID[:\s]+([a-zA-Z0-9]+)", token, re.I)
                if m:
                    gmail_ids.add(m.group(1))

    return gmail_ids, titles, link_by_gmail


def dedup_verdict(
    *,
    gmail_id: str,
    gmail_link: str,
    subject: str,
    gmail_ids: set[str],
    titles: set[str],
    link_by_gmail: dict[str, str],
) -> tuple[str, str | None]:
    if gmail_id and gmail_id in gmail_ids:
        return "duplicate_intake", None
    if gmail_link and gmail_link in link_by_gmail:
        return "duplicate_intake", link_by_gmail[gmail_link]
    subj = norm(subject)
    if subj and subj in titles:
        return "duplicate_item", None
    return "new", None


def fetch_email_candidates(max_records: int) -> list[dict[str, Any]]:
    records = list_records(
        EMAILS_TABLE,
        fields=EMAIL_FIELDS,
        max_records=max_records * 2,
        formula=eq_clause("Scanner Status", "New"),
        sort_field="Received At",
        token_role="read",
    )
    out: list[dict[str, Any]] = []
    for rec in records:
        cat = (rec.get("fields") or {}).get("Email Category") or ""
        if cat in EXCLUDED_CATEGORIES:
            continue
        out.append(rec)
        if len(out) >= max_records:
            break
    return out


def mark_synced(record_ids: list[str]) -> None:
    import urllib.request

    load_dotenv()
    token = token_for_role("write")
    tid = table_id(EMAILS_TABLE)
    for rid in record_ids:
        url = f"https://api.airtable.com/v0/{BASE_ID}/{tid}/{rid}"
        body = json.dumps({"fields": {"Scanner Status": "Synced to repo"}}).encode()
        req = urllib.request.Request(
            url,
            data=body,
            headers={
                "Authorization": f"Bearer {token}",
                "Content-Type": "application/json",
            },
            method="PATCH",
        )
        urllib.request.urlopen(req)


def main() -> None:
    parser = argparse.ArgumentParser(description="Scan Emails for new context intake candidates")
    parser.add_argument("--max-records", type=int, default=25)
    parser.add_argument("--dry-run", action="store_true", help="Report only; do not update Emails")
    parser.add_argument(
        "--mark-synced",
        action="store_true",
        help="Mark listed email record IDs as Synced to repo (comma-separated --email-ids)",
    )
    parser.add_argument("--email-ids", default="", help="Comma-separated Airtable record ids")
    args = parser.parse_args()

    if args.mark_synced:
        ids = [x.strip() for x in args.email_ids.split(",") if x.strip()]
        if not ids:
            fail("--mark-synced requires --email-ids")
        mark_synced(ids)
        print(json.dumps({"success": True, "marked": len(ids)}))
        return

    gmail_ids, titles, link_by_gmail = load_index()
    records = fetch_email_candidates(args.max_records)

    candidates: list[dict[str, Any]] = []
    for rec in records:
        f = rec.get("fields") or {}
        gmail_id = f.get("Gmail Message ID") or ""
        gmail_link = f.get("Gmail Link") or ""
        subject = f.get("Subject") or "(no subject)"
        verdict, match_id = dedup_verdict(
            gmail_id=gmail_id,
            gmail_link=gmail_link,
            subject=subject,
            gmail_ids=gmail_ids,
            titles=titles,
            link_by_gmail=link_by_gmail,
        )
        candidates.append(
            {
                "email_id": rec["id"],
                "email_url": rec.get("url"),
                "subject": subject,
                "from": f.get("From"),
                "category": f.get("Email Category"),
                "gmail_message_id": gmail_id,
                "gmail_link": gmail_link,
                "body_excerpt": f.get("Body Excerpt") or "",
                "ai_summary": f.get("AI Summary") or "",
                "dedup": verdict,
                "match_intake_id": match_id,
            }
        )

    new_count = sum(1 for c in candidates if c["dedup"] == "new")
    print(
        json.dumps(
            {
                "success": True,
                "scanned": len(candidates),
                "new_count": new_count,
                "duplicate_count": len(candidates) - new_count,
                "candidates": candidates,
            },
            indent=2,
        )
    )


if __name__ == "__main__":
    try:
        main()
    except Exception as exc:
        fail(str(exc))
