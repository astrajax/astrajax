# AstraJax AIE Build Plan

**Status:** active day-by-day build plan for the AI Engineer World's Fair sprint (retires after 2 July 2026).
**Owner:** Matthew.
**Read with:** `docs/initiatives/aie-2026-07.md` (the sprint brain: story, scope, do-not-build list) and `docs/initiatives/tara-lee-visual-brief.md` (visual deliverables).
**Front door:** `docs/START-HERE.md`.

This is the plan to stick to from **Tuesday 23 June** to **AIE on Thursday 2 July**.

The rule for the sprint:

> **Every day must produce one visible asset. No more strategy-only days.**

Daily rhythm:

1. Story decision or script.
2. Cursor build.
3. Record, watch back, cut.

The danger is not underbuilding. The danger is building the most interesting product instead of the most convincing booth.

Catch-up note:

> **Tue 23 was not completed. On Wed 24, do the Tue 23 lock first, then build the clickable skeleton.**

---

## Tue 23 Jun — Lock The Spine

Goal: stop the proposition moving and make the clickable demo brief obvious.

Status: **rolled into Wed 24 catch-up**. Do this before writing the `aie-demo` route.

Deliver:

- final 30-second pitch: **locked below**
- final 3-minute demo storyboard: **locked below**
- Tara-Lee checklist: **locked below**
- Cursor build brief for `website/src/app/aie-demo/`: **locked below**

### Final 30-Second Pitch

> "AstraJax is the adoption operating system for AI agents.
>
> Anyone can build an agent now. The hard part is getting real teams to trust it, shape it, use it, and keep improving it.
>
> AstraJax puts the people who know the work in charge. Clive helps them build the business brain, Pam challenges important decisions, the human approves what becomes true, and Doc packages the approved work for runtimes like HyperAgent.
>
> The point is simple: domain experts do not need to become technical. With AI, they can become architects."

Shortest booth opener:

> "AstraJax helps domain experts design agents people actually use."

Demo storyboard:

1. User brain: who is sitting in the chair?
2. Guide mode: Full Story, Light Story, or No Story.
3. Clive builds the business brain.
4. Pam challenges the thinking before action.
5. Human decides what becomes trusted.
6. Doc writes the approved action and leaves a paper trail.
7. Fleet package is ready for HyperAgent.
8. Scorekeeper / Coach loop shows adoption continues and the brain improves.

### Final 3-Minute Demo Storyboard

Use this as the recording and booth click-through spine.

**0:00-0:20 - Booth headline**

- Screen shows: `AstraJax helps domain experts design agents people actually use.`
- Spoken point: the market has solved "build an agent"; adoption is still unsolved.
- Visual: Clive -> Pam -> Human -> Doc -> HyperAgent.

**0:20-0:45 - User Brain**

- Screen shows a lightweight user profile: AI confidence, context confidence, commercial judgement, team leadership.
- Spoken point: AstraJax adapts to the person in the chair before asking them to shape agents.
- Demo action: select or reveal "Commercial expert, new to context systems".

**0:45-1:15 - Clive Interview**

- Screen shows Clive asking plain-language questions about the business, workflow, data, risks, and what good output looks like.
- Spoken point: Clive is the face. He reasons and drafts, but he does not write approved system truth.
- Demo action: click "Generate draft business brain".

**1:15-1:40 - Business Brain**

- Screen shows the generated brain brief: goals, source context, approval rules, agent jobs, known gaps.
- Spoken point: the boring layer is the product. Better context makes better agents.
- Demo action: click "Ask Pam before approval".

**1:40-2:05 - Pam Challenge**

- Screen shows Pam's sniff test: strongest part, weakest assumption, missing evidence, rabbit-hole risk, safe to send to Doc?
- Spoken point: AstraJax is helpful by default, sceptical before action.
- Demo action: accept Pam's correction or mark "approve with caveat".

**2:05-2:25 - Human Decision**

- Screen shows the approval moment:

```text
This is your decision. You now have context-aware, bias-checked opinions. You decide.
```

- Spoken point: AI gives points of view. The human keeps judgement.
- Demo action: click "Approve for Doc".

**2:25-2:45 - Doc Handoff**

- Screen shows Doc writing the approved action: context item, approval rule, change log, HyperAgent package draft.
- Spoken point: Doc acts only from approved briefs and leaves a paper trail.
- Demo action: click "Prepare HyperAgent package".

**2:45-3:00 - Adoption Loop**

