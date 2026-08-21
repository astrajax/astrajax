# AstraJax System Architecture

**Status:** V0.1 source-of-truth draft  
**Owner:** Matthew  
**Last updated:** 11 August 2026 (Kathryn Goodchild agent base)
**Purpose:** Define the architecture for the AstraJax system: what each agent does, where context lives, where humans approve, and how agent runtimes fit in.

---

## 1. Short Version

What it is

AstraJax is the AI Command Centre for non technical founders, commercial leaders, and function experts.

It does not try to be the agent runtime. It sits upstream of runtimes like HyperAgent and helps domain experts design, adopt, and improve agent fleets their teams actually use.

It gives the people who know the work a safe space to build with AI, reason through problems, and learn the technical skills that make AI useful — prompting, scoping, context discipline, and iteration.

How it works

It starts by understanding the person in the chair, then shapes itself around their confidence, role, and world. At the core: clean, curated context, governed agent fleets, and reasoning partners with challenge built in.

Clive thinks. Pam challenges. Doc executes. You decide.

Why it sticks

Storytelling craft is adoption infrastructure: it makes every agent's job memorable, trusted, and clear in scope. AstraJax brings AI out of the shadows and onto rails — so teams adopt agents they actually trust and use.

---



## 2. Why This Architecture Exists

The product needs to make AI feel approachable without letting one charming assistant become too powerful or one inexperienced AI user go too far down the wrong rabbit hole.

If one agent both persuades the user, decides what matters, writes context, creates agents, and changes live system state, governance gets muddy & credit spend is inefficient. The user may not know whether they are still exploring an idea or authorising a change. Tighter scopes also leads to more effective agents - skills & context specific to that agents function.

AstraJax separates:

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
User brain mapped -> Clive reasons (adapted) -> Pam challenges (calibrated) -> human approves -> Doc routes -> [direct write | Opus -> Composer | package] -> runtime executes -> humans review -> brain improves
```

That is the spine of the AI command centre's adoption loop.

---



## 3A. The Trinity Playbook (Canonical)

The spine above should be simple enough for non-technical teams to recall in one breath. AstraJax names it the **Trinity Playbook**:

```text
Propose -> Challenge -> Human gate -> Execute
                         |-> Court Mode, if the stakes are high
                         |-> Advance, if the owner approves
```


| Stage          | Who                               | Job                                                                                                       |
| -------------- | --------------------------------- | --------------------------------------------------------------------------------------------------------- |
| **Propose**    | Clive (reasoning partner)         | Draft the thinking, shape context, surface options. Does not write canonical truth or live state.         |
| **Challenge**  | Pam (challenger)                  | Stress-test assumptions, evidence, scope, and action readiness. Does not decide.                          |
| **Human gate** | Domain expert / approver          | Choose what becomes trusted context, policy, or live action. Escalate to Court Mode when stakes are high. |
| **Execute**    | Doc (action dispatcher) + runtime | Turn approved briefs into records, packages, build jobs, or agent runs — with a paper trail.              |


This is not framed as radical new theory. It is a practical design habit that keeps AI work useful, affordable, and accountable:

- **Use the right model for the right job.** Heavy reasoning for judgement, strategy, and trade-offs; cheaper workers for bounded execution.
- **Spend the right money for the right task.** Do not burn frontier-model spend on admin, formatting, or simple structured writes.
- **Get multiple angles before action.** Challenge stops the system getting carried away by one persuasive draft.
- **Return ownership to the human.** The system can propose and challenge, but the expert decides: *you know the work; you choose what happens next.*

**Court Mode** is the high-stakes branch at the human gate. It surfaces role-based perspectives (implementation, evidence, stakeholder reaction, adoption risk) before the human chooses. The Court does not decide. The human does.

**Hard rule:** without human approval at the gate, Doc must not act and runtimes must not receive live-change authority.

Product messaging for this pattern lives in `docs/business/positioning.md` §4. Investor framing lives in `docs/business/investor-one-pager.md`.

---



## 4. System Roles



### Where role specs live (canonical)

**Decision, 27 June 2026.** Each Chapter 1 agent's **technical responsibilities** — system prompt, engineering rules, output format — are authored in that agent's **Agent base → Persona Config** table in Airtable. **Character spine** (Super Objective, Known Truths, Inner Attitude) lives in **Narrative Arch** on the same base. Repo `.cursor/agents/*.md` and `.cursor/skills/*/SKILL.md` are **sync artifacts** until Doc's generator emits them from Airtable (see §Agent Authoring Surface).


| Agent         | Agent base          | Persona Config record                    | Role              |
| ------------- | ------------------- | ---------------------------------------- | ----------------- |
| Clive         | `appBd9tudgvOSrhSX` | `Operational v0.2` — `recJFiRQjbIecCAQ5` | Reason            |
| Pam           | `appH7NeSSNntuKRL4` | `Operational v0.2` — `rect3MIejCMhCWdH1` | Challenge         |
| Doc           | `appI5tpwsKNwjfrqR` | `Operational v0.2` — `rec0KNMfpdSlPWQuf` | Act               |
| Clive's Man   | `appZ71CSKBlhnb4hR` | `Operational v0.3` — `rect04amPJAZrWCi4` (Approved); `Operational v0.4` — `recSKTT8NTTJOmuRu` (Pending gate) | Steward           |
| Lazlo Marlowe | `appMHIxnwPMljiAQB` | `Operational v0.2` — `recHipJdrgeh0PAof` | Agent Storywriter |
| Kathryn Goodchild | `appzvesAIpPxjfAMF` | `Operational v1.0 (HyperAgent sync)` — `recZkhAbib7fQBL8Z` | Coach |


Live IDs: `website/src/lib/brains/airtable-ids.ts`. Character decisions and cast biography: `docs/initiatives/character-provenance.md` §7. Product governance (Trinity, Pam gates, human approval) stays in this doc — Persona Config is the per-agent operational contract, not a second architecture file.

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

**Deployment model: one AI champion per function, team, or work area.** In practice, the domain expert is often a peer close to the work — a founder, sales lead, operations manager, coordinator, or creative operator — not a distant technical authority. That matters for adoption: non-technical users trust workflows more when the person introducing them speaks their language, knows the pressure points, and is accountable to the same work.

```text
One AI champion per function, team, or work area
-> trained to shape the brain and test workflows at the coalface
-> supported by AstraJax guardrails, challenge, and Doc execution
-> feeding improvements back while the work is still live
```

For a solo founder or very small business, the founder can start as the first champion. As the company grows, the pattern can spread across functions. The point is to embed iteration where the work happens. Champions test, correct, and improve AI workflows close to live work instead of waiting for a central build queue. Product messaging for this pattern lives in `docs/business/positioning.md` §5.

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

Clive adapts to the **user brain** (see Step 0). A domain expert who has never touched a context environment should get plain language, slower assumptions, and more explanation. Someone with strong system-architecture experience can go faster and hear more precise trade-offs. Clive should not treat every user like a beginner, and should not assume expertise the user has not shown.

**Technical role (canonical):** Clive Agent base Persona Config `Operational v0.2` (`recJFiRQjbIecCAQ5`). Character spine: Narrative Arch on the same base; cast biography in `character-provenance.md` §7.

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

Pam's **frequency and entry points** are calibrated by the user brain (see Step 0). A user with low AI or context-environment experience should see Pam earlier and more often — not as punishment, but because agreeable AI drift is most dangerous when the user cannot yet spot it. A user with strong commercial or architecture experience may need Pam less on those domains and more on adoption, narrative, or evidence gaps Pam detects in the thread.

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

**Technical role (canonical):** Pam Agent base Persona Config `Operational v0.2` (`rect3MIejCMhCWdH1`).

**Product UI (command centre, 29 Jun 2026):** On the public website, **Pam fronts the brain-bases room** — health meter, **Context Health** (importance mix, risk tolerance, retire queue), review queue, outstanding actions — as the challenger voice ("this looks stale or thin; stress-test before you fix it"). **Clive's Man remains the steward** who proposes repairs and upkeep behind that surface; Pam does not write Trusted truth or replace the stewardship lane. Visual brief: `docs/initiatives/command-centre-visual-brief.md`.

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

**Users do not explore with Doc.** Clive is the conversational face. Pam is the challenger. The human decides. Doc receives the approved outcome and dispatches work. In product UI, Doc should feel like: *"Approved brief received. I'll write it properly and leave a trail."* — not a second open-ended chat partner.

In production, Doc is also a **router**: he chooses the right executor for each approved action — direct structured write, HyperAgent packaging, or an implementation worker (see §9).

**Technical role (canonical):** Doc Agent base Persona Config `Operational v0.2` (`rec0KNMfpdSlPWQuf`).

### Clive's Man: Brain Steward

Clive's Man is the **brain steward** — same person as The Man in Clive's cast (`character-provenance.md` §7). He keeps the Clive context lane in order: intake, curation, quarantine, publish-prep. **Attachment mining** (Workshop **Source Documents** only): uploaded files are summarised (Airtable AI), then Clive's Man proposes Draft Brain Truth rows — never Trusted without human promote. He orchestrates Proposer → Challenger → Executor for context actions, produces digests, and escalates exceptions. He drafts and proposes context state; he never approves canonical truth.

**Website onboarding intake:** `/onboarding` now files uploads as **Pending** Workshop **Source Documents** from private Blob staging; the website does not auto-mine them.

Clive thinks with the user. Clive's Man keeps the study and the brain. Doc's execution minions invoke Clive's Man as the **mandatory last Phase B step** so architecture and context sources stay synced in repo — not only in chat.

**Technical role (canonical):** Clive's Man Agent base Persona Config `Operational v0.3` (`rect04amPJAZrWCi4`, Approved). **`Operational v0.4`** (`recSKTT8NTTJOmuRu`) is **Pending** — repo sync and runtime promotion fail-closed until Matthew approves in Airtable. Minion roster: Minions table on the same base. **Option 3 lanes** (A direct Executor / B Trinity / C human): see `.cursor/skills/clive-man/SKILL.md`.

**Source document mining (V1):** Full Pam gates, API, and Matthew manual steps — `[docs/initiatives/source-document-mining.md](../initiatives/source-document-mining.md)`.

**Context flow (operator):** Chat and agent work → Household Activity → Activity Intake (Cursor on-demand / HyperAgent scheduled twin) or Thread Ambient → V1 proposal queue → human approve. Walkthrough: `[docs/context/clive-man-context-flow.md](../context/clive-man-context-flow.md)`.

### 4.4A Command centre (product UI)

**Decision (29 Jun 2026).** The AstraJax website homepage hero is the **command centre**: three founding portraits (Pam, Clive centre, Doc) on cream paper. In **Full Story mode**, each portrait is a door that widens into that character's **night-mode room** — moss immersive surfaces that front existing platform routes, not a replacement card grid.

| Door | Room | Fronts |
| ---- | ---- | ------ |
| Clive | Study | Chapter 1 loop, Ask Clive, brain review |
| Doc | Workshop | Fleet design, deploy, dispatch, agent bases |
| Pam | Desk + brain bases | Brain health, **Context Health tab**, review queue, agent bases (challenge framing) |

**Story modes:** Full Story = portrait doors (default). Light Story and No Story = flat `#platform` FeatureHub directory (accessible fallback). Implementation: `website/src/components/command-centre/`, routes `/command/clive`, `/command/doc`, `/command/pam`.

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



