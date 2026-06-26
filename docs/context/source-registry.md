# Context Bootstrap Source Registry

**Status:** Current inventory (updated 26 Jun 2026).
**Owner:** Matthew.  
**Purpose:** Source inventory for Clive context surfaces — bootstrap packs, skills, and operational docs.

## Canonical packs (docs/context/)

| Source ID | Title | Type | Owner | Authority | Freshness | Destination |
|---|---|---|---|---|---|---|
| `SRC-AJ-POSITIONING` | `docs/business/positioning.md` | Repo doc | Matthew | Canonical | Current | AstraJax Core Positioning (old `astrajax_positioning.md` archived in `docs/archive/`) |
| `SRC-AJ-OPS` | `docs/business/internal-brief.md` | Repo doc | Matthew | Canonical | Current | Internal priorities and guardrails |
| `SRC-AJ-AGENTS` | `AGENTS.md` | Repo doc | Matthew | Canonical | Current | AstraJax Core Positioning |
| `SRC-CLIVE-ARCH-V1` | `docs/context/context-architecture-v1.md` | Repo doc | Matthew | Canonical | Current | Context Architecture V1 (root `clive_context_architecture_v1.md` archived) |
| `SRC-CLIVE-ARCH-V2` | `docs/context/context-architecture-v2.md` | Repo doc | Matthew | Canonical | Current | Context Architecture V2 (root `clive_context_architecture_v2.md` archived) |
| `SRC-CLIVE-SCHEMA-V1` | `hyperagent/context_architecture_schema_v1.json` | Schema file | Matthew | Canonical | Current | Context Architecture V1 |
| `SRC-CLIVE-APPROVAL` | `docs/context/human-approval-path.md` | Operational doc | Matthew | Canonical | Current | Context Architecture V2 |
| `SRC-CLIVE-EMAIL-INBOX` | `docs/context/email-inbox-setup.md` | Operational doc | Matthew | Canonical | Current | Clive Operating Rules |
| `SRC-HYPERAGENT-PLATFORM` | `docs/context/hyperagent-platform.md` | Repo doc | Matthew | Canonical candidate | Current | Hyperagent Platform |
| `SRC-HYPERAGENT-RELEASES` | `docs/context/hyperagent-releases.json` | Raw log | Agent | Unverified | Rolling | Hyperagent Platform |

## Airtable architecture sources (Chapter 1)

| Source ID | Title | Type | Owner | Authority | Freshness | Destination |
|---|---|---|---|---|---|---|
| `SRC-AJ-ARCHITECTURE` | `docs/business/architecture.md` | Repo doc | Matthew | Canonical | Current | Product and governance architecture |
| `SRC-AJ-BRAIN-WIRING` | `docs/initiatives/brain-key-wiring.md` | Working spec | Matthew | Working current | Current | Brain Key access model, storage boundaries, API contracts |
| `SRC-AJ-BRAIN-SCHEMA` | `docs/initiatives/brain-key-schema.md` | Schema blueprint | Matthew | Current implementation reference | Current | Replicable Airtable table and field blueprint |
| `SRC-AJ-BRAIN-IDS` | `website/src/lib/brains/airtable-ids.ts` | Code ID map | Matthew | Live implementation | Current | Live Chapter 1 Airtable base and table IDs |
| `SRC-AJ-BRAIN-BUILDER` | `docs/initiatives/brain-base-builder-agent.md` | Working spec | Matthew | Current implementation reference | Current | Brain Base Builder / Doc Airtable Minion status, runbook, credential notes |
| `SRC-AJ-DOC-MINIONS` | `docs/initiatives/doc-minions.md` | Working spec | Matthew | Current implementation reference | Current | Doc minion roster, two-phase build rule, mandatory Clive's Man handoff |
| `SRC-AJ-INTERACTION-REVIEW` | `website/src/app/brain/review/page.tsx`; `website/src/components/brain/InteractionReviewShell.tsx`; `website/src/app/api/brains/interactions/list/route.ts`; `website/src/app/api/brains/interactions/score/route.ts`; `website/src/lib/brains/handlers/interaction-list.ts`; `website/src/lib/brains/handlers/interaction-score.ts`; `website/src/lib/brains/handlers/interaction-memory.ts` | Website UI / API implementation | Matthew | Live implementation | Current | Client-facing Brain Interactions review and scoring surface; review signal only, not canonical approval |
| `SRC-AJ-BRAIN-UPKEEP` | `docs/initiatives/brain-upkeep.md`; `website/src/lib/brains/interaction-upkeep.ts`; `website/src/app/api/brains/interactions/action/route.ts`; `website/src/lib/brains/handlers/interaction-action.ts`; `website/src/lib/brains/handlers/interaction-upkeep.test.ts` | Working spec / Website API implementation | Matthew | Current implementation reference | Current | Thin Brain Upkeep loop: Needs Review shortlist and Workshop-only propose/dismiss actions |

