# Clive Context Packs

This directory holds versioned Markdown exports of approved or bootstrap context
packs for Clive by AstraJax.

The Airtable tables govern status and approval. These files are the GitHub
version of the context so Cursor agents and future Publisher workflows can
review, diff, and update them safely.

## Folder taxonomy

| Area | Path | Meaning |
|---|---|---|
| **Packs** | Files listed below | Bootstrap or approved context packs agents may treat as canonical *after Matthew approves the underlying Context Items* |
| **Operational** | `human-approval-path.md`, `email-inbox-setup.md` | Live procedures not yet folded into a named pack |
| **Working drafts** | `Airtable/`, `Seeds-of-Promise/`, dated one-offs | In-progress material stored here for convenience until Intake → approval → Publisher |
| **Reference assets** | `clive/screenshots/` | UI evidence for reviews and applications |
| **Audit mirror** | `audit/` | Append-only Change Log mirror (see `audit/README.md`) |

Working drafts are **not canonical** unless and until they become approved Context
Items. When in doubt, prefer the pack files and root architecture docs.

## Packs

- `astrajax-core-positioning.md` — AstraJax positioning, proof, and claim-control.
- `clive-operating-rules.md` — Intake, Curator, Publisher, Scanner boundaries.
- `model-collaboration.md` — model roles and routing policy.
- `context-architecture-v1.md` — schema, lifecycle, and governance summary (V1 tables).
- `context-architecture-v2.md` — enforcement, provenance, and human approval (supersedes V1 gates).
- `source-registry.md` — source inventory for context surfaces.
- `hyperagent-platform.md` — current Hyperagent platform constraints and build rules.
- `hyperagent-releases.json` — raw unverified Hyperagent release log.

## Working drafts (not canonical)

- `Airtable/Hyperagent-Relationship/` — Founding 500 application and Airspace relationship notes.
- `Seeds-of-Promise/` — Seeds of Promise pitch and plan drafts.
- `astrajax-journey-video-edit-guide-2026-05-31.md` — journey video edit guide.
- `matthew-talk-track-v3.md` — founder talk-track script.

## Governance

- Airtable is the operating control layer.
- GitHub Markdown is the versioned context layer.
- Context Items become canonical only after Matthew approves them.
- Publisher is responsible for future approved exports and Change Log entries.
- For human approval mechanics, see `human-approval-path.md`.

## Live agent deployments

Hyperagent production imports are documented per agent:

- Curator V5: `agents/hyperagent/clive/curator/LIVE.md`
- Context Scanner v0.4: `agents/hyperagent/clive/context-scanner/LIVE.md`
- Intake v1: `agents/hyperagent/clive/intake/build-pack-v1.md` (superseded pack; live export is `agent-clive-intake-v1.json`)
