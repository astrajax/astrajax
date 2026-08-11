#!/usr/bin/env python3
"""Generate Persona Config sync artifact from Airtable (Build velocity Track 4).

Pilot: Clive's Man only (not Doc — HA/Cursor twins still diverge).

Usage:
  python3 scripts/generate_persona_config_sync.py --agent clive-man
  python3 scripts/generate_persona_config_sync.py --agent clive-man --check

Emits:
  agents/registry/cursor/clive/clive-man/persona-config.generated.md

Do not hand-edit the generated file. Change Airtable Persona Config, then re-run.
Env: AIRTABLE_READ_TOKEN or AIRTABLE_API_KEY or AIRTABLE_WRITE_TOKEN.

Resolution: finds the single Approved record whose Config Name matches
``Operational v<major>.<minor>`` exactly (no suffixes). Among matches, picks
the highest semver. Fails loudly on zero or multiple matches — never guesses.
"""

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
from pathlib import Path

REPO = Path(__file__).resolve().parents[1]

# Status value from Persona Config → Status singleSelect (verified via Airtable MCP).
APPROVED_STATUS = "Approved"

# Canonical Cursor operational semver line only — excludes proposals and
# parallel tracks such as "Operational v1.0 (HyperAgent sync …)".
OPERATIONAL_VERSION_RE = re.compile(r"^Operational v(\d+)\.(\d+)$")

AGENTS = {
    "clive-man": {
        "base": "appZ71CSKBlhnb4hR",
        "table": "tblQMlziNRMd53Yns",
        "out": REPO
        / "agents"
        / "registry"
        / "cursor"
        / "clive"
        / "clive-man"
        / "persona-config.generated.md",
        "fields": {
            "name": "fldYeP8rAAoWtdF1s",
            "prompt": "fldpfNOynEefUJJmP",
            "rules": "fldcPAtLqfjPzt3vE",
            "output": "fldyQFbp8He2sjRAo",
            "status": "fldST2X0TjM9rba1G",
        },
    }
}

BEGIN = "<!-- BEGIN GENERATED: persona-config — do not hand-edit -->"
END = "<!-- END GENERATED: persona-config -->"


def _token() -> str:
    for key in ("AIRTABLE_READ_TOKEN", "AIRTABLE_API_KEY", "AIRTABLE_WRITE_TOKEN"):
        tok = os.environ.get(key)
        if tok:
            return tok
    env_path = REPO / ".env"
    if env_path.is_file():
        for line in env_path.read_text().splitlines():
            for key in ("AIRTABLE_READ_TOKEN", "AIRTABLE_API_KEY", "AIRTABLE_WRITE_TOKEN"):
                if line.startswith(f"{key}="):
                    return line.split("=", 1)[1].strip().strip('"').strip("'")
    raise SystemExit("Missing Airtable token in env or .env")


def _airtable_get(url: str) -> dict:
    req = urllib.request.Request(
        url, headers={"Authorization": f"Bearer {_token()}"}
    )
    try:
        with urllib.request.urlopen(req) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="replace")
        raise SystemExit(f"Airtable fetch failed: {exc.code} {detail}") from exc


def _list_records(cfg: dict) -> list[dict]:
    records: list[dict] = []
    offset: str | None = None
    while True:
        params: dict[str, str] = {"returnFieldsByFieldId": "true", "pageSize": "100"}
        if offset:
            params["offset"] = offset
        query = urllib.parse.urlencode(params)
        url = f"https://api.airtable.com/v0/{cfg['base']}/{cfg['table']}?{query}"
        payload = _airtable_get(url)
        records.extend(payload.get("records") or [])
        offset = payload.get("offset")
        if not offset:
            break
    return records


def _fetch_record(cfg: dict, record_id: str) -> dict:
    url = (
        f"https://api.airtable.com/v0/{cfg['base']}/{cfg['table']}/{record_id}"
        f"?returnFieldsByFieldId=true"
    )
    return _airtable_get(url)


def _status_name(val) -> str:
    if isinstance(val, dict):
        return str(val.get("name") or "")
    return str(val or "")


def _config_name(record: dict, cfg: dict) -> str:
    fields = record.get("fields") or {}
    return str(fields.get(cfg["fields"]["name"]) or "")


def _parse_operational_version(name: str) -> tuple[int, int] | None:
    match = OPERATIONAL_VERSION_RE.match(name.strip())
    if not match:
        return None
    return int(match.group(1)), int(match.group(2))


