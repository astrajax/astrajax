#!/usr/bin/env python3
"""Control Plane Writer — Ruth Hadley lane (v1.0.0).

Append-only writer for the Ruth control plane (base appubDI76O0t8xisg).
One codebase, separately allowlisted V1/V2 command profiles per the V2 build
authority §8.3. Create-only: there is deliberately NO update or delete path —
control-plane rows are immutable history; corrections are new rows.

Usage:
  python3 control_plane_writer.py --payload /tmp/cpw.json

Payload shape:
{
  "command_profile": "V1" | "V2",
  "table": "<semantic table key>",
  "records": [ { "<semantic field key>": <value>, ... } ]
}

Env: RUTH_CONTROL_PLANE_WRITE — Airtable PAT scoped to the Ruth control-plane
base ONLY, data.records:write ONLY. Injected by the skill's credential layer;
the script prints it nowhere.

Validation at the pen:
  - unknown table/field keys rejected with precise errors;
  - required-key lists enforced per table;
  - command_profile must be V1 or V2 and is recorded on the row's
    Skill/Version where the table carries one;
  - any key hinting at mutation (update/delete/patch) is rejected.
"""

import json
import os
import sys
import time
import urllib.request
import urllib.error

BASE_ID = "appubDI76O0t8xisg"
API = f"https://api.airtable.com/v0/{BASE_ID}"
ADAPTER_VERSION = "ruth-control-plane-writer/1.0.0"

# Semantic table keys -> (table id, {semantic field key -> field id}, required keys)
TABLES = {
    "engagements": (
        "tbl2u8AX4fOTXP1ky",
        {
            "engagement_id": "fld9nJzm29Ev2wumZ",
            "client_label": "fldBjblFGnNtNo2h4",
            "workspace_id": "fld921M1ZUd1tFpsH",
            "owner": "fldEW7yvQVsaULKmR",
            "created_by": "fldRPxuagReTGWGiF",
            "closed_by": "fld43zwf4bPXdYwfQ",
            "notes": "fldz9ClC1Z4SltgC8",
        },
        ["engagement_id", "client_label", "workspace_id", "owner", "created_by"],
    ),
    "scope_versions": (
        "tblMdrSAq8ppKZYs0",
        {
            "scope_version_id": "fldOD7BtT1rylF1su",
            "engagement_id": "fldR0pvXKOJLzncDv",
            "workspace_id": "fld6GgX0xSxbmjyg3",
            "base_reach": "fld2909kWlyE0b08f",
            "action_classes": "fldvZnMyDRj6LJlkU",
            "signed_caps": "fldFu02Enwktct8SI",
            "credential_profile_ref": "fldIIjxq5UPXq0Qol",
            "effective_event_id": "fldhHqzPTtAC9fVyA",
            "supersedes": "fld1MN0FahlhBRe6P",
        },
        ["scope_version_id", "engagement_id", "workspace_id", "action_classes", "signed_caps"],
    ),
    "proposal_versions": (
        "tblAFAH8y5up7Y0pK",
        {
            "proposal_version_id": "fld94gmIN6PCGI2kg",
            "engagement_id": "fldB2nz2R5KvHq6gD",
            "stage": "fldv0ZXKisOtTfzPz",
            "proposal_body": "flddsVUo64EyRFiNK",
            "typed_manifest": "fldQPRuS1PbImHOwV",
            "canonical_hash": "fldg0Q022s3cgH4ay",
            "decision_id": "fldaXBSWvn2WwH1iZ",
            "evidence": "fldSQMNNXMZELPsoB",
            "caps": "fldMuv0tt2KLC0ePE",
            "material_annotation": "fldzEaFQ9DpAwDkvd",
            "non_material_annotation": "fld26x0XpvMty0dR0",
            "supersedes": "fld0vdPlyC5btgENB",
        },
        ["proposal_version_id", "engagement_id", "stage", "typed_manifest", "canonical_hash"],
    ),
    "reports": (
        "tblh50FnYgMPiT1gs",
        {
            "report_id": "fldtQGarKGfkynzdV",
            "engagement_id": "fldLpGMwg9zg8PEeV",
            "report_type": "fldMAXdnZsAK1Ikbg",
            "stage": "fldEjNDbplHKxq6Kr",
            "headline": "fldfyl3HRvVA2GChD",
            "body": "fldiIvJ7IoaVGEzp4",
            "evidence": "fld7bfiGvqyR6RVsV",
            "author_agent": "fldmTQ7puIYtIi4ul",
            "session_id": "fldHiDLKkMKGpCS5F",
        },
        ["report_id", "engagement_id", "report_type", "stage", "headline", "body"],
    ),
    "amendment_versions": (
        "tblQLiDOuVtLoQk0g",
        {
            "amendment_version_id": "fldzrA0KEkx4qD9um",
            "engagement_id": "fldSaUIbyUsPnzzdY",
            "stage": "fldZ32br50Upj2eVO",
            "supersedes_version": "fldWI1UMguJ7wuC2y",
            "target_base_id": "fldDcvJC8GiZtmsx0",
            "target_table_id": "fldjni3pQRLlYtnec",
            "target_field_id": "fldnaOUpZesdwIfC9",
            "target_record_id": "fldPEh5x75UUh0sLl",
            "action_class": "fld5PMbYkXgWxiQNi",
            "adapter_version": "fldJ8PbrcP3ksLG9l",
            "before_snapshot": "fldVqKOVqjmjysuKp",
            "before_hash": "fldlZF9rD9on5lVRk",
            "intended_after": "fldGktW4Xn8M8gJVk",
            "evidence": "fldigybwjb8yymBgx",
            "tier": "fldjsgtPfENnHnZwc",
            "reversibility": "fldpRNf9GehO45fEC",
            "challenger_verdict": "fldh6AqWjaQiZNVvw",
            "created_by_agent": "fldhmmbuYwdKK2YWF",
        },
        ["amendment_version_id", "engagement_id", "stage", "action_class", "created_by_agent"],
    ),
    "execution_events": (
        "tbl7jvy0pnIzz8OMA",
        {
            "execution_event_id": "fldiSFfhHx1SR3Qdg",
            "engagement_id": "fldDZ09GCgi42z2m8",
            "amendment_version_id": "fldRds27TFyFrBK83",
            "proposal_version_id": "fldncuFXnFN0ZXSV7",
            "event_type": "fldXZajTSFjUDuLAe",
            "attempt": "fldXze9xomRXueZXg",
            "applied_payload": "fldaCmQTxBSB86tYU",
            "observed_before_hash": "fldEbc8GOjzplBw2B",
            "after_readback": "fldIAvVcIaEZ4RWan",
            "after_hash": "fldv7lPOTYAS1bRMR",
            "airtable_action_id": "fldarAryN0zDLoQFW",
            "rollback_class": "fldTHWKSkaEHh3a2d",
            "error": "fldFMq7vyouxyTh3r",
            "skill_version": "fld9sLUDTivP1T1In",
            "executing_agent": "flduMidT1ovVVz3Rh",
            "parent_session_id": "fldjnpMnVoMPmbTlk",
            "root_session_id": "fld3jSqlYS7hzOWP5",
            "target_url": "fldYHR8zWNSkNokGZ",
        },
        ["execution_event_id", "engagement_id", "event_type", "skill_version", "executing_agent"],
    ),
}

