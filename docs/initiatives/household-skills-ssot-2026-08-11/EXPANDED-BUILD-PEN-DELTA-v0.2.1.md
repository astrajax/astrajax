# Expanded Ruth Build Pen — capability delta v0.2.1

**Status:** Proposed (Challenger-repaired successor to v0.2 delta)  
**Baseline pen:** ruth-build-execution-pen v2.1.0  
**Proposed pen:** v2.2.0-skills-ssot  
**Decision:** RUTH-SKILLS-SSOT-2026-08-11-v0.2.1  
**Repairs source:** Build Challenger e9f5bd8a-2465-4535-9b44-00d8b311f7c6

## Deltas vs v2.1.0 (same intent as v0.2, compiler-aligned)

### New accepted sections / ops
- `existingFieldOps`: `createField`, `renameField`, `replaceSingleSelectChoices` (modes: `fullReplaceUnused`, `preserveNamedChoicesById`)
- `recordDeletes`: exact `recordIds[]` only; cap 1; `idempotentIfAlreadyAbsent`
- `seedRecords.op = createRecordsIdempotent`: payload-hash-bound; Skill Name + normalised-slug uniqueness; skip/abort rules; **zero record updates**

### Scope fence
- `seedRecords` / `recordDeletes` allowed only when pen self-reports version ≥ `2.2.0-skills-ssot` and decisionId allowlisted
- `mutateExistingRecords` remains **false**
- Schema PATCH ops (field create/rename/select replace) are **not** classified as record updates
- `outboundSync` must be false

### Retry
- Accept exact original, exact final, or declared partial-progress skips only; abort mixed states

### Fixtures (must pass before live)
- partialFailureRetrySkips
- normalisedSlugCollisionAbort
- missingLinkTargetAbort
- occupiedOldChoiceAbort
- capBreachAbort
- final63Readback
- disposableBaseChoiceRemovalIntegration

### Still forbidden
Writes outside appPrpfvsAr71RPP3; Approved-Canonical; outbound sync; bulk delete by formula; silent overwrite on name collision; secrets in cells.
