# Household Skills SSOT — Schema Proposal V2.1 (Challenger-repaired)

**Decision ID:** `RUTH-SKILLS-SSOT-2026-08-11-v0.2.1`  
**Status:** Awaiting Matthew signature  
**Supersedes:** `RUTH-SKILLS-SSOT-2026-08-11-v0.2` (signed; Challenger **REVISE**)  
**Challenger:** e9f5bd8a-2465-4535-9b44-00d8b311f7c6  
**Route:** B — expanded Build pen (unchanged direction)

## What changed from V2 (repairs only — no scope expansion)

1. Manifest ↔ pen compiler alignment (`recordIds[]`, `createRecordsIdempotent`, declared accepted keys; pen validates its own version — no phantom `gates.expandedPenVersion`).
2. Stronger preflight: Status Active ID; junk Category/Created By empty; 14 member IDs present; old choices must have zero usage.
3. Created By: **preserve** Agent (`selz1Q5BS74IVKPi7`); remove Human; add Matthew + System.
4. Retry-safe skips for exact partial progress; abort mixed states.
5. Normalised-slug uniqueness enforced.
6. Kill criterion renamed: `anyExistingRecordUpdate` (schema PATCH allowed; record updates forbidden).
7. Pen-delta bytes hash-bound in manifest (`EXPANDED-BUILD-PEN-DELTA-v0.2.1.md`).
8. Required fixtures listed (including disposable-base choice-removal test).

## Unchanged job

- Target: `appPrpfvsAr71RPP3` / Skills `tblAIXtDBBMrLuEYc`
- Description field; rename Category (AI) → Suggested Category (AI)
- Category → Operational / Reference / Tooling / Other
- Delete junk `recgFOHJ58ckFEUIr`
- Seed **same** 63-row payload (`seed-payload-v0.2.json`, hashes unchanged)
- No outbound sync; no Approved-Canonical

## Artifacts

| File | Role |
|---|---|
| `typed-manifest-v0.2.1.json` | Machine manifest |
| `seed-payload-v0.2.json` | Frozen seed (unchanged) |
| `EXPANDED-BUILD-PEN-DELTA-v0.2.1.md` | Pen delta (repaired) |

**Hashes:**
- Manifest canonical: `aa913a047de661b8c8a472da6e1e4a7d488ede034280a5006106305a24525c04`
- Manifest raw: `a3d50142832cf01fdd5174353803c1fe69d12bf38b0579d2de1361c2e12710b9`
- Seed raw: `0cdee9e338fc4458887592e016ee49e611eca4cc3a31cc6a116caece607a114e`
- Pen delta raw: `0595115437c3c774e2a859c6b8df0d16288ea8c84219d5df0eab04e801783fbb`

## Signature ask

> Signed: RUTH-SKILLS-SSOT-2026-08-11-v0.2.1 — proceed to Build Challenger

V2 signature does **not** authorise V2.1. After sign: Challenger again (delta pass). Executor still needs pen v2.2 fixture-green.
