# New agent scaffold

Choose the platform first, then copy the matching template branch.

## 1. Pick primary runtime

| If production runs in… | Registry path | Also create |
|---|---|---|
| **Cursor** (subagent) | `agents/cursor/<family>/<name>/` | `.cursor/agents/`, `.cursor/skills/` |
| **Hyperagent** (web/Slack) | `agents/hyperagent/<family>/<name>/` | `hyperagent/exports/`, optional Cursor mirror |

## 2. Create the folder

```text
agents/<platform>/<family>/<short-name>/
  build-pack-v0.1.md
  archive/
  evals/          (recommended)
```

## 3. Generate artifacts

Run or create `hyperagent/builds/build_*.py`, or use Clive Agent Factory Phase B
after Matthew approves the config pack.

## 4. Register in Airtable

When Publisher is live, add an `Agent Environments` row with the correct
`Platform` field (`Cursor`, `Hyperagent`, or both if truly dual-runtime).