BANNED_KEY_FRAGMENTS = ("update", "delete", "patch", "overwrite", "upsert")


def fail(msg):
    print(json.dumps({"success": False, "error": msg}))
    sys.exit(1)


def main():
    token = os.environ.get("RUTH_CONTROL_PLANE_WRITE")
    if not token:
        fail("RUTH_CONTROL_PLANE_WRITE env var missing")

    if "--payload" not in sys.argv:
        fail("usage: control_plane_writer.py --payload <path>")
    payload_path = sys.argv[sys.argv.index("--payload") + 1]
    with open(payload_path) as f:
        payload = json.load(f)

    profile = payload.get("command_profile")
    if profile not in ("V1", "V2"):
        fail("command_profile must be V1 or V2")

    table_key = payload.get("table")
    if table_key not in TABLES:
        fail(f"unknown table '{table_key}'; known: {sorted(TABLES)}")
    table_id, field_map, required = TABLES[table_key]

    records = payload.get("records")
    if not isinstance(records, list) or not records:
        fail("records must be a non-empty list")
    if len(records) > 10:
        fail("batch cap 10 records")

    out_fields = []
    for i, rec in enumerate(records):
        if not isinstance(rec, dict):
            fail(f"record {i} not an object")
        for k in rec:
            lk = k.lower()
            if any(b in lk for b in BANNED_KEY_FRAGMENTS):
                fail(f"record {i} key '{k}' looks like a mutation intent; control plane is append-only")
            if k not in field_map:
                fail(f"record {i} unknown field key '{k}' for table '{table_key}'; known: {sorted(field_map)}")
        missing = [k for k in required if not rec.get(k)]
        if missing:
            fail(f"record {i} missing required keys: {missing}")
        fields = {field_map[k]: v for k, v in rec.items()}
        # Stamp adapter provenance where the table carries it.
        if "skill_version" in field_map and "skill_version" not in rec:
            fields[field_map["skill_version"]] = f"{ADAPTER_VERSION} profile={profile}"
        if "adapter_version" in field_map and "adapter_version" not in rec:
            fields[field_map["adapter_version"]] = ADAPTER_VERSION
        if "created_by_agent" in field_map and not rec.get("created_by_agent"):
            fail(f"record {i} created_by_agent required for amendment rows")
        out_fields.append(fields)

    body = json.dumps({"records": [{"fields": f} for f in out_fields]}).encode()
    req = urllib.request.Request(
        f"{API}/{table_id}",
        data=body,
        headers={
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
        },
        method="POST",
    )
    for attempt in (1, 2):
        try:
            with urllib.request.urlopen(req, timeout=30) as resp:
                data = json.loads(resp.read())
                ids = [r["id"] for r in data.get("records", [])]
                print(json.dumps({"success": True, "table": table_key, "created": ids}))
                return
        except urllib.error.HTTPError as e:
            if e.code == 429 and attempt == 1:
                time.sleep(30)
                continue
            fail(f"airtable HTTP {e.code}: {e.read()[:400].decode('utf-8', 'replace')}")
        except Exception as e:  # noqa: BLE001
            if attempt == 1:
                time.sleep(5)
                continue
            fail(f"transport error: {e}")


if __name__ == "__main__":
    main()
