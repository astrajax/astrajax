# VERDICT: REVISE

The fleet-health lane is necessary and well separated in principle, but this pack cannot proceed until its Airtable boundary, unattended runtime, append-only ledger, evaluation contract, and machine-readable configuration are made verifiable.

**Target path:** `agents/registry/hyperagent/bjornson/physician/challenger-verdict-v0.1.md`

## 1. Review metadata

| Field | Result |
|---|---|
| Review mode | Full pass |
| Decision type | One new Hyperagent reasoning-head agent |
| Runtime | Hyperagent; interactive threads plus one paused weekly schedule |
| Candidate | `build-pack-v0.1.md`, SHA-256 `fe3cf514e799bed215c8ae1d6083178a8535abd35544a80d2fbfab8bd7dcc505` |
| Role brief | SHA-256 `6a9546ba167b88b609dd09763076eb598af69bb72aee86a574e035b6f95d605e` |
| Repo baseline | `astrajax/astrajax@63c871ca48e5f6716fa438f21a9a9ebd57323c4a` |
| Proposer risk tier | MEDIUM |
| Challenger risk tier | **HIGH until machine-enforced scope and unattended surfaces are verified; MEDIUM is plausible after the V2 repairs** |
| Independence | Verified: Challenger thread differs from Proposer thread |
| Artifact transport | Compliant: attached artifact carries its target repo path |
| Executor brief | Omitted because the verdict is REVISE |

## 2. Source ledger

### VERIFIED

1. GitHub `main` remained at `63c871ca48e5f6716fa438f21a9a9ebd57323c4a` during this review.
2. Independent roster run returned **31 repo agents** and no Physician/Bjornson Hyperagent export or registered agent.
3. The live Brain Registry Agents table, `appbdTVHevH6Bl5ZZ / tblmb7syHipyWfBzu`, contains five rows: Doc, Pam, Clive, Clive’s Man, and Lazlo; no Physician.
4. The pack’s statement that there are “zero physician/Bjornson mentions repo-wide” is false. Baseline files already contain Dr. Halvard:
   - `website/src/lib/platform/court.ts:237–241`
   - `website/src/lib/platform/court-cast.ts:14`
5. Repo `docs/initiatives/character-provenance.md` is silent on Halvard, as the pack acknowledges.
6. The live Brain Workshop base `appL2fdnGmhA02WXd` contains much more than Draft Brain Truth, including:
   - User Brains
   - Brain Interactions
   - Pam Reviews
   - Approval Decisions
   - Doc Actions
   - Source Documents
