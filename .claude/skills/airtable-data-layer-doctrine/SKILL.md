---
name: airtable-data-layer-doctrine
description: >-
  Airtable data-layer method for Ruth Hadley: grain, SSOT, dual lens, automation, interfaces, kill criteria. Load before any Ruth schema or delivery work.
---

# Airtable Data-Layer Doctrine


## Cursor runtime

Hyperagent `RunWithCredentials` is optional here. In Cursor:

1. Put required tokens in the environment the agent shell inherits (never print them).
2. Run skill scripts via `python3 .cursor/skills/<skill>/scripts/<file.py> ...` (mirrors under `.claude/skills/` and often `scripts/ruth/` for convenience).
3. Prefer Airtable MCP for discovery reads when available; pens remain the only mutation path for signed builds / Cleared-V2 maintenance.
4. If a credential or control-plane base is missing, refuse mutation and report the gap — do not improvise.

**Status:** v1.1, amended for verified Airtable MCP surface and serving architecture, 6 Aug 2026.
**Provenance:** distilled from Matthew's ds-platform operating doctrine (Butternut Box Direct Sales platform, 2025-2026) as recorded in the AstraJax context estate — principally the Fleet / Founding-500 build inventory, AGENTS.md canonical figures, the dual-lens data-governance records, and the Working Context for AI. Ruth's V2 build authority (§8) commissioned the original eleven chapters. §12 was reviewed by Ruth and accepted by Matthew on 6 Aug 2026.
**Owner:** Ruth Hadley lane (build: Doc's Workshop). Character spine lives in Ruth's Persona Config; this skill is method, not persona.
**Audience:** Ruth (reasoning head) and her Build/Maintenance family. Challengers may share this doctrine; executors never apply judgement from it — they apply cleared manifests.

This doctrine is the house answer to one question: *how do you build an Airtable data layer a business can inherit?* Every chapter exists so that the person who knows the system best can go home, and the system still stands.

---

## 1. Grain and entity discipline

Decide what one row IS before anything else, and never let a table quietly become two kinds of thing.

- One table = one grain. A row in `Activations` is one activation; a row in `Shifts` is one shift. If a row sometimes means an event and sometimes a state of the world, the table is lying.
- Entities are nouns the business owns (clients, people, products, places). Events are things that happen to entities (bookings, shifts, payments, decisions). Keep them in separate tables; an event links to its entities, it never absorbs them.
- Grain test: complete the sentence "one row is exactly one ___" in the client's own words, and have them confirm it. If the sentence needs an "and", split the table.
- Never let grain drift downstream: a report that sums rows of mixed grain produces a number that no one can defend.

## 2. Single source of truth (SSOT)

Every fact has exactly one home; everything else is a lookup, a rollup, or a copy that is labelled a copy.

- The ds-platform ran field-ID single-source-of-truth: a value entered once, referenced everywhere. Duplicated fields are not redundancy, they are a future argument.
- When the same fact appears in two tables, one is authoritative and the other is derived. Name which, in the field description.
- If two systems both claim a fact, pick the winner and demote the loser to an import staging table whose entire job is reconciliation.
- SSOT applies to definitions too: SPS, CPA, retention, fulfilment were governed definitions, not vibes. A metric whose formula lives in someone's head is a dependence, and dependence is what this lane removes.

## 3. Naming and field conventions

Names are the first thing an inheritor reads; they must survive the author leaving.

- Table names: plural nouns in business language (`Salespeople`, `Activations`, not `Data3` or `Master`).
- Field names say what the value is, not how it is computed: `Travel Cost GBP`, not `=IF(...)`. Computation lives in the formula, the name stays a noun.
- IDs over names as keys: link and reference by record ID / field ID wherever the platform allows; a renamed field must never break an automation or an integration. The ds-platform's field-ID discipline is the reason ~556 interface files stayed maintainable.
- No abbreviations the client would not say aloud; no system jargon in business-facing names; dates and statuses named consistently across tables (`Status` everywhere, never `State` in one table and `Stage` in another).
- Every non-obvious field carries a one-line description written for the inheritor, not the author.

## 4. Relational shape

Links express the business's real structure; they are not decoration.

- One-to-many is the default and the honest shape: one activation has many shifts. Reach for many-to-many only when the business truly has one (many reps to many regions) and name the junction table like the thing it is (`Region Assignments`).
- Every link has a direction the business understands: "this shift belongs to this activation". If you cannot say the direction in one clause, the shape is wrong.
- No link cycles that exist only to make a rollup convenient; compute through the real path or accept two hops.
- Orphans are defects: an event row linked to nothing is either a broken import or a broken process, and maintenance should be able to find it.

## 5. The computed layer: field vs automation vs agent

Computation has three legal homes, in ascending order of power and descending order of transparency. Choose the weakest home that does the job.

- **Field** (formula/lookup/rollup/count): deterministic, visible, instant, self-documenting. Anything a formula can express belongs here.
- **Automation** (trigger + action): deterministic state changes on events (when a shift is confirmed, set the activation status). Saved OFF at build; the human activates at handover. Never hides a decision: if the rule can't be written as "when X, do Y", it isn't an automation.
- **Agent**: only for judgement — classification, extraction, drafting, routing — never for anything a formula or automation can do. Agents propose; the record of what they did lands as data a human can inspect. The Trinity pattern (link → propose → human approves → execute) is the ceiling of agent power in the data layer.
- The boundary rule: power ascends only with need, and every step up must leave a more inspectable trail, not a less inspectable one.

## 6. Operational vs Reporting — the dual lens

Two lenses, never blended, each with its own discipline.

- **Operational** numbers drive today's work: live, per-record, allowed to be rough at the edges, optimised for "what do I do next".
- **Reporting** numbers explain the business: period-locked, weighted, reconciled, optimised for "what is true". The ds-platform kept these apart with discipline worth copying: weighted-average rules, period locks, dual-lens dashboards whose numbers never blend.
- A field is one lens or the other. If a single number must serve both, it is Reporting and operations reads it through a view — never the reverse.
- Kill blended aggregates on sight: an average of averages, a forecast period edited after lock, a "live" KPI that silently rewrites history.

## 7. Automation patterns

Automations are plumbing: deterministic, named, OFF until a human turns them on.

- One automation = one named intent ("When shift confirmed → set activation In Progress"), not a bundle of convenience.
- Trigger on the real event, not a polling timer wherever the platform allows; time-based triggers are for genuine schedules only.
- Every automation is built OFF and activated by the human at handover as one explicit activity — effects never begin invisibly.
- No external-account nodes (email, Slack, Gmail, calendar, GitHub), no custom scripts, no AI nodes, no secrets in v0.1 builds. If the design needs one, the design isn't v0.1.
- An automation that can fire on the same record repeatedly must be safe when it does: idempotent writes or a guard field.

## 8. Role interfaces

The system shows each person only what their role needs; that is the interface's whole job.

- The ds-platform shipped one interface per persona — Event Coordinator, Regional Manager, salesperson, leadership, DS Pay — and the pattern is doctrine: a role sees its queue, its records, its actions, and nothing else.
- Interfaces are read-and-act surfaces, not schema browsing. If a user needs to understand the base to use the page, the page failed.
- Draft and unpublished only during build; publish is a human handover act.
- Supported shapes only: a page type the platform can't produce deterministically becomes a Held item in the build report, never a silent approximation.

## 9. Build sequence and validation

Order is a safety property, not a preference.

- Sequence: base → tables and ordinary fields → links (after actual ID resolution) → computed fields → automations (OFF) → draft interfaces → labelled synthetic seeds → readback.
- ID resolution before links: never write a linked field against an assumed ID; resolve the real table/field IDs from the created base first.
- Every build is one Amber job against an exact signed proposal: execute without per-step approval, then notify with a validation report. The signature is on the challenger-cleared proposal hash, not on a vibe.
- Validation = readback against the signed proposal: declared tables present, fields typed as declared, links resolving, automations OFF, pages unpublished, seeds labelled synthetic. Drift returns to Ruth as a finding — never silently repaired.
- Idempotency: a retry must never duplicate a base or object. Deterministic IDs, persisted base ID immediately after creation, read-before-create on everything after.

## 10. Discovery protocol

The schema is discovered, not invented; the client already knows their architecture — they haven't seen it drawn.

- Interview for entities, events, actors, decisions, metrics — in that order. Read the existing bases, exports, and process artefacts before proposing anything.
- Produce a Business Architecture Map **in the client's language** and have them confirm it: "one row is one job; a shift belongs to a job; a rep works many shifts". If they wouldn't say it, it isn't their map.
- One real record, one real user, one real exception before any structure is proposed (Ruth's guard against architecture for imaginary branches).
- Discovery is Green tier: reads and interviews only. Nothing is built, changed, or promised during discovery.

## 11. Anti-pattern catalogue

The named failures this doctrine exists to prevent. Each maps to the chapter that kills it.

- **Confident chaos machine** — an agent pointed at messy data. Killed by §1-2: fix the layer before adding judgement. (Canonical Matthew line: agents on messy data are confident chaos machines.)
- **Two homes for one fact** — duplicated fields that drift. §2.
- **Grain soup** — a table that is both entity and event. §1.
- **The average of averages** — blended lenses producing indefensible numbers. §6.
- **The invisible effect** — an automation built ON, or activated without a human act. §7, §9.
- **The clever formula** — computation hidden in a field name or an undocumented formula. §3, §5.
- **The snowflake base** — a structure only its author understands; the exact thing Ruth's Super Objective forbids. Whole doctrine, especially §3, §8, §9.
- **The silent approximation** — an unsupported interface or object faked into existence instead of reported Held. §8-9, and a kill criterion in the build authority.
- **The workaround queue** — people waiting for the one person who knows. The origin story; the reason the lane exists.

## 12. Verified MCP surface and serving architecture

**Applies to:** §§7–9 and the Operating Notes.

**Estate-specific provision:** the Vercel serving rule below applies to Matthew's AstraJax estate. It does not silently prescribe the serving architecture of another client engagement.

### 12.1 The capability surface is evidence, not memory

A build decision must use the Airtable MCP surface actually exposed at the time of the decision. A remembered limitation, an old executor allowlist, or an absent entry in a local manifest schema is not evidence that Airtable cannot construct something.

The connected Airtable MCP exposes the following surface as at 6 August 2026:

- **Discovery and readback:** workspace, base, table, field-schema, view, record, record-comment, linked-record candidate, interface-page, form-schema and automation discovery; record search; interface-page record reads; external-account discovery; automation input-data discovery; server health.
- **Record operations:** create, update and delete records; create record comments; submit existing forms.
- **Schema operations:** create bases, tables and fields; update table and field metadata or supported options; delete tables.
- **Interface operations:** create and delete interfaces; create and delete supported pages; describe page and element schemas; publish interfaces.
- **Automation operations:** create, replace, list, inspect and delete automations; retrieve the current automation-construction instructions; test a generic webhook trigger.
- **Reversal:** `revert_action` for mutations that explicitly return an eligible action ID. It is not a general rollback mechanism: record updates are not revertible, and several reversals are separate operations rather than one atomic transaction.

The exact action catalogue and the exact parameter schema remain the source of truth. This dated list is a capability-register snapshot, not a promise that the surface will remain unchanged.

The current interface construction surface is materially narrower than the word “interface” suggests:

- `create_page` supports visualization and dashboard pages.
- Supported visualization elements are data views and analytic components: kanban, list, calendar, gallery, grid, timeline, record review, number, chart and pivot-table forms.
- No button element is exposed.
- Existing form schemas can be read and existing forms can be submitted, but the current surface does not expose form creation.
- The current field-creation schema does not expose a button field.

A Challenger may therefore say **“not exposed by the verified MCP surface dated X”** when the live action schema excludes the object. It must not inflate that into **“Airtable cannot do this”** unless the platform limit itself has been established.

Capability does not confer authority. Delete, publication, external-account use, live-record mutation and every other Red or out-of-scope action remain forbidden unless the signed engagement authority separately permits them. The surface describes what the tool can address; the manifest and lane authority decide what may be addressed.

### 12.2 Verified field-creation exceptions

`autoNumber` and `createdTime` are verified current exceptions in the field-construction surface.

Both types are absent from the exposed schemas for `create_base`, `create_table` and `create_field`. Direct creation attempts through the tested public-API paths returned `422 UNSUPPORTED_FIELD_TYPE_FOR_CREATE`, twice, on 6 August 2026.

Where either field type belongs in the approved schema:

- the typed manifest names the field, table, type, purpose and required position;
- the manifest classifies its creation as a named human Airtable-UI handover step;
- the build report records it as deliberately deferred to that step, not unexpectedly Held;
- readback after the human step verifies the real field ID and type before any dependent object is treated as complete.

These are the two field-creation exceptions verified by evidence on that date. They are not to be described as the only possible gaps in the whole platform surface.

### 12.3 Serving architecture is an architectural boundary

For Matthew's AstraJax estate, Airtable is the data layer. Operational UI is served by the Vercel application.

Airtable Interfaces are not proposed as operational surfaces in this estate, even where the MCP can construct one. This estate-specific rule supersedes the general role-interface guidance in §8 wherever the two conflict.

A gate requiring an authenticated actor, an authoritative server timestamp and one deliberate action belongs in the application layer. For example, an **Action this finding** control is implemented in the Vercel application against an exact data contract. It is not approximated with an Airtable button field or rebuilt as an Airtable Interface.

The data-layer proposal still owns:

- the record grain;
- gate state and legal state transitions;
- actor identity fields;
- server-timestamp fields;
- decision or action IDs;
- idempotency requirements;
- audit fields;
- the exact write contract and forbidden transitions.

The application owns the served interaction that invokes that contract.

For any other client, serving architecture is discovered and confirmed before schema proposal. Vercel is not assumed. Airtable Interfaces may be considered only where that engagement's confirmed architecture permits them and the verified construction surface can produce the required shape without approximation.

### 12.4 Verify before ruling

When a material proposal or Challenger verdict turns on constructability:

1. Inspect the current MCP action catalogue.
2. Inspect the exact action schema and, where provided, its current construction instructions.
3. Distinguish among:
   - supported and exposed;
   - exposed with a narrower supported shape;
   - absent from the current surface;
   - accepted by the tool but rejected by the platform;
   - unverified.
4. Where the catalogue is ambiguous and the answer still controls the design, specify one bounded probe against a declared throwaway object in a draft base.
5. Have an actor with the correct execution authority perform that probe.
6. Record the payload class, returned result or error, date, object ID and cleanup status.
7. Rule from that evidence.

Ruth and her Challengers may design the probe and assess its result. They do not acquire construction authority by calling an experiment “cheap”. The authorised executor performs the mutation within a declared allowlist and cap.

A failed probe is evidence, not an invitation to improvise. A successful probe proves only the tested shape. Neither justifies widening the signed manifest, changing the serving architecture or using a capability outside lane authority.

Verdict language must remain exact:

- **Supported** — verified surface and tested shape permit the declared object.
- **Supported with constraint** — the object is constructible only within named limits.
- **Human UI step by design** — the required platform object is known but not constructible through the authorised surface.
- **Not currently exposed** — absent from the verified live surface.
- **Platform-rejected** — a bounded probe returned a recorded platform error.
- **Unverified** — evidence is insufficient; do not silently translate this to unbuildable.
- **Out of authority** — capability may exist, but this lane or manifest may not use it.

A wrong HOLD costs time. An unsupported approximation costs the structure. The doctrine permits neither.

---

## Operating notes

- This doctrine governs Ruth's judgement and her family's challenges. Executors never interpret it: they apply challenger-cleared, signed manifests only.
- Disagreements between doctrine and a signed proposal are findings, not overrides — return them; never repair silently.
- Capability is not authority. A live MCP tool does not widen a lane, engagement, manifest or credential boundary.
- Version: v1.1 (6 Aug 2026). §12 records the accepted verified-surface and serving-architecture amendment. Future amendments land as new versions; never as silent edits.