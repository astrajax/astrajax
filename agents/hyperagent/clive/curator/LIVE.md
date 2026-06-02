# Live Clive Curator deployment

**Current version:** V5 (Hyperagent-primary)

## Import these (in order)

1. `hyperagent/exports/skills/skill-clive-context-curator-v5.json`
2. `hyperagent/exports/agents/agent-clive-curator-v5.json`

## Build pack

- `agents/hyperagent/clive/curator/build-pack-v5.md`

## Generator

- `hyperagent/builds/build_clive_curator_v5.py`

## Pre-V5 artifacts

Older exports (`agent-clive-curator-v0_1.json` … `v4.json`) are in
`hyperagent/exports/archive/`. Build scripts `build_clive_curator_v0_1.py` … `v4.py`
are history. **Do not delete v0_1–v4 build scripts:** `build_clive_curator_v5.py`
imports the chain.

Superseded build packs under `agents/cursor/clive/curator/archive/` are
archive-only.

## Model mapping (Cursor mirror vs Hyperagent export)

| Surface | Identifier |
|---------|------------|
| Cursor mirror (`.cursor/agents/clive-curator.md`) | `claude-opus-4-7-thinking-xhigh` (Cursor slug) |
| Hyperagent export | `modelId: claude-opus-4-7`, `effort: high`, `maxThinkingTokens: 16000` |

Same intent; different naming schemes per platform.