- Screen shows the package ready, plus Scorekeeper / Coach feedback: brain maturity, next QA pass, team training progress.
- Spoken point: the system does not stop at deployment. It coaches adoption and improves the brain.
- Closing line: "This pattern comes from a real commercial operation, not a pitch deck fantasy."

### Tara-Lee Checklist

Priority visual assets:

- booth hero graphic, printable and monitor-ready: `Clive -> Pam -> Human -> Doc -> HyperAgent`
- core role badges: Reason / Challenge / Decide / Act / Execute
- Clive visual first: reasoning partner, warm, safe, face of the product
- Pam visual second: challenger, raised eyebrow, useful scepticism
- Doc visual third: action dispatcher, practical, reliable, paper trail
- restrained treatment for Full Story / Light Story / No Story
- demo-safe exports: transparent PNG or SVG where possible, plus 1920x1080 hero

Rules for the visuals:

- make roles obvious before making lore rich
- avoid children's mascot energy
- do not make every character equally loud
- do not let Court Mode become the whole booth
- keep HyperAgent visually downstream as runtime partner, not competitor

### Cursor Build Brief For `website/src/app/aie-demo/`

Objective: build a demo-quality, recordable, table-ready route that tells the full AstraJax adoption loop in a clickable sequence.

Repo context:

- App: Next 15 / React 19 in `website/`
- Existing style: Tailwind classes, app router, `@/components` imports
- Existing site components are flat under `website/src/components/`; create `website/src/components/aie-demo/` only if the demo needs grouped components

Files to create:

- `website/src/app/aie-demo/page.tsx`
- `website/src/components/aie-demo/AieDemoShell.tsx`
- `website/src/lib/aie-demo/demo-data.ts`

Screens:

1. Start / booth headline
2. User Brain
3. Guide Mode
4. Clive Interview
5. Business Brain
6. Pam Challenge
7. Human Decision
8. Doc Handoff
9. HyperAgent Package
10. Adoption Loop

Data should be seeded, not live:

- fake client: a commercial operations team with messy context and low agent trust
- user brain: strong commercial judgement, low context-environment confidence, medium AI confidence
- business brain: purpose, workflows, source context, approval rules, known gaps
- Pam output: strongest part, weakest assumption, missing evidence, rabbit-hole risk, safe to send to Doc?
- Doc output: context item draft, approval rule draft, change log entry, HyperAgent package prepared
- adoption loop: brain maturity, QA pass count, training progress, next improvement

Interaction model:

- simple local state is enough
- Next/React client component acceptable for the shell
- no backend, auth, database, billing, live Airtable, or live HyperAgent API
- every screen needs one clear next action
- include a reset / replay control for recording

Definition of done:

- route loads at `/aie-demo`
- full story is clickable from start to adoption loop
- booth headline works at a glance
- the approval moment is explicit
- Doc only acts after human approval
- HyperAgent is positioned as runtime partner
- copy is readable on a monitor
- no tiny text, no admin settings, no production-shaped rabbit holes

Stop condition: Matthew can say the flow without notes, and Cursor can build the route without asking what the screens are.

## Wed 24 Jun — Build The Chapter 1 Demo Skeleton

Goal: build a **high-functioning Chapter 1** rather than a shallow whole-platform tour.

Today's rule:

> **Chapter 1 works. The rest is credible evidence.**

The demo should go deep on:

- User Brain
- Business Brain
- QA / Pam challenge
- Human approval
- Generated approved context

Everything after that should appear as polished receipts/cards showing what Chapter 1 unlocks.

### Brain Key spine (production wiring)

Chapter 1 uses the **Brain Key** access model — not one base with Draft/Approved status fields. Spec: [`brain-key-wiring.md`](./brain-key-wiring.md).

- **Registry** — Brain metadata, Key Requests, Access Grants, Change Log
- **Workshop** — draft context, interactions, Pam reviews
- **Trusted Brain** — approved context only; one base per Brain theme with scoped credentials
- Clive/Pam can **request** the key; they are **blind** until human approval; they **never remember** the credential

API routes live in `website/src/app/api/brains/` (request, approve, retrieve, log, promote).

**Front-end build brief:** the Chapter 1 workbench that sits on these routes is specified in [`chapter1-workbench-build-plan.md`](./chapter1-workbench-build-plan.md) (Vercel Minion). It is the approved middle ground: a real governed loop in memory mode, not a static demo and not a platform.

### Today’s Output

By the end of today, Matthew should have:

- a working `/aie-demo` route
- a clickable Chapter 1 flow
- hardcoded but believable seed data
- one downstream receipts panel
- enough UI to record a rough 90-second walkthrough

