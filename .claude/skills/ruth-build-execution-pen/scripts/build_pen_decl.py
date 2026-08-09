#!/usr/bin/env python3
"""ruth-build-execution-pen v2.1.0 (permanent, reusable) - script 1 of 2.

Generic Airtable build-pen engine for DECLARATIVE signed build manifests
(Ruth v1.x shape). v2.0.0 consumed an imperative manifest (gates.
proposalHashRecipe + caps + actions[]) and was Challenger-cleared against a
synthetic manifest, but the real signed successors are declarative:
beforeState / scope / reconcileExistingTables / tableCreates /
postCreateComputedFields / postCreateLinks / existingFieldExtensions /
buildSequence / killCriteria / gates. This version compiles that shape into
an internal typed plan deterministically - zero model judgement - and
executes it as ONE Amber job.

Gates (all BEFORE the first mutation):
  approval  -> hash (recipe allowlist) -> target -> scope fence ->
  structure compile -> beforeState (strict live read) -> plan.

Credential posture (per commission v2.1): the ONLY credential is the
per-engagement AIRTABLE_BUILD_TARGET_WRITE, supplied via the skill
credential layer (never a CLI value, never printed). The v1.0.0
control-plane writer path and the v2.0.0 hardcoded frozen-base string are
REMOVED: the pen makes no control-plane writes and carries no base ID
anywhere (Household/Registry logging is the dispatcher/executor's job,
outside the pen). Target-scope proof: the platform/PAT cannot expose grant
metadata, so the pen proves scope by a safe read of the manifest target
and locks EVERY request URL to target.baseId. There is no host/base
parameter anywhere in this script.

External approval (per commission v2.1): the signed manifest keeps its
internal draft/pending gate labels (PENDING_DELTA_PASS etc.) - those are
historical file state at signing time, not authority. Authority is a
SEPARATE approval JSON binding decisionId + approver + verbatim quote +
ISO date + the exact canonical hash AND raw SHA-256 of the manifest file.
The pen validates all of it before anything else. A signed manifest
without its matching approval file aborts at the approval gate.

Usage (exact command line the permanent Build Executor runs):
  python3 build_pen_decl.py \
      --manifest recommendations-centre-build-manifest-v1.1-successor.json \
      --approval approval-ruth-schema-recommendations-centre-v1.1-2026-08-06.json \
      --out run-artifact.json
  # --fixture-drive : offline fixture mode (fixture_decl.py), no real API.

Requires AIRTABLE_BUILD_TARGET_WRITE in the environment (skill credential).
Exit 0 = complete; 1 = aborted (any gate/kill); 2 = missing credential.
"""
import argparse
import copy
import hashlib
import json
import os
import sys
import time

try:
    import urllib.request as _u
except Exception:  # pragma: no cover
    _u = None

API = "https://api.airtable.com/v0"
PEN_VERSION = "2.1.0"
ADAPTER_VERSION = "ruth-build-execution-pen/2.1.0"

# ---------------------------------------------------------------------------
# Named hash-recipe allowlist. Unknown recipe in the signed manifest = abort.
# Every recipe strips ONLY the self-referential signature material, then
# canonicalises: JSON, keys sorted recursively, compact separators, UTF-8,
# ensure_ascii=False.
# ---------------------------------------------------------------------------
def _canon(obj):
    return json.dumps(obj, sort_keys=True, separators=(",", ":"),
                      ensure_ascii=False).encode("utf-8")


def _sha(s):
    return hashlib.sha256(s).hexdigest()


def _strip_gates_proposalhash(m):
    # Declared by the real signed successor manifests themselves
    # ("sha256-canonical-excluding-gates.proposalHash:<hex>"): remove ONLY
    # gates.proposalHash - the self-reference. Every other byte (including
    # the historical pending gate labels) stays signed.
    # PROVEN 2026-08-06 against the real successor v1.1 attachment: canonical
    # 0e1806d9346f3ab246f6119ce545a9fad9a1b9e078e244dbe3b585fd8fe77381,
    # raw f05362fdff2ea320a5536bcedbcba40d23fab7840c3617569117149ad9be8df0.
    o = copy.deepcopy(m)
    g = o.get("gates")
    if isinstance(g, dict):
        g.pop("proposalHash", None)
    return o


def _strip_gates(m):
    # v2.0.0-era allowance for manifests whose gates block is a pure
    # signature container. Kept only for manifests that declare it by name.
    o = copy.deepcopy(m)
    o.pop("gates", None)
    return o


RECIPES = {
    "sha256-canonical-excluding-gates.proposalHash": _strip_gates_proposalhash,
    "json-canonical-sha256-minus-gates": _strip_gates,
}

# Compile-time fences (structural, not tuned per engagement).
ALLOWED_MANIFEST_KEYS = {
    "manifestId", "manifestVersion", "proposalDecisionId", "proposalStatus",
    "commissionSessionId", "sourceDesignThread", "pamDeltaThread",
    "target", "scope", "beforeState", "tableCreates", "postCreateLinks",
    "existingFieldExtensions", "contracts", "buildSequence", "killCriteria",
    "gates", "successorOf", "materialChange", "evidence",
    "penDocumentationDrift", "reconcileExistingTables",
    "postCreateComputedFields", "desiredFinalTables",
}
FIELD_CREATE_KEYS = {"logicalKey", "name", "description", "type", "options",
                     "choices", "primary", "expectedResultType"}
