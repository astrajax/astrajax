#!/usr/bin/env python3
"""Idempotent HyperAgent export → Airtable fleet sync writer.

Reads agent export JSONs (HyperAgent Downloads shape), upserts Household Register
rows and existing Head Agent bases only. Minions never get Agent bases.

Also supports Self-Update Executor verify-pass payloads: update live Household
Members (head or minion Kind on the row) and Skills, then append-only Household
Versions + Skill Versions (field IDs). Persona Config is skipped on the
verify-pass path. Never write identity to leftover Household Minions.

Default is dry-run. Pass --apply to write. Every apply run writes a reversal log JSON
under docs/initiatives/fleet-sync-2026-08-10/ and verifies it on disk.

Usage:
  python3 hyperagent/scripts/sync_hyperagent_fleet_to_airtable.py \\
    --input-dir hyperagent/exports/agents

  python3 hyperagent/scripts/sync_hyperagent_fleet_to_airtable.py \\
    --input-dir ~/Downloads --apply

  python3 hyperagent/scripts/sync_hyperagent_fleet_to_airtable.py \\
    --verify-pass-payload /tmp/self-update-pass.json --apply

Env: AIRTABLE_READ_TOKEN (dry-run reads), AIRTABLE_WRITE_TOKEN (--apply writes).
Roster: hyperagent/scripts/fleet_sync_roster.json (Head/Minion classification).

Freeze lifted 2026-08-12 (Matthew). See docs/initiatives/fleet-sync-2026-08-10/README.md.
"""

from __future__ import annotations

import argparse
import json
import os
import re
import sys
import urllib.error
import urllib.parse
import urllib.request
from dataclasses import dataclass, field
from datetime import date, datetime, timezone
from pathlib import Path
from typing import Any, Literal

SCRIPT_DIR = Path(__file__).resolve().parent
REPO_ROOT = SCRIPT_DIR.parents[1]
ROSTER_PATH = SCRIPT_DIR / "fleet_sync_roster.json"
REVERSAL_DIR = REPO_ROOT / "docs" / "initiatives" / "fleet-sync-2026-08-10"

HOUSEHOLD_MEMBERS_TABLE = "tblJ70qtHUc1dUHhi"
# Leftover table. Keep the ID frozen. Never write identity here.
HOUSEHOLD_MINIONS_TABLE = "tbl6aVm9rgWoOBVfd"
HOUSEHOLD_VERSIONS_TABLE = "tbleX09zbkUNKTGBz"
REGISTER_SKILLS_TABLE = "tblAIXtDBBMrLuEYc"
SKILL_VERSIONS_TABLE = "tbllp30BraLWgslhk"

DEFAULT_CONFIG_NAME = "Operational v1.0 (HyperAgent sync)"
ACTIVE_STATUSES = {"Approved", "Pending"}
DEFAULT_CHANGE_SOURCE = "Matthew Directed"
SKILL_FORGE_CHANGE_SOURCE = "Skill Forge Suggested - Matthew Approved"
DEFAULT_CHANGE_REASON = "Improvement"
ROLLBACK_CHANGE_REASON = "Broken/failing"
VERIFY_PASS_KINDS = {"head", "minion", "skill"}
VERIFY_PASS_PHASES = {"before", "after"}

# Field IDs — write by ID for Versions / Skill Versions (Change Reason has a leading space).
MEMBERS_FLD = {
    "agent_slug": "fld3adhxC9WwS935R",
    "agent_name": "fldYQIYPYklMv9o25",
    "system_prompt": "fldKKvps3FIAvJdhh",
    "purpose": "fldHCX9GT7fQsODDU",
    "agent_base_id": "fldpdAqXBb58MAZH9",
    "status": "fld9I4XUi9jiu8xjZ",
    "kind": "fldnGanqKXoV5ohJc",
    "reports_to": "fldVVE7LZGhkYuzOn",
    "crew": "fldzTkPqsTiTpcqvg",  # inverse of Reports To; do not write
    "runtimes": "fldOMYUwOBBwx98J0",
}
# Leftover Household Minions fields. Do not write identity.
MINIONS_FLD = {
    "agent_slug": "fldqd8ddmvGTtQh3M",
    "agent_name": "fldlTDUvIG596QC00",
    "purpose": "fld4FS5mDtZd3vRBP",
    "system_prompt": "fldex5K15FTjEWoM7",
    "status": "fldwLZTA2v3F5PLhU",
}
KIND_LABEL = {"head": "Head", "minion": "Minion"}
RUNTIME_CURSOR = "Cursor"
RUNTIME_HYPERAGENT = "HyperAgent"
RUNTIME_PLATFORM = "AstraJax Platform"
ALLOWED_RUNTIME_WRITES = {RUNTIME_CURSOR, RUNTIME_HYPERAGENT}
MEMBER_FIELD_NAMES = {
    MEMBERS_FLD["agent_slug"]: "Agent Slug",
    MEMBERS_FLD["agent_name"]: "Agent Name",
    MEMBERS_FLD["system_prompt"]: "System Prompt",
    MEMBERS_FLD["purpose"]: "Purpose",
    MEMBERS_FLD["agent_base_id"]: "Agent Base ID",
    MEMBERS_FLD["status"]: "Status",
    MEMBERS_FLD["kind"]: "Kind",
    MEMBERS_FLD["reports_to"]: "Reports To",
    MEMBERS_FLD["runtimes"]: "Runtimes",
}
VERSIONS_FLD = {
    "agent_slug": "fldy0d0D6zEip82p8",
    "agent_name": "fldtGIHVsK3y28nmm",
    "version": "fldDvg20ewtEjrniW",
    "what_changed": "flduZ8UkPVR9WE18d",
    "system_prompt": "fldfAv8yx5qm2IcBy",
    "purpose": "fldcsXSMnxXCZNCXb",
    "change_reason": "fldEy4G0Mz1417wDg",
    "change_source": "fldx2PG3DUZA24wST",
    "active_member": "fldpkuwk9h7oJOHGt",
    "active_minions": "fldtzdMncynCN0eoa",
    "skill_versions": "fldjOtUjHqWFkuTF4",
}
SKILLS_FLD = {
    "skill_name": "fldz3v4xnWrwJtHTg",
    "when_to_use": "fldn1mJwSeW931428",
    "documentation": "fldjhLDOP6gVh9GQW",
    "description": "fld75VHY6E0Zr0xrC",
    "skill_versions": "fldVVfWjiWcgjG86x",
}
SKILL_VERSIONS_FLD = {
    "skill_name": "fldkKBBvdvq1eroco",
    "when_to_use": "fld8IsguINVEyZLlg",
    "version": "fldV91UJWexPlUH5y",
    "what_changed": "fldXzNy92Ydz0Spwx",
    "change_reason": "fldEh3aXTh12qzrog",  # name has leading space
    "change_source": "fldLL07K8ZOaVKJIw",
    "documentation": "fld4YRaMFFfqM7n94",
    "description": "fldSM1eWWdZuWYeKK",
    "skills": "fldcNVX4NnfhcAYL8",
}

