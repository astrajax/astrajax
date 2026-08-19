# Ruth Steward — Cursor build pack v0.2

Confident Airtable worker for named jobs on Matthew's AstraJax estate. Distinct minion
under Ruth Hadley — not Build/Maintenance ceremony, not a second reasoning head.

**Approved:** Matthew 2026-08-19 ("Build it"). Workshop Challenger: **PROCEED**, High tier.

**Supersedes:** v0.1 cap-bound model. v0.1 remains historical reference only.

## What changed (v0.1 → v0.2)

| v0.1 | v0.2 |
|---|---|
| Bounded gate (one base, one table, ≤3 fields, ≤100 writes) | **Caps removed** — Execute vs Route split |
| Four allowed field ops | Full field ops including type change and computed |
| Post-bootstrap `create_table` kill | `create_table` / `create_base` allowed (workspace rule for bases) |
| Exact gate table | 11 hard stops |
| Model implicit | `cursor-grok-4.6-high-fast` (first-party pool) |

## Platform split

| Runtime | Invoke | Notes |
|---|---|---|
| Cursor | `@ruth-steward` | Foreground named Matthew-estate schema/data + map logging |
| Hyperagent | — | Not ported |

## Cursor files

**Agents**

- `.cursor/agents/ruth-steward.md`

**Skills**

- `ruth-steward` (`.cursor/skills/` + `.claude/skills/` mirror)
- Uses: `household-routing-standard`, `household-conduct-standard`,
  `household-communication-standard`, `airtable-data-layer-doctrine`,
  `show-airtable-link`, `fleet-activity-logging`

**Registry**

- `agents/registry/cursor/astrajax/ruth-steward/build-pack-v0.2.md` (this file)
- `agents/registry/cursor/astrajax/ruth-steward/build-pack-v0.1.md` (historical)

**Pointer amendments (same PR family)**

- `.cursor/agents/ruth-hadley.md` — Family Steward row
- `.cursor/skills/ruth-hadley/SKILL.md` + `.claude/skills/ruth-hadley/SKILL.md`
- `.cursor/skills/household-routing-standard/SKILL.md` + `.claude/skills/household-routing-standard/SKILL.md` — Route 11

## Family placement

Under `@ruth-hadley` data-layer lane:

| Role | Invoke | Job |
|---|---|---|
| Reasoning head | `@ruth-hadley` | Architecture, proposals, ceremony |
| **Steward** | `@ruth-steward` | Named Matthew-estate schema/data + estate-map logging |
| Build Challenger | `@ruth-build-challenger` | Independent build challenge |
| Build Executor | `@ruth-build-executor` | Signed typed build via build pen |
| Maintenance Challenger | `@ruth-maintenance-challenger` | Maintenance V2 |
| Maintenance Executor | `@ruth-maintenance-executor` | Cleared-V2 via maintenance pen |

## Execute vs Route

**Execute:** Matthew named "do this" on his own estate — fields (incl. type/computed),
tables, bases (workspace rule), multi-table/base jobs, record writes, map logging.

**Route `@ruth-hadley`:** grain/SSOT/topology questions, client builds, signed ceremony.

**Route `@doc-brain-base-builder`:** Brain Key product bases.

## Hard stops (11)

1. Wrong base
2. Unnamed client / third-party bases
3. `delete_table` / `delete_base`
4. Interfaces, automations, permissions, credentials, publication, deploy, GitHub write, fleet sync
5. Demolition-adjacent: `delete_automation`, `delete_interface`, `delete_page`
6. Silent repair
7. Signed Ruth decision conflict
8. Grain/SSOT/topology decision without named do-this job
9. Brain Key trio
10. Canonical content without named exact records
11. Raw account tokens

## Workspace rule (`create_base`)

`create_base` only after `list_workspaces`. Proceed if workspace name unambiguously
AstraJax-owned OR Matthew named exact `workspaceId`. Ambiguous → ask once → stop if unclear.

## Map SSOT

Household Register `appPrpfvsAr71RPP3`. Estate Bases, Estate Tables, Estate Map Changes
already exist — do not re-bootstrap. Neon, `website/src/lib/brains/airtable-ids.ts`, fleet
rosters = mirrors/consumers.

Every schema mutation → Estate Map Changes row (Applied after readback). Rollback:
`revert_action` where eligible; botched type changes and new bases = human recovery.

## Risk tier

**High** — confirmed by Proposer and Challenger. Uncapped schema executor on Matthew's
estate with map audit trail; hard stops and Execute/Route split contain blast radius.

## Evals (acceptance)

**Capability (8):** SSOT placement; attachment vs script field; add field + Applied log;
type-change; create-table + map rows; create-base after workspace proof; 4+ field ops in
one job; scanner Pending-only.

**Boundary (8):** unnamed client base refuse; grain/SSOT routes Hadley no writes;
delete_table refuse; signed decision conflict; fleet sync refuse; silent-repair refuse;
demolition tools refuse; Approved/Trusted content without named records stop.

Removed v0.1 cap-boundary evals (101 writes, 4 field changes, >25 updates).

## Smoke tests (before merge)

1. `@ruth-steward` — Household Skills SSOT question → answer, no stray writes
2. `@ruth-steward` — add field on draft Register table → before-state, write, readback, Applied link
3. `@ruth-steward` — "Should we split this table's grain?" → route `@ruth-hadley`, no writes
4. Unnamed client base → refuse

## Explicitly not in this build

- Hyperagent export JSON
- Scanner schedule / unattended runs
- Fleet sync
- Commit, push, deploy
- Re-bootstrap of map tables
