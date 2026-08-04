#!/usr/bin/env python3
"""Thin Implementation Jobs worker (Build velocity Track 2).

First job type: hyperagent_export_regen — run a repo generator, validate/handoff,
mark job Draft ready. Requires Approved Brief ID. Idempotent on Idempotency Key /
prior Draft ready for same brief+action.

Usage:
  # Process oldest Approved hyperagent_export_regen job
  python3 scripts/process_implementation_job.py

  # Process one record
  python3 scripts/process_implementation_job.py --job-id recXXXXXXXXXXXXXX

Env: AIRTABLE_WRITE_TOKEN or AIRTABLE_API_KEY (Registry write).
"""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import subprocess
import sys
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

REPO = Path(__file__).resolve().parents[1]
BASE = "appbdTVHevH6Bl5ZZ"
TABLE = "tblkNN9hqnPPAseMl"
F = {
    "job_id": "fldUfmV9MpDosM6Ou",
    "brief": "fldccVKnS7apJ4pIg",
    "action": "fldcrVuOJqckBwW92",
    "status": "fldx0QyJhpQ7cN93w",
    "idem": "fldmHOloKiTGvtCKM",
    "prompt_hash": "fldTFO56QXMMqJVSk",
    "prompt": "fldEdJGGUO3hPB3B6",
    "generator": "fld50kHOOO3V1FOpv",
    "artifacts": "fldOzSeoa9qHAG7l7",
    "diff": "fldobGTFXprVM9I6y",
    "error": "fld6RFObhYCq3wOYg",
    "executor": "fldvLK5IAV472YXfV",
}


def _token() -> str:
    tok = os.environ.get("AIRTABLE_WRITE_TOKEN") or os.environ.get("AIRTABLE_API_KEY")
    if not tok:
        # Load .env without printing values
        env_path = REPO / ".env"
        if env_path.is_file():
            for line in env_path.read_text().splitlines():
                if line.startswith("AIRTABLE_WRITE_TOKEN=") or line.startswith(
                    "AIRTABLE_API_KEY="
                ):
                    tok = line.split("=", 1)[1].strip().strip('"').strip("'")
                    break
    if not tok:
        raise SystemExit("Missing AIRTABLE_WRITE_TOKEN or AIRTABLE_API_KEY")
    return tok


def _api(method: str, path: str, body: dict | None = None) -> dict:
    url = f"https://api.airtable.com/v0/{BASE}/{path}"
    data = None if body is None else json.dumps(body).encode("utf-8")
    req = urllib.request.Request(
        url,
        data=data,
        method=method,
        headers={
            "Authorization": f"Bearer {_token()}",
            "Content-Type": "application/json",
        },
    )
    try:
        with urllib.request.urlopen(req) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="replace")
        raise SystemExit(f"Airtable {method} {path} failed: {exc.code} {detail}") from exc


def _choice(fields: dict, field_id: str) -> str | None:
    val = fields.get(field_id)
    if isinstance(val, dict):
        return val.get("name")
    if isinstance(val, str):
        return val
    return None


def _list_approved() -> list[dict]:
    formula = urllib.parse.quote(
        "AND({Status}='Approved',{Action Type}='hyperagent_export_regen')"
    )
    path = f"{TABLE}?filterByFormula={formula}&pageSize=5"
    return _api("GET", path).get("records", [])


def _get(job_id: str) -> dict:
    return _api("GET", f"{TABLE}/{job_id}")


def _patch(job_id: str, fields: dict) -> dict:
    return _api("PATCH", TABLE, {"records": [{"id": job_id, "fields": fields}]})


def _already_done(brief: str, action: str, idem: str | None) -> bool:
    parts = [f"{{Approved Brief ID}}='{brief}'", f"{{Action Type}}='{action}'"]
    if idem:
        parts.append(f"{{Idempotency Key}}='{idem}'")
    formula = "AND(" + ",".join(parts) + ",{Status}='Draft ready')"
    path = f"{TABLE}?filterByFormula={urllib.parse.quote(formula)}&pageSize=1"
    return bool(_api("GET", path).get("records"))