### Step 0: Build The Operator Map

Before the system builds the **business brain**, it maps **who is sitting in the chair** in two parts. Full taxonomy: `docs/initiatives/chapter1-context-structure.md`.

**Decision (29 Jun 2026):** Split the old "user brain" into **Operator Profile** (identity → drives brain set) and **Operator Competency** (calibration → drives Clive/Pam behaviour). Onboarding extracts the **skeleton** (archetype, function, confirmed brain themes, one-line definitions, Open Questions) — not the full brain.

#### Step 0A: Operator Profile (identity)


| Field                | Purpose                                                                                                                                      |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| **Archetype**        | Founder or Function Leader (senior owner of one function)                                                                                    |
| **Primary function** | Sales, Marketing, Product, Operations, Finance, Customer Success, People, or Other — when Function Leader; optional hybrid note when Founder |
| **One-line remit**   | Plain-language ownership — what they run                                                                                                     |
| **Guide mode**       | Full Story, Light Story, or No Story (Step 1 may refine)                                                                                     |


The profile selects a **template brain set** (Core Brain always + domain brains from archetype). The user confirms, prunes, or renames — templates, not cages.

#### Step 0B: Operator Competency (calibration)

This is not a test. It is a competency and confidence profile that tells Clive how to talk and tells Pam when to step in.

#### Step 0C: Operator Development (coaching)

Onboarding collects **strengths**, **weaknesses**, and **learning style preference** (pace, tone, teach-as-you-go — stored as Coaching Preferences on User Brains). All three are **required** at Step 0C. **Optional / skippable:** psychometric reference (colour profile, Insights, MBTI, etc. — reference only, not clinical diagnosis), development focus (active growth areas, separate from standing weaknesses), and development notes. Never Trusted Brain Truth. Drives Clive/Coach Whit coaching — **not** Trusted business context. Career ambition / aspirations are out of scope. See `docs/initiatives/chapter1-context-structure.md` §2.4.

**Why we ask:** so Clive calibrates pace, tone, and teaching style — not to judge the operator. Strengths and weaknesses help Clive avoid talking past someone or over-explaining; Pam uses them for coaching sensitivity, not performance review. Learning style preference is the development/coaching layer (guide mode is the story layer). Workshop User Brains only — never used for hiring, ranking, or surveillance. Rule 8 in practice: enablement, not surveillance.

**If this feels sensitive:** some people find weaknesses or self-assessment uncomfortable — that is normal. Required at Step 0C, but **honest enough to be useful** — brief bullets OK, not clinical or exhaustive. Revisit any time in Workshop. Psychometric reference optional; no pressure on colour profiles or similar. Pam treats unevidenced strengths as soft claims.

The competency map captures experience and comfort across domains such as:

- AI usage and prompting
- context environments and knowledge curation
- system architecture and workflow design
- coding and technical implementation
- commercial forecasting and planning
- data quality and evidence
- team leadership and change
- domain-specific work (filled in per client or vertical)

