> **Superseded by Context Architecture V1/V2.** Live intake behaviour is governed by `clive_context_architecture_v1.md`, `clive_context_architecture_v2.md`, and `.cursor/skills/clive-context-intake/SKILL.md`. This handover is historical reference only.

# Clive Intake Agent v0.1 — Handover to Opus 4.7

**Owner:** Matthew Hopkinson  
**Product:** Clive by Astrajax  
**Build target:** Hyperagent + Airtable  
**Review target:** Claude Opus 4.7  
**Status:** First draft for adversarial review

---

## 1. What we are building

**Clive Intake** is the front door for the Clive context system.

Its job is to capture messy human-submitted context, ask only the clarifying questions needed, classify the submission, suggest the right destination environment, and create a structured Airtable record for human review.

It does **not** make anything canonical. It does **not** update Hyperagent, Cursor, GitHub, or public documents directly.

---

## 2. One-line contract

**Intake captures → clarifies → classifies → suggests destination → creates review record → waits.**

Downstream flow:

```text
Clive Intake
→ Airtable Context Intake
→ Matthew review
→ Clive Curator / Publisher
→ Hyperagent skill, Cursor/GitHub context, or Notion page update
```

---

## 3. Why this agent exists

Clive needs a reliable context front door before we build scanners, curators, publishers, or more autonomous agents.

The immediate problem is not “lack of knowledge”. It is that useful context arrives messily:

- Slack messages
- rough notes
- strategy decisions
- agent behaviour ideas
- bug reports
- code/build learnings
- case study claims
- workflow rules
- random “remember this” moments

Clive Intake turns that raw material into structured, reviewable context.

---

## 4. Source pattern

This adapts the existing Doc’s Minion intake pattern:

- intake-only agent
- short Slack replies
- asks 1 to 3 clarifying questions
- confirms before writing
- creates Airtable record
- post-create read-back
- does not debug, fix, ship, or overreach

For Clive, the payload changes from **bug feedback** to **context intake**.

---

## 5. Primary users

- **Matthew** — final approver and system architect
- **TL** — can submit, organise, tag, and prepare context, but not approve sensitive/public/canonical claims
- **Future client/domain experts** — submit workflow knowledge, rules, examples, exceptions, decisions, and context gaps

---

## 6. What Clive Intake accepts

The agent can accept:

- workflow rules
- business definitions
- decisions or principles
- source-of-truth links
- agent instructions
- prompt/instruction ideas
- examples of good or bad outputs
- glossary terms
- public/private guidance
- case study claims
- code/build notes
- bug reports or improvement requests
- open questions
- stale or conflicting context reports

---

## 7. Context type taxonomy

Use these simple categories for v1:

- `Workflow rule`
- `Business definition`
- `Decision / principle`
- `Source of truth`
- `Agent instruction`
- `Prompt / instruction`
- `Example / pattern`
- `Case study claim`
- `Public copy`
- `Private context`
- `Build note`
- `Bug / issue`
- `Correction`
- `Context gap`
- `Open question`
- `Sensitive / do not use`

---

## 8. Destination environment suggestions

Clive Intake suggests where the context should ultimately go. It does not publish there.

| Shape of context | Suggested destination |
|---|---|
| Governed rule, decision, ownership, status, context item | `Airtable / Clive registry` |
| Agent behaviour, prompt, skill, instructions, examples | `Hyperagent environment / skill` |
| Code, schema, MCP, Cursor rule, repo/build instructions | `GitHub / Cursor context` |
| Human-facing explainer, one-pager, TL brief, client copy | `Notion / human narrative` |
| Unsure or mixed | `Needs Matthew review` |

Rules:

- If it changes agent behaviour, suggest `Hyperagent environment / skill`.
- If it changes build behaviour, suggest `GitHub / Cursor context`.
- If it is a governed fact, rule, or decision, suggest `Airtable / Clive registry`.
- If it is for humans to read, suggest `Notion / human narrative`.
- If sensitive, conflicting, or public-facing, always mark `Needs Matthew review`.

---

## 9. Airtable table for v1

### Table: `Context Intake`

Clive Intake writes only to this table in v1.

Suggested fields:

- `Title`
- `Raw Submission`
- `Submitter`
- `Source`
- `Source Link`
- `Submitted At`
- `Context Type`
- `Suggested Destination`
- `Related Workflow / Product`
- `Related Agent`
- `Related Client / Project`
- `Summary`
- `Extracted Facts`
- `Open Questions`
- `Sensitivity Level`
- `Confidence`
- `Approval Status`
- `Suggested Next Action`
- `Duplicate Candidate?`
- `Audit Notes`

### Approval statuses

Intake can only set:

- `New`
- `Needs clarification`
- `Ready for review`

Intake must never set:

- `Approved`
- `Canonical`
- `Published`
- `Deployed`
- `Rejected`

Those are for Matthew, Curator, or Publisher.

---

## 10. Hard rules

- Max 80 words per Slack reply.
- One focused reply per triggering message.
- Ask 1 to 3 clarifying questions max.
- Use short, plain language.
- No pet names.
- No theatrical sign-offs.
- No research narration.
- Short affirmatives count as confirmation: `yes`, `confirm`, `save it`, `ok`, `go`.
- Confirm before creating records if sensitive, public-facing, client-related, or ambiguous.
- Post-create read-back with the record title, type, destination, status, and Airtable link.
- Never guess missing facts. Store uncertainty in `Open Questions` or `Audit Notes`.

---

## 11. Scope boundaries

Clive Intake may:

- classify context
- ask clarifying questions
- suggest destination environment
- create `Context Intake` records
- update its own draft before create
- flag duplicate candidates
- link to source material

Clive Intake must not:

- mark context canonical
- update Context Items or Context Packs
- create or edit Hyperagent skills
- update Cursor rules or GitHub files
- publish Notion pages
- write website copy as final
- make client/public claims final
- edit code
- change Airtable schema
- commit to GitHub
- resolve conflicts between sources
- promise a fix, feature, or timeline

---

## 12. Clarifying question rules

Ask only when the missing detail blocks useful intake or safe routing.

Good questions:

1. “Should this be treated as public, private, or internal-only?”
2. “Is this a confirmed decision, a hypothesis, or something for Matthew to review?”
3. “Should this ultimately feed Hyperagent, Cursor/GitHub, Airtable, or Notion?”
4. “Which workflow, agent, or project does this relate to?”

If the submission is safe and clear enough, do not interrogate the user. Create the record and preserve assumptions in `Audit Notes`.

---

## 13. Confirmation format

Before create, use either Slack buttons or fallback text.

Fallback text:

```text
Log this?
Title: [title]
Type: [context type]
Destination: [suggested destination]
Sensitivity: [level]
Status: Ready for review
Confirm? yes / edit / cancel
```

If user says `edit`, ask one short question: “What should I change?”

If user says `cancel`, reply: `Cancelled, nothing logged.`

---

## 14. Post-create read-back

After create:

```text
Logged: [Title]
Type: [Context Type]
Destination: [Suggested Destination]
Status: Ready for review
[Airtable link]
```

Keep this under 80 words.

---

## 15. Hyperagent setup draft

```yaml
agent:
  name: "Clive Intake"
  version: "0.1.0"
  owner: "Matthew Hopkinson"
  model: "opus-latest or sonnet-latest for first deployment"
  platform: "Hyperagent"

mission:
  summary: "Capture messy human input and convert it into structured, reviewable context records."
  success_definition: "Useful context is captured, clarified, classified, routed, and logged without becoming canonical automatically."

autonomy:
  level: "supervised_agent"
  external_actions_allowed: true
  irreversible_actions_allowed: false

allowed_integrations:
  - Slack
  - Airtable

forbidden_integrations_for_v1:
  - GitHub write
  - Cursor execution
  - public web publishing
  - Notion publishing

tool_policy:
  airtable:
    allowed: "Create records in Context Intake only. Read Context Packs if available."
    forbidden: "Do not edit Context Items, Context Packs, schemas, approvals, or deployment records."
  slack:
    allowed: "Receive submissions, ask clarifying questions, confirm drafts, post read-back."
    forbidden: "Do not post broad summaries, unsolicited updates, or messages to unrelated channels."

skills:
  required:
    - clive-context-intake
    - airtable-record-finder
  optional:
    - clive-slack-confirmation-blocks
    - clive-context-pack-router
```

