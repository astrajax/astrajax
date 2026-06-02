# Human Gates v0.1

**Status:** Draft proposal.  
**Purpose:** Reduce Matthew/TL review load while keeping real judgement in human hands.

## Principle

Human review should protect judgement, not babysit admin.

Use this rule:

```text
Agents can sort, challenge, and propose.
Humans approve truth, destructive change, external claims, and new policy.
```

## Three Review Levels

### 1. No Human Needed

The workflow can continue without Matthew or TL when all of these are true:

- The action only creates or updates a non-canonical queue record.
- The source is linked or quoted clearly.
- Framer and Skeptic agree.
- No destructive change is involved.
- No external-facing claim is being changed.
- Confidence is high for the relevant decision types.

Examples:

- Source Scout discards a thin candidate.
- Context Clerk creates a `Context Intake` record.
- Draft policy: Context Clerk creates a `Context Item` with `Status = Proposed`.
- Context Housekeeper reports zero findings in a scheduled run.

### 2. Human Review Needed

Route to Matthew or TL when judgement matters:

- A proposed item should become approved context.
- A claim affects AstraJax positioning or client-facing material.
- The system found a conflict between approved sources.
- Framer and Skeptic disagree.
- The source is novel and does not fit existing patterns.
- The proposal changes how an agent behaves.
- The confidence score is medium or low for source, routing, risk, or write safety.

Examples:

- Approving a new rule about how Clive agents behave.
- Deciding whether an old positioning claim is now stale.
- Choosing between two contradictory source docs.
- Approving a Context Pack export.

### 3. Human Approval Mandatory

Do not proceed without explicit Matthew/TL approval when the action is irreversible, external, or policy-setting.

Mandatory gates:

- Set `Approved`.
- Set `Confirmed By Human`.
- Set `Published`.
- Set `Deprecated`.
- Delete, archive, or reset approved context back into review.
- Publish to GitHub, Hyperagent, Notion, Slack, or client-facing surfaces.
- Commit, push, deploy, or change credentials.
- Change agent write permissions.
- Change the approval model itself.

Examples:

- Publisher writes approved context to a repo pack.
- A cleanup action deprecates an old Context Item.
- A Hyperagent prompt gets a new write tool.
- A context rule changes who can approve.

## Review Queue Design

The review queue should not say "please review everything".

It should group work by decision type:

```text
Needs approval
Needs conflict decision
Needs deletion/deprecation decision
Needs routing decision
Needs policy decision
Needs source clarification
```

Each item should show:

```text
What changed:
Why it matters:
Source:
Framer view:
Skeptic view:
Recommended decision:
Risk:
Approve / Reject / Ask for changes:
```

## Confidence Rules

Do not use one generic confidence score to bypass humans.

Use confidence to decide the route:

| Decision type | High confidence means | Low confidence means |
|---|---|---|
| Source | Source is linked and attributable | Ask for source or keep in Intake |
| Novelty | Not already represented | Possible duplicate |
| Routing | Destination is obvious | Human routing decision |
| Risk | No sensitive or external impact | Human review |
| Write safety | Allowed table and status only | Stop before write |
| Staleness | Old context is clearly superseded | Human decides |

High confidence can remove a queueing gate. It cannot create human approval.

## Plain-Language Labels

Use human labels in interfaces:

| System wording | Human label |
|---|---|
| `Context Intake` | Inbox |
| `Context Items` with `Status = Proposed` | Review queue |
| `Approved` | Trusted truth |
| `Deprecated` | Retired truth |
| `Publisher` | Filing clerk for approved truth |
| `Change Log` | Paper trail |

This matters because the system should be understandable at 7am before coffee, which is the real enterprise architecture test.

## Recommended First Experiment

Do not rebuild everything at once.

Start with one safe change:

```text
Allow the Framer + Skeptic + Clerk flow to create clean `Proposed` Context Items without Matthew confirmation.
```

Keep human approval for:

- approving those items
- publishing them
- deleting or deprecating anything
- changing agent permissions

That should remove the most annoying gate without weakening the important one.

