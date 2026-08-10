# Household Routing Standard — Cursor twin v0.1

Ported from Hyperagent skill export `skill-household-routing-standard` (Household
prefix 16 Jul 2026). Cursor twin adds Task/`@` dispatch and expanded lanes.

## Files

- `.cursor/skills/household-routing-standard/SKILL.md`
- `.claude/skills/household-routing-standard/SKILL.md` (mirror)
- Wired into `.cursor/agents/clive.md` as a required skill

## New Cursor routes (vs HA v0.1)

| Route | Target |
|---|---|
| Agent quality / household health | `@halvard-bjornson` |
| Research / best-practice scout | `@ristral` |
| Data-layer architecture | `@ruth-hadley` |
| Ruth build pack | `@ruth-build-challenger` / `@ruth-build-executor` |
| Ruth maintenance pack | `@ruth-maintenance-challenger` / `@ruth-maintenance-executor` |
| Visual skin | `@kathryn-goodchild` |
| Motion | `@milo-cadence` |
| Scene craft | `@kate` |

## Website build flow (2026-08-08)

Staged chain in the skill: Clive (decision) → Pam (Red+novel only) → Kathryn (skin)
→ Kate (scenic) **or** Doc/Vercel (product) → Clive's Man (paper trail for durable
outcomes). Scenic vs product split is mandatory. Man exit after builders and after
adopted decisions/directions — not after every exploratory utterance.

## Dispatch mechanics

HA: `InvokeNamedAgent` / `CreateAgentThread`  
Cursor: Task `subagent_type` when catalogued, else `@` handoff with self-contained brief.

## Agent shells added with this twin

Full Cursor twins (2026-08-08): `halvard-bjornson` (+ 4 physician craft skills), `ristral` (+ `ristral-weekly-scout`).

Other agents added with routing twin:
- `ruth-hadley`, `ruth-build-challenger`, `ruth-build-executor`,
  `ruth-maintenance-challenger`, `ruth-maintenance-executor`
