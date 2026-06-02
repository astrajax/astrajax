# Superseded Hyperagent exports

Historical agent and skill JSON exports. **Do not import for production.**

## Live deployments

| Agent | Live export | Doc |
|---|---|---|
| Clive Curator | `../agents/agent-clive-curator-v5.json` | `agents/hyperagent/clive/curator/LIVE.md` |
| Clive Context Scanner | `../agents/agent-clive-context-scanner-v0_4.json` | `agents/hyperagent/clive/context-scanner/LIVE.md` |
| Clive Intake | `../agents/agent-clive-intake-v1.json` | `agents/hyperagent/clive/intake/build-pack-v1.md` |

## Archived agents

- `agents/agent-clive-curator-v0_1.json` … `v4.json`
- `agents/agent-clive-context-scanner-v0_3.json`

## Archived skills

- `skills/skill-clive-context-curator-v0_1.json` … `v4.json`
- `skills/skill-clive-context-scanner-v0_3.json`

Build scripts that regenerate older versions write to `hyperagent/exports/agents/`
and `hyperagent/exports/skills/` (not this folder). Move superseded outputs here
after each production promotion.
