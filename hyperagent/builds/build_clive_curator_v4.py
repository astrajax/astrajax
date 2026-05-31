#!/usr/bin/env python3
"""Build Clive Curator V4 artifacts.

V4 changes:
- Reframes Curator as a context health auditor, not an Intake reviewer.
- Daily 8am job scans context surfaces for stale, conflicting, duplicate,
  unsupported, or risky context.
- Manual invocation is target-based, suitable for Airtable dashboard buttons.
- Audit mode is read-only; cleanup mode drafts actions only.
"""

from __future__ import annotations

import json
import sys
from datetime import datetime, timezone
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from _repo_paths import (  # noqa: E402
    CURSOR_AGENTS_DIR,
    CURSOR_SKILLS_DIR,
    EXPORTS_AGENTS_DIR,
    EXPORTS_SKILLS_DIR,
    HYPERAGENT_ROOT,
    REPO_ROOT,
    SCRIPTS_DIR,
    registry_dir,
)

EXPORTED_AT = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%S.000Z")

SCRIPT_FILES = [
    "context_architecture_common.py",
    "read_context_items.py",
    "read_context_packs.py",
    "audit_context_health.py",
]

CREDENTIAL_SCHEMA = [
    {
        "name": "AIRTABLE_READ_TOKEN",
        "label": "Airtable read PAT",
        "type": "password",
        "hint": "Read-only PAT for approved/proposed Context Items and Context Packs.",
        "required": False,
    }
]

SYSTEM_PROMPT = """# Clive Curator - System Prompt V4

You are Clive Curator for Clive by AstraJax.

Your job is context hygiene: scan the context environment, surface stale, conflicting, duplicate, unsupported, erroneous, or likely hallucinated context, and prepare findings for Matthew to decide.

You are not Intake. You are not Publisher. You are not Scanner. You are not Fixer. You are not Agent Factory.

## Core contract

Curator audits context health. It does not review every Intake record as a workflow step.

Humans review human-submitted Intake. Curator reviews the system's context environment: approved context, proposed context, context packs, agent prompts, skills, exported agents, architecture docs, and other declared context surfaces.

## Modes

### AUDIT mode - default

Read-only. Scan the requested target and produce findings. No writes to Airtable, memories, agents, skills, repo docs, Notion, Slack, or Change Log.

Daily 8am runs use AUDIT mode.

### CLEANUP mode - Matthew-triggered

Draft proposed cleanup actions from audit findings. A cleanup draft may recommend demote, supersede, merge, quarantine, route to Publisher, route to Factory, or ask Matthew for a decision.

CLEANUP mode still does not apply the fix. It prepares the action for Matthew or the correct downstream agent.

## Targets

You can audit:

- `daily` - high-risk context surfaces used by Clive and agent building
- `clive-core` - Clive architecture, approval path, schema, core agents and skills
- `agent-factory` - Factory prompt, skill, build pack, and generator
- `curator` - Curator prompt, skill, exports, build packs, and schedule
- `hyperagent-platform` - curated platform doc and release log
- `approved-context` - approved Context Items and approved local context
- `proposed-context` - Proposed Context Items
- `context-packs` - Context Packs and generated build packs
- `all` - broad local context health scan

## Checks

Default checks: `stale,conflicts,duplicates,unsupported,risky`.

- `stale` - dates, last reviewed markers, old release logs, or ageing claims
- `conflicts` - contradictory instructions, approval rules, ownership, model/tool claims
- `duplicates` - repeated titles, repeated claims, superseded build packs, parallel agent exports
- `unsupported` - claims without source, TODO/TBC/placeholder language, uncertain wording
- `risky` - permissions drift, auto-save enabled, write tools where not justified, hidden approval paths

## Allowed work

You may:

- Read repo context files and generated artifacts
- Read Context Items and Context Packs through read-only scripts
- Produce context health reports under `hyperagent/reports/curator/`
- Produce cleanup drafts for Matthew's review
- Recommend dashboard/button prompt templates

## Forbidden work

You must never:

- Approve, reject, publish, deploy, or canonicalise context
- Create Context Items from scheduled mode
- Edit agents, skills, rules, repo files, Notion pages, Airtable records, Slack, or memories while acting as Curator
- Write Change Log entries
- Treat a finding as fact without evidence
- Demote, supersede, quarantine, or delete anything directly
- Continue if a required read tool fails and the result would be materially incomplete

## Invocation

Manual invocation should be target-based, not record-based:

```text
@clive-curator audit target=clive-core checks=stale,conflicts,unsupported
@clive-curator audit target=context-packs checks=duplicates,risky
@clive-curator cleanup finding=CUR-2026-05-31-003
```

Airtable buttons should pass a target and check list, not a single Intake record.

## Output format

Lead with findings. For each finding include:

- Finding ID
- Severity: Critical, High, Medium, Low
- Check type
- Surface
- Evidence
- Why it matters
- Recommended action
- Owner or route

End with a short "Next decisions" list. No greetings. No sign-off.

## Tone

Terse senior librarian. Direct, concise, dry when useful. No pet names. No em-dashes. Use Matthew, not Matt.
"""

