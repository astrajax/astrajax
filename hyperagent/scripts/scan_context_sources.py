#!/usr/bin/env python3
"""Scan approved local sources and AstraJax Airtable for context candidates."""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import re
import sys
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

REPO_ROOT = Path(__file__).resolve().parents[2]
CONFIG_PATH = REPO_ROOT / "hyperagent" / "config" / "scanner_sources_v0_2.json"
SCHEMA_PATH = REPO_ROOT / "hyperagent" / "context_architecture_schema_v1.json"
ENV_PATH = REPO_ROOT / ".env"
BASE_ID = "appYv601Oq7fKTCj0"
INTAKE_TABLE_ID = "tblJCmPGPUyszgFux"
ITEMS_TABLE_ID = "tblisiZJQmQuBqEef"

TEXT_TYPES = {"singleLineText", "multilineText", "richText", "url"}
CONTEXT_KEYWORDS = {
    "agent",
    "approval",
    "architecture",
    "boundary",
    "canonical",
    "context",
    "decision",
    "definition",
    "guardrail",
    "instruction",
    "owner",
    "policy",
    "prompt",
    "rule",
    "schema",
    "source of truth",
    "workflow",
}
SECRET_RE = re.compile(
    r"(api[_-]?key|secret|token|password|private[_-]?key|bearer\s+[a-z0-9._-]{20,})",
    re.I,
)
EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


def fail(message: str, code: int = 1) -> None:
    print(json.dumps({"success": False, "error": message}, ensure_ascii=False))
    sys.exit(code)


def now_batch_id() -> str:
    return "scanner-" + datetime.now(timezone.utc).strftime("%Y%m%d-%H%M%S")


def load_dotenv() -> None:
    if not ENV_PATH.exists():
        return
    for raw_line in ENV_PATH.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        key = key.strip()
        value = value.strip().strip('"').strip("'")
        if key and key not in os.environ:
            os.environ[key] = value


def token_for(role: str) -> str:
    load_dotenv()
    if role == "read":
        token = os.environ.get("AIRTABLE_READ_TOKEN") or os.environ.get("AIRTABLE_API_KEY")
        if not token:
            fail("AIRTABLE_READ_TOKEN not set")
        return token
    token = os.environ.get("AIRTABLE_WRITE_TOKEN") or os.environ.get("AIRTABLE_API_KEY")
    if not token:
        fail("AIRTABLE_WRITE_TOKEN not set")
    return token


def airtable_request(
    method: str,
    table_or_path: str,
    *,
    query: dict[str, Any] | None = None,
    data: dict[str, Any] | None = None,
    role: str = "read",
) -> dict[str, Any]:
    path = table_or_path
    if query:
        items: list[tuple[str, str]] = []
        for key, value in query.items():
            if isinstance(value, list):
                items.extend((key, str(item)) for item in value)
            else:
                items.append((key, str(value)))
        path += "?" + urllib.parse.urlencode(items)
    url = f"https://api.airtable.com/v0/{BASE_ID}/{path}"
    body = json.dumps(data).encode("utf-8") if data is not None else None
    req = urllib.request.Request(
        url,
        data=body,
        headers={
            "Authorization": f"Bearer {token_for(role)}",
            "Content-Type": "application/json",
        },
        method=method,
    )
    try:
        with urllib.request.urlopen(req) as resp:
            raw = resp.read().decode("utf-8")
            return json.loads(raw) if raw else {}
    except urllib.error.HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="replace")
        fail(f"Airtable API error ({exc.code}): {detail}")


def load_config() -> dict[str, Any]:
    if not CONFIG_PATH.exists():
        fail(f"Missing scanner config: {CONFIG_PATH}")
    config = json.loads(CONFIG_PATH.read_text(encoding="utf-8"))
    base_id = config.get("airtable", {}).get("base_id")
    if base_id != BASE_ID:
        fail(f"Blocked Airtable base: {base_id}. Scanner may only read {BASE_ID}")
    return config


def load_schema() -> dict[str, Any]:
    if not SCHEMA_PATH.exists():
        fail(f"Missing schema: {SCHEMA_PATH}")
    return json.loads(SCHEMA_PATH.read_text(encoding="utf-8"))


