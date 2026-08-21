# Chapter 1 — Canonical Context Structure

**Status:** Working spec (Pam-revised, 29 Jun 2026)  
**Owner:** Matthew  
**Purpose:** Define the canonical structure every operator and business brain fits into — operator identity, brain themes, universal categories, progressive disclosure, and governance surfaces.  
**Use with:** [`architecture.md`](../business/architecture.md) §5 Step 0–2 and §7, [`brain-key-schema.md`](./brain-key-schema.md), [`brain-key-wiring.md`](./brain-key-wiring.md)

**Decision (29 Jun 2026):** Chapter 1 onboarding and brain curation use **templates, not cages**. Brains are **domains** (Sales, Product, Core…). Categories are **kinds of context inside every brain**. Onboarding extracts the **skeleton** (L0–L1), not the full brain. Each confirmed brain theme gets its own Trusted Brain base; scope areas remain the grant and retrieval keys inside that brain.

**Influence only (not canonical truth):** [Agent Skills for Context Engineering](https://github.com/muratcankoylan/agent-skills-for-context-engineering) — progressive disclosure, memory layers, context partitioning, harness surfaces. See §8.

---

## 1. The problem this solves

Chapter 1 currently mixes three jobs in one fuzzy object:

| Job | What it should answer | Today |
|-----|----------------------|-------|
| **Who is the operator?** | Founder or function leader; what they own | Partially in Workshop User Brains (`Role Domain` free text) |
| **How should Clive/Pam adapt?** | Competency and confidence | User brain competency scores (good) |
| **Where does business truth live?** | Every fact has one home | Ad hoc categories + two demo scopes (`positioning`, `governance`) |

Without a canonical coordinate system — **(Brain theme, Category)** — Clive interviews stay generic, retrieval scoping stays arbitrary, and Pam cannot tell when context is filed with false confidence.

---

## 2. Three context objects (do not conflate)

```text
Operator Profile     → WHO sits in the chair (identity)     → drives brain set
Operator Competency  → HOW Clive/Pam adapt (calibration)    → pace and challenge
Business Brain       → WHAT the organisation knows (truth)  → Workshop → Trusted
```

### 2.1 Operator Profile (identity)

Captured at onboarding. Drives which brain themes apply.

| Field | Values | Notes |
|-------|--------|-------|
| **Archetype** | Founder · Function Leader | Exactly one |
| **Primary function** | Sales · Marketing · Product · Operations · Finance · Customer Success · People · Other | Required when Function Leader; optional note when Founder wears multiple hats |
| **One-line remit** | Free text | What they own in plain language — not a job description essay |
| **Guide mode** | Full Story · Light Story · No Story | Existing field |

**Pam rule:** do not force a single function when the remit is genuinely hybrid (founder/operator). Let the user **confirm and prune** the template brain set rather than mis-file.

### 2.2 Operator Competency (calibration)

Unchanged from `architecture.md` §5 Step 0. Scores such as **new / comfortable / expert / prefer not to say** across AI, context environments, architecture, coding, commercial, data, leadership, and domain-specific work.

Controls Clive pace and Pam contextual sensitivity — **not** which brains exist.

### 2.3 Business Brain (truth)

Structured content inside **brain themes**, each record tagged with exactly one **category**. Lives in Workshop (draft) until human-approved promote to Trusted.

### 2.4 Operator Development (coaching)

Personal development context that drives **coaching** (Clive tone, Coach Whit tips, adoption support) — **not** business truth agents retrieve for operational answers. **Three fields are required at onboarding (Step 0C):** strengths, weaknesses, and learning style preference. Psychometric reference and the rest are optional.

| Field | Purpose | Notes |
|-------|---------|-------|
| **Strengths** | What they lean on — with brief evidence if possible | **Required at onboarding (Step 0C).** Self-reported default; manager may add with consent |
| **Weaknesses** | Where they know they struggle or want support | **Required at onboarding (Step 0C).** Standing gaps — not the same as active growth focus (see Development focus) |
| **Learning style preference** | Pace, tone, teach-as-you-go, how they learn best | **Required at onboarding (Step 0C).** Stored in **Coaching Preferences** on User Brains; feeds Clive/Coach Whit, not fleet agents |
| **Psychometric reference** | Link, note, or upload (Insights, MBTI, colour profile, etc.) | **Optional.** Reference only — not canonical personality truth or clinical diagnosis |
| **Development focus** | 1–2 **active** growth areas right now | **Optional.** Time-bound priorities — may overlap a weakness but is not a duplicate field; use for “what we're working on this quarter” |
| **Development notes** | Free text | **Optional.** Hybrid remit, extra context Coach Whit needs |

#### Why we ask

We ask so Clive can calibrate **pace, tone, and teaching style** — not to judge the operator. This is coaching context, not a scorecard.

- **Strengths and weaknesses** help Clive avoid talking past someone or over-explaining. Pam uses them for **coaching sensitivity** (when to challenge gently vs directly) — not performance review, hiring, ranking, or surveillance.
- **Learning style preference** is how they want to be taught in the product. Guide mode (Full / Light / No Story) is the theatrical layer; this is the **development and coaching layer** — teach-as-you-go, depth, pace.
- **Workshop User Brains only.** Never Trusted Brain Truth. Operational fleet agents do not load this unless scoped to a coaching persona.

Same principle as `architecture.md` Rule 8: **enablement, not surveillance**. The system adapts to the human before the human adapts to the system. Nobody gets graded on their self-assessment. Function Leaders may have **manager-set coaching flags** (read-only where appropriate), same family as Coach Whit engagement signals — adoption support, not staff monitoring.

#### If this feels sensitive

Some people find naming weaknesses or doing self-assessment uncomfortable. We say that out loud on purpose.

Step 0C requires strengths, weaknesses, and learning style preference — but the bar is **honest enough to be useful**, not exhaustive or clinical. Brief bullets are fine. No therapy-depth answers expected. The operator can revisit and update any time in Workshop.

Psychometric reference is **optional** — no pressure to share colour profiles, MBTI, Insights, or similar.

Pam treats unevidenced strengths and weaknesses as **soft claims**, not facts.

**Do not:** treat psychometrics as clinical diagnosis or canonical personality truth; mix development data into Business Context; use psychometric labels to stereotype responses (“as an INFP you…”); collect career ambition or aspirations in this block (removed from scope).

---

## 3. Brain themes (templates, not cages)

A **brain theme** is a domain the operator owns — not a kind of content. Workflows, metrics, and rules for Sales live **inside** the Sales brain, not in a cross-cutting "Workflow brain."

### 3.1 Core Brain (always one)

Every operator gets exactly one Core Brain. Scope prefix: `read:brain-truth:core-*` (scope areas below).

| Logical area | Typical content |
|--------------|-----------------|
| **identity** | Mission, what we do, for whom |
| **principles** | Operating principles, non-negotiables |
| **governance** | Approval rules, Trinity, who decides |
| **people** | Key roles, ownership, escalation |
| **glossary** | Terms the team uses one way |
| **direction** | Long-term goals and priorities (see §4.1 Goals & Priorities) |

Chapter 1 AstraJax demo maps legacy scopes `positioning` and `governance` here until migration completes (§7).

### 3.2 Archetype overlays on Core (Function Leader only)

**Founder** builds wider business understanding across **owned domain brains** (Customers & Market, Product, GTM, etc.). Do not duplicate that with a separate “whole company” layer in Core — founders curate depth in the brains they own.

**Function Leader** owns one function deeply but must operate inside a wider company. They get two **Core-only overlays** — loose, read-oriented context they do not own:

| Overlay | Scope slug | What it holds | What it is not |
|---------|------------|---------------|----------------|
| **Business context** | `core-business-context` | How the company works at a high level: model, customers, revenue motion, org shape — enough to make good local decisions | Deep expertise in other functions; that stays in those teams’ brains |
| **Adjacent functions** | `core-adjacent-functions` | Other functions that matter to this role; rough remit of each; handoffs, dependencies, escalation, known friction | Owning Marketing’s workflow or Product’s roadmap in detail |

Clive **only prompts** for these overlays when `Archetype = Function Leader`. Records still use universal categories (§4.1): **Business Context** and **Adjacent Functions** categories are populated primarily here; Founder onboarding skips them.

**Pam rule:** adjacent-function notes are **loosely held** — label uncertainty in Open Questions when the user is guessing how another team works.

**Example L0 — Head of Sales (Function Leader):**

```text
Core · Goals (Long-term):  Become the predictable new-business engine for UK expansion
Core · Goals (Active):      Q3 — hit new-logo target without breaking discount guardrails
Core · Business Context:    Subscription pet food; UK + IE; mix of field and inside sales
Core · Adjacent Functions:  Marketing → leads/events; Product → roadmap asks;
                            Finance → forecast lock; CS → post-sale handoff
Sales · New Business · Definition:  …
```

### 3.3 Domain brains (archetype templates)

User **confirms, prunes, or renames** — never locked to a rigid count.

**Founder template**

| Brain theme | Scope area slug | One-line purpose |
|-------------|-----------------|------------------|
| Customers & Market | `customers-market` | Who we serve and why they buy |
| Product | `product` | What we build and prioritise |
| Go-to-Market | `go-to-market` | How we reach and win customers |
| Delivery & Operations | `delivery-ops` | How work gets done day to day |
| Money & Runway | `money-runway` | Revenue, cost, runway, unit economics |

**Function Leader — Sales template** (first function template; Butternut proof alignment)

| Brain theme | Scope area slug | One-line purpose |
|-------------|-----------------|------------------|
| New Business | `sales-new-business` | Pipeline, prospecting, first meetings |
| Accounts & Renewals | `sales-accounts` | Existing customers, retention, expansion |
| Sales Ops & Enablement | `sales-ops` | Tools, playbooks, handoffs, CRM hygiene |
| Forecasting & Targets | `sales-forecasting` | Targets, forecast rhythm, variance rules |

**Other functions** (Marketing, Product, Operations, …): same pattern — author templates when a client vertical needs them; do not pre-build all seven in Airtable on day one.

### 3.4 Trusted Brain base model

| Layer | Canonical model |
|-------|-----------------|
| **Brain theme** | A confirmed domain such as Core, New Business, Product, or Money & Runway gets its own Trusted Brain base |
| **Scope area** | `read:brain-truth:<area>` remains the grant and retrieval key inside the relevant Trusted Brain |
| **Category** | Universal content type inside that brain, e.g. Definition, Workflow, Rules & Guardrails, Open Questions |

Default for Chapter 1 and new clients: **one Trusted Brain per confirmed theme**. Keep onboarding light by confirming and pruning the brain set before creating domain depth; do not collapse separate themes into one shared Trusted base.

---

## 4. Universal categories (inside every brain)

Every piece of business context tags **exactly one** category. The coordinate for any fact is:

```text
(Brain theme, Category)
```

### 4.1 Category set (canonical)

| Category | Put here | Do not put here |
|----------|----------|-----------------|
| **Definition** | What this brain domain *is*; boundaries | Workflows, metrics, or rules |
| **Goals & Priorities** | Long-term direction and active priorities (this quarter / this year) | Raw metric tables (Data & Metrics) or stable reference (Knowledge) |
| **Workflow** | How work runs; steps; handoffs | Canonical policy or one-off examples |
| **Data & Metrics** | Numbers, sources, definitions, lenses | Narrative positioning or approval rules |
| **Rules & Guardrails** | Must / must-not; approval boundaries | Examples dressed up as policy |
| **Knowledge** | Stable reference material | Draft hypotheses or open questions |
| **Examples & Edge Cases** | Concrete cases, exceptions, "when X do Y" | Generic definitions |
| **Open Questions** | Known unknowns; gaps; "we haven't decided" | Anything the user is tempted to state with false confidence |
| **Business Context** | Company-wide context a function leader needs to *read* but not own (Function Leader — Core overlay) | Deep ownership of another function’s domain |
| **Adjacent Functions** | Other teams’ rough remit; handoffs and dependencies with this function (Function Leader — Core overlay) | Full workflows owned by other functions |

**Goals & Priorities — horizon tag:** every record states **Long-term** or **Active** (field, title prefix, or first line). OKRs, rocks, quarterly priorities, and plain “what matters now” all file here — do not use “OKR” as the canonical category name.

**Archetype-gated categories:** **Business Context** and **Adjacent Functions** are in the taxonomy for all brains but Clive **only interviews** them for Function Leader Core overlay (§3.2). Founder mode skips; domain depth lives in owned brains.

**Open Questions** is mandatory in the taxonomy. Without it, uncertain context gets forced into Definition or Knowledge and reads as approved truth.

**Goals churn faster than glossary.** Prefer Workshop drafts; set **Freshness = Review soon** after a planning period ends; do not treat aspirational goals as approved policy without promote.

### 4.2 Legacy category mapping (Chapter 1 migration)

Existing Airtable / demo categories map to the universal set:

| Legacy | Universal category | Typical brain |
|--------|-------------------|---------------|
| Business Definition | Definition | Core |
| Positioning | Definition or Knowledge | Core / GTM |
| Method | Workflow | Domain |
| Offers | Knowledge | Product / GTM |
| Proof | Knowledge or Examples & Edge Cases | Core / domain |
| Workflow Rule | Workflow or Rules & Guardrails | Domain |
| Governance | Rules & Guardrails | Core |

Run both legacy and universal select options in Airtable until migration completes; then retire legacy options in the UI.

---

## 5. Progressive disclosure (onboarding vs maturity)

Onboarding does **not** extract the full brain. It extracts enough structure for Clive to route future intake.

| Level | When | What exists | Where |
|-------|------|-------------|-------|
| **L0 — Skeleton** | Onboarding (minutes) | Archetype, function, confirmed brain set; **Step 0C:** strengths, weaknesses, learning style (required); psychometric reference and other coaching fields optional; one-line Definition per brain, Open Questions per brain; **Core:** Goals (long + active). **Function Leader only:** loose Business Context + Adjacent Functions bullets | Workshop User Brains + Draft Brain Truth |
| **L1 — Headers** | First Clive sessions | Short Definition stubs; known gaps named | Workshop drafts |
| **L2 — Category fill** | Ongoing curation | Workflow, Data, Rules, Knowledge, Examples filled over time | Workshop drafts by category |
| **L3 — Trusted retrieval** | Working+ maturity | Approved snippets via grant (`read:brain-truth:<area>`) | Trusted Brain Truth |

**Product principle:** structure up front, depth over time. Seedling = Workshop only (L0–L2). Working+ = L3 with human-approved grants.

### 5.1 Clive onboarding flow (Step 0 → Step 2)

```text
1. Operator Profile     Who are you? Founder or function leader? What do you own?
2. Operator Competency  Quick confidence map (existing domains)
3. Operator Development — strengths, weaknesses, learning style (required); psychometric reference and other coaching fields optional
4. Guide mode           Story mode (existing Step 1)
5. Brain set confirm    Show template brains — user confirms, prunes, renames
6. Core skeleton        Goals: one long-term + one active priority (all archetypes)
7. Function Leader only Loose business context + adjacent functions / handoffs (Core overlay)
8. Domain skeleton      One-line Definition + Open Questions per owned brain theme
9. Category interview   Highest-priority categories only — not all at once
10. Draft brief         Workshop Draft Brain Truth rows — never Trusted until promote
```

**Founder path:** step 7 skipped — wider business understanding grows in owned domain brains over time.

**Function Leader path:** step 7 is required at L0 — “how does the company work?” and “who do you depend on?” at loose depth only.

Clive Persona Config (`Operational v0.2`) owns interview behaviour; this doc owns the taxonomy it must populate.

### 5.2 Clive's study beat map (V1)

Chapter 1 should feel like a conversation in Clive's study, not a form. The user is named **The Architect** because the product is teaching them to shape the context system their agents will rely on. Clive speaks first, explains why the questions matter, and only then begins the User Brain setup.

V1 stays chat-first. A voiced avatar is a later polish layer; do not make voiceover a dependency for the core loop.

1. **Welcome / name the Architect**
   - Clive welcomes the user into the study.
   - Explain AstraJax in one plain line: AstraJax helps domain experts turn messy team knowledge into a governed brain agents can safely use.
   - Explain why the user is called The Architect: they know the work and the context; AstraJax gives structure, agents, and paper trail, but they decide what becomes true.
   - Set scope honestly: this works best for a specific function inside an SME, or for a startup founder shaping an early operating system. Whole-company enterprise context from day one creates context bloat and weak answers.

2. **Why context matters**
   - Explain that context is the scarce human asset. Models will get cheaper and stronger, but someone still has to decide what is true, current, approved, uncertain, and useful.
   - Message to preserve: "It is the one thing that will have to remain truly human. Getting it right now unlocks value for teams. It is a big job, but we are here to make it easier and give you control over it - not hand it to a distant person who is not the expert in your context like you are."
   - Be sensitive where self-assessment or weaknesses come up: we ask only so Clive can calibrate pace, tone, and support. This is enablement, not judgement or surveillance.

3. **The AstraJax way: BRAINS**
   - Explain the storage model lightly: AstraJax creates and maintains BRAINS.
   - Brain = structured context for a role, function, or business domain.
   - Workshop = draft space where Clive proposes.
   - Trusted Brain = approved context humans have signed off.
   - Pam challenges before promotion; Doc files after approval.
   - Keep it warm: "because we like to make things a little fun."

4. **Create the User Brain**
   - Ask who is sitting in the chair.
   - Capture enough about the operator to calibrate Clive and Pam before asking business questions.
   - If anything feels sensitive, say why it is being asked before asking it.

5. **Guide mode**
   - Let the user choose how much story/personality they want.
   - Keep the same governance underneath regardless of tone.

6. **Clive interview**
   - Ask what the team actually does day to day, where context lives now, who owns it, what good answers sound like, and what agents must never say.
   - Extract skeleton context, not the full brain.

7. **Workshop draft**
   - Show the draft business brain as a document in the study.
   - Make clear it is Workshop-only until approved.

8. **Pam challenge**
   - Pam reviews the draft: strongest part, weakest assumption, missing evidence, rabbit-hole risk, and whether it is safe to send to Doc.

9. **Human decision / Doc filing**
   - The Architect decides what becomes trusted.
   - Doc promotes approved snippets and leaves the paper trail.

10. **Use approved context / receipts**
   - Clive requests scoped access to approved context.
   - The user approves access for the bounded task.
   - Finish with receipts: what was created, challenged, approved, filed, and unlocked.

---

## 6. Context layers (AstraJax mapping)

Maps context-engineering anatomy to governed storage (see §8 for external influence).

| Layer | Role | AstraJax home | Harness surface |
|-------|------|---------------|-----------------|
| **Session / working** | Current conversation | Brain Interactions (manifest only when granted) | Append-only |
| **Operator calibration** | How agents adapt | Workshop User Brains (competency fields) | Editable |
| **Operator identity** | Who owns which domains | Workshop User Brains (archetype, function, brain set) | Editable |
| **Draft truth** | Proposed business context | Workshop Draft Brain Truth | Editable |
| **Approved truth** | Canonical business context | Trusted Brain Truth | **Locked** (promote-only entry) |
| **Working recall** | Non-canonical shared hints | Trusted Brain Memories | Append-only / steward retire |
| **Character spine** | Agent persona (not business truth) | Agent base Narrative Arch | Locked + Pending gate |
| **Character recall** | Episodic agent memory | Agent base Persona Memories | Append-only |
| **Audit** | Paper trail | Registry Change Log | Append-only |
| **Human gate** | What becomes true | Approval Decisions, Pam Reviews | **Human-controlled** |

**Harness rule:** agents propose on editable surfaces; humans approve crossing to locked surfaces; Doc executes promote with brief ID.

---

## 7. Memory and retrieval discipline

| Principle | AstraJax implementation |
|-----------|-------------------------|
| Just-in-time retrieval | Brain Key grant + scope exact match — do not preload Trusted text at onboarding |
| Context partitioning | Domain brain themes — do not mix Sales workflows into Product scope |
| Consolidation | Clive's Man retires stale Brain Memories; quarantine consumed Workshop drafts |
| Invalidate, do not discard | Change Log + hash chain; quarantine preserves provenance |
| Signal over volume | Fewer high-quality rows beat bulk low-signal drafts |

---

## 8. External influence (not canonical)

[Agent Skills for Context Engineering](https://github.com/muratcankoylan/agent-skills-for-context-engineering) informed §5–§7:

- **Progressive disclosure** — L0–L3 levels
- **Context partitioning** — domain brain themes
- **Memory layers** — Workshop vs Trusted vs Agent bases
- **Harness surfaces** — locked / editable / append-only / human-controlled
- **Start simple** — templates before depth; create only confirmed brain themes

Do **not** import: their 15-skill taxonomy as business categories, Digital Brain's personal-OS modules as Founder brain names, or autonomous vector/graph memory frameworks. AstraJax stays Airtable + human approval + Trinity.

---

## 9. Schema and code follow-ons

| Track | Work | Owner lane |
|-------|------|------------|
| **Airtable** | **Phase B live** — see [`brain-key-schema.md`](./brain-key-schema.md). Field IDs: `website/src/lib/brains/airtable-ids.ts`. **20 Aug 2026:** Chapter 1 Brain Truth gained **Text Characters** (`fldUnZSHrKHFcZQDz`). **Still pending (MCP cannot add select choices):** universal Category options + Scope `read:brain-truth:incubation` (add-only; keep legacy). Do not retire legacy Category/Scope options in that job. Optional later: delete LEGACY Scope text field. | — |
| **Code** | `website/src/lib/brains/context-structure.ts` — types, templates, categories | Doc → Composer after brief approved |
| **Demo UI** | `aie-demo` steps: archetype → brain set → category skeleton | Doc → Composer |
| **Clive** | Persona Config interview rules | Matthew in Airtable → generator sync |
| **Migration** | Re-tag Chapter 1 Trusted + Workshop rows; retire legacy categories | Clive's Man + Doc promote |

Live IDs: `website/src/lib/brains/airtable-ids.ts`.

### Phase B addendum (live in Airtable, 29 Jun 2026)

[Doc Phase A brain schema plan](f77bab31-96db-413a-a339-d878dd16c499) did not include Operator Development fields — add these in **Workshop Step 2** alongside identity fields:

| Field | Type | Notes |
|-------|------|-------|
| Strengths | multilineText | **Required at Step 0C.** Brief evidence encouraged |
| Weaknesses | multilineText | **Required at Step 0C.** Standing gaps; not duplicate of Development Focus |
| Coaching Preferences | multilineText | **Required at Step 0C.** Learning style preference — pace, tone, teach-as-you-go, how they learn |
| Development Focus | multilineText | Optional. 1–2 active growth areas (time-bound; may overlap a weakness) |
| Development Notes | multilineText | Optional Coach Whit context |
| Psychometric Reference | multilineText | Optional. Reference only (Insights, MBTI, colour profile, etc.); not clinical diagnosis |

Workshop only — never Trusted Brain Truth. Strengths, Weaknesses, and Coaching Preferences required at Step 0C; psychometric reference, development focus, and development notes skippable.

---

## 10. Acceptance checks

Before calling this structure "live" in product:

1. **Archetype test:** Founder and Head of Sales both map to a brain set without orphan facts.
2. **Archetype overlay test:** Function Leader gets Business Context + Adjacent Functions in Core; Founder onboarding does not require them.
3. **Coordinate test:** Any sample context sentence from Butternut DS proof fits exactly one `(Brain, Category)` or Open Questions.
4. **Goals test:** Long-term and Active priorities live in Goals & Priorities, not Definition or Data & Metrics.
5. **Onboarding test:** L0 completes in under 10 minutes without Trusted writes.
6. **Development test:** Step 0C blocks completion without strengths, weaknesses, and learning style preference (Coaching Preferences); psychometric reference, development focus, and development notes remain skippable.
7. **Pam test:** Open Questions populated where evidence is thin — no false-confidence Definition or Adjacent Functions rows.
8. **Grant test:** Each scope area used in demo has a matching `read:brain-truth:<area>` option before Working+ retrieval.

---

## Related

- [Architecture §5 Step 0–2](../business/architecture.md) — product loop
- [Architecture §7](../business/architecture.md) — data and context layers
- [Brain Key schema](./brain-key-schema.md) — Airtable field blueprint
- [Brain Key wiring](./brain-key-wiring.md) — grants and API
- [Doc Brain Base Builder](./doc-brain-base-builder.md) — schema migration runbook