ALLOWED_FIELD_TYPES = {
    "singleLineText", "multilineText", "singleSelect", "multipleSelects",
    "number", "dateTime", "date", "checkbox", "url", "email",
}
FORMULA_ONLY_TYPE = "formula"
LINK_TYPE = "multipleRecordLinks"
# Non-hash gates must carry ONLY inert informational strings. Any gate key
# not in this set, or any value that looks like an authorisation flip
# (booleans, nulls, "yes"/"true"/"authorised" etc.), aborts the run: the pen
# refuses to let in-file labels act as authority. The external approval file
# is the only authority.
KNOWN_GATE_KEYS = {"buildChallenger", "exactProposalSignature", "proposalHash",
                   "amberBuildJob", "automationActivation"}


class Abort(Exception):
    def __init__(self, gate, msg, evidence=None):
        super().__init__(msg)
        self.gate, self.msg, self.evidence = gate, msg, evidence or {}


def get(m, *ks, **kw):
    cur = m
    for k in ks:
        if not isinstance(cur, dict) or k not in cur:
            return kw.get("default")
        cur = cur[k]
    return cur


def tgt_base(m):
    return get(m, "target", "baseId") or get(m, "target", "base")


# ---------------------------------------------------------------------------
# Airtable transport. URLs are built from the manifest target ONCE; no caller
# can redirect them.
# ---------------------------------------------------------------------------
class Airtable:
    def __init__(self, token, base, fixture=None):
        self.token, self.base, self.fixture = token, base, fixture

    def req(self, method, path, body=None):
        if self.fixture is not None:
            return self.fixture.req(method, path, body)
        url = API + path
        data = json.dumps(body).encode("utf-8") if body is not None else None
        r = _u.Request(url, data=data, method=method)
        r.add_header("Authorization", "Bearer " + self.token)
        if data is not None:
            r.add_header("Content-Type", "application/json")
        for attempt in range(5):
            try:
                with _u.urlopen(r, timeout=60) as resp:
                    raw = resp.read().decode("utf-8")
                    return json.loads(raw) if raw else {}
            except Exception as e:
                code = getattr(e, "code", None)
                if code == 429 or (code and 500 <= code < 600):
                    time.sleep(2 ** attempt)
                    continue
                raise Abort("api", "Airtable %s %s failed: %s" % (method, path, e))
        raise Abort("api", "Airtable %s %s: retries exhausted" % (method, path))

    def tables(self):
        return self.req("GET", "/meta/bases/%s/tables" % self.base).get("tables", [])

    def create_table(self, name, fields, description=None):
        body = {"name": name, "fields": fields}
        if description:
            body["description"] = description
        return self.req("POST", "/meta/bases/%s/tables" % self.base, body)

    def create_field(self, table_id, spec):
        return self.req("POST", "/meta/bases/%s/tables/%s/fields" % (self.base, table_id), spec)

    def update_field(self, table_id, field_id, spec):
        return self.req("PATCH", "/meta/bases/%s/tables/%s/fields/%s"
                        % (self.base, table_id, field_id), spec)

    def list_records(self, table_id, page_size=100):
        out, offset = [], None
        while True:
            q = "?pageSize=%d" % page_size + ("&offset=%s" % offset if offset else "")
            r = self.req("GET", "/%s/%s%s" % (self.base, table_id, q))
            out += r.get("records", [])
            offset = r.get("offset")
            if not offset:
                return out


# ---------------------------------------------------------------------------
# Deterministic declarative-manifest compiler (Ruth v1.x shape).
# Every judgement below is structural: an unknown key, type, op or section
# aborts. Nothing is re-derived, approximated or passed through prose.
# ---------------------------------------------------------------------------
def _field_spec(f, gate, what, allow_formula=False, extra_keys=()):
    if not isinstance(f, dict):
        raise Abort(gate, "%s: field entry is not an object" % what)
    bad = set(f) - (FIELD_CREATE_KEYS | set(extra_keys))
    if bad:
        raise Abort(gate, "%s: disallowed field keys %s" % (what, sorted(bad)))
    name, ftype = f.get("name"), f.get("type")
    if not name or not ftype:
        raise Abort(gate, "%s: field needs name+type" % what)
    if ftype == LINK_TYPE:
        raise Abort(gate, "%s: linked fields belong in postCreateLinks, not here" % what)
    if ftype == "createdTime":
        raise Abort(gate, "%s: native createdTime requested; created stamps must be "
                          "post-create formula fields (kill criterion)" % what)
    if ftype == FORMULA_ONLY_TYPE:
        if not allow_formula:
            raise Abort(gate, "%s: formula field outside postCreateComputedFields "
                              "(kill criterion: no formula inside table create)" % what)
        opts = f.get("options") or {}
        formula = opts.get("formula")
        if set(opts) - {"formula"} or not formula:
            raise Abort(gate, "%s: formula field options must be exactly {formula}" % what)
        spec = {"name": name, "type": "formula", "options": {"formula": formula}}
    else:
        if ftype not in ALLOWED_FIELD_TYPES:
            raise Abort(gate, "%s: unsupported field type %r" % (what, ftype))
        spec = {"name": name, "type": ftype}
        if ftype in ("singleSelect", "multipleSelects"):
            choices = f.get("choices")
            if not isinstance(choices, list):
                raise Abort(gate, "%s: select field %r needs a choices list" % (what, name))
            spec["options"] = {"choices": [{"name": c} for c in choices]}
        elif f.get("options") is not None:
            # typed options (e.g. dateTime format/tz): pass through, validated
            # against the API at create time; no model judgement here.
            spec["options"] = f["options"]
    if f.get("description") is not None:
        spec["description"] = f["description"]
    return spec, name, f.get("logicalKey") or name, f


