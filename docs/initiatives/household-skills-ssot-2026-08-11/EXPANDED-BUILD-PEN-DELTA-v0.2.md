# Expanded Ruth Build Pen — capability delta (Route B)

**Status:** Proposed for Matthew authorisation (not implemented)  
**Baseline pen:** `ruth-build-execution-pen` **v2.1.0** (`build_pen_decl.py`)  
**Proposed pen version after Doc Workshop implements:** **v2.2.0-skills-ssot** (name TBD)  
**Engagement:** Household Register Skills SSOT — decision `RUTH-SKILLS-SSOT-2026-08-11-v0.2`  
**Author:** Ruth Hadley (proposal only — does not implement the pen)

## Why this exists

Matthew chose Route B: expand the governed Build pen so one Amber job can tidy Skills schema + delete the junk row + create 63 Pending seed rows. Current v2.1.0 **aborts** if `scope.seedRecords` is non-empty or `mutateExistingRecords` is true, and has no ops for select replacement, field rename, or record delete.

## Current v2.1.0 allows (relevant)

| Capability | Status in v2.1.0 |
|---|---|
| Create new fields on existing tables via `existingFieldExtensions` (new field, no pinned fieldId) | Allowed |
| `addSingleSelectChoice` (add-only; never remove) | Allowed |
| Create tables / formulas / links (greenfield) | Allowed |
| `seedRecords` | **Forbidden** (must be empty) |
| `mutateExistingRecords` | **Forbidden** (must be false) |
| Delete records | **Forbidden** |
| Replace / remove singleSelect choices | **Not supported** |
| Rename fields | **Not supported** |
| Delete fields | **Not supported** |

## Exact capability deltas required for V2 job

Add a **named engagement allowlist** (not open-ended power). Suggested new manifest sections / ops:

### A. `existingFieldOps` (new section)

| Op | Purpose for this job |
|---|---|
| `createField` | Add human `Description` (`multilineText`) on Skills if absent |
| `renameField` | Rename `Category (AI)` → `Suggested Category (AI)` (`fldbPgOwCBOOLDTQw`) — prefer rename over delete |
| `replaceSingleSelectChoices` | Exact choice set replace for Category (`fldKYnGJP0ESq7RKh`) and Created By (`fldFs09KnfcIALY7G`) with before-state choice IDs asserted |

**Hard fences for A:**
- Only on `target.baseId` + listed `tableId`/`fieldId`
- `replaceSingleSelectChoices` requires: before-state choice IDs match exactly; after-state names exactly as signed; unused old choices may be removed only when **zero records** use them (beforeState `recordCountMustEqual` for Skills junk-only or empty of those choice usages)
- No delete of `Skill Summary (AI)` or `Suggested When to Use (AI)` in this job (assist fields kept)

### B. `recordDeletes` (new section)

| Op | Purpose |
|---|---|
| `deleteRecords` | Delete exact record IDs listed |

**Hard fences for B:**
- Exact `recordIds[]` only — no filter-by-formula deletes
- Cap: **1** record for this engagement (`recgFOHJ58ckFEUIr`)
- beforeState must assert Skill Name == `"Active"` on that id

### C. `seedRecords` (lift fence; new compiler)

| Op | Purpose |
|---|---|
| `createRecordsIdempotent` | Create rows from signed payload artifact |

**Hard fences for C:**
- `scope.seedRecords` may be non-empty **only** when `gates.expandedPenVersion` ≥ declared minimum and `proposalDecisionId` is on an allowlist
- Idempotency: match on Skill Name (exact string from payload). Same name + same field values → skip. Same name + different values → **abort** (no silent overwrite)
- Cap: **63** creates (plus 0 updates)
- Forbidden field values: never write `Provenance Status` = `Approved-Canonical`; never write secrets/credential schema contents into cells
- Payload bound by hash: `seedPayloadRawSha256` + `seedPayloadCanonicalSha256` must match files on disk
- Member links: only record IDs listed in payload (already resolved)

### D. Scope fence changes (narrow)

v2.1.0 today:

```text
seedRecords must be empty
mutateExistingRecords must be false
```

v2.2.0-skills-ssot for this decision only:

```text
seedRecords: allowed when expanded gate + allowlisted decisionId
mutateExistingRecords: still FALSE (no general updates)
recordDeletes: allowed only via recordDeletes section with exact IDs + cap
select replacement: via existingFieldOps only
outbound sync / other bases: still forbidden
```

## Explicitly still forbidden

- Writes outside `appPrpfvsAr71RPP3`
- Outbound sync to agent bases
- Promoting Provenance to Approved-Canonical
- Automations / interfaces / external accounts / secrets in cells
- Bulk delete by view or formula
- Overwriting existing skill rows on name collision with different content
- Skill Forge cutover automation

## Implementation ownership

Ruth proposes; **Doc Workshop** (or pen maintainer Matthew names) implements pen v2.2.0. Ruth Build Executor runs only after:

1. Pen v2.2.0 exists and fixture-passes  
2. Typed manifest V2 signed + approval JSON  
3. Build Challenger **PROCEED** on V2  

## Acceptance fixtures (for pen implementer)

1. Fixture: replace select choices on empty-usage field → success  
2. Fixture: delete exact junk id with matching beforeState → success  
3. Fixture: 2-row idempotent seed; retry → 0 creates, 2 skips  
4. Fixture: name collision different Description → abort  
5. Fixture: attempt Approved-Canonical in seed → abort  
6. Fixture: seedRecords without expanded gate → abort (v2.1 behaviour preserved)
