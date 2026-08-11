# Expanded Ruth Build Pen — capability delta v0.2.2

**Status:** Proposed (Challenger-repaired successor to v0.2.1)  
**Baseline pen:** ruth-build-execution-pen v2.1.0  
**Proposed pen:** v2.2.0-skills-ssot  
**Decision:** RUTH-SKILLS-SSOT-2026-08-11-v0.2.2  
**Repairs source:** Build Challenger bc64b7dd-74bb-4b90-90b4-1b8ab39a7fad

## Carries forward from v0.2.1

All v0.2.1 ops remain: `existingFieldOps` (createField / renameField / replaceSingleSelectChoices), `recordDeletes` with `recordIds[]`, `createRecordsIdempotent`, retry skips, fixtures list, outboundSync false, mutateExistingRecords false.

## New in v0.2.2 (bounded)

### 1. Full pre-mutation Skills schema assertion
Before any mutation, assert every Skills field id/name/type listed in the typed manifest `beforeState.requiredTables[0].fields`, including:
- Provenance Status required choice IDs (Pending / Approved-Canonical / Rejected)
- Household Members link target `tblJ70qtHUc1dUHhi`
- Minions link target `tbl6aVm9rgWoOBVfd`
Plus all v0.2.1 additions (junk emptiness, Active status ID, member IDs, zero usage of choices to remove).
Fixture: `schemaDriftAbortBeforeMutation`.

### 2. Exact normalised-slug recipe
```
normalised_slug(name):
  1. Unicode NFKC
  2. casefold()
  3. replace each run of characters outside [a-z0-9] with a single "-"
  4. strip leading/trailing "-"
```
Collision domain: **payload rows ∪ existing live Skills rows** (by Skill Name and by normalised slug).  
Every payload `idempotencyKey` MUST equal `normalised_slug(Skill Name)` or abort at compile/preflight.  
Fixtures: case, punctuation, and Unicode NFKC collision aborts.

### Still forbidden
Writes outside appPrpfvsAr71RPP3; Approved-Canonical; outbound sync; bulk delete by formula; silent overwrite; secrets in cells.
