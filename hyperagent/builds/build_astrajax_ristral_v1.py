#!/usr/bin/env python3
"""Build Ristral (Weekly Best-Practice Scout) v0.1 — Hyperagent twin + skill re-import.

Lane B skill re-import onto the live Monday 07:30 Europe/London kite. Cursor twins
already carry the Members overlay contract; this generator reads canonical Cursor
sources and emits HA exports without hand-editing JSON.

Trinity-cleared brief: Doc Phase A (Members overlay, Watch Roster retired) ->
Matthew approved Phase B in-thread 2026-08-20 ("approved — Hyperagent Builder,
Lane B skill re-import for Ristral Members overlay; do not delete the Monday kite").

Outputs:
- hyperagent/builds/build_astrajax_ristral_v1.py (this file)
- hyperagent/exports/skills/skill-ristral-weekly-scout-v0_1.json
- hyperagent/exports/agents/agent-ristral-v0_1.json
- agents/registry/hyperagent/astrajax/ristral/build-pack-v0.1.md

Run from repo root:
  python3 hyperagent/builds/build_astrajax_ristral_v1.py
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from _hyperagent_export import (  # noqa: E402
    agent_data,
    agent_export,
    default_tool_settings,
    embed_skill,
    exported_at_now,
    skill_data,
    skill_export,
)
from _repo_paths import (  # noqa: E402
    CURSOR_AGENTS_DIR,
    CURSOR_SKILLS_DIR,
    EXPORTS_AGENTS_DIR,
    EXPORTS_SKILLS_DIR,
    REPO_ROOT,
    registry_dir,
)

AGENT_NAME = "Ristral"
AGENT_ICON = "\U0001f985"  # eagle — Red Kite frame
AGENT_SLUG = "ristral"
SKILL_NAME = "ristral-weekly-scout"

CURSOR_SKILL_MD = CURSOR_SKILLS_DIR / "ristral-weekly-scout" / "SKILL.md"
CURSOR_SCRIPT = CURSOR_SKILLS_DIR / "ristral-weekly-scout" / "scripts" / "ristral_cursor_write.py"
CURSOR_AGENT_MD = CURSOR_AGENTS_DIR / "ristral.md"

SCHEDULED_INVOCATIONS = [
    {
        "name": "Ristral weekly scout",
        "rrule": "FREQ=WEEKLY;BYDAY=MO;BYHOUR=7;BYMINUTE=30;BYSECOND=0",
        "timezone": "Europe/London",
        "prompt": (
            "Scheduled weekly scout invocation. Execute the full per-agent sequence "
            "in ristral-weekly-scout section 7: for each Workshop Household Members "
            "overlay row where Scout Active is on, Members Status is Active, and topics "
            "are non-empty — read activity context, search that row's Trusted Sources "
            "only, judge keep/drop against Delta Format, write findings (Household "
            "Members link, not Watch Roster), project actionable rows into "
            "Recommendations (Target Agent Slug Snapshot = Members link), advance Last "
            "Scanned via ristral_cursor_write.py only, run watch pulse, write weekly "
            "digest to Household Activity Reports. Mandatory Session End and cost vs "
            "Pam B1 tripwire in digest. Never invoke Doc; never blend agents into one "
            "sweep."
        ),
    }
]

RISTRAL_CURSOR_CREDENTIAL_SCHEMA = [
    {
        "name": "RISTRAL_SCOUT_CURSOR_WRITE",
        "label": "Ristral Scout Cursor Write PAT",
        "type": "password",
        "hint": (
            "Read+write Airtable PAT scoped to Workshop base appL2fdnGmhA02WXd only. "
            "Injected as env var RISTRAL_SCOUT_CURSOR_WRITE for ristral_cursor_write.py "
            "(Last Scanned field ONLY on Household Members tblUXYgkTpbxakFjc)."
        ),
        "required": True,
    }
]

SKILL_WHEN_TO_USE = (
    "Load before any Ristral scout run — scheduled weekly (Hyperagent Monday "
    "07:30 Europe/London) or manual. Carries the operational contract, weekly-run "
    "sequence, D1 Last Scanned helper, Queue v1 Recommendations projection, and "
    "Members overlay field map. Not for agent design (Doc's Workshop), schema build "
    "(Ruth Hadley), or approving findings (Matthew's queue gate)."
)

SKILL_TAGS = ["astrajax", "ristral", "scout", "weekly", "workshop"]


def _strip_frontmatter(text: str) -> str:
    if text.startswith("---"):
        parts = text.split("---", 2)
        if len(parts) == 3:
            return parts[2].lstrip("\n")
    return text


def _parse_frontmatter(text: str) -> dict[str, str]:
    if not text.startswith("---"):
        return {}
    parts = text.split("---", 2)
    if len(parts) < 2:
        return {}
    out: dict[str, str] = {}
    for line in parts[1].splitlines():
        if ":" not in line:
            continue
        key, _, value = line.partition(":")
        out[key.strip()] = value.strip().strip(">- ").strip("'\"")
    return out


def _read_cursor_skill() -> tuple[str, str]:
    if not CURSOR_SKILL_MD.is_file():
        raise FileNotFoundError(f"Missing canonical Cursor skill: {CURSOR_SKILL_MD}")
    raw = CURSOR_SKILL_MD.read_text(encoding="utf-8")
    meta = _parse_frontmatter(raw)
    body = _strip_frontmatter(raw).rstrip("\n")
    description = meta.get("description") or (
        "Operational source of truth for Ristral (Weekly Best-Practice Scout) v0.1."
    )
    return description, body


def _read_cursor_script() -> str:
    if not CURSOR_SCRIPT.is_file():
        raise FileNotFoundError(f"Missing canonical D1 script: {CURSOR_SCRIPT}")
    return CURSOR_SCRIPT.read_text(encoding="utf-8")


def _read_system_prompt() -> str:
    if not CURSOR_AGENT_MD.is_file():
        raise FileNotFoundError(f"Missing canonical Cursor agent: {CURSOR_AGENT_MD}")
    body = _strip_frontmatter(CURSOR_AGENT_MD.read_text(encoding="utf-8")).rstrip("\n")
    # HA runtime header — body matches Cursor twin (WS-HA-007).
    if not body.startswith("# Ristral"):
        return body
    return body.replace(
        "# Ristral — Weekly Best-Practice Scout (Cursor)",
        "# Ristral — Weekly Best-Practice Scout (Hyperagent)",
        1,
    )


def _standalone_scripts() -> list[dict[str, str]]:
    content = _read_cursor_script()
    return [
        {
            "filename": "ristral_cursor_write.py",
            "content": content,
            "description": (
                "D1 structural Last Scanned cursor for Workshop Household Members "
                "overlay (tblUXYgkTpbxakFjc). Field allowlist exactly Last Scanned; "
                "preflight, write-by-field-id, readback verify, append-only change log. "
                "Credential: RISTRAL_SCOUT_CURSOR_WRITE (RunWithCredentials)."
            ),
        }
    ]


def _embedded_scripts_json() -> str:
    return json.dumps(_standalone_scripts())


def _agent_description() -> str:
    return (
        "Ristral — Weekly Best-Practice Scout (Red Kite). One focused run per Scout "
        "Active Household Member; grounded in real household activity; draft findings "
        "and Recommendations queue rows only; never edits skills or canon. Scheduled "
        "Monday 07:30 Europe/London."
    )


def _agent_tool_settings() -> dict:
    return default_tool_settings(**{"web-search": True, "execute-script": True})


def build_skill_block() -> dict:
    description, body = _read_cursor_skill()
    return skill_data(
        SKILL_NAME,
        description,
        body,
        tags=SKILL_TAGS,
        when_to_use=SKILL_WHEN_TO_USE,
        auth_type="api_key",
        credential_schema=RISTRAL_CURSOR_CREDENTIAL_SCHEMA,
        skill_md_body=body,
        scripts=_standalone_scripts(),
    )


def build() -> dict:
    exported_at = exported_at_now()
    skill_block = build_skill_block()
    embedded = embed_skill(
        {
            **skill_block,
            "scripts": _embedded_scripts_json(),
        },
        pinned=True,
    )

    standalone_skill = skill_export(dict(skill_block), exported_at=exported_at)

    agent = agent_export(
        agent_data(
            AGENT_NAME,
            _agent_description(),
            _read_system_prompt(),
            [embedded],
            icon=AGENT_ICON,
            theme_colors={"primary": "#3D2914", "accent": "#C45C26", "text": "#F5E6D3"},
            tool_settings=_agent_tool_settings(),
            allowed_integrations=["airtable"],
            model_id="claude-sonnet-5",
            max_thinking_tokens=16000,
            effort="high",
            max_budget_usd=10,
            scheduled_invocations=SCHEDULED_INVOCATIONS,
        ),
        exported_at=exported_at,
    )

    return {
        "standalone_skill": standalone_skill,
        "agent_export": agent,
        "skill_body_len": len(skill_block["skillMdBody"]),
        "script_len": len(_read_cursor_script()),
    }


BUILD_PACK = """# Ristral v0.1 — Hyperagent Build Pack (Members overlay re-import)

