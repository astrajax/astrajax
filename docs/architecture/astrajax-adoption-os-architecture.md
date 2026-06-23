# AstraJax Adoption OS Architecture

**Status:** V0.1 source-of-truth draft  
**Owner:** Matthew  
**Last updated:** 23 June 2026  
**Purpose:** Define the architecture for the AstraJax adoption operating system: what each agent does, where context lives, where humans approve, and how agent runtimes fit in.

---

## 1. Short Version

AstraJax is the adoption operating system for AI agents.

It does not try to be the agent runtime. It sits upstream of runtimes like HyperAgent and helps domain experts design, adopt, and improve agent fleets their teams actually use.

The core split:

> **Clive is the face. Pam is the raised eyebrow. Doc is the hands. Humans keep judgement.**

Clive reasons with the user. Pam Portiscue stress-tests important thinking. Doc turns approved reasoning into structured action. Agent runtimes execute the work.

---

## 2. Why This Architecture Exists

The product needs to make AI feel approachable without letting one charming assistant become too powerful.

If one agent both persuades the user, decides what matters, writes context, creates agents, and changes live system state, governance gets muddy. The user may not know whether they are still exploring an idea or authorising a change.

AstraJax avoids that by separating:

- **Reasoning:** exploring, explaining, asking questions, helping the user think.
- **Challenge:** stress-testing important conclusions before action.
- **Approval:** the human confirms what should become system truth.
- **Action:** a separate agent writes records, dispatches jobs, prepares packages, and leaves a paper trail.
- **Execution:** a runtime such as HyperAgent runs the autonomous agents.

This keeps the system friendly without becoming loose.

---

## 3. Core Principle

No agent should both persuade and write live state.

In practice:

```text
Clive reasons -> Pam challenges when needed -> human approves -> Doc acts -> runtime executes -> humans review -> brain improves
```

That is the spine of the adoption operating system.

---

## 4. System Roles

### 4.1 The Domain Expert

The domain expert is the person closest to the work.

They know:

- what the team actually does
- what data matters
- where the awkward exceptions live
- what a good answer sounds like
- what an agent must never do
- when an answer is quietly wrong

Their job is not to become a developer. Their job is to become the architect of the AI system around their work.

### 4.2 Clive: Reasoning Partner

Clive is the user-facing reasoning partner.

Clive helps the domain expert:

- explain the business
- describe the workflow
- name the important data
- define what good output looks like
- identify risk and approval points
- choose the tone and guide style
- think through agent roles
- understand what the system is doing

Clive can draft proposed context and agent ideas, but Clive does not write approved context directly.

Clive is deliberately conversational, warm, and accessible. His job is to make the hard thinking feel safe enough to do properly.

### 4.3 Pam Portiscue: Challenger

Pam Portiscue is the sceptical quality layer.

Pam appears when the system is at risk of becoming too agreeable, too excited, too broad, or too quick to act. She is not there to block work. She is there to protect it from rabbit holes, weak assumptions, and over-helpful AI momentum.

Pam helps the domain expert and Clive check:

- what assumption is being made
- what evidence supports it
- what could go wrong
- whether the scope is growing too fast
- whether the proposed action is actually necessary
- what a sober buyer, operator, manager, or user would object to
- whether Doc should be allowed to act yet

Pam should be memorable, sharp, and a little sassy, but never cruel. Her value is scepticism with taste.

Suggested product language:

```text
This feels important. Shall we ask Pam to stress-test it before Doc does anything?
```

Pam's standard output should be short and useful:

```text
Pam's sniff test
- Strongest part:
- Weakest assumption:
- Risk of rabbit hole:
- Missing evidence:
- Suggested correction:
- Safe to send to Doc? Yes / Not yet
```

When Pam and Clive disagree, the system should not pretend to know which one is right. The disagreement is the product value: it makes the trade-off visible so the human can use their judgement.

Suggested handoff:

```text
Well Matthew, here's our takes. Clive sees the upside. Pam sees the risk.
We do not know which one is right from the outside. You're the expert.
What do you think?
```

### 4.4 Doc: Action Dispatcher

Doc is the operational agent.

Doc turns approved decisions into system changes:

- creates or updates proposed context records
- writes change logs
- prepares agent configuration drafts
- dispatches packaging or deployment tasks
- creates follow-up tasks
- records who approved what and why
- later, monitors agent/fleet health and proposes maintenance

Doc should be more operational than charming. He can have character, but his primary role is reliability, traceability, and action.

Doc acts only from an approved brief.

### 4.5 Human Approver

The human approver decides what becomes trusted context or a live configuration.

