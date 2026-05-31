#!/usr/bin/env python3
"""Upload a PDF to Slides PDF on a TL Onboarding record (default: Butternut Box proof)."""

from __future__ import annotations

import argparse
import json
import os
import sys
import urllib.parse
import urllib.request
from pathlib import Path

BASE_ID = "appYv601Oq7fKTCj0"
TABLE_ID = "tblSdWUBVWrxpislp"
FIELD_ID = "fldapQCEtglSqGlgH"
DEFAULT_TITLE = "Butternut Box proof"
TRAINING_DECK_TITLE = "AI in plain English"


def token() -> str:
    t = os.environ.get("AIRTABLE_API_KEY")
    if not t:
        print("Set AIRTABLE_API_KEY", file=sys.stderr)
        sys.exit(1)
    return t


def find_record_id(title: str) -> str:
    formula = urllib.parse.quote(f'{{Title}}="{title}"')
    url = f"https://api.airtable.com/v0/{BASE_ID}/{TABLE_ID}?filterByFormula={formula}"
    req = urllib.request.Request(url, headers={"Authorization": f"Bearer {token()}"})
    with urllib.request.urlopen(req) as resp:
        data = json.loads(resp.read())
    records = data.get("records", [])
    if not records:
        print(f"No record with Title={title!r}", file=sys.stderr)
        sys.exit(1)
    return records[0]["id"]


def upload(pdf_path: Path, record_id: str) -> None:
    try:
        import requests
    except ImportError:
        print("pip install requests", file=sys.stderr)
        sys.exit(1)

    url = f"https://content.airtable.com/v0/{BASE_ID}/{record_id}/{FIELD_ID}/uploadAttachment"
    size_mb = pdf_path.stat().st_size / 1e6
    print(f"Uploading {pdf_path.name} ({size_mb:.1f} MB)...")
    with pdf_path.open("rb") as f:
        resp = requests.post(
            url,
            headers={"Authorization": f"Bearer {token()}"},
            files={"file": (pdf_path.name, f, "application/pdf")},
            timeout=900,
        )
    print(resp.status_code, resp.text[:500])
    if resp.status_code >= 400:
        sys.exit(1)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("pdf", type=Path, help="Path to PDF file")
    parser.add_argument("--title", default=DEFAULT_TITLE, help="TL Onboarding record title")
    parser.add_argument("--record-id", help="Skip lookup; use this record id")
    args = parser.parse_args()

    if not args.pdf.is_file():
        print(f"Not found: {args.pdf}", file=sys.stderr)
        sys.exit(1)

    record_id = args.record_id or find_record_id(args.title)
    upload(args.pdf.resolve(), record_id)
    print(json.dumps({"success": True, "recordId": record_id}, indent=2))


if __name__ == "__main__":
    main()
