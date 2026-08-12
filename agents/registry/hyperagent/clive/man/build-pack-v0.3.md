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
python3 hyperagent/builds/build_clive_man_family_v0_4.py --fixture-approved  # offline tests only
```

Persona gate: `recSKTT8NTTJOmuRu` / `Operational v0.4` — fail-closed until Approved.

## Superseded

v0_1 family exports and generators archived under `hyperagent/exports/archive/` and
`hyperagent/builds/archive/`. Do not import v0_1 alongside v0_4.

## Tests

Offline behavioural coverage (Aug 2026 Phase B + hardening pass):

| Suite | File | Count |
|-------|------|------:|
| CM-HA contract | `scripts/test_clive_man_hyperagent_v0_4.py` | 50 |
| Seam chain (mocked Airtable) | `scripts/test_clive_man_seam_v0_4.py` | 26 |
| Executable scripts | `scripts/test_clive_man_hyperagent_v0_4_executable.py` | 17 |
| Hardening pass | `scripts/test_clive_man_hardening_v0_4.py` | 25 |
| Context Challenger specialist | `…/context-estate-challenge/test_challenger.py` | 25 |
| Context Auditor specialist | `…/context-estate-audit-propose/test_auditor.py` | 53 |
| Context Executor specialist | `…/context-amendment-execute/test_executor.py` | 34 |
| **Total** | | **230** |

**Household Routing Standard:** family v0_4 exports embed Option 3 body from
`.claude/skills/household-routing-standard/SKILL.md`. Standalone export
`hyperagent/exports/skills/skill-household-routing-standard-v0_1.json` remains legacy
Hyperagent Route 1 — not updated by this family build.

Run (fixture exports regenerated in CM-HA `setUpModule`):

```bash
python3 scripts/test_clive_man_hyperagent_v0_4.py
python3 scripts/test_clive_man_seam_v0_4.py
python3 scripts/test_clive_man_hyperagent_v0_4_executable.py
python3 scripts/test_clive_man_hardening_v0_4.py
python3 hyperagent/builds/sources/clive-man-v0_4/specialists/*/test_*.py
```

**Not claimed:** live Airtable integration, Hyperagent import, or schedule enablement — Persona v0.4 remains Pending.

## Observed live evidence

`observed-live/2026-08-12/` — hashed uploads from Matthew's session. Provenance gap:
historical daily brief not in upload set.

## Remaining human gates

1. Matthew approves Persona v0.4 in Airtable
2. Ruth checkpoint store (`PENDING_RUTH_CHECKPOINT_STORE`)
3. Matthew UI verification before enabling Ambient 05:00 schedule