def fail(message: str, code: int = 1) -> None:
    print(json.dumps({"success": False, "error": message}), file=sys.stderr)
    sys.exit(code)


def load_dotenv() -> None:
    env_path = REPO_ROOT / ".env"
    if not env_path.is_file():
        return
    for raw_line in env_path.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        key = key.strip()
        value = value.strip().strip('"').strip("'")
        if key and key not in os.environ:
            os.environ[key] = value


def token_for_mode(apply: bool) -> str:
    load_dotenv()
    if apply:
        token = os.environ.get("AIRTABLE_WRITE_TOKEN") or os.environ.get("AIRTABLE_API_KEY")
        if not token:
            fail("AIRTABLE_WRITE_TOKEN not set (--apply requires write token)")
        return token
    token = (
        os.environ.get("AIRTABLE_READ_TOKEN")
        or os.environ.get("AIRTABLE_WRITE_TOKEN")
        or os.environ.get("AIRTABLE_API_KEY")
    )
    if not token:
        fail("AIRTABLE_READ_TOKEN or AIRTABLE_WRITE_TOKEN not set")
    return token


def normalize_text(value: Any) -> str:
    if value is None:
        return ""
    return str(value).strip().replace("\r\n", "\n")


def normalize_link_ids(value: Any) -> list[str]:
    if not value:
        return []
    if isinstance(value, str):
        return [value] if value.startswith("rec") else []
    ids: list[str] = []
    if isinstance(value, list):
        for item in value:
            if isinstance(item, str) and item:
                ids.append(item)
            elif isinstance(item, dict):
                rec_id = item.get("id")
                if rec_id:
                    ids.append(str(rec_id))
    return ids


def normalize_select_names(value: Any) -> list[str]:
    if not value:
        return []
    if isinstance(value, str):
        return [value]
    names: list[str] = []
    if isinstance(value, list):
        for item in value:
            if isinstance(item, str) and item:
                names.append(item)
            elif isinstance(item, dict) and item.get("name"):
                names.append(str(item["name"]))
    return names


def member_field_get(fields: dict[str, Any], key: str) -> Any:
    if key in fields:
        return fields.get(key)
    name = MEMBER_FIELD_NAMES.get(key)
    if name and name in fields:
        return fields.get(name)
    return None


def desired_matches_existing(existing: dict[str, Any], desired: dict[str, Any]) -> bool:
    link_keys = {MEMBERS_FLD["reports_to"], "Reports To"}
    select_keys = {MEMBERS_FLD["runtimes"], "Runtimes"}
    for key, value in desired.items():
        got = member_field_get(existing, key)
        if key in link_keys:
            if normalize_link_ids(got) != normalize_link_ids(value):
                return False
        elif key in select_keys:
            if normalize_select_names(got) != normalize_select_names(value):
                return False
        elif normalize_text(got) != normalize_text(value):
            return False
    return True


def runtimes_from_evidence(source: dict[str, Any] | None) -> list[str] | None:
    """Return Runtimes choice names to write, or None to leave the field.

    Never invent AstraJax Platform.
    """
    if not source:
        return None
    raw = source.get("runtimes")
    if raw is None and "runtime" in source:
        raw = source.get("runtime")
    if raw is None:
        return None
    names = normalize_select_names(raw)
    filtered = [name for name in names if name in ALLOWED_RUNTIME_WRITES]
    return filtered or None


def member_identity_fields(
    *,
    kind: Literal["head", "minion"],
    name: str,
    system_prompt: str,
    purpose: str,
    agent_base_id: str | None,
    parent_member_id: str | None,
    runtimes: list[str] | None,
) -> dict[str, Any]:
    fields: dict[str, Any] = {
        MEMBERS_FLD["agent_name"]: name,
        MEMBERS_FLD["system_prompt"]: system_prompt,
        MEMBERS_FLD["purpose"]: purpose,
        MEMBERS_FLD["kind"]: KIND_LABEL[kind],
    }
    if kind == "head":
        fields[MEMBERS_FLD["agent_base_id"]] = agent_base_id or ""
        fields[MEMBERS_FLD["reports_to"]] = []
    elif parent_member_id:
        fields[MEMBERS_FLD["reports_to"]] = [parent_member_id]
    if runtimes:
        fields[MEMBERS_FLD["runtimes"]] = runtimes
    return fields


def slug_from_filename(path: Path) -> str | None:
    stem = path.stem
    stem = re.sub(r" \(\d+\)$", "", stem)
    match = re.match(r"^agent-(.+?)-v[\d_.]+$", stem, re.IGNORECASE)
    if match:
        return match.group(1).lower()
    if stem.startswith("agent-"):
        return stem[len("agent-") :].lower()
    return None


@dataclass
class AgentEntry:
    slug: str
    kind: Literal["head", "minion"]
    display_name: str
    base_id: str | None = None
    parent_slug: str | None = None


@dataclass
class ExportBundle:
    slug: str
    path: Path
    name: str
    description: str
    system_prompt: str
    skills: list[dict[str, Any]]


@dataclass
class PlannedAction:
    action: str
    target: str
    slug: str
    fields: dict[str, Any] = field(default_factory=dict)
    record_id: str | None = None
    reason: str | None = None


@dataclass
class SyncPlan:
    actions: list[PlannedAction] = field(default_factory=list)
    skipped: list[str] = field(default_factory=list)
    errors: list[str] = field(default_factory=list)

    def add(self, action: PlannedAction) -> None:
        self.actions.append(action)

    def counts(self) -> dict[str, int]:
        tally: dict[str, int] = {}
        for item in self.actions:
            tally[item.action] = tally.get(item.action, 0) + 1
        return tally


