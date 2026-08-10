#!/usr/bin/env python3
"""Physician reviewer writer — FIELD-WHITELISTED, two fields only, dry-run by default.

The Physician (dr-halvard-bjornson) is the commissioned reviewer for EXACTLY two
fields on Household Activity rows (Matthew, 2026-07-26, via Doc Albright):

    Agent Quality  fldLExhD3nr41nir6   (number 1-5)
    Review Status  fldCtTcdklAcDa9tW   (-> "Reviewed" once scored)

This script is the ONLY sanctioned write path for those fields. By construction
it cannot write any other field: the PATCH body is assembled from constants.
Human Quality (fldlKDwCGDAj6fah5) and all content fields are unreachable here.

Usage:
  python3 score_update.py --staged score_staged.json            # dry run (default)
  python3 score_update.py --staged score_staged.json --apply    # land the writes

Credential: FLEET_ACTIVITY_REVIEW (read + update PAT scoped to the Household
Activity base ONLY). Deliberately NOT the logging skill's FLEET_ACTIVITY_WRITE,
which stays a sealed create-only writer with no read scope (its 403-on-read was
verified 2026-07-26). Run via RunWithCredentials on the physician-activity-reviewer
skill so the token is injected as an env var and never printed.

Safety contract:
- Base and table hard-locked (appF7jQD4ZKrDC7e1 / tblNxNLyC31KDQbRl).
- Pre-flight read check: refuses to run if the credential cannot read.
- Per row: ONE GET (field-id keyed); skip if Agent Quality is already set (the
  Physician's pass is complete). Review Status alone is NOT a skip signal:
  under the shared convention (2026-07-26) "Reviewed" means at least one
  reviewer's pass has happened, so a row Clive has already visited still
  receives the Agent Quality score. Review Status is set to "Reviewed" on
  every scored row; re-setting an already-Reviewed row is harmless and expected.
- Skip with a report line if event type is not Turn/Completion.
- Scores validated: integer 1-5 only.
- PATCH in batches of 10; single 30 s retry on 429; no other retries.
- Never prints the token. Never deletes. Never creates.

v2 (2026-07-29): skip keys on Agent Quality presence instead of Review Status
(v1 wrongly skipped 2 Clive-Reviewed rows with empty Agent Quality at first
live dry run); redundant per-row double-GET removed.
"""
import argparse
import json
import os
import sys
import time
import urllib.error
import urllib.parse
import urllib.request

BASE_ID = "appF7jQD4ZKrDC7e1"          # Household Activity — hard-locked
ACTIVITY = "tblNxNLyC31KDQbRl"
API = f"https://api.airtable.com/v0/{BASE_ID}/{ACTIVITY}"

FLD_AGENT_QUALITY = "fldLExhD3nr41nir6"   # the ONLY two writable fields
FLD_REVIEW_STATUS = "fldCtTcdklAcDa9tW"
FLD_EVENT_TYPE = "fldTCd93XF8XhsVoZ"      # read-only checks
SCOREABLE_TYPES = {"Turn", "Completion"}
BATCH = 10


def req(token, url, method="GET", body=None):
    r = urllib.request.Request(url, method=method,
        headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
        data=json.dumps(body).encode() if body else None)
    try:
        with urllib.request.urlopen(r, timeout=30) as resp:
            return resp.status, json.load(resp)
    except urllib.error.HTTPError as e:
        if e.code == 429:
            time.sleep(30)
            with urllib.request.urlopen(r, timeout=30) as resp:
                return resp.status, json.load(resp)
        return e.code, {"error": e.read().decode()[:200]}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--staged", required=True)
    ap.add_argument("--apply", action="store_true")
    args = ap.parse_args()

    token = os.environ.get("FLEET_ACTIVITY_REVIEW")
    if not token:
        print(json.dumps({"success": False,
            "error": "FLEET_ACTIVITY_REVIEW not set — run via RunWithCredentials"}))
        sys.exit(1)

    staged = json.load(open(args.staged))
    scores = staged["scores"]
    for rec, v in scores.items():
        if not (isinstance(v.get("score"), int) and 1 <= v["score"] <= 5):
            print(json.dumps({"success": False, "error": f"invalid score for {rec}"})); sys.exit(1)

    # Pre-flight: credential must be able to READ (commissioned verification step).
    status, _ = req(token, API + "?maxRecords=1")
    if status != 200:
        print(json.dumps({"success": False, "read_allowed": False, "http_status": status,
            "action": "STOP — scope gap; report to Matthew, do not work around"}))
        sys.exit(1)

    plan, skips = [], []
    for rec, v in scores.items():
        status, row = req(token, f"{API}/{rec}?returnFieldsByFieldId=true")
        if status != 200:
            skips.append({"rec": rec, "reason": f"GET {status}"}); continue
        f = row.get("fields", {})
        if f.get(FLD_AGENT_QUALITY) is not None:
            skips.append({"rec": rec, "reason": "Agent Quality already set (physician pass complete; idempotent skip)"}); continue
        etype = f.get(FLD_EVENT_TYPE)
        if etype not in SCOREABLE_TYPES:
            skips.append({"rec": rec, "reason": f"event type {etype!r} not scoreable"}); continue
        plan.append({"id": rec, "fields": {FLD_AGENT_QUALITY: v["score"],
                                           FLD_REVIEW_STATUS: "Reviewed"}})

    if not args.apply:
        print(json.dumps({"success": True, "mode": "DRY RUN — nothing written",
                          "would_update": len(plan), "skipped": skips}, indent=1))
        return

    updated = []
    for i in range(0, len(plan), BATCH):
        status, out = req(token, API, method="PATCH", body={"records": plan[i:i+BATCH]})
        if status != 200:
            print(json.dumps({"success": False, "error": out, "updated_so_far": updated,
                "action": "STOP on first ambiguous/failed write; report"})); sys.exit(1)
        updated += [r["id"] for r in out.get("records", [])]
        time.sleep(0.25)
    print(json.dumps({"success": True, "updated": len(updated), "skipped": skips}))


if __name__ == "__main__":
    main()