### 10:30–11:00 — Set The Build Brief

Do this before opening a build agent.

Write or say the build brief:

```text
Build the AIE demo as a high-functioning Chapter 1.

The visitor should experience AstraJax building:
1. the user brain
2. the business brain
3. a QA / Pam challenge
4. a human approval moment
5. an approved context output

Everything after that should be shown as output receipts, not deep product screens.
```

Stop condition: the build agent can repeat the job back without drifting into a full platform.

### 11:00–12:30 — Scaffold The Route

Create:

- `website/src/app/aie-demo/page.tsx`
- `website/src/components/aie-demo/AieDemoShell.tsx`
- `website/src/lib/aie-demo/demo-data.ts`

Use the existing website style:

- Next.js App Router
- React 19
- Tailwind utility classes
- imports like `@/components/...`

Commands:

```bash
cd website
npm run dev
```

Definition of done:

- `/aie-demo` loads locally
- route has a clear booth headline
- there is a visible stepper or left-hand flow
- every step has a single obvious next action

### 12:30–13:00 — Lunch / First Cut

No building.

Ask:

- Does the first screen explain the business in five seconds?
- Is this clearly about adoption, not agent building?
- Does the flow start with the person, not the tool?

If not, fix the first screen before adding more screens.

### 13:00–14:30 — Build User Brain + Business Brain

Build the two core intake sections.

User Brain fields:

- AI confidence
- coding comfort
- commercial judgement
- seniority / decision authority
- system-architecture confidence
- context-environment confidence
- team leadership / change confidence

Business Brain fields:

- business goal
- crucial context
- key workflows
- data sources
- approval rules
- what good output looks like
- what agents must never do

Definition of done:

- selecting / revealing the user brain changes the tone or recommended support
- business brain output looks like structured context, not a form dump
- the demo clearly says: **AstraJax maps the human before it maps the business**

### 14:30–15:30 — Add QA Chat / Pam Challenge

Build the challenge moment.

Show:

- Clive’s constructive read
- Pam’s sceptical read
- strongest part
- weakest assumption
- missing evidence
- rabbit-hole risk
- safe to send to Doc? yes / not yet

Include the core human ownership line:

```text
This is your decision. You now have context-aware, bias-checked opinions. You decide.
```

Definition of done:

- Pam feels useful, not obstructive
- the user can adopt Pam’s correction or approve with caveat
- Doc cannot act before the human approval moment

### 15:30–16:30 — Build Approved Context Output

Build the “what becomes true” panel.

Show:

- approved business brain summary
- approved context records
- known gaps / not-yet-approved items
- brain maturity status: Seedling Brain
- confidence by domain
- next QA action

Definition of done:

- the approved output is visibly different from the draft
- the viewer can understand what changed because the human approved it
- maturity is present without becoming a full analytics product

### 16:30–17:30 — Add Downstream Receipts

Do **not** build full later chapters.

Add a receipts panel showing what Chapter 1 unlocks:

- Agent fleet proposal
- HyperAgent-ready package
- Doc action log
- Model usage plan: heavyweight reasoning vs bounded minions
- Scorekeeper / Coach adoption loop
- Brain maturity path
- Proof drawer: Butternut / DS pattern

Optional market-proof receipt from the Microsoft voice notes (internal language only, not public quote):

- agent lifecycle / governance
- context quality
- AI cost / token efficiency / model usage discipline
- adoption confidence

Definition of done:

- these feel like outputs from the context layer
- they do not look like half-built product tabs
- HyperAgent is clearly the runtime partner

### 17:30–18:15 — Rough Recording Pass

Record or rehearse a rough 90-second walkthrough.

Script:

1. “AstraJax starts with the person, not the agent.”
2. Show User Brain.
3. Show Business Brain.
4. Show Clive + Pam.
5. Show human approval.
6. Show approved context.
7. Show receipts: fleet, HyperAgent package, coaching, proof.

Watch it back once.

Cut anything that does not support:

- adoption
- user brain
- business brain
- human judgement
- HyperAgent as runtime
- proof

### 18:15–18:30 — End-Of-Day Decision

Write down:

- what is working
- what is confusing
- what must be fixed first tomorrow
- whether Thursday is polish, proof, or a missing core-flow repair

Do not end the day without a rough recording or at least a live click-through.

### Today’s Absolute Do-Not-Build List

Do not build:

- auth
- billing
- database
- real Airtable writes
- real HyperAgent API sync
- full Court Mode
- admin settings
- multi-client state
- full analytics
- a generic agent marketplace