def compile_plan(manifest):
    """Return an ordered typed plan. Raises Abort on any unknown shape."""
    plan = []
    tables_by_lk, tables_by_id = {}, {}

    # scope fence ------------------------------------------------------------
    scope = manifest.get("scope") or {}
    if not isinstance(scope, dict):
        raise Abort("scope", "scope must be an object")
    if scope.get("createAutomations") or scope.get("createInterfaces") or scope.get("seedRecords"):
        raise Abort("scope", "manifest declares automations/interfaces/seed records - "
                             "outside this pen's class")
    if scope.get("mutateExistingRecords") or scope.get("externalWrites"):
        raise Abort("scope", "manifest declares record mutation or external writes")
    for key in ("createTables", "extendTables", "reconcileExistingTables",
                "createAutomations", "createInterfaces", "seedRecords"):
        v = scope.get(key, [])
        if v is None:
            v = []
        if not isinstance(v, list):
            raise Abort("scope", "scope.%s must be a list" % key)
        scope[key] = v
    unknown_scope = set(scope) - {"createTables", "extendTables",
                                  "reconcileExistingTables", "createAutomations",
                                  "createInterfaces", "seedRecords",
                                  "mutateExistingRecords", "externalWrites"}
    if unknown_scope:
        raise Abort("scope", "unknown scope keys %s" % sorted(unknown_scope))

    # reconcileExistingTables: preserve only, plus an explicit allowed delta -
    for r in (manifest.get("reconcileExistingTables") or []):
        if not isinstance(r, dict) or not r.get("tableId"):
            raise Abort("structure", "reconcileExistingTables entry needs tableId")
        allowed = {"logicalKey", "tableId", "name", "recordCountMustEqual",
                   "preserveWithoutDeleteOrRecreate", "exactExistingFields",
                   "allowedDelta"}
        bad = set(r) - allowed
        if bad:
            raise Abort("structure", "reconcile %s: unknown keys %s"
                        % (r.get("tableId"), sorted(bad)))
        if r.get("preserveWithoutDeleteOrRecreate") is not True:
            raise Abort("structure", "reconcile %s: preserveWithoutDeleteOrRecreate "
                                     "must be true - this pen never deletes/recreates"
                        % r.get("tableId"))
        for d in (r.get("allowedDelta") or []):
            spec, name, _lk, _f = _field_spec(d, "structure",
                                              "allowedDelta on %s" % r.get("tableId"),
                                              allow_formula=True)
            if spec["type"] != FORMULA_ONLY_TYPE:
                raise Abort("structure", "allowedDelta on %s: %r is type %s - only "
                                         "formula additions are reconcilable"
                            % (r.get("tableId"), name, spec["type"]))
        tables_by_id[r["tableId"]] = r.get("logicalKey") or r.get("name") or r["tableId"]
        plan.append({"op": "reconcile", "tableId": r["tableId"],
                     "name": r.get("name"),
                     "recordCountMustEqual": r.get("recordCountMustEqual"),
                     "exactExistingFields": r.get("exactExistingFields") or []})

    # tableCreates -----------------------------------------------------------
    creates = manifest.get("tableCreates") or []
    if not isinstance(creates, list):
        raise Abort("structure", "tableCreates must be a list")
    for tc in creates:
        if not isinstance(tc, dict):
            raise Abort("structure", "tableCreates entry is not an object")
        bad = set(tc) - {"logicalKey", "name", "description", "fields"}
        if bad:
            raise Abort("structure", "tableCreates %r: unknown keys %s"
                        % (tc.get("name"), sorted(bad)))
        fields_out = []
        for f in (tc.get("fields") or []):
            spec, name, _lk, _f = _field_spec(f, "structure",
                                              "tableCreates[%s]" % tc.get("name"),
                                              allow_formula=False)
            fields_out.append(spec)
        lk = tc.get("logicalKey") or tc.get("name")
        tables_by_lk[lk] = True
        plan.append({"op": "createTable", "logicalKey": lk, "name": tc.get("name"),
                     "description": tc.get("description"), "fields": fields_out})

    # (desired-final logicalKey aliases are registered at run() start)

    # scope cross-checks (declared scope must match declared sections) -------
    create_names = {p["name"] for p in plan if p["op"] == "createTable"}
    if set(scope["createTables"]) != create_names:
        raise Abort("scope", "scope.createTables %s does not match tableCreates %s"
                    % (sorted(scope["createTables"]), sorted(create_names)))
    recon_ids = {p["tableId"] for p in plan if p["op"] == "reconcile"}
    if set(scope["reconcileExistingTables"]) != recon_ids:
        raise Abort("scope", "scope.reconcileExistingTables does not match sections")

    # postCreateComputedFields (formula, post-create only) -------------------
    computed = manifest.get("postCreateComputedFields") or []
    for cf in computed:
        if not isinstance(cf, dict):
            raise Abort("structure", "postCreateComputedFields entry is not an object")
        bad = set(cf) - {"tableId", "tableLogicalKey", "name", "type", "options",
                         "description", "expectedResultType"}
        if bad:
            raise Abort("structure", "computed field %r: unknown keys %s"
                        % (cf.get("name"), sorted(bad)))
        if cf.get("type") != FORMULA_ONLY_TYPE:
            raise Abort("structure", "postCreateComputedFields %r: type must be formula"
                        % cf.get("name"))
        ref = cf.get("tableId") or cf.get("tableLogicalKey")
        if not ref:
            raise Abort("structure", "computed field %r needs tableId or tableLogicalKey"
                        % cf.get("name"))
        spec, _n, _lk, _f = _field_spec(cf, "structure", "computed %r" % cf.get("name"),
                                        allow_formula=True,
                                        extra_keys=("tableId", "tableLogicalKey"))
        plan.append({"op": "createField", "tableRef": ref, "spec": spec,
                     "expectedResultType": cf.get("expectedResultType"),
                     "formula": True})

    # existingFieldExtensions -------------------------------------------------
    for ex in (manifest.get("existingFieldExtensions") or []):
        if not isinstance(ex, dict) or not ex.get("tableId"):
            raise Abort("structure", "existingFieldExtensions entry needs tableId")
        if "addSingleSelectChoice" in ex:
            bad = set(ex) - {"tableId", "fieldId", "addSingleSelectChoice"}
            if bad:
                raise Abort("structure", "choice extension %s: unknown keys %s"
                            % (ex.get("fieldId"), sorted(bad)))
            if not ex.get("fieldId") or not isinstance(ex.get("addSingleSelectChoice"), str):
                raise Abort("structure", "choice extension on %s needs fieldId + choice string"
                            % ex.get("tableId"))
            plan.append({"op": "extendSelectChoice", "tableId": ex["tableId"],
                         "fieldId": ex["fieldId"],
                         "choice": ex["addSingleSelectChoice"]})
        elif "name" in ex and "type" in ex:
            spec, name, _lk, _f = _field_spec(ex, "structure",
                                              "extension field %r" % ex.get("name"),
                                              allow_formula=False,
                                              extra_keys=("tableId",))
            if ex.get("fieldId"):
                raise Abort("structure", "new-field extension %r must not pin a fieldId"
                            % name)
            plan.append({"op": "createField", "tableRef": ex["tableId"], "spec": spec,
                         "formula": False})
        else:
            raise Abort("structure", "existingFieldExtensions entry %s is neither a "
                                     "choice addition nor a new field" % str(ex)[:80])

    # postCreateLinks ---------------------------------------------------------
    for lf in (manifest.get("postCreateLinks") or []):
        if not isinstance(lf, dict):
            raise Abort("structure", "postCreateLinks entry is not an object")
        bad = set(lf) - {"fromTable", "fromTableId", "toTable", "toTableId",
                         "fieldName", "type", "prefersSingleRecordLink",
                         "description", "required"}
        if bad:
            raise Abort("structure", "link %r: unknown keys %s"
                        % (lf.get("fieldName"), sorted(bad)))
        if lf.get("type") != LINK_TYPE or not lf.get("fieldName"):
            raise Abort("structure", "link %r must be type multipleRecordLinks with fieldName"
                        % lf.get("fieldName"))
        src = lf.get("fromTable") or lf.get("fromTableId")
        dst = lf.get("toTable") or lf.get("toTableId")
        if not src or not dst:
            raise Abort("structure", "link %r needs from*/to*" % lf.get("fieldName"))
        plan.append({"op": "createLink", "fromRef": src, "toRef": dst,
                     "name": lf["fieldName"],
                     "prefersSingleRecordLink": bool(lf.get("prefersSingleRecordLink")),
                     "description": lf.get("description")})

    return plan, scope