## Character and roster sources

| Source ID | Title | Type | Owner | Authority | Freshness | Destination |
|---|---|---|---|---|---|---|
| `SRC-AJ-CHARACTER-PROVENANCE` | `docs/initiatives/character-provenance.md` | Working provenance doc | Matthew | Working current | Current | Founding cast rationale, role provenance, visual/story decisions |
| `SRC-AJ-LAZLO-CRAFT` | `.cursor/agents/lazlo-marlowe.md`; `.cursor/skills/lazlo-marlowe-character-craft/SKILL.md`; `.cursor/skills/lazlo-marlowe-diagnosis/SKILL.md`; `.cursor/skills/lazlo-marlowe-new-character/SKILL.md`; `.cursor/skills/lazlo-marlowe-relationships/SKILL.md`; `.cursor/skills/lazlo-marlowe-cast-audit/SKILL.md`; `hyperagent/builds/build_lazlo_marlowe_v0_1.py`; `hyperagent/exports/agents/agent-lazlo-marlowe-v0_1.json`; `hyperagent/exports/skills/skill-lazlo-marlowe-*-v0_1.json`; `agents/registry/hyperagent/astrajax/lazlo-marlowe/build-pack-v0.1.md`; `agents/registry/cursor/astrajax/lazlo-marlowe/build-pack-v0.1.md` | Generated agent pack / skill source | Matthew | Matthew-approved Lazlo self-spine, v0.2.2 creative-writing merge, and v0.2.3 Super Objective / mind-attitude safeguards; founding-cast typings pending | Current | Lazlo Marlowe craft engine, Vol II distillation, governed HyperAgent defaults, five-skill creative merge, prompt-safety checks, cast typing status |
| `SRC-AJ-MILO-CADENCE` | `hyperagent/builds/build_milo_cadence_v0_1.py`; `hyperagent/exports/agents/agent-milo-cadence-v0_1.json`; `hyperagent/exports/skills/skill-character-motion-timecraft-v0_1.json`; `agents/registry/hyperagent/astrajax/milo-cadence/build-pack-v0.1.md`; `agents/registry/hyperagent/astrajax/character-motion-timecraft/build-pack-v0.1.md` | Hyperagent agent pack / skill source | Matthew | Matthew-approved Phase B build; embedded Mirodan Vol II movement engine; media tools approved; Milo self-spine pending validation | Current | Milo Cadence TIME lane and Character Motion Timecraft runtime pack; re-import agent JSON only when deploying |

## Agent skills (.cursor/skills/)

