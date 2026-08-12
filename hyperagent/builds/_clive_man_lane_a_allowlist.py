"""Generate frozen Lane A source_actor allowlist for Option 3 on-demand Executor."""

from __future__ import annotations

import json
from pathlib import Path

from _repo_paths import CURSOR_AGENTS_DIR, REPO_ROOT

FLEET_ROSTER_PATH = REPO_ROOT / "hyperagent" / "scripts" / "fleet_sync_roster.json"
LANE_A_HUMANS = frozenset({"Matthew", "Tara-Lee"})


def build_lane_a_allowlist() -> frozenset[str]:
    """Exact roster slugs + Cursor agent names + humans — no pattern matching."""
    roster = json.loads(FLEET_ROSTER_PATH.read_text(encoding="utf-8"))
    slugs: set[str] = set(roster.get("agents") or {})
    slugs.update(roster.get("export_aliases") or {})
    for path in CURSOR_AGENTS_DIR.glob("*.md"):
        name = path.stem
        if name.endswith("-character-knowledge-brief"):
            continue
        slugs.add(name)
    slugs.update(LANE_A_HUMANS)
    return frozenset(sorted(slugs))


def write_lane_a_allowlist_module(dest: Path) -> frozenset[str]:
    """Write governed allowlist module consumed by on-demand scripts."""
    allowlist = build_lane_a_allowlist()
    lines = [
        "#!/usr/bin/env python3",
        '"""Frozen Lane A source_actor allowlist — generated at build time; do not hand-edit."""',
        "",
        "from __future__ import annotations",
        "",
        "LANE_A_SOURCE_ACTORS = frozenset(",
        "    {",
    ]
    for slug in sorted(allowlist):
        lines.append(f'        {slug!r},')
    lines.extend(
        [
            "    }",
            ")",
            "",
        ]
    )
    dest.parent.mkdir(parents=True, exist_ok=True)
    dest.write_text("\n".join(lines) + "\n", encoding="utf-8")
    return allowlist