def sha256(text: str) -> str:
    return hashlib.sha256(text.encode("utf-8", errors="replace")).hexdigest()


def normalise(text: str) -> str:
    return re.sub(r"[^a-z0-9]+", " ", (text or "").lower()).strip()


def excerpt(text: str, limit: int = 900) -> str:
    clean = re.sub(r"\s+", " ", text or "").strip()
    return clean[:limit]


def looks_secret(text: str) -> bool:
    return bool(SECRET_RE.search(text or ""))


def text_score(text: str) -> int:
    """Light relevance signal for the analyst. NOT a create gate."""
    haystack = (text or "").lower()
    return sum(1 for keyword in CONTEXT_KEYWORDS if keyword in haystack)


# NOTE (v0.3): This script is a GATHER tool, not a decision-maker. It collects
# candidate material (prose and Airtable long-text) and hands it to the analyst
# (the Cursor agent). It deliberately does NOT classify, score-to-create, or
# fabricate Context Intake payloads. The analyst reads the material, judges
# whether it carries a durable, business-relevant claim, and only then writes a
# claim + reason for create_scanner_context_intake.py. Surfacing nothing is a
# valid outcome.


def read_intake_index(max_records: int) -> tuple[set[str], set[str], set[str], set[str]]:
    query = {
        "maxRecords": max_records,
        "fields[]": ["Title", "Raw Submission", "Source Link", "Reasoning"],
    }
    data = airtable_request("GET", INTAKE_TABLE_ID, query=query)
    titles: set[str] = set()
    source_links: set[str] = set()
    fingerprints: set[str] = set()
    content_hashes: set[str] = set()
    for record in data.get("records", []):
        fields = record.get("fields", {})
        title = fields.get("Title") or ""
        raw = fields.get("Raw Submission") or ""
        link = fields.get("Source Link") or ""
        reasoning = fields.get("Reasoning") or ""
        if title:
            titles.add(normalise(title))
        if link:
            source_links.add(link)
        if raw:
            content_hashes.add(sha256(excerpt(raw, 1000)))
        for match in re.findall(r"source_fingerprint=([a-f0-9]{64})", reasoning):
            fingerprints.add(match)
    return titles, source_links, fingerprints, content_hashes


def read_item_index(max_records: int) -> tuple[set[str], set[str]]:
    query = {
        "maxRecords": max_records,
        "fields[]": ["Title", "Canonical Text", "Source Notes"],
    }
    data = airtable_request("GET", ITEMS_TABLE_ID, query=query)
    titles: set[str] = set()
    hashes: set[str] = set()
    for record in data.get("records", []):
        fields = record.get("fields", {})
        title = fields.get("Title") or ""
        body = "\n".join(str(fields.get(name) or "") for name in ("Canonical Text", "Source Notes"))
        if title:
            titles.add(normalise(title))
        if body.strip():
            hashes.add(sha256(excerpt(body, 1000)))
    return titles, hashes


def dedupe(material: dict[str, Any], index: dict[str, set[str]]) -> tuple[str, str]:
    title_key = normalise(material.get("title_hint") or "")
    content_hash = material["content_hash"]
    fingerprint = material["source_fingerprint"]
    source_link = material.get("source_link") or ""
    if fingerprint in index["fingerprints"]:
        return "duplicate_intake", "source fingerprint already exists in Context Intake"
    if source_link and source_link in index["source_links"]:
        return "duplicate_intake", "source link already exists in Context Intake"
    if title_key and title_key in index["intake_titles"]:
        return "duplicate_intake", "title already exists in Context Intake"
    if title_key and title_key in index["item_titles"]:
        return "duplicate_item", "title already exists in Context Items"
    if content_hash in index["intake_hashes"] or content_hash in index["item_hashes"]:
        return "duplicate_content", "content hash already exists"
    return "new", ""


# Minimum prose length worth handing to the analyst (chars after whitespace squash).
MIN_MATERIAL_CHARS = 200


