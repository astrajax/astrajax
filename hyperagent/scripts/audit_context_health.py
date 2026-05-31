#!/usr/bin/env python3
"""Audit AstraJax context health for Curator V4.

This script is intentionally conservative. It surfaces hygiene findings with
evidence; it does not apply cleanup actions.
"""

from __future__ import annotations

import argparse
import json
import re
import subprocess
import sys
from collections import defaultdict
from dataclasses import asdict, dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

REPO_ROOT = Path(__file__).resolve().parents[2]
DEFAULT_OUTPUT_DIR = REPO_ROOT / "hyperagent" / "reports" / "curator"
DEFAULT_CHECKS = ("stale", "conflicts", "duplicates", "unsupported", "risky")

TARGET_PATTERNS: dict[str, list[str]] = {
    "clive-core": [
        "AGENTS.md",
        "clive_context_architecture_v2.md",
        "docs/context/human-approval-path.md",
        "hyperagent/context_architecture_schema_v1.json",
        ".cursor/agents/clive-*.md",
        ".cursor/skills/clive-*/SKILL.md",
    ],
    "agent-factory": [
        ".cursor/agents/clive-agent-factory.md",
        ".cursor/skills/clive-agent-factory/SKILL.md",
        "agents/cursor/clive/agent-factory/**/*.md",
        "hyperagent/builds/build_clive_agent_factory*.py",
    ],
    "curator": [
        ".cursor/agents/clive-curator.md",
        ".cursor/skills/clive-context-curator/SKILL.md",
        "agents/cursor/clive/curator/**/*.md",
        "hyperagent/builds/build_clive_curator*.py",
        "hyperagent/exports/agents/agent-clive-curator*.json",
        "hyperagent/exports/skills/skill-clive-context-curator*.json",
        "hyperagent/schedule/com.astrajax.clive-curator-daily.plist",
    ],
    "hyperagent-platform": [
        "docs/context/hyperagent-platform.md",
        "docs/context/hyperagent-releases.json",
        "hyperagent/exports/agents/*.json",
        "hyperagent/exports/skills/*.json",
    ],
    "context-packs": [
        "agents/cursor/**/*.md",
        "agents/hyperagent/**/*.md",
        ".cursor/skills/**/SKILL.md",
    ],
    "approved-context": [
        "AGENTS.md",
        "astrajax_*.md",
        "docs/context/**/*.md",
        ".cursor/agents/*.md",
        ".cursor/skills/**/SKILL.md",
    ],
    "proposed-context": [
        "agents/**/*.md",
        "hyperagent/exports/agents/*.json",
        "hyperagent/exports/skills/*.json",
    ],
}
TARGET_PATTERNS["daily"] = (
    TARGET_PATTERNS["clive-core"]
    + TARGET_PATTERNS["agent-factory"]
    + TARGET_PATTERNS["curator"]
    + TARGET_PATTERNS["hyperagent-platform"]
)
TARGET_PATTERNS["all"] = sorted({pattern for patterns in TARGET_PATTERNS.values() for pattern in patterns})


@dataclass
class Source:
    kind: str
    path: str
    title: str
    text: str
    metadata: dict[str, Any]


@dataclass
class Finding:
    id: str
    severity: str
    check: str
    surface: str
    evidence: str
    why_it_matters: str
    recommended_action: str
    route: str


def rel(path: Path) -> str:
    try:
        return str(path.relative_to(REPO_ROOT))
    except ValueError:
        return str(path)


def safe_read(path: Path, max_bytes: int = 250_000) -> str:
    try:
        if path.stat().st_size > max_bytes:
            return path.read_text(encoding="utf-8", errors="replace")[:max_bytes]
        return path.read_text(encoding="utf-8", errors="replace")
    except UnicodeDecodeError:
        return ""


