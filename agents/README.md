# Agent fleet registry

Versioned home for AstraJax and Clive agents, **split by runtime platform**.

All agents are **designed and built in Cursor**. Where they **run in production**
determines which registry branch they live under.

## Cursor vs Hyperagent — pick one primary runtime

| Platform | Production runtime | Registry path | Typical artifacts |
|---|---|---|---|
| **cursor** | Cursor subagent chat | `agents/cursor/<family>/<name>/` | `.cursor/agents/<slug>.md`, `.cursor/skills/<skill>/` |
| **hyperagent** | Hyperagent web / Slack | `agents/hyperagent/<family>/<name>/` | `hyperagent/exports/agents/*.json`, `hyperagent/exports/skills/*.json` |

**Rule:** one agent folder, one primary platform. Do not mix Cursor-only and
Hyperagent-only agents in the same registry branch.

Some Hyperagent agents also have a **Cursor mirror** (`.cursor/agents/<slug>.md`)
for local dev and build workflows. The registry still lives under
`agents/hyperagent/` because production is Hyperagent.

## Four artifact layers

```text
agents/<platform>/<family>/<slug>/build-pack-v<n>.md   ← human spec (registry)
.cursor/agents/<slug>.md                                ← Cursor runtime (when used)
hyperagent/exports/agents/agent-*.json                  ← Hyperagent runtime (when used)
hyperagent/builds/build_*.py                            ← generator scripts
```

## Folder layout

```text
agents/
  README.md
  _template/
    cursor/
    hyperagent/
  draft/                          ← draft agent designs, not live policy
  cursor/                         ← Cursor-native agents
    clive/
      agent-factory/
  hyperagent/                     ← Hyperagent-deployed agents
    clive/
      intake/
      curator/
```

## Naming contract

| Artifact | Cursor-native | Hyperagent-deployed |
|---|---|---|
| Registry | `agents/cursor/<family>/<name>/` | `agents/hyperagent/<family>/<name>/` |
| Build pack | `.../build-pack-v<n>.md` | `.../build-pack-v<n>.md` |
| Cursor agent | `.cursor/agents/<slug>.md` | optional mirror for dev |
| Cursor skill | `.cursor/skills/<skill-name>/` | optional mirror for dev |
| Hyperagent export | none | `hyperagent/exports/agents/agent-<slug>-v<n>.json` |
| Generator | `hyperagent/builds/build_*.py` | `hyperagent/builds/build_*.py` |

Bump `v<n>` on material changes. Move superseded build packs to `archive/`.

## Roster scan

```bash
python3 hyperagent/scripts/list_repo_agents.py --include-skills --include-registry
python3 hyperagent/scripts/list_repo_agents.py --platform cursor
python3 hyperagent/scripts/list_repo_agents.py --platform hyperagent
```

## Governance

- Design new agents with **Clive Agent Factory** (`agents/cursor/clive/agent-factory/`).
- Use `agents/draft/` for messy early designs before they become build packs.
- Factory writes registry + runtime artifacts only after explicit Matthew approval.
- Hyperagent import and git commit stay human actions.
