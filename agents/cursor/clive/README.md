# Cursor-native agents

Agents whose **production runtime is Cursor** — invoked as subagents in the IDE.

| Agent | Slug | Registry | Runtime |
|---|---|---|---|
| Agent Factory | `clive-agent-factory` | `clive/agent-factory/` | `.cursor/agents/clive-agent-factory.md` |
| Hyperagent Release Scanner | `clive-hyperagent-release-scanner` | `clive/hyperagent-release-scanner/` | `.cursor/agents/clive-hyperagent-release-scanner.md` |
| Context Scanner | `clive-context-scanner` | `clive/context-scanner/` | `.cursor/agents/clive-context-scanner.md` |

No Hyperagent export. These agents rely on repo filesystem access, local scripts,
and Cursor tooling that does not exist inside Hyperagent's isolated VM.

Add new Cursor-native agents under `agents/cursor/<family>/<name>/`.
