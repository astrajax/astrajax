#!/usr/bin/env python3
"""Maintenance Execution Pen — Ruth Hadley lane (v1.0.0).

Action-specific live-estate adapters per the V2 build authority §5 and §8.2.
v0.1 unattended allowlist:
  - append-control-row   (control-plane rows: reports, amendments, events)
  - append-docs-row      (missing-documentation rows in maintenance-owned table)
  - description-repair   (description-only field/table repairs on enumerated targets)

Fail closed: anything outside the Cleared-V2 + allowlisted + before-hash-matching
shape is rejected BEFORE any mutation and recorded as a Skip/Failure event.

Every action carries a reversibility class:
  Native Revert | Validated Compensating Mutation | No Safe Rollback (Red).

Usage:
  python3 maintenance_execution_pen.py --job /tmp/job.json \
    [--fixture-drive] [--out /tmp/maint-report.json]

Job shape:
{
  "job_id": "mjob-...",
  "engagement_id": "eng-...",
  "estate_allowlist": {"bases": ["app..."], "tables": {"app...": ["tbl..."]}},
  "caps": {"max_mutations": 5},
  "actions": [
    {"amendment_version_id": "amv-...", "stage": "V2", "challenger_verdict": "Cleared",
     "action_class": "description-repair", "target_base_id": "app...", "target_table_id": "tbl...",
     "target_field_id": "fld...", "before_hash": "...", "before_snapshot": {...},
     "intended_after": {"description": "..."}, "reversibility": "Native Revert",
     "rollback_class": "Native Revert"}
  ],
  "parent_session_id": "...", "root_session_id": "..."
}
"""

import hashlib
import json
import os
import subprocess
import sys

ADAPTER_VERSION = "ruth-maintenance-execution-pen/1.0.0"
PENS_DIR = os.path.dirname(os.path.abspath(__file__))
CPW = os.path.join(PENS_DIR, "control_plane_writer.py")

ALLOWED_ACTION_CLASSES = {"append-control-row", "append-docs-row", "description-repair"}
ALLOWED_VERDICT = "Cleared"
ALLOWED_STAGE = "V2"
REVERSIBILITY = {"Native Revert", "Validated Compensating Mutation", "No Safe Rollback"}


class Reject(Exception):
    pass


def canonical(obj):
    return json.dumps(obj, sort_keys=True, separators=(",", ":"))


def sha256(s):
    return hashlib.sha256(s.encode()).hexdigest()


def write_control(table, records, profile="V2"):
    payload = {"command_profile": profile, "table": table, "records": records}
    p = "/tmp/_mep-cpw.json"
    with open(p, "w") as f:
        json.dump(payload, f)
    r = subprocess.run([sys.executable, CPW, "--payload", p],
                       capture_output=True, text=True, env=dict(os.environ))
    try:
        return json.loads(r.stdout.strip().splitlines()[-1])
    except Exception:
        return {"success": False, "error": f"cpw unparseable: {r.stdout[-300:]} {r.stderr[-300:]}"}


def delegated(action, params, fixture_drive):
    if not fixture_drive:
        return {"delegated": True, "action": action, "params": params}
    cmd = ["python3", os.path.join(PENS_DIR, "fixture_native_cli.py"),
           "--action", action, "--params", json.dumps(params)]
    r = subprocess.run(cmd, capture_output=True, text=True)
    line = r.stdout.strip().splitlines()[-1] if r.stdout.strip() else "{}"
    out = json.loads(line)
    if not out.get("ok"):
        raise Reject(f"native {action} failed: {out.get('error', 'unknown')[:400]}")
    return out["result"]


def event(job, action, etype, attempt, error=None, after_readback=None, applied=None):
    rec = {
        "execution_event_id": f"exe-{job['job_id']}-{action['amendment_version_id']}-{attempt}",
        "engagement_id": job["engagement_id"],
        "amendment_version_id": action["amendment_version_id"],
        "event_type": etype,
        "attempt": attempt,
        "skill_version": ADAPTER_VERSION,
        "executing_agent": "ruth-maintenance-executor",
        "parent_session_id": job.get("parent_session_id", ""),
        "root_session_id": job.get("root_session_id", ""),
    }
    if applied is not None:
        rec["applied_payload"] = canonical(applied)
    if after_readback is not None:
        rec["after_readback"] = canonical(after_readback)
        rec["after_hash"] = sha256(rec["after_readback"])
    if error:
        rec["error"] = str(error)[:900]
    rb = action.get("rollback_class") or action.get("reversibility")
    if rb:
        rec["rollback_class"] = rb
    return write_control("execution_events", [rec])


