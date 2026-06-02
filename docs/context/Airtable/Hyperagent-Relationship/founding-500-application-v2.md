# Hyperagent Founding 500 Application — V2

**Status:** Submission-ready working version. Supersedes `founding-500-application-drafts.md` (V1).
**Owner:** Matthew.
**Date:** 31 May 2026.
**Reference plan:** `founding-500-submission-plan.md`
**Built from:** full `docs/context/` review + live read of the AstraJax base `appYv601Oq7fKTCj0` (Context Items, Context Packs, Agent Environments, TL Onboarding) + the Airspace talk track + `AGENTS.md` canonical figures.

---

## Part A. Review Of V1 (what changed and why)

### What V1 got right

- AstraJax leads; Seeds is the second application, reframed as the human version of the same thesis.
- Bounded agents, human approval, and audit trail are the spine of the story.
- Claim-control instinct: pair "never wrote code" with "AI on top of clean data".

### What V1 under-sold (the big one)

V1 described AstraJax as a plan with Butternut proof behind it. The live base says something stronger: **AstraJax is already an agent-first company, and it runs itself on its own product.**

Evidence pulled from the base `appYv601Oq7fKTCj0` on 31 May 2026:

- A governed **context operating system** is live: five linked tables — Context Intake, Context Items, Context Packs, Agent Environments, and an append-only Change Log.
- The knowledge base is **dogfooded**: Context Items such as "AstraJax turns domain expertise into AI-ready operating systems" and "Clive is AstraJax's managed context environment" carry `Created By = Agent`, `Confirmed By Human = Matthew`, `Status = Approved`. That is the link → propose → human approves pattern applied to AstraJax's own truth.
- Four **Clive agents** are registered as Agent Environments with explicit write boundaries: Intake (captures only), Curator (proposes only), Publisher (prepares exports + Change Log), Scanner (finds candidates). Platforms span Hyperagent, Cursor, Slack, GitHub.
- A **tamper-evident audit mirror** exists outside Airtable: hash-chained Change Log entries mirrored to Git (`docs/context/audit/`).
- A **first team member** is being onboarded through a custom TL Onboarding interface (17 modules), and the human approval model already names "Matthew or TL" as approvers.
- A defined **commercial offer ladder**: Commercial OS Audit → Sprint → Clive (the product layer).

This means the honest stage of AstraJax is closer to "early usage / dogfooding" than "just an idea". V2 says that out loud, while staying within claim-control.

### What V1 was missing on evidence

- The actual cast and mechanics of the Butternut fleet (Clive Wigglesworth, Reggie, and the Trinity: Tashi links, Marlowe proposes, the human approves, Marcel executes).
- The full agentic bug-handling pipeline (Slack → Hyperagent → Cursor → ship → reporter sign-off → Doc summary) and the weekly prompt-coaching loop — both flagship "agent-first operations" proof.
- The storytelling / cast layer as a deliberate adoption strategy, which is what made the Airspace talk land.
- The real scope: nine operational systems, a role-specific interface for every persona, and an Italy variant (international portability).
- The meta-build agents (Agent Factory, Skill Forge), the adoption stack (training hub, sandbox courses, quizzes + timed prize exam, leaderboard, usage analytics), the commercial-strategy outcomes (labour-model shift, ~£180k/yr travel, ~3,000 hrs/yr), and dual-lens data governance.
- Precise canonical numbers from the talk track and `AGENTS.md`.
- The fact that there is real production code underneath the no-code claim (well over 500 TypeScript/React files across role-specific Interface Extensions on React 19 + the Airtable Blocks SDK, plus a large JavaScript automation layer).

### The build, in full (so nothing's missing)

The Butternut DS platform is a private monorepo of roughly 9,900 files — an operating system, not a base. For reference, what is actually built:

- **Nine operational systems:** activity booking, activity staffing, performance analysis, budget, telesales, recruitment, logistics, learning & development, and bot operations.
- **Role-specific interface extensions** (React + TypeScript on the Airtable Blocks SDK), one per persona — Event Coordinator, Regional Manager, salesperson, performance/leadership, DS Pay, and the Bot Fleet console — plus an **Italy variant** (different currency and schema) proving the model ports to a new market.
- **An agent fleet** of bounded specialists: the Trinity (Tashi links, Marlowe proposes, human approves, Marcel executes), Clive (in-app support), Reggie (bonuses), Vera (reporting), Juan (staffing), Iris (KPI queries), a Forecast Watchdog, and a Scorekeeper for gamified adoption.
- **Meta-build agents:** an Agent Factory that designs new agents, a Skill Forge that builds reusable skills, a Documentarian, and a memory Curator — agents that build and maintain the fleet itself.
- **A bug-handling pipeline** (Slack → Hyperagent → Cursor → ship → 48h reporter sign-off → Doc summary) and **weekly prompt coaching**.
- **Adoption infrastructure:** a public DS operating-system training map; role-specific video courses with hands-on sandbox copies of the live bases; a quiz bank with a timed, prize-backed final exam; a points / XP leaderboard; and a live training-analytics webhook — an onboarding package built to make a new manager safe and confident within a week.
- **Data governance:** dual-lens Operational vs Reporting numbers that never blend, disciplined SPS / CPA / retention / shift-fulfilment definitions, and forecast period locks.

The breadth is the point: the agents only became useful because the boring layer underneath was this thorough.

### Net change in V2

- Reposition AstraJax as a live agent-first company that dogfoods Clive.
- Add the context-OS proof and the Butternut fleet mechanics.
- Add the agentic bug-handling pipeline and weekly prompt coaching as flagship agent-first proof.
- Add a measured dose of storytelling (the cast as adoption infrastructure) — a genuine edge that landed in LA, kept deliberately light.
- Tighten every number to canonical figures.
- Keep Seeds strong, aligned to the same method language.
- Capture the full build inventory so nothing Matthew shipped is under-represented.
- Reference the live site as primary, viewable proof — astrajax.com (incl. the public Ask Clive agent and agent-fleet video), `/journey`, and `/seeds-of-promise`.
- Add a concrete evidence/attachment plan that matches assets that actually exist.

---

## Part B. Application 1 — AstraJax

### Fixed Form Fields

- **Full name:** Matthew Hopkinson
- **Email:** matthew@astrajax.com
- **Your title:** Founder
- **LinkedIn URL:** https://www.linkedin.com/in/matthew-hopkinson-274b5a16a/
- **Company or project name:** AstraJax
- **Company website:** https://astrajax.com *(live — home, plus `/journey` and `/seeds-of-promise`)*
- **Company stage:** Launched, early usage
- **Industry / sector:** Services (agency, consulting, professional)
- **Team size:** 2-5
- **Which best describes you?:** Building a new agent-first company
- **Agent platforms used heavily:** Cursor; ChatGPT / OpenAI; Other → Hyperagent, Omni, Airtable AI

### Q1 — What have you built with agents in the last 6 months?

I have built two things: an agent fleet inside a real commercial operation, and an agent-first company that now runs on its own product.

At Butternut Box I built the operating layer for a ~120-person field-sales operation: nine connected Airtable systems (booking, staffing, performance, budget, telesales, recruitment, logistics, L&D, bot ops), a role-specific interface for each persona so people see only what their role needs, and an Italy variant that proves the model ports to a new market and currency. On that clean foundation sits a fleet of bounded agents — clean data, clear handoffs, human approval, audit trail, never a chatbot bolted onto a process. Examples in production:

- The "Trinity": an organiser email arrives, Airtable AI classifies and extracts it, one agent links it to the right activation, another proposes field updates, a human accepts or declines, and a final agent executes the change and writes the audit trail. Each agent has one job; the human keeps judgement.
- Clive, an in-interface agent that teaches the team how to use the system and explains the "why", so people self-serve next time.
- Reggie, who runs a fiddly ad-hoc sales-bonus process end to end: reads the rules and shift data, determines winners, explains near-misses, and creates the bonus records for human sign-off.
- A weekly agent-health report that surfaced the fleet's own behaviour (the moment I realised the agents had developed office politics).
- Meta-build agents that build the fleet itself: an Agent Factory that designs new agents, and a Skill Forge that turns repeated needs into reusable, versioned skills.