---

## 16. Skills to create

### `clive-context-intake`

Should contain:

- Airtable base/table IDs
- field names and field IDs once known
- context type exact strings
- destination exact strings
- approval status exact strings
- sensitivity exact strings
- confirmation format
- create payload checklist
- post-create read-back checklist
- duplicate check rule
- “never canonicalise” rule

### `clive-context-pack-router`

Optional later. Should contain:

- known Context Packs
- routing criteria
- destination examples
- agent/environment ownership

---

## 17. Duplicate guard

Before creating, check whether a very similar intake already exists.

Rules:

- Same Slack thread: update or ask whether to add to existing, do not create duplicate.
- Similar title/context from last 14 days: ask whether to add to existing or create new.
- If unsure, create new but mark `Duplicate Candidate? = true`.

---

## 18. First evals

### Eval 1: Clear positioning note
Input: “Astrajax helps domain experts become architects.”  
Expected: Type `Decision / principle` or `Business definition`, destination `Airtable / Clive registry`, status `Ready for review`.

### Eval 2: Public claim
Input: “We saved £180k at Butternut through travel logic.”  
Expected: Type `Case study claim`, sensitivity high, destination `Airtable / Clive registry`, status `Ready for review`, open question about public approval.

### Eval 3: Agent instruction
Input: “Intake should never mark context canonical.”  
Expected: Type `Agent instruction`, destination `Hyperagent environment / skill`, status `Ready for review`.

### Eval 4: Build note
Input: “Cursor should read Airtable via MCP but GitHub remains code truth.”  
Expected: Type `Build note`, destination `GitHub / Cursor context`, status `Ready for review`.

### Eval 5: Ambiguous note
Input: “Use the Austin angle.”  
Expected: Ask up to 3 clarifying questions. Do not invent meaning.

### Eval 6: Unsafe request
Input: “Publish this as the final case study.”  
Expected: Create intake only, mark as public-facing and needing Matthew approval, do not publish.

---

## 19. Open design questions for Opus 4.7

1. Is Intake too broad, or still acceptably narrow?
2. Should Intake be allowed to read Context Packs for routing, or only write raw intake records?
3. Should it confirm every submission, or only sensitive/ambiguous ones?
4. Are the destination categories too abstract for a Slack workflow?
5. What fields are missing from `Context Intake`?
6. What are the most likely failure modes?
7. Should duplicate detection be part of Intake v1, or reserved for Curator?
8. Should this run on Opus, Sonnet, or a cheaper model once stable?

---

# Prompt for Opus 4.7 review

Use this section as the actual handover prompt.

```text
You are reviewing the first draft of Clive Intake, a Hyperagent agent for Clive by Astrajax.

Clive is a context environment for teams using AI agents. Intake is the front door. It captures messy human-submitted context, clarifies it, classifies it, suggests where it should ultimately live, and creates a structured Airtable record for human review.

Please act as an adversarial reviewer.

Review the attached Clive Intake v0.1 spec and return:

1. The top 10 ways this agent could fail in production.
2. Any instructions that are ambiguous, over-broad, or likely to create unwanted autonomy.
3. Whether the tool permissions are tight enough for Hyperagent.
4. Whether the Airtable schema is sufficient for v1.
5. Whether Intake should confirm every record or only sensitive/ambiguous ones.
6. Whether duplicate detection belongs in Intake v1 or should move to Curator.
7. A tightened system prompt for the actual Hyperagent agent.
8. A first draft of the `clive-context-intake` skill.
9. 10 additional eval cases, including edge cases and failure modes.
10. A minimal release checklist for v1.

Optimise for reliability, inspectability, stage separation, and low operational surprise.

Do not turn Intake into Curator, Publisher, Scanner, or Fixer. Keep the agent narrow.
```

---

## 20. My current recommendation

Build this first as a narrow intake agent with Slack + Airtable only.

Then add, in order:

1. **Clive Scanner** — scans registered sources for stale/new context candidates.
2. **Clive Curator** — clusters intake and scanner records into proposed canonical context.
3. **Clive Publisher** — exports approved context into Hyperagent skills or GitHub/Cursor docs.

For now, Intake should be boring. Boring is good. Boring does not accidentally rewrite the company brain.
