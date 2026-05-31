#!/usr/bin/env python3
"""Draft a read-only daily Curator review pack from Airtable context tables."""

from __future__ import annotations

import argparse
import json
import subprocess
import sys
from datetime import datetime
from pathlib import Path
from typing import Any

REPO_ROOT = Path(__file__).resolve().parents[2]
DEFAULT_OUTPUT_DIR = REPO_ROOT / "hyperagent" / "reports" / "curator"


def run_json(command: list[str]) -> dict[str, Any]:
    result = subprocess.run(
        [sys.executable, *command],
        cwd=REPO_ROOT,
        text=True,
        capture_output=True,
        check=False,
    )
    if result.returncode != 0:
        return {
            "success": False,
            "command": command,
            "error": result.stderr.strip() or result.stdout.strip(),
        }
    try:
        return json.loads(result.stdout)
    except json.JSONDecodeError as exc:
        return {
            "success": False,
            "command": command,
            "error": f"Invalid JSON: {exc}",
            "raw": result.stdout,
        }


def text(value: Any, fallback: str = "") -> str:
    if value is None:
        return fallback
    if isinstance(value, list):
        return ", ".join(str(item) for item in value)
    return str(value)


def excerpt(value: Any, limit: int = 500) -> str:
    raw = " ".join(text(value).split())
    if len(raw) <= limit:
        return raw
    return raw[: limit - 3] + "..."


def normalise_title(value: str) -> str:
    return "".join(ch.lower() for ch in value if ch.isalnum() or ch.isspace()).strip()


def record_lines(records: list[dict[str, Any]], kind: str) -> list[str]:
    if not records:
        return [f"No {kind} returned."]

    lines: list[str] = []
    for idx, record in enumerate(records, start=1):
        fields = record.get("fields", {})
        title = fields.get("Title") or fields.get("Pack Name") or "Untitled"
        lines.extend(
            [
                f"### {idx}. {title}",
                "",
                f"- Record ID: `{record.get('id', 'unknown')}`",
                f"- URL: {record.get('url', 'not returned')}",
            ]
        )
        for field in (
            "Status",
            "Category",
            "Suggested Destination",
            "Secondary Destination",
            "Confidence",
            "Submitted By",
            "Next Owner",
            "Authority",
            "Freshness",
            "Owner",
            "Primary Destination",
            "Version",
            "Created at",
        ):
            if field in fields:
                lines.append(f"- {field}: {text(fields[field])}")
        summary = fields.get("Clean Summary") or fields.get("Canonical Text") or fields.get("Purpose")
        if summary:
            lines.extend(["", f"Summary: {excerpt(summary, 700)}"])
        raw = fields.get("Raw Submission")
        if raw:
            lines.extend(["", f"Raw excerpt: {excerpt(raw, 700)}"])
        if fields.get("Reasoning"):
            lines.extend(["", f"Reasoning: {excerpt(fields['Reasoning'], 500)}"])
        lines.append("")
    return lines


def duplicate_hints(intake_records: list[dict[str, Any]], item_records: list[dict[str, Any]]) -> list[str]:
    item_titles = {
        normalise_title(text(record.get("fields", {}).get("Title", ""))): record
        for record in item_records
        if record.get("fields", {}).get("Title")
    }
    hints: list[str] = []
    for record in intake_records:
        fields = record.get("fields", {})
        title = normalise_title(text(fields.get("Title", "")))
        if title and title in item_titles:
            existing = item_titles[title]
            hints.append(
                f"- Intake `{record.get('id')}` may duplicate Context Item `{existing.get('id')}`: {fields.get('Title')}"
            )
    return hints or ["No exact title duplicates detected in this small batch."]


def build_pack(run_date: str, intake: dict[str, Any], items: dict[str, Any], packs: dict[str, Any]) -> str:
    intake_records = intake.get("records", []) if intake.get("success") else []
    item_records = items.get("records", []) if items.get("success") else []
    pack_records = packs.get("records", []) if packs.get("success") else []
    generated_at = datetime.now().isoformat(timespec="seconds")

    lines = [
        f"# Clive Curator Daily Review Pack - {run_date}",
        "",
        f"Generated at: {generated_at}",
        "",
        "Safety: this scheduled pack is read-only. It did not create Context Items, approve context, publish context, or write Change Log entries.",
        "",
        "## Summary",
        "",
        f"- Ready intake records returned: {len(intake_records)}",
        f"- Proposed context items returned: {len(item_records)}",
        f"- Context packs returned: {len(pack_records)}",
        "",
        "## Data Read Status",
        "",
        f"- Context Intake: {'OK' if intake.get('success') else intake.get('error', 'failed')}",
        f"- Context Items: {'OK' if items.get('success') else items.get('error', 'failed')}",
        f"- Context Packs: {'OK' if packs.get('success') else packs.get('error', 'failed')}",
        "",
        "## Duplicate Hints",
        "",
        *duplicate_hints(intake_records, item_records),
        "",
        "## Ready Intake Queue",
        "",
        *record_lines(intake_records, "ready intake records"),
        "## Existing Proposed Context Items",
        "",
        *record_lines(item_records, "proposed context items"),
        "## Context Packs",
        "",
        *record_lines(pack_records, "context packs"),
        "## Curator Review Template",
        "",
        "Use `@clive-curator` to turn this briefing into a judgement-heavy review pack.",
        "",
        "```text",
        "Curator review pack",
        "",
        "Batch: daily-" + run_date,
        "Source records:",
        "",
        "Proposal 1",
        "Title:",
        "Canonical statement:",
        "Source intake records:",
        "Suggested context pack:",
        "Destination:",
        "Affected surface:",
        "Authority:",
        "Freshness:",
        "Conflicts:",
        "Duplicate or superseded context:",
        "Risk if included:",
        "Risk if omitted:",
        "Recommended action:",
        "Human decision needed:",
        "```",
        "",
    ]
    return "\n".join(lines)


def main() -> None:
    parser = argparse.ArgumentParser(description="Create a read-only daily Curator review pack")
    parser.add_argument("--max-records", type=int, default=10)
    parser.add_argument("--output-dir", default=str(DEFAULT_OUTPUT_DIR))
    parser.add_argument("--date", default=datetime.now().strftime("%Y-%m-%d"))
    args = parser.parse_args()

    if args.max_records > 10:
        raise SystemExit("--max-records may not exceed 10")

    intake = run_json([
        "hyperagent/scripts/read_context_intake.py",
        "--status",
        "Ready for review",
        "--max-records",
        str(args.max_records),
    ])
    items = run_json([
        "hyperagent/scripts/read_context_items.py",
        "--status",
        "Proposed",
        "--max-records",
        "10",
    ])
    packs = run_json(["hyperagent/scripts/read_context_packs.py", "--max-records", "20"])

    output_dir = Path(args.output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)
    md_path = output_dir / f"curator-daily-{args.date}.md"
    json_path = output_dir / f"curator-daily-{args.date}.json"

    payload = {
        "success": all(source.get("success") for source in (intake, items, packs)),
        "date": args.date,
        "generated_at": datetime.now().isoformat(timespec="seconds"),
        "sources": {
            "context_intake": intake,
            "context_items": items,
            "context_packs": packs,
        },
        "markdown_path": str(md_path),
    }

    md_path.write_text(build_pack(args.date, intake, items, packs), encoding="utf-8")
    json_path.write_text(json.dumps(payload, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")

    print(json.dumps({"success": payload["success"], "markdown_path": str(md_path), "json_path": str(json_path)}))
    if not payload["success"]:
        sys.exit(1)


if __name__ == "__main__":
    main()
