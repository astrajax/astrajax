# AstraJax — Positioning (Canonical)

**Status:** Canonical positioning. Single source of truth for messaging, website copy, decks, one-pagers, and pitches.
**Supersedes:** `astrajax_positioning.md` (29 May), `AstraJax-company-positioning.md` (22 Jun), and `docs/context/astrajax-core-positioning.md`. Those are kept in `docs/archive/` for history only.
**Companion docs:** `docs/business/architecture.md` (how the product works), `docs/business/how-we-work.md` (how the company runs), `docs/business/proof.md` (evidence locker).
**Owner:** Matthew.
**Last updated:** 23 June 2026.

---

## 1. The Short Version

**AstraJax is the adoption operating system for AI agents.**

It helps the people who know the work — not developers — design, run, and improve AI agents their teams actually use. It starts by understanding the human, then builds the business brain, turns that context into scoped agent fleets, and keeps humans in charge of what "good" means.

The belief underneath everything:

> **Domain experts do not need to become technical. With AI, they can become architects.**

The practical promise:

> **Anyone can build an agent now. AstraJax helps teams adopt them.**

Public line:

> **AstraJax. AI that actually gets used.**

---

## 2. The Problem

The market has solved agent *building*. It has not solved *adoption*.

Most AI rollouts stall after the demo. The tool works once, in a clean example, then real life arrives: messy data, unclear ownership, nervous teams, vague prompts, poor context, and no feedback loop. People stop trusting the agent, stop feeding it, and quietly go back to the old way.

Most agent tools are still built by developers, for people who think like builders. Even the better no-code platforms carry the assumptions, language, and workflows of the technical tribe that made them. Non-technical experts are told they can build, but the experience still makes them feel like guests in someone else's world.

That is the gap AstraJax is built for:

- Does the team trust the agent?
- Does the agent have the right context?
- Does anyone own the output?
- Do people keep using it after week one?
- Can managers improve the system without rebuilding it?
- Can leaders stop expensive frontier-model usage being wasted on simple work?
- Can non-technical experts shape the system without breaking it?

---

## 3. What AstraJax Is

AstraJax turns AI adoption into a guided loop:

```text
User brain -> guide -> business brain -> challenge -> human approval -> Doc dispatch -> runtime execution -> coaching -> brain improves
```

1. **Build the user brain.** Map who is in the chair: AI experience, coding comfort, commercial judgement, seniority, system-architecture confidence, context confidence, and where they need support — so the system adapts to them.
2. **Pick the guide.** Full Story, Light Story, or No Story. The theatre is configurable; the guardrails are not.
3. **Build the business brain.** Guided intake captures the business, data, goals, rules, examples, edge cases, and what "good" looks like.
4. **Challenge when it matters.** Pam stress-tests important reasoning before action. Court Mode exists for high-stakes decisions.
5. **Human decides.** The system gives points of view; the person with judgement chooses.
6. **Doc acts.** Approved briefs become records, packages, or build jobs.
7. **Runtime executes.** HyperAgent is the first runtime AstraJax services.
8. **Celebrate and coach.** Prompt confidence, QA chats, model usage habits, adoption feedback, and training progress keep people improving.
9. **The brain matures.** Human feedback improves context, raises answer authority, and can lower usage cost.

For the full architecture (agent roles, user brain, brain maturity, Doc routing), see `docs/business/architecture.md`.

### The User Brain

The first brain AstraJax builds is not the business brain. It is the **user brain**.

That means understanding the person using the system before asking them to shape agents. A senior commercial operator who is new to context environments needs a different interface from someone who already understands prompt design and system architecture. A founder with strong judgement but little coding comfort should not be treated like a beginner at everything. A technical user should not be forced through patronising explanations just because the product is friendly.

The user brain captures:

- AI usage and prompt confidence
- coding and technical comfort
- commercial judgement and forecasting confidence
- seniority and decision authority inside the team
- system-architecture comfort
- context-environment experience
- data quality and evidence confidence
- team leadership and change experience

This is not a school test. It is how the system adapts to the human before asking the human to adapt to the system.

The user brain controls:

- how Clive explains, paces, and challenges assumptions
- where Pam should be more sensitive to drift, weak evidence, or over-broad scope
- which coaching prompts the user sees
- whether the system should offer more scaffolding or move faster
- how confident the product should be that the user can approve a given class of change

The user brain is living. It can start from self-report, then improve through Clive's observations, Pam checkpoint outcomes, manager input, approval history, and the user's own corrections.

Product principle:

> **The system adapts to the human before the human adapts to the system.**

---

## 4. The Agent Split

> **Clive is the face. Pam is the raised eyebrow. Doc is the hands. Humans keep judgement.**

- **Clive** — reasoning partner. Helps the expert explain the business and shape context. Drafts; does not write canonical truth.
- **Pam Portiscue** — challenger. Stress-tests important thinking before action. Calibrated by the user brain. Does not decide.
- **The human** — judge and approver. Decides what becomes trusted context, policy, or live action.
- **Doc Albright** — action dispatcher. Routes approved briefs: direct writes, build work, or runtime packages.
- **HyperAgent** — runtime partner that executes the agents.

---

## 5. Why Citizen-As-Builder Wins

The best AI tools are shaped closest to the work. The person running the operation knows the awkward exceptions, the real incentives, the messy handoffs, and the moment an answer is quietly wrong. That judgement is usually lost when every change has to travel through a coordinator, operator, product manager, and developer before anything happens.

AstraJax collapses that loop. The domain expert can shape the context, test the agent, spot what broke, and feed the correction back while the work is still warm. That speed makes the tool better faster — and keeps people engaged, because they see their feedback understood and actioned.

Citizen-as-builder is not a democratic slogan. It is the fastest route to useful AI.

---

## 6. Humans Keep Judgement

AstraJax does not devalue the human by asking AI to decide for them. It does the opposite.

For important decisions, the system gives the expert more than one view: the constructive case, the sceptical case, the evidence, the risk, and the trade-off.

Pam is the everyday challenge pattern. She appears at action gates and risky moments: thin evidence, scope creep, strategic decisions, agent creation, deployment, or Doc handoff. Her job is not to interrupt every conversation. Her job is to keep helpful AI from becoming agreeable drift.

Court Mode is the high-stakes version. It gives role-based perspectives before judgement:

- Clive: upside, adoption value, human meaning
- Pam: weak assumptions, rabbit-hole risk, missing evidence
- Doc: action readiness, implementation cost, operational risk
- Iris: evidence quality, data confidence, measurement
- Vera: stakeholder reaction, narrative risk, human adoption risk

The Court surfaces perspectives. The human gives judgement.

Then AstraJax makes ownership explicit:

> **This is your decision. You now have context-aware, bias-checked opinions. You decide.**

The approved judgement becomes system truth. Without that approval, Clive can draft and Pam can challenge, but Doc should not act.

---

## 6A. Brain Maturity And Confidence

Brains should not all carry the same authority.

A new brain is useful, but it should be cautious. It should caveat answers, escalate often, and avoid pretending it knows more than the approved context supports. A mature brain can answer routine in-scope questions with more confidence because humans have reviewed it, corrected it, and signed off its boundaries.

Example maturity path:

```text
Seedling Brain
House-Trained Brain
Working Brain
Sharp Brain
Trusted Brain
Elder Brain
```

Maturity is earned through human review, not agent confidence.

Signals can include:

- approved context count
- QA pass count
- domain owner sign-off
- stale-context rate
- contradiction count
- answer failure rate
- user corrections
- manager approval
- confidence by domain

The important phrase is **confidence by domain**. A brain might be strong on sales operations, weak on finance, and untrusted on legal. Maturity should control answer authority inside each boundary. It should never become a blanket permission slip for the system to act without humans.