| Source ID | Title | Type | Owner | Authority | Freshness | Destination |
|---|---|---|---|---|---|---|
| `SRC-CLIVE-INTAKE-SKILL` | `.cursor/skills/clive-context-intake/SKILL.md` | Cursor skill | Matthew | Canonical | Current | Clive Operating Rules |
| `SRC-CLIVE-INTAKE-SLACK` | `.cursor/skills/clive-context-intake-slack-blocks/SKILL.md` | Cursor skill | Matthew | Canonical | Current | Clive Operating Rules |
| `SRC-CLIVE-CURATOR-SKILL` | `.cursor/skills/clive-context-curator/SKILL.md` | Cursor skill | Matthew | Canonical | Current | Clive Operating Rules |
| `SRC-CLIVE-SCANNER-SKILL` | `.cursor/skills/clive-context-scanner/SKILL.md` | Cursor skill | Matthew | Canonical | Current | Clive Operating Rules |
| `SRC-CLIVE-RELEASE-SCANNER` | `.cursor/skills/clive-hyperagent-release-scanner/SKILL.md` | Cursor skill | Matthew | Canonical | Current | Clive Operating Rules |
| `SRC-CLIVE-MAN-SKILL` | `.cursor/skills/clive-man/SKILL.md` | Cursor skill | Matthew | Canonical | Current | Consolidated Clive context steward and Airtable architecture source discipline |
| `SRC-DOC-SKILL` | `.cursor/skills/doc/SKILL.md` | Cursor skill | Matthew | Canonical | Current | Doc routing, minion flow, and Clive's Man execution handoff template |
| `SRC-DOC-AIRTABLE-MINION-SKILL` | `.cursor/skills/doc-airtable-minion/SKILL.md` | Cursor skill | Matthew | Current implementation reference | Current | Brain Base Builder Mode 1 and Airtable MCP build checklist |
| `SRC-DOC-WORKSHOP-PROPOSER-SKILL` | `.cursor/skills/doc-workshop-proposer/SKILL.md` | Cursor skill | Matthew | Canonical | Current | Doc minions |
| `SRC-DOC-WORKSHOP-HYPERAGENT-SKILL` | `.cursor/skills/doc-workshop-hyperagent/SKILL.md`; `.cursor/skills/doc-workshop-hyperagent/reference.md`; `hyperagent/builds/_hyperagent_export.py`; `hyperagent/scripts/validate_hyperagent_export.py`; `agents/registry/cursor/doc/workshop-hyperagent/build-pack-v0.2.md` | Cursor skill / build tooling | Matthew | Current implementation reference | Current | Doc's Workshop Hyperagent Builder, shared export helper, and validation gate |

## Model and strategy docs (archived — reference only)

| Source ID | Title | Type | Owner | Authority | Freshness | Destination |
|---|---|---|---|---|---|---|
| `SRC-MODEL-STACK` | `docs/archive/strategy-notes/agent-model-collaboration-stack-notion.md` | Strategy doc | Matthew | Archived | Current | Model Collaboration |
| `SRC-CONTEXT-MODELS` | `docs/archive/strategy-notes/best-models-for-context-environments-notion.md` | Strategy doc | Matthew | Archived | Current | Model Collaboration |

## Working drafts (not canonical until approved)

| Source ID | Title | Type | Owner | Authority | Freshness | Notes |
|---|---|---|---|---|---|---|
| `SRC-HA-RELATIONSHIP` | `docs/context/Airtable/Hyperagent-Relationship/` | Draft folder | Matthew | Working draft | Current | Founding 500 + Airspace |
| `SRC-SEEDS-PLAN` | `docs/context/Seeds-of-Promise/` | Draft folder | Matthew | Working draft | Current | Seeds pitch material |
| `SRC-DRAFT-CONTEXT-FLOW` | `agents/draft/context-processing/` | Draft folder | Matthew | Working draft | Current | Proposed simpler Clive context processing flow |
| `SRC-JOURNEY-EDIT` | `docs/context/astrajax-journey-video-edit-guide-2026-05-31.md` | Draft doc | Matthew | Working draft | Current | Video edit guide |
| `SRC-TALK-TRACK` | `docs/context/matthew-talk-track-v3.md` | Draft doc | Matthew | Working draft | Current | Founder talk script |
| `SRC-CLIVE-TRINITY-FLOW` | `docs/context/trinity-agent-flow.md` | Repo doc | Matthew | Working reference | Current | Proposer / challenger / executor pattern from Claude chat |

## Bootstrap notes

- This registry is not a replacement for Airtable source links on Context Items.
- Context Items created from bootstrap should cite these source IDs in `Source Notes`.
- Conflicts between sources should be surfaced in Curator review and decided by Matthew before approval.
- Working drafts live in `docs/context/` for convenience until Publisher exists or Matthew approves them as Context Items.
