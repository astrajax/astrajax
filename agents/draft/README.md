# Draft Agents

**Status:** Draft design area. Nothing in this folder is live agent policy until Matthew approves it and a build pack is promoted into `agents/cursor/` or `agents/hyperagent/`.

This folder is for simplifying agent ideas before they become production artifacts.

Use it when:

- A workflow is still mentally messy.
- The agent boundaries are not yet clear.
- The goal is to reduce human review load without losing the paper trail.
- The design needs to feel human enough that Matthew and TL can understand it quickly.

## Current Drafts

- `context-processing/` - proposed simpler flow for Clive context intake, challenge, recording, curation, and publishing.

## Promotion Rule

Drafts do not deploy themselves.

To promote a draft:

1. Matthew approves the direction.
2. Clive Agent Factory turns the draft into one or more build packs.
3. Runtime artifacts are generated under `agents/cursor/` or `agents/hyperagent/`.
4. Live policy docs are updated only after the build is accepted.