Approval is required for:

- canonical context
- agent rules
- write permissions
- deployment packages
- external claims
- destructive changes
- changes that affect users, clients, money, policy, or operational truth

The approver may be Matthew in the early system, then an internal owner or domain lead for client systems.

### 4.6 Agent Runtime

The runtime executes agents.

HyperAgent is the first supported runtime because it is unusually clean and approachable for normal users. AstraJax should treat HyperAgent as a partner, not a competitor.

Runtime responsibilities may include:

- autonomous execution
- tool calling
- scheduling
- monitoring
- memory handling
- browser/shell/tool access
- running packaged agents

AstraJax responsibilities stay upstream:

- context brain
- adoption flow
- agent design
- guardrails
- packaging
- coaching
- feedback into context

---

## 5. The Product Loop

### Step 1: Pick Your Guide

The user chooses the guide tone and story mode.

Story mode controls how much theatrical character the system uses:

- **Full Story Mode:** named characters, entrances, banter, court language, visible relationships between agents.
- **Light Story Mode:** characterful but restrained; clear roles, light warmth, minimal theatrics.
- **No Story Mode:** plain professional assistants with the same underlying scopes, rules, and governance.

The default build should show Full Story Mode because it is the most memorable expression of the product. But the architecture must support all three modes so teams can match their culture.

Guide tone examples:

- playful
- balanced
- sober

This is not only branding. Story keeps the experience engaging and keeps scopes tight without making constraints feel disengaging. Underneath, the same roles and guardrails apply.

### Step 2: Build The Brain

Clive interviews the domain expert and helps them explain:

- business purpose
- workflows
- data sources
- key metrics
- approval rules
- examples
- edge cases
- forbidden behaviours
- what good looks like

Clive produces a draft brain brief.

### Step 3: Pam Challenges When It Matters

For important decisions, Pam Portiscue stress-tests the draft before it reaches approval.

Pam should be invited when:

- the user is about to approve canonical context
- Clive has made a strategic recommendation
- the proposed agent will write, deploy, or affect live work
- the conversation has been going in one direction for too long
- the scope is expanding quickly
- the evidence is thin
- the user asks whether something is good enough
- Doc is about to act on something consequential

Pam does not need to appear for every small interaction. Her job is to make red-teaming feel like a useful social ritual, not a bureaucratic checkpoint.

There should also be a prompt-count checkpoint. After a set number of uninterrupted Clive turns in the same thread, Pam must be invited before the user can approve context, create an agent, or send anything to Doc. The exact threshold can be tuned, but the product principle is fixed:

> **Long helpful conversations need a sceptical interruption before action.**

Example Clive prompt:

```text
Matthew... I'm terribly sorry, but if I keep talking without Pam getting involved,
she'll make me sit on the naughty step again. My dignity simply cannot take it.
Shall we let her in for a quick sniff test?
```

Button:

```text
Let Pam in
```

Example Pam entrance:

```text
Better now than never, I suppose. Clive, we'll talk later.
Right. Show me the assumption everyone has become far too comfortable with.
```

### Step 3A: Take It To Court

Court Mode is the advanced challenge pattern for high-stakes decisions.

It should not be required for V1, but it should be visible in the business positioning because it expresses a core AstraJax principle: good AI work needs multiple perspectives before human judgement.

Court Mode gives the user a suite of role-based takes, then asks the human to choose the judgement they want to adopt.

Possible roles:

- **Clive:** positive case, adoption upside, human meaning.
- **Pam Portiscue:** sceptical case, weak assumptions, rabbit-hole risk.
- **Doc:** implementation cost, operational risk, action readiness.
- **Iris:** evidence quality, data confidence, measurement.
- **Vera:** stakeholder reaction, narrative risk, how this lands with humans.
- **Judge:** summarises the cases, but does not decide.

Core rule:

> **The Court surfaces perspectives. The human gives judgement. Doc executes only after judgement is recorded.**

Court Mode should exist in all story modes:

- Full Story Mode: theatrical court scene.
- Light Story Mode: structured decision panel.
- No Story Mode: plain multi-agent review.

The substance is the same. The theatre is the interface.

### Step 4: Human Approval

The user reviews the brain brief.

They can:

- approve
- correct
- reject
- mark uncertainty
- request more reasoning
- send to another human for review

Nothing becomes trusted system context just because Clive said it.

Nothing becomes trusted system context just because Pam challenged it either. Pam improves the thinking; the human still decides.

### Step 5: Doc Writes The System State

Doc receives the approved brief and writes the relevant records.

Examples:

- Context Item
- Agent Environment
- Agent Configuration Draft
- Approval Rule
- Change Log entry
- Deployment Package record
- Follow-up task

Doc writes with source, reason, approver, timestamp, and action.

### Step 6: Design The Fleet

The user designs task-scoped agents.

Editable surface:

- name
- avatar
- tone
- examples
- team-facing personality

Locked surface:

- task scope
- model/runtime requirements
- write permissions
- approval rules
- source boundaries
- safety guardrails

Principle:

> **The personality is editable. The competence is locked.**

### Step 7: Package And Deploy

AstraJax prepares the agent package.

Near-term demo:

- show export package
- show HyperAgent-ready configuration
- mock deployment success where needed

Production direction:

- package for HyperAgent first
- keep package format abstract enough to support other runtimes later

### Step 8: Celebrate And Coach

Adoption needs feedback.

The system should show:

- progress
- helpful usage
- prompt confidence
- training completion
- coaching notes
- safe practice in sandboxes

This must be framed as enablement, not staff surveillance.

### Step 9: The Brain Learns

Users and managers review agent outputs.

They can mark:

- this was good
- this was wrong
- never return this again
- the correction is this
- this source is stale
- this rule matters more

Clive may help reason about the correction.

Doc writes the approved change.

The context brain improves.

---

## 6. Governance Rules

### Rule 1: Agents Propose, Humans Approve

Agents can suggest.

Humans approve what becomes trusted context, policy, deployment, or external truth.

### Rule 2: Clive Does Not Write Canonical Context

Clive can reason, draft, and explain.

Clive should not directly mark context as approved or canonical.

### Rule 3: Helpful By Default, Sceptical Before Action

The system should be helpful by default. That is what makes it pleasant to use.

But before important actions, the system should invite challenge:

```text
This feels important. Shall we ask Pam to stress-test it before Doc does anything?
```

Pam should challenge high-stakes reasoning, not every minor interaction. Her job is to prevent agreeable AI drift: the slow slide into a weak plan because every response sounded helpful.

Pam should also have a mandatory checkpoint after a defined number of Clive-only turns in one thread. This is not because Clive is wrong. It is because long, agreeable reasoning can become its own momentum. The checkpoint turns good prompt practice into a product habit.

The first version can use a simple rule:

```text
After 8 Clive/user turns without Pam, show a Pam checkpoint before approval, agent creation, deployment, or Doc handoff.
```

The threshold is tunable. The behaviour is not: important work should not drift from helpful chat straight into action without challenge.

### Rule 4: AI Disagreement Makes The Human The Judge

Clive and Pam can disagree.

Clive should state the positive case: what is promising, useful, emotionally compelling, or strategically strong.

Pam should state the sceptical case: what is weak, risky, overbuilt, unsupported, or likely to fail.

If they conflict, the system must not resolve the conflict by letting one AI overrule the other. It should make the ownership explicit: this is the human's decision.

The point is not that AI removes bias completely. It does not. The point is that AstraJax gives the human context-aware, bias-checked opinions from different angles, then asks them to judge.

Standard pattern:

```text
Clive's take:
Pam's take:
Where they disagree:
Decision needed from you:
```

Suggested voice:

```text
Well Matthew, here's our takes. Clive sees the upside. Pam sees the risk.
We do not know which one is right from the outside.
This is your decision. You now have context-aware, bias-checked opinions.
You're the expert. What do YOU think?
```

This is central to the AstraJax thesis: agents take the sludge, but humans keep the meaning.

### Rule 5: Doc Acts Only From Approved Briefs

Doc is the executor/dispatcher.

Doc should not re-decide the reasoning from scratch. If the brief is unclear, conflicting, or risky, Doc stops and escalates.

### Rule 6: The Runtime Executes, It Does Not Own The Brain

HyperAgent or another runtime can execute agent work.

The context brain should remain in an AstraJax-controlled, tool-agnostic layer so the client is not trapped inside one runtime's memory model.

### Rule 7: Coaching Is Not Surveillance

The system may track adoption signals, but the framing and controls matter.

Use:

- coaching
- progress
- enablement
- confidence
- learning
- adoption momentum

Avoid:

- monitoring staff
- grading employees
- surveillance
- productivity policing

### Rule 8: The Paper Trail Matters

Any action that changes system state should include:

- source
- proposed change
- approver
- executing agent
- timestamp
- reason
- affected records
- rollback or review route where relevant

---

## 7. Data And Context Layers

### Context Brain

The context brain is the source of truth for what agents reason from.

It should contain:

- business rules
- source documents
- examples
- edge cases
- agent instructions
- approval rules
- workflow context
- decision logs
- context packs by team or workflow

### Airtable

Airtable is the natural operating layer for the current system.

It can hold:

- context records
- review queues
- agent environments
- change logs
- deployment packages
- feedback records
- training and adoption data

### Git / Markdown

Git-backed Markdown remains useful as an audit mirror: a second copy of important context outside Airtable.

An audit mirror is a second copy of the log kept outside Airtable, so the system has a paper trail even if the operating base changes.

### Runtime Memory

Runtime memory should be treated as execution support, not the canonical brain.

If the runtime learns something useful, it should flow back into the AstraJax context review loop before becoming trusted context.

---

## 8. Model And Runtime Stance

Publicly, AstraJax should avoid making the product depend on one model brand.

Internally, the current instinct is:

- use stronger reasoning models where the job is judgement, trade-offs, and context extraction
- use stronger coding/implementation models where the job is build, refactor, or structured execution
- use HyperAgent for autonomous runtime where it reduces operational burden
- use Claude/API-style conversational layers where speed and cost matter

The public architecture should say:

> **AstraJax uses the right model and runtime for the job, while keeping the human-approved context brain portable.**

Do not oversell "ChatGPT reasons, Claude codes" as permanent truth. Models change quickly. The durable architecture is reasoning vs action, not one vendor vs another.

---

## 9. Demo Architecture

For the AIG / HyperAgent demo, the system should be demo-quality, not production-grade.

### Must Feel Real

- guide selection
- Clive context interview
- generated brain brief
- Pam stress-test moment for an important decision
- human approval moment
- Doc action handoff
- agent fleet design
- HyperAgent-ready package
- Scorekeeper/coaching/adoption loop
- manager feedback improving the brain

### Can Be Mocked

- real multi-tenant auth
- billing
- full HyperAgent sync
- production analytics ingestion
- automatic deployment
- live client data

### Must Not Be Mocked In The Story

The proof that this pattern has worked before should be real:

- Butternut Direct Sales production system
- characterful agent fleet
- training hub
- sandboxes
- leaderboards / Scorekeeper
- Doc Albright debug and maintenance pattern
- human approval and audit trail

The demo may use seeded data, but the underlying method must be tied back to production proof.

---

## 10. Relationship To HyperAgent

HyperAgent is the first runtime AstraJax services.

Why:

- clean user interface
- layman-friendly user experience
- strong autonomous agent execution
- useful runtime capabilities
- existing relationship through Founding 500

AstraJax should not pitch against HyperAgent.

Positioning:

> **HyperAgent makes powerful agents possible. AstraJax makes them adoptable by the teams who know the work.**

Longer-term, AstraJax remains tool-agnostic so it can support citizen-builders through future agent platform changes.

Tool-agnostic means agile and portable. It is not the moat by itself. The moat is the adoption method, founder proof, context discipline, and human judgement layer.

---

## 11. Relationship To Existing DS Platform Proof

The Direct Sales platform provides the working proof for the architecture.

Reusable proof patterns:

- **Clive:** friendly guide and context surface.
- **Doc Albright:** fleet engineer, debug intake, fix pipeline, prompt coaching.
- **Scorekeeper / KK Kingsford:** adoption momentum, XP, leaderboards.
- **Bot Fleet:** roster, change logs, fix queues, training analytics.
- **Build-a-Brain / DS Brains:** context curation and review.
- **Training hub:** videos, sandboxes, engagement tracking.
- **Trinity pattern:** link -> propose -> human approves -> execute.

The AstraJax demo should not rebuild all of this. It should generalise the pattern and show the clearest version of the loop.

---

## 12. Open Questions

These need decisions as the build sharpens:

1. Is Doc introduced immediately after the first approval, or only in Chapter 3 after the user understands the brain?
2. What exact surfaces can Doc write in the first demo?
3. Which actions require Matthew approval in the AstraJax demo environment?
4. Does HyperAgent receive a generated package manually, through API, or through a mocked export for the first recording?
5. How much of Scorekeeper/coaching is shown as live UI vs production proof?
6. What is the first client-ready object: brain brief, agent package, adoption audit, or fleet plan?

---

## 13. Current Architecture Statement

Use this as the simplest explanation:

> **AstraJax helps domain experts build the brain and shape the fleet. Clive reasons with them. Pam Portiscue stress-tests important decisions. Humans approve what becomes true. Doc writes the approved changes and dispatches action. HyperAgent or another runtime executes the agents. Feedback flows back into the brain so the system keeps improving.**

That is the architecture.