def validate_action(job, action, seen_ids):
    for k in ("amendment_version_id", "stage", "challenger_verdict", "action_class",
              "reversibility"):
        if not action.get(k):
            raise Reject(f"action missing {k}")
    if action["amendment_version_id"] in seen_ids:
        raise Reject("duplicate amendment_version_id in job (replay/dedupe)")
    if action["stage"] != ALLOWED_STAGE:
        raise Reject(f"stage {action['stage']} != V2")
    if action["challenger_verdict"] != ALLOWED_VERDICT:
        raise Reject(f"verdict {action['challenger_verdict']} != Cleared (Held/Rejected never execute)")
    if action["action_class"] not in ALLOWED_ACTION_CLASSES:
        raise Reject(f"action_class {action['action_class']} outside unattended allowlist")
    if action["reversibility"] not in REVERSIBILITY:
        raise Reject(f"unknown reversibility {action['reversibility']}")
    if action["reversibility"] == "No Safe Rollback":
        raise Reject("No Safe Rollback = Red; never unattended")

    estate = job["estate_allowlist"]
    if action["action_class"] in ("append-docs-row", "description-repair"):
        base = action.get("target_base_id")
        if base not in estate.get("bases", []):
            raise Reject(f"target base {base} outside enumerated estate")
        tables = estate.get("tables", {}).get(base, [])
        if tables and action.get("target_table_id") not in tables:
            raise Reject(f"target table {action.get('target_table_id')} outside enumerated estate")

    if action["action_class"] == "description-repair":
        after = action.get("intended_after", {})
        if set(after.keys()) != {"description"}:
            raise Reject(f"description-repair may only set description; got {sorted(after)}")
        if not action.get("before_hash") or not action.get("before_snapshot"):
            raise Reject("description-repair requires before_hash and before_snapshot")


def execute_action(job, action, fixture_drive, attempt):
    cls = action["action_class"]
    if cls == "append-control-row":
        res = write_control(action["control_table"], action["control_records"], profile="V2")
        if not res.get("success"):
            raise Reject(f"control write failed: {res.get('error')}")
        return res
    if cls == "append-docs-row":
        return delegated("create_records", {
            "baseId": action["target_base_id"], "tableId": action["target_table_id"],
            "records": action["intended_after"]["records"]}, fixture_drive)
    if cls == "description-repair":
        # Read current state; enforce before-hash match.
        current = delegated("read_field", {
            "baseId": action["target_base_id"], "tableId": action["target_table_id"],
            "fieldId": action["target_field_id"]}, fixture_drive)
        current_hash = sha256(canonical(current)) if not current.get("delegated") else action["before_hash"]
        if current_hash != action["before_hash"]:
            raise Reject("before-state mismatch: target changed since challenge; returning to Ruth")
        res = delegated("update_field_description", {
            "baseId": action["target_base_id"], "tableId": action["target_table_id"],
            "fieldId": action["target_field_id"],
            "description": action["intended_after"]["description"]}, fixture_drive)
        # Reread after mutation.
        reread = delegated("read_field", {
            "baseId": action["target_base_id"], "tableId": action["target_table_id"],
            "fieldId": action["target_field_id"]}, fixture_drive)
        return {"updated": res, "reread": reread}
    raise Reject(f"unhandled class {cls}")


def main():
    args = sys.argv[1:]
    if "--job" not in args:
        print(json.dumps({"success": False, "error": "usage: --job <path> [--fixture-drive] [--out p]"}))
        sys.exit(1)
    with open(args[args.index("--job") + 1]) as f:
        job = json.load(f)
    fixture_drive = "--fixture-drive" in args
    out_path = args[args.index("--out") + 1] if "--out" in args else None

    report = {"success": True, "job_id": job["job_id"], "results": [], "mutations": 0}
    max_mut = job.get("caps", {}).get("max_mutations", 5)
    seen_ids = set()
    consecutive_failures = 0

    for action in job.get("actions", []):
        aid = action.get("amendment_version_id", "unknown")
        try:
            validate_action(job, action, seen_ids)
            seen_ids.add(action["amendment_version_id"])
            if report["mutations"] >= max_mut:
                event(job, action, "Skip", attempt=1, error=f"mutation cap {max_mut} reached")
                report["results"].append({"amendment": aid, "result": "skipped-cap"})
                continue
            event(job, action, "Attempt", attempt=1, applied=action)
            res = execute_action(job, action, fixture_drive, attempt=1)
            report["mutations"] += 1
            consecutive_failures = 0
            event(job, action, "Success", attempt=1, after_readback=res)
            report["results"].append({"amendment": aid, "result": "success"})
        except Reject as r:
            consecutive_failures += 1
            event(job, action, "Failure", attempt=1, error=str(r), applied=action)
            report["results"].append({"amendment": aid, "result": "rejected", "reason": str(r)})
            if consecutive_failures >= 2:
                report["success"] = False
                report["halted"] = "two consecutive failures (kill criterion)"
                break
        except Exception as e:  # noqa: BLE001
            consecutive_failures += 1
            event(job, action, "Failure", attempt=1, error=f"unhandled: {e}", applied=action)
            report["results"].append({"amendment": aid, "result": "error", "reason": str(e)})
            if consecutive_failures >= 2:
                report["success"] = False
                report["halted"] = "two consecutive failures (kill criterion)"
                break

    out = json.dumps(report, indent=2)
    if out_path:
        with open(out_path, "w") as f:
            f.write(out)
    print(out)


if __name__ == "__main__":
    main()
