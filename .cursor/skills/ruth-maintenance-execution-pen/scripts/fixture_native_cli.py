#!/usr/bin/env python3
"""fixture_native_cli.py — deterministic fake-Airtable native action surface.

Stands in for the executor's credential-isolated native Airtable actions during
fixtures. Persists state to /tmp/ruth-fixture-airtable-state.json so the pens'
read-before-create, idempotency, and readback paths exercise real behaviour
(base IDs returned once, links resolvable, schema readable back).

Actions: create_base, create_table, create_field, create_automation_off,
         create_draft_page, create_records, readback_schema, read_field,
         update_field_description.

Usage: fixture_native_cli.py --action <name> --params '<json>'
Prints {"ok": true, "result": {...}} or {"ok": false, "error": "..."} as the
LAST stdout line.
"""

import json
import os
import sys
import uuid

STATE_PATH = os.environ.get("RUTH_FIXTURE_STATE", "/tmp/ruth-fixture-airtable-state.json")


def load():
    if os.path.exists(STATE_PATH):
        with open(STATE_PATH) as f:
            return json.load(f)
    return {"bases": {}}


def save(s):
    with open(STATE_PATH, "w") as f:
        json.dump(s, f, indent=2)


def rid(prefix):
    return prefix + uuid.uuid4().hex[:14]


def main():
    args = sys.argv[1:]
    action = args[args.index("--action") + 1]
    params = json.loads(args[args.index("--params") + 1])
    s = load()
    try:
        if action == "create_base":
            bid = rid("app")
            s["bases"][bid] = {"id": bid, "name": params["name"], "workspace": params["workspaceId"],
                               "tables": {}, "automations": {}, "pages": {}}
            save(s)
            print(json.dumps({"ok": True, "result": {"id": bid}}))
        elif action == "create_table":
            b = s["bases"][params["baseId"]]
            tid = rid("tbl")
            fields = []
            for i, f in enumerate(params.get("fields", [])):
                fid = rid("fld")
                fields.append({"id": fid, "name": f["name"], "type": f["type"]})
            b["tables"][tid] = {"id": tid, "name": params["name"], "fields": fields, "records": []}
            save(s)
            print(json.dumps({"ok": True, "result": {"id": tid, "fields": fields}}))
        elif action == "create_field":
            t = s["bases"][params["baseId"]]["tables"][params["tableId"]]
            fid = rid("fld")
            f = {"id": fid, "name": params["name"], "type": params["type"]}
            if params.get("linkedTableId"):
                f["linkedTableId"] = params["linkedTableId"]
            if params.get("formula"):
                f["formula"] = params["formula"]
            t["fields"].append(f)
            save(s)
            print(json.dumps({"ok": True, "result": {"id": fid}}))
        elif action == "create_automation_off":
            b = s["bases"][params["baseId"]]
            aid = rid("auto")
            b["automations"][aid] = {"id": aid, "name": params["name"], "state": params.get("state", "OFF")}
            save(s)
            print(json.dumps({"ok": True, "result": {"id": aid}}))
        elif action == "create_draft_page":
            b = s["bases"][params["baseId"]]
            pid = rid("pg")
            b["pages"][pid] = {"id": pid, "name": params["name"], "type": params["type"],
                               "published": bool(params.get("published", False))}
            save(s)
            print(json.dumps({"ok": True, "result": {"id": pid}}))
        elif action == "create_records":
            t = s["bases"][params["baseId"]]["tables"][params["tableId"]]
            created = []
            for r in params.get("records", []):
                rec_id = rid("rec")
                t["records"].append({"id": rec_id, "fields": r})
                created.append(rec_id)
            save(s)
            print(json.dumps({"ok": True, "result": {"created": created}}))
        elif action == "readback_schema":
            b = s["bases"][params["baseId"]]
            out = {"base_id": b["id"], "name": b["name"],
                   "tables": [{"id": t["id"], "name": t["name"],
                               "fields": t["fields"], "record_count": len(t["records"])}
                              for t in b["tables"].values()],
                   "automations": list(b["automations"].values()),
                   "pages": list(b["pages"].values())}
            print(json.dumps({"ok": True, "result": out}))
        elif action == "read_field":
            t = s["bases"][params["baseId"]]["tables"][params["tableId"]]
            for f in t["fields"]:
                if f["id"] == params["fieldId"]:
                    print(json.dumps({"ok": True, "result": dict(f)}))
                    return
            print(json.dumps({"ok": False, "error": "field not found"}))
        elif action == "update_field_description":
            t = s["bases"][params["baseId"]]["tables"][params["tableId"]]
            for f in t["fields"]:
                if f["id"] == params["fieldId"]:
                    f["description"] = params["description"]
                    save(s)
                    print(json.dumps({"ok": True, "result": dict(f)}))
                    return
            print(json.dumps({"ok": False, "error": "field not found"}))
        else:
            print(json.dumps({"ok": False, "error": f"unknown action {action}"}))
    except KeyError as e:
        print(json.dumps({"ok": False, "error": f"state lookup failed: {e}"}))


if __name__ == "__main__":
    main()