The characters are deliberate — Clive is a needy Victorian gentleman, Marcel a snobbish sommelier who only ever executes approved changes — because personality is adoption infrastructure, not decoration. Once the team started mocking and playing with the agents (a debugging bot once posted a public apology in Slack for Clive's behaviour), they learned to use them far faster. I backed that with real adoption infrastructure — a training hub with role-specific video courses, hands-on sandbox copies of the live bases, a quiz bank with a timed, prize-backed exam and a points leaderboard, and live usage analytics — built to get a new manager safe and confident within a week, and to show me who was actually learning so I could coach from evidence, not vibes.

In the last stretch I started AstraJax and built its operating system the same way. AstraJax runs on a live governed context environment in Airtable: Context Intake → Context Items → Context Packs → Agent Environments → an append-only, hash-chained Change Log. A fleet of Clive agents maintains it — Intake captures messy submissions, Curator proposes canonical context, Publisher prepares versioned exports, Scanner finds stale or conflicting context — and nothing becomes canonical until I approve it. The result is that AstraJax's own source of truth is agent-proposed and human-approved, with a tamper-evident log mirrored to Git. You can test a slice of this live: the "Ask Clive" panel on astrajax.com is a governed agent that answers only from that approved context — the product, running in public.

Two newer pieces push the pattern into operations and adoption. The first is a feedback-to-code pipeline running across Slack, Airtable, Hyperagent and Cursor: a teammate reports something in Slack, an intake agent captures it, a fixer agent clusters related reports and drafts a fix with verified repo evidence, I approve, a Cursor cloud agent implements it and opens a pull request, I ship, the original reporters sign off within 48 hours, and Doc Albright sends a weekly summary to leadership. Bounded agents, clear handoffs, a human gate before any code and before anything is marked done, audit throughout. The second is weekly prompt coaching: Doc reviews how each person prompted the fleet — not what they asked, but how — and sends graded, personalised coaching with a concrete before/after rewrite, tiered by how much each person actually engages. Prompt fluency is now a management skill, and building that coaching loop is what makes adoption stick instead of stall.

I should be precise about the no-code claim: I have never hand-written a line of code. But "no-code" does not mean "no code" — underneath sits real production software — well over 500 TypeScript/React files across role-specific Interface Extensions (React 19, Airtable Blocks SDK) and a large JavaScript automation layer — built with AI on top of clean operational data and a year of system-architecture work.

### Q2 — Show us what you've been working on (attachments)

See Part E for the full asset list. The strongest evidence is live and needs no download — point reviewers to the site first:

- **astrajax.com** — the live product: a governed **"Ask Clive" agent** reviewers can question directly, the production **agent-fleet video** ("the product is the proof"), and **astrajax.com/journey**, the three-act build story (actor → architect).
- Airspace LA talk recording (or 60–90s cut) and the Airtable sit-down interview edit, if approved.
- Short screen captures of: the Trinity accept/decline step; Clive answering in-interface; the AstraJax context base (Context Items showing Agent-proposed / Matthew-approved); the bug-handling flow end to end; a redacted prompt-coaching DM; Doc Albright's weekly report; the Hyperagent Command Center fleet view.
- A one-page system map: Airtable data backbone → Hyperagent / Clive agents → human approval → Cursor or operational action → Git-mirrored audit log.

No confidential Butternut records — use redacted/illustrative views.

### Q3 — Walk us through what you're showing

The attachments show one pattern at three altitudes.

The backbone: a year of unglamorous data and workflow work that turned Gmail, WhatsApp, Notion and Google Sheets into a real operating system. Nothing clever happens without it; agents on messy data are just confident chaos machines.

The fleet: bounded agents doing specific jobs inside that system — linking organiser emails, proposing field updates, running bonus logic, teaching the team, reporting on the fleet's own health. The point isn't that any one agent is impressive; it's that each sits inside a workflow with context, permissions, an approval point, and a paper trail.

The company: AstraJax now runs on the same idea. Its knowledge base is maintained by Clive agents that propose and never self-approve; a hash-chained Change Log mirrored to Git makes every approved change tamper-evident. The newest piece, Doc Albright, lets a non-technical operator own the ongoing improvement loop — feedback in, triaged and enriched by agents, approved by a human, implemented by Cursor, reported back to the team.

### Q4 — What does agent-first look like for AstraJax in the next 6 months?

Agent-first commercial teams won't be the ones with the most chatbots. They'll be the ones whose messy operating work has been rebuilt so agents can act inside it safely. AstraJax sells exactly that. I go full-time on it from October — I leave Butternut Box at the end of September — so the next six months are the real build, not a side project.

In six months I want to turn the Butternut pattern and the Clive context OS into a repeatable product and delivery model:

- **Commercial OS Audit → Sprint → Clive.** Diagnose the workflows and context debt blocking useful AI; rebuild the boring layer; then stand up bounded agents for real jobs.
- **Clive as the productised context layer**: intake, review queue, source tracking, conflict detection, context-health scanning, and an agent-readable, human-approved operating memory with a versioned audit trail.
- **Narrow agent workflows** for commercial teams: feedback triage, reporting, staffing support, field/customer insight capture, training support, weekly prompt coaching, and the feedback-to-code improvement loop.
- **Humans keep judgement; agents take the sludge** — classification, enrichment, drafting, routing, follow-up — with approval gates and audit everywhere.
- **Proof it ports:** the method already crossed markets inside Butternut (a UK system and an Italy variant); AstraJax is the step from crossing markets to crossing companies.

What competitors miss: the agent is not the product. The system around the agent — clean context, human approval, adoption design, audit trail — is what turns demos into durable leverage. I know this because I have already watched agents fail on messy data and succeed on clean data, in a real P&L.

### Q5 — Why you're the right person to build this

I'm a non-technical commercial operator who has shipped production software entirely with AI, on top of clean operational data — and I have the external proof to back it.

- **Operator proof:** I led and rebuilt a real commercial operation at Butternut Box — ~£8.1m of channel spend across three P&Ls, ~1,500 activations a year, ~120 people — and lived inside the operational mess that makes or breaks AI usefulness.
- **Commercial impact:** the platform turned operational data into strategy — it helped surface that employed reps outperformed at higher-quality activations (underpinning a major labour-model shift), saved ~£180k a year in travel, and freed ~3,000 hours a year of capacity at scale. Clean data didn't just cut admin; it changed decisions.
- **Builder proof:** I built the foundation first (about 12 months of data and workflow work), then a first agent fleet in roughly two weeks. The speed was only possible because the boring layer already existed.
- **Dogfooding proof:** AstraJax already runs on its own product — a governed, agent-maintained, human-approved context operating system with a tamper-evident audit log.
- **External validation:** Airtable and Hyperagent found this through a LinkedIn post, brought me into their ecosystem, and flew me to Airspace LA as a headline speaker on what a Hyperagent power user looks like in the wild. The session was described as one of the moments people kept referencing all day, and I'm now an Airtable MVP in the Hyperagent beta orbit.
- **Adoption edge:** my first career was as an actor (trained at RADA), and I use that craft on purpose. The fleet is delivered as a cast and the flagship as a three-act story — because in a real team, personality and narrative are how you get people to trust and actually use AI. It's the part most technical teams underrate, and a big reason my systems get used, not just shipped.

AstraJax is the company version of that proof: helping commercial teams turn domain expertise, messy workflows and scattered data into AI-ready operating systems — with humans still owning the judgement.

---

## Part C. Application 2 — Seeds Of Promise x AstraJax

*Submit strategy: confirmed as a standalone second application (its own submission), framed as the human version of the same thesis. The live `astrajax.com/seeds-of-promise` page backs it.*

### Fixed Form Fields

- **Full name:** Matthew Hopkinson
- **Email:** matthew@astrajax.com
- **Your title:** Founder, AstraJax
- **LinkedIn URL:** https://www.linkedin.com/in/matthew-hopkinson-274b5a16a/
- **Company or project name:** Seeds of Promise x AstraJax
- **Company website:** https://astrajax.com/seeds-of-promise *(live)*
- **Company stage:** Building, not launched
- **Industry / sector:** Nonprofit / government *(speak to Education in the answers)*
- **Team size:** 2-5
- **Which best describes you?:** Building a new agent-first company
- **Agent platforms used heavily:** Cursor; ChatGPT / OpenAI; Other → Hyperagent, Omni, Airtable AI

### Q1 — What have you built with agents in the last 6 months?

The production agent work that qualifies me sits in AstraJax and Butternut: bounded agent workflows on clean Airtable data, with human approval and audit trails, plus a dogfooded context operating system maintained by a fleet of Clive agents. That work led Airtable and Hyperagent to put me on the Airspace LA stage.

Seeds of Promise x AstraJax applies the same method where the missing foundation is different. In a commercial team the foundation is clean data and workflows. At Seeds of Promise it is power, connectivity, devices, local champions, community trust, and a real understanding of language, culture, and economic reality. I have already visited Seeds of Promise in Malawi, built trust with the community and with Sam at Links, delivered introductory AI coaching, and confirmed strong appetite. They already have ambition, leadership, and a version of a computer centre. What they lack is the foundation that turns access into agency — and then narrow, context-aware agents on top.

### Q2 — Show us what you've been working on (attachments)

For Seeds, the link *is* the application — everything below already exists and is public. No new assets need to be made.

- **astrajax.com/seeds-of-promise** *(primary, link-only)* — the live pilot page: the three-layer model (access → context → agents), the Malawi visit photos, and the Links / Sam route in.

Optional extras (only if you want files attached — none are required):

- One exported diagram — the three-layer model map (Section B2 of the Q2 attachment pack: infrastructure → context → narrow agents → community use). Export to PNG only if a reviewer wants a download.
- One Malawi photo, if Links / Sam are happy to share it outside the site (the page images live in `website/public/seeds-of-promise/`).

Avoid "AI for Africa" framing; show a specific community, a real relationship, and concrete agent use cases. Do **not** claim mockups, sample prompts, or shared coaching materials — those don't exist yet.

### Q3 — Walk us through what you're showing

This is a model for context-aware education and specialist support.

Access first: connectivity, power, devices, a usable computer centre, and local ownership — the physical, social version of the boring layer.

Context next: local language, goals, constraints, resources, cultural reference points, and the real jobs people are doing. Generic coaching does not travel unless it is adapted to the people using it.

Then the agents: narrow helpers for learning, farming and greenhouse planning, fundraising, small enterprise, and community leadership. Greenhouse advice that currently means travelling hours for word-of-mouth could become a coaching agent grounded in local resources. A fundraising agent could take an idea written in Chichewa and shape it into a donor-ready proposal in English. The aim is not to make leaders technical; it is to bring the specialist closer, fitted to the context.

### Q4 — What does agent-first look like for Seeds of Promise in the next 6 months?

Agent-first here does not mean dropping a chatbot into a low-connectivity environment. It means building the foundation, then shaping education, coaching, and specialist guidance around the community's real language, goals, and constraints.

- Confirm connectivity and power requirements; identify minimum equipment and a local ownership model.
- Train local champions; capture priority needs and language context.
- Build a first agent toolkit for context-aware education, farming, fundraising, enterprise, and leadership.
- Test on practical jobs: learning support, greenhouse planning, proposal writing, business planning, meeting prep.
- Document the playbook so the model can be tested with other Links-connected communities.

The thing others miss: useful AI here starts before the AI. The product is contextual access to education and specialist support, not a chatbot.

### Q5 — Why you're the right person to build this

I sit at the crossover of commercial operations, agent-first system building, and a real relationship with this community. I have proved the method commercially and been recruited onto Airtable's flagship stage for it. And I have felt the specific gap first-hand: I tried to give Seeds business coaching and found their context so different that packaging my advice well was genuinely hard. That is exactly what context-aware agents can close — repackaging outside expertise into a form that fits the people, the language, and the decisions in front of them.

---

## Part D. Follow-up Email V2

**Subject:** AstraJax, the Founding 500, and the next chapter after Airspace

Hi Andrew, Austin and Victoria,

This is the first proper note since the Airspace thank-you, and it comes with news I hope makes that whole experience feel even more worth it: I'm leaving Butternut Box at the end of September to start my own company, AstraJax.

The simplest version: AstraJax helps commercial teams turn messy workflows, scattered data and domain expertise into AI-ready operating systems, with humans still owning the judgement. My conviction is that the models stopped being the hard part a while ago — what decides whether AI is actually useful inside a team is the context it works from (where information came from, what's approved, what people actually mean) and whether people trust it enough to use it. Both are human problems, and both only get *more* important as the tools improve and churn. So you don't bet a business on any single tool; you bet it on clean, governed context and a team coached to keep adapting.

That makes this as much a storytelling and culture discipline as a technical one — the actor years turn out to be weirdly useful — and it's exactly the kind of tooling I'd like AstraJax to build, ideally platform-agnostic. The real shift is domain experts becoming the architects of their own systems, not just the people handing requirements to developers.

Clive is the first product expression of it — and rather than describe it, I'll just show you: **astrajax.com** has an "Ask Clive" panel you can interrogate directly (it only answers from human-approved context), alongside the agent fleet and the build story.

Airspace was a huge part of making that feel real. Andrew, the invite gave me real confidence in what I'd been building. Austin, you helped me put language to a conviction I'd been doggedly running with for a year. Victoria, your original outreach started the whole thing.

I've put AstraJax forward for the Founding 500 — it felt like the right first formal step, because the thesis lines up so closely: the companies that win won't just add AI features, they'll rebuild the work so agents can operate inside it safely. I'm also putting forward a second, more human application — Seeds of Promise x AstraJax — applying the same method to a community in Malawi I've visited and coached, with scope to reach other Links-connected communities across East Africa (links.charity).

Speaking at Airspace — after Howie, before Warner Bros — still feels faintly ridiculous, in the best possible way. Thanks for the opportunity and the inspiration.

Matthew

---

## Part E. Evidence / Attachment Plan

| Asset | Shows | Source | Safe to share? |
|---|---|---|---|
| **astrajax.com** (home) | Live product: positioning, Clive, method, offers, canonical numbers | Live site | Yes (public) |
| **astrajax.com** — Ask Clive panel | Governed agent answering only from approved context (dogfooding, in public) | Live site (`/api/ask-clive`) | Yes (public) |
| **astrajax.com** — agent-fleet video | Production fleet, "the product is the proof" | Live site | Yes (public) |
| **astrajax.com/journey** | Three-act build story (actor → architect) with talk beats | Live site | Yes (public) |
| **astrajax.com/seeds-of-promise** | Seeds pilot: access → context → agents, Links route | Live site | Yes (public) |
| Airspace LA talk (full or 60–90s cut) | External validation + narrative | YouTube recording | Yes (public) |
| Airtable sit-down interview edit | Third-party endorsement | Google Drive edit | Confirm with Austin first |
| Trinity accept/decline screen capture | Human-approval pattern | DS platform (redacted) | Use illustrative view |
| Clive in-interface answer | Adoption + context layer | DS platform (redacted) | Use illustrative view |
| AstraJax Context base view | Agent-proposed / human-approved truth | Base `appYv601Oq7fKTCj0` | Yes (own data) |
| Doc Albright weekly report | Feedback-to-code loop | Slack / Hyperagent | Redact team names |
| Bug-handling flow diagram | Agent-first ops pipeline (Slack→Hyperagent→Cursor→ship→sign-off) | ds-platform doc (mermaid) | Yes |
| Prompt coaching DM (redacted) | Adoption / prompt-fluency loop | Bot Ops / Slack | Redact names |
| Agent cast lineup | Personality as adoption infrastructure | Airspace deck | Yes (public) |
| DS operating-system training map | Public adoption hub (videos, sandboxes) | GitHub Pages | Yes (public) |
| Training hub: courses, quizzes, timed exam, leaderboard | Gamified adoption + one-week onboarding | GitHub Pages / Bot Ops | Redact names |
| Performance dashboard (dual-lens) | Data-governance rigour (Operational vs Reporting) | DS platform (redacted) | Use illustrative view |
| Interface suite + Italy variant | Role-specific OS + international portability | DS platform (redacted) | Use illustrative view |
| Hyperagent Command Center | Fleet ops, cost, schedules | Hyperagent workspace | Yes (own workspace) |
| System map one-pager | The whole pattern in one image | To be made | Yes |
| Seeds plan + Malawi visit photos | Real relationship + pilot | Seeds plan / personal | Permission the photos |

---

## Part F. Open Questions Before Submission

1. **Email:** resolved — matthew@astrajax.com on both applications.
2. **LinkedIn:** resolved — https://www.linkedin.com/in/matthew-hopkinson-274b5a16a/
3. **Website:** resolved — `astrajax.com` is live and strong (home, `/journey`, `/seeds-of-promise`, and a working Ask Clive agent). Both website fields now point to it.
4. **AstraJax stage:** resolved — Launched, early usage.
5. **Team size:** resolved — 2-5 (both applications).
6. **Attachments:** which redacted Butternut captures are you comfortable sharing?
7. **Seeds:** resolved — submit as a standalone second application.
8. **Platforms checkbox:** resolved — tick Cursor + ChatGPT / OpenAI + Other (Hyperagent, Omni, Airtable AI); not Claude Code.
