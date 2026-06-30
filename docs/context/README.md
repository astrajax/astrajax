# Clive Context Packs

> **Scope note:** This folder is the **Clive context-engine** — the live operational
> machinery for Clive's Man's context workflows: intake, curation, quarantine,
> publish-prep, and source registry upkeep. It is **not** the business positioning
> or strategy layer. For what AstraJax is, how the product works, and how the
> company runs, start at `docs/START-HERE.md` and `docs/business/`.

This directory holds versioned Markdown exports of approved or bootstrap context
packs for Clive by AstraJax.

The Airtable tables govern status and approval. These files are the GitHub
version of the context so Cursor agents and Clive's Man publish-prep workflows can
review, diff, and update them safely.

## Folder taxonomy

| Area | Path | Meaning |
|---|---|---|
| **Packs** | Files listed below | Bootstrap or approved context packs agents may treat as canonical *after Matthew approves the underlying Context Items* |
| **Operational** | `clive-operating-rules.md`, `trinity-agent-flow.md`, `email-inbox-setup.md` | Live procedures and agent patterns not yet folded into a named pack |
| **Working drafts** | `Airtable/`, `Seeds-of-Promise/`, dated one-offs | In-progress material stored here for convenience until Clive's Man intake → curation → publish-prep |
| **Reference assets** | `clive/screenshots/` | UI evidence for reviews and applications |
| **Audit mirror** | `audit/` | Append-only Change Log mirror (see `audit/README.md`) |

Working drafts are **not canonical** unless and until they become approved Context
Items. When in doubt, prefer the pack files and root architecture docs.

## Packs

- Business positioning now lives in `docs/business/positioning.md` (start at `docs/START-HERE.md`). The former `astrajax-core-positioning.md` pack is archived in `docs/archive/`.
- `clive-operating-rules.md` — Clive's Man context lane, Trinity minions, human approval gates.
- `model-collaboration.md` — model roles and routing policy (bootstrap draft).
- `docs/archive/context-architecture-v1.md` — schema, lifecycle, and governance summary (V1 tables; archived).
- `docs/archive/context-architecture-v2.md` — enforcement, provenance, and human approval (supersedes V1 gates; archived).
- `source-registry.md` — source inventory for context surfaces.
- `hyperagent-platform.md` — current Hyperagent platform constraints and build rules.
- `hyperagent-releases.json` — raw unverified Hyperagent release log.
- `trinity-agent-flow.md` — proposer / challenger / executor pattern for high-stakes agent workflows.

## Working drafts (not canonical)

- `../../agents/draft/context-processing/` — proposed simpler Clive context processing flow and draft agent roles.
- `Airtable/Hyperagent-Relationship/` — Founding 500 application and Airspace relationship notes.
- `Seeds-of-Promise/` — Seeds of Promise pitch and plan drafts.
- `astrajax-journey-video-edit-guide-2026-05-31.md` — journey video edit guide.
- `matthew-talk-track-v3.md` — founder talk-track script.

## Governance

- Airtable is the operating control layer.
- GitHub Markdown is the versioned context layer.
- Context Items become canonical only after Matthew approves them.
- Clive's Man prepares publish bundles and Change Log entries; Matthew approves final publish.
- For human approval mechanics, see `clive-operating-rules.md` and `docs/business/architecture.md`.

## Live agent deployments

Canonical import guidance: `hyperagent/docs/hyperagent-deploy-playbook.md` (agent JSON
only for embedded-skill exports; separate skill JSON for updates/shared skills).

Current context lane: **Clive's Man** (`@clive-man`) with Trinity minions. The former
Intake, Curator, Publisher, and Context Scanner agents are retired as active owners;
their build packs under `agents/registry/hyperagent/clive/` are historical reference only.