# ---------------------------------------------------------------------------
# Approval validation. External signature artifact - the ONLY authority.
# ---------------------------------------------------------------------------
def validate_approval(approval, manifest, canonical, raw_hash):
    if not isinstance(approval, dict):
        raise Abort("approval", "approval file is not a JSON object")
    for k in ("decisionId", "approver", "decision", "quote", "date",
              "manifestCanonicalHash", "manifestRawSha256"):
        if not approval.get(k):
            raise Abort("approval", "approval missing required key %r" % k)
    if approval.get("manifestCanonicalHash") != canonical:
        raise Abort("approval", "approval canonical hash does not match manifest",
                    {"approval": approval.get("manifestCanonicalHash"),
                     "manifest": canonical})
    if approval.get("manifestRawSha256") != raw_hash:
        raise Abort("approval", "approval raw hash does not match manifest file",
                    {"approval": approval.get("manifestRawSha256"),
                     "manifestFile": raw_hash})
    if approval.get("decisionId") != manifest.get("proposalDecisionId"):
        raise Abort("approval", "approval decisionId %r does not match manifest "
                                "proposalDecisionId %r"
                    % (approval.get("decisionId"), manifest.get("proposalDecisionId")))
    if str(approval.get("approver")).strip().lower() not in ("matthew", "matthew hopkinson"):
        raise Abort("approval", "approver is not Matthew: %r" % approval.get("approver"))
    if str(approval.get("decision")).strip().lower() not in ("approved", "signed"):
        raise Abort("approval", "decision is not affirmative: %r" % approval.get("decision"))
    quote = str(approval.get("quote", "")).strip()
    if len(quote) < 12:
        raise Abort("approval", "quote is too short to be a verbatim signature quote")
    import re as _re
    if not _re.match(r"^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}", str(approval.get("date"))):
        raise Abort("approval", "approval date must be ISO-8601 with time")


# ---------------------------------------------------------------------------
# beforeState verification (strict; abortOnMismatch honoured).
# ---------------------------------------------------------------------------
def _choices(live_field):
    opts = (live_field or {}).get("options") or {}
    return {c.get("name"): c.get("id") for c in (opts.get("choices") or [])
            if isinstance(c, dict)}


