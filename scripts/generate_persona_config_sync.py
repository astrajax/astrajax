#!/usr/bin/env python3
"""Generate Persona Config sync artifact from Airtable (Build velocity Track 4).

Pilot: Clive's Man only (not Doc — HA/Cursor twins still diverge).

Usage:
  python3 scripts/generate_persona_config_sync.py --agent clive-man
  python3 scripts/generate_persona_config_sync.py --agent clive-man --check
  python3 scripts/generate_persona_config_sync.py --agent clive-man --pin-version "Operational v0.4"

Emits:
  agents/registry/cursor/clive/clive-man/persona-config.generated.md

Do not hand-edit the generated file. Change Airtable Persona Config, then re-run.
Env: AIRTABLE_READ_TOKEN or AIRTABLE_API_KEY or AIRTABLE_WRITE_TOKEN.

Resolution (default): finds the single Approved record whose Config Name matches
``Operational v<major>.<minor>`` exactly (no suffixes). Among matches, picks
the highest semver. Fails loudly on zero or multiple matches — never guesses.

Resolution (--pin-version): strict exact-name match for one version only; requires
expected_record_id in agent config; fails closed when Status is not Approved
(Pending v0.4 gate until Matthew promotes the record).
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

APPROVED_STATUS = "Approved"
PENDING_STATUS = "Pending"

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
        # Pending gate — do not generate sync until Matthew sets Status → Approved.
        "expected_version": "Operational v0.4",
        "expected_record_id": "recSKTT8NTTJOmuRu",
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


def _fail_gate_pending(agent: str, record_id: str, name: str, status: str) -> None:
    expected_id = AGENTS.get(agent, {}).get("expected_record_id")
    expected_version = AGENTS.get(agent, {}).get("expected_version")
    lines = [
        f"FAIL CLOSED: Persona Config for agent {agent!r} is not Approved.",
        f"  Record: {record_id}",
        f"  Config Name: {name!r}",
        f"  Status: {status!r}",
        "",
    ]
    if expected_id and record_id == expected_id:
        lines.extend(
            [
                f"This is the cleared {expected_version!r} gate record.",
                "Matthew must set Status → Approved in Airtable before sync generation.",
                "Do not fake a hash or mark Approved in repo sources.",
            ]
        )
    else:
        lines.append(
            "Promote the intended version in Airtable (Status → Approved) or retire "
            "duplicates before re-running."
        )
    raise SystemExit("\n".join(lines))


def _resolve_pinned_record(agent: str, cfg: dict, pin_version: str) -> dict:
    """Strict exact-name resolution for one Operational semver line."""
    expected_id = cfg.get("expected_record_id")
    expected_version = cfg.get("expected_version")
    if expected_version and pin_version != expected_version:
        raise SystemExit(
            f"Pin version {pin_version!r} does not match configured expected_version "
            f"{expected_version!r} for agent {agent!r}."
        )

    f = cfg["fields"]
    exact_matches: list[dict] = []
    for record in _list_records(cfg):
        name = _config_name(record, cfg)
        if name.strip() == pin_version.strip():
            exact_matches.append(record)

    if not exact_matches:
        raise SystemExit(
            f"No Persona Config record with exact Config Name {pin_version!r} "
            f"for agent {agent!r}."
        )

    if len(exact_matches) > 1:
        lines = [
            f"Ambiguous exact-name match for {pin_version!r}: {len(exact_matches)} records.",
            "",
            "Matching records:",
        ]
        for record in exact_matches:
            lines.append(f"  - {record['id']}: {_config_name(record, cfg)!r}")
        raise SystemExit("\n".join(lines))

    record = exact_matches[0]
    record_id = record["id"]
    status = _status_name((record.get("fields") or {}).get(f["status"]))

    if expected_id and record_id != expected_id:
        raise SystemExit(
            f"Record ID mismatch for {pin_version!r}: expected {expected_id!r}, "
            f"got {record_id!r}. Refusing to guess."
        )

    if status != APPROVED_STATUS:
        _fail_gate_pending(agent, record_id, pin_version, status)

    print(
        f"Resolved pinned Approved Persona Config for {agent!r}: "
        f"{record_id} ({pin_version})",
        file=sys.stderr,
    )
    return _fetch_record(cfg, record_id)


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


def _render(
    cfg: dict,
    record: dict,
    *,
    source_kind: str = "airtable-live",
    read_date: str | None = None,
    mirror_path: str | None = None,
    bundle_sha256: str | None = None,
) -> str:
    fields = record.get("fields") or {}
    f = cfg["fields"]
    record_id = record["id"]
    name = fields.get(f["name"]) or "(unnamed)"
    status = _status_name(fields.get(f["status"]))
    prompt = fields.get(f["prompt"]) or ""
    rules = fields.get(f["rules"]) or ""
    output = fields.get(f["output"]) or ""

    if source_kind == "airtable-mcp-approved-snapshot":
        source_lines = [
            f"Source kind: **{source_kind}** · Read: **{read_date or 'unknown'}**",
            f"Mirror: `{mirror_path or 'persona-config.approved-v0.4.json'}`",
            f"Airtable origin: `{cfg['base']}` / `{cfg['table']}`",
        ]
        if bundle_sha256:
            source_lines.append(f"Persona bundle sha256: `{bundle_sha256}`")
        generator_note = (
            "Generated by `scripts/generate_persona_config_sync.py --approved-source-file`. "
            "Live Airtable pin remains preferred when a token exists."
        )
    else:
        source_lines = [f"Source: Airtable `{cfg['base']}` / `{cfg['table']}`"]
        generator_note = (
            "Generated by `scripts/generate_persona_config_sync.py`. "
            "Edit Airtable first; re-run the script. Do not hand-edit this file."
        )

    body = "\n".join(
        [
            f"# Persona Config sync — {name}",
            "",
            f"Record: `{record_id}` · Status: **{status}**",
            *source_lines,
            "",
            generator_note,
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
    digest_full = hashlib.sha256(body.encode("utf-8")).hexdigest()
    digest_short = digest_full[:16]
    return body.replace(
        BEGIN,
        f"{BEGIN}\n<!-- content-sha256: {digest_full} -->\n<!-- content-sha256-16: {digest_short} -->",
        1,
    )


def _extract_hash(text: str) -> tuple[str | None, str | None]:
    full_match = re.search(r"<!-- content-sha256: ([0-9a-f]{64}) -->", text)
    short_match = re.search(r"<!-- content-sha256-16: ([0-9a-f]{16}) -->", text)
    return (
        full_match.group(1) if full_match else None,
        short_match.group(1) if short_match else None,
    )


def _record_from_approved_payload(cfg: dict, payload: dict) -> dict:
    f = cfg["fields"]
    return {
        "id": payload["record_id"],
        "fields": {
            f["name"]: payload["config_name"],
            f["status"]: payload["status"],
            f["prompt"]: payload["system_prompt"],
            f["rules"]: payload["rules_section"],
            f["output"]: payload["output_format"],
        },
    }


def _load_approved_source(path: Path) -> tuple[dict, dict]:
    sys.path.insert(0, str(REPO / "hyperagent" / "builds"))
    from _clive_man_approved_persona_source import load_approved_source_json  # noqa: E402

    payload = load_approved_source_json(path)
    return payload, _record_from_approved_payload(AGENTS["clive-man"], payload)


def generate(
    agent: str,
    *,
    pin_version: str | None = None,
    approved_source_file: Path | None = None,
) -> Path:
    if agent not in AGENTS:
        raise SystemExit(f"Unknown agent {agent!r}. Pilot agents: {sorted(AGENTS)}")
    cfg = AGENTS[agent]
    source_kind = "airtable-live"
    read_date = None
    mirror_path = None
    bundle_sha256 = None

    if approved_source_file:
        payload, record = _load_approved_source(approved_source_file)
        source_kind = payload["source"]
        read_date = payload.get("read_date")
        mirror_path = str(approved_source_file.relative_to(REPO))
        bundle_sha256 = payload["content_sha256"]
    elif pin_version:
        record = _resolve_pinned_record(agent, cfg, pin_version)
    else:
        record = _resolve_approved_record(agent, cfg)

    text = _render(
        cfg,
        record,
        source_kind=source_kind,
        read_date=read_date,
        mirror_path=mirror_path,
        bundle_sha256=bundle_sha256,
    )
    out: Path = cfg["out"]
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(text, encoding="utf-8")
    print(f"Wrote {out.relative_to(REPO)}")
    return out


def check(
    agent: str,
    *,
    pin_version: str | None = None,
    approved_source_file: Path | None = None,
) -> None:
    cfg = AGENTS[agent]
    out: Path = cfg["out"]
    if not out.is_file():
        raise SystemExit(f"Missing generated file: {out}. Run without --check first.")
    current = out.read_text(encoding="utf-8")
    source_kind = "airtable-live"
    read_date = None
    mirror_path = None
    bundle_sha256 = None

    if approved_source_file:
        payload, record = _load_approved_source(approved_source_file)
        source_kind = payload["source"]
        read_date = payload.get("read_date")
        mirror_path = str(approved_source_file.relative_to(REPO))
        bundle_sha256 = payload["content_sha256"]
    elif pin_version:
        record = _resolve_pinned_record(agent, cfg, pin_version)
    else:
        record = _resolve_approved_record(agent, cfg)

    expected = _render(
        cfg,
        record,
        source_kind=source_kind,
        read_date=read_date,
        mirror_path=mirror_path,
        bundle_sha256=bundle_sha256,
    )
    if current != expected:
        raise SystemExit(
            f"DRIFT: {out.relative_to(REPO)} does not match Airtable. "
            "Re-run generate (do not hand-edit the generated file)."
        )
    if BEGIN not in current or END not in current:
        raise SystemExit("Generated markers missing — file may have been hand-mangled.")
    full_hash, short_hash = _extract_hash(expected)
    cur_full, cur_short = _extract_hash(current)
    if not full_hash or not short_hash:
        raise SystemExit("Generated full SHA-256 marker missing from expected output.")
    if cur_full != full_hash or cur_short != short_hash:
        raise SystemExit("SHA-256 marker mismatch — file may have been hand-mangled.")
    print(f"OK no drift: {out.relative_to(REPO)} (sha256-16: {short_hash})")


def verify_pending_gate(agent: str) -> None:
    """Confirm the cleared v0.4 record exists and is still Pending (fail-closed gate)."""
    if agent not in AGENTS:
        raise SystemExit(f"Unknown agent {agent!r}.")
    cfg = AGENTS[agent]
    expected_id = cfg.get("expected_record_id")
    expected_version = cfg.get("expected_version")
    if not expected_id or not expected_version:
        raise SystemExit(f"No pending gate configured for agent {agent!r}.")

    record = _fetch_record(cfg, expected_id)
    name = _config_name(record, cfg)
    status = _status_name((record.get("fields") or {}).get(cfg["fields"]["status"]))

    if name.strip() != expected_version.strip():
        raise SystemExit(
            f"Pending gate record {expected_id!r} has Config Name {name!r}, "
            f"expected exact {expected_version!r}."
        )

    if status == APPROVED_STATUS:
        print(
            f"GATE OPEN: {expected_id} ({expected_version}) is Approved — "
            "sync generation with --pin-version is permitted.",
            file=sys.stderr,
        )
        return

    if status == PENDING_STATUS:
        print(
            f"GATE CLOSED (expected): {expected_id} ({expected_version}) is Pending. "
            "Do not generate v0.4 sync until Matthew approves.",
            file=sys.stderr,
        )
        return

    raise SystemExit(
        f"Unexpected Status {status!r} on gate record {expected_id!r} "
        f"({expected_version!r}). Resolve in Airtable before continuing."
    )


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--agent", default="clive-man")
    parser.add_argument(
        "--check",
        action="store_true",
        help="Fail if generated file drifts from Airtable",
    )
    parser.add_argument(
        "--pin-version",
        metavar="NAME",
        help='Strict exact-name sync (e.g. "Operational v0.4"); fails closed if not Approved',
    )
    parser.add_argument(
        "--verify-pending-gate",
        action="store_true",
        help="Report Pending/Approved state of expected_record_id without generating",
    )
    parser.add_argument(
        "--approved-source-file",
        metavar="PATH",
        help="Explicit MCP-approved snapshot JSON (source=airtable-mcp-approved-snapshot only)",
    )
    args = parser.parse_args()

    approved_path = Path(args.approved_source_file) if args.approved_source_file else None
    if approved_path and not approved_path.is_absolute():
        approved_path = REPO / approved_path

    if args.verify_pending_gate:
        verify_pending_gate(args.agent)
        return

    if args.check:
        check(args.agent, pin_version=args.pin_version, approved_source_file=approved_path)
    else:
        generate(
            args.agent,
            pin_version=args.pin_version,
            approved_source_file=approved_path,
        )
        check(args.agent, pin_version=args.pin_version, approved_source_file=approved_path)


if __name__ == "__main__":
    main()
