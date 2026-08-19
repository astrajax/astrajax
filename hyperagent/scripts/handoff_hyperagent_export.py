#!/usr/bin/env python3
"""Validate a Hyperagent export and print the Lane B handoff card + checklist.

Usage:
  python3 hyperagent/scripts/handoff_hyperagent_export.py path/to/export.json

Exit 0 on success; non-zero if validation fails.
"""

from __future__ import annotations

import json
import subprocess
import sys
from pathlib import Path


def _fail(message: str) -> None:
    print(f"handoff_hyperagent_export: FAIL — {message}", file=sys.stderr)
    sys.exit(1)


def _run_validate(path: Path) -> None:
    script = Path(__file__).resolve().parent / "validate_hyperagent_export.py"
    result = subprocess.run(
        [sys.executable, str(script), str(path)],
        capture_output=True,
        text=True,
    )
    if result.returncode != 0:
        sys.stderr.write(result.stderr or result.stdout or "validation failed\n")
        sys.exit(result.returncode or 1)
    print(result.stdout.strip())


def _repo_relative(path: Path) -> str:
    try:
        repo = Path(__file__).resolve().parents[2]
        return str(path.resolve().relative_to(repo))
    except ValueError:
        return str(path.resolve())


def _handoff_card(path: Path, export: dict) -> None:
    data = export.get("data") or {}
    export_type = export.get("type")
    name = data.get("name") or "(unnamed)"
    skills = data.get("skills") if isinstance(data.get("skills"), list) else []
    embedded = export_type == "agent" and len(skills) > 0

    creds = False
    if export_type == "skill" and data.get("authType") == "api_key":
        creds = True
    for skill in skills:
        if isinstance(skill, dict) and skill.get("authType") == "api_key":
            creds = True
            break

    webhook_hint = "yes if auto-run / Airtable automation needs a URL; else no"
    if export_type == "skill":
        import_type = (
            "skill JSON only — one workspace landing. Cursor attaches it to agents "
            "and turns agent-config auto-save on. Do not pin agents by hand."
        )
        webhook_hint = "no (shared method skill; no schedule/Slack/Live)"
    else:
        import_type = (
            "agent-only (embedded skills[] — preferred first-time import)"
            if embedded
            else "agent JSON; add separate skill JSON only if shared/credentialed/skill-only update"
        )

    print()
    print("=== HyperAgent handoff card (Lane B — manual UI import) ===")
    print(f"Export path:     {_repo_relative(path)}")
    print(f"Absolute path:   {path.resolve()}")
    print(f"Agent/skill:     {name} (type={export_type})")
    print(f"Import type:     {import_type}")
    print(f"Credentials owed:{' yes — add on skill in UI before first run (never from git)' if creds else ' no (unless brief says otherwise)'}")
    print(f"Webhook needed:  {webhook_hint}")
    print("Do not delete:   Do NOT delete the HyperAgent agent unless retiring it")
    print("Playbook:        hyperagent/docs/hyperagent-deploy-playbook.md")
    print("Contract:        docs/initiatives/hyperagent-handoff-contract.md")
    print()
    print("=== Ordered checklist ===")
    print("1. Confirm validation OK (above).")
    if export_type == "skill":
        print("2. HyperAgent UI → Import this skill JSON once into the Skills library (or Cursor/on-platform create).")
        print("3. Stop. Cursor tells each target agent to attach the skill and turn only agent-config auto-save on.")
        print("4. Do not pin twelve agents. Do not approve-each-apply. No webhook for this skill.")
        if creds:
            print("5. Add credentials on skill (UI only) before first run.")
            print("6. Keep this export filename stable for any later skill-only refresh.")
        else:
            print("5. Keep this export filename stable for any later skill-only refresh.")
    else:
        print("2. HyperAgent UI → Import agent JSON (or skill-only update per playbook).")
        print("3. Verify Skills tab / /skills attachment.")
        if creds:
            print("4. Add credentials on skill (UI only).")
            print("5. Create webhook only if needed; never delete agent to 'refresh'.")
            print("6. Smoke-test; keep stable export filename for re-import.")
        else:
            print("4. Create webhook only if needed; never delete agent to 'refresh'.")
            print("5. Smoke-test; keep stable export filename for re-import.")
    print()
    print("handoff_hyperagent_export: OK — Phase B may cite this card")


def main() -> None:
    if len(sys.argv) != 2:
        print(
            "Usage: python3 hyperagent/scripts/handoff_hyperagent_export.py <export.json>",
            file=sys.stderr,
        )
        sys.exit(2)

    path = Path(sys.argv[1])
    if not path.is_file():
        _fail(f"file not found: {path}")

    _run_validate(path)

    try:
        export = json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as exc:
        _fail(f"invalid JSON: {exc}")

    if not isinstance(export, dict):
        _fail("root must be a JSON object")

    _handoff_card(path, export)


if __name__ == "__main__":
    main()
