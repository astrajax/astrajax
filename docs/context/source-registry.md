# Context Bootstrap Source Registry

**Status:** Current inventory (updated 17 Aug 2026).
**Owner:** Matthew.  
**Purpose:** Source inventory for Clive context surfaces — bootstrap packs, skills, and operational docs.

**Current steward:** Clive's Man owns the context lane. The former Clive Intake,
Curator, Publisher, and Context Scanner agents are retired as active owners; their
duties now run as workflows inside Clive's Man. Historical skills and scripts may
remain in the repo as shared tools or reference material, but do not treat them as
the current roster.

## Canonical packs (docs/context/)

| Source ID | Title | Type | Owner | Authority | Freshness | Destination |
|---|---|---|---|---|---|---|
| `SRC-AJ-POSITIONING` | `docs/business/positioning.md` | Repo doc | Matthew | Canonical | Current | AstraJax Core Positioning (old `astrajax_positioning.md` archived in `docs/archive/`) |
| `SRC-AJ-OPS` | `docs/business/internal-brief.md` | Repo doc | Matthew | Canonical | Current | Internal priorities and guardrails |
| `SRC-AJ-AGENTS` | `AGENTS.md` | Repo doc | Matthew | Canonical | Current | AstraJax Core Positioning |
| `SRC-CLIVE-ARCH-V1` | `docs/archive/context-architecture-v1.md` | Repo doc | Matthew | Archived reference | Historical | Context Architecture V1 tables and lifecycle; superseded by `docs/business/architecture.md` for live product truth |
| `SRC-CLIVE-ARCH-V2` | `docs/archive/context-architecture-v2.md` | Repo doc | Matthew | Archived reference | Historical | V2 approval enforcement; live gates in `clive-operating-rules.md` and `docs/business/architecture.md` |
| `SRC-CLIVE-SCHEMA-V1` | `hyperagent/context_architecture_schema_v1.json` | Schema file | Matthew | Archived reference | Historical | Context Architecture V1 schema file |
| `SRC-CLIVE-APPROVAL` | `docs/context/clive-operating-rules.md` § Human approval rule; `docs/business/architecture.md` §4–§7 | Operational doc | Matthew | Canonical | Current | Human approval gates after Clive's Man consolidation |
| `SRC-CLIVE-EMAIL-INBOX` | `docs/context/email-inbox-setup.md` | Operational doc | Matthew | Canonical | Current | Clive Operating Rules |
| `SRC-HYPERAGENT-PLATFORM` | `docs/context/hyperagent-platform.md` | Repo doc | Matthew | Canonical candidate | Current | Hyperagent Platform |
| `SRC-HYPERAGENT-RELEASES` | `docs/context/hyperagent-releases.json` | Raw log | Agent | Unverified | Rolling | Hyperagent Platform |

## Airtable architecture sources (Chapter 1)