7. The connected Airtable surface currently advertises create, update, delete, comment, and schema-changing actions. Therefore C1 is load-bearing, not documentary.
8. Current Hyperagent configuration semantics expose `resourceScope` and `allowedTools` only as access snapshots configured through the access UI; exact per-base/per-action granularity has not been demonstrated here.
9. Current scheduled-invocation configuration requires `threadStrategy`; `continue` additionally requires a valid `targetThreadId`. The pack specifies `continue` without identifying one.
10. The live rubric tool surface supports rubric building, details, updates, evaluation-history analysis, and improvement backtests. It does **not** expose a Rubric Suggestions inbox action or a thread-pinning action.
11. The pack’s general rubric principles are substantially supported by:
    - [AdaRubric](https://arxiv.org/abs/2603.21362): task-specific, orthogonal dimensions and concrete five-level criteria.
    - [Autorubric](https://arxiv.org/abs/2603.00077): atomic criteria, coarse scales, explicit uncertainty, calibration, and psychometric reliability.
12. Research also establishes that implicit feedback is useful but noisy and context-dependent:
    - [Implicit User Feedback in Human–LLM Dialogues](https://arxiv.org/abs/2507.23158)
    - [Naturally Occurring Feedback Is Common, Extractable and Useful](https://arxiv.org/abs/2407.10944)

### UNVERIFIED

1. Whether Configure Access can enforce:
   - per-base inclusion/exclusion;
   - different actions for different bases;
   - table-specific restrictions inside one Airtable base.
2. Whether scheduled runs can search and read other agents’ threads account-wide.
3. Whether SearchThreads can filter deterministically by an approved agent-ID allowlist.
4. The live existence and exact configuration of Clive’s Man — Ambient Capture; no workspace-agent listing tool was available.
5. The final generated agent JSON, its schedule status, execution mode, tool flags, skill attachments, invocation surfaces, and integration snapshots. These artifacts do not yet exist in the review input.
6. Whether a generated import can attach the three existing fleet-standard skills by reference while embedding only the three new Physician skills.
7. Whether a backtest created through the available tool surface can be fully run without a subsequent UI action.
8. Competing title records:
   - a 9 July fleet memory says **Prof. Halvard Bjornson**;
   - the 10 July repo baseline and this dispatch say **Dr. Halvard Bjornson**.
   The fresher repo evidence currently favours “Dr.”, but the conflicting memory remains unreconciled.

### NOT CHECKED

1. Exact commissioning-thread approval wording for the role brief.
2. The original research thread `cmraaexie06av06ad9wog44n2`.
3. Ambient Capture’s schedule, thread visibility, and write-scope snapshots.
4. Live UI enumeration of Airtable access controls.
5. Any generator or export output, because Phase B has not run.

## 3. Findings

### PHY-001 — MAJOR — VERIFIED

**Failed criterion:** Permission boundary and lane separation.

**Evidence:** The proposed scope includes the entire Brain Workshop base (`build-pack-v0.1.md:77–78`), while the prompt claims the Physician can write only Draft Brain Truth there (`:237–240`). Live inspection shows that the same base also contains Approval Decisions, Doc Actions, Pam Reviews, User Brains, Brain Interactions, and Source Documents. A base-wide read/create grant therefore permits structurally valid creates in human-judgement and dispatch tables, even if the NEVER list forbids them.

The pack also attaches the Fleet Routing Standard but bypasses its explicit route for context capture by writing Draft Brain Truth directly.

**Consequence:** A mistaken or injected scheduled run could manufacture an approval-shaped or action-shaped record, pollute other lanes, or create duplicate context outside Clive’s Man’s stewardship. Base exclusion of Trusted canon does not close this integrity failure.

**Smallest acceptance test:**

1. Exclude the entire Brain Workshop and Brain Registry from the Physician’s write integration.
2. Restrict routine writes to the Physician Agent base.
3. Route canon-worthy context through the exact Clive’s Man — Executor peer route; no direct Draft Brain Truth writes by the Physician.
4. Read back the saved access snapshots.
5. Prove structural denial for creates against Draft Brain Truth, Approval Decisions, Doc Actions, Brain Registry, Trusted Chapter 1, and another Agent base.

If exact scoping cannot be enforced, **Ward Rounds remains paused**. Ask-first is an interactive fallback, not a sufficient basis for an unattended write schedule.

**Confidence:** High. The exposed tables and broad action surface are verified; whether a forged queue row would be consumed automatically is unknown, but the cross-lane integrity breach is sufficient.

---

### PHY-002 — MAJOR — VERIFIED

**Failed criterion:** Unattended runtime fit, source boundary, and enforceable kill criteria.

**Evidence:**

- The schedule says `threadStrategy = continue` without a `targetThreadId` (`:400–407`).
- Account-wide cross-agent thread visibility is asserted, not independently demonstrated (`:58`, `:151–155`).
- There is no allowlisted definition of which agents or threads constitute the AstraJax fleet.
- The proposed source sweep could therefore include Butternut, client, shared-channel, or personal threads.
- “Three consecutive Airtable write failures” allows uncertainty to compound.
- “Cap exceeded” detects the breach after it occurs rather than preventing the 26th thread or 21st note.
- A hard `$5` model cap may terminate the run before the Rounds Log and digest are written.
- “Digest unread for three rounds” is counted as mitigation, but no read-receipt capability has been established.

**Consequence:** The schedule may fail at creation, monitor the wrong population, copy sensitive material into the Physician base, duplicate notes after ambiguous writes, or end without advancing its cursor and reporting what happened.

**Smallest acceptance test:**

1. Use `threadStrategy = new`, or provide and verify an accessible target thread owned by the schedule owner.
2. Create a read-only Ward Roster containing explicit in-scope AstraJax agent IDs. Exclude DS, client, shared-channel, and personal agents by default.
3. Prove the scheduled identity can filter SearchThreads to that roster. If it cannot, do not activate fleet-wide rounds; use per-agent eval history or a curated feed.
4. Store trace IDs and a minimal symptom summary only; never copy raw sensitive content.
5. Make caps pre-emptive: do not start item 26 or create note 21.
6. Stop on the first ambiguous write outcome.
7. Reserve completion capacity below the hard budget cap, or use a deterministic work/time cap that leaves room for the killed/completed event and digest.
8. Remove unread-digest detection unless a real read signal becomes available.

**Confidence:** High on the missing configuration and missing boundary; medium on actual SearchThreads breadth because that capability was not accessible for a live test.

---

### PHY-003 — MAJOR — VERIFIED

**Failed criterion:** Append-only data model and rollback/idempotency.

**Evidence:**

- `allowedTools` is read plus create only (`:78`).
- Consultation Notes contain a mutable `Status` of Open / In Digest / Prescribed / Closed (`:421`).
- The prompt says not to re-note an already-open symptom (`:351–355` in the embedded skill), but provides no append-only closure mechanism.
- Consultation Notes link to a Round, yet the procedure creates notes before creating the Rounds Log row (`:187–197`, `:421–422`).
- No deterministic note key prevents the same thread/turn/criterion from being captured again after a crash or cursor replay.

**Consequence:** Notes cannot move to Closed without violating create-only permissions; Urgent items accumulate forever; the proposed Round link cannot be created in the stated order; and interrupted rounds can duplicate findings.

**Smallest acceptance test:** Replace the mutable design with event sourcing:

- `Rounds Events`: deterministic Round ID, Started/Completed/Killed event type, timestamp, window, counts, and outcome.
- `Consultation Events`: deterministic Event ID derived from agent + trace + criterion + observation type; Round ID as text; Observation/Prescribed/Resolved event types; optional Parent Event ID.
- Cursor advances only from a Completed event.
- Replaying the same source window creates zero duplicate observation events.
- A Resolution event removes the original symptom from the derived open-notes view without updating the original record.

**Confidence:** High.

---

### PHY-004 — MAJOR — VERIFIED

**Failed criterion:** Evaluation validity and alignment with the actual rubric tool surface.

**Evidence:**

1. The digest requires every agent to receive Thriving / Happy / Okay / Unhappy / Rotting (`:198–202`), but no minimum evidence, rubric-to-ladder mapping, confidence rule, or `CANNOT_ASSESS` outcome exists.
2. The Physician is named owner-triager of roughly 50 Rubric Suggestions (`:141–147`), but the current agent-facing tool registry cannot list or dispose of those suggestions.
3. The smoke test requires the Physician to pin its own rubric (`:484`), but no pin action is exposed.
4. Rubric updates require confirmation under the current tool contract; the prompt’s blanket “adopt, then notify” wording does not distinguish what the runtime can actually apply.
5. Backtest creation must not be reported as a completed backtest if a later UI run remains necessary.

**Consequence:** The agent is encouraged to manufacture authoritative-looking grades from sparse evidence and to claim ownership of backlog, adoption, pinning, or backtest actions it cannot perform.

**Smallest acceptance test:**

1. Every adopted agent rubric must define its own house-ladder mapping and minimum sample window.
2. If the mapping or evidence floor is absent, report **Not Graded — insufficient evidence**, not a health state.
3. Distinguish every vital as Direct, Inferred, or Unavailable.
4. Remove Rubric Suggestions inbox ownership from v1 unless a real action is added.
5. Record rubric adoption/pinning as platform-limited when no action exists; never claim completion.
6. Test one case at each rubric-defined ladder boundary and two insufficient-evidence cases.
7. Test that a staged-but-not-run backtest is reported exactly as staged.

**Confidence:** High.

---

### PHY-005 — MAJOR — VERIFIED

**Failed criterion:** Safety-critical machine verification and deterministic validation.

**Evidence:** The agent export, three skill exports, and generator are future Phase B artifacts (`:454–465`), so the claimed auto-save flags, execution mode, schedule status, invocation emptiness, integrations, skills, and tools exist only in prose.

The referenced generic validator checks auto-save fields, JSON encoding, selected/preload, and embedded-skill keys. It does **not** validate:

- exact integration allowlist;
- execution mode;
- schedule status or thread target;
- empty email/webhook/live surfaces;
- action/resource scopes;
- tool minimalism;
- exact skill set;
- cross-agent allowlist;
- Physician-specific prompt/config invariants.

**Consequence:** A polished pack could pass the generic validator while importing an active schedule, wrong skill set, broad tools, or unsafe integration state.

**Smallest acceptance test:** V2 must produce the generator and all four JSON artifacts before clearance, plus a Physician-specific deterministic assertion layer checking:

- exact name and resolved title;
- all four auto-save flags false;
- all suggestion flags false;
- selected/preload;
- exact six-skill attachment result;
- Airtable as the only integration;
- intended tools only;
- email/webhook/live mode absent;
- exactly one paused schedule with valid thread strategy;
- no direct Brain Workshop write contract;
- no delegation except the one bounded Clive’s Man context handoff, if adopted;
- execution mode and budget;
- final saved access snapshots verified separately after import.

The next Challenger pass should be delta-only against these generated artifacts and named repairs.

**Confidence:** High.

---

### PHY-006 — MINOR — VERIFIED

**Failed criterion:** Research fidelity and uncertainty language.

**Evidence:** The new skills reproduce the role brief faithfully, but several heuristics are stated as universal facts:

- 50–200 labels and Cohen’s κ ≥ ~0.6 are operational heuristics, not a universal calibration law.
- The 1–3% explicit / 20–60% implicit coverage figures trace to a secondary production guide rather than the cited primary papers.
- “Two corrections in one thread outranks any thumbs-down” is a useful triage heuristic but not an established universal ordering.
- Primary research explicitly warns that implicit feedback is noisy and task-dependent.

**Consequence:** Sparse or ambiguous behaviour may be over-diagnosed as agent decline.

**Smallest acceptance test:** Add source URLs and provenance per claim; label numeric ranges and priority rules as starting heuristics; require trace-context review and corroboration before a Concern/Urgent diagnosis.

**Confidence:** High.

---

### PHY-007 — MINOR — VERIFIED / UNVERIFIED SPLIT

**Failed criterion:** Provenance precision.

**Evidence:**

- VERIFIED: The “zero physician/Bjornson mentions repo-wide” claim is wrong; the baseline website contains Dr. Halvard in two files.
- UNVERIFIED: A 9 July fleet memory says Prof. Halvard, while the fresher 10 July repo baseline says Dr. Halvard.

**Consequence:** Export names, file names, registry rows, Persona Config, and visual plates could diverge.

**Smallest acceptance test:** Correct the roster sentence to distinguish “no agent/export collision” from existing character mentions. Resolve the title mechanically from the latest Matthew-authored source and use one title across every generated field. Do not spend Matthew’s attention unless direct sources remain genuinely contradictory.

**Confidence:** High on the repo correction; medium on final title authority.

## 4. Six Trinity failure modes

| Failure mode | Result |
|---|---|
| Context mismatch | **FAIL, bounded:** repo-wide mention claim is wrong and Dr/Prof provenance conflicts |
| Novelty suppression / duplication | **CLEAR:** no existing agent owns continuous fleet-health diagnosis; the new lane is justified |
| Overloaded confidence | **FAIL:** MEDIUM hides an account-token technical ceiling, unverified schedule visibility, and unverified machine fields |
| Pattern lock | **FAIL:** the Man-family C1/ACC precedent was copied without adapting for whole-Workshop table reach, unattended operation, or the Physician’s different handoff duties |
| Manual gate overload | **NEEDS REDUCTION:** M-3 and M-4 should be deterministic read-back/diff checks, not Matthew eyeballing work; permission grants and canon promotion remain legitimate Red actions |
| Automation overreach | **FAIL:** auto scheduled writes are proposed before permission, source, idempotency, and grading boundaries are proven |

## 5. Governed-defaults result

**Specification-level result: PARTIAL PASS. Machine-level result: UNVERIFIED.**

- Auto-save false ×4: correctly specified, not machine-verified.
- Suggestions false: correctly specified, not machine-verified.
- Selected/preload: correctly specified, not machine-verified.
- Airtable-only: minimal at integration count, but unsafe at the proposed base boundary.
- Auto execution: acceptable only after structural access enforcement and blocking tests.
- Paused schedule: correct intent, incomplete invocation configuration.
- No webhooks/email/Slack/live mode: correctly specified, not machine-verified.
- Allowlist empty: conflicts with the attached Fleet Routing Standard if direct Workshop writes are removed; one bounded Clive’s Man — Executor route is preferable.
- Persistent sandbox: not justified by the stated duties; the Airtable ledger already owns persistent state.
- Eval floor: not met until the primary rubric, evidence floor, ladder mapping, and pin/adoption mechanics are resolved.

## 6. Confidence by decision axis

| Axis | Confidence | Position |
|---|---|---|
| Duplication | High | Build new |
| Lane integrity | High | Sound mandate; unsafe context-write implementation |
| Permissions | High | Not clearable as written |
| Runtime fit | High on omissions; medium on inaccessible platform behaviour | Revise and capability-test |
| Tool minimalism | Medium-high | SearchThreads and execute-script justified; persistent sandbox unsupported |
| Prompt integrity | High | Strong NEVER list, but missing privacy, insufficient-evidence, and tool-capability boundaries |
| Eval coverage | High | Happy paths exist; critical grading and idempotency tests are missing |
| Operational safety | High | Unattended activation must remain blocked until V2 tests pass |
| Manual load | High | Most proposed verification can be automated |

## 7. Challenger V2 repair

The smallest safe V2 keeps the role, four duties, weekly cadence, and no-minions shape. It changes only the operating rails.

### A. Permission contract

- Physician Airtable integration: own Agent base only.
- Brain Workshop, Brain Registry, Trusted Chapter 1, and all other Agent bases: OUT.
- Prefer table-specific read/create access to Consultation Events and Rounds Events.
- If only base-level scoping exists, retain own-base create-only and negative-test every other own-base table.
- Context promotion candidates route to Clive’s Man — Executor; no direct Draft Brain Truth writes.
- Failure to enforce these scopes means interactive ask-first only and **no Ward Rounds activation**.

### B. Source contract

- Add a Ward Roster with explicit in-scope AstraJax agent IDs.
- Exclude client, DS, personal, and shared-channel threads.
- Prove SearchThreads filtering before activation.
- Store trace references and minimal symptoms, never raw sensitive content.

### C. Append-only contract

- Replace mutable note status and linked future rounds with deterministic event records.
- Completed round events alone advance the cursor.
- Replay safety is mandatory.

### D. Evaluation contract

- A health grade requires an adopted rubric, a rubric-defined ladder mapping, and sufficient evidence.
- Otherwise use Not Graded.
- Remove unsupported Rubric Suggestions inbox ownership from v1.
- Label direct, inferred, and unavailable measurements.
- Qualify human-signal heuristics and preserve uncertainty.

### E. Invocation contract

- Exactly one paused weekly schedule.
- Use `threadStrategy = new` unless a valid owned target thread is verified.
- Keep schedule-specific text short; the system prompt owns the rounds procedure.
- Pre-emptive caps, first ambiguous-write stop, completion reserve below the hard budget cap.
- No email, webhook, Slack, live mode, or other unattended surface.

### F. Machine-verification contract

Generate and attach:

- `hyperagent/builds/build_physician_bjornson_v0_1.py`
- `hyperagent/exports/agents/agent-<resolved-title>-halvard-bjornson-v0_1.json`
- three skill JSONs
- a Physician-specific assertion report

Required blocking tests:

1. Access snapshot exact-match.
2. Structural denial outside approved tables/base.
3. Valid paused invocation and thread strategy.
4. Cross-agent visibility restricted to Ward Roster.
5. Replay creates no duplicate note.
6. Started-but-crashed round does not advance cursor.
7. Cap prevents item 26/note 21.
8. Insufficient evidence produces Not Graded.
9. Unsupported rubric action is reported, not fabricated.
10. Context handoff routes through Clive’s Man and creates no direct Workshop row.
11. No raw sensitive content appears in Consultation Events.
12. Generated prompt and Persona Config staging text are byte/hash compared automatically.

### G. Manual load

Matthew should receive only the manual work whose blast radius justifies it:

1. **Save/configure the final access grant and unattended-write permission** — Red because it grants credential reach; unavoidable UI ownership.
2. **Pin the primary rubric only if no agent-facing pin action exists** — one platform-forced quality-control action.
3. **Promote character/Persona rows later** — Red canon promotion.

Skill attachment checks, prompt comparison, scope read-back, smoke tests, and schedule-shape verification are Executor work, not Matthew work.

## 8. Pam recommendation

Not warranted for V2. These are bounded implementation and verification repairs under established fleet policy.

If the platform cannot structurally restrict Airtable reach and the proposal still seeks autonomous unattended writes under the account-wide token, that becomes a materially different Red decision and should return to Matthew; Pam is warranted only if Matthew wants to consider that novel unsafe branch.

---

## Summary

**Headline:** REVISE. The Physician is a justified new lane head, but the current pack gives a scheduled agent broader Airtable and thread reach than its prose admits, uses an append-only ledger that cannot represent its own lifecycle, and requires grades and rubric actions without sufficient evidence or tool support.

**Matthew’s move:** None yet. The Proposer should produce the bounded V2 and generated machine artifacts, then return only those deltas for re-clearance. Matthew’s attention should be spent only on the final credential/unattended-write grant, any unavoidable rubric-pin action, and later canon promotion; every other check is mechanical.
