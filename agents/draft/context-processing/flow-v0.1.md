# Context Processing Flow v0.1

**Status:** Draft proposal.  
**Goal:** Less human gating, tighter agent scopes, clearer handoffs.

## One-Screen Flow

```text
Source Scout
  finds possible context

Context Framer
  turns one source into a clear proposed claim or action

Context Skeptic
  challenges the claim, checks duplicates, and looks for risk

Context Clerk
  writes the safe record and the reasoning trail

Context Housekeeper
  scans the existing library for rot, duplicates, and conflict

Human Review
  handles exceptions and approves canonical truth

Publisher
  exports only approved truth into repo docs, agent prompts, or other surfaces
```

## What Changes

The old mental model can feel like:

```text
find -> ask Matthew -> propose -> ask Matthew -> curate -> ask Matthew -> publish
```

The draft model should feel like:

```text
find -> propose with challenge built in -> queue only the decisions that need Matthew
```

The important distinction:

- **Proposed context is a queue.** Agents can help fill it.
- **Approved context is truth.** Humans still approve it.
- **Published context is distribution.** Publisher handles it after approval.

## Lane 1 - New Context

Use this when new material arrives from Slack, Cursor, Airtable Emails, Notion, repo docs, or manual submission.

```text
Source Scout -> Context Framer -> Context Skeptic -> Context Clerk -> Proposed queue
```

### Source Scout

Finds possible context and applies the first quality bar:

- durable
- useful
- attributable
- actionable
- novel

It discards weak material silently. No queue-padding.

### Context Framer

Turns one candidate into a human-readable proposal:

- what the claim is
- where it came from
- why it matters
- where it probably belongs
- what action is being proposed

### Context Skeptic

Challenges the Framer before anything is written:

- Is this actually new?
- Is it contradicted elsewhere?
- Is the source strong enough?
- Is this a decision, a rule, a definition, a prompt update, or just noise?
- Is it risky to treat this as durable context?

### Context Clerk

Writes only the allowed record:

- `Context Intake` when the item is messy, ambiguous, or needs sorting.
- `Context Items` with `Status = Proposed` when the claim is clean enough to review as a possible truth.

Draft policy change: the Clerk should not need Matthew confirmation to create a `Proposed` Context Item when the Framer and Skeptic agree and the source is clear. This reduces one human gate while preserving the real approval gate.

## Lane 2 - Context Health

Use this when checking the existing context environment.

```text
Context Housekeeper -> Context Framer -> Context Skeptic -> Context Clerk -> Review queue
```

### Context Housekeeper

Scans existing context for:

- duplicates
- stale claims
- unsupported claims
- conflicting claims
- over-broad agent instructions
- missing source links
- old build packs that look active

It does not delete, approve, publish, or rewrite truth.

### Framer/Skeptic/Clerk Reuse

The same three-part review pattern handles curation:

- Framer proposes the cleanup.
- Skeptic defends the existing context and checks the risk.
- Clerk queues the proposed cleanup, merge, deprecation, or escalation.

That keeps the system smaller. The same mental model applies to both new context and old context.

## Lane 3 - Publishing

Use this only after human approval.

```text
Approved Context Item -> Publisher prepares export -> Matthew/TL checks publish action -> Publisher writes versioned output
```

Publisher is not an editor of truth. Publisher is a distribution clerk.

It may prepare:

- GitHub Markdown context packs.
- Hyperagent prompt or skill export proposals.
- Notion documentation updates.
- Change Log entries and audit mirror updates.

It must stop before deploy, commit, or irreversible publish unless the approved live Publisher policy explicitly allows that action.

## Human Review Should Become Exception Handling

Matthew or TL should review:

- proposed truth before it becomes approved
- deletion, deprecation, merge, or replacement
- external-facing claims
- personal, financial, medical, client, team, or legal-sensitive context
- agent permission changes
- anything with Framer/Skeptic disagreement
- anything the system cannot source clearly

Matthew or TL should not need to review:

- every weak candidate the Scout discards
- every clean candidate before it becomes merely `Proposed`
- every scheduled scan when nothing risky is found
- every formatting or routing choice where confidence is high and the source is clear

## Decision Types

Confidence should be tracked by decision type, not as one vague score.

```text
Novelty confidence:
Source confidence:
Routing confidence:
Duplicate confidence:
Staleness confidence:
Risk confidence:
Write-safety confidence:
```

If all relevant confidence fields are high and the action only creates a proposed record, the workflow can continue without human input.

If confidence is mixed, missing, or tied to a destructive action, route to human review.

## Suggested Status Shape

This is a draft status model, not a live Airtable change.

```text
Raw / Found
Framed
Challenged
Proposed
Needs Human Decision
Approved
Rejected
Deprecated
Published
```

The important simplification is that `Needs Human Decision` is not the default. It is an exception state.

## Maintenance Rule

If an agent cannot explain its job in one sentence, the scope is too wide.

If two agents need the same tools, same trigger, same audience, and same write surface, they are probably one agent with two modes, not two agents.

If one agent needs to both judge and execute a risky change, split it.

