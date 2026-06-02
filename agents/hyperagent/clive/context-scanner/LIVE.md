# Live Clive Context Scanner deployment

**Current version:** v0.4 (Hyperagent-primary)

## Import these (in order)

1. `hyperagent/exports/skills/skill-clive-context-scanner-v0_4.json`
2. `hyperagent/exports/agents/agent-clive-context-scanner-v0_4.json`

## Build pack

- `agents/hyperagent/clive/context-scanner/build-pack-v0.4.md`

## Generator

- `hyperagent/builds/build_clive_context_scanner_v0_4.py`

## Pre-v0.4 artifacts

Older exports (`agent-clive-context-scanner-v0_3.json` and earlier) are in
`hyperagent/exports/archive/`. Do not import them for production.

## Cursor mirror

`.cursor/agents/clive-context-scanner.md` exists for local dev. Production is
Hyperagent.

## Model mapping

| Surface | Identifier |
|---------|------------|
| Cursor mirror | `claude-opus-4-7-thinking-xhigh` (Cursor slug) |
| Hyperagent export | `modelId: claude-opus-4-7`, `effort: high` |

Same intent; different naming schemes per platform.