def title_from_text(path: Path, text: str) -> str:
    if path.suffix == ".json":
        try:
            data = json.loads(text)
            if isinstance(data, dict):
                name = data.get("data", {}).get("name") or data.get("name")
                if name:
                    return str(name)
        except json.JSONDecodeError:
            pass
    for line in text.splitlines()[:60]:
        stripped = line.strip()
        if stripped.startswith("#"):
            return stripped.lstrip("#").strip()
        if stripped.startswith("name:"):
            return stripped.split(":", 1)[1].strip()
    return path.name


def collect_local_sources(target: str, max_files: int) -> list[Source]:
    paths: list[Path] = []
    for pattern in TARGET_PATTERNS[target]:
        paths.extend(path for path in REPO_ROOT.glob(pattern) if path.is_file())

    seen: set[Path] = set()
    sources: list[Source] = []
    for path in sorted(paths):
        if path in seen:
            continue
        seen.add(path)
        text = safe_read(path)
        if not text.strip():
            continue
        sources.append(
            Source(
                kind="file",
                path=rel(path),
                title=title_from_text(path, text),
                text=text,
                metadata={"size": path.stat().st_size},
            )
        )
        if len(sources) >= max_files:
            break
    return sources


def run_json(command: list[str]) -> dict[str, Any]:
    result = subprocess.run(
        [sys.executable, *command],
        cwd=REPO_ROOT,
        text=True,
        capture_output=True,
        check=False,
    )
    if result.returncode != 0:
        return {"success": False, "error": result.stderr.strip() or result.stdout.strip(), "command": command}
    try:
        return json.loads(result.stdout)
    except json.JSONDecodeError as exc:
        return {"success": False, "error": f"Invalid JSON: {exc}", "command": command}


def collect_airtable_sources(target: str, max_records: int) -> tuple[list[Source], list[str]]:
    if target not in {"daily", "all", "approved-context", "proposed-context", "context-packs", "clive-core"}:
        return [], []

    sources: list[Source] = []
    errors: list[str] = []

    statuses = []
    if target in {"daily", "all", "approved-context", "clive-core"}:
        statuses.append("Approved")
    if target in {"daily", "all", "proposed-context"}:
        statuses.append("Proposed")

    for status in statuses:
        data = run_json(["hyperagent/scripts/read_context_items.py", "--status", status, "--max-records", str(max_records)])
        if not data.get("success"):
            errors.append(f"Context Items {status}: {data.get('error', 'failed')}")
            continue
        for record in data.get("records", []):
            fields = record.get("fields", {})
            title = fields.get("Title", "Untitled")
            text = "\n".join(str(fields.get(name, "")) for name in ("Title", "Canonical Text", "Source Notes", "Conflicts", "Approval Notes"))
            sources.append(
                Source(
                    kind="airtable_context_item",
                    path=f"Context Items/{record.get('id')}",
                    title=title,
                    text=text,
                    metadata={"status": status, "fields": fields, "url": record.get("url")},
                )
            )

    if target in {"daily", "all", "context-packs", "clive-core"}:
        data = run_json(["hyperagent/scripts/read_context_packs.py", "--max-records", str(max_records)])
        if not data.get("success"):
            errors.append(f"Context Packs: {data.get('error', 'failed')}")
        else:
            for record in data.get("records", []):
                fields = record.get("fields", {})
                title = fields.get("Pack Name", "Untitled pack")
                text = "\n".join(str(fields.get(name, "")) for name in ("Pack Name", "Purpose", "Notes", "GitHub Path", "Hyperagent Skill Name"))
                sources.append(
                    Source(
                        kind="airtable_context_pack",
                        path=f"Context Packs/{record.get('id')}",
                        title=title,
                        text=text,
                        metadata={"fields": fields, "url": record.get("url")},
                    )
                )
    return sources, errors


def normalise(value: str) -> str:
    return re.sub(r"\s+", " ", re.sub(r"[^a-z0-9 ]+", " ", value.lower())).strip()


def add_findings(findings: list[Finding], check: str, surface: str, evidence: str, why: str, action: str, route: str, severity: str = "Medium") -> None:
    finding_id = f"CUR-{datetime.now().strftime('%Y%m%d')}-{len(findings) + 1:03d}"
    findings.append(Finding(finding_id, severity, check, surface, evidence, why, action, route))