Each domain can be scored simply — for example: **new / comfortable / expert / prefer not to say** — plus optional notes ("strong on ops, weak on prompts").

**What the competency map controls:**


| Signal                             | Clive behaviour                                                    | Pam behaviour                                                                                                                                |
| ---------------------------------- | ------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------- |
| Low AI / prompt experience         | More explanation, fewer assumptions, slower pace                   | More sensitive **contextual** triggers (thin evidence, scope creep); mandatory Pam at action gates — not more frequent turn-count interrupts |
| Low context-environment experience | Plain language, teach as you go, do not trust vague context claims | Challenge scope and source boundaries when those topics arise, not on a timer                                                                |
| Strong system architecture         | Faster trade-off language, less hand-holding                       | Less challenge on structure; more on adoption and evidence                                                                                   |
| Strong commercial / domain         | Trust domain claims more; ask sharper operational questions        | Focus on narrative risk, stakeholder reaction, overconfidence                                                                                |
| Expert across the board            | Peer-level conversation; skip basics                               | Mandatory checkpoints still apply before action — expertise does not remove governance                                                       |


The operator map is **living**, not one-and-done. Profile and competency can be updated by:

- self-report at onboarding
- Clive inference from how the user actually talks and decides
- manager input (same pattern as Coach Whit: engagement level and technical adeptness set by a lead)
- outcomes from Pam checkpoints and approval history

**Product principle:**

> **The system adapts to the human before the human adapts to the system.**

Example Clive opener after a light user-brain intake:

```text
Right — you're strong on commercial planning and you've run teams through change before.
I'll stay out of your way on the business side. Where I'm going to be more careful
is context environments and prompt habits — that's where Pam and I will slow you down
on purpose before anything goes to Doc.
```

Example Pam calibration note (internal or surfaced lightly):

```text
User brain: low context-environment experience.
Contextual Pam sensitivity: high (scope creep, vague sources, over-broad agent brief).
Turn-count nudge: same as default — only at action boundary, not mid-exploration.
Mandatory Pam before: canonical context approval, agent creation, Doc handoff.
```

This step belongs at the **very start of Chapter 1**, before guide selection or business brain work. Without it, Pam's checkpoints are generic and Clive either over-explains or under-protects.

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

Guide selection may also be **informed by the user brain** — for example, a user who marks themselves as new to AI might default to Light Story with clearer scaffolding, while an expert may choose No Story without the system second-guessing them.

This is not only branding. Story keeps the experience engaging and keeps scopes tight without making constraints feel disengaging. Underneath, the same roles and guardrails apply.

### Step 2: Build The Brain

Clive runs a **structured interview** mapped to the confirmed brain set and universal categories (`docs/initiatives/chapter1-context-structure.md`). Progressive disclosure: L0 skeleton at onboarding, categories fill over time in Workshop, Trusted retrieval only at Working+ maturity.

Per brain theme, Clive helps the domain expert capture:


| Category                  | Examples                                                                                  |
| ------------------------- | ----------------------------------------------------------------------------------------- |
| **Definition**            | What this domain is; boundaries                                                           |
| **Goals & Priorities**    | Long-term direction; active quarter/year priorities (tag **Long-term** or **Active**)     |
| **Workflow**              | How work runs; handoffs                                                                   |
| **Data & Metrics**        | Numbers, sources, definitions                                                             |
| **Rules & Guardrails**    | Must / must-not; approval points                                                          |
| **Knowledge**             | Stable reference material                                                                 |
| **Examples & Edge Cases** | Concrete cases, exceptions                                                                |
| **Open Questions**        | Known gaps — not pretend-knowledge                                                        |
| **Business Context**      | *Function Leader only (Core):* loose whole-company understanding they read but do not own |
| **Adjacent Functions**    | *Function Leader only (Core):* other teams, handoffs, dependencies                        |


**Founder:** wider business understanding is built in **owned domain brains** over time — not a separate Core overlay. **Function Leader:** Core must capture loose **Business Context** and **Adjacent Functions** at L0 onboarding so Clive understands how the function sits in the company.

Clive produces **Workshop draft** rows tagged `(brain theme, category)`. Nothing is trusted until human approval and Doc promote.

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

**Pam has two trigger types. Do not confuse them.**

1. **Action gates (mandatory):** Before approval, agent creation, deployment, or Doc handoff — Pam is required. Every user. This is governance at meaningful moments, not mid-chat nagging.
2. **Contextual invitations (optional but smart):** Pam is *suggested* when the thread shows risk signals — scope expanding, evidence thin, one-direction drift, strategic recommendation, consequential write/deploy. The user brain adjusts **how sensitive** these suggestions are, not how often a turn counter fires.

**Turn-count nudges should not interrupt exploration.** A long Clive conversation is often productive. The turn-count safety net only applies when the user tries to **move from thinking to action** after a long uninterrupted thread — and the threshold should be high enough not to feel annoying.

Default turn-count rule (action boundary only):

```text
If the user attempts approval, agent creation, deployment, or Doc handoff after 12+ Clive/user turns without Pam in this thread, block until Pam reviews — regardless of user brain.
```

Less experienced users feel Pam **more often** because contextual triggers fire more readily and Clive proactively suggests her at action gates — not because the turn counter is lower.

There should also be a prompt-count checkpoint at the action boundary. After a set number of uninterrupted Clive turns in the same thread, Pam must be invited **before** the user can approve context, create an agent, or send anything to Doc. The exact threshold should be **high and shared across users**; user brain tunes contextual sensitivity instead. The product principle is fixed:

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

**Pam convenes the Court; she does not own it.** As clerk of the court she calls the session, keeps order, and makes sure caution is voiced. On the merits she remains one voice on a bench of peers. The Court may be hosted from Pam's base as an implementation detail, but its conceptual home is the panel, never the challenger lane. The room must not inherit any single voice's temperament.

Roles (bench as seated, Matthew 1 Jul 2026):

- **Clive:** positive case, adoption upside, human meaning.
- **Pam Portiscue:** sceptical case, weak assumptions, rabbit-hole risk. Also convener (see above).
- **Doc:** implementation cost, operational risk, action readiness.
- **Lazlo Marlowe:** the dramaturg's eye. Does this hold together as a story humans will believe?
- **Clive's Man:** keeper of the record. What does the record actually say, and what precedent does this set?
- **Judge:** summarises the cases, but does not decide.

Lazlo Marlowe and Clive's Man stepped in for Iris (evidence quality) and Vera (stakeholder reaction) on 1 Jul 2026. Iris and Vera remain available voices; the bench composition is Matthew's call and may rotate.

Core rule:

> **The Court surfaces perspectives. The human gives judgement. Doc executes only after judgement is recorded.**

**In-character dialogue.** In the Court the cast converse with each other fully in character: live dialogue, not only parallel takes. The theatre is deliberate adoption infrastructure, and it carries one binding constraint: the richer the scene, the MORE prominent the human judgement gate must become, never less. A well-performed scene must never feel like it reached a verdict. The Judge closes by handing the matter to the human; the scene visibly cannot conclude without them.

