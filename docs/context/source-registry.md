# Context Bootstrap Source Registry

**Status:** Current inventory (updated 1 Jun 2026).  
**Owner:** Matthew.  
**Purpose:** Source inventory for Clive context surfaces — bootstrap packs, skills, and operational docs.

## Canonical packs (docs/context/)

| Source ID | Title | Type | Owner | Authority | Freshness | Destination |
|---|---|---|---|---|---|---|
| `SRC-AJ-POSITIONING` | `astrajax_positioning.md` | Repo doc | Matthew | Canonical | Current | AstraJax Core Positioning |
| `SRC-AJ-OPS` | `astrajax_ops_brief.md` | Repo doc | Matthew | Canonical | Current | AstraJax Core Positioning |
| `SRC-AJ-AGENTS` | `AGENTS.md` | Repo doc | Matthew | Canonical | Current | AstraJax Core Positioning |
| `SRC-CLIVE-ARCH-V1` | `clive_context_architecture_v1.md` | Repo doc | Matthew | Canonical | Current | Context Architecture V1 |
| `SRC-CLIVE-ARCH-V2` | `clive_context_architecture_v2.md` | Repo doc | Matthew | Canonical | Current | Context Architecture V2 |
| `SRC-CLIVE-SCHEMA-V1` | `hyperagent/context_architecture_schema_v1.json` | Schema file | Matthew | Canonical | Current | Context Architecture V1 |
| `SRC-CLIVE-APPROVAL` | `docs/context/human-approval-path.md` | Operational doc | Matthew | Canonical | Current | Context Architecture V2 |
| `SRC-CLIVE-EMAIL-INBOX` | `docs/context/email-inbox-setup.md` | Operational doc | Matthew | Canonical | Current | Clive Operating Rules |
| `SRC-HYPERAGENT-PLATFORM` | `docs/context/hyperagent-platform.md` | Repo doc | Matthew | Canonical candidate | Current | Hyperagent Platform |
| `SRC-HYPERAGENT-RELEASES` | `docs/context/hyperagent-releases.json` | Raw log | Agent | Unverified | Rolling | Hyperagent Platform |

## Agent skills (.cursor/skills/)

| Source ID | Title | Type | Owner | Authority | Freshness | Destination |
|---|---|---|---|---|---|---|
| `SRC-CLIVE-INTAKE-SKILL` | `.cursor/skills/clive-context-intake/SKILL.md` | Cursor skill | Matthew | Canonical | Current | Clive Operating Rules |
| `SRC-CLIVE-INTAKE-SLACK` | `.cursor/skills/clive-context-intake-slack-blocks/SKILL.md` | Cursor skill | Matthew | Canonical | Current | Clive Operating Rules |
| `SRC-CLIVE-CURATOR-SKILL` | `.cursor/skills/clive-context-curator/SKILL.md` | Cursor skill | Matthew | Canonical | Current | Clive Operating Rules |
| `SRC-CLIVE-SCANNER-SKILL` | `.cursor/skills/clive-context-scanner/SKILL.md` | Cursor skill | Matthew | Canonical | Current | Clive Operating Rules |
| `SRC-CLIVE-RELEASE-SCANNER` | `.cursor/skills/clive-hyperagent-release-scanner/SKILL.md` | Cursor skill | Matthew | Canonical | Current | Clive Operating Rules |
| `SRC-CLIVE-FACTORY-SKILL` | `.cursor/skills/clive-agent-factory/SKILL.md` | Cursor skill | Matthew | Canonical | Current | Clive Operating Rules |

## Model and strategy docs (repo root)

| Source ID | Title | Type | Owner | Authority | Freshness | Destination |
|---|---|---|---|---|---|---|
| `SRC-MODEL-STACK` | `agent-model-collaboration-stack-notion.md` | Strategy doc | Matthew | Supporting | Current | Model Collaboration |
| `SRC-CONTEXT-MODELS` | `best-models-for-context-environments-notion.md` | Strategy doc | Matthew | Supporting | Current | Model Collaboration |

## Working drafts (not canonical until approved)

| Source ID | Title | Type | Owner | Authority | Freshness | Notes |
|---|---|---|---|---|---|---|
| `SRC-HA-RELATIONSHIP` | `docs/context/Airtable/Hyperagent-Relationship/` | Draft folder | Matthew | Working draft | Current | Founding 500 + Airspace |
| `SRC-SEEDS-PLAN` | `docs/context/Seeds-of-Promise/` | Draft folder | Matthew | Working draft | Current | Seeds pitch material |
| `SRC-JOURNEY-EDIT` | `docs/context/astrajax-journey-video-edit-guide-2026-05-31.md` | Draft doc | Matthew | Working draft | Current | Video edit guide |
| `SRC-TALK-TRACK` | `docs/context/matthew-talk-track-v3.md` | Draft doc | Matthew | Working draft | Current | Founder talk script |

## Bootstrap notes

- This registry is not a replacement for Airtable source links on Context Items.
- Context Items created from bootstrap should cite these source IDs in `Source Notes`.
- Conflicts between sources should be surfaced in Curator review and decided by Matthew before approval.
- Working drafts live in `docs/context/` for convenience until Publisher exists or Matthew approves them as Context Items.
