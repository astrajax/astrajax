# The Physician — Challenger Verdict v0.2
**Target path:** `agents/registry/hyperagent/bjornson/physician/challenger-verdict-v0.2.md`

## VERDICT: REVISE

Six findings are repaired or safely bounded, but **PHY-005 remains materially partial**: the proposed pre-card assertion layer includes facts that cannot be verified until after the agent is imported, and the checklist could save the agent in Auto mode before C-1 scope enforcement is proven.

## Review metadata

- **Pass:** Delta re-clearance only
- **Candidate:** `build-pack-v0.2.md`, SHA-256 `58b9065bb869399ea952cc3191a2988000e764443717e32be6989937bba41035`
- **Baseline:** `build-pack-v0.1.md` plus Challenger verdict v0.1
- **Repository baseline/current HEAD:** `63c871ca48e5f6716fa438f21a9a9ebd57323c4a`
- **Decision type:** New Hyperagent reasoning head
- **Runtime:** Interactive threads plus one paused weekly scheduled invocation
- **Proposer tier:** High until verification; Medium after structural gates
- **Challenger tier:** Same
- **Unchanged shape:** Not reopened

## Per-finding disposition

### PHY-001 — REPAIRED

- **Verification:** VERIFIED in artifact
- **Evidence:** Lines 22, 55, 62–70, 89–98, 149, 203–213, 283–287, 520, 527–528.
- Brain Workshop is excluded from the resource scope.
- Runtime writes are restricted to Consultation Events and Rounds Events in the Physician’s own base.
- Duty 4 now produces an `intake-candidate` event rather than writing Draft Brain Truth.
- ACC harvest preserves the Man family’s Trinity rather than bypassing its Executor contract.
- Structural-denial tests cover Workshop, Registry, another Agent base, Ward Roster and Persona tables.

The adaptation is better than my suggested direct Executor route: it respects the Executor’s own acceptance contract while adding no write surface or manual ferrying.

**Residual:** ACC harvest remains operationally unverified, but S-5 gives it a falsifiable limit of two ACC cycles and sends a lossy route back as a delta. That is correctly bounded.

**Confidence:** High.

### PHY-002 — REPAIRED

- **Verification:** VERIFIED in artifact; cross-agent scheduled visibility remains deliberately UNVERIFIED
- **Evidence:** Lines 74–77, 151–179, 224–262, 469–481, 493, 529, 549–553.
- Ward Roster is now the explicit source boundary.
- `threadStrategy = new` removes the nonexistent-target-thread defect.
- Caps are pre-emptive rather than retrospective.
- The $4 work cap reserves $1 for close-out.
- The first ambiguous write kills the round without retry.
- Trace references replace copied source content.
- The fictitious unread-digest signal is removed.
- Scheduled visibility must be proven before activation; failure degrades to eval history and curated feeds rather than widening the sweep.

**Acceptance remains:** S-3 must prove roster filtering under the scheduled identity before unpausing.

**Confidence:** High on the repair; runtime visibility remains appropriately unverified.

### PHY-003 — REPAIRED

- **Verification:** VERIFIED in artifact
- **Evidence:** Lines 24, 226–257, 412–418, 494–495, 530–531, 593–594.
- Started, Completed and Killed are append-only events.
- Only Completed advances the cursor.
- Consultation IDs are deterministic and checked before creation.
- Resolutions are child events rather than record mutation.
- Replay and crash tests directly exercise the two original failure cases.

**Minor implementation note:** the generator should define deterministic suffix allocation for same-day reruns. Existing search-before-create rules make this mechanical rather than a clearance defect.

**Confidence:** High.

### PHY-004 — REPAIRED