def check_duplicates(sources: list[Source], findings: list[Finding]) -> None:
    by_title: dict[str, list[Source]] = defaultdict(list)
    for source in sources:
        key = normalise(source.title)
        if key and len(key) > 5:
            by_title[key].append(source)
    for title, grouped in by_title.items():
        if len(grouped) < 2:
            continue
        surfaces = ", ".join(item.path for item in grouped[:6])
        add_findings(
            findings,
            "duplicates",
            surfaces,
            f"{len(grouped)} sources share title '{grouped[0].title}'.",
            "Duplicate context titles make it unclear which copy is canonical.",
            "Choose a canonical copy; mark or archive superseded copies.",
            "Matthew or Publisher",
            "Medium",
        )

    export_groups: dict[str, list[Source]] = defaultdict(list)
    for source in sources:
        match = re.search(r"agent-(.+?)-v[0-9_]+\.json$", source.path)
        if match:
            export_groups[match.group(1)].append(source)
    for agent, grouped in export_groups.items():
        if len(grouped) > 2:
            add_findings(
                findings,
                "duplicates",
                ", ".join(item.path for item in grouped),
                f"{len(grouped)} exports exist for {agent}.",
                "Multiple exports are acceptable as history, but the live one should be obvious.",
                "Mark the current export in the build pack or archive older exports.",
                "Agent Factory",
                "Low",
            )


def check_stale(sources: list[Source], findings: list[Finding], now: datetime) -> None:
    date_re = re.compile(r"\b(20[0-9]{2})-(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])\b")
    for source in sources:
        dates = []
        for year, month, day in date_re.findall(source.text):
            try:
                dates.append(datetime(int(year), int(month), int(day), tzinfo=timezone.utc))
            except ValueError:
                continue
        if not dates:
            if any(marker in source.text.lower() for marker in ("last reviewed", "current", "canonical", "source of truth")):
                add_findings(
                    findings,
                    "stale",
                    source.path,
                    "Source has authority language but no ISO review date.",
                    "Authority claims need a review date so Clive can judge freshness.",
                    "Add or update a Last Reviewed date.",
                    "Matthew",
                    "Low",
                )
            continue
        newest = max(dates)
        age_days = (now - newest).days
        if age_days > 90:
            add_findings(
                findings,
                "stale",
                source.path,
                f"Newest ISO date found is {newest.date()} ({age_days} days old).",
                "Old dated context may be correct, but it needs freshness judgement before agents rely on it.",
                "Review freshness; mark Current, Ageing, Stale, or Historical.",
                "Matthew or Curator cleanup draft",
                "Medium" if age_days > 180 else "Low",
            )
    for source in sources:
        if source.path.endswith("hyperagent-releases.json"):
            try:
                data = json.loads(source.text)
            except json.JSONDecodeError:
                continue
            last_synced = data.get("last_synced_at")
            if not last_synced:
                add_findings(
                    findings,
                    "stale",
                    source.path,
                    "Release log has no last_synced_at.",
                    "Agent Factory should not rely on an unsynced release log for platform truth.",
                    "Run the Hyperagent release scanner or mark the log intentionally unsynced.",
                    "Release Scanner",
                    "Medium",
                )


def check_unsupported(sources: list[Source], findings: list[Finding]) -> None:
    markers = ("todo", "tbc", "placeholder", "not sure", "maybe", "probably", "guess", "unknown", "unverified")
    for source in sources:
        lowered = source.text.lower()
        hits = [marker for marker in markers if marker in lowered]
        if hits:
            add_findings(
                findings,
                "unsupported",
                source.path,
                f"Uncertainty markers found: {', '.join(sorted(set(hits)))}.",
                "Uncertain or placeholder language can be mistaken for durable context.",
                "Either source and approve the claim, or mark it as draft/unverified.",
                "Matthew or source owner",
                "Medium" if "unverified" in hits or "placeholder" in hits else "Low",
            )
        if "source:" not in lowered and source.kind.startswith("airtable_context_item"):
            status = source.metadata.get("status")
            if status == "Approved":
                add_findings(
                    findings,
                    "unsupported",
                    source.path,
                    "Approved Context Item text does not include an obvious source marker.",
                    "Approved context should carry enough source trail for later audits.",
                    "Add source notes or provenance.",
                    "Matthew",
                    "Low",
                )