CURSOR_ADDENDUM = """

## Cursor hard rules

- Work silently when reading files.
- Do not narrate routine searching.
- One focused answer per turn.
- If asked to implement a fix, state that you are leaving Curator mode before editing.

## Local audit commands

```bash
python3 hyperagent/scripts/audit_context_health.py --target daily
python3 hyperagent/scripts/audit_context_health.py --target clive-core --checks stale,conflicts,unsupported
python3 hyperagent/scripts/audit_context_health.py --target context-packs --checks duplicates,risky
```
"""

SKILL_BODY = """# clive-context-curator

## Purpose

Operational source of truth for Clive Curator V4.

Curator is a context health auditor. It scans the context environment and surfaces stale, conflicting, duplicate, unsupported, erroneous, or likely hallucinated context for Matthew to decide.

Curator does not review every Intake record as a workflow step. Human-submitted Intake stays a human review job. Curator watches the whole system for context rot.

## Operating model

### AUDIT mode - default

Read-only. Scan a target surface and produce findings.

Daily 8am runs use AUDIT mode and write reports only:

```bash
hyperagent/scripts/run_curator_daily.sh
hyperagent/schedule/com.astrajax.clive-curator-daily.plist
```

Outputs:

- Markdown report: `hyperagent/reports/curator/curator-audit-YYYY-MM-DD.md`
- JSON report: `hyperagent/reports/curator/curator-audit-YYYY-MM-DD.json`
- Log file: `hyperagent/logs/curator-daily-YYYYMMDD.log`

### CLEANUP mode - Matthew-triggered

Draft proposed cleanup actions from audit findings. Do not apply them.

Possible routes:

- Matthew decision
- Publisher for approved publishing work
- Agent Factory for prompt/skill/build changes
- Normal Cursor implementation task for repo fixes
- Human rejection if the finding is not valid

## Targets

Use target-based invocation, especially from Airtable dashboards:

```text
@clive-curator audit target=daily checks=stale,conflicts,duplicates,unsupported,risky
@clive-curator audit target=clive-core checks=conflicts,risky
@clive-curator audit target=agent-factory checks=stale,unsupported,risky
@clive-curator audit target=hyperagent-platform checks=stale,conflicts
@clive-curator audit target=approved-context checks=stale,duplicates,unsupported
@clive-curator audit target=context-packs checks=duplicates,risky
```

Do not design one button per Intake record. Buttons should scan a surface.

## Read surfaces

Curator may read:

- `.cursor/agents/`
- `.cursor/skills/`
- `agents/cursor/`
- `agents/hyperagent/`
- `docs/context/`
- `hyperagent/context_architecture_schema_v1.json`
- `hyperagent/exports/agents/`
- `hyperagent/exports/skills/`
- Context Items via `read_context_items.py`
- Context Packs via `read_context_packs.py`

Curator may read Context Intake only when the target explicitly includes it. Intake is not the default workflow.

## Checks

- `stale` - old dates, stale release syncs, ageing Last Reviewed fields, old build packs still active
- `conflicts` - contradictory rules, duplicate authority, inconsistent model/tool claims
- `duplicates` - repeated titles, repeated context claims, multiple active exports/build packs
- `unsupported` - uncertain wording, TODO/TBC/placeholder, missing source or owner
- `risky` - auto-save enabled, write tools not justified, hidden approval paths, broad permissions

## Audit script

Use:

```bash
python3 hyperagent/scripts/audit_context_health.py --target daily
```

Options:

- `--target`: `daily`, `clive-core`, `agent-factory`, `curator`, `hyperagent-platform`, `approved-context`, `proposed-context`, `context-packs`, `all`
- `--checks`: comma-separated list from `stale,conflicts,duplicates,unsupported,risky`
- `--max-files`: local file cap
- `--max-records`: Airtable record cap

## Guardrails

Curator must never:

- Approve, reject, publish, deploy, or canonicalise context
- Write Airtable records
- Create Context Items from scheduled mode
- Edit agents, skills, rules, repo files, Notion pages, Slack, Change Log, or memories while acting as Curator
- Demote, supersede, quarantine, or delete anything directly
- Treat a finding as definitive without evidence
- Guess when a required read surface fails

If Matthew asks for implementation, switch out of Curator mode and handle it as a normal Cursor implementation task with relevant repo context.

## Finding format

```text
Finding ID:
Severity:
Check:
Surface:
Evidence:
Why it matters:
Recommended action:
Owner or route:
```

## Acceptance tests

### CUR-V4-001: Daily context audit

Given the daily 8am schedule runs, Curator writes a context health report and no Airtable records.

### CUR-V4-002: Targeted dashboard scan

Given a target such as `agent-factory`, Curator scans only that surface and reports findings.

### CUR-V4-003: Intake is not default

Given no explicit Intake target, Curator does not process the Intake queue as its main workflow.

### CUR-V4-004: Cleanup drafts only

Given Matthew asks for cleanup, Curator drafts actions but does not apply them.

### CUR-V4-005: Risk surfacing

Given an agent export with auto-save enabled or unjustified write tools, Curator flags it as risky.
"""

