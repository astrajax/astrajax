# Clive's Man Hyperagent — Build Pack v0.3 (Context Flow)

**Hyperagent Builder Phase B — 12 Aug 2026.** Mirrors Cursor pack
`agents/registry/cursor/clive/clive-man/build-pack-v0.3.md`.

## Scope

Eight on-platform agents + seven standalone skills (Ambient intake skill embedded only):

| Export | Role |
|--------|------|
| `agent-clive-man-v0_4.json` | Head steward |
| `agent-clive-man-proposer-v0_4.json` | On-demand Lane B Proposer |
| `agent-clive-man-challenger-v0_4.json` | On-demand Lane B Challenger |
| `agent-clive-man-executor-v0_4.json` | On-demand Lane A/B Executor |
| `agent-clive-man-ambient-capture-v0_4.json` | Ambient intake (05:00 disabled) |
| `agent-clive-man-context-auditor-v0_4.json` | 06:00 |
| `agent-clive-man-context-challenger-v0_4.json` | 07:00 |
| `agent-clive-man-context-executor-v0_4.json` | 08:00 |

Standalone skills: head + Trinity minions + three context specialists (no standalone Ambient skill).

## Generator

```bash
python3 hyperagent/builds/build_clive_man_family_v0_4.py --pin-persona "Operational v0.4"
python3 hyperagent/builds/build_clive_man_family_v0_4.py --verify-pending-gate
python3 hyperagent/builds/build_clive_man_family_v0_4.py --fixture-approved --output-root /tmp/clive-man-fixture-exports  # offline tests only
```

Persona gate: `recSKTT8NTTJOmuRu` / `Operational v0.4` — **Approved** (12 Aug 2026).

Approved mirror: `agents/registry/cursor/clive/clive-man/persona-config.approved-v0.4.json`
Persona bundle sha256: `d78475e7b9ebd973a116725dab79d41a4ba12c27231070cb6167b13b0ce16a73`

```bash
python3 hyperagent/builds/build_clive_man_family_v0_4.py --approved-source-file agents/registry/cursor/clive/clive-man/persona-config.approved-v0.4.json
python3 scripts/generate_persona_config_sync.py --agent clive-man --approved-source-file agents/registry/cursor/clive/clive-man/persona-config.approved-v0.4.json
```

Live Airtable pin remains preferred when a token exists. Snapshot fallback is explicit only.

## Superseded

v0_1 family exports and generators archived under `hyperagent/exports/archive/` and
`hyperagent/builds/archive/`. Do not import v0_1 alongside v0_4.

## Tests

Offline behavioural coverage (Aug 2026 Phase B + hardening pass):

| Suite | File | Count |
|-------|------|------:|
| CM-HA contract | `scripts/test_clive_man_hyperagent_v0_4.py` | 53 |
| Seam chain (mocked Airtable) | `scripts/test_clive_man_seam_v0_4.py` | 26 |
| Executable scripts | `scripts/test_clive_man_hyperagent_v0_4_executable.py` | 17 |
| Hardening pass | `scripts/test_clive_man_hardening_v0_4.py` | 25 |
| Approved snapshot | `scripts/test_clive_man_approved_persona_source.py` | 8 |
| Context Challenger specialist | `…/context-estate-challenge/test_challenger.py` | 25 |
| Context Auditor specialist | `…/context-estate-audit-propose/test_auditor.py` | 53 |
| Context Executor specialist | `…/context-amendment-execute/test_executor.py` | 34 |
| Checkpoint append (mocked) | `scripts/test_clive_man_checkpoint_append.py` | 21 |
| **Total** | | **262** |

**Household Routing Standard:** family v0_4 exports embed Option 3 body from
`.claude/skills/household-routing-standard/SKILL.md`. Standalone export
`hyperagent/exports/skills/skill-household-routing-standard-v0_1.json` remains legacy
Hyperagent Route 1 — not updated by this family build.

Run (production exports active in `hyperagent/exports/`):

```bash
python3 scripts/test_clive_man_hyperagent_v0_4.py
python3 scripts/test_clive_man_seam_v0_4.py
python3 scripts/test_clive_man_hyperagent_v0_4_executable.py
python3 scripts/test_clive_man_hardening_v0_4.py
python3 scripts/test_clive_man_approved_persona_source.py
python3 scripts/test_clive_man_checkpoint_append.py
python3 hyperagent/builds/sources/clive-man-v0_4/specialists/*/test_*.py
```

**Not claimed:** live Hyperagent import or 05:00 schedule enablement — Ruth checkpoint + UI verification still blocked.

## Handoff cards (12 Aug 2026 — validation OK, not imported)

All eight agent exports passed `validate_hyperagent_export.py` and `handoff_hyperagent_export.py`:

| Export | Credentials owed |
|--------|------------------|
| `agent-clive-man-v0_4.json` | yes (skill UI) |
| `agent-clive-man-proposer-v0_4.json` | yes |
| `agent-clive-man-challenger-v0_4.json` | yes |
| `agent-clive-man-executor-v0_4.json` | yes |
| `agent-clive-man-ambient-capture-v0_4.json` | yes |
| `agent-clive-man-context-auditor-v0_4.json` | no |
| `agent-clive-man-context-challenger-v0_4.json` | no |
| `agent-clive-man-context-executor-v0_4.json` | no |

Production exports remain **active** in `hyperagent/exports/` (not fixture-deleted).

## Observed live evidence

`observed-live/2026-08-12/` — hashed uploads from Matthew's session. Provenance gap:
historical daily brief not in upload set.

## Remaining human gates

1. Ruth checkpoint schema resolved (`tblRbjD0PHtuTWsIL`); activation blocked on `AMBIENT_CHECKPOINT_APPEND` not minted, boundary, UI verify
2. Matthew UI verification before enabling Ambient 05:00 schedule
3. Hyperagent UI import (handoff cards ready — not performed in repo)
4. v0.3 rollback available until one full v0.4 cycle succeeds
