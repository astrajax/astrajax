#!/usr/bin/env python3
"""ruth-build-execution-pen v2.1.0 - script 2 of 2 (fixture mode only).

Deterministic in-memory fake of the Airtable meta/data REST surface the pen
uses. Offline acceptance fixtures ONLY (no token, no network, no real base).
Seeds a synthetic target base from the manifest's own declarative
beforeState (requiredTables + record counts) so every gate exercises real
logic. A fixture flag can inject drift (missing field, wrong type, extra
table) to prove the beforeState gate fires. Never used against a live
engagement.

Drift knobs (constructor kwargs, used only by the acceptance suite):
  drop_field_id   - remove one required field from the seeded live state
  retype_field_id - change one required field's live type
  add_table_named - pre-create a table the manifest declares absent
  bump_record_count - add one record to the first required table
  prebuild_complete - simulate a fully-built prior run (idempotency/retry)
"""


class FixtureError(Exception):
    def __init__(self, code, msg):
        super().__init__(msg)
        self.code = code


class Fixture:
    def __init__(self, manifest, drop_field_id=None, retype_field_id=None,
                 add_table_named=None, bump_record_count=False,
                 prebuild_complete=False):
        self.manifest = manifest
        self.drop_field_id = drop_field_id
        self.retype_field_id = retype_field_id
        self.add_table_named = add_table_named
        self.bump_record_count = bump_record_count
        self.prebuild_complete = prebuild_complete
        self.bases = {}
        self._tbl = 0
        self._fld = 0
        self._rec = 0

    def _tid(self):
        self._tbl += 1
        return "tblFix%012d" % self._tbl

    def _fid(self):
        self._fld += 1
        return "fldFix%012d" % self._fld

    def _rid(self):
        self._rec += 1
        return "recFix%012d" % self._rec

    # -- seeding ------------------------------------------------------------
    def seed(self):
        base = (self.manifest.get("target") or {}).get("baseId")
        if not base:
            return
        bs = self.manifest.get("beforeState") or {}
        tables = []
        records = {}
        for rt in (bs.get("requiredTables") or []):
            fields = []
            for rf in (rt.get("requiredFields") or []):
                if rf.get("fieldId") == self.drop_field_id:
                    continue
                ftype = rf.get("type", "singleLineText")
                if rf.get("fieldId") == self.retype_field_id:
                    ftype = "multilineText" if ftype != "multilineText" else "number"
                f = {"id": rf.get("fieldId") or self._fid(),
                     "name": rf.get("name", "field"), "type": ftype}
                if rf.get("description") is not None:
                    f["description"] = rf["description"]
                if rf.get("requiredChoices"):
                    ids = rf.get("requiredChoiceIds") or [None] * len(rf["requiredChoices"])
                    f["options"] = {"choices": [
                        {"name": n, "id": i} for n, i in zip(rf["requiredChoices"], ids)]}
                if rf.get("options") is not None:
                    f["options"] = dict(f.get("options") or {}, **rf["options"])
                fields.append(f)
            tables.append({"id": rt.get("tableId") or self._tid(),
                           "name": rt.get("name", "table"),
                           "description": rt.get("description"),
                           "primaryFieldId": rt.get("primaryFieldId")
                           or (fields[0]["id"] if fields else None),
                           "fields": fields})
            n = rt.get("recordCount", 0) or 0
            if self.bump_record_count and rt is (bs.get("requiredTables") or [])[0]:
                n += 1
            records[rt.get("tableId")] = [
                {"id": self._rid(),
                 "fields": ({fields[0]["name"]: "seed%d" % i} if fields else {})}
                for i in range(n)]
        if self.add_table_named:
            tables.append({"id": self._tid(), "name": self.add_table_named,
                           "fields": [{"id": self._fid(), "name": "Name",
                                       "type": "singleLineText"}]})
        self.bases[base] = {"tables": tables, "records": records}
        if self.prebuild_complete:
            self._prebuild()

    def _prebuild(self):
        """Simulate a fully-built prior run: create-table output plus every
        post-create addition, so a retried run must skip everything."""
        base = next(iter(self.bases))
        b = self.bases[base]
        name_by_id = {t["id"]: t["name"] for t in b["tables"]}
        # map manifest logical keys to real/seeded ids
        lk_to_id = {}
        for rt in ((self.manifest.get("beforeState") or {}).get("requiredTables") or []):
            lk_to_id[rt.get("name")] = rt.get("tableId")
        for r in (self.manifest.get("reconcileExistingTables") or []):
            lk_to_id[r.get("logicalKey") or r.get("name")] = r.get("tableId")
        # tableCreates
        for tc in (self.manifest.get("tableCreates") or []):
            fields = []
            for f in (tc.get("fields") or []):
                spec = {"id": self._fid(), "name": f.get("name"),
                        "type": f.get("type", "singleLineText")}
                if f.get("type") in ("singleSelect", "multipleSelects"):
                    spec["options"] = {"choices": [{"name": c} for c in f.get("choices", [])]}
                if f.get("description") is not None:
                    spec["description"] = f["description"]
                fields.append(spec)
            nt = {"id": self._tid(), "name": tc.get("name"),
                  "description": tc.get("description"),
                  "primaryFieldId": fields[0]["id"] if fields else None,
                  "fields": fields}
            b["tables"].append(nt)
            b["records"][nt["id"]] = []
            lk_to_id[tc.get("logicalKey") or tc.get("name")] = nt["id"]
        def resolve(ref):
            if ref in lk_to_id:
                return lk_to_id[ref]
            if ref in name_by_id:
                return ref  # already an id
            for t in b["tables"]:
                if t["name"] == ref:
                    return t["id"]
            return ref
        # postCreateComputedFields
        for cf in (self.manifest.get("postCreateComputedFields") or []):
            tid = resolve(cf.get("tableId") or cf.get("tableLogicalKey"))
            t = self._table(base, tid)
            t["fields"].append({"id": self._fid(), "name": cf.get("name"),
                                "type": "formula",
                                "options": {"formula": (cf.get("options") or {}).get("formula")},
                                "description": cf.get("description")})
        # existingFieldExtensions
        for ex in (self.manifest.get("existingFieldExtensions") or []):
            t = self._table(base, ex["tableId"])
            if "addSingleSelectChoice" in ex:
                f = next(x for x in t["fields"] if x["id"] == ex["fieldId"])
                ch = (f.get("options") or {}).setdefault("choices", [])
                ch.append({"name": ex["addSingleSelectChoice"], "id": self._fid()})
            else:
                nf = {"id": self._fid(), "name": ex["name"], "type": ex["type"]}
                if ex.get("choices"):
                    nf["options"] = {"choices": [{"name": c} for c in ex["choices"]]}
                if ex.get("description") is not None:
                    nf["description"] = ex["description"]
                t["fields"].append(nf)
        # postCreateLinks
        for lf in (self.manifest.get("postCreateLinks") or []):
            src = resolve(lf.get("fromTable") or lf.get("fromTableId"))
            dst = resolve(lf.get("toTable") or lf.get("toTableId"))
            t = self._table(base, src)
            t["fields"].append({"id": self._fid(), "name": lf.get("fieldName"),
                                "type": "multipleRecordLinks",
                                "options": {"linkedTableId": dst,
                                            "prefersSingleRecordLink":
                                                bool(lf.get("prefersSingleRecordLink"))},
                                **({"description": lf["description"]}
                                   if lf.get("description") else {})})

    # -- emulated REST surface -----------------------------------------------
    def req(self, method, path, body=None):
        parts = [p for p in path.split("/") if p]
        if parts[0] == "meta":
            base = parts[2]
            if base not in self.bases:
                raise FixtureError(404, "fixture: unknown base %s (credential would not reach it)" % base)
            if len(parts) == 4 and parts[3] == "tables" and method == "GET":
                return {"tables": self.bases[base]["tables"]}
            if len(parts) == 4 and parts[3] == "tables" and method == "POST":
                t = {"id": self._tid(), "name": body["name"],
                     "description": body.get("description"),
                     "primaryFieldId": None,
                     "fields": [dict(f, id=self._fid()) for f in body.get("fields", [])]}
                t["primaryFieldId"] = t["fields"][0]["id"] if t["fields"] else None
                self.bases[base]["tables"].append(t)
                self.bases[base]["records"][t["id"]] = []
                return t
            if len(parts) == 6 and parts[3] == "tables" and parts[5] == "fields" and method == "POST":
                t = self._table(base, parts[4])
                f = dict(body, id=self._fid())
                t["fields"].append(f)
                return f
            if len(parts) == 7 and parts[3] == "tables" and parts[5] == "fields" and method == "PATCH":
                t = self._table(base, parts[4])
                for f in t["fields"]:
                    if f["id"] == parts[6]:
                        f.update(body)
                        return f
                raise FixtureError(404, "fixture: field %s not found" % parts[6])
        base = parts[0]
        if base not in self.bases:
            raise FixtureError(404, "fixture: unknown base %s" % base)
        tid = parts[1].split("?")[0]
        if method == "GET":
            return {"records": self.bases[base]["records"].get(tid, [])}
        if method == "POST":
            rec = {"id": self._rid(), "fields": (body or {}).get("fields", {})}
            self.bases[base]["records"].setdefault(tid, []).append(rec)
            return rec
        raise FixtureError(400, "fixture: unsupported %s %s" % (method, path))

    def _table(self, base, tid):
        for t in self.bases[base]["tables"]:
            if t["id"] == tid:
                return t
        raise FixtureError(404, "fixture: table %s not found in %s" % (tid, base))
