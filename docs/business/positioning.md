# AstraJax — Positioning (Canonical)

**Status:** Canonical positioning. Single source of truth for messaging, website copy, decks, one-pagers, and pitches.
**Supersedes:** `astrajax_positioning.md` (29 May), `AstraJax-company-positioning.md` (22 Jun), and `docs/context/astrajax-core-positioning.md`. Those are kept in `docs/archive/` for history only.
**Companion docs:** `docs/business/architecture.md` (how the product works), `docs/business/how-we-work.md` (how the company runs), `docs/business/proof.md` (evidence locker).
**Owner:** Matthew.
**Last updated:** 23 June 2026.

---

## 1. The Short Version

**AstraJax is the adoption operating system for AI agents.**

It helps the people who know the work — not developers — design, run, and improve AI agents their teams actually use. It starts with curated context, turns that context into scoped agent fleets, and keeps humans in charge of what "good" means.

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
- Can non-technical experts shape the system without breaking it?

---

## 3. What AstraJax Is

AstraJax turns AI adoption into a guided loop:

```text
User brain -> guide -> business brain -> challenge -> human approval -> Doc dispatch -> runtime execution -> coaching -> brain improves
```

1. **Build the user brain.** Map who is in the chair: their experience with AI, context, architecture, commercial judgement — so the system adapts to them.
2. **Pick the guide.** Full Story, Light Story, or No Story. The theatre is configurable; the guardrails are not.
3. **Build the business brain.** Guided intake captures the business, data, goals, rules, examples, edge cases, and what "good" looks like.
4. **Challenge when it matters.** A sceptical layer stress-tests important reasoning before action.
5. **Human decides.** The system gives points of view; the person with judgement chooses.
6. **Doc acts.** Approved briefs become records, packages, or build jobs.
7. **Runtime executes.** HyperAgent is the first runtime AstraJax services.
8. **Celebrate and coach.** Adoption feedback keeps people improving.
9. **The brain learns.** Human feedback improves context, and better context lowers cost.

For the full architecture (agent roles, user brain, brain maturity, Doc routing), see `docs/business/architecture.md`.

---

## 4. The Agent Split

> **Clive is the face. Pam is the raised eyebrow. Doc is the hands. Humans keep judgement.**

- **Clive** — reasoning partner. Helps the expert explain the business and shape context. Drafts; does not write canonical truth.
- **Pam Portiscue** — challenger. Stress-tests important thinking before action. Does not decide.
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

For important decisions, the system gives the expert more than one view: the helpful case, the sceptical case, the evidence, the risk, and the trade-off. Then it makes ownership explicit:

> **This is your decision. You now have context-aware, bias-checked opinions. You decide.**

For high-stakes calls, users can escalate into **Court Mode**: a structured multi-agent review where different roles give their takes, the trade-offs are displayed, and the human chooses the judgement to adopt. The Court surfaces perspectives. The human decides.

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

HyperAgent is the first runtime AstraJax services, and a partner — not a competitor.

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

The positioning above is safe to use. Two boundaries to hold on the *proof*, because the underlying material is still partly internal:

1. **Public vs. internal.** Anything Airtable has already published — the Airspace talk and recording, the official recap, the "14 agents / zero engineering background" framing, the CEO-adjacent billing, MVP and Founding 500 status — is fair game. Deeper internal Butternut specifics (precise financials, granular operational volumes, and especially the labour-model strategy around employed vs. self-employed salespeople) should be kept at the level the company has already sanctioned, or cleared before they appear on a public page.
2. **Verify before quoting.** Two lines that circulate in notes — that a planned 30-minute podcast was extended to 60 minutes on the day, and a "most impressive solo build I've ever seen" testimonial — are not yet sourced. Treat them as recollection until a source exists; do not put them in copy.

**Numbers to keep canonical for external use:** 14 agents, 120-person commercial team, three weeks, ~12 months on the foundation, ~£8.1m channel. Pick these and stay consistent — earlier drafts have drifted (11 days / two weeks / three weeks; twelve / fourteen agents).

**Founder framing:** Pair "never written a line of code" with "with AI, on top of clean data." Pair "built fast" with the preceding foundation year. Pair "AI agents" with bounded scope, human approval, and audit trail. Do not present Matthew as an engineer. Keep personal finances and medical specifics out of any shareable doc.