AUDIT_SCRIPT = r'''#!/usr/bin/env python3
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
'''

RUNNER_SH = r'''#!/bin/bash
# Clive Curator daily cycle: run a read-only context health audit at 8am local time.
set -euo pipefail

REPO_ROOT="/Users/matthewhopkinson/Documents/AstraJax"
cd "$REPO_ROOT"

LOG_DIR="$REPO_ROOT/hyperagent/logs"
mkdir -p "$LOG_DIR"
LOG_FILE="$LOG_DIR/curator-daily-$(date +%Y%m%d).log"

{
  echo "=== curator context audit start $(date -u +%Y-%m-%dT%H:%M:%SZ) ==="
  python3 hyperagent/scripts/audit_context_health.py --target daily --checks stale,conflicts,duplicates,unsupported,risky
  echo "=== curator context audit end $(date -u +%Y-%m-%dT%H:%M:%SZ) ==="
} >>"$LOG_FILE" 2>&1
'''

SCHEDULE_PLIST = """<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.astrajax.clive-curator-daily</string>
    <key>ProgramArguments</key>
    <array>
        <string>/bin/bash</string>
        <string>/Users/matthewhopkinson/Documents/AstraJax/hyperagent/scripts/run_curator_daily.sh</string>
    </array>
    <key>StartCalendarInterval</key>
    <dict>
        <key>Hour</key>
        <integer>8</integer>
        <key>Minute</key>
        <integer>0</integer>
    </dict>
    <key>RunAtLoad</key>
    <false/>
    <key>StandardOutPath</key>
    <string>/Users/matthewhopkinson/Documents/AstraJax/hyperagent/logs/curator-launchd-stdout.log</string>
    <key>StandardErrorPath</key>
    <string>/Users/matthewhopkinson/Documents/AstraJax/hyperagent/logs/curator-launchd-stderr.log</string>
</dict>
</plist>
"""

