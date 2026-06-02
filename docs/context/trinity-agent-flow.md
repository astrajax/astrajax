# Trinity Agent Flow

**Status:** Working reference.  
**Owner:** Matthew.  
**Source:** Matthew's Claude share, 1 Jun 2026: <https://claude.ai/share/16dd25ae-5379-4d31-a409-3239b92aaa27>.  
**Purpose:** Give future agents a reusable pattern for high-stakes agent workflows, especially context intake and curation.

**Current draft implementation:** `agents/draft/context-processing/`.

## Short Version

The Trinity pattern splits an important agent task into three narrow jobs:

1. **Proposer** - makes the first recommendation and explains the evidence.
2. **Challenger** - red teams it: pokes holes, finds risks, and offers alternatives.
3. **Executor** - acts only from the final brief and leaves a paper trail.

The aim is not to make agents theatrical. It is to stop one agreeable model response from becoming an unchecked action.

## Why It Exists

The conversation started from a practical trust problem:

- AI is useful as a thinking partner, but a single answer is often too agreeable.
- Action-taking agents raise the stakes because a bad answer can become a bad update, message, or record.
- For important workflows, the system should make disagreement and evidence visible before anything changes.

The working principle is:

```text
one agent proposes -> one agent challenges -> one agent executes from the agreed brief
```

This turns "ask the AI once" into a small review system.

## The Three Roles

### 1. Proposer

The Proposer creates the first draft of the action.

It should:

- State the proposed action plainly.
- Name the source material used.
- Explain why the action is useful.
- Flag uncertainty instead of hiding it.
- Avoid making final approval claims.

Example outputs:

- "Create a Context Item for this new source."
- "Mark this as a possible duplicate."
- "Suggest updating the summary because the current wording is stale."

### 2. Challenger

The Challenger is the red team role. Red team means deliberately looking for weaknesses before the system acts.

It should:

- Check whether the Proposer missed context.
- Look for duplicates, stale assumptions, weak evidence, and overreach.
- Defend useful material from accidental deletion.
- Identify novelty instead of rejecting it just because it does not match old patterns.
- Offer a better alternative when it rejects the proposal.

The Challenger should not simply say "approved" or "rejected". It should show its reasoning.

### 3. Executor

The Executor carries out the final brief.

It should:

- Act only within the allowed write surface.
- Use internal record IDs where tools require them.
- Write the audit trail or confirmation note.
- Avoid re-deciding the issue from scratch.
- Stop if the final brief conflicts with current policy.

For current Clive context work, the Executor may create or update agent-allowed records, but it must not mark context as human-approved.

## Where The Scanner Fits

The Scanner is upstream of the Trinity. It is the discovery layer, not the decision layer.

```text
Scanner finds candidate material -> Trinity decides what to do with it
```

A scanner does not need its own full Trinity unless it is making a decision with real consequences. If it is only surfacing possible material, the Trinity starts after discovery.

## Context Intake Pattern

For context intake, the flow is:

```text
Scanner -> Intake Proposer -> Intake Challenger -> Intake Executor -> review queue
```

The Scanner finds possible new context. The Proposer turns it into a candidate record or action. The Challenger checks whether it is genuinely useful, duplicated, stale, risky, or missing source evidence. The Executor creates the allowed record and records the reasoning.

Current Clive rule:

- Agents may create `Context Intake` records and `Context Items` with `Status = Proposed` where the relevant skill allows it.
- Agents must not set `Confirmed By Human`, `Approved`, `Published`, or `Deprecated`.
- Canonical context still requires Matthew or TL approval through the V2 human approval path.

## Context Curator Pattern

For curation, the flow is:

```text
Curator scan -> Curator Proposer -> Curator Challenger -> Curator Executor -> human decision if needed
```

The Curator scan finds possible issues across existing context:

- Duplicate records.
- Stale context.
- Conflicting claims.
- Missing source notes.
- Context that may belong in a different pack.

The Proposer recommends the change. The Challenger tries to protect useful context from being removed or flattened. The Executor queues the proposed edit, deletion, merge, or escalation in the allowed surface.

For destructive actions such as deletion, deprecation, or replacing canonical wording, the Executor should route to human review unless a future approved policy explicitly allows automation.

## Confidence Scoring

Confidence should not be one generic number. The chat identified that different decisions carry different risks.

Use separate confidence by decision type:

- **Duplicate confidence** - how sure the system is that two items are the same.
- **Staleness confidence** - how sure the system is that context is no longer current.
- **Relevance confidence** - how sure the system is that context belongs in this environment.
- **Conflict confidence** - how sure the system is that two sources disagree.
- **Action confidence** - how sure the system is that the proposed write is allowed and useful.

High confidence can reduce manual review only where current policy allows it. It does not override the human approval rule for canonical context.

## Escalation Rules

Escalate to Matthew or TL when:

- The Proposer and Challenger materially disagree.
- The action would delete, deprecate, publish, approve, or overwrite canonical context.
- The source is novel and does not fit old patterns.
- The context may affect external positioning, client claims, finances, personal data, or operational policy.
- Confidence depends on incomplete Airtable or repo access.
- The action would create a new rule for future agents.

## Airtable And MCP Pattern

The conversation endorsed Airtable as the shared source of truth for context operations, with agents using MCP access to read and write records.

For agents, this means:

- Read from the same canonical tables before proposing.
- Write only to the table and status fields allowed by the relevant skill.
- Store source links, reasoning, and the specific agent name.
- Prefer links and record IDs over loose prose.
- Treat Airtable as the operating layer and GitHub Markdown as the versioned context layer.

This keeps the system platform-agnostic: different models can use the same context store instead of trapping useful context inside one model's chat history.

## Minimum Handoff Contract

Each Trinity step should pass forward a short structured brief:

```text
Decision type:
Source records / links:
Proposed action:
Evidence:
Challenger concerns:
Alternative considered:
Final brief for executor:
Confidence by decision type:
Human review required:
Specific agent names:
```

This is the paper trail. Without it, the next agent cannot tell whether the flow was genuinely reviewed or just rubber-stamped.

## Known Failure Modes

The Claude chat highlighted these risks:

- **Context mismatch:** the Proposer and Challenger may not be looking at the same source set.
- **Novelty suppression:** the Challenger may reject something valuable because it does not match previous patterns.
- **Overloaded confidence:** one confidence score can hide very different kinds of risk.
- **Pattern lock:** the Curator can keep enforcing old assumptions after the business changes.
- **Manual gate overload:** too many human review gates make the system slow and easy to ignore.
- **Automation overreach:** removing human review too early can turn tidy automation into quiet drift.

Mitigation:

- Share source links and reasoning between steps.
- Score by decision type.
- Periodically ask the Curator to reconsider old decisions with fresh context.
- Keep human review for irreversible, external, or policy-setting changes.

## Current Policy Boundary

This document is a reference pattern, not a replacement for `context-architecture-v2.md` or `human-approval-path.md`.

Until Matthew changes the operating policy, the live rule remains:

```text
Agents propose. Humans approve. Publisher publishes.
```