Generated by `hyperagent/builds/build_astrajax_ristral_v1.py`.

## Provenance

- **Lane B skill re-import** onto the live Hyperagent Ristral kite (Monday 07:30
  Europe/London). Not a new agent. Do **not** delete or recreate the live agent.
- Trinity: Doc Phase A (Members overlay, Watch Roster retired) -> Matthew approved
  Phase B in-thread 2026-08-20.
- Canonical Cursor sources (WS-HA-007 twins):
  - `.cursor/skills/ristral-weekly-scout/SKILL.md`
  - `.cursor/skills/ristral-weekly-scout/scripts/ristral_cursor_write.py`
  - `.cursor/agents/ristral.md`
  - `agents/registry/cursor/astrajax/ristral/build-pack-v0.1.md`

## What changed (Members overlay)

Fly list = Workshop **Household Members** overlay `tblUXYgkTpbxakFjc` in base
`appL2fdnGmhA02WXd`:

| Field | ID | Notes |
|---|---|---|
| Ristral Topics to Watch | `fldfFwYDqQJiu8yoN` | synced from Register |
| Trusted Sources copy | `fldcbGfG1qV3OPApY` | per-agent allowlist |
| Delta Format | `fldExN1I8xbohixfM` | hard keep/drop test |
| Scout Active | `fldG3kXqacv4zNqNa` | destination-only checkbox |
| Last Scanned | `fldguMBd0nJFC111L` | D1 helper only |
| Run gate | — | Scout Active AND Members Status = Active AND topics non-empty |

