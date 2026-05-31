#!/usr/bin/env python3
"""Validate Clive Context Architecture V1 guardrails and live Airtable setup."""

from __future__ import annotations

import json
import subprocess
import sys
from pathlib import Path

from context_architecture_common import load_schema

REPO_ROOT = Path(__file__).resolve().parents[2]


def run(cmd: list[str], *, input_data: dict | None = None, expect_success: bool = True) -> tuple[bool, str]:
    proc = subprocess.run(
        cmd,
        input=json.dumps(input_data) if input_data is not None else None,
        text=True,
        capture_output=True,
        check=False,
    )
    ok = proc.returncode == 0
    if ok != expect_success:
        return False, (proc.stdout + proc.stderr).strip()
    return True, (proc.stdout + proc.stderr).strip()


def assert_contains(path: Path, needle: str) -> tuple[bool, str]:
    text = path.read_text(encoding="utf-8")
    if needle not in text:
        return False, f"{path} missing expected text: {needle}"
    return True, f"{path} contains expected text"


def main() -> None:
    results: list[dict[str, str | bool]] = []

    def record(name: str, ok: bool, detail: str) -> None:
        results.append({"test": name, "ok": ok, "detail": detail[:500]})

    schema = load_schema()
    for table in ("Context Intake", "Context Items", "Context Packs", "Agent Environments", "Change Log"):
        ok = table in schema.get("tables", {}) and bool(schema["tables"][table].get("id"))
        record(f"schema_has_{table}", ok, schema["tables"].get(table, {}).get("id", "missing"))

    bad_intake = {
        "title": "Validation should not create",
        "raw_submission": "Validation should not create",
        "clean_summary": "Validation should not create",
        "category": "Decision",
        "suggested_destination": "Airtable",
        "confidence": "High",
        "status": "Approved",
        "submitted_by": "Matthew",
        "source_interface": "Other",
        "next_owner": "Matthew",
        "suggested_action": "Review and approve",
        "user_confirmation": True,
    }
    ok, detail = run([sys.executable, "hyperagent/scripts/create_context_intake.py"], input_data=bad_intake, expect_success=False)
    record("intake_rejects_approved_status", ok and "not allowed for Intake" in detail, detail)

    bad_item = {
        "title": "Validation should not create",
        "canonical_text": "Validation should not create",
        "category": "Decision",
        "owner": "Matthew",
        "authority": "Canonical candidate",
        "freshness": "Current",
        "source_notes": "Validation",
        "status": "Approved",
        "matthew_confirmation": True,
    }
    ok, detail = run([sys.executable, "hyperagent/scripts/create_context_item.py"], input_data=bad_item, expect_success=False)
    record("curator_rejects_non_proposed_create", ok and "only with Status = Proposed" in detail, detail)

    missing_confirmation = dict(bad_item)
    missing_confirmation["status"] = "Proposed"
    missing_confirmation["matthew_confirmation"] = False
    ok, detail = run([sys.executable, "hyperagent/scripts/create_context_item.py"], input_data=missing_confirmation, expect_success=False)
    record("curator_requires_confirmation", ok and "matthew_confirmation must be true" in detail, detail)

    bad_log = {
        "change_summary": "Validation should not publish",
        "change_type": "Schema",
        "destination": ["Airtable"],
        "changed_by": "Matthew",
        "status": "Published",
    }
    ok, detail = run([sys.executable, "hyperagent/scripts/append_change_log.py"], input_data=bad_log, expect_success=False)
    record("change_log_requires_publish_approval", ok and "approved_by = Matthew" in detail, detail)

    ok, detail = run([sys.executable, "hyperagent/scripts/read_context_items.py", "--status", "Proposed", "--max-records", "20"])
    proposed_count = 0
    if ok:
        proposed_count = json.loads(detail)["record_count"]
    record("proposed_items_readable", ok and proposed_count >= 8, f"record_count={proposed_count}")

    ok, detail = run([sys.executable, "hyperagent/scripts/read_context_packs.py", "--max-records", "10"])
    pack_count = 0
    if ok:
        pack_count = json.loads(detail)["record_count"]
    record("context_packs_seeded", ok and pack_count >= 4, f"record_count={pack_count}")

    curator_skill = REPO_ROOT / ".cursor" / "skills" / "clive-context-curator" / "SKILL.md"
    for needle in (
        "Status = Proposed",
        "must not approve",
        "must not",
        "create_context_item.py",
    ):
        ok, detail = assert_contains(curator_skill, needle)
        record(f"curator_skill_contains_{needle}", ok, detail)

    failures = [result for result in results if not result["ok"]]
    print(json.dumps({"success": not failures, "results": results}, indent=2, ensure_ascii=False))
    if failures:
        sys.exit(1)


if __name__ == "__main__":
    main()
