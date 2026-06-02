# Clive Operating Rules Context Pack

**Status:** Bootstrap draft.  
**Primary destination:** Cursor/GitHub.  
**Owner:** Matthew.  
**Primary sources:** `.cursor/skills/clive-context-intake/SKILL.md`,
`.cursor/skills/clive-context-curator/SKILL.md`,
`clive_context_architecture_v1.md`.

## Purpose

Define agent boundaries, write surfaces, and human approval gates for Clive.

## Operating Principle

```text
Airtable governs -> Hyperagent captures -> Cursor curates/builds -> GitHub versions -> humans approve
```

## Agent Boundaries

### Clive Intake

Intake captures one messy submission, classifies it, suggests a destination,
creates one `Context Intake` record, reads it back, and stops.

Intake never approves, publishes, deploys, edits files, creates memories, or
writes outside `Context Intake`.

### Clive Curator

**Production:** Hyperagent V5 (scheduled and button-triggered context health
audits). Live import: `agents/hyperagent/clive/curator/LIVE.md`.

Curator reviews intake and canonical context tables, clusters related context,
exposes conflicts, and creates `Context Items` with `Status = Proposed` only
after explicit Matthew confirmation.

Curator never approves, rejects, publishes, deploys, writes Change Log entries,
edits repo files while acting as Curator, or treats proposals as canonical.

Human approval uses V2 paths only — see `human-approval-path.md`.

### Clive Agent Factory

Agent Factory is Cursor-native (agents are built in Cursor). It runs roster-aware,
risk-tiered design interviews and drafts complete agent config packs with evals
and tool rationale. It operates in two phases: Phase A design is read-only;
Phase B build writes versioned repo artifacts only after explicit Matthew
approval. High-risk builds require an independent Opus 4.7 review pass. It reads
Agent Environments and Context Packs (read-only on Airtable). It never commits,
pushes, deploys to Hyperagent, writes Airtable, or writes Change Log entries.

### Clive Publisher

Publisher is planned. It will read approved Context Items/Packs, prepare exports
to GitHub/Hyperagent/Notion, append Change Log entries, and stop for Matthew
approval before any deploy or commit.

### Clive Context Scanner

**Production:** Hyperagent v0.4 (manual or daily schedule; native Slack summary
after scheduled runs). Live import:
`agents/hyperagent/clive/context-scanner/LIVE.md`.

Scans Airtable **Emails** (excluding Hyperagent Release), dedupes against intake
and items, and creates **Context Intake** records only after Matthew confirms.

Skill: `.cursor/skills/clive-context-scanner/SKILL.md`. A Cursor mirror exists
for local dev (`.cursor/agents/clive-context-scanner.md`); production is
Hyperagent.

Does not handle Hyperagent Release emails — see Clive Hyperagent Release Scanner
(Cursor-native).

## Status Gates

- Intake statuses: `New`, `Needs clarification`, `Ready for review`,
  `Possible duplicate`.
- Curator create status: `Proposed` only.
- Human statuses: `Needs decision`, `Approved`, `Rejected`, `Deprecated`.
- Publisher statuses: `Prepared`, `Published`, `Deployed`, with Change Log.

## Source IDs

- `SRC-CLIVE-INTAKE-SKILL`: `.cursor/skills/clive-context-intake/SKILL.md`
- `SRC-CLIVE-CURATOR-SKILL`: `.cursor/skills/clive-context-curator/SKILL.md`
- `SRC-CLIVE-ARCH-V1`: `clive_context_architecture_v1.md`