- **Verification:** VERIFIED in artifact
- **Evidence:** Lines 25, 74–77, 138–148, 183–201, 215–222, 291–293, 344–370, 398–418, 592.
- `Not Graded — insufficient evidence` is explicit.
- Adoption requires rubric/judge version, ladder mapping, evidence floor and baseline.
- Vitals are labelled Direct, Inferred or Unavailable.
- Rubric Suggestions ownership is removed.
- A staged backtest cannot be reported as executed.
- Missing pin/update actions are represented honestly as platform limitations.
- Concern/Urgent findings require corroboration or full-trace review.

**Minor repair:** line 76 refers to a nonexistent `§Manual load` section. Replace that reference and state that pin requests are batched in the digest, never sent as per-rubric interruptions. This adds no Matthew gate; it prevents the platform limitation from becoming drip-feed admin.

**Confidence:** High.

### PHY-005 — PARTIAL — BLOCKING

- **Verification:** VERIFIED defect in the revised artifact
- **Evidence:** Lines 501–528 and import order at 574–583.

The adaptation is sound in principle: generation remains in the Executor lane, deterministic checks replace an unnecessary full judgement pass, and deviations return here delta-only. The problem is that the twelve “pre-card” assertions mix two different classes of fact:

**Knowable from generated artifacts:**
- names and hashes;
- governed flags;
- embedded skill bodies;
- integration list;
- export tool flags;
- invocation declarations;
- forbidden IDs;
- model, effort and budget.

**Knowable only after import/configuration:**
- six skills actually resolving without duplicated fleet standards;
- imported schedule status and `threadStrategy`;
- live mode absence on the saved agent;
- runtime rubric/eval action availability;
- actual execution mode;
- Airtable `resourceScope` and `allowedTools` read-back.

The current sequence says the config card is emitted after all twelve assertions, but some assertions cannot run until that card has been saved. M-1 then saves before M-2 configures access, creating a possible interval where an Auto-mode agent holds the account-level Airtable surface before C-1 is proven.

That is precisely the machine-verification gap PHY-005 was meant to close.

#### Smallest V2.1 repair

Split the gate explicitly:

1. **Static artifact gate, before card emission**
   - Validate only export-observable fields and hashes.
   - Validate the three embedded skills.
   - Validate a manifest containing the three existing fleet-standard skill IDs; do not claim they have resolved yet.
   - Validate declared schedule shape, but not imported status.
   - Produce a machine-readable assertion report.

2. **Safe import state**
   - The first saved agent state is **Ask-first with Ward Rounds paused**, without exception.
   - Configure C-1 access and attach/resolve the three referenced skills.
   - No interactive Auto interval is permitted before read-back.

3. **Post-import gate**
   - Read back six resolved skills with no duplicates.
   - Read back resource scope and action restrictions.
   - Verify exact invocation surfaces, schedule status/strategy, execution mode and available rubric/eval actions.
   - Run structural-denial, roster-filter, replay and crash tests.
   - Only after all pass may the agent move from Ask-first to Auto and Ward Rounds later be unpaused.

4. **Failure branch**
   - Any mismatch leaves the agent Ask-first and paused and returns only the failed delta here.
   - No new Matthew decision unless the platform cannot enforce C-1.

This does create a possible second configuration confirmation if the UI cannot configure access before the initial save. The load is justified: it prevents an account-token Auto window. First determine whether Configure Access can be completed on the draft card; if so, no second click is needed.

**Confidence:** High.

### PHY-006 — PARTIAL — NON-BLOCKING BY ITSELF

- **Verification:** VERIFIED in artifact
- **Evidence:** Lines 323–370 and 430–466.
- The two rubric papers now support their attributed claims directly.
- Numeric feedback ranges and the two-correction priority rule are labelled heuristics.
- Primary research’s noise warning is carried into the operating rule.
- Concern/Urgent requires corroboration.

The remaining shortfall is narrower: Vitals & Tracking still cites an undifferentiated practitioner “corpus” for several claims rather than giving per-claim sources. Either attach a source to each material bullet or label the whole section explicitly as unverified practitioner synthesis. Do not describe it as fully per-claim sourced until then.

**Confidence:** High.