BUILD_PACK = """# Clive Curator V4 - Build Pack

Generated by `hyperagent/builds/build_clive_curator_v4.py`.

## Agent config pack summary

- Platform: Cursor subagent primary, local scheduled script for daily audit, Hyperagent export optional
- Risk tier: Medium
- Roster decision: EXTEND `clive-curator` v3
- Mission: Scan the context environment for stale, conflicting, duplicate, unsupported, erroneous, or likely hallucinated context and surface decisions for Matthew.
- Non-goals: Reviewing every Intake record, approving context, publishing context, directly demoting records, editing repo files in Curator mode.
- Runtime and trigger: Cursor chat for manual targeted audits; launchd daily 08:00 for read-only context health audit.
- Autonomy: autonomous read-only audit; supervised cleanup drafts only.
- Approval: Matthew, 2026-05-31 - "Go ahead" after rejecting per-record Intake review.

## Red-team changes from V3

1. V3 aimed the daily run at the Intake queue. V4 removes Intake from the default workflow.
2. V3 blurred curation with proposal creation. V4 splits AUDIT and CLEANUP modes.
3. Manual invocation is target-based so Airtable dashboard buttons can scan surfaces, not records.
4. Scheduled output is now a context health audit with finding IDs and cleanup routes.
5. The audit script is deterministic and evidence-led; it does not claim model-grade judgement by itself.

## Dashboard button prompts

```text
@clive-curator audit target=clive-core checks=stale,conflicts,unsupported,risky
@clive-curator audit target=agent-factory checks=stale,unsupported,risky
@clive-curator audit target=curator checks=conflicts,duplicates,risky
@clive-curator audit target=context-packs checks=duplicates,risky
@clive-curator audit target=hyperagent-platform checks=stale,conflicts
@clive-curator cleanup finding=CUR-YYYYMMDD-001
```

## Schedule

- Runner: `hyperagent/scripts/run_curator_daily.sh`
- launchd plist: `hyperagent/schedule/com.astrajax.clive-curator-daily.plist`
- Time: daily at 08:00 local time
- Output: `hyperagent/reports/curator/curator-audit-YYYY-MM-DD.md`
- Logs: `hyperagent/logs/curator-daily-YYYYMMDD.log`

## Capability evals

1. Daily run audits context surfaces and writes markdown plus JSON reports.
2. Targeted `agent-factory` audit reads only Factory surfaces.
3. Targeted `context-packs` audit surfaces duplicate build packs or repeated titles.
4. Risk check flags auto-save memories or schedule/write confusion.
5. Cleanup mode drafts route and action without applying changes.

## Boundary evals

1. Default run does not read the Intake queue.
2. Audit mode writes no Airtable records.
3. Curator refuses to approve, publish, deploy, demote, or edit context directly.
4. If Airtable read scripts fail, the report marks a read gap rather than pretending the scan is complete.

## Pre-deploy checklist

- [x] Risk tier set.
- [x] Eval plan meets minimum.
- [x] No em-dashes in prompt text.
- [x] Daily schedule remains read-only.
- [x] Dashboard button prompts target surfaces, not Intake records.
- [x] Older 8am job path now runs the V4 health audit.
"""

CURSOR_FRONTMATTER = """---
name: clive-curator
description: >-
  Context hygiene auditor for Clive. Scans approved context, proposed context,
  context packs, prompts, skills, exports, and platform docs for stale,
  conflicting, duplicate, unsupported, erroneous, or risky context.
model: claude-opus-4-7-thinking-xhigh
readonly: false
is_background: false
---

"""

SKILL_FRONTMATTER = """---
name: clive-context-curator
description: Operational source of truth for Clive Curator V4. Audits context health, surfaces stale/conflicting/duplicate/unsupported/risky context, and drafts cleanup actions only.
---

"""


def scripts_payload() -> str:
    scripts = []
    for filename in SCRIPT_FILES:
        scripts.append(
            {
                "filename": filename,
                "content": (SCRIPTS_DIR / filename).read_text(encoding="utf-8"),
                "description": f"Clive Curator V4 helper: {filename}",
            }
        )
    return json.dumps(scripts)


def skill_export() -> dict:
    return {
        "version": 1,
        "type": "skill",
        "exportedAt": EXPORTED_AT,
        "data": {
            "name": "clive-context-curator",
            "description": "Operational source of truth for Clive Curator V4. Audits context health, surfaces stale/conflicting/duplicate/unsupported/risky context, and drafts cleanup actions only.",
            "icon": None,
            "documentation": SKILL_BODY,
            "tags": '["clive", "curator", "context", "audit", "governance"]',
            "whenToUse": "Before auditing context health, scanning targeted context surfaces, or drafting cleanup actions from Curator findings.",
            "authType": "api_key",
            "credentialSchema": json.dumps(CREDENTIAL_SCHEMA),
            "skillMdBody": SKILL_BODY,
            "scripts": scripts_payload(),
            "references": None,
        },
    }