def check_risky(sources: list[Source], findings: list[Finding]) -> None:
    for source in sources:
        lowered = source.text.lower()
        if "autosavememories" in lowered and "true" in lowered:
            add_findings(
                findings,
                "risky",
                source.path,
                "`autoSaveMemories` appears with `true` nearby.",
                "Auto-saved memories bypass the deliberate context approval lane.",
                "Disable auto-save or document why this agent is exempt.",
                "Agent Factory",
                "High",
            )
        if "airtable_write_token" in lowered and "approve" in lowered:
            add_findings(
                findings,
                "risky",
                source.path,
                "Write credential and approval language appear in the same surface.",
                "Write credentials must not be confused with human approval authority.",
                "Split write and approval language; verify no approver token is exposed.",
                "Matthew",
                "High",
            )
        if "create_context_item.py" in lowered and "scheduled" in lowered:
            add_findings(
                findings,
                "risky",
                source.path,
                "Scheduled context mentions `create_context_item.py`.",
                "Scheduled creation can blur audit with proposal creation.",
                "Verify scheduled mode is read-only.",
                "Curator",
                "Medium",
            )


def check_conflicts(sources: list[Source], findings: list[Finding]) -> None:
    claim_patterns = [
        ("approve context", r"(must|may|can|cannot|must not|never).{0,80}approve.{0,80}context"),
        ("create context items", r"(must|may|can|cannot|must not|never).{0,80}create.{0,80}context item"),
        ("edit repo", r"(must|may|can|cannot|must not|never).{0,80}edit.{0,80}(repo|file|github)"),
        ("auto-save memories", r"(enable|disable|must|never|allow).{0,80}auto.?save.{0,80}memor"),
    ]
    for label, pattern in claim_patterns:
        positive: list[str] = []
        negative: list[str] = []
        for source in sources:
            text = source.text.lower()
            matches = re.findall(pattern, text, flags=re.IGNORECASE | re.DOTALL)
            if not matches:
                continue
            snippet = re.search(pattern, text, flags=re.IGNORECASE | re.DOTALL)
            if not snippet:
                continue
            line = snippet.group(0).replace("\n", " ")[:180]
            if any(word in line for word in ("cannot", "must not", "never", "disable")):
                negative.append(f"{source.path}: {line}")
            if any(word in line for word in ("may", "can", "must", "enable", "allow")) and not any(word in line for word in ("cannot", "must not", "never")):
                positive.append(f"{source.path}: {line}")
        if positive and negative:
            add_findings(
                findings,
                "conflicts",
                label,
                " | ".join((positive[:2] + negative[:2])),
                "Contradictory permission language can make agents choose the wrong authority boundary.",
                "Decide the canonical rule and update or archive the conflicting surface.",
                "Matthew or Agent Factory",
                "High",
            )


def run_checks(sources: list[Source], checks: set[str]) -> list[Finding]:
    findings: list[Finding] = []
    now = datetime.now(timezone.utc)
    if "duplicates" in checks:
        check_duplicates(sources, findings)
    if "stale" in checks:
        check_stale(sources, findings, now)
    if "unsupported" in checks:
        check_unsupported(sources, findings)
    if "risky" in checks:
        check_risky(sources, findings)
    if "conflicts" in checks:
        check_conflicts(sources, findings)
    return findings


def severity_order(severity: str) -> int:
    return {"Critical": 0, "High": 1, "Medium": 2, "Low": 3}.get(severity, 4)