def material_from_text(
    source_type: str,
    source_label: str,
    title_hint: str,
    text: str,
    link: str,
) -> dict[str, Any] | None:
    """Build a unit of candidate material for the analyst to judge.

    This never decides worthiness. It only collects readable, non-secret prose
    with enough substance to be worth a human-grade read, plus the metadata the
    analyst and dedupe step need. The analyst writes any claim and reason later.
    """
    clean = excerpt(text, 2000)
    if not clean or looks_secret(clean):
        return None
    # Airtable records can be short but meaningful; local prose must clear a floor.
    if source_type != "airtable" and len(clean) < MIN_MATERIAL_CHARS:
        return None
    fingerprint = sha256(f"{source_type}|{source_label}|{clean[:900]}")
    return {
        "source_type": source_type,
        "source_label": source_label,
        "source_link": link,
        "source_fingerprint": fingerprint,
        "content_hash": sha256(clean[:900]),
        "title_hint": title_hint,
        "keyword_hits": text_score(clean),
        "excerpt": clean,
    }


def path_allowed(path: Path, root: Path, config: dict[str, Any]) -> bool:
    local = config["local_sources"]
    rel = path.relative_to(root)
    if any(part in set(local["exclude_dirs"]) for part in rel.parts):
        return False
    if path.name in set(local["exclude_files"]):
        return False
    if path.suffix.lower() not in set(local["include_extensions"]):
        return False
    try:
        if path.stat().st_size > int(local["max_file_bytes"]):
            return False
    except OSError:
        return False
    return True


def scan_local(config: dict[str, Any]) -> tuple[list[dict[str, Any]], dict[str, Any]]:
    material: list[dict[str, Any]] = []
    scanned = 0
    blocked = 0
    max_files = int(config["local_sources"]["max_files_per_run"])
    max_material = int(config["local_sources"]["max_material_per_run"])
    for root_text in config["local_sources"]["roots"]:
        root = Path(root_text).expanduser()
        if not root.exists():
            blocked += 1
            continue
        for path in root.rglob("*"):
            if scanned >= max_files or len(material) >= max_material:
                break
            if not path.is_file() or not path_allowed(path, root, config):
                continue
            try:
                text = path.read_text(encoding="utf-8", errors="replace")
            except OSError:
                blocked += 1
                continue
            scanned += 1
            unit = material_from_text(
                "local",
                str(path),
                path.stem,
                text,
                f"file://{path}",
            )
            if unit:
                material.append(unit)
        if scanned >= max_files or len(material) >= max_material:
            break
    return material, {"files_scanned": scanned, "local_blocked": blocked}


def airtable_meta_tables() -> list[dict[str, Any]]:
    """List live tables in the AstraJax base via the Airtable Meta API."""
    url = f"https://api.airtable.com/v0/meta/bases/{BASE_ID}/tables"
    req = urllib.request.Request(
        url,
        headers={"Authorization": f"Bearer {token_for('read')}"},
        method="GET",
    )
    try:
        with urllib.request.urlopen(req) as resp:
            raw = resp.read().decode("utf-8")
            data = json.loads(raw) if raw else {}
    except urllib.error.HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="replace")
        fail(f"Airtable Meta API error ({exc.code}): {detail}")
    return data.get("tables", [])


def airtable_text_fields(fields: list[dict[str, Any]]) -> list[str]:
    out: list[str] = []
    for field in fields:
        name = field.get("name", "")
        ftype = field.get("type")
        lower = name.lower()
        if ftype not in TEXT_TYPES:
            continue
        if any(word in lower for word in ("email", "phone", "postcode", "address", "password", "token")):
            continue
        out.append(name)
    return out[:12]


