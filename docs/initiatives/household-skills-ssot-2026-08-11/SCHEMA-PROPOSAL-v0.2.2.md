# Household Skills SSOT — Schema Proposal V0.2.2 (Challenger-repaired)

**Decision ID:** `RUTH-SKILLS-SSOT-2026-08-11-v0.2.2`  
**Status:** Awaiting Matthew signature  
**Supersedes:** `RUTH-SKILLS-SSOT-2026-08-11-v0.2.1` (signed; Challenger **REVISE** on delta-pass)  
**Challenger:** bc64b7dd-74bb-4b90-90b4-1b8ab39a7fad  
**Route:** B — expanded Build pen (unchanged direction)

## What changed from V2.1 (two bounded repairs only)

1. **Full pre-mutation schema assertion restored** — every Skills field id/name/type, Provenance choice IDs, Household Members → `tblJ70qtHUc1dUHhi`, Minions → `tbl6aVm9rgWoOBVfd`, plus all V2.1 checks. Fixture: `schemaDriftAbortBeforeMutation`.
2. **Exact normalised-slug recipe** declared in the manifest:
   - NFKC → casefold → non `[a-z0-9]` runs → `-` → strip ends  
   - Collision domain: payload ∪ live Skills rows  
   - Every payload `idempotencyKey` must equal the computed slug (verified 63/63 against current seed)

## Unchanged

- Target, 63-row `seed-payload-v0.2.json`, Category/Created By/Description/junk-delete job  
- No outbound sync; no Approved-Canonical  
- Pen v2.2 still required before Executor

## Artifacts

| File | Role |
|---|---|
| `typed-manifest-v0.2.2.json` | Machine manifest |
| `EXPANDED-BUILD-PEN-DELTA-v0.2.2.md` | Pen delta |
| `seed-payload-v0.2.json` | Frozen seed (unchanged) |

**Hashes:**
- Manifest canonical: `f940fa18920a54fec570ce39008be2b577a37829b1f4e8992b930b2497cbb838`
- Manifest raw: `4209b1049a379cc8c23a2af42aff4189f6f8ebcff866572d4c2b958042adf7ed`
- Seed raw: `0cdee9e338fc4458887592e016ee49e611eca4cc3a31cc6a116caece607a114e`
- Pen delta raw: `0bc27d1735e4cc152b09d75feee2cb85e04d07fd7774e48d4db2f6e15e96e407`

## Signature ask

> Signed: RUTH-SKILLS-SSOT-2026-08-11-v0.2.2 — proceed to Build Challenger

V2.1 signature does **not** authorise V0.2.2. After sign: Challenger delta-pass only. Executor only after PROCEED + pen v2.2 fixture-green.