**Two ways in.** Court Mode is reached by escalation from the human gate when stakes are high, or by standalone entry: a user may bring a novel idea directly to the Court at any time. The standalone door is always open, but the framing stays earned and high-stakes. Idle brainstorming belongs with Clive; the Court is the bench.

The name is **Court Mode**. ("War Room" was considered and rejected as a mixed metaphor: war rooms command, courts deliberate, and war rooms have no judge. Matthew, 1 Jul 2026.)

Court Mode should exist in all story modes:

- Full Story Mode: theatrical court scene.
- Light Story Mode: structured decision panel.
- No Story Mode: plain multi-agent review.

The substance is the same. The theatre is the interface.

**Governance note (1 Jul 2026):** these v2 decisions (convener framing, in-character dialogue, standalone entry) were adopted by Matthew from a Clive assessment without a Pam stress-test, which Matthew explicitly deferred. Known governance exception; revisit with Pam before this section drives external claims or pricing.

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

Doc receives the approved brief and routes it to the correct executor.

Examples of what Doc dispatches:

- Context Item (structured write)
- Agent Environment
- Agent Configuration Draft
- Approval Rule
- Change Log entry
- Deployment Package record
- Follow-up task
- Implementation job (build/refactor work — see §9)

Doc writes or dispatches with source, reason, approver, timestamp, and action. Outputs land in **Draft** or review queue until a human confirms publish where required.

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

Character is how scope becomes legible for humans and models — see
`docs/business/positioning.md` §4A. Legibility does not replace governance.

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

Brain maturity should also be visible and engaging. The system should make context quality feel like progress, not admin. The internal discipline behind this is **Context Health**: a lightweight routine for spotting bloat, tightening useful memories, retiring stale material, and promoting only human-approved truth.

Example brain levels:

```text
Level 0 — Seedling Brain
Starter context exists, but it is mostly draft.

Level 1 — House-Trained Brain
Core records are tidy enough for guided use.

Level 2 — Working Brain
Domain expert QA has started; agents can answer low-risk questions with caveats.

Level 3 — Sharp Brain
Multiple QA passes complete; agents can answer routine in-scope questions with source confidence.

Level 4 — Trusted Brain
Management sign-off complete; mature enough for operational use within defined boundaries.

Level 5 — Elder Brain
Battle-tested through feedback, corrections, and repeated successful use.
Still not allowed to publish or change live state without human approval.
```

Names can be tuned by client culture. A sober client might see "Draft / Reviewed / Operational / Trusted". A playful team might see the full story-mode labels. The underlying maturity controls stay the same.

The system can show:

- brain level
- next level requirements
- QA pass count
- approved record count
- stale records to fix
- known gaps
- confidence by domain
- leaderboard position where appropriate
- estimated efficiency impact
- eligible Brain Efficiency Credit

Leaderboard patterns should reward **brain health and contribution**, not raw staff surveillance:

- cleanest brain
- most improved brain
- fastest stale-context cleanup
- best evidence coverage
- most helpful corrections
- strongest domain-owner review streak

The point is to make context hygiene feel rewarding. The point is not to rank humans by productivity.

In production, brain maturity can also connect to pricing through a **Brain Efficiency Credit**.

The commercial logic is simple:

> **Better brains cost less to run, so clients who maintain better context should share in the savings.**

A mature brain should reduce:

- retrieval waste
- repeated clarification loops
- unnecessary model escalation
- unnecessary Pam interventions
- failed or low-quality agent runs
- support burden
- manual repair work
- implementation rework caused by bad context

That means brain maturity is not just a quality badge. It has a cost profile.

Example production pricing pattern:

```text
Seedling Brain     standard usage rate
House-Trained      no discount yet, but progress visible
Working Brain      5% Brain Efficiency Credit
Sharp Brain        10% Brain Efficiency Credit
Trusted Brain      15% Brain Efficiency Credit
Elder Brain        20% Brain Efficiency Credit
```

This should usually reduce **usage or overage cost**, not the core platform fee. The platform fee pays for the operating layer. The efficiency credit rewards clients for lowering the cost and risk of their own agent runs.

The credit should be capped, reversible, and earned over time. For example:

- maturity must be sustained for 30 days
- known critical gaps must be below threshold
- contradiction count must be low
- answer failure rate must be improving
- stale records must stay below threshold
- management sign-off must remain current

Do not position this as a schoolroom discount for "good behaviour". Position it as shared economics:

> **AstraJax rewards context quality because better context makes AI cheaper, safer, and more useful.**



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

Chapter 1's first concrete review surface is the client-facing Brain Interactions review flow (`/brain/review`). Client scores and suspected-context flags create review signals in the Workshop base; they do not approve, publish, quarantine, or promote context by themselves.

When brain maturity improves, the system should celebrate it.

Example:

```text
Brain level up: Working Brain -> Sharp Brain
Reason: 3 QA passes completed, 42 approved records, no unresolved contradictions,
and the last 20 in-scope answers were marked helpful.
```

This makes the boring layer visible. It teaches teams that better context creates better agents.

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

Pam should not interrupt productive exploration on a timer. That trains people to find her annoying and they will skip her.

**Mandatory:** Pam at every action gate (approve, create agent, deploy, Doc handoff).

**Optional but calibrated:** contextual Pam suggestions when risk signals appear. User brain makes these more or less sensitive — a newcomer may see more "shall we ask Pam?" moments when scope or evidence wobbles; an expert sees fewer, but the same hard gates still apply.

**Turn-count safety net (action boundary only):** If the user tries to act after a long Clive-only thread, Pam blocks until she has reviewed. This is not a mid-conversation interrupt.

The first version can use a simple rule:

```text
Action gates: Pam required before approval, agent creation, deployment, or Doc handoff — all users.

Contextual suggestions: user brain adjusts sensitivity (new to context work = suggest Pam sooner when scope/evidence wobbles).

Turn-count safety net: only at action boundary, after 12+ Clive/user turns without Pam in the thread. Same threshold for all users. Tunable upward, not downward — if 12 feels annoying, raise it; do not lower it for "new" users.
```

The threshold is tunable. The behaviour is not: important work should not drift from helpful chat straight into action without challenge — but exploration should not be punctured every few turns.

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

Implementation workers (Composer via Cursor SDK) must not run without a linked approved brief ID. Doc translates; workers execute.

### Rule 6: Match The Executor To The Action

Not every approved action needs a coding agent.

- **Structured writes** (single context record, status change, log entry) → deterministic Doc tool (Airtable API / MCP). Fast, exact, cheap.
- **Packages and runtime handoffs** → HyperAgent export / deployment pipeline.
- **Build and refactor work** (multi-file changes, config generation, interface work) → implementation worker (Composer).

Using a repo agent to create one Airtable row is overkill and harder to govern. Using a direct API write to refactor six TypeScript files is the wrong tool.

### Rule 7: The Runtime Executes, It Does Not Own The Brain

HyperAgent or another runtime can execute agent work.

The context brain should remain in an AstraJax-controlled, tool-agnostic layer so the client is not trapped inside one runtime's memory model.

