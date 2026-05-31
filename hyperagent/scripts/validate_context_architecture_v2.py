#!/usr/bin/env python3
"""Validate Clive Context Architecture V2 guardrails and live Airtable setup."""

from __future__ import annotations

import json
import os
import subprocess
import sys
from pathlib import Path

from context_architecture_common import (
    bootstrap_item_ids,
    compute_entry_hash,
    item_has_traceability,
    list_records,
    load_schema,
)

REPO_ROOT = Path(__file__).resolve().parents[2]


def run(
    cmd: list[str],
    *,
    input_data: dict | None = None,
    expect_success: bool = True,
    env: dict[str, str] | None = None,
) -> tuple[bool, str]:
    proc = subprocess.run(
        cmd,
        input=json.dumps(input_data) if input_data is not None else None,
        text=True,
        capture_output=True,
        check=False,
        cwd=REPO_ROOT,
        env=env,
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


def validate_change_log_chain() -> tuple[bool, str]:
    records = list_records(
        "Change Log",
        fields=[
            "Change Summary",
            "Change Type",
            "Changed By",
            "Status",
            "Created at",
            "Prev Hash",
            "Entry Hash",
            "Destination",
            "Approved By",
            "Published Path",
            "Commit SHA",
            "Notes",
            "Related Intake",
            "Related Context Item",
        ],
        max_records=100,
        sort_field="Created at",
    )
    if not records:
        return True, "no change log entries"

    records = sorted(records, key=lambda row: row.get("createdTime") or "")
    prev_hash = ""
    for record in records:
        fields = record.get("fields", {})
        entry_hash = (fields.get("Entry Hash") or "").strip()
        stored_prev = fields.get("Prev Hash") or ""
        if not entry_hash:
            return False, f"{record['id']} missing Entry Hash"
        if stored_prev != prev_hash:
            return False, f"{record['id']} Prev Hash mismatch (chain broken)"
        core = {
            "Change Summary": fields.get("Change Summary", ""),
            "Change Type": fields.get("Change Type", ""),
            "Changed By": fields.get("Changed By", ""),
            "Status": fields.get("Status", ""),
            "Created at": fields.get("Created at", ""),
        }
        for optional in (
            "Related Intake",
            "Related Context Item",
            "Destination",
            "Approved By",
            "Published Path",
            "Commit SHA",
            "Notes",
        ):
            if fields.get(optional):
                core[optional] = fields[optional]
        expected = compute_entry_hash(core, prev_hash)
        if expected != entry_hash:
            return False, f"{record['id']} Entry Hash does not match payload (tamper detected)"
        prev_hash = entry_hash
    return True, f"chain intact across {len(records)} entries"


def main() -> None:
    results: list[dict[str, str | bool]] = []

    def record(name: str, ok: bool, detail: str) -> None:
        results.append({"test": name, "ok": ok, "detail": detail[:500]})

    schema = load_schema()
    record("schema_version_v2", schema.get("version") == "v2", f"version={schema.get('version')}")

    for table in ("Context Intake", "Context Items", "Context Packs", "Agent Environments", "Change Log"):
        ok = table in schema.get("tables", {}) and bool(schema["tables"][table].get("id"))
        record(f"schema_has_{table}", ok, schema["tables"].get(table, {}).get("id", "missing"))

    item_fields = schema.get("tables", {}).get("Context Items", {}).get("fields", {})
    for field_name in (
        "Created By",
        "Proposed By Agent",
        "Confirmed By Human",
        "Confirmation Method",
        "Bootstrap Source",
    ):
        record(f"schema_item_field_{field_name}", field_name in item_fields, field_name)

    log_fields = schema.get("tables", {}).get("Change Log", {}).get("fields", {})
    for field_name in ("Prev Hash", "Entry Hash"):
        record(f"schema_log_field_{field_name}", field_name in log_fields, field_name)

    bad_item = {
        "title": "V2 validation reject approved",
        "canonical_text": "Should not create",
        "category": "Decision",
        "owner": "Matthew",
        "authority": "Canonical candidate",
        "freshness": "Current",
        "source_notes": "Validation",
        "status": "Approved",
        "proposed_by_agent": "validate_context_architecture_v2.py",
        "bootstrap": True,
        "source_doc": "validation-only",
    }
    ok, detail = run(
        [sys.executable, "hyperagent/scripts/create_context_item.py"],
        input_data=bad_item,
        expect_success=False,
    )
    record("at1_create_rejects_approved", ok and "only with Status = Proposed" in detail, detail)

    ok, detail = run(
        [sys.executable, "hyperagent/scripts/update_context_item_status.py", "recvWCNlwxlwqrQ0i", "--status", "Approved"],
        expect_success=False,
    )
    record(
        "at2_update_status_removed",
        ok and "approve_context_item.py" in detail,
        detail,
    )

    no_approver_env = os.environ.copy()
    no_approver_env["AIRTABLE_APPROVER_TOKEN"] = ""
    ok, detail = run(
        [
            sys.executable,
            "hyperagent/scripts/approve_context_item.py",
            "recADVsbUDlOnUFCw",
            "--status",
            "Approved",
            "--confirmed-by",
            "Matthew",
        ],
        expect_success=False,
        env=no_approver_env,
    )
    record("at1_approve_requires_approver_token", ok and "AIRTABLE_APPROVER_TOKEN" in detail, detail)

    items = list_records(
        "Context Items",
        fields=[
            "Title",
            "Status",
            "Created By",
            "Confirmed By Human",
            "Source Intake",
            "Bootstrap Source",
        ],
        max_records=100,
        sort_field="Created at",
    )
    missing_trace = [row["id"] for row in items if not item_has_traceability(row.get("fields", {}))]
    record("at3_all_items_have_traceability", not missing_trace, f"missing={missing_trace}")

    approved_without_human = [
        row["id"]
        for row in items
        if row.get("fields", {}).get("Status") == "Approved"
        and not row.get("fields", {}).get("Confirmed By Human")
    ]
    record("at6_approved_have_confirmed_by_human", not approved_without_human, f"missing={approved_without_human}")

    missing_created_by = [row["id"] for row in items if not row.get("fields", {}).get("Created By")]
    record("at6_all_items_have_created_by", not missing_created_by, f"missing={missing_created_by}")

    bootstrap_ids = set(bootstrap_item_ids())
    bootstrap_rows = [row for row in items if row["id"] in bootstrap_ids]
    bootstrap_ok = (
        len(bootstrap_rows) == 8
        and all(row.get("fields", {}).get("Status") != "Approved" for row in bootstrap_rows)
        and all(row.get("fields", {}).get("Created By") == "Agent" for row in bootstrap_rows)
    )
    record(
        "at7_bootstrap_items_quarantined",
        bootstrap_ok,
        f"count={len(bootstrap_rows)} statuses={[row.get('fields', {}).get('Status') for row in bootstrap_rows]}",
    )

    duplicate_title = "V2 validation idempotency probe"
    first_payload = {
        "title": duplicate_title,
        "canonical_text": "Idempotency probe",
        "category": "Decision",
        "owner": "Matthew",
        "authority": "Supporting",
        "freshness": "Current",
        "proposed_by_agent": "validate_context_architecture_v2.py",
        "bootstrap": True,
        "source_doc": "validation-only",
    }
    ok1, detail1 = run([sys.executable, "hyperagent/scripts/create_context_item.py"], input_data=first_payload)
    ok2, detail2 = run([sys.executable, "hyperagent/scripts/create_context_item.py"], input_data=first_payload)
    duplicate = False
    if ok2:
        duplicate = json.loads(detail2).get("duplicate") is True
    record("at4_create_is_idempotent", ok1 and ok2 and duplicate, f"first={detail1[:120]} second={detail2[:120]}")

    chain_ok, chain_detail = validate_change_log_chain()
    record("at5_change_log_hash_chain", chain_ok, chain_detail)

    audit_path = REPO_ROOT / "docs" / "context" / "audit" / "audit.jsonl"
    record("audit_mirror_exists", audit_path.exists(), str(audit_path))

    for doc_path, banner in (
        (REPO_ROOT / "clive_intake_v1.md", "Superseded by Context Architecture"),
        (REPO_ROOT / "clive_intake_first_draft_v0_2.md", "Superseded by Context Architecture"),
    ):
        ok, detail = assert_contains(doc_path, banner)
        record(f"doc_banner_{doc_path.name}", ok, detail)

    human_path = REPO_ROOT / "docs" / "context" / "human-approval-path.md"
    record("human_approval_path_doc", human_path.exists(), str(human_path))

    curator_skill = REPO_ROOT / ".cursor" / "skills" / "clive-context-curator" / "SKILL.md"
    for needle in (
        "Status = Proposed",
        "must not approve",
        "proposed_by_agent",
        "clive_context_architecture_v2.md",
        "human-approval-path.md",
    ):
        ok, detail = assert_contains(curator_skill, needle)
        record(f"curator_skill_contains_{needle[:24]}", ok, detail)

    failures = [result for result in results if not result["ok"]]
    print(json.dumps({"success": not failures, "results": results}, indent=2, ensure_ascii=False))
    if failures:
        sys.exit(1)


if __name__ == "__main__":
    main()