| Source ID | Title | Type | Owner | Authority | Freshness | Destination |
|---|---|---|---|---|---|---|
| `SRC-AJ-ARCHITECTURE` | `docs/business/architecture.md` | Repo doc | Matthew | Canonical | Current | Product and governance architecture |
| `SRC-AJ-BRAIN-WIRING` | `docs/initiatives/brain-key-wiring.md` | Working spec | Matthew | Working current | Current | Brain Key access model, storage boundaries, API contracts |
| `SRC-AJ-BRAIN-SCHEMA` | `docs/initiatives/brain-key-schema.md` | Schema blueprint | Matthew | Current implementation reference | Current | Replicable Airtable table and field blueprint; Workshop **Source Documents** (29 Jun 2026); Trusted Creative + **Media Assets** (10 Aug 2026); Draft Brain Truth dual-register, Brain Registry link, builder-review overlay contract, and thin **Projects** register (17 Aug 2026) |
| `SRC-AJ-CONTEXT-STRUCTURE` | `docs/initiatives/chapter1-context-structure.md` | Working spec | Matthew | Working current | Current | Chapter 1 canonical operator profile, brain themes, universal categories, progressive disclosure L0–L3 |
| `SRC-AJ-BRAIN-IDS` | `website/src/lib/brains/airtable-ids.ts` | Code ID map | Matthew | Live implementation | Current | Live Chapter 1 Airtable base, table, and field IDs; Draft Brain Truth destination/link fields and human-only builder overlay denylist (17 Aug 2026); Clive + Clive's Man + Pam + Doc spines Approved-Canonical 27 Jun 2026; Kathryn Goodchild Agent base + Persona Config (11 Aug 2026) |
| `SRC-AJ-DRAFT-TRUTH-WRITE` | `website/src/lib/brains/draft-truth-write.ts`; `.claude/skills/clive-man/SKILL.md`; `.cursor/skills/clive-man-activity-intake/SKILL.md`; `docs/context/clive-man-context-flow.md` | Website write contract / agent contracts / operator doc | Matthew | Current implementation reference | Current | One Draft Brain Truth create contract: dual text, live Brain Registry destination, Draft/Quarantined only, builder-review fields human-only, optional Related Projects from HEAD-chosen IDs only (proposer copies; challenger may veto; executors write IDs only; morning pipe does not choose); website REST writes by field ID; HyperAgent v0.4 family pack regenerated in-repo, human re-import still required |
| `SRC-AJ-BRAIN-BUILDER` | `docs/initiatives/doc-brain-base-builder.md` | Working spec | Matthew | Current implementation reference | Current | Doc Brain Base Builder status, runbook, credential notes |
| `SRC-AJ-DOC-MINIONS` | `docs/initiatives/doc-minions.md` | Working spec | Matthew | Current implementation reference | Current | Doc minion roster, two-phase build rule, mandatory Clive's Man handoff |
| `SRC-AJ-INTERACTION-REVIEW` | `website/src/app/brain/review/page.tsx` (redirect); `website/src/app/brain/[slug]/page.tsx`; `website/src/components/brain/BrainWorkspace.tsx`; `website/src/components/brain/InteractionReviewShell.tsx`; `website/src/app/api/brains/interactions/list/route.ts`; `website/src/app/api/brains/interactions/score/route.ts`; `website/src/lib/brains/handlers/interaction-list.ts`; `website/src/lib/brains/handlers/interaction-score.ts`; `website/src/lib/brains/handlers/interaction-memory.ts` | Website UI / API implementation | Matthew | Live implementation | Current | Client-facing Brain Interactions review and scoring surface; review signal only, not canonical approval |
| `SRC-AJ-BRAIN-SHRINE` | `docs/initiatives/brain-shrine-build-plan.md`; `website/src/app/brain/page.tsx`; `website/src/components/brain/BrainShrine.tsx`; `website/src/lib/platform/brains.ts`; `website/src/app/api/brains/list/route.ts`; `website/public/brain/shrine-stage.png` | Working spec / Website UI | Matthew | Working current | Current | Context governance entry — single-brain shrine, per-brain workspace at `/brain/[slug]`; seeded shelf until Registry list wired |
| `SRC-AJ-BRAIN-UPKEEP` | `docs/initiatives/brain-upkeep.md`; `website/src/lib/brains/interaction-upkeep.ts`; `website/src/app/api/brains/interactions/action/route.ts`; `website/src/lib/brains/handlers/interaction-action.ts`; `website/src/lib/brains/handlers/interaction-upkeep.test.ts` | Working spec / Website API implementation | Matthew | Current implementation reference | Current | Thin Brain Upkeep loop: Needs Review shortlist and Workshop-only propose/dismiss actions |
| `SRC-AJ-SOURCE-DOC-MINE` | `docs/initiatives/source-document-mining.md`; `website/src/lib/brains/source-document-mining.ts`; `website/src/lib/brains/source-document-mining.test.ts`; `website/src/lib/brains/draft-truth-write.ts`; `website/src/lib/brains/handlers/source-document-mine.ts`; `website/src/app/api/brains/source-documents/mine/route.ts` | Working spec / Website API implementation | Matthew | Current implementation reference | Current | Clive's Man V1: Workshop Source Documents summary-only mine → contract-complete Draft Brain Truth proposals with inverse source link; Pam category ceiling; never Trusted |
| `SRC-AJ-OPERATOR-STATE` | `docs/initiatives/ia-three-modes-build-plan.md`; `docs/initiatives/brain-key-schema.md` § Operator State; `docs/initiatives/brain-key-wiring.md` § Operator Session Model; `website/src/lib/platform/operator-state.ts`; `website/src/lib/platform/operator-store/`; `website/src/lib/platform/enter-routing.ts`; `website/src/lib/auth/`; `website/src/app/enter/`; `website/src/app/house/`; `website/src/app/showroom/`; `website/src/app/api/auth/`; `website/src/app/api/journey/progress/route.ts` | Working spec / Website implementation | Matthew | Current implementation reference | Current | Phase 1+2 IA build (PR #64, 4 Aug 2026): operator state contract, Auth.js v5 JWT sign-in, server-authored `/enter` routing, back-of-house role gating on dispatch/deploy/fleet/command |

## Character and roster sources

| Source ID | Title | Type | Owner | Authority | Freshness | Destination |
|---|---|---|---|---|---|---|
| `SRC-AJ-CHARACTER-PROVENANCE` | `docs/initiatives/character-provenance.md` | Working provenance doc | Matthew | Working current | Current | Founding cast rationale; Clive + Clive's Man + Pam + Doc COMPLETE (27 Jun 2026); Vera/Iris pending |
| `SRC-AJ-LAZLO-CRAFT` | `.cursor/agents/lazlo-marlowe.md`; `.cursor/skills/lazlo-marlowe-character-craft/SKILL.md`; `.cursor/skills/lazlo-marlowe-diagnosis/SKILL.md`; `.cursor/skills/lazlo-marlowe-new-character/SKILL.md`; `.cursor/skills/lazlo-marlowe-relationships/SKILL.md`; `.cursor/skills/lazlo-marlowe-cast-audit/SKILL.md`; `.cursor/skills/lazlo-marlowe-airtable/SKILL.md`; `hyperagent/builds/build_lazlo_marlowe_v0_1.py`; `hyperagent/exports/agents/agent-lazlo-marlowe-v0_1.json`; `hyperagent/exports/skills/skill-lazlo-marlowe-*-v0_1.json`; `agents/registry/hyperagent/astrajax/lazlo-marlowe/build-pack-v0.1.md`; `agents/registry/cursor/astrajax/lazlo-marlowe/build-pack-v0.1.md` | Generated agent pack / skill source | Matthew | Matthew-approved Lazlo self-spine, v0.2.4 Trinity Airtable wiring; Clive + Clive's Man + Pam + Doc canonical 27 Jun 2026; Vera/Iris typings pending | Current | Lazlo Marlowe craft engine, Vol II distillation, governed HyperAgent defaults, six-skill creative and Trinity Airtable pack, prompt-safety checks, cast typing status, Agent-base write gate |
| `SRC-AJ-KATHRYN-GOODCHILD` | Kathryn Goodchild Agent base `appzvesAIpPxjfAMF`; `hyperagent/exports/agents/agent-kathryn-goodchild-v0_1.json`; `hyperagent/exports/skills/skill-kathryn-goodchild-v0_1.json`; `agents/registry/hyperagent/astrajax/kathryn-goodchild/build-pack-v0.1.md`; `agents/registry/cursor/astrajax/kathryn-goodchild/build-pack-v0.1.md`; `docs/initiatives/fleet-sync-2026-08-10/README.md` | Agent base / generated agent pack / exception log | Matthew | Approved Kathryn-only setup (during former freeze); fleet sync freeze lifted 2026-08-12 | Current | Kathryn Goodchild visual-coach agent base; Persona Config `Operational v1.0 (HyperAgent sync)` (`recZkhAbib7fQBL8Z`); 18 Skills rows; keep her out of fleet sync roster until repo export matches canonical Downloads |
| `SRC-AJ-MILO-CADENCE` | `hyperagent/builds/build_milo_cadence_v0_1.py`; `hyperagent/exports/agents/agent-milo-cadence-v0_1.json`; `hyperagent/exports/skills/skill-character-motion-timecraft-v0_1.json`; `agents/registry/hyperagent/astrajax/milo-cadence/build-pack-v0.1.md`; `agents/registry/hyperagent/astrajax/character-motion-timecraft/build-pack-v0.1.md` | Hyperagent agent pack / skill source | Matthew | Matthew-approved Phase B build; embedded Mirodan Vol II movement engine; media tools approved; Milo self-spine pending validation | Current | Milo Cadence TIME lane and Character Motion Timecraft runtime pack; re-import agent JSON only when deploying |

## Agent skills (.cursor/skills/)

| Source ID | Title | Type | Owner | Authority | Freshness | Destination |
|---|---|---|---|---|---|---|
| `SRC-CLIVE-INTAKE-SKILL` | `.cursor/skills/clive-context-intake/SKILL.md` | Cursor skill | Matthew | Retired workflow reference | Historical | Intake workflow now owned by Clive's Man; keep only as reference/shared tool if still useful |
| `SRC-CLIVE-INTAKE-SLACK` | `.cursor/skills/clive-context-intake-slack-blocks/SKILL.md` | Cursor skill | Matthew | Retired workflow reference | Historical | Slack intake workflow now owned by Clive's Man; keep only as reference/shared tool if still useful |
| `SRC-CLIVE-CURATOR-SKILL` | `.cursor/skills/clive-context-curator/SKILL.md` | Cursor skill | Matthew | Retired workflow reference | Historical | Curation workflow now owned by Clive's Man; keep only as reference/shared tool if still useful |
| `SRC-CLIVE-SCANNER-SKILL` | `.cursor/skills/clive-context-scanner/SKILL.md` | Cursor skill | Matthew | Retired workflow reference | Historical | Scanner workflow now owned by Clive's Man; keep only as reference/shared tool if still useful |
| `SRC-CLIVE-RELEASE-SCANNER` | `.cursor/skills/clive-hyperagent-release-scanner/SKILL.md` | Cursor skill | Matthew | Canonical | Current | Clive Operating Rules |
| `SRC-CLIVE-OPS` | Clive Agent base Persona Config `Operational v0.2` (`recJFiRQjbIecCAQ5`, `appBd9tudgvOSrhSX`) | Airtable Persona Config | Matthew | Canonical | Current | Clive technical role — system prompt, rules, output format |
| `SRC-CLIVE-SKILL` | `.cursor/skills/clive/SKILL.md` | Cursor skill | Matthew | Sync artifact | Current | Repo copy until generator syncs from Persona Config |
| `SRC-PAM-OPS` | Pam Agent base Persona Config `Operational v0.2` (`rect3MIejCMhCWdH1`, `appH7NeSSNntuKRL4`); Narrative Arch spine (`tblPMfpSZ7VTp87Pk`) | Airtable Persona Config + spine | Matthew | Canonical | Current | Pam technical role + Approved-Canonical character spine (27 Jun 2026) |
| `SRC-DOC-OPS` | Doc Agent base Persona Config `Operational v0.2` (`rec0KNMfpdSlPWQuf`, `appI5tpwsKNwjfrqR`); Narrative Arch spine (`tblnAjaDHX0yccXgv`) | Airtable Persona Config + spine | Matthew | Canonical | Current | Doc technical role + Approved-Canonical character spine (27 Jun 2026) |
| `SRC-KATHRYN-GOODCHILD-OPS` | Kathryn Goodchild Agent base Persona Config `Operational v1.0 (HyperAgent sync)` (`recZkhAbib7fQBL8Z`, `appzvesAIpPxjfAMF`) | Airtable Persona Config | Matthew | Canonical | Current | Kathryn Goodchild technical role — Coach; visual-coach system prompt, rules, output format |
| `SRC-LAZLO-OPS` | Lazlo Agent base Persona Config `Operational v0.2` (`recHipJdrgeh0PAof`, `appMHIxnwPMljiAQB`) | Airtable Persona Config | Matthew | Canonical | Current | Lazlo technical role — system prompt, rules, output format |
| `SRC-CLIVE-MAN-OPS` | Clive's Man Agent base Persona Config `Operational v0.3` (`rect04amPJAZrWCi4`, Approved; `Operational v0.4` `recSKTT8NTTJOmuRu` Pending gate, `appZ71CSKBlhnb4hR`) | Airtable Persona Config | Matthew | Canonical | Current | Clive's Man technical role — system prompt, rules, output format |
| `SRC-CLIVE-MAN-SKILL` | `.cursor/skills/clive-man/SKILL.md` | Cursor skill | Matthew | Sync artifact | Current | Option 3 lanes, scheduled family contract, Draft status operating rules |
| `SRC-CLIVE-MAN-AMBIENT` | `.cursor/skills/clive-man-ambient-capture/SKILL.md`; `.cursor/agents/clive-man-ambient-capture.md` | Cursor skill / agent | Matthew | Working current | Current | Ambient Capture 05:00 contract; CREATE_DRAFT_TRUTH; checkpoint table `tblRbjD0PHtuTWsIL` (activation gated) |
| `SRC-CLIVE-MAN-ACTIVITY-INTAKE` | `.cursor/skills/clive-man-activity-intake/SKILL.md`; `.cursor/agents/clive-man-activity-intake-cursor.md`; `agents/registry/hyperagent/clive/activity-intake/build-pack-v0.1.md`; `hyperagent/exports/agents/agent-clive-man-activity-intake-hyperagent-v0_1.json` | Cursor skill / agent / HA export | Matthew | Working current | Current | Household Activity exchange → V1 Proposed; Cursor on-demand + HA twin |
| `SRC-CLIVE-MAN-CONTEXT-FLOW` | `docs/context/clive-man-context-flow.md` | Operational doc | Matthew | Working current | Current | Founder walkthrough of the context lane (intake doors, secrets, cap, bookmark) |
| `SRC-CLIVE-MAN-CONTEXT-SPECIALISTS` | `.cursor/skills/clive-man-context-auditor/SKILL.md`; `.cursor/skills/clive-man-context-challenger/SKILL.md`; `.cursor/skills/clive-man-context-executor/SKILL.md` | Cursor skills | Matthew | Working current | Current | Scheduled Context Auditor 06:00 / Challenger 07:00 / Executor 08:00 |
| `SRC-DOC-SKILL` | `.cursor/skills/doc/SKILL.md` | Cursor skill | Matthew | Sync artifact | Current | Repo copy until generator syncs from Persona Config |
| `SRC-DOC-BRAIN-BASE-BUILDER-SKILL` | `.cursor/skills/doc-brain-base-builder/SKILL.md` | Cursor skill | Matthew | Current implementation reference | Current | Doc Brain Base Builder Mode 1 and Airtable MCP build checklist |
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

- **Agent technical role specs** live in each Agent base **Persona Config** (`Operational v0.2`), not in repo skills. See `SRC-*-OPS` rows above and `docs/business/architecture.md` §4.
- This registry is not a replacement for Airtable source links on Context Items.
- Context Items created from bootstrap should cite these source IDs in `Source Notes`.
- Conflicts between sources should be surfaced in Clive's Man curation review and decided by Matthew before approval.
- Working drafts live in `docs/context/` for convenience until Clive's Man publish-prep bundles them or Matthew approves them as Context Items.
