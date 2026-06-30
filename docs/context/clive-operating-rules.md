# Clive Operating Rules Context Pack

**Status:** Operational.  
**Primary destination:** Cursor/GitHub.  
**Owner:** Matthew.  

## Purpose

Define the active Clive context-governance lane after the consolidation into
Clive's Man.

## Operating Principle

```text
Clive reasons -> Clive's Man stewards the brain -> Pam challenges high stakes
-> humans approve truth -> Doc handles non-brain action dispatch
```

## Active context lane

### Clive's Man

Clive's Man is the visible steward for the Clive brain. He consolidates the
former Intake, Curator, Publisher, and Context Scanner responsibilities into one
governed context-upkeep lane.

He runs GPT for judgement and orchestration. He uses three Composer minions for
Trinity:

- Proposer: drafts the likely context action with evidence.
- Challenger: red-teams the action and scores confidence by decision type.
- Executor: performs only reversible or explicitly approved actions and logs the
  paper trail.

### What became workflows

- Intake is now Clive's Man intake workflow.
- Curator is now Clive's Man curation workflow.
- Publisher is now Clive's Man publish-prep workflow.
- Context Scanner is now Clive's Man source-scanning/intake workflow.

The old active agents are retired from the roster. Their historical artifacts are
archived. Shared scripts remain available as tools.

## Active non-context-lane agents

### Doc's Workshop

Agent design and build is a **Doc minion** (`doc-workshop-proposer`), reached via `@doc`
or `@doc-workshop-proposer`. Clive may help shape the idea; Doc routes approved agent
build work here.

### Clive Hyperagent Release Scanner

Hyperagent Release Scanner remains active unless explicitly replaced later. It
protects the curated Hyperagent platform truth used by Doc's Workshop and Clive's
Man.

## Human approval rule

An item is canonical only when:

- `Status = Approved`, and
- `Confirmed By Human` is set by a human-only path.

Clive's Man and his minions may create draft/proposed work and prepare review
materials. They may not set `Confirmed By Human`, `Approved`, `Published`, or
`Deprecated`.

## Human-load policy

Humans should not approve routine reversible classifications one by one. Clive's
Man produces digests and escalates exceptions.

Humans must decide:

- canonical approval
- final publish or merge
- deletion, deprecation, or overwrite of trusted context
- agent rules, permissions, deployment, or model-routing changes
- external claims, clients, money, policy, live users, or sensitive data
- material Proposer/Challenger disagreement

## Status gates

- Draft / New / Ready for review: agent-created low-authority work.
- Proposed: agent-proposed durable context, still not canonical.
- Needs decision: human attention required.
- Approved / Published / Deprecated: human-only paths.

## Source IDs

- `SRC-CLIVE-MAN-SKILL`: `.cursor/skills/clive-man/SKILL.md`
- `SRC-CLIVE-MAN-PROPOSER`: `.cursor/skills/clive-man-proposer/SKILL.md`
- `SRC-CLIVE-MAN-CHALLENGER`: `.cursor/skills/clive-man-challenger/SKILL.md`
- `SRC-CLIVE-MAN-EXECUTOR`: `.cursor/skills/clive-man-executor/SKILL.md`
- `SRC-CLIVE-APPROVAL`: `docs/context/clive-operating-rules.md` § Human approval rule; `docs/business/architecture.md` §4–§7
