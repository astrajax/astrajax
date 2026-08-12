"""Parse and validate MCP-approved Persona Config snapshots for Clive's Man v0.4."""

from __future__ import annotations

import hashlib
import json
import re
from pathlib import Path
from typing import Any

from _clive_man_v0_4_contract import (
    PERSONA_V04_RECORD_ID,
    PERSONA_V04_VERSION_NAME,
)

APPROVED_SOURCE_NOTE = "airtable-mcp-approved-snapshot"
APPROVED_BASE_ID = "appZ71CSKBlhnb4hR"
APPROVED_TABLE_ID = "tblQMlziNRMd53Yns"
APPROVED_STATUS = "Approved"

_SECTION_ORDER = ("Operational System Prompt", "Rules Section", "Output Format")


def _bundle_text(system_prompt: str, rules: str, output: str) -> str:
    return "\n\n".join(
        part.strip()
        for part in (system_prompt, rules, output)
        if part and part.strip()
    )


def compute_bundle_sha256(system_prompt: str, rules: str, output: str) -> str:
    return hashlib.sha256(_bundle_text(system_prompt, rules, output).encode("utf-8")).hexdigest()


def _parse_metadata_line(line: str) -> tuple[str, str] | None:
    match = re.match(r"^- ([^:]+):\s*`([^`]+)`\s*$", line.strip())
    if match:
        return match.group(1).strip(), match.group(2)
    match = re.match(r"^- ([^:]+):\s*(.+)\s*$", line.strip())
    if match:
        return match.group(1).strip(), match.group(2).strip()
    return None


def parse_approved_snapshot_markdown(path: Path) -> dict[str, Any]:
    """Extract metadata and exact section bodies without rewriting field text."""
    text = path.read_text(encoding="utf-8")
    if not text.endswith("\n"):
        text = text + "\n"

    metadata: dict[str, str] = {}
    for line in text.splitlines():
        if line.startswith("## "):
            break
        parsed = _parse_metadata_line(line)
        if parsed:
            metadata[parsed[0]] = parsed[1]

    sections: dict[str, str] = {}
    pattern = re.compile(r"^## (Operational System Prompt|Rules Section|Output Format)\s*$", re.MULTILINE)
    matches = list(pattern.finditer(text))
    if len(matches) != 3:
        raise SystemExit(
            f"Approved snapshot {path} must contain exactly three sections; found {len(matches)}."
        )

    for idx, match in enumerate(matches):
        start = match.end()
        end = matches[idx + 1].start() if idx + 1 < len(matches) else len(text)
        body = text[start:end]
        if body.startswith("\n"):
            body = body[1:]
        if body.endswith("\n"):
            body = body[:-1]
        sections[match.group(1)] = body

    for title in _SECTION_ORDER:
        if title not in sections:
            raise SystemExit(f"Approved snapshot {path} missing section {title!r}.")

    record_id = metadata.get("Record", "")
    config_name = metadata.get("Config Name", "")
    status = metadata.get("Status", "")
    base_id = metadata.get("Base", "")
    table_id = metadata.get("Table", "")

    if record_id != PERSONA_V04_RECORD_ID:
        raise SystemExit(f"Record ID mismatch: expected {PERSONA_V04_RECORD_ID!r}, got {record_id!r}.")
    if config_name != PERSONA_V04_VERSION_NAME:
        raise SystemExit(f"Config Name mismatch: expected {PERSONA_V04_VERSION_NAME!r}, got {config_name!r}.")
    if status != APPROVED_STATUS:
        raise SystemExit(f"Status must be Approved, got {status!r}.")
    if base_id != APPROVED_BASE_ID:
        raise SystemExit(f"Base ID mismatch: expected {APPROVED_BASE_ID!r}, got {base_id!r}.")
    if table_id != APPROVED_TABLE_ID:
        raise SystemExit(f"Table ID mismatch: expected {APPROVED_TABLE_ID!r}, got {table_id!r}.")

    system_prompt = sections["Operational System Prompt"]
    rules_section = sections["Rules Section"]
    output_format = sections["Output Format"]
    digest = compute_bundle_sha256(system_prompt, rules_section, output_format)

    read_date = metadata.get("Read after human approval", metadata.get("Read date", "2026-08-12"))
    if "2026" not in read_date:
        read_date = "2026-08-12"

    return {
        "source": APPROVED_SOURCE_NOTE,
        "read_date": read_date.split(":")[-1].strip() if ":" in read_date else read_date,
        "base_id": base_id,
        "table_id": table_id,
        "record_id": record_id,
        "config_name": config_name,
        "role": metadata.get("Role", "Steward"),
        "status": status,
        "system_prompt": system_prompt,
        "rules_section": rules_section,
        "output_format": output_format,
        "content_sha256": digest,
    }


def validate_approved_source_payload(payload: dict[str, Any], *, path: Path | None = None) -> dict[str, Any]:
    """Fail closed unless snapshot metadata, fields and stored hash match."""
    label = str(path) if path else "approved source"
    source = payload.get("source")
    if source != APPROVED_SOURCE_NOTE:
        raise SystemExit(
            f"{label}: source must be {APPROVED_SOURCE_NOTE!r}, got {source!r}. "
            "Fixture notes and Pending snapshots are rejected."
        )

    record_id = payload.get("record_id")
    config_name = payload.get("config_name")
    status = payload.get("status")
    if record_id != PERSONA_V04_RECORD_ID:
        raise SystemExit(f"{label}: record_id mismatch (expected {PERSONA_V04_RECORD_ID!r}).")
    if config_name != PERSONA_V04_VERSION_NAME:
        raise SystemExit(f"{label}: config_name mismatch (expected {PERSONA_V04_VERSION_NAME!r}).")
    if status != APPROVED_STATUS:
        raise SystemExit(f"{label}: status must be Approved, got {status!r}.")

    for field in ("system_prompt", "rules_section", "output_format", "content_sha256"):
        if not payload.get(field):
            raise SystemExit(f"{label}: missing required field {field!r}.")

    computed = compute_bundle_sha256(
        str(payload["system_prompt"]),
        str(payload["rules_section"]),
        str(payload["output_format"]),
    )
    stored = str(payload["content_sha256"])
    if stored != computed:
        raise SystemExit(
            f"{label}: content_sha256 mismatch.\n  stored:   {stored}\n  computed: {computed}"
        )

    if payload.get("base_id") and payload["base_id"] != APPROVED_BASE_ID:
        raise SystemExit(f"{label}: base_id mismatch.")
    if payload.get("table_id") and payload["table_id"] != APPROVED_TABLE_ID:
        raise SystemExit(f"{label}: table_id mismatch.")

    return payload


def load_approved_source_json(path: Path) -> dict[str, Any]:
    if not path.is_file():
        raise SystemExit(f"Approved source file not found: {path}")
    payload = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(payload, dict):
        raise SystemExit(f"Approved source must be a JSON object: {path}")
    return validate_approved_source_payload(payload, path=path)


def write_approved_source_json_from_markdown(md_path: Path, json_path: Path) -> dict[str, Any]:
    payload = parse_approved_snapshot_markdown(md_path)
    json_path.parent.mkdir(parents=True, exist_ok=True)
    json_path.write_text(json.dumps(payload, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    return payload