def _run_generator(rel_path: str) -> tuple[str, list[str]]:
    gen = (REPO / rel_path).resolve()
    if not str(gen).startswith(str(REPO)) or not gen.is_file():
        raise SystemExit(f"Invalid generator path: {rel_path}")
    result = subprocess.run(
        [sys.executable, str(gen)],
        cwd=str(REPO),
        capture_output=True,
        text=True,
    )
    if result.returncode != 0:
        raise SystemExit(
            f"Generator failed ({result.returncode}):\n{result.stderr or result.stdout}"
        )
    # Best-effort: find agent JSON paths mentioned or newest under exports/agents
    artifacts: list[str] = []
    exports = REPO / "hyperagent" / "exports" / "agents"
    if exports.is_dir():
        newest = sorted(exports.glob("*.json"), key=lambda p: p.stat().st_mtime, reverse=True)
        if newest:
            artifacts.append(str(newest[0].relative_to(REPO)))
            handoff = REPO / "hyperagent" / "scripts" / "handoff_hyperagent_export.py"
            subprocess.run(
                [sys.executable, str(handoff), str(newest[0])],
                cwd=str(REPO),
                check=False,
            )
    summary = (result.stdout or "").strip()[-2000:]
    return summary, artifacts


def process_record(rec: dict) -> None:
    rid = rec["id"]
    fields = rec.get("fields") or {}
    # Airtable REST returns field names when not using returnFieldsByFieldId
    # Support both name and id keys by normalizing via name lookup from F values
    def g(name: str, field_id: str):
        if name in fields:
            return fields[name]
        return fields.get(field_id)

    brief = g("Approved Brief ID", F["brief"])
    action = g("Action Type", F["action"])
    if isinstance(action, dict):
        action = action.get("name")
    status = g("Status", F["status"])
    if isinstance(status, dict):
        status = status.get("name")
    idem = g("Idempotency Key", F["idem"]) or (f"{brief}:{action}" if brief and action else None)
    generator = g("Generator Path", F["generator"])
    prompt = g("Execution Prompt", F["prompt"]) or ""

    if status != "Approved":
        raise SystemExit(f"Job {rid} status is {status!r}, expected Approved")
    if not brief:
        _patch(
            rid,
            {
                "Status": "Needs review",
                "Error": "No Approved Brief ID — refusing orphan run (architecture §9.6).",
            },
        )
        raise SystemExit("Needs review: missing Approved Brief ID")
    if action != "hyperagent_export_regen":
        raise SystemExit(f"Unsupported action type for this thin worker: {action!r}")
    if not generator:
        _patch(
            rid,
            {
                "Status": "Needs review",
                "Error": "Generator Path required for hyperagent_export_regen.",
            },
        )
        raise SystemExit("Needs review: missing Generator Path")

    if _already_done(str(brief), str(action), str(idem) if idem else None):
        print(f"Idempotent skip: Draft ready already exists for {brief}/{action}")
        _patch(
            rid,
            {
                "Status": "Draft ready",
                "Notes": "Idempotent skip — prior Draft ready for same brief/action.",
                "Idempotency Key": idem,
                "Executing Agent": "process_implementation_job.py",
            },
        )
        return

    prompt_hash = hashlib.sha256(prompt.encode("utf-8")).hexdigest()[:16]
    _patch(
        rid,
        {
            "Status": "Running",
            "Idempotency Key": idem,
            "Prompt Hash": prompt_hash,
            "Executing Agent": "process_implementation_job.py",
            "Error": "",
        },
    )

    try:
        summary, artifacts = _run_generator(str(generator))
        _patch(
            rid,
            {
                "Status": "Draft ready",
                "Artifact Paths": "\n".join(artifacts),
                "Diff Summary": summary or f"Ran {generator}",
                "Executing Agent": "process_implementation_job.py",
            },
        )
        print(f"OK Draft ready: {rid}")
        for a in artifacts:
            print(f"  artifact: {a}")
    except SystemExit as exc:
        _patch(
            rid,
            {
                "Status": "Failed",
                "Error": str(exc),
                "Executing Agent": "process_implementation_job.py",
            },
        )
        raise


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--job-id", help="Airtable record id (rec…)")
    args = parser.parse_args()

    if args.job_id:
        rec = _get(args.job_id)
        # normalize fields: REST returns names by default
        process_record(rec)
        return

    records = _list_approved()
    if not records:
        print("No Approved hyperagent_export_regen jobs.")
        return
    process_record(records[0])


if __name__ == "__main__":
    main()
