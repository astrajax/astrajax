# Cursor-native agents

Agents whose **production runtime is Cursor** — invoked as subagents in the IDE.

| Agent | Slug | Registry | Runtime |
|---|---|---|---|
| Agent Factory | `clive-agent-factory` | `clive/agent-factory/` | `.cursor/agents/clive-agent-factory.md` |
| Hyperagent Release Scanner | `clive-hyperagent-release-scanner` | `clive/hyperagent-release-scanner/` | `.cursor/agents/clive-hyperagent-release-scanner.md` |

No Hyperagent export. These agents rely on repo filesystem access, local scripts,
and Cursor tooling that does not exist inside Hyperagent's isolated VM.

## Cursor mirrors (production elsewhere)

These have `.cursor/agents/` files for local dev and build workflows. **Do not
treat them as Cursor-native** — production runs on Hyperagent:

| Agent | Production | Live doc |
|---|---|---|
| Clive Intake | Hyperagent v1 | `agents/hyperagent/clive/intake/build-pack-v1.md` |
| Clive Curator | Hyperagent V5 | `agents/hyperagent/clive/curator/LIVE.md` |
| Clive Context Scanner | Hyperagent v0.4 | `agents/hyperagent/clive/context-scanner/LIVE.md` |

Add new Cursor-native agents under `agents/cursor/<family>/<name>/`.
