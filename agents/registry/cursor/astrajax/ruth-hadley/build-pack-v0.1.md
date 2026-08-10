# Ruth Hadley — Cursor full twin v0.1

Ported from Hyperagent export `agent-ruth-hadley.json` (2026-08-08) plus family
executor/challenger exports.

## Platform split

| Runtime | Invoke | Notes |
|---|---|---|
| Cursor | `@ruth-hadley` | Full craft skills + pens; MCP for discovery |
| Hyperagent | Ruth thread | Schedules / RunWithCredentials native |

## Cursor files

**Agents**

- `.cursor/agents/ruth-hadley.md` (reasoning head)
- `.cursor/agents/ruth-build-challenger.md`
- `.cursor/agents/ruth-build-executor.md`
- `.cursor/agents/ruth-maintenance-challenger.md`
- `.cursor/agents/ruth-maintenance-executor.md`

**Skills**

- `ruth-hadley` (hub)
- `airtable-data-layer-doctrine`
- `ruth-control-plane-writer` (+ scripts)
- `ruth-build-execution-pen` (+ scripts)
- `ruth-maintenance-execution-pen` (+ scripts)
- `household-conduct-standard`, `household-communication-standard`
- uses existing `household-routing-standard`

**Scripts convenience path:** `scripts/ruth/`

## Credentials

| Env | Purpose |
|---|---|
| `RUTH_CONTROL_PLANE_WRITE` | Control plane `appubDI76O0t8xisg` create-only |
| `AIRTABLE_BUILD_TARGET_WRITE` | Per-engagement signed build target (executor only) |

## Smoke tests

1. `@ruth-hadley` — tiny booking/shift grain map → doctrine-backed proposal, no writes.
2. Offline pen: `python3 scripts/ruth/build_pen_decl.py --fixture-drive ...` (see skill).
3. `@ruth-build-challenger` on a draft proposal → PROCEED or V2 repairs without mutation.

## Explicitly not ported as Cursor schedules

HA paused maintenance cadence (06:00 / 06:30 / 07:00 Europe/London). Run manually via `@`
when Matthew wants a pass.