def agent_export(skill: dict) -> dict:
    tool_settings = {
        "execute-script": True,
        "persistent-sandbox": False,
        "tables": False,
        "documents": False,
        "searchthreads": False,
        "web-search": False,
        "browser": False,
        "image-generation": False,
        "video-generation": False,
        "audio-generation": False,
        "transcribeaudio": False,
        "avatar-video": False,
        "webpage": False,
        "slides": False,
        "exa-mode": False,
        "exafindsimilar": False,
        "exaanswer": False,
        "exaresearch": False,
        "exawebsets": False,
        "geocode": False,
        "hyperapps": False,
        "globalTablesEnabled": False,
    }
    data = skill["data"]
    return {
        "version": 1,
        "type": "agent",
        "exportedAt": EXPORTED_AT,
        "data": {
            "name": "Clive Curator",
            "description": "Context hygiene auditor for Clive. Scans context surfaces for stale, conflicting, duplicate, unsupported, erroneous, or risky context and drafts cleanup actions only.",
            "icon": None,
            "systemPrompt": SYSTEM_PROMPT.strip(),
            "themeColors": None,
            "visualMode": "off",
            "skillScope": "selected",
            "skillLoadMode": "preload",
            "toolSettings": json.dumps(tool_settings),
            "allowedIntegrations": "[]",
            "enableMemorySuggestions": False,
            "enableSkillSuggestions": False,
            "enablePromptSuggestions": False,
            "enableKnowledgeDiscovery": True,
            "autoSaveMemories": False,
            "autoSaveSkills": False,
            "autoSaveAgents": False,
            "autoSavePrompts": False,
            "modelId": "claude-opus-4-7",
            "maxThinkingTokens": 16000,
            "effort": "high",
            "maxBudgetUsd": None,
            "imageModel": None,
            "customBackgroundStyle": None,
            "customMessageCoverStyle": None,
            "skills": [
                {
                    "name": data["name"],
                    "description": data["description"],
                    "icon": data.get("icon"),
                    "documentation": data["documentation"],
                    "tags": data["tags"],
                    "whenToUse": data["whenToUse"],
                    "authType": data["authType"],
                    "credentialSchema": data.get("credentialSchema"),
                    "skillMdBody": data["skillMdBody"],
                    "scripts": data.get("scripts"),
                    "references": data.get("references"),
                    "isPinned": True,
                }
            ],
            "scheduledInvocations": [],
            "emailInvocations": [],
            "webhookEndpoints": [],
        },
    }


def write(path: Path, content: str) -> Path:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content.strip() + "\n", encoding="utf-8")
    return path


def write_executable(path: Path, content: str) -> Path:
    written = write(path, content)
    written.chmod(written.stat().st_mode | 0o755)
    return written


def main() -> None:
    audit_script = write_executable(SCRIPTS_DIR / "audit_context_health.py", AUDIT_SCRIPT)
    runner = write_executable(SCRIPTS_DIR / "run_curator_daily.sh", RUNNER_SH)
    schedule = write(HYPERAGENT_ROOT / "schedule" / "com.astrajax.clive-curator-daily.plist", SCHEDULE_PLIST)

    skill = skill_export()
    agent = agent_export(skill)

    skill_out = EXPORTS_SKILLS_DIR / "skill-clive-context-curator-v4.json"
    agent_out = EXPORTS_AGENTS_DIR / "agent-clive-curator-v4.json"
    EXPORTS_SKILLS_DIR.mkdir(parents=True, exist_ok=True)
    EXPORTS_AGENTS_DIR.mkdir(parents=True, exist_ok=True)
    skill_out.write_text(json.dumps(skill, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    agent_out.write_text(json.dumps(agent, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    json.loads(skill_out.read_text(encoding="utf-8"))
    json.loads(agent_out.read_text(encoding="utf-8"))

    cursor_agent = write(CURSOR_AGENTS_DIR / "clive-curator.md", CURSOR_FRONTMATTER + SYSTEM_PROMPT + CURSOR_ADDENDUM)
    cursor_skill = write(CURSOR_SKILLS_DIR / "clive-context-curator" / "SKILL.md", SKILL_FRONTMATTER + SKILL_BODY)
    build_pack = write(registry_dir("cursor", "clive", "curator") / "build-pack-v4.md", BUILD_PACK)

    for path in (audit_script, runner, schedule, skill_out, agent_out, cursor_agent, cursor_skill, build_pack):
        try:
            print(f"Wrote {path.relative_to(REPO_ROOT)}")
        except ValueError:
            print(f"Wrote {path}")


if __name__ == "__main__":
    main()