**Durable memory lives in Airtable**, not HyperAgent: Agent bases (character + Persona Memories) and Trusted Brain bases (Brain Truth + Brain Memories). Runtimes fetch at session start; they do not accumulate their own memory store. Persona Memories may auto-form in Agent bases without human approval on create; human gates apply at **promotion** to shared or canonical truth, not at every diary entry.

### Rule 8: Coaching Is Not Surveillance

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

The same rule applies to brain leaderboards. Use leaderboards to celebrate better context and better learning loops, not to shame individuals.

Acceptable:

- "The Sales Brain reached Sharp Brain this week."
- "Ops closed 12 stale-context gaps."
- "Customer Success has the best evidence coverage."

Avoid:

- "Sarah is last."
- "Tom asked the fewest questions."
- "This person is bad at AI."

If a leaderboard would make a person feel watched rather than helped, the design is wrong.

### Rule 9: The Paper Trail Matters

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

It should also carry maturity metadata:

- maturity level
- domain owner
- management sign-off status
- QA pass count
- last reviewed
- approved record count
- draft record count
- stale record count
- known gaps
- contradiction count
- answer failure rate
- trusted-for domains
- next level requirements
- leaderboard eligibility
- efficiency credit eligibility
- current efficiency credit percentage
- efficiency credit review date

Maturity controls answer authority. A Draft or Seedling Brain should produce caveated answers and more escalations. A Trusted Brain can answer routine in-scope questions with less friction, while still requiring human approval for canonical changes or live actions.

**Brain maturity is earned by human review, not agent confidence.**

### Context access and maturity

Context access is **maturity-gated**, not available from day one:


| Maturity            | Context access                                                                                                                   |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| **Seedling**        | Workshop only. Draft intake and review. No approved-context access for agents.                                                   |
| **Working+**        | Approved context exists. Agent may ask to use approved context for a bounded task — human approves, access is scoped and logged. |
| **Trusted / Elder** | Smoother retrieval inside approved domains; live changes still require human approval.                                           |


**Hard lock = base separation.** Registry, Workshop, and Trusted Brain are separate Airtable bases (one Trusted base per brain theme). That physical boundary is the primary lock. A **grant** is permission to query a Trusted Brain for a bounded task. **Scope** is a retrieval and audit filter inside the grant — not a separate user-facing “key per area.”

**Naming:** “Brain Key” is internal governance vocabulary (engineering, schema, credentials). Public product language: **approved context for this task**. Demo and client surfaces should not lead with keys.

Brain maturity may also control commercial incentives in production. Better-reviewed brains should be cheaper to run because they require fewer retrieval calls, fewer high-cost escalations, fewer repair loops, and fewer support interventions.

This creates the right operating incentive:

```text
Clean context -> better answers -> lower usage cost -> stronger adoption -> cleaner context
```

The pricing system must not reward teams for bulk-approving weak context. Efficiency credits should depend on quality signals, not volume alone.

### User Brain

The **operator map** (Profile + Competency) is separate from the business context brain. "User brain" in older copy means this combined object; canonical structure splits identity from calibration — see `docs/initiatives/chapter1-context-structure.md`.

**Operator Competency** holds the confidence map for each person using the system — what they know, what they are learning, and how Clive and Pam should adapt.

It should contain:

- domain experience scores (AI, context, architecture, coding, commercial, etc.)
- manager-set coaching flags where relevant (same family of signal as Coach Whit)
- inferred updates from conversation behaviour
- Pam checkpoint thresholds per user (contextual sensitivity, not turn-count penalties)
- Clive interaction preferences (pace, jargon tolerance, explanation depth)
- history of approvals, corrections, and Pam outcomes

The operator map does not replace human judgement. It calibrates how much support and challenge the system offers before the human decides.

**Operator Profile** (identity) holds archetype, primary function, remit, and the confirmed brain theme set. It lives in Workshop User Brains alongside competency fields.

### Canonical brain structure (Chapter 1)

**Decision (29 Jun 2026).** Every business context record has a coordinate: **(brain theme, category)**.

- **Brain themes** = domains the operator owns (Core Brain always + Founder or function templates). Brains are **domains**, not content kinds.
- **Categories** = universal slots inside every brain: Definition, Goals & Priorities, Workflow, Data & Metrics, Rules & Guardrails, Knowledge, Examples & Edge Cases, Open Questions, Business Context, Adjacent Functions. **Business Context** and **Adjacent Functions** are Core overlays prompted only for **Function Leader**; founders build company-wide depth in owned domain brains instead.
- **Progressive disclosure:** L0 skeleton at onboarding → L2 Workshop drafts by category → L3 Trusted retrieval at Working+ via grant.

Brain themes are **physically separated by default**: the Core Brain and each confirmed domain brain get their own Trusted Brain base. Scope areas such as `read:brain-truth:<area>` remain the grant and retrieval keys inside the relevant Trusted Brain.

Full taxonomy, templates, migration map, and acceptance checks: `docs/initiatives/chapter1-context-structure.md`.

### Context layers and harness surfaces

Maps how context types relate to storage and governance (informed by context-engineering practice; AstraJax governance unchanged):


| Surface              | Examples                                                                             | Rule                                                              |
| -------------------- | ------------------------------------------------------------------------------------ | ----------------------------------------------------------------- |
| **Locked**           | Trusted Brain Truth, approved Persona Config                                         | Agents read; humans promote in                                    |
| **Editable**         | Workshop drafts, operator profile fields, Source Documents (attachments + summaries) | Clive / Clive's Man draft and mine; humans correct; never Trusted |
| **Append-only**      | Change Log, Brain Interactions, Persona Memories                                     | Write new rows; steward may retire                                |
| **Human-controlled** | Approval Decisions, Pam at action gates, Doc handoff                                 | No live truth without human                                       |


Session working memory stays in interactions; durable business truth stays in Workshop → Trusted; character truth stays in Agent bases — never mixed.

### Airtable

Airtable is the natural operating layer for the current system. For the buyer/founder answer on *why* Airtable — legibility for non-technical champions, cost model, ceiling, and governance — see `docs/business/positioning.md` §5A.

The governed **base pattern** (Registry, Workshop, one Trusted Brain per theme, one Agent base per agent) is the physical home for context, grants, and character authoring. **Field shapes and tables:** `docs/initiatives/brain-key-schema.md`. **Access, credentials, and API routes:** `docs/initiatives/brain-key-wiring.md`. **Scaffolding and extending bases** (tables, fields, registry rows — not approved truth): **Doc Brain Base Builder** via `@doc` or `@doc-brain-base-builder`; invoke guide and live inventory snapshot in `docs/initiatives/doc-brain-base-builder.md`. Live base/table IDs: `website/src/lib/brains/airtable-ids.ts`.

**Creative / visual system (10 Aug 2026).** Cast art, vault media, folio furniture, and creative doctrine live in Trusted Brain theme **`creative`** — base `AstraJax Trusted Brain — Creative`. Required tables stay **Brain Truth** + **Brain Memories**; **Media Assets** is the add-on catalogue (one row per file, Blob URL as the file home — not Airtable attachment copies, not git binaries as SSOT). Tara-Lee holds visual finish; Locked status is the production gate. Do not park creative catalogues in Chapter 1 Trusted or only in Agent bases.

