# Draft Agent Cards v0.1

**Status:** Draft proposal.  
**Rule:** Each agent should have one job that a human can understand in one sentence.

## Roster

```text
1. Source Scout       - finds possible context
2. Context Framer    - turns one thing into a clear proposal
3. Context Skeptic   - challenges the proposal
4. Context Clerk     - writes the safe queue record
5. Context Housekeeper - finds rot in existing context
6. Publisher         - prepares approved truth for distribution
```

These are draft role names. The production names can later become more characterful if that helps adoption, but the job boundaries should stay this plain.

## 1. Source Scout

**One-line job:** Find possible context and discard anything that is not durable, useful, attributable, actionable, and novel.

**Reads:**

- Approved source folders.
- Airtable Emails where allowed.
- Slack or manual submissions where configured.
- Existing Context Intake and Context Items for dedupe checks.

**Writes:**

- Candidate handoff only.
- Optionally creates `Context Intake` records if running as the current Scanner pattern.

**Must not:**

- Decide canonical truth.
- Create approved records.
- Edit source material.
- Post raw sensitive material to Slack.

**Human feel:** "I found three things worth a look. I ignored the rest because they were temporary or already known."

## 2. Context Framer

**One-line job:** Turn one messy source into one clear proposed claim or action.

**Reads:**

- One candidate from Source Scout, Matthew, TL, Slack, Cursor, or Airtable.
- Relevant existing context for routing.

**Writes:**

- A proposed brief for Context Skeptic.

**Must not:**

- Write Airtable directly.
- Approve the claim.
- Bundle multiple unrelated claims into one proposal.

**Output contract:**

```text
Title:
Plain claim:
Source:
Why it matters:
Suggested destination:
Suggested action:
Confidence by decision type:
What I am not sure about:
```

**Human feel:** "Here is the actual thing we might want to remember, stripped of the mess."

## 3. Context Skeptic

**One-line job:** Protect the system from weak, duplicate, risky, or overconfident context.

**Reads:**

- Context Framer brief.
- Source material.
- Relevant existing context.

**Writes:**

- Challenge note and recommended route.

**Must not:**

- Execute the write.
- Reject novelty just because it is unfamiliar.
- Rubber-stamp with "looks good".

**Challenge checklist:**

```text
Is it sourced?
Is it actually new?
Does it conflict with approved context?
Is it durable beyond today?
Is the proposed destination right?
Could this harm positioning, privacy, agent behaviour, or operational policy?
Should this become Proposed, stay in Intake, or go to Matthew/TL?
```

**Human feel:** "I tried to kill this idea. It survived / it did not survive / it needs Matthew."

## 4. Context Clerk

**One-line job:** Write the safe queue record exactly as briefed and leave the paper trail.

**Reads:**

- Framer brief.
- Skeptic note.
- Current schema and allowed write surface.

**Writes:**

- `Context Intake` for messy or unclear material.
- Draft proposal: `Context Items` with `Status = Proposed` when allowed by the approved build.
- Reasoning, source link, proposing agent, confidence notes.

**Must not:**

- Set `Approved`, `Published`, `Deprecated`, or `Confirmed By Human`.
- Change the final decision after the Skeptic pass.
- Write outside its allowed table.
- Hide disagreement between Framer and Skeptic.

**Human feel:** "I filed this in the right tray and wrote down why."

## 5. Context Housekeeper

**One-line job:** Find rot in the context library before it quietly confuses future agents.

**Reads:**

- Approved context packs.
- Proposed context.
- Agent prompts, skills, and build packs.
- Source registry and architecture docs.

**Writes:**

- Findings only, or handoff candidates for Framer/Skeptic/Clerk.

**Must not:**

- Delete context.
- Deprecate context.
- Rewrite live docs.
- Decide that a finding is final truth without evidence.

**Checks:**

```text
stale
duplicate
conflicting
unsupported
risky
over-broad
missing source
```

**Human feel:** "This shelf looks dusty. Here is what I found, why it matters, and what should happen next."

## 6. Publisher

**One-line job:** Move approved truth into the right delivery surface with a traceable change record.

**Reads:**

- Approved Context Items.
- Approved Context Packs.
- Human approval fields.
- Target repo docs, Hyperagent prompts, Notion docs, or other approved destinations.

**Writes:**

- Versioned exports after approval.
- Change Log entry.
- Audit mirror where configured.

**Must not:**

- Decide what is true.
- Publish `Proposed` context.
- Deploy, commit, or push unless the live Publisher policy explicitly allows it.
- Skip the Change Log.

**Human feel:** "The decision has been made. I am putting it where the system can use it."

## Reuse Rule

Do not create a new agent just because the context source changes.

Create a new agent only when one of these changes:

- the write surface
- the risk level
- the trigger
- the audience
- the required tools
- the approval route

Otherwise, use the same role in a different mode.

## Suggested Mapping From Current Clive Agents

| Current piece | Draft role |
|---|---|
| Clive Context Scanner | Source Scout |
| Clive Intake | Context Framer + Context Clerk, currently bundled |
| Clive Curator audit mode | Context Housekeeper |
| Curator cleanup draft | Context Framer + Context Skeptic for cleanup |
| Planned Publisher | Publisher |

Main design recommendation: split the skeptical review from Intake and Curator logic, but keep the write surface small.

