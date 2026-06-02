# Draft Context Processing Flow

**Status:** Draft proposal.  
**Owner:** Matthew.  
**Purpose:** Make Clive's context processing easier to maintain, less dependent on Matthew reviewing every small step, and easier for humans to understand.

## The Plain-English Model

Clive should work like a small editorial desk:

```text
Find it -> Frame it -> Challenge it -> Record it -> Review exceptions -> Publish approved truth
```

The current system is right in spirit, but it feels heavy because "human approval" appears in too many places. The safer simplification is:

```text
Agents can prepare and propose.
Humans approve truth.
Publisher publishes approved truth.
```

That removes unnecessary gates before a record is merely proposed, while keeping the important gate before anything becomes canonical.

## Folder Contents

- `flow-v0.1.md` - the proposed end-to-end flow.
- `agent-cards-v0.1.md` - the tightly scoped draft agents.
- `human-gates-v0.1.md` - when Matthew or TL should still be pulled in.

## Current Policy Boundary

This folder does not override live Clive rules.

Current live rule remains:

```text
Agents propose. Humans approve. Publisher publishes.
```

The main proposed change is that agents should be allowed to move more work into `Status = Proposed` without asking Matthew first, because `Proposed` is not canonical truth.