It can hold:

- context records
- review queues
- agent environments
- change logs
- deployment packages
- feedback records
- training and adoption data
- implementation jobs (approved brief → executor routing → worker output)
- Locked creative media catalogue (Creative Trusted → Media Assets → Blob)



### Git / Markdown

Git-backed Markdown remains useful as an audit mirror: a second copy of important context outside Airtable.

An audit mirror is a second copy of the log kept outside Airtable, so the system has a paper trail even if the operating base changes.

### Runtime Memory

Runtime memory (HyperAgent `/memories`, thread scratchpads, ephemeral session state) should be treated as execution support, not the canonical brain.

If the runtime learns something useful, it should flow into **Persona Memories** or **Brain Memories** in Airtable — or through the context review loop before becoming **Brain Truth** — not remain in the runtime store. Governed HyperAgent exports keep `autoSaveMemories = false`; auto-save targets Airtable Agent bases under sanitiser and retire rules (see `brain-key-wiring.md`).

### Agent Authoring Surface (Canonical)

**Decision, 25 June 2026.** Claude/ChatGPT integrations are the **primary client-facing runtime** for AstraJax agents (Clive, Pam, Doc, Clive's Man, and the rest of the fleet). The Cursor-native agents (`@clive` and friends, defined in `.cursor/agents/` and `.cursor/skills/`) are used only **rarely** with clients; they are mostly internal and developer surfaces. When a client builds agents, they are built for the Hyperagent runtime. 

Because HyperAgent leads, **Airtable is the canonical place a human authors an agent**, not the repo. Each agent's Agent base holds the authored source:

- **Character backstory** is authored in the **Narrative Arch** table.
- **System prompt, rules, and output format** are authored in the **Persona Config** table.
- **Skills** are authored in Airtable too. A HyperAgent skill is just text plus a `whenToUse` trigger (the line that tells the runtime when to load it) and a pinned/load flag, so it has the same shape as the memory rows already in the Agent base.

A **generator** (a script that reads Airtable and writes out the agent files, using the existing `hyperagent/builds/build_*.py` pattern and run by Doc) then emits **both**:

- the HyperAgent export JSON (`hyperagent/exports/...`), and
- the Cursor `.cursor/agents/*.md` and `.cursor/skills/*/SKILL.md` files.

Cursor loads agents and skills from files on disk when they are invoked; it cannot read from Airtable. So the generated files are what keeps the Cursor surface working. The takeaway: **Airtable plus the generator are canonical. The repo** `.cursor/` **files and build packs are generated artifacts, not hand-authored sources of truth.**

**Governance is unchanged and reaffirmed.** Authoring changes still flow through the existing human-approval gates: a human approves Narrative Arch changes and Persona Config changes, and skills authored in Airtable pass the **same human approval** before anything is generated or published.

**Chapter 1 Persona Config records (Operational v0.2, 27 Jun 2026):** see §4 "Where role specs live" and `website/src/lib/brains/airtable-ids.ts` (`CLIVE_PERSONA_CONFIG`, `PAM_PERSONA_CONFIG`, `DOC_PERSONA_CONFIG`, `CLIVE_MAN_PERSONA_CONFIG`, `LAZLO_PERSONA_CONFIG`, `KATHRYN_GOODCHILD_PERSONA_CONFIG`). When product role or engineering rules change, update Persona Config in Airtable first; then run the generator to refresh repo sync artifacts.

**Trade-off accepted.** Authoring long skill text in Airtable cells is harder to review than a file change in git, where edits are easy to see line by line. Matthew accepted this because HyperAgent is the primary runtime and the Cursor surface is rare.

This **supersedes** the earlier note in `docs/initiatives/brain-key-schema.md` that the repo stays canonical for agent design.

### Tiered Character Context (Canonical)

**Decision, 26 June 2026.** Each agent's character truth is held in its **Agent base** in three tiers, ordered by how reliably they reach the runtime. The goal is that the most important character truth is always in front of the agent, and lower-value detail never crowds it out.

- **Tier 1, Super Objective.** One selfish sentence (two at an absolute push) that animates the character across its whole life. Canonical, always injected, highest priority. At most one active Super Objective per character. It holds the truth; everything else is colouring in. Authored in **Narrative Arch**.
- **Tier 2, Known Truths.** Exactly **five** canonical, never-changing bedrock records, always injected but capped at five so they cannot bloat. The fixed five are: (1) the formative memory, the happiest and saddest memory framed as the one that set the Super Objective; (2) a secret the character has never told anyone; (3) the baseline opinion of each other agent, the fixed stance only; (4) the greatest fear, which mirrors the Super Objective; (5) the Inner Attitude, the character's innate temperament, tempo, and animal, the how rather than the want. Authored in **Narrative Arch**.
- **Tier 3, Persona Memories.** Limitless, retrieved on demand rather than always injected, tracking how the character **develops** over time. Every memory links to exactly one of the five Known Truths, so each development hangs off the bedrock it belongs to (for example a memory of Pam telling Clive off links to truth 3, his baseline stance on Pam; a worry that people might find out about something links to truth 2, his secret). Authored in **Persona Memories**.

**Write-with-approval gate.** The character-craft agents (the Lazlo lane) may **write** to Agent bases, but every Tier 1 and Tier 2 write lands as **Pending** and only Matthew promotes it to **Approved-Canonical**. This is the same helpful-by-default, human-approves-before-it-counts pattern used everywhere else in the brain: an agent proposes, a human promotes. Tier 3 Persona Memories keep the existing non-canonical rule, they auto-form as Active without a per-record gate, and a steward retires stale ones; the human gate is only at promotion out of the memory tier. Field-level blueprint lives in `docs/initiatives/brain-key-schema.md`; the access and credential model in `docs/initiatives/brain-key-wiring.md`.

### Context Health (Internal Curation Discipline)

Context Health is the operating discipline that keeps brains useful as AI usage increases. It is internal architecture language, not the public headline. Public copy can say "clean context" or "context discipline"; this section defines how the system prevents context bloat in practice.

The problem is simple: as agents and users capture more context, not all of it remains useful. Some records are gold, some are noise, and some were true last month but dangerous now. If nobody owns that routine, output quality degrades, retrieval gets noisier, costs rise, and users blame the AI instead of the context environment.

The Architect owns context health for their function because they are closest to the operational truth. Engineers should not become the permanent middle layer for deciding which sales, operations, marketing, or finance details matter. Engineering builds the rails; the Architect keeps the brain truthful inside those rails.

Core lifecycle:

```text
Draft Memory -> Working Memory -> Trusted Truth
                         |-> Retired / Archived
```

- **Draft Memory** — captured or proposed context. Useful signal, not trusted truth.
- **Working Memory** — low-risk, scoped, reversible context that agents may use with caveats inside its boundary.
- **Trusted Truth** — human-promoted canonical context. Agents can read it, but they cannot promote into it.
- **Retired / Archived** — removed from retrieval but kept in the paper trail unless a human approves deletion.

**Hard rule:** agent automation may help with Draft and Working Memory. It must not promote anything into Trusted Truth. Trusted Truth remains a human gate.

Importance scoring should live on Brain Memories, not Trusted Truth:

| Importance | Meaning | Automation stance |
| ---------- | ------- | ----------------- |
| **1** | Low-value or highly transient | Candidate for auto-retire if unused |
| **2-3** | Useful but bounded / low-risk | Agents may tighten wording or propose Working Memory changes within risk tolerance |
| **4** | Important operational context | Agent may propose, human reviews before promotion or major change |
| **5** | Load-bearing rule, policy, public claim, money, client impact, or live-user consequence | Human review required; Pam gate where appropriate |

Risk tolerance should be configurable per brain and should scale with maturity:

| Mode | Use when | Curator latitude |
| ---- | -------- | ---------------- |
| **Conservative** | new brain, sensitive domain, weak evidence, or low user confidence | propose-only except obvious retire candidates |
| **Balanced** | Working Brain with routine usage and clear owner | may update 1-3 importance Working Memory, with audit trail |
| **Assertive** | mature brain, low-risk domain, strong feedback loops | may auto-tighten and auto-retire low-importance records, still no Trusted Truth promotion |

The curation loop:

1. **Capture** — new context enters as Draft Memory, Source Document summary, Brain Interaction signal, or human note.
2. **Score** — assign importance, domain, freshness, and risk.
3. **Tighten** — improve wording, source links, examples, and scope boundaries.
4. **Retire** — remove stale or low-value material from retrieval; keep archive/audit trail.
5. **Promote** — only a human promotes to Trusted Truth.

Agent telemetry should support the routine. When an agent uses context to answer, the system should record which Brain Memory or Trusted Truth rows were touched. Brain Interactions should be able to show:

- response ID
- agent / persona
- brain slug and scope
- memory or truth records touched
- user score or feedback
- suspected context issue
- proposed curation action

Poor user feedback should not directly rewrite trusted context. It should trigger a curation workflow: identify the likely bad context, propose a fix, and route the action based on importance and risk. For low-importance Working Memory, the Curator may tighten or retire inside the configured tolerance. For Trusted Truth, load-bearing records, or uncertain fixes, the item goes to human review.

Auto-retire is allowed only below the trust line. A sensible default:

```text
If an importance-1 Working Memory has not been referenced, amended, or positively reinforced for 14 days,
move it out of retrieval into Retired / Archived, with source, reason, timestamp, and rollback route.
```

Do not use "delete forever" as the system behaviour for context bloat. Retirement removes bloat from retrieval while preserving reviewability.

Implementation notes:

- **Product surface (Phase 1, demo data):** `/brain/health#context-health` tab and Pam desk station expose importance mix, per-brain risk tolerance (session-only in demo), and a retire queue with propose-only + paper trail. `/command/pam` shows an inline bloat summary in Pam's challenger voice. Types and demo seed: `website/src/lib/platform/brain-health.ts`; UI: `BrainHealthShell`, `PamDeskRoom`.
- Clive's Man owns the stewardship lane and orchestrates Proposer -> Challenger -> Executor for context-health actions.
- One tightly scoped Curator may exist per brain theme or brain base, but it should be treated as a Clive's Man lane/minion unless Matthew approves a separate product agent.
- Any schema work for memory usage telemetry belongs in `docs/initiatives/brain-key-schema.md`.
- Any credential, grant, or runtime permission change belongs in `docs/initiatives/brain-key-wiring.md`.
- Context Health must respect Rule 1 (Agents Propose, Humans Approve), Rule 7 (runtime does not own the brain), and Rule 9 (paper trail matters).

---



## 8. Model And Runtime Stance

Publicly, AstraJax should avoid making the product depend on one model brand.

Internally, the current instinct is:

- use stronger reasoning models where the job is judgement, trade-offs, and context extraction (**Clive**)
- use a strong operational model where the job is translating approved briefs into precise execution instructions (**Doc dispatch layer**)
- use a cost-efficient coding agent where the job is repo work, build, and refactor (**implementation worker**)
- use HyperAgent for autonomous runtime where it reduces operational burden
- use direct API/MCP tools for deterministic structured writes



### Current internal assignment (subject to change as models evolve)


| Role                      | Current instinct                                                          | Token profile                                     |
| ------------------------- | ------------------------------------------------------------------------- | ------------------------------------------------- |
| **Clive**                 | Strong reasoning model (e.g. OpenAI GPT at max for founder/strategy work) | Medium–high during exploration                    |
| **Pam**                   | Same family as Clive or dedicated challenge pass                          | Low–medium; event-triggered                       |
| **Doc dispatch**          | Claude Opus-class model for brief → execution prompt translation          | **Low** — runs only at action boundary            |
| **Implementation worker** | Cursor Composer via SDK / Cloud Agent                                     | **High** — but cheap per unit; does heavy lifting |
| **Runtime agents**        | HyperAgent                                                                | Execution, not brain ownership                    |


This is not doubling up. Opus does not re-read the whole repo. Composer does not re-decide the brief. Each model runs only where it is strongest.

The public architecture should say:

> **AstraJax uses the right model and runtime for the job, while keeping the human-approved context brain portable.**

Do not oversell "ChatGPT reasons, Claude codes" as permanent truth. Models change quickly. The durable architecture is **reasoning vs challenge vs dispatch vs implementation vs execution**, not one vendor vs another.

---



## 9. Production Doc Routing (Opus → Composer)

This section defines how Doc acts in production once a human has approved a brief.

### 9.1 The Production Loop

```text
Human approves brief (with brief ID)
        ↓
Doc dispatch layer (Claude Opus-class)
  → validate brief completeness
  → route by action type
  → if build work: translate brief → Composer-ready execution prompt
        ↓
Job queue / webhook fires implementation job
        ↓
Composer worker (Cursor SDK or Cloud Agent)
  → scoped repo / config work
  → returns diff summary, artifacts, or draft records
        ↓
Doc writes log + output to Draft / review queue
        ↓
Human confirms publish (where required)
```

**Principle:** Opus translates judgement into instructions. Composer executes. Neither re-does the other's job.

### 9.2 What Doc Routes Where


| Approved action                                                                             | Executor                                     | Why                                                                                                                                           |
| ------------------------------------------------------------------------------------------- | -------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| Create/update one context record                                                            | **Direct Doc tool** (Airtable MCP / API)     | Schema-bound, exact, auditable                                                                                                                |
| Change log, approval stamp, status → Draft                                                  | **Direct Doc tool**                          | Deterministic                                                                                                                                 |
| Scaffold or extend Brain Key bases (Registry, Workshop, Trusted Brain, Agent tables/fields) | **Doc Brain Base Builder** (Cursor/Composer) | Governed four-base shapes; human approves Phase A plan before MCP writes. Schema: `brain-key-schema.md`; runbook: `doc-brain-base-builder.md` |
| HyperAgent package from approved config                                                     | **Packaging pipeline**                       | Structured export                                                                                                                             |
| Multi-file build, refactor, scaffold, demo route                                            | **Composer worker**                          | Repo-shaped work                                                                                                                              |
| Interface extension / migration script                                                      | **Composer worker**                          | Code-shaped work                                                                                                                              |


**Rule:** if the action fits in a table schema, do not invoke Composer. If it spans files or code, do not fake it with a single API write.

### 9.3 Doc Dispatch Layer (Opus)

When the approved action is implementation-shaped, Doc uses a strong operational model (current instinct: **Claude Opus 4.8**) to produce a **Composer-ready execution prompt**.

Opus input (small):

- approved brief ID
- human approver
- action type
- scope boundaries
- affected surfaces (files, tables, packages)
- success criteria
- do-not-touch list

Opus output (structured):

```text
Execution prompt for Composer:
- Objective:
- Repo / workspace:
- Files in scope:
- Files out of scope:
- Pattern to follow:
- Success criteria:
- Required output (diff summary, record IDs, export path):
- Stop conditions / escalate if:
```

Opus token usage stays **low** because it runs once per approved action at the boundary — not during open-ended user chat.

### 9.4 Implementation Worker (Composer)

Composer runs via **Cursor SDK** (local or cloud agent) or equivalent Cursor agent infrastructure — not as a generic external API key plugged into other editors.

Composer input:

- Opus-generated execution prompt
- linked approved brief ID
- scoped credentials / workspace

Composer output:

- code or config changes
- diff summary
- generated artifacts (e.g. HyperAgent export draft)
- errors or escalate signals

Composer absorbs the **heavy token load** at a **lower unit cost** than using a reasoning model to do repo work directly.

### 9.5 Trigger Mechanism

"Webhook" is the right concept; implementation is likely:

1. Human approval writes row to `**implementation_jobs`** (or equivalent) in Airtable with status `Approved`.
2. Worker picks up job (poll, webhook, or queue).
3. Doc dispatch (Opus) compiles execution prompt if action type = `build`.
4. Cursor SDK / Cloud Agent runs Composer.
5. Worker callback updates job: `Running` → `Draft ready` | `Failed` | `Needs review`.
6. Doc writes **Change Log** with brief ID, prompt hash, executor, diff summary, record links.

Requirements:

- **Idempotency** — same brief ID must not spawn duplicate builds.
- **Tenant isolation** — per-client repo, env, and credentials.
- **No orphan runs** — Composer cannot start without `approved_brief_id`.



### 9.6 Guardrails

1. **No Composer without approved brief ID** — Opus cannot freelance a build from chat drift.
2. **Structured writes skip Composer** — context records go through direct Doc tools.
3. **Output lands in Draft** — Composer implements; humans publish to canonical.
4. **Brief + prompt + diff logged** — full paper trail for review and rollback.
5. **Doc escalates, not guesses** — if brief is vague, job status = `Needs review`, no worker run.
6. **Users still do not chat with Doc for exploration** — dispatch is backend orchestration surfaced as status, not a second reasoning thread.



### 9.7 Token Economics (Why This Stack)

One of the biggest hidden costs in AI adoption is **model misuse**.

When users do not know what they are doing, the default pattern is to use the strongest model for everything. That feels safe but burns money quickly: expensive reasoning models get used for formatting, simple admin, deterministic writes, and bounded execution work.

AstraJax should teach and enforce a better operating pattern:

```text
Clive/Pam  →  medium–high tokens during thinking (worth it — wrong direction is expensive)
Opus/Doc   →  low tokens per action (brief translation only)
Minion/Composer → high tokens per job (cheap relative to Opus doing repo work)
Direct API →  negligible tokens (record writes)
```

The durable rule:

> **Use expensive reasoning for judgement. Deploy minions for bounded execution. Use direct tools for schema-bound writes.**

AstraJax margin improves when implementation runs through bounded workers on approved briefs rather than through expensive general reasoning or founder-in-Cursor manual passes — while governance stays intact because humans still approve what becomes true.

Client value improves for the same reason: lower token waste, fewer unnecessary model escalations, and clearer accountability for which system did what.

### 9.8 Client-Facing Language

> "Your team reasons with Clive, gets challenged by Pam, and you decide. Doc dispatches the approved change — simple records go straight into the brain; build work goes to a governed implementation worker. Nothing live changes without your sign-off."

This is also the **agent-first business** proof for AstraJax: the company runs the same pattern it sells.

### 9.9 Demo vs Production


| Surface                  | AIE demo                                     | Production                     |
| ------------------------ | -------------------------------------------- | ------------------------------ |
| Doc handoff UI           | Mock or manual trigger acceptable            | Real job queue                 |
| Opus → Composer pipeline | Can simulate with founder-in-Cursor          | Automated via SDK              |
| Structured writes        | Can show seeded Airtable record              | Live MCP/API                   |
| Composer worker          | Optional; Matthew-as-Doc acceptable for demo | Required for client build lane |


The demo must show the **story** of Doc dispatch. Production must show the **routing**.

---



## 10. Demo Architecture

For the AIG / HyperAgent demo, the system should be demo-quality, not production-grade.

### Must Feel Real

- user brain intake (light competency map)
- guide selection
- Clive context interview (adapted to user brain)
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



## 11. Relationship To HyperAgent

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



## 12. Relationship To Existing DS Platform Proof

The Direct Sales platform provides the working proof for the architecture.

Reusable proof patterns:

- **Clive:** friendly guide and context surface.
- **Doc Albright:** fleet engineer, debug intake, fix pipeline.
- **Coach Whit:** prompt coaching calibrated to user engagement and technical adeptness — downstream of the user brain pattern.
- **Scorekeeper / KK Kingsford:** adoption momentum, XP, leaderboards.
- **Bot Fleet:** roster, change logs, fix queues, training analytics.
- **Build-a-Brain / DS Brains:** context curation and review.
- **Training hub:** videos, sandboxes, engagement tracking.
- **Matthew-in-Cursor (founder build):** living proof of the Composer implementation lane — production generalises this as Doc → Opus → Composer dispatch.
- **Trinity pattern:** link -> propose -> human approves -> execute.

The AstraJax demo should not rebuild all of this. It should generalise the pattern and show the clearest version of the loop.

---



## 13. Open Questions

These need decisions as the build sharpens:

1. Is Doc introduced immediately after the first approval, or only in Chapter 3 after the user understands the brain?
2. What exact surfaces can Doc write in the first demo?
3. Which actions require Matthew approval in the AstraJax demo environment?
4. Does HyperAgent receive a generated package manually, through API, or through a mocked export for the first recording?
5. How much of Scorekeeper/coaching is shown as live UI vs production proof?
6. What is the first client-ready object: brain brief, agent package, adoption audit, or fleet plan?
7. What is the first implementation job type to automate via Opus → Composer (demo route, context pack scaffold, HyperAgent export generator)?
8. Cloud Agent vs local SDK worker for client tenants — data residency and credential model?
9. Exact `implementation_jobs` schema and idempotency key format?

---



## 14. Current Architecture Statement

Use this as the simplest explanation:

> **AstraJax maps who the user is, helps domain experts build the business brain and shape the fleet. Clive reasons with them — adapted to their experience. Pam Portiscue stress-tests important decisions — calibrated to where they need challenge. Humans approve what becomes true. Doc routes the approved change: structured writes go direct; build work goes Opus → Composer; runtime agents execute in HyperAgent or elsewhere. Feedback flows back into the brain so the system keeps improving.**

That is the architecture.