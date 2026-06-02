# Hyperagent-deployed agents

Agents whose **production runtime is Hyperagent** — web chat, Slack, schedules.

| Agent | Slug | Registry | Hyperagent export | Cursor mirror |
|---|---|---|---|---|
| Intake | `clive-intake` | `intake/` | `hyperagent/exports/agents/agent-clive-intake-v1.json` | `.cursor/agents/clive-intake.md` |
| Curator | `clive-curator` | `curator/` | `hyperagent/exports/agents/agent-clive-curator-v5.json` | `.cursor/agents/clive-curator.md` |
| Context Scanner | `clive-context-scanner` | `context-scanner/` | `hyperagent/exports/agents/agent-clive-context-scanner-v0_4.json` | `.cursor/agents/clive-context-scanner.md` |

Live import instructions: `curator/LIVE.md`, `context-scanner/LIVE.md`.

The Cursor mirror exists for local dev and build workflows. Production deploy
uses the Hyperagent JSON export.

Add new Hyperagent agents under `agents/hyperagent/<family>/<name>/`.

Operating boundaries: `docs/context/clive-operating-rules.md`.
