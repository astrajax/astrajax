#!/usr/bin/env python3
"""Idempotent HyperAgent export → Airtable fleet sync writer.

Reads agent export JSONs (HyperAgent Downloads shape), upserts Household Register
rows and existing Head Agent bases only. Minions never get Agent bases.

Default is dry-run. Pass --apply to write. Every apply run writes a reversal log JSON
under docs/initiatives/fleet-sync-2026-08-10/ and verifies it on disk.

Usage:
  python3 hyperagent/scripts/sync_hyperagent_fleet_to_airtable.py \\
    --input-dir hyperagent/exports/agents

  python3 hyperagent/scripts/sync_hyperagent_fleet_to_airtable.py \\
    --input-dir ~/Downloads --apply

Env: AIRTABLE_READ_TOKEN (dry-run reads), AIRTABLE_WRITE_TOKEN (--apply writes).
Roster: hyperagent/scripts/fleet_sync_roster.json (Head/Minion classification).

FREEZE (2026-08-11): do not run live fleet sync until this script passes smoke tests.
See docs/initiatives/fleet-sync-2026-08-10/README.md.
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
HOUSEHOLD_MINIONS_TABLE = "tbl6aVm9rgWoOBVfd"
REGISTER_SKILLS_TABLE = "tblAIXtDBBMrLuEYc"

DEFAULT_CONFIG_NAME = "Operational v1.0 (HyperAgent sync)"
ACTIVE_STATUSES = {"Approved", "Pending"}


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
    formula = eq_formula("Agent Slug", entry.slug)
    rows = client.list_records(
        register_base,
        HOUSEHOLD_MEMBERS_TABLE,
        fields=["Agent Slug", "Agent Name", "System Prompt", "Purpose", "Agent Base ID", "Status"],
        formula=formula,
    )
    desired = {
        "Agent Name": bundle.name,
        "System Prompt": bundle.system_prompt,
        "Purpose": bundle.description,
        "Agent Base ID": entry.base_id or "",
    }
    if rows:
        row = rows[0]
        fields = row.get("fields") or {}
        if all(normalize_text(fields.get(key)) == normalize_text(value) for key, value in desired.items()):
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
            fields={"Agent Slug": entry.slug, **desired, "Status": "Active"},
        )
    )


def plan_household_minion(
    client: AirtableClient,
    register_base: str,
    entry: AgentEntry,
    bundle: ExportBundle,
    plan: SyncPlan,
) -> None:
    formula = eq_formula("Agent Slug", entry.slug)
    rows = client.list_records(
        register_base,
        HOUSEHOLD_MINIONS_TABLE,
        fields=["Agent Slug", "Agent Name", "Purpose", "Status"],
        formula=formula,
    )
    purpose = bundle.system_prompt or bundle.description
    desired = {"Agent Name": bundle.name, "Purpose": purpose}
    if rows:
        row = rows[0]
        fields = row.get("fields") or {}
        if all(normalize_text(fields.get(key)) == normalize_text(value) for key, value in desired.items()):
            plan.add(
                PlannedAction(
                    action="skip",
                    target="household_minion",
                    slug=entry.slug,
                    record_id=row["id"],
                    reason="already up to date",
                )
            )
            return
        plan.add(
            PlannedAction(
                action="update",
                target="household_minion",
                slug=entry.slug,
                record_id=row["id"],
                fields=desired,
            )
        )
        return
    plan.add(
        PlannedAction(
            action="create",
            target="household_minion",
            slug=entry.slug,
            fields={"Agent Slug": entry.slug, **desired, "Status": "Active"},
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
            plan_household_minion(client, register_base, entry, bundle, plan)
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

    table_ids: dict[tuple[str, str], str] = {}

    def tid(base_id: str, table_name: str) -> str:
        key = (base_id, table_name)
        if key not in table_ids:
            resolved = client.table_id(base_id, table_name)
            if not resolved:
                fail(f"Table {table_name!r} missing on base {base_id}")
            table_ids[key] = resolved
        return table_ids[key]

    for item in plan.actions:
        if item.action == "skip":
            reversal["skipped"].append(
                {"target": item.target, "slug": item.slug, "record_id": item.record_id, "reason": item.reason}
            )
            continue
        if item.action == "refuse":
            reversal["refused"].append({"target": item.target, "slug": item.slug, "reason": item.reason})
            continue

        if item.target == "household_member":
            table = tid(register_base, "Household Members")
            base = register_base
        elif item.target == "household_minion":
            table = tid(register_base, "Household Minions")
            base = register_base
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
        else:
            fail(f"Unknown action {item.action}")

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
        required=True,
        help="Directory of HyperAgent agent export JSON files",
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
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    roster_raw, agents = load_roster(args.roster)
    exports = load_exports(args.input_dir.expanduser(), roster_raw, agents)
    if not exports:
        fail(f"No roster-matched exports found in {args.input_dir}")

    client = AirtableClient(token_for_mode(args.apply))
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