**No Watch Roster table.**

Findings `tbl3G01vlkwCwbiMF`: link **Household Members** `fldBcE3EyEOIHAvYx` only.

Recommendations `tblG8D3JGSFsx5dnV`: **Target Agent Slug Snapshot**
`fldbWMPNXPJzwpNqW` = linked Members record (array of one `rec...`). Do **not**
write lookup fields `fld3oMyPFYmdN33jk` (Base ID) or `fld4KEgRDBEBafmhw`
(Register rec).

D1 helper defaults roster table to `tblUXYgkTpbxakFjc`.

## Agent summary (repo export — live kite already exists)

| Field | Value |
|---|---|
| Name | Ristral |
| modelId | `claude-sonnet-5` |
| effort | high |
| maxThinkingTokens | 16000 |
| maxBudgetUsd | 10 (Pam B1 tripwire at USD 5.00) |
| Schedule | Mon 07:30 Europe/London (`Ristral weekly scout`) |
| skillLoadMode | preload (`ristral-weekly-scout` pinned) |

## Governed defaults checklist (as shipped)

| Setting | Value | Brief exception |
|---|---|---|
| `autoSaveMemories` / `autoSaveSkills` / `autoSaveAgents` / `autoSavePrompts` | all `false` | — |
| `enableMemorySuggestions` / `enableSkillSuggestions` / `enablePromptSuggestions` | all `false` | — |
| `skillScope` | `"selected"` | — |
| `skillLoadMode` | `"preload"` | — |
| `enableKnowledgeDiscovery` | `true` | — |
| `allowedIntegrations` | `["airtable"]` | live kite already has Airtable; scout create path |
| `web-search` | `true` | scout job (allowlisted sources) |
| `execute-script` | `true` | D1 `ristral_cursor_write.py` |
| All other toolSettings keys | `false` | — |

