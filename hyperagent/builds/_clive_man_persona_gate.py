"""Persona Config gate for Clive's Man Hyperagent v0.4 family generator.

Fail-closed until Operational v0.4 is Approved in Airtable. Offline tests may pass
``--fixture-approved`` with the labelled test fixture only — never Pending content.
"""

from __future__ import annotations

import hashlib
import json
import sys
from dataclasses import dataclass
from pathlib import Path
from typing import Any

BUILDS_DIR = Path(__file__).resolve().parent
REPO_ROOT = BUILDS_DIR.parents[1]
FIXTURE_PATH = BUILDS_DIR / "fixtures" / "persona_operational_v0_4_approved.json"

sys.path.insert(0, str(REPO_ROOT / "scripts"))

from _clive_man_v0_4_contract import (  # noqa: E402
    PERSONA_V04_RECORD_ID,
    PERSONA_V04_VERSION_NAME,
)

try:
    import generate_persona_config_sync as persona_sync  # noqa: E402
except ImportError as exc:  # pragma: no cover
    raise SystemExit(f"Cannot import persona sync module: {exc}") from exc


@dataclass(frozen=True)
class PersonaSource:
    record_id: str
    config_name: str
    status: str
    system_prompt: str
    rules_section: str
    output_format: str
    content_sha256: str
    source: str  # "airtable" | "fixture"


def _bundle_text(system_prompt: str, rules: str, output: str) -> str:
    return "\n\n".join(
        part.strip()
        for part in (system_prompt, rules, output)
        if part and part.strip()
    )


def content_sha256(system_prompt: str, rules: str, output: str) -> str:
    body = _bundle_text(system_prompt, rules, output)
    return hashlib.sha256(body.encode("utf-8")).hexdigest()


def _fields_from_record(record: dict) -> tuple[str, str, str, str, str]:
    cfg = persona_sync.AGENTS["clive-man"]
    fields = record.get("fields") or {}
    f = cfg["fields"]
    name = str(fields.get(f["name"]) or "")
    status = persona_sync._status_name(fields.get(f["status"]))
    prompt = str(fields.get(f["prompt"]) or "")
    rules = str(fields.get(f["rules"]) or "")
    output = str(fields.get(f["output"]) or "")
    return name, status, prompt, rules, output


def _from_record(record: dict, *, source: str) -> PersonaSource:
    name, status, prompt, rules, output = _fields_from_record(record)
    digest = content_sha256(prompt, rules, output)
    return PersonaSource(
        record_id=record["id"],
        config_name=name,
        status=status,
        system_prompt=prompt,
        rules_section=rules,
        output_format=output,
        content_sha256=digest,
        source=source,
    )


def load_fixture(path: Path = FIXTURE_PATH) -> PersonaSource:
    if not path.is_file():
        raise SystemExit(
            f"Missing offline fixture: {path}. "
            "Cannot run --fixture-approved without labelled test fixture."
        )
    payload = json.loads(path.read_text(encoding="utf-8"))
    if payload.get("_fixture_note", "").startswith("OFFLINE TEST FIXTURE") is False:
        if "_fixture_note" not in payload:
            raise SystemExit(f"Fixture {path} missing _fixture_note guard.")
    record = {
        "id": payload["record_id"],
        "fields": {
            persona_sync.AGENTS["clive-man"]["fields"]["name"]: payload["config_name"],
            persona_sync.AGENTS["clive-man"]["fields"]["status"]: payload["status"],
            persona_sync.AGENTS["clive-man"]["fields"]["prompt"]: payload["system_prompt"],
            persona_sync.AGENTS["clive-man"]["fields"]["rules"]: payload["rules_section"],
            persona_sync.AGENTS["clive-man"]["fields"]["output"]: payload["output_format"],
        },
    }
    src = _from_record(record, source="fixture")
    if src.record_id != PERSONA_V04_RECORD_ID:
        raise SystemExit(
            f"Fixture record_id {src.record_id!r} != expected {PERSONA_V04_RECORD_ID!r}"
        )
    if src.config_name != PERSONA_V04_VERSION_NAME:
        raise SystemExit(
            f"Fixture config_name {src.config_name!r} != {PERSONA_V04_VERSION_NAME!r}"
        )
    if src.status != persona_sync.APPROVED_STATUS:
        raise SystemExit(f"Fixture status must be Approved, got {src.status!r}")
    return src


def resolve_live_pin(pin_version: str = PERSONA_V04_VERSION_NAME) -> PersonaSource:
    cfg = persona_sync.AGENTS["clive-man"]
    record = persona_sync._resolve_pinned_record("clive-man", cfg, pin_version)
    return _from_record(record, source="airtable")


def verify_pending_gate() -> dict[str, Any]:
    persona_sync.verify_pending_gate("clive-man")
    return {
        "record_id": PERSONA_V04_RECORD_ID,
        "config_name": PERSONA_V04_VERSION_NAME,
        "status": persona_sync.PENDING_STATUS,
        "blocked": True,
    }


def resolve(
    *,
    pin_version: str | None = PERSONA_V04_VERSION_NAME,
    fixture_approved: bool = False,
    verify_pending: bool = False,
) -> PersonaSource | dict[str, Any]:
    if verify_pending:
        return verify_pending_gate()
    if fixture_approved:
        return load_fixture()
    if not pin_version:
        raise SystemExit("pin_version required unless --fixture-approved or --verify-pending-gate")
    return resolve_live_pin(pin_version)