If tempted, write it as a receipt card instead.

## Thu 25 Jun — Make The Demo Believable

Goal: make the seeded flow feel governed and real.

Add:

- one fake company / team scenario
- generated business brain card
- Pam panel: strongest part, weakest assumption, missing evidence, safe to send to Doc?
- Human decision screen with:

```text
This is your decision. You now have context-aware, bias-checked opinions. You decide.
```

- Doc action log: context item created, approval rule created, change log updated, HyperAgent package prepared

Definition of done: the demo proves governance, not just charm.

## Fri 26 Jun — Proof Day

Goal: connect the demo to the real Butternut / DS proof.

Add a proof section or drawer:

- 14 agents
- ~12-month boring layer first
- first fleet in weeks because the foundation existed
- human approval pattern
- Scorekeeper / leaderboard / coaching
- Doc Albright feedback -> fix -> approve -> ship loop
- training hub / adoption culture

Core line:

> **This is not a pitch deck fantasy. The pattern has already worked inside a real commercial operation.**

Definition of done: AstraJax cannot be dismissed as cute agent mascots.

## Sat 27 Jun — Visual Integration

Goal: integrate Tara-Lee's first assets into the demo and booth story.

Priority order:

- booth hero graphic: `Clive -> Pam -> Human -> Doc -> HyperAgent`
- Clive, Pam, Doc visuals first
- role badges: Reason / Challenge / Decide / Act / Execute
- light treatment for Full Story / Light Story / No Story

Definition of done: a passer-by can glance at the monitor and understand that the roles do different jobs.

## Sun 28 Jun — First Recording Day

Goal: record the rough version, then cut what does not serve the booth.

Record:

- one rough 3-minute Screen Studio loop
- one 90-second booth walkthrough
- one 30-second pitch video for self-review

Watch back and cut anything that does not support:

- adoption
- human judgement
- context quality
- HyperAgent as runtime partner
- founder proof

Definition of done: there is an ugly recording that proves the shape works.

## Mon 29 Jun — Polish The Booth Version

Goal: make the table version readable, repeatable, and useful while Matthew is mid-conversation.

Improve:

- first screen / hero
- click flow
- copy clarity
- monitor readability
- no tiny text
- no screens that need explanation before they make sense
- QR path to demo / site
- one-page handout content

Prepare answers to:

- What is it?
- Who is it for?
- Why not just HyperAgent?
- What is built already?
- What is demo vs production?
- How do you run an agent-first business?

Definition of done: Matthew can run the table conversation without opening extra docs.

## Tue 30 Jun — Rehearsal And Cut Day

Goal: make the spoken version natural and remove anything that competes with the headline.

Run the booth pitch at least 20 times.

Cut:

- Court Mode as headline
- too many characters
- too much model-routing explanation
- too much architecture language
- too much "platform" talk

Keep:

- domain experts become architects
- Clive reasons
- Pam challenges
- Human decides
- Doc acts
- Composer/Cursor builds what Doc proposed
- HyperAgent runs deployed agents
- adoption keeps improving

Definition of done: the spoken version is short, natural, and repeatable.

## Wed 1 Jul — Travel / Contingency Pack

Goal: assume something goes wrong and still be able to pitch.

Prepare:

- deployed demo URL
- local fallback
- screen recording fallback
- PDF/image booth hero
- one-page handout
- QR codes
- pitch notes
- top 5 stage outline, only if selected
- laptop charger, HDMI/USB-C adapter, local asset copies

Definition of done: if Wi-Fi dies, the pitch still works.

## Thu 2 Jul — AIE Day

Morning setup:

- monitor shows loop or hero screen
- laptop is ready for live click-through
- QR code is visible
- one-pager is nearby
- 30-second opener is memorised

Booth rhythm:

1. "AstraJax is the adoption operating system for AI agents."
2. "Agent builders are getting easier. Adoption is still the hard part."
3. "We put domain experts in charge: Clive reasons, Pam challenges, humans decide, Doc packages it for runtimes like HyperAgent."
4. Show 60-90 seconds of demo.
5. Close with proof: "This pattern comes from a real commercial operation, not a whiteboard."

If selected for the top 5, pitch the same story with more drama. Do not invent a new business on stage.

---

## Absolute Do-Not-Build List

Do not build:

- real auth
- billing
- multi-client onboarding
- real HyperAgent API sync
- full Court Mode
- full agent marketplace
- admin settings
- live analytics
- twenty character skins
- a "proper platform"

Sprint phrase:

> **Demo quality. Table ready. Recordable. Believable. Not production.**
