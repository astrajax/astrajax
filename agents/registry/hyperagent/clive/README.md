# Hyperagent-deployed agents

Agents whose **production runtime is Hyperagent** - web chat, Slack, schedules.

| Agent | Slug | Registry | Hyperagent export | Cursor mirror |
|---|---|---|---|---|
| Agent Factory (Hyperagent) | `clive-agent-factory` | `agent-factory/` | `hyperagent/exports/agents/agent-clive-agent-factory-v3.json` | `.cursor/agents/doc-workshop-proposer.md` |

The former Hyperagent context lane (Intake, Curator, Context Scanner) is retired
as active roster surface in favour of the Cursor-native Clive's Man and Trinity
minions. Historical exports and build packs are archived.

Clive Hyperagent Release Scanner is intentionally kept outside this retirement:
it protects the Hyperagent platform truth used by Doc's Workshop and Clive's Man.

Add new Hyperagent agents under `agents/registry/hyperagent/<family>/<name>/`.