def markdown_report(target: str, checks: set[str], sources: list[Source], findings: list[Finding], errors: list[str], run_date: str) -> str:
    findings = sorted(findings, key=lambda item: (severity_order(item.severity), item.id))
    lines = [
        f"# Clive Curator Context Health Audit - {run_date}",
        "",
        f"Target: `{target}`",
        f"Checks: `{', '.join(sorted(checks))}`",
        f"Sources read: {len(sources)}",
        f"Findings: {len(findings)}",
        "",
        "Safety: audit mode is read-only. This run did not create, approve, publish, demote, or edit context.",
        "",
    ]
    if errors:
        lines.extend(["## Read Gaps", ""])
        lines.extend(f"- {error}" for error in errors)
        lines.append("")
    lines.extend(["## Findings", ""])
    if not findings:
        lines.extend(["No hygiene findings from deterministic checks. This is not proof the context is perfect; it means no configured check fired.", ""])
    for finding in findings:
        lines.extend(
            [
                f"### {finding.id} - {finding.severity}",
                "",
                f"- Check: {finding.check}",
                f"- Surface: {finding.surface}",
                f"- Evidence: {finding.evidence}",
                f"- Why it matters: {finding.why_it_matters}",
                f"- Recommended action: {finding.recommended_action}",
                f"- Owner or route: {finding.route}",
                "",
            ]
        )
    lines.extend(
        [
            "## Dashboard Button Prompts",
            "",
            "Use these as Airtable dashboard button prompt payloads:",
            "",
            "```text",
            "@clive-curator audit target=clive-core checks=stale,conflicts,unsupported,risky",
            "@clive-curator audit target=agent-factory checks=stale,unsupported,risky",
            "@clive-curator audit target=context-packs checks=duplicates,risky",
            "@clive-curator audit target=hyperagent-platform checks=stale,conflicts",
            "@clive-curator cleanup finding=CUR-YYYYMMDD-001",
            "```",
            "",
            "## Next Decisions",
            "",
            "- Pick any High or Medium finding for cleanup draft.",
            "- Ignore Low findings unless they cluster around the same surface.",
            "- Route prompt/skill/build fixes to Agent Factory or normal Cursor implementation.",
            "",
        ]
    )
    return "\n".join(lines)


def main() -> None:
    parser = argparse.ArgumentParser(description="Audit context health for Clive Curator")
    parser.add_argument("--target", choices=sorted(TARGET_PATTERNS), default="daily")
    parser.add_argument("--checks", default=",".join(DEFAULT_CHECKS))
    parser.add_argument("--max-files", type=int, default=120)
    parser.add_argument("--max-records", type=int, default=50)
    parser.add_argument("--output-dir", default=str(DEFAULT_OUTPUT_DIR))
    parser.add_argument("--date", default=datetime.now().strftime("%Y-%m-%d"))
    args = parser.parse_args()

    checks = {item.strip() for item in args.checks.split(",") if item.strip()}
    invalid = checks.difference(DEFAULT_CHECKS)
    if invalid:
        raise SystemExit(f"Unknown checks: {', '.join(sorted(invalid))}")

    sources = collect_local_sources(args.target, args.max_files)
    airtable_sources, errors = collect_airtable_sources(args.target, args.max_records)
    sources.extend(airtable_sources)
    findings = run_checks(sources, checks)

    output_dir = Path(args.output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)
    md_path = output_dir / f"curator-audit-{args.date}.md"
    json_path = output_dir / f"curator-audit-{args.date}.json"

    payload = {
        "success": not errors,
        "target": args.target,
        "checks": sorted(checks),
        "date": args.date,
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "source_count": len(sources),
        "read_errors": errors,
        "findings": [asdict(finding) for finding in findings],
        "markdown_path": str(md_path),
    }
    md_path.write_text(markdown_report(args.target, checks, sources, findings, errors, args.date), encoding="utf-8")
    json_path.write_text(json.dumps(payload, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(json.dumps({"success": payload["success"], "markdown_path": str(md_path), "json_path": str(json_path), "findings": len(findings)}))
    if errors:
        sys.exit(1)


if __name__ == "__main__":
    main()