def table_matches_retry(live, tc, declared_new_fields):
    """True iff the live table is exactly the declared ordinary create shape,
    plus only post-create additions the manifest itself declares on it."""
    lk = tc.get("logicalKey") or tc.get("name")
    live_types = {f.get("name"): f.get("type") for f in live.get("fields", [])}
    want = {f.get("name"): f.get("type") for f in (tc.get("fields") or [])}
    for fname, ftype in live_types.items():
        if fname in want:
            if want[fname] != ftype:
                return False
            continue
        if declared_new_fields.get((lk, fname), {}).get("type") != ftype:
            return False
    return all(live_types.get(k) == v for k, v in want.items())


def verify_beforestate(manifest, live_by_id, live_by_name, at, declared_new_fields):
    bs = manifest.get("beforeState") or {}
    abort_on_mismatch = bs.get("abortOnMismatch", True)
    drift = []

    def d(entry):
        drift.append(entry)
        if abort_on_mismatch:
            raise Abort("beforeState", "strict beforeState mismatch (abortOnMismatch)",
                        {"firstDrift": entry})

    for rt in (bs.get("requiredTables") or []):
        live = live_by_id.get(rt.get("tableId"))
        if not live:
            d({"kind": "required_table_missing", "tableId": rt.get("tableId"),
               "name": rt.get("name")})
            continue
        if rt.get("name") and live.get("name") != rt.get("name"):
            d({"kind": "table_name_drift", "tableId": rt.get("tableId"),
               "declared": rt.get("name"), "live": live.get("name")})
        if rt.get("description") is not None and live.get("description") != rt.get("description"):
            d({"kind": "table_description_drift", "tableId": rt.get("tableId")})
        if rt.get("primaryFieldId") and live.get("primaryFieldId") != rt.get("primaryFieldId"):
            d({"kind": "primary_field_drift", "tableId": rt.get("tableId"),
               "declared": rt.get("primaryFieldId"),
               "live": live.get("primaryFieldId")})
        live_fields = {f.get("id"): f for f in live.get("fields", [])}
        for rf in (rt.get("requiredFields") or []):
            lf = live_fields.get(rf.get("fieldId"))
            if not lf:
                d({"kind": "required_field_missing", "tableId": rt.get("tableId"),
                   "fieldId": rf.get("fieldId"), "name": rf.get("name")})
                continue
            if lf.get("name") != rf.get("name"):
                d({"kind": "field_name_drift", "fieldId": rf.get("fieldId"),
                   "declared": rf.get("name"), "live": lf.get("name")})
            if lf.get("type") != rf.get("type"):
                d({"kind": "field_type_drift", "fieldId": rf.get("fieldId"),
                   "declared": rf.get("type"), "live": lf.get("type")})
            want_ids = rf.get("requiredChoiceIds") or []
            have = _choices(lf)
            for cname in (rf.get("requiredChoices") or []):
                if cname not in have:
                    d({"kind": "required_choice_missing", "fieldId": rf.get("fieldId"),
                       "choice": cname})
            if want_ids:
                have_ids = {v for v in have.values() if v}
                missing = [i for i in want_ids if i not in have_ids]
                if missing:
                    d({"kind": "required_choice_ids_missing",
                       "fieldId": rf.get("fieldId"), "missing": missing})
        if isinstance(rt.get("recordCount"), int):
            n = len(at.list_records(rt["tableId"]))
            if n != rt["recordCount"]:
                d({"kind": "record_count_drift", "tableId": rt.get("tableId"),
                   "declared": rt["recordCount"], "live": n})

    # declared additions (computed fields, extension fields, link fields) that
    # already exist in EXACTLY the signed shape are retry evidence, not drift;
    # anything else present is drift. Keyed by BOTH tableId and logicalKey.
    retry_safe_absent = set()
    for tc in (manifest.get("tableCreates") or []):
        live = live_by_name.get(tc.get("name"))
        if live and table_matches_retry(live, tc, declared_new_fields):
            # a same-name table whose shape exactly matches the declared create
            # (plus only declared post-create additions) is a prior run's
            # output, not a collision: the retry path, not drift.
            retry_safe_absent.add(tc.get("name"))
    for name in (bs.get("requiredAbsentTables") or []):
        if name in live_by_name and name not in retry_safe_absent:
            d({"kind": "absent_table_present", "name": name})

    for af in (bs.get("requiredAbsentFields") or []):
        live = live_by_id.get(af.get("tableId"))
        if not live:
            continue
        for f in live.get("fields", []):
            if f.get("name") != af.get("name"):
                continue
            want = declared_new_fields.get((af.get("tableId"), af.get("name")))
            if want and f.get("type") == want["type"] and (
                    want["type"] != "formula"
                    or (f.get("options") or {}).get("formula") == want.get("formula")):
                continue  # retry: already applied exactly
            d({"kind": "absent_field_present", "tableId": af.get("tableId"),
               "name": af.get("name"), "liveType": f.get("type")})

    declared_choices = {}
    for ex in (manifest.get("existingFieldExtensions") or []):
        if "addSingleSelectChoice" in ex:
            declared_choices[(ex.get("tableId"), ex.get("fieldId"),
                              ex["addSingleSelectChoice"])] = True
    for ac in (bs.get("requiredAbsentSelectChoices") or []):
        live = live_by_id.get(ac.get("tableId"))
        lf = None
        if live:
            lf = next((f for f in live.get("fields", []) if f.get("id") == ac.get("fieldId")),
                      None)
        if lf and ac.get("choice") in _choices(lf) \
                and (ac.get("tableId"), ac.get("fieldId"), ac.get("choice")) not in declared_choices:
            d({"kind": "absent_choice_present", "tableId": ac.get("tableId"),
               "fieldId": ac.get("fieldId"), "choice": ac.get("choice")})

    if drift:
        raise Abort("beforeState", "beforeState drift", {"drift": drift[:20],
                                                         "total": len(drift)})
    return drift