**Maturity gates context access.** At Seedling, the brain is workshop-only — drafts, intake, and review. Agents do not get user-facing “unlock” language because there is not yet approved context worth using. From Working Brain upward, an agent may ask to use **approved context for a bounded task** after human approval. That access is scoped, time-limited, and logged. The internal mechanism may be called a Brain Key in engineering docs; public and demo surfaces say **approved context**, not keys.

An Elder Brain is not a magic autonomous brain. It is a battle-tested context environment with strong human review, low contradiction, clear boundaries, and repeated successful use. It can support more confident answers and smoother workflows, but live changes, publishing, policy, money, client-facing claims, and destructive actions still require human approval.

### Brain Efficiency Credit

Better context is cheaper to run.

Mature brains need fewer retrieval calls, fewer high-cost escalations, fewer repair loops, and fewer support interventions. They should produce sharper answers with less waste.

That gives AstraJax a commercial mechanic:

> **AstraJax rewards context quality because better context makes AI cheaper, safer, and more useful.**

In production, mature brains can earn a **Brain Efficiency Credit**: a usage or overage discount tied to context quality. This should usually reduce variable usage costs, not the base platform fee. The platform fee pays for the operating layer; the credit rewards clients for improving the quality and economics of their own agent runs.

The credit should be earned, capped, reversible, and tied to quality signals. It must not reward teams for bulk-approving weak context. It rewards healthier brains, not more paperwork.

### Model Usage Economics

Better context is only one side of AI economics. The other is **model usage**.

When teams do not know what they are doing, they often use the strongest, most expensive model for every task. That feels safe, but it creates waste: frontier reasoning used for admin, formatting, simple record updates, or bounded execution work that a cheaper worker could handle.

AstraJax should be vocal about this:

> **Good AI adoption means knowing which model the job deserves.**

The pattern:

- use heavyweight reasoning for judgement, trade-offs, strategy, and context extraction
- use Pam or Court Mode when the decision needs challenge before action
- use Doc to turn approved judgement into precise instructions
- use bounded minions / implementation workers for cheap, narrow execution
- use direct tools for simple structured writes

This matters commercially. Without model discipline, AI cost spirals and leaders lose confidence. With good routing, expensive reasoning is reserved for the moments where being wrong is costly, and cheaper workers handle the heavy execution load.

This is not just margin protection for AstraJax. It is part of the client value proposition: fewer wasted tokens, clearer accountability, and a team that learns when to ask for deep reasoning versus when to deploy a minion.

---

## 7. Who We Help

Best-fit clients are commercial or operations-heavy teams that want AI their people will actually use.

**Typical buyers:** CEO / founder, COO, Managing Director, Commercial Director, Sales Director, Head of Operations, or a revenue, transformation, or innovation lead.

**Strong-fit signals:**

- the team wants AI but does not yet trust the data or workflows
- one or two operators hold too much context in their heads
- earlier AI experiments stalled after the demo
- leaders need adoption, not just another tool
- the work is high-value but coordination-heavy

---

## 8. Offers

**Platform-led, partnership-supported.**

- **Adoption OS Audit** — a diagnostic of where AI adoption is stalling: context readiness, trust gaps, workflow fit, and an adoption roadmap.
- **Brain & Fleet Sprint** — a done-with-you build of the first context brain, agent fleet, approval rules, and deployment package.
- **Partnership** — the premium tier: hands-on architecture, champion training, context design, and adoption support for teams that want to move faster.

Short version:

> **AstraJax structures adoption. Clive structures context. Agent runtimes execute the work.**

---

## 9. Relationship To HyperAgent

HyperAgent is the first runtime AstraJax services. They are the best current presentation of an agent building platform that is built for non-technical users.

> **HyperAgent makes powerful agents possible. AstraJax makes them adoptable by the teams who know the work.**