### PHY-007 — REPAIRED

- **Verification:** VERIFIED
- **Evidence:**
  - Current repository HEAD remains `63c871ca48e5f6716fa438f21a9a9ebd57323c4a`.
  - `website/src/lib/platform/court.ts:238` uses `Dr. Halvard Bjornson`.
  - `website/src/lib/platform/court-cast.ts:14` uses the same title.
  - Live Brain Registry still contains five rows and no Physician.
  - v0.2 corrects the earlier “zero mentions repo-wide” claim.

“Dr.” is therefore the freshest Matthew-merged repo evidence and is consistently specified across the candidate.

The live spawnable-roster claim was not independently rechecked in this delta, but the export and Registry collision questions are resolved.

**Confidence:** High for title and repository/Registry collision; medium for live roster absence.

## Verification ledger

### VERIFIED

- Candidate artifact received as a file with target path.
- Candidate SHA-256 recorded above.
- Repository HEAD remains the stated baseline.
- Court files use “Dr. Halvard Bjornson.”
- Brain Registry has five existing rows and no Physician.
- Brain Workshop appears only as an explicitly excluded scope in v0.2.
- Persistent sandbox is removed.
- Revised duty-4, event model, grading rule, runtime boundaries and assertion specification are present as cited.

### UNVERIFIED by design

- Exact Airtable per-base/per-action enforcement on the eventual agent.
- Cross-agent thread filtering under the scheduled identity.
- ACC harvest reliability.
- Imported schedule state and action surface.
- Skill-reference resolution without duplication.
- The future generated artifacts and assertion script.

These are acceptable unknowns only behind the repaired blocking gate.

### NOT CHECKED

- Unchanged role, mandate, duties, cadence, model choice, registry path and six-skill architecture.
- Live spawnable roster.
- ACC’s own schedule and access snapshots.
- Any future generated JSON or Python artifacts, because Phase B has not run.

## Trinity failure modes and governed defaults

| Failure mode | Delta result |
|---|---|
| Context mismatch | Clear, except the small practitioner-source gap in PHY-006 |
| Novelty suppression | Not reopened |
| Overloaded confidence | Improved: risk is now explicitly High until verified |
| Pattern lock | Clear: direct Executor routing was rejected where its contract did not fit |
| Manual gate overload | Mostly clear; batch rubric-pin requests rather than interrupting Matthew |
| Automation overreach | Not yet clear because initial import ordering can expose Auto before C-1 verification |

Governed defaults are correctly specified in prose. Machine verification remains pending and must use the split static/post-import gate above.

## Challenger V2.1 repair

The Proposer should make only these named deltas:

1. Split PHY-005 assertions into static pre-card assertions and post-import read-back tests.
2. Make Ask-first plus paused schedule the mandatory initial saved state.
3. Permit Auto only after C-1 read-back and denial tests pass.
4. Replace the dangling `§Manual load` reference and batch platform-limited pin asks in digests.
5. Add per-claim Vitals sources or label those bullets unverified practitioner synthesis.

No cleared design axis should move.

## Conditions for Matthew

**None at this stage.** These are Proposer/Executor mechanics and create no decision for Matthew. C-1 through C-4 remain the later single-approval conditions once the pack is re-cleared.

No Pam pass is warranted: this is bounded Workshop implementation, not novel Red-tier policy.

---

## Summary

**REVISE — the substantive safety redesign is strong, but PHY-005 is not fully closed.** The proposed pre-card assertion layer includes facts that only exist after import, while M-1 could save the agent in Auto before C-1 access restrictions are proven. PHY-006 also needs a small source-label correction.

**Matthew’s move:** none. Doc should issue a narrow v0.2.1: split static and post-import checks, make the first saved state Ask-first and paused, permit Auto only after access read-back and denial tests, batch rubric-pin asks, and correct the remaining practitioner-source language. Return only those deltas; no Pam review or extra Matthew gate.
