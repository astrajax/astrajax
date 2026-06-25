# Superseded Hyperagent exports

Historical agent and skill JSON exports. **Do not import for production.**

## Live production export

| Agent | Export | Registry |
|-------|--------|----------|
| Clive Agent Factory (Hyperagent) v3 | `../agents/agent-clive-agent-factory-v3.json` | `agents/registry/hyperagent/clive/agent-factory/build-pack-v3.md` |

Skill: `../skills/skill-clive-agent-factory-hyperagent-v3.json`

## Retired context lane (archived here)

These agents were production until **2026-06-24**, when Clive's Man replaced the
active Intake / Curator / Scanner / Publisher lane. Exports are kept for audit
and disaster recovery only.

| Agent | Last export | Registry (archive) |
|-------|-------------|-------------------|
| Clive Curator v5 | `agents/agent-clive-curator-v5.json` | `agents/registry/hyperagent/clive/curator/archive/` |
| Clive Context Scanner v0.4 | `agents/agent-clive-context-scanner-v0_4.json` | `agents/registry/hyperagent/clive/context-scanner/archive/` |
| Clive Intake v1 | `agents/agent-clive-intake-v1.json` | `agents/registry/hyperagent/clive/intake/archive/` |

Matching skills are in `skills/`.

## Older versions

- `agents/agent-clive-curator-v0_1.json` … `v4.json`
- `agents/agent-clive-context-scanner-v0_3.json`
- `skills/skill-clive-context-curator-v0_1.json` … `v4.json`

## Promotion rule

Build scripts in `hyperagent/builds/archive/` regenerate older versions into
`hyperagent/exports/agents/` and `hyperagent/exports/skills/`. After each
production promotion, move superseded outputs here — never delete history.