AstraJax stays tool-agnostic so the client's human-approved context brain remains portable across runtimes. Tool-agnostic means agile and portable; it is not the moat by itself. The moat is the adoption method, founder proof, context discipline, and human judgement layer.

---

## 10. Proof (Summary)

AstraJax is built from production experience, not a pitch deck. Full detail lives in `docs/business/proof.md`.

- A non-technical commercial leader, working entirely with AI on clean operational data, built a production operating layer for **Butternut Box Direct Sales** — a real commercial function with a real team and real adoption pressure.
- Roughly **12 months on the boring layer first** (data, workflows, architecture), then the build moved fast — a first agent fleet in weeks because the foundation existed.
- A characterful agent fleet used by a non-technical team, with bounded scope, human approval, and audit trails.
- External validation: Airtable **Airspace LA** keynote, Airtable **MVP** status, and **HyperAgent Founding 500**.

The most memorable adoption signal was not the tech stack. It was the agent cast — people engaged because the system felt like something they could understand, play with, and trust.

---

## 11. The Four Adoption Pillars

What teams need to adopt AI properly:

- **Trust.** Clear outputs, visible audit trails, narrow jobs — and moments of lightness. Bots people can laugh at and argue with get used.
- **Training.** If people do not know how to use a system, they do not feel value; without value, no safety; without safety, they disengage. Prompt fluency is now a management skill, not a technical one.
- **Value.** People must feel the system makes their work *better*, not just faster. Make the value visible.
- **Safety.** Manual work will shrink. People need to see where their value *moves* — toward judgement, coaching, decision-making, and creative problem-solving. The aim is not to make humans less important; it is to move them toward the work that needs them.

---

## 12. Messaging Principles

- The boring layer makes the exciting layer possible.
- Clean data first, clever agents second.
- One job per agent, one clear handoff at a time.
- Agents take the sludge; humans keep the meaning.
- Personality is not decoration; it is adoption infrastructure.
- The system supports judgement; it does not replace it.
- Not everyone needs to become technical; domain experts can become architects.
- Adoption and maintenance are features, not afterthoughts.
- Lead with the founder's zero-code-to-production story — but always pair it with **with AI, on top of clean data.**

**Tone.** Warm, specific, operationally grounded, lightly theatrical, honest about constraints, allergic to generic AI hype. The best version sounds like *a commercially serious system with a tiny sitcom living inside it.*

---

## 13. What We Are Not

- a generic AI consultancy
- a lead-generation agency
- an Airtable build shop
- a CRM implementation vendor
- a pure done-for-you automation service
- a chatbot installer
- a broad AI leadership-coaching business
- a "buy more AI tools" advisor

The point is not to install tools. The point is to build the conditions where AI gets adopted and does useful work.

---

## 14. Claim Control — Read Before Anything Goes Public

The positioning above is safe to use. Hold these boundaries on proof and public claims:

1. **Public vs. internal.** Anything Airtable has already published — the Airspace talk and recording, the official recap, the "14 agents / zero engineering background" framing, the CEO-adjacent billing, MVP status, and Founding 500 status — is fair game. Deeper internal Butternut specifics should be kept at the level the company has already sanctioned, or cleared before they appear on a public page.
2. **Verify before quoting.** Any remembered testimonials, offhand praise, or private conversations should not appear as public copy until there is a source or explicit permission.

Numbers to keep canonical for external use:

- **14 agents**
- **120-person commercial team**
- **three weeks** for the first fleet
- **~12 months** on the foundation
- **~£8.1m** channel

Founder framing:

- Pair "never handwritten a line of code" with **with AI, on top of clean data**.
- Pair "built fast" with the preceding foundation year.
- Pair "AI agents" with bounded scope, human approval, and audit trail.
- Do not present Matthew as an engineer.
- Keep personal finances and medical specifics out of shareable docs.
