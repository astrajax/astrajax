# Cursor-native agents

Agents whose **production runtime is Cursor** - invoked as subagents in the IDE.

| Agent | Slug | Registry | Runtime |
|---|---|---|---|
| Clive's Man | `clive-man` | `clive/clive-man/` | `.cursor/agents/clive-man.md` |
| Clive's Man Proposer | `clive-man-proposer` | `clive/clive-man/` | `.cursor/agents/clive-man-proposer.md` |
| Clive's Man Challenger | `clive-man-challenger` | `clive/clive-man/` | `.cursor/agents/clive-man-challenger.md` |
| Clive's Man Executor | `clive-man-executor` | `clive/clive-man/` | `.cursor/agents/clive-man-executor.md` |
| Hyperagent Release Scanner | `clive-hyperagent-release-scanner` | `clive/hyperagent-release-scanner/` | `.cursor/agents/clive-hyperagent-release-scanner.md` |

Clive's Man replaces the old active Clive context lane (Intake, Curator,
Publisher, Context Scanner). Their logic now lives as workflows inside
`clive-man`; their active artifacts are archived so the roster has one context
upkeep route.

Add new Cursor-native agents under `agents/registry/cursor/<family>/<name>/`.