## Bundled skill (skill re-import target)

**ristral-weekly-scout** — full operational contract + `ristral_cursor_write.py`.
`authType: api_key` with `RISTRAL_SCOUT_CURSOR_WRITE` credential schema (Workshop
base scoped PAT). Matthew configures credential on skill in HA UI before first
Last Scanned write after import.

Household standards (`household-routing-standard`, `household-conduct-standard`,
`household-communication-standard`, `fleet-activity-logging`) remain attached on
the live kite — not re-imported by this pack.

## Matthew's import (Lane B — SKILL ONLY)

**Do not delete the live Monday kite.** Re-import skill JSON only:

1. HyperAgent UI -> Import -> `hyperagent/exports/skills/skill-ristral-weekly-scout-v0_1.json`
2. Same skill name `ristral-weekly-scout` — overwrite body + bundled script
3. Verify `/skills` -> `ristral-weekly-scout` -> script `ristral_cursor_write.py` present
4. Re-confirm credential `RISTRAL_SCOUT_CURSOR_WRITE` on the skill (UI only)
5. Verify live agent -> Skills tab still shows `ristral-weekly-scout` attached
6. **Do not** change Invocations schedule (keep Mon 07:30 Europe/London)
7. Smoke: manual thread — one Scout Active member, confirm Members overlay read +
   D1 script preflight (or paste-ready fallback if tables/creds not live)

Agent JSON (`agent-ristral-v0_1.json`) is in repo for first-time/recovery import only.
**Not** required for this overlay refresh.

## Export paths

- Skill (re-import this): `hyperagent/exports/skills/skill-ristral-weekly-scout-v0_1.json`
- Agent (reference): `hyperagent/exports/agents/agent-ristral-v0_1.json`
- Registry: this file
- Cursor twin: `agents/registry/cursor/astrajax/ristral/build-pack-v0.1.md`

## Regenerate

```bash
python3 hyperagent/builds/build_astrajax_ristral_v1.py
python3 hyperagent/scripts/validate_hyperagent_export.py hyperagent/exports/skills/skill-ristral-weekly-scout-v0_1.json
python3 hyperagent/scripts/validate_hyperagent_export.py hyperagent/exports/agents/agent-ristral-v0_1.json
python3 hyperagent/scripts/handoff_hyperagent_export.py hyperagent/exports/skills/skill-ristral-weekly-scout-v0_1.json
```

## Honest gaps

- `RISTRAL_SCOUT_CHANGE_LOG_TABLE_ID` still required for live Last Scanned writes
  (Ruth build); helper fails safely until configured.
- Workshop create-only writes (Scout Reports, Recommendations) use the live kite's
  existing Airtable integration — not re-wired in this skill re-import.
"""


def write(path: Path, content: str) -> Path:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content.rstrip() + "\n", encoding="utf-8")
    return path


def main() -> None:
    result = build()
    skill_out = EXPORTS_SKILLS_DIR / "skill-ristral-weekly-scout-v0_1.json"
    agent_out = EXPORTS_AGENTS_DIR / "agent-ristral-v0_1.json"
    pack_out = registry_dir("hyperagent", "astrajax", "ristral") / "build-pack-v0.1.md"

    skill_out.parent.mkdir(parents=True, exist_ok=True)
    skill_out.write_text(
        json.dumps(result["standalone_skill"], indent=2, ensure_ascii=False) + "\n",
        encoding="utf-8",
    )
    agent_out.write_text(
        json.dumps(result["agent_export"], indent=2, ensure_ascii=False) + "\n",
        encoding="utf-8",
    )
    write(pack_out, BUILD_PACK)

    json.loads(skill_out.read_text(encoding="utf-8"))
    json.loads(agent_out.read_text(encoding="utf-8"))

    for path in (skill_out, agent_out, pack_out):
        print(f"Wrote {path.relative_to(REPO_ROOT)}")

    print(
        "Source sync: skill body "
        f"{result['skill_body_len']} chars, script {result['script_len']} chars "
        f"from {CURSOR_SKILL_MD.relative_to(REPO_ROOT)}"
    )


if __name__ == "__main__":
    main()