class AirtableClient:
    def __init__(self, token: str) -> None:
        self.token = token
        self._table_cache: dict[tuple[str, str], str] = {}

    def request(
        self,
        method: str,
        base_id: str,
        path: str,
        *,
        data: dict[str, Any] | None = None,
        query: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        full_path = path
        if query:
            full_path += "?" + urllib.parse.urlencode(query, doseq=True)
        url = f"https://api.airtable.com/v0/{base_id}/{full_path}"
        headers = {
            "Authorization": f"Bearer {self.token}",
            "Content-Type": "application/json",
        }
        body = json.dumps(data).encode("utf-8") if data is not None else None
        req = urllib.request.Request(url, data=body, headers=headers, method=method)
        try:
            with urllib.request.urlopen(req) as resp:
                raw = resp.read().decode("utf-8")
                return json.loads(raw) if raw else {}
        except urllib.error.HTTPError as exc:
            detail = exc.read().decode("utf-8", errors="replace")
            fail(f"Airtable API error ({exc.code}) {method} {base_id}/{path}: {detail}")

    def meta_tables(self, base_id: str) -> list[dict[str, Any]]:
        url = f"https://api.airtable.com/v0/meta/bases/{base_id}/tables"
        headers = {"Authorization": f"Bearer {self.token}"}
        req = urllib.request.Request(url, headers=headers, method="GET")
        try:
            with urllib.request.urlopen(req) as resp:
                payload = json.loads(resp.read().decode("utf-8"))
        except urllib.error.HTTPError as exc:
            detail = exc.read().decode("utf-8", errors="replace")
            fail(f"Airtable meta API error ({exc.code}) for {base_id}: {detail}")
        return payload.get("tables") or []

    def table_id(self, base_id: str, table_name: str) -> str | None:
        key = (base_id, table_name)
        if key in self._table_cache:
            return self._table_cache[key]
        for table in self.meta_tables(base_id):
            if table.get("name") == table_name:
                table_id = table["id"]
                self._table_cache[key] = table_id
                return table_id
        return None

    def list_records(
        self,
        base_id: str,
        table_id: str,
        *,
        fields: list[str] | None = None,
        formula: str | None = None,
    ) -> list[dict[str, Any]]:
        records: list[dict[str, Any]] = []
        offset: str | None = None
        while True:
            query: dict[str, Any] = {"pageSize": 100}
            if fields:
                query["fields[]"] = fields
            if formula:
                query["filterByFormula"] = formula
            if offset:
                query["offset"] = offset
            page = self.request("GET", base_id, table_id, query=query)
            records.extend(page.get("records") or [])
            offset = page.get("offset")
            if not offset:
                break
        return records

    def create_records(self, base_id: str, table_id: str, rows: list[dict[str, Any]]) -> list[dict[str, Any]]:
        created: list[dict[str, Any]] = []
        for index in range(0, len(rows), 10):
            chunk = rows[index : index + 10]
            payload = {"records": [{"fields": row} for row in chunk]}
            result = self.request("POST", base_id, table_id, data=payload)
            created.extend(result.get("records") or [])
        return created

    def update_records(
        self,
        base_id: str,
        table_id: str,
        rows: list[tuple[str, dict[str, Any]]],
    ) -> list[dict[str, Any]]:
        updated: list[dict[str, Any]] = []
        payload_rows = [{"id": record_id, "fields": fields} for record_id, fields in rows]
        for index in range(0, len(payload_rows), 10):
            chunk = payload_rows[index : index + 10]
            result = self.request("PATCH", base_id, table_id, data={"records": chunk})
            updated.extend(result.get("records") or [])
        return updated


def load_roster(path: Path = ROSTER_PATH) -> tuple[dict[str, Any], dict[str, AgentEntry]]:
    if not path.is_file():
        fail(f"Roster missing: {path}")
    raw = json.loads(path.read_text(encoding="utf-8"))
    agents: dict[str, AgentEntry] = {}
    for slug, entry in raw.get("agents", {}).items():
        agents[slug] = AgentEntry(
            slug=slug,
            kind=entry["kind"],
            display_name=entry.get("display_name") or slug,
            base_id=entry.get("base_id"),
            parent_slug=entry.get("parent_slug"),
        )
    return raw, agents


def resolve_slug(raw_slug: str, roster_raw: dict[str, Any], agents: dict[str, AgentEntry]) -> str | None:
    slug = raw_slug.lower()
    aliases = roster_raw.get("export_aliases") or {}
    slug = aliases.get(slug, slug)
    return slug if slug in agents else None


def load_exports(input_dir: Path, roster_raw: dict[str, Any], agents: dict[str, AgentEntry]) -> list[ExportBundle]:
    if not input_dir.is_dir():
        fail(f"Input directory not found: {input_dir}")

    by_slug: dict[str, ExportBundle] = {}
    for path in sorted(input_dir.glob("*.json")):
        raw_slug = slug_from_filename(path)
        if not raw_slug:
            continue
        slug = resolve_slug(raw_slug, roster_raw, agents)
        if not slug:
            continue
        payload = json.loads(path.read_text(encoding="utf-8"))
        data = payload.get("data") or {}
        bundle = ExportBundle(
            slug=slug,
            path=path,
            name=str(data.get("name") or agents[slug].display_name),
            description=normalize_text(data.get("description")),
            system_prompt=normalize_text(data.get("systemPrompt")),
            skills=list(data.get("skills") or []),
        )
        existing = by_slug.get(slug)
        if existing is None or path.stat().st_mtime >= existing.path.stat().st_mtime:
            by_slug[slug] = bundle
    return list(by_slug.values())


def escape_formula(value: str) -> str:
    return value.replace("\\", "\\\\").replace("'", "\\'")


def eq_formula(field_name: str, value: str) -> str:
    return f"{{{field_name}}}='{escape_formula(value)}'"


def pick_persona_config_row(
    records: list[dict[str, Any]],
    config_name: str,
) -> tuple[dict[str, Any] | None, str | None]:
    matches = [
        row
        for row in records
        if normalize_text((row.get("fields") or {}).get("Config Name")) == config_name
        and normalize_text((row.get("fields") or {}).get("Status")) in ACTIVE_STATUSES
    ]
    approved = [row for row in matches if (row.get("fields") or {}).get("Status") == "Approved"]
    if len(approved) > 1:
        return None, f"multiple Approved Persona Config rows for {config_name!r} — Matthew must clean manually"
    if approved:
        return approved[0], None
    pending = [row for row in matches if (row.get("fields") or {}).get("Status") == "Pending"]
    if len(pending) > 1:
        return None, f"multiple Pending Persona Config rows for {config_name!r} — Matthew must clean manually"
    if pending:
        return pending[0], None
    return None, None


def skill_payload(skill: dict[str, Any], *, register: bool) -> dict[str, Any]:
    documentation = normalize_text(skill.get("documentation") or skill.get("skillMdBody"))
    description = normalize_text(skill.get("description"))
    if register and description and description not in documentation:
        documentation = f"{description}\n\n{documentation}".strip()
    payload: dict[str, Any] = {
        "Skill Name": normalize_text(skill.get("name")),
        "When to Use": normalize_text(skill.get("whenToUse")),
        "Documentation": documentation,
        "Provenance Status": "Pending",
        "Created By": "Agent",
        "Status": "Proposed",
    }
    if not register:
        payload["Description"] = description
    return payload


def plan_household_member(
    client: AirtableClient,
    register_base: str,
    entry: AgentEntry,
    bundle: ExportBundle,
    plan: SyncPlan,
) -> None:
    """Upsert live identity on Household Members for heads and minions."""
    row = find_live_row(client, register_base, HOUSEHOLD_MEMBERS_TABLE, entry.slug)
    parent_id = None
    if entry.kind == "minion" and entry.parent_slug:
        parent_row = find_live_row(client, register_base, HOUSEHOLD_MEMBERS_TABLE, entry.parent_slug)
        parent_id = parent_row["id"] if parent_row else None
    desired = member_identity_fields(
        kind=entry.kind,
        name=bundle.name,
        system_prompt=bundle.system_prompt,
        purpose=bundle.description or "",
        agent_base_id=entry.base_id if entry.kind == "head" else None,
        parent_member_id=parent_id,
        runtimes=None,
    )
    if row:
        fields = row.get("fields") or {}
        if desired_matches_existing(fields, desired):
            plan.add(
                PlannedAction(
                    action="skip",
                    target="household_member",
                    slug=entry.slug,
                    record_id=row["id"],
                    reason="already up to date",
                )
            )
            return
        plan.add(
            PlannedAction(
                action="update",
                target="household_member",
                slug=entry.slug,
                record_id=row["id"],
                fields=desired,
            )
        )
        return
    plan.add(
        PlannedAction(
            action="create",
            target="household_member",
            slug=entry.slug,
            fields={
                MEMBERS_FLD["agent_slug"]: entry.slug,
                **desired,
                MEMBERS_FLD["status"]: "Active",
            },
        )
    )


def plan_persona_config(
    client: AirtableClient,
    entry: AgentEntry,
    bundle: ExportBundle,
    config_name: str,
    plan: SyncPlan,
) -> None:
    if not entry.base_id:
        plan.errors.append(f"{entry.slug}: head missing base_id in roster")
        return
    table_id = client.table_id(entry.base_id, "Persona Config")
    if not table_id:
        plan.errors.append(f"{entry.slug}: Persona Config table missing on {entry.base_id}")
        return
    records = client.list_records(
        entry.base_id,
        table_id,
        fields=["Config Name", "Operational System Prompt", "Rules Section", "Output Format", "Status"],
    )
    desired = {
        "Config Name": config_name,
        "Operational System Prompt": bundle.system_prompt,
        "Rules Section": "",
        "Output Format": "",
        "Status": "Pending",
    }
    existing, error = pick_persona_config_row(records, config_name)
    if error:
        plan.errors.append(f"{entry.slug}: {error}")
        return
    if existing:
        fields = existing.get("fields") or {}
        compare_keys = ["Operational System Prompt", "Rules Section", "Output Format"]
        if all(normalize_text(fields.get(key)) == normalize_text(desired.get(key)) for key in compare_keys):
            plan.add(
                PlannedAction(
                    action="skip",
                    target="persona_config",
                    slug=entry.slug,
                    record_id=existing["id"],
                    reason="already up to date",
                )
            )
            return
        update_fields = {key: desired[key] for key in compare_keys}
        plan.add(
            PlannedAction(
                action="update",
                target="persona_config",
                slug=entry.slug,
                record_id=existing["id"],
                fields=update_fields,
            )
        )
        return
    plan.add(
        PlannedAction(
            action="create",
            target="persona_config",
            slug=entry.slug,
            fields=desired,
        )
    )


def plan_skills_for_table(
    client: AirtableClient,
    *,
    base_id: str,
    table_name: str,
    slug: str,
    skills: list[dict[str, Any]],
    plan: SyncPlan,
    target_label: str,
    register: bool,
) -> None:
    table_id = client.table_id(base_id, table_name)
    if not table_id:
        plan.skipped.append(f"{slug}: no {table_name} table on {base_id}")
        return
    field_names = ["Skill Name", "When to Use", "Documentation", "Status", "Provenance Status"]
    if not register:
        field_names.insert(2, "Description")
    existing_rows = client.list_records(
        base_id,
        table_id,
        fields=field_names,
    )
    by_name = {
        normalize_text((row.get("fields") or {}).get("Skill Name")): row
        for row in existing_rows
        if normalize_text((row.get("fields") or {}).get("Skill Name"))
    }
    compare_keys = ["When to Use", "Documentation"] if register else ["Description", "When to Use", "Documentation"]
    for skill in skills:
        payload = skill_payload(skill, register=register)
        skill_name = payload["Skill Name"]
        if not skill_name:
            continue
        existing = by_name.get(skill_name)
        if existing:
            fields = existing.get("fields") or {}
            if all(normalize_text(fields.get(key)) == normalize_text(payload.get(key)) for key in compare_keys):
                plan.add(
                    PlannedAction(
                        action="skip",
                        target=target_label,
                        slug=slug,
                        record_id=existing["id"],
                        reason=f"skill {skill_name!r} already up to date",
                    )
                )
                continue
            plan.add(
                PlannedAction(
                    action="update",
                    target=target_label,
                    slug=slug,
                    record_id=existing["id"],
                    fields={key: payload[key] for key in compare_keys},
                )
            )
            continue
        plan.add(
            PlannedAction(
                action="create",
                target=target_label,
                slug=slug,
                fields=payload,
            )
        )


def _slugify(value: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-")


def load_verify_pass_payload(path: Path) -> dict[str, Any]:
    if not path.is_file():
        fail(f"Verify-pass payload not found: {path}")
    payload = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(payload, dict):
        fail("Verify-pass payload must be a JSON object")
    kind = normalize_text(payload.get("kind")).lower()
    if kind not in VERIFY_PASS_KINDS:
        fail(f"Verify-pass payload kind must be head|minion|skill (got {kind!r})")
    payload["kind"] = kind
    payload["rolled_back"] = bool(payload.get("rolled_back"))
    phase = normalize_text(payload.get("phase")).lower() or "after"
    if phase not in VERIFY_PASS_PHASES:
        fail(f"Verify-pass payload phase must be before|after (got {phase!r})")
    payload["phase"] = phase
    payload["change_source"] = normalize_text(payload.get("change_source")) or DEFAULT_CHANGE_SOURCE
    payload["change_reason"] = normalize_text(payload.get("change_reason")) or (
        ROLLBACK_CHANGE_REASON if payload["rolled_back"] else DEFAULT_CHANGE_REASON
    )
    payload["version"] = normalize_text(payload.get("version")) or datetime.now(timezone.utc).strftime(
        "%Y%m%dT%H%M%SZ"
    )
    skills = payload.get("skills") or []
    if not isinstance(skills, list):
        fail("Verify-pass payload skills must be an array")
    payload["skills"] = skills

    if kind == "skill":
        if not skills:
            fail("Verify-pass payload kind=skill requires a non-empty skills array")
        first_name = normalize_text((skills[0] or {}).get("name")) if isinstance(skills[0], dict) else ""
        payload["slug"] = normalize_text(payload.get("slug")).lower() or _slugify(first_name)
        if not payload["slug"]:
            fail("Verify-pass payload kind=skill missing slug and skill name")
        payload["what_changed"] = normalize_text(payload.get("what_changed")) or (
            "Skill Forge rollback"
            if payload["rolled_back"]
            else ("Skill Forge before-snapshot" if phase == "before" else "Skill Forge verify pass")
        )
        payload["agent_name"] = normalize_text(payload.get("agent_name")) or payload["slug"]
        payload["purpose"] = normalize_text(payload.get("purpose"))
        payload["system_prompt"] = normalize_text(payload.get("system_prompt"))
        return payload

    for key in ("slug", "system_prompt"):
        if not normalize_text(payload.get(key)):
            fail(f"Verify-pass payload missing required key: {key}")
    payload["slug"] = normalize_text(payload.get("slug")).lower()
    payload["what_changed"] = normalize_text(payload.get("what_changed")) or (
        "Self-Update rollback" if payload["rolled_back"] else "Self-Update verify pass"
    )
    payload["agent_name"] = normalize_text(payload.get("agent_name")) or payload["slug"]
    payload["purpose"] = normalize_text(payload.get("purpose"))
    return payload


def find_live_row(
    client: AirtableClient,
    register_base: str,
    table_id: str,
    slug: str,
) -> dict[str, Any] | None:
    rows = client.list_records(
        register_base,
        table_id,
        formula=eq_formula("Agent Slug", slug),
    )
    return rows[0] if rows else None


def find_skill_row(
    client: AirtableClient,
    register_base: str,
    skill_name: str,
) -> dict[str, Any] | None:
    rows = client.list_records(
        register_base,
        REGISTER_SKILLS_TABLE,
        formula=eq_formula("Skill Name", skill_name),
    )
    return rows[0] if rows else None


def plan_skill_register_writes(
    client: AirtableClient,
    register_base: str,
    payload: dict[str, Any],
    plan: SyncPlan,
    *,
    update_live: bool,
) -> None:
    """Skills + Skill Versions for Self-Update and Skill Forge. Same writer."""
    slug = payload["slug"]
    for skill in payload["skills"]:
        if not isinstance(skill, dict):
            continue
        skill_name = normalize_text(skill.get("name"))
        if not skill_name:
            continue
        skill_desired = {
            SKILLS_FLD["when_to_use"]: normalize_text(skill.get("when_to_use") or skill.get("whenToUse")),
            SKILLS_FLD["documentation"]: normalize_text(
                skill.get("documentation") or skill.get("skillMdBody")
            ),
        }
        description = normalize_text(skill.get("description"))
        if description:
            skill_desired[SKILLS_FLD["description"]] = description
        existing_skill = find_skill_row(client, register_base, skill_name)
        if update_live:
            if existing_skill:
                fields = existing_skill.get("fields") or {}
                compare = {
                    "When to Use": skill_desired[SKILLS_FLD["when_to_use"]],
                    "Documentation": skill_desired[SKILLS_FLD["documentation"]],
                }
                if description:
                    compare["Description"] = description
                if all(normalize_text(fields.get(k)) == normalize_text(v) for k, v in compare.items()):
                    plan.add(
                        PlannedAction(
                            action="skip",
                            target="register_skill",
                            slug=slug,
                            record_id=existing_skill["id"],
                            reason=skill_name,
                        )
                    )
                else:
                    plan.add(
                        PlannedAction(
                            action="update",
                            target="register_skill",
                            slug=slug,
                            record_id=existing_skill["id"],
                            fields=skill_desired,
                            reason=skill_name,
                        )
                    )
            else:
                create_skill = {
                    SKILLS_FLD["skill_name"]: skill_name,
                    **skill_desired,
                    "Provenance Status": "Pending",
                    "Created By": "Agent",
                    "Status": "Proposed",
                }
                plan.add(
                    PlannedAction(
                        action="create",
                        target="register_skill",
                        slug=slug,
                        fields=create_skill,
                        reason=skill_name,
                    )
                )
        elif existing_skill:
            plan.add(
                PlannedAction(
                    action="skip",
                    target="register_skill",
                    slug=slug,
                    record_id=existing_skill["id"],
                    reason=skill_name,
                )
            )

        skill_version_fields = {
            SKILL_VERSIONS_FLD["skill_name"]: skill_name,
            SKILL_VERSIONS_FLD["when_to_use"]: skill_desired[SKILLS_FLD["when_to_use"]],
            SKILL_VERSIONS_FLD["documentation"]: skill_desired[SKILLS_FLD["documentation"]],
            SKILL_VERSIONS_FLD["version"]: normalize_text(skill.get("version")) or payload["version"],
            SKILL_VERSIONS_FLD["what_changed"]: normalize_text(skill.get("what_changed"))
            or payload["what_changed"],
            SKILL_VERSIONS_FLD["change_reason"]: normalize_text(skill.get("change_reason"))
            or payload["change_reason"],
            SKILL_VERSIONS_FLD["change_source"]: normalize_text(skill.get("change_source"))
            or payload["change_source"],
        }
        if description:
            skill_version_fields[SKILL_VERSIONS_FLD["description"]] = description
        plan.add(
            PlannedAction(
                action="create",
                target="skill_version",
                slug=slug,
                fields=skill_version_fields,
                reason=skill_name,
            )
        )


def plan_verify_pass(
    client: AirtableClient,
    roster_raw: dict[str, Any],
    agents: dict[str, AgentEntry],
    payload: dict[str, Any],
) -> SyncPlan:
    """Plan register writes after Cursor verify. Never writes Persona Config."""
    plan = SyncPlan()
    register_base = roster_raw["household_register_base_id"]
    slug = payload["slug"]
    kind = payload["kind"]
    rolled_back = payload["rolled_back"]
    if kind == "skill":
        update_live = (not rolled_back) and payload.get("phase") != "before"
        plan_skill_register_writes(
            client,
            register_base,
            payload,
            plan,
            update_live=update_live,
        )
        if rolled_back:
            plan.skipped.append(f"{slug}: rolled_back — skipped live Skills updates")
        elif payload.get("phase") == "before":
            plan.skipped.append(f"{slug}: phase=before — Skill Versions snapshot only")
        return plan

    roster_entry = agents.get(slug)
    if roster_entry and roster_entry.kind != kind:
        plan.errors.append(f"{slug}: payload kind {kind!r} != roster kind {roster_entry.kind!r}")
        return plan
    if roster_entry and roster_entry.base_id and roster_entry.base_id in set(roster_raw.get("blocked_base_ids") or []):
        plan.errors.append(f"{slug}: blocked base {roster_entry.base_id}")
        return plan

    live_table = HOUSEHOLD_MEMBERS_TABLE
    live_target = "household_member"
    live_row = find_live_row(client, register_base, live_table, slug)

    if not rolled_back:
        parent_id = None
        if kind == "minion":
            parent_slug = None
            if roster_entry and roster_entry.parent_slug:
                parent_slug = roster_entry.parent_slug
            elif payload.get("parent_slug"):
                parent_slug = normalize_text(payload.get("parent_slug")).lower()
            if parent_slug:
                parent_row = find_live_row(client, register_base, live_table, parent_slug)
                parent_id = parent_row["id"] if parent_row else None
        desired = member_identity_fields(
            kind=kind,
            name=payload["agent_name"],
            system_prompt=payload["system_prompt"],
            purpose=payload["purpose"],
            agent_base_id=roster_entry.base_id if roster_entry and kind == "head" else None,
            parent_member_id=parent_id,
            runtimes=runtimes_from_evidence(payload),
        )

        if live_row:
            fields = live_row.get("fields") or {}
            if desired_matches_existing(fields, desired):
                plan.add(
                    PlannedAction(
                        action="skip",
                        target=live_target,
                        slug=slug,
                        record_id=live_row["id"],
                        reason="already up to date",
                    )
                )
            else:
                plan.add(
                    PlannedAction(
                        action="update",
                        target=live_target,
                        slug=slug,
                        record_id=live_row["id"],
                        fields=desired,
                    )
                )
        else:
            create_fields = {
                MEMBERS_FLD["agent_slug"]: slug,
                **desired,
                MEMBERS_FLD["status"]: "Active",
            }
            plan.add(
                PlannedAction(
                    action="create",
                    target=live_target,
                    slug=slug,
                    fields=create_fields,
                )
            )

        plan_skill_register_writes(
            client,
            register_base,
            payload,
            plan,
            update_live=True,
        )
    elif payload["skills"]:
        plan_skill_register_writes(
            client,
            register_base,
            payload,
            plan,
            update_live=False,
        )

    # Always append Household Versions (pass or rollback log).
    version_fields = {
        VERSIONS_FLD["agent_slug"]: slug,
        VERSIONS_FLD["agent_name"]: payload["agent_name"],
        VERSIONS_FLD["version"]: payload["version"],
        VERSIONS_FLD["what_changed"]: payload["what_changed"],
        VERSIONS_FLD["system_prompt"]: payload["system_prompt"],
        VERSIONS_FLD["purpose"]: payload["purpose"],
        VERSIONS_FLD["change_reason"]: payload["change_reason"],
        VERSIONS_FLD["change_source"]: payload["change_source"],
    }
    if live_row:
        version_fields[VERSIONS_FLD["active_member"]] = [live_row["id"]]
    plan.add(
        PlannedAction(
            action="create",
            target="household_version",
            slug=slug,
            fields=version_fields,
        )
    )

    if rolled_back:
        plan.skipped.append(f"{slug}: rolled_back — skipped live Members / Skills updates")

    return plan


def build_plan(
    client: AirtableClient,
    roster_raw: dict[str, Any],
    agents: dict[str, AgentEntry],
    exports: list[ExportBundle],
    *,
    config_name: str,
    allow_create_bases: bool,
) -> SyncPlan:
    plan = SyncPlan()
    register_base = roster_raw["household_register_base_id"]
    blocked = set(roster_raw.get("blocked_base_ids") or [])

    for bundle in exports:
        entry = agents[bundle.slug]
        if entry.base_id and entry.base_id in blocked:
            plan.errors.append(f"{entry.slug}: blocked base {entry.base_id}")
            continue

        if entry.kind == "minion":
            if entry.base_id and not allow_create_bases:
                plan.add(
                    PlannedAction(
                        action="refuse",
                        target="agent_base",
                        slug=entry.slug,
                        reason="minion must not have Agent base writes",
                    )
                )
            plan_household_member(client, register_base, entry, bundle, plan)
            plan_skills_for_table(
                client,
                base_id=register_base,
                table_name="Skills",
                slug=entry.slug,
                skills=bundle.skills,
                plan=plan,
                target_label="register_skill",
                register=True,
            )
            continue

        if not entry.base_id:
            plan.errors.append(f"{entry.slug}: head missing base_id")
            continue

        plan_household_member(client, register_base, entry, bundle, plan)
        plan_persona_config(client, entry, bundle, config_name, plan)
        plan_skills_for_table(
            client,
            base_id=entry.base_id,
            table_name="Skills",
            slug=entry.slug,
            skills=bundle.skills,
            plan=plan,
            target_label="agent_skill",
            register=False,
        )

        if allow_create_bases:
            plan.skipped.append(
                f"{entry.slug}: --allow-create-bases ignored for existing head base {entry.base_id}"
            )

    return plan


def apply_plan(
    client: AirtableClient,
    roster_raw: dict[str, Any],
    agents: dict[str, AgentEntry],
    plan: SyncPlan,
) -> dict[str, Any]:
    register_base = roster_raw["household_register_base_id"]
    reversal: dict[str, Any] = {
        "run_at": datetime.now(timezone.utc).isoformat(),
        "created": [],
        "updated": [],
        "skipped": [],
        "refused": [],
        "errors": list(plan.errors),
    }

    table_ids: dict[tuple[str, str], str] = {
        (register_base, "Household Members"): HOUSEHOLD_MEMBERS_TABLE,
        (register_base, "Household Versions"): HOUSEHOLD_VERSIONS_TABLE,
        (register_base, "Skills"): REGISTER_SKILLS_TABLE,
        (register_base, "Skill Versions"): SKILL_VERSIONS_TABLE,
    }

    def tid(base_id: str, table_name: str) -> str:
        key = (base_id, table_name)
        if key not in table_ids:
            resolved = client.table_id(base_id, table_name)
            if not resolved:
                fail(f"Table {table_name!r} missing on base {base_id}")
            table_ids[key] = resolved
        return table_ids[key]

    # Skill name → live Skills record id (for Skill Versions link).
    skill_ids_by_name: dict[str, str] = {}
    created_skill_version_ids: list[str] = []
    # slug → Members record id so Versions can link newly created live rows.
    live_ids_by_slug: dict[str, str] = {}

    # First pass: live rows + skills (so version links can resolve).
    deferred_versions: list[PlannedAction] = []
    deferred_skill_versions: list[PlannedAction] = []

    def remember_live(item: PlannedAction, record_id: str | None) -> None:
        if record_id and item.target == "household_member":
            live_ids_by_slug[item.slug] = record_id

    for item in plan.actions:
        if item.target == "household_minion":
            reversal["refused"].append(
                {
                    "target": item.target,
                    "slug": item.slug,
                    "reason": "leftover Household Minions table — identity writes go to Household Members",
                }
            )
            continue
        if item.action == "skip":
            reversal["skipped"].append(
                {"target": item.target, "slug": item.slug, "record_id": item.record_id, "reason": item.reason}
            )
            remember_live(item, item.record_id)
            if item.target == "register_skill" and item.record_id:
                name = normalize_text(item.reason or "")
                if name:
                    skill_ids_by_name[name] = item.record_id
            continue
        if item.action == "refuse":
            reversal["refused"].append({"target": item.target, "slug": item.slug, "reason": item.reason})
            continue
        if item.target == "household_version":
            deferred_versions.append(item)
            continue
        if item.target == "skill_version":
            deferred_skill_versions.append(item)
            continue

        if item.target == "household_member":
            table = tid(register_base, "Household Members")
            base = register_base
            if table == HOUSEHOLD_MINIONS_TABLE:
                reversal["refused"].append(
                    {
                        "target": item.target,
                        "slug": item.slug,
                        "reason": "refusing leftover Household Minions table write",
                    }
                )
                continue
        elif item.target == "register_skill":
            table = tid(register_base, "Skills")
            base = register_base
        elif item.target == "persona_config":
            entry = agents[item.slug]
            base = entry.base_id or fail(f"{item.slug}: missing base_id")
            table = tid(base, "Persona Config")
        elif item.target == "agent_skill":
            entry = agents[item.slug]
            base = entry.base_id or fail(f"{item.slug}: missing base_id")
            table = tid(base, "Skills")
        else:
            fail(f"Unknown target {item.target}")

        if item.action == "create":
            created = client.create_records(base, table, [item.fields])
            for row in created:
                reversal["created"].append(
                    {"target": item.target, "slug": item.slug, "base_id": base, "record_id": row["id"], "fields": item.fields}
                )
                remember_live(item, row["id"])
                if item.target == "register_skill":
                    name = normalize_text(
                        item.fields.get(SKILLS_FLD["skill_name"]) or item.fields.get("Skill Name")
                    )
                    if name:
                        skill_ids_by_name[name] = row["id"]
        elif item.action == "update":
            if not item.record_id:
                fail(f"Update missing record_id for {item.slug}/{item.target}")
            client.update_records(base, table, [(item.record_id, item.fields)])
            reversal["updated"].append(
                {
                    "target": item.target,
                    "slug": item.slug,
                    "base_id": base,
                    "record_id": item.record_id,
                    "fields": item.fields,
                }
            )
            remember_live(item, item.record_id)
            if item.target == "register_skill" and item.record_id:
                name = normalize_text(item.reason or "")
                if name:
                    skill_ids_by_name[name] = item.record_id
        else:
            fail(f"Unknown action {item.action}")

    # Skill Versions (append-only), then link from live Skills and Household Versions.
    skill_versions_table = tid(register_base, "Skill Versions")
    new_version_ids_by_skill: dict[str, list[str]] = {}
    for item in deferred_skill_versions:
        fields = dict(item.fields)
        skill_name = normalize_text(item.reason) or normalize_text(fields.get(SKILL_VERSIONS_FLD["skill_name"]))
        skill_id = skill_ids_by_name.get(skill_name)
        if not skill_id and skill_name:
            existing = find_skill_row(client, register_base, skill_name)
            if existing:
                skill_id = existing["id"]
                skill_ids_by_name[skill_name] = skill_id
        if skill_id:
            fields[SKILL_VERSIONS_FLD["skills"]] = [skill_id]
        created = client.create_records(register_base, skill_versions_table, [fields])
        for row in created:
            created_skill_version_ids.append(row["id"])
            if skill_name:
                new_version_ids_by_skill.setdefault(skill_name, []).append(row["id"])
            reversal["created"].append(
                {
                    "target": item.target,
                    "slug": item.slug,
                    "base_id": register_base,
                    "record_id": row["id"],
                    "fields": fields,
                }
            )

    skills_table = tid(register_base, "Skills")
    for skill_name, version_ids in new_version_ids_by_skill.items():
        skill_id = skill_ids_by_name.get(skill_name)
        if not skill_id:
            continue
        existing = find_skill_row(client, register_base, skill_name)
        raw_links = []
        if existing:
            fields = existing.get("fields") or {}
            raw_links = fields.get("Skill Versions") or fields.get(SKILLS_FLD["skill_versions"]) or []
        existing_ids = [
            link if isinstance(link, str) else str((link or {}).get("id") or "")
            for link in raw_links
        ]
        merged = [item for item in list(dict.fromkeys([*existing_ids, *version_ids])) if item]
        client.update_records(
            register_base,
            skills_table,
            [(skill_id, {SKILLS_FLD["skill_versions"]: merged})],
        )
        reversal["updated"].append(
            {
                "target": "register_skill_versions_link",
                "slug": skill_name,
                "base_id": register_base,
                "record_id": skill_id,
                "fields": {SKILLS_FLD["skill_versions"]: merged},
            }
        )

    versions_table = tid(register_base, "Household Versions")
    for item in deferred_versions:
        fields = dict(item.fields)
        fields.pop(VERSIONS_FLD["active_minions"], None)
        if created_skill_version_ids:
            fields[VERSIONS_FLD["skill_versions"]] = list(created_skill_version_ids)
        if VERSIONS_FLD["active_member"] not in fields:
            live_id = live_ids_by_slug.get(item.slug)
            if live_id:
                fields[VERSIONS_FLD["active_member"]] = [live_id]
        created = client.create_records(register_base, versions_table, [fields])
        for row in created:
            reversal["created"].append(
                {
                    "target": item.target,
                    "slug": item.slug,
                    "base_id": register_base,
                    "record_id": row["id"],
                    "fields": fields,
                }
            )

    return reversal


def write_reversal_log(payload: dict[str, Any]) -> Path:
    REVERSAL_DIR.mkdir(parents=True, exist_ok=True)
    stamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    path = REVERSAL_DIR / f"fleet_sync_reversal_{stamp}.json"
    text = json.dumps(payload, indent=2, ensure_ascii=False) + "\n"
    path.write_text(text, encoding="utf-8")
    read_back = path.read_text(encoding="utf-8")
    if read_back != text:
        fail(f"Reversal log verify failed: {path}")
    if not path.is_file() or path.stat().st_size == 0:
        fail(f"Reversal log missing after write: {path}")
    return path


def print_plan_summary(plan: SyncPlan, *, apply: bool) -> None:
    counts = plan.counts()
    mode = "APPLY" if apply else "DRY-RUN"
    print(f"=== Fleet sync {mode} ===")
    print(json.dumps({"action_counts": counts, "skipped_notes": plan.skipped, "errors": plan.errors}, indent=2))
    for item in plan.actions:
        if item.action in {"create", "update", "refuse"}:
            print(
                json.dumps(
                    {
                        "action": item.action,
                        "target": item.target,
                        "slug": item.slug,
                        "record_id": item.record_id,
                        "fields": list(item.fields.keys()),
                        "reason": item.reason,
                    }
                )
            )


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--input-dir",
        type=Path,
        help="Directory of HyperAgent agent export JSON files",
    )
    parser.add_argument(
        "--verify-pass-payload",
        type=Path,
        help="Self-Update Executor verify-pass JSON (register write after Cursor verify)",
    )
    parser.add_argument(
        "--roster",
        type=Path,
        default=ROSTER_PATH,
        help="Head/Minion roster JSON (default: fleet_sync_roster.json)",
    )
    parser.add_argument(
        "--config-name",
        default=DEFAULT_CONFIG_NAME,
        help=f"Stable Persona Config label (default: {DEFAULT_CONFIG_NAME})",
    )
    parser.add_argument(
        "--apply",
        action="store_true",
        help="Write to Airtable (default: dry-run plan only)",
    )
    parser.add_argument(
        "--allow-create-bases",
        action="store_true",
        help="Reserved: only for explicit Head base creation (not used for minions)",
    )
    args = parser.parse_args()
    if bool(args.input_dir) == bool(args.verify_pass_payload):
        fail("Provide exactly one of --input-dir or --verify-pass-payload")
    return args


def main() -> None:
    args = parse_args()
    roster_raw, agents = load_roster(args.roster)
    client = AirtableClient(token_for_mode(args.apply))

    if args.verify_pass_payload:
        payload = load_verify_pass_payload(args.verify_pass_payload.expanduser())
        plan = plan_verify_pass(client, roster_raw, agents, payload)
        print_plan_summary(plan, apply=args.apply)
        if plan.errors:
            fail("Plan has blocking errors — fix before apply")
        if not args.apply:
            print(
                json.dumps(
                    {
                        "success": True,
                        "mode": "dry-run",
                        "path": "verify-pass",
                        "slug": payload["slug"],
                        "rolled_back": payload["rolled_back"],
                    },
                    indent=2,
                )
            )
            return
        reversal = apply_plan(client, roster_raw, agents, plan)
        log_path = write_reversal_log(reversal)
        print(
            json.dumps(
                {
                    "success": True,
                    "mode": "apply",
                    "path": "verify-pass",
                    "reversal_log": str(log_path.relative_to(REPO_ROOT)),
                },
                indent=2,
            )
        )
        return

    exports = load_exports(args.input_dir.expanduser(), roster_raw, agents)
    if not exports:
        fail(f"No roster-matched exports found in {args.input_dir}")

    plan = build_plan(
        client,
        roster_raw,
        agents,
        exports,
        config_name=args.config_name,
        allow_create_bases=args.allow_create_bases,
    )

    print_plan_summary(plan, apply=args.apply)

    if plan.errors:
        fail("Plan has blocking errors — fix before apply")

    if not args.apply:
        print(json.dumps({"success": True, "mode": "dry-run", "exports_matched": len(exports)}, indent=2))
        return

    reversal = apply_plan(client, roster_raw, agents, plan)
    log_path = write_reversal_log(reversal)
    print(json.dumps({"success": True, "mode": "apply", "reversal_log": str(log_path.relative_to(REPO_ROOT))}, indent=2))


if __name__ == "__main__":
    main()