def scan_airtable(config: dict[str, Any]) -> tuple[list[dict[str, Any]], dict[str, Any]]:
    airtable_config = config["airtable"]
    if airtable_config.get("base_id") in airtable_config.get("excluded_base_ids", {}):
        fail(f"Blocked Airtable base: {airtable_config['base_id']}")
    excluded_tables = set(airtable_config["source_excluded_tables"])
    tables = airtable_meta_tables()
    material: list[dict[str, Any]] = []
    tables_total = len(tables)
    tables_scanned = 0
    records_scanned = 0
    max_material = int(airtable_config["max_material_per_run"])
    for table in tables:
        if len(material) >= max_material:
            break
        table_name = table.get("name", "")
        table_id = table.get("id", "")
        if not table_id or table_name in excluded_tables:
            continue
        field_names = airtable_text_fields(table.get("fields") or [])
        if table_name == "Emails":
            field_names.extend(["Email Category", "AI Summary", "Body Excerpt", "Subject", "From"])
        field_names = list(dict.fromkeys(field_names))
        if not field_names:
            continue
        query = {
            "maxRecords": airtable_config["max_records_per_table"],
            "fields[]": field_names,
        }
        data = airtable_request("GET", table_id, query=query)
        tables_scanned += 1
        for record in data.get("records", []):
            if len(material) >= max_material:
                break
            fields = record.get("fields", {})
            if table_name == "Emails" and fields.get("Email Category") in set(airtable_config["exclude_email_categories"]):
                continue
            text_parts: list[str] = []
            for field in field_names:
                value = fields.get(field)
                if value in (None, "", [], {}):
                    continue
                if isinstance(value, str) and EMAIL_RE.match(value.strip()):
                    continue
                text_parts.append(f"{field}: {value}")
            if not text_parts:
                continue
            records_scanned += 1
            label = f"Airtable {table_name}/{record['id']}"
            title_value = str(fields.get("Title") or fields.get("Name") or fields.get("Subject") or record["id"])
            unit = material_from_text(
                "airtable",
                label,
                title_value,
                "\n".join(text_parts),
                f"https://airtable.com/{BASE_ID}/{table_id}/{record['id']}",
            )
            if unit:
                material.append(unit)
    return material, {
        "airtable_tables_total": tables_total,
        "airtable_tables_scanned": tables_scanned,
        "airtable_records_scanned": records_scanned,
    }


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Gather candidate material for the Clive Context Scanner analyst. Never writes."
    )
    parser.add_argument("--dry-run", action="store_true", help="Accepted for compatibility. This script only ever reads.")
    parser.add_argument("--json-only", action="store_true", help="Emit JSON without indentation")
    parser.add_argument("--max-existing", type=int, default=500)
    args = parser.parse_args()

    config = load_config()
    batch_id = now_batch_id()
    intake_titles, source_links, fingerprints, intake_hashes = read_intake_index(args.max_existing)
    item_titles, item_hashes = read_item_index(args.max_existing)
    index = {
        "intake_titles": intake_titles,
        "source_links": source_links,
        "fingerprints": fingerprints,
        "intake_hashes": intake_hashes,
        "item_titles": item_titles,
        "item_hashes": item_hashes,
    }

    local_material, local_stats = scan_local(config)
    airtable_material, airtable_stats = scan_airtable(config)
    all_material = local_material + airtable_material

    fresh: list[dict[str, Any]] = []
    for unit in all_material:
        verdict, reason = dedupe(unit, index)
        unit["dedup"] = verdict
        unit["dedup_reason"] = reason
        unit["batch_id"] = batch_id
        if verdict == "new":
            fresh.append(unit)

    new_count = len(fresh)
    result = {
        "success": True,
        "batch_id": batch_id,
        "mode": "gather_for_analyst",
        "analyst_instructions": (
            "This is candidate MATERIAL, not approved candidates. Read each item and judge: "
            "does it carry a durable, attributable claim that is useful to AstraJax as a business, "
            "or that would help AI support TL and Matthew? For each item you keep, write a one-line "
            "claim (clean_summary) and a reason it matters (analyst_reason), then create it via "
            "create_scanner_context_intake.py. Discard everything that is not durable, business-relevant, "
            "and actionable. Surfacing few or zero candidates is a correct outcome."
        ),
        "stats": {
            **local_stats,
            **airtable_stats,
            "material_total": len(all_material),
            "material_new": new_count,
            "material_duplicate": len(all_material) - new_count,
        },
        "material": fresh,
    }
    print(json.dumps(result, indent=None if args.json_only else 2, ensure_ascii=False))


if __name__ == "__main__":
    main()
