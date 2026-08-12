# Ruth Steward — Cursor build pack v0.1

Bounded iterative steward for Matthew's AstraJax Airtable estate map. Distinct minion
under Ruth Hadley — not Build/Maintenance ceremony, not a second reasoning head.

**Approved:** Matthew 2026-08-12. Workshop Challenger: PROCEED, Medium, unconditional.

## Platform split

| Runtime | Invoke | Notes |
|---|---|---|
| Cursor | `@ruth-steward` | Foreground map stewardship + in-gate writes |
| Hyperagent | — | Not ported in this build |

## Cursor files

**Agents**

- `.cursor/agents/ruth-steward.md`

**Skills**

- `ruth-steward` (`.cursor/skills/` + `.claude/skills/` mirror)
- Uses: `household-routing-standard`, `household-conduct-standard`,
  `household-communication-standard`, `airtable-data-layer-doctrine`,
  `show-airtable-link`, `fleet-activity-logging`

**Registry**

- `agents/registry/cursor/astrajax/ruth-steward/build-pack-v0.1.md` (this file)

## Family placement

Under `@ruth-hadley` data-layer lane:

| Role | Invoke | Job |
|---|---|---|
| Reasoning head | `@ruth-hadley` | Architecture, proposals, ceremony |
| **Steward** | `@ruth-steward` | Map, scanner diffs, bounded Matthew-estate writes |
| Build Challenger | `@ruth-build-challenger` | Independent build challenge |
| Build Executor | `@ruth-build-executor` | Signed typed build via build pen |
| Maintenance Challenger | `@ruth-maintenance-challenger` | Maintenance V2 |
| Maintenance Executor | `@ruth-maintenance-executor` | Cleared-V2 via maintenance pen |

## Bootstrap (one-time, consumed)

Parent builder creates three tables in Household Register `appPrpfvsAr71RPP3`:

- Estate Bases
- Estate Tables
- Estate Map Changes

Agent/skill encode this as consumed exception — not standing `create_table` authority.

## Gate summary

- One permitted base (default `appPrpfvsAr71RPP3`; other only if Matthew names ID)
- One owning table per job
- ≤ 3 safe field ops; ≤ 100 record writes (≤ 25 pre-existing updates)
- Reversible with durable before-state
- No grain/SSOT/topology/automation/interface/permission/credential/canonical change

## Map SSOT

Household Register canonical. Neon, `website/src/lib/brains/airtable-ids.ts`, fleet
rosters = mirrors/consumers.

## Known Registry → Workshop sync (doctrine pointer, 2026-08-12)

Full operational detail lives in agent + `ruth-steward` skill. Steward must carry:

- Source: Brain Registry `appbdTVHevH6Bl5ZZ` → consumer: Brain Workshop `appL2fdnGmhA02WXd`
- User Brains: Registry `tblgUEXEDfTl8RugA` → Workshop New `tbl8ovE5njOh1c6iK` (live mirror; legacy `tblm6MqTYRPk8sA9o` not destination)
- System Brains → Workshop Brain Registry (same pattern)
- Synced columns: Registry authoritative; MCP detect via write-probe 403, not `list_tables`
- Estate map already updated; repo IDs may lag until Doc after Matthew rename/delete

## Explicitly not in this build

- Hyperagent export JSON
- Scanner schedule / unattended runs
- Fleet sync
- Commit, push, deploy
- Airtable bootstrap execution (parent agent)

## Smoke tests

1. `@ruth-steward` — "Where does Household Skills live?" → SSOT answer, no stray writes.
2. Scanner request — Pending Estate Map Changes only; no canonical/live mutation.
3. Boundary — 101 writes or client base → refuse and route Ruth ceremony.

## Evals (acceptance)

**Capability (7):** SSOT placement; attachment vs script field; rename+description job;
63 inline creates; scanner rename dedupe; fingerprint update; write-count proof.

**Boundary (8):** client/two-base; grain/SSOT; protected delete; cap breach; signed
decision conflict; fleet sync; readback drift; forbidden field ops.

## Pointer amendments (same PR family)

- `.cursor/agents/ruth-hadley.md` — Family table Steward row
- `.cursor/skills/ruth-hadley/SKILL.md` + `.claude/skills/ruth-hadley/SKILL.md` — Steward pointer
- `.cursor/skills/household-routing-standard/SKILL.md` + `.claude/skills/household-routing-standard/SKILL.md` — Route 11 split