# ---------------------------------------------------------------------------
# The engine.
# ---------------------------------------------------------------------------
def run(manifest, approval, manifest_path, fixture=None, out_path=None):
    run_id = "ruthbuild-" + time.strftime("%Y%m%dT%H%M%SZ", time.gmtime())
    steps, resolved = [], {"tablesByLogicalKey": {}, "tablesById": {}, "fields": {}}
    # desired-final logicalKey aliases for preserved/existing tables (signed
    # manifest data, loaded before the first mutation)
    for _dft in (manifest.get("desiredFinalTables") or []):
        if isinstance(_dft, dict) and _dft.get("logicalKey") and _dft.get("tableId"):
            resolved["tablesByLogicalKey"][_dft["logicalKey"]] = _dft["tableId"]

    def log(kind, step, **kw):
        e = {"kind": kind, "step": step}
        e.update(kw)
        steps.append(e)
        return e

    def find_table(ref, live_by_id, live_by_name):
        if not isinstance(ref, str):
            raise Abort("resolve", "table reference is not a string: %r" % (ref,))
        if ref in resolved["tablesByLogicalKey"]:
            return resolved["tablesByLogicalKey"][ref]
        if ref in live_by_id:
            return ref
        if ref in live_by_name:
            return live_by_name[ref].get("id")
        raise Abort("resolve", "cannot resolve table reference %r" % ref)

    try:
        with open(manifest_path, "rb") as f:
            raw_hash = _sha(f.read())

        # GATE 0 manifest top-level structure --------------------------------
        unknown = set(manifest) - ALLOWED_MANIFEST_KEYS
        if unknown:
            raise Abort("structure", "unknown manifest top-level keys %s" % sorted(unknown))

        # GATE 1 hash ---------------------------------------------------------
        embedded = get(manifest, "gates", "proposalHash") or ""
        if not isinstance(embedded, str) or ":" not in embedded:
            raise Abort("hash", "gates.proposalHash must be '<recipe>:<hex>'", {"value": embedded})
        recipe, expected = embedded.rsplit(":", 1)
        if recipe not in RECIPES:
            raise Abort("hash", "unknown hash recipe %r (allowlist: %s)"
                        % (recipe, sorted(RECIPES)))
        computed = _sha(_canon(RECIPES[recipe](manifest)))
        if computed != expected:
            raise Abort("hash", "proposal hash mismatch",
                        {"computed": computed, "expected": expected, "recipe": recipe})
        log("gate", "hash", result="pass", recipe=recipe, canonicalHash=expected,
            rawSha256=raw_hash)

        # GATE 2 approval (external signature artifact = the only authority) --
        validate_approval(approval, manifest, expected, raw_hash)
        log("gate", "approval", result="pass", decisionId=approval.get("decisionId"),
            approver=approval.get("approver"), date=approval.get("date"))

        # GATE 2b in-file gates are inert informational labels -----------------
        g = manifest.get("gates") or {}
        unknown_gates = set(g) - KNOWN_GATE_KEYS
        if unknown_gates:
            raise Abort("gates", "unknown gates keys %s" % sorted(unknown_gates))
        for k, v in g.items():
            if k == "proposalHash":
                continue
            if not isinstance(v, str):
                raise Abort("gates", "gate %r is non-string %r - in-file labels may not "
                                     "carry authority" % (k, v))
            lv = v.strip().lower()
            if lv in ("yes", "true", "approved", "authorised", "authorized", "cleared"):
                raise Abort("gates", "gate %r reads as an in-file authorisation %r - "
                                     "refused; authority lives in the approval file"
                            % (k, v))
        log("gate", "gates-inert", result="pass",
            note="internal labels are historical file state; approval file governs")

        # GATE 3 target ---------------------------------------------------------
        base = tgt_base(manifest)
        if not base or not isinstance(base, str) or not base.startswith("app"):
            raise Abort("target", "manifest target.baseId missing/invalid: %r" % base)
        log("gate", "target", result="pass", baseId=base)

        # GATE 4 credential + scope proof ---------------------------------------
        token = os.environ.get("AIRTABLE_BUILD_TARGET_WRITE", "")
        if not token:
            raise Abort("credential", "AIRTABLE_BUILD_TARGET_WRITE not set "
                                      "(per-engagement credential required)")
        at = Airtable(token, base, fixture=fixture)
        try:
            live_tables = at.tables()
        except Abort as e:
            raise Abort("credential", "credential cannot read manifest target %s: %s"
                        % (base, e.msg))
        live_by_id = {t.get("id"): t for t in live_tables}
        live_by_name = {t.get("name"): t for t in live_tables}
        log("gate", "credential", result="pass",
            note="target proven by safe read of the manifest base; every request URL "
                 "is locked to target.baseId (no host/base parameter exists)")

        # GATE 5 structure compile ----------------------------------------------
        plan, scope = compile_plan(manifest)
        log("gate", "structure", result="pass", plannedOps=len(plan),
            ops={op: sum(1 for p in plan if p["op"] == op)
                 for op in sorted({p["op"] for p in plan})})

        # retry-aware comparison map for declared post-create additions, shared
        # by the beforeState gate and the createTable idempotency check
        dft_alias = {d.get("logicalKey"): d.get("tableId")
                     for d in (manifest.get("desiredFinalTables") or [])
                     if isinstance(d, dict)}
        declared_new_fields = {}

        def _reg(ref, name, spec):
            declared_new_fields[(ref, name)] = spec
            if ref in dft_alias:
                declared_new_fields[(dft_alias[ref], name)] = spec
        for cf in (manifest.get("postCreateComputedFields") or []):
            _reg(cf.get("tableId") or cf.get("tableLogicalKey"), cf.get("name"),
                 {"type": "formula",
                  "formula": (cf.get("options") or {}).get("formula")})
        for ex in (manifest.get("existingFieldExtensions") or []):
            if "name" in ex and "type" in ex:
                _reg(ex.get("tableId"), ex.get("name"), {"type": ex.get("type")})
        for lf_ in (manifest.get("postCreateLinks") or []):
            _reg(lf_.get("fromTable") or lf_.get("fromTableId"),
                 lf_.get("fieldName"), {"type": LINK_TYPE})

        # GATE 6 strict beforeState ----------------------------------------------
        verify_beforestate(manifest, live_by_id, live_by_name, at, declared_new_fields)
        log("gate", "beforeState", result="pass",
            requiredTables=[t.get("name") for t in
                            (get(manifest, "beforeState", "requiredTables", default=[]) or [])])

        # EXECUTE (plan order; manifest buildSequence is the narrative of this) --
        def refresh():
            tl = at.tables()
            return {t.get("id"): t for t in tl}, {t.get("name"): t for t in tl}

        for p in plan:
            op = p["op"]
            if op == "reconcile":
                live = live_by_id.get(p["tableId"])
                if not live:
                    raise Abort("reconcile", "reconcile target %s missing live" % p["tableId"])
                resolved["tablesById"][p["tableId"]] = p["tableId"]
                live_ids = {f.get("id") for f in live.get("fields", [])}
                for ef in p["exactExistingFields"]:
                    if ef.get("fieldId") not in live_ids:
                        raise Abort("reconcile", "preserved field %s missing live on %s"
                                    % (ef.get("fieldId"), p["tableId"]))
                if isinstance(p.get("recordCountMustEqual"), int):
                    n = len(at.list_records(p["tableId"]))
                    if n != p["recordCountMustEqual"]:
                        raise Abort("reconcile", "record count on %s: live %d != declared %d"
                                    % (p["tableId"], n, p["recordCountMustEqual"]))
                log("reconcile", p["tableId"], result="preserved",
                    fields=len(p["exactExistingFields"]))

            elif op == "createTable":
                name = p["name"]
                existing = live_by_name.get(name)
                if existing:
                    if table_matches_retry(existing, p, declared_new_fields):
                        resolved["tablesByLogicalKey"][p["logicalKey"]] = existing["id"]
                        resolved["tablesById"][existing["id"]] = p["logicalKey"]
                        resolved["fields"][p["logicalKey"]] = {
                            f.get("name"): f.get("id") for f in existing.get("fields", [])}
                        log("skip", "createTable:%s" % name, reason="idempotent-exists-exact",
                            tableId=existing["id"])
                        continue
                    raise Abort("execute", "table %r already exists with different shape - "
                                           "abort, never approximate" % name,
                                {"tableId": existing.get("id")})
                r = at.create_table(name, p["fields"], description=p.get("description"))
                tid = r.get("id")
                resolved["tablesByLogicalKey"][p["logicalKey"]] = tid
                resolved["tablesById"][tid] = p["logicalKey"]
                resolved["fields"][p["logicalKey"]] = {
                    f.get("name"): f.get("id") for f in (r.get("fields") or [])}
                log("create", "createTable:%s" % name, tableId=tid, fields=len(p["fields"]))
                live_by_id, live_by_name = refresh()

            elif op == "createField":
                tid = find_table(p["tableRef"], live_by_id, live_by_name)
                spec = p["spec"]
                lt = live_by_id.get(tid) or {}
                existing = next((f for f in lt.get("fields", [])
                                 if f.get("name") == spec["name"]), None)
                if existing:
                    ok = existing.get("type") == spec["type"] and (
                        spec["type"] != "formula"
                        or (existing.get("options") or {}).get("formula")
                        == spec["options"]["formula"])
                    if ok:
                        log("skip", "createField:%s.%s" % (tid, spec["name"]),
                            reason="idempotent-exists-exact", fieldId=existing.get("id"))
                        continue
                    raise Abort("execute", "field %r exists on %s with different shape"
                                % (spec["name"], tid))
                r = at.create_field(tid, spec)
                fid = r.get("id")
                resolved["fields"].setdefault(p["tableRef"], {})[spec["name"]] = fid
                log("create", "createField:%s" % spec["name"], tableId=tid, fieldId=fid,
                    formula=bool(p.get("formula")))
                if p.get("formula"):
                    # immediate readback: formula fields must come back as formula
                    live_by_id, live_by_name = refresh()
                    rf = next((f for f in (live_by_id.get(tid) or {}).get("fields", [])
                               if f.get("id") == fid), {})
                    if rf.get("type") != "formula" or \
                            (rf.get("options") or {}).get("formula") != spec["options"]["formula"]:
                        raise Abort("execute", "created formula field %r read back wrong: %s"
                                    % (spec["name"], rf))
                    log("verify", "formulaReadback:%s" % spec["name"], result="pass")
                else:
                    live_by_id, live_by_name = refresh()

            elif op == "extendSelectChoice":
                tid, fid, choice = p["tableId"], p["fieldId"], p["choice"]
                lt = live_by_id.get(tid)
                if not lt:
                    raise Abort("execute", "extension target table %s missing live" % tid)
                lf = next((f for f in lt.get("fields", []) if f.get("id") == fid), None)
                if not lf:
                    raise Abort("execute", "extension field %s missing on %s" % (fid, tid))
                if lf.get("type") != "singleSelect":
                    raise Abort("execute", "extension field %s is %s, not singleSelect"
                                % (fid, lf.get("type")))
                existing_choices = [c for c in ((lf.get("options") or {}).get("choices") or [])
                                    if isinstance(c, dict)]
                names = {c.get("name") for c in existing_choices}
                if choice in names:
                    log("skip", "extendSelectChoice:%s" % choice, reason="idempotent-exists",
                        tableId=tid, fieldId=fid)
                    continue
                merged = [{"id": c.get("id"), "name": c.get("name"), "color": c.get("color")}
                          for c in existing_choices] + [{"name": choice}]
                at.update_field(tid, fid, {"options": {"choices": merged}})
                log("update", "extendSelectChoice:%s" % choice, tableId=tid, fieldId=fid,
                    existingPreserved=len(existing_choices))
                live_by_id, live_by_name = refresh()

            elif op == "createLink":
                src = find_table(p["fromRef"], live_by_id, live_by_name)
                dst = find_table(p["toRef"], live_by_id, live_by_name)
                lt = live_by_id.get(src) or {}
                existing = next((f for f in lt.get("fields", [])
                                 if f.get("name") == p["name"]), None)
                if existing:
                    ok = existing.get("type") == LINK_TYPE and \
                        (existing.get("options") or {}).get("linkedTableId") == dst
                    if ok:
                        log("skip", "createLink:%s" % p["name"], reason="idempotent-exists-exact",
                            tableId=src, fieldId=existing.get("id"))
                        continue
                    raise Abort("execute", "link field %r on %s exists with wrong shape"
                                % (p["name"], src))
                spec = {"name": p["name"], "type": LINK_TYPE,
                        "options": {"linkedTableId": dst,
                                    "prefersSingleRecordLink": p["prefersSingleRecordLink"]}}
                if p.get("description"):
                    spec["description"] = p["description"]
                r = at.create_field(src, spec)
                log("create", "createLink:%s" % p["name"], tableId=src, fieldId=r.get("id"),
                    linkedTableId=dst)
                resolved["fields"].setdefault(str(p["fromRef"]), {})[p["name"]] = r.get("id")
                live_by_id, live_by_name = refresh()

            else:  # pragma: no cover - compile fences this
                raise Abort("structure", "unknown plan op %r" % op)

        # READBACK ---------------------------------------------------------------
        live_by_id, live_by_name = refresh()
        readback = {"tables": {}}
        for tid, lk in list(resolved["tablesById"].items()):
            t = live_by_id.get(tid)
            if t:
                readback["tables"][lk] = {
                    "tableId": tid, "name": t.get("name"),
                    "fields": {f.get("name"): {"id": f.get("id"), "type": f.get("type")}
                               for f in t.get("fields", [])}}

        artifact = {
            "run_id": run_id, "pen": "ruth-build-execution-pen",
            "pen_version": PEN_VERSION,
            "manifestId": manifest.get("manifestId"),
            "manifestVersion": manifest.get("manifestVersion"),
            "canonicalHash": expected, "recipe": recipe, "rawSha256": raw_hash,
            "target": {"baseId": base},
            "approval": {"decisionId": approval.get("decisionId"),
                         "approver": approval.get("approver"),
                         "date": approval.get("date"),
                         "quote": approval.get("quote")},
            "gates": [s for s in steps if s["kind"] == "gate"],
            "steps": [s for s in steps if s["kind"] != "gate"],
            "resolvedIdMap": resolved, "readback": readback,
            "result": "complete",
            "note": "Household Activity + Registry Change Log entries are the "
                    "dispatcher/executor's responsibility, not the pen's.",
        }
        artifact["artifact_hash"] = _sha(_canon({k: v for k, v in artifact.items()
                                                 if k != "artifact_hash"}))
        if out_path:
            with open(out_path, "w", encoding="utf-8") as f:
                json.dump(artifact, f, indent=2, sort_keys=True)
        print(json.dumps({"result": "complete", "run_id": run_id,
                          "artifact_hash": artifact["artifact_hash"],
                          "steps": len(artifact["steps"]),
                          "resolvedIdMap": resolved}, indent=2))
        return 0

    except Abort as e:
        artifact = {"run_id": run_id, "pen": "ruth-build-execution-pen",
                    "pen_version": PEN_VERSION, "result": "aborted",
                    "gate": e.gate, "error": e.msg, "evidence": e.evidence,
                    "steps": steps}
        artifact["artifact_hash"] = _sha(_canon({k: v for k, v in artifact.items()
                                                 if k != "artifact_hash"}))
        if out_path:
            with open(out_path, "w", encoding="utf-8") as f:
                json.dump(artifact, f, indent=2, sort_keys=True)
        print(json.dumps({"result": "aborted", "gate": e.gate, "error": e.msg,
                          "evidence": e.evidence}, indent=2))
        return 1


def main():
    p = argparse.ArgumentParser()
    p.add_argument("--manifest", required=True)
    p.add_argument("--approval", required=True)
    p.add_argument("--out")
    p.add_argument("--fixture-drive", action="store_true")
    a = p.parse_args()
    with open(a.manifest, "r", encoding="utf-8") as f:
        manifest = json.load(f)
    with open(a.approval, "r", encoding="utf-8") as f:
        approval = json.load(f)
    fixture = None
    if a.fixture_drive:
        sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
        import fixture_decl
        fixture = fixture_decl.Fixture(manifest)
        fixture.seed()
    rc = run(manifest, approval, a.manifest, fixture=fixture, out_path=a.out)
    sys.exit(rc)


if __name__ == "__main__":
    main()