def _resolve_approved_record(agent: str, cfg: dict) -> dict:
    """Return the current Approved Operational semver Persona Config for *agent*."""
    f = cfg["fields"]
    all_records = _list_records(cfg)

    approved_any: list[tuple[str, str]] = []
    semver_matches: list[tuple[tuple[int, int], str, str]] = []

    for record in all_records:
        record_id = record["id"]
        fields = record.get("fields") or {}
        name = str(fields.get(f["name"]) or "")
        status = _status_name(fields.get(f["status"]))

        if status == APPROVED_STATUS:
            approved_any.append((record_id, name))
            version = _parse_operational_version(name)
            if version is not None:
                semver_matches.append((version, record_id, name))

    if not semver_matches:
        lines = [
            f"No Approved Persona Config for agent {agent!r} matching "
            f"{OPERATIONAL_VERSION_RE.pattern!r}.",
            "",
            "Approved records in this base (may use non-semver names):",
        ]
        if approved_any:
            for record_id, name in approved_any:
                lines.append(f"  - {record_id}: {name!r}")
        else:
            lines.append("  (none — zero Approved records in Persona Config table)")
        lines.append("")
        lines.append(
            "Promote the intended version in Airtable (Status → Approved) or retire "
            "duplicates before re-running."
        )
        raise SystemExit("\n".join(lines))

    semver_matches.sort(key=lambda item: item[0], reverse=True)
    best_version = semver_matches[0][0]
    at_best = [item for item in semver_matches if item[0] == best_version]

    if len(at_best) > 1:
        lines = [
            f"Ambiguous Approved Persona Config for agent {agent!r}: "
            f"{len(at_best)} records share Operational v{best_version[0]}.{best_version[1]}.",
            "",
            "Matching Approved records:",
        ]
        for _, record_id, name in at_best:
            lines.append(f"  - {record_id}: {name!r}")
        lines.append("")
        lines.append(
            "Retire or rename until exactly one Approved Operational semver record "
            "exists at the highest version."
        )
        raise SystemExit("\n".join(lines))

    _, record_id, name = at_best[0]
    print(
        f"Resolved Approved Persona Config for {agent!r}: {record_id} ({name})",
        file=sys.stderr,
    )
    return _fetch_record(cfg, record_id)


def _render(cfg: dict, record: dict) -> str:
    fields = record.get("fields") or {}
    f = cfg["fields"]
    record_id = record["id"]
    name = fields.get(f["name"]) or "(unnamed)"
    status = _status_name(fields.get(f["status"]))
    prompt = fields.get(f["prompt"]) or ""
    rules = fields.get(f["rules"]) or ""
    output = fields.get(f["output"]) or ""
    body = "\n".join(
        [
            f"# Persona Config sync — {name}",
            "",
            f"Record: `{record_id}` · Status: **{status}**",
            f"Source: Airtable `{cfg['base']}` / `{cfg['table']}`",
            "",
            "Generated by `scripts/generate_persona_config_sync.py`.",
            "Edit Airtable first; re-run the script. Do not hand-edit this file.",
            "",
            BEGIN,
            "",
            "## Operational System Prompt",
            "",
            prompt.strip() or "_(empty)_",
            "",
            "## Rules Section",
            "",
            rules.strip() or "_(empty)_",
            "",
            "## Output Format",
            "",
            output.strip() or "_(empty)_",
            "",
            END,
            "",
        ]
    )
    digest = hashlib.sha256(body.encode("utf-8")).hexdigest()[:16]
    return body.replace(
        BEGIN,
        f"{BEGIN}\n<!-- content-sha256-16: {digest} -->",
        1,
    )


def generate(agent: str) -> Path:
    if agent not in AGENTS:
        raise SystemExit(f"Unknown agent {agent!r}. Pilot agents: {sorted(AGENTS)}")
    cfg = AGENTS[agent]
    record = _resolve_approved_record(agent, cfg)
    text = _render(cfg, record)
    out: Path = cfg["out"]
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(text, encoding="utf-8")
    print(f"Wrote {out.relative_to(REPO)}")
    return out


def check(agent: str) -> None:
    cfg = AGENTS[agent]
    out: Path = cfg["out"]
    if not out.is_file():
        raise SystemExit(f"Missing generated file: {out}. Run without --check first.")
    current = out.read_text(encoding="utf-8")
    record = _resolve_approved_record(agent, cfg)
    expected = _render(cfg, record)
    if current != expected:
        raise SystemExit(
            f"DRIFT: {out.relative_to(REPO)} does not match Airtable. "
            "Re-run generate (do not hand-edit the generated file)."
        )
    if BEGIN not in current or END not in current:
        raise SystemExit("Generated markers missing — file may have been hand-mangled.")
    print(f"OK no drift: {out.relative_to(REPO)}")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--agent", default="clive-man")
    parser.add_argument(
        "--check",
        action="store_true",
        help="Fail if generated file drifts from Airtable",
    )
    args = parser.parse_args()
    if args.check:
        check(args.agent)
    else:
        generate(args.agent)
        check(args.agent)


if __name__ == "__main__":
    main()
