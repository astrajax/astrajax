"""Ambient Capture V1 intake — load governed scripts for Hyperagent export."""

from __future__ import annotations

import json
from pathlib import Path

from _clive_man_v0_4_contract import (
    ACTOR_AMBIENT,
    BRAIN_WORKSHOP_BASE,
    CHECKPOINT_APPEND_CRED_ENV,
    CHECKPOINT_TABLE_ID,
    CONTEXT_AMENDMENT_VERSIONS_TABLE,
    CRED_AMBIENT_V1_CREATE,
    DRAFT_BRAIN_TRUTH_TABLE,
)

AMBIENT_ROOT = Path(__file__).resolve().parent / "sources" / "clive-man-v0_4" / "ambient"
SCRIPT_FILENAME = "ambient_v1_intake.py"
CONFIG_FILENAME = "ambient_config.py"


def _load_script(name: str) -> str:
    return (AMBIENT_ROOT / name).read_text(encoding="utf-8")


def script_source() -> str:
    """Full ambient intake script source (for tests)."""
    return _load_script(SCRIPT_FILENAME)


def scripts_json() -> str:
    payload = [
        {
            "filename": CONFIG_FILENAME,
            "content": _load_script(CONFIG_FILENAME),
            "description": "Ambient V1 intake constants and field map.",
        },
        {
            "filename": SCRIPT_FILENAME,
            "content": _load_script(SCRIPT_FILENAME),
            "description": (
                "Ambient V1 CREATE_DRAFT_TRUTH intake to Context Amendment Versions "
                f"({CONTEXT_AMENDMENT_VERSIONS_TABLE}) only; actor {ACTOR_AMBIENT}."
            ),
        },
    ]
    return json.dumps(payload)


def ambient_credential_schema() -> str:
    schema = [
        {
            "name": CRED_AMBIENT_V1_CREATE,
            "label": CRED_AMBIENT_V1_CREATE,
            "required": True,
            "type": "password",
            "hint": (
                f"Airtable PAT for Ambient Capture readback + V1 dedupe + create. "
                f"Scopes: data.records:read + data.records:write at base resource "
                f"scope on Brain Workshop {BRAIN_WORKSHOP_BASE} (Airtable PATs do not "
                f"support table-level resource scoping). The typed script enforces "
                f"writes to Context Amendment Versions {CONTEXT_AMENDMENT_VERSIONS_TABLE} "
                f"only; never grant use for direct Draft Brain Truth "
                f"{DRAFT_BRAIN_TRUTH_TABLE} mutation. Injected as env {CRED_AMBIENT_V1_CREATE}."
            ),
        },
        {
            "name": CHECKPOINT_APPEND_CRED_ENV,
            "label": CHECKPOINT_APPEND_CRED_ENV,
            "required": False,
            "type": "password",
            "hint": (
                f"Separate append pen for Ambient Checkpoint Versions {CHECKPOINT_TABLE_ID} "
                f"only. Typed script allows GET checkpoint + Amendment Versions and POST "
                f"checkpoint append only — no PATCH/PUT/DELETE and no Draft/Fingerprint/"
                f"Event/Trusted/Registry writes. **Not minted** until initial scan boundary "
                f"selected and UI source-order verification complete. Injected as env "
                f"{CHECKPOINT_APPEND_CRED_ENV}."
            ),
        },
    ]
    return json.dumps(schema)


def simulate_chunk_drain(count: int, *, interrupt_after: int = 0) -> dict:
    """Offline helper delegating to governed script in dry-run mode."""
    import importlib.util
    import sys
    import tempfile

    spec_dir = AMBIENT_ROOT
    sys.path.insert(0, str(spec_dir))
    try:
        from ambient_v1_intake import process_candidates  # type: ignore

        candidates = [
            {
                "title": f"Ambient capture {i}",
                "canonical_text": f"Canonical text for candidate {i}",
                "brain_slug": "clive",
                "dedupe_key": f"sim-{i}",
                "evidence": f"evidence quote for candidate {i}",
                "confidence": 0.8,
                "v1_report_record_id": "recSimReport",
                "reason": "offline simulation",
            }
            for i in range(count)
        ]
        if interrupt_after and interrupt_after < count:
            first = process_candidates(
                candidates[:interrupt_after], run_id="sim", dry_run=True
            )
            second = process_candidates(
                candidates[interrupt_after:], run_id="sim-resume", dry_run=True
            )
            total = first["written_count"] + second["written_count"]
            return {"partial": first, "resume": second, "total_written": total}
        result = process_candidates(candidates, run_id="sim", dry_run=True)
        return {"total_written": result["written_count"], "checkpoint": CHECKPOINT_TABLE_ID}
    finally:
        if str(spec_dir) in sys.path:
            sys.path.remove(str(spec_dir))
