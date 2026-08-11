# Household Skills SSOT — Schema Proposal / Build Manifest V2

**Decision ID:** `RUTH-SKILLS-SSOT-2026-08-11-v0.2`  
**Status:** Awaiting Matthew signature (supersedes signed v0.1 for execution)  
**Route:** B — expanded Build pen  
**Lane:** Ruth Hadley (typed proposal only; no live writes)  
**Date:** 2026-08-11  
**Supersedes:** `RUTH-SKILLS-SSOT-2026-08-11-v0.1` (direction retained; execution shape replaced after Challenger ESCALATE)

## Target

| Object | ID |
|---|---|
| Base | Household Register `appPrpfvsAr71RPP3` |
| Table | Skills `tblAIXtDBBMrLuEYc` |
| Live link | https://airtable.com/appPrpfvsAr71RPP3/tblAIXtDBBMrLuEYc |
| Members table (links) | `tblJ70qtHUc1dUHhi` |

## Companion artifacts

| File | Role |
|---|---|
| `typed-manifest-v0.2.json` | Machine manifest for expanded pen |
| `seed-payload-v0.2.json` | Frozen 63-row seed (bound by hash) |
| `EXPANDED-BUILD-PEN-DELTA-v0.2.md` | Pen capability deltas vs v2.1.0 |
| `ha-skills-inventory.json` | Prior inventory notes |

**Seed payload hashes (file bytes as written):**
- raw SHA-256: `0cdee9e338fc4458887592e016ee49e611eca4cc3a31cc6a116caece607a114e`
- canonical SHA-256: `0120a510b5900394edd5980532b93953759cb3630aa47209fa6928c6ada4d1d6`

**Typed manifest hashes:**
- canonical (excl. `gates.proposalHash`): `349c3bf3070a805ce5dc3e67c41bcc88c9e48bc776d6badb3068750f3a05de70`
- raw file SHA-256: `cdfea793b3826013c0a8c06507ee619b7d691273fe98c93f6ffb0567bc2a31cb`

## Grain / SSOT (unchanged)

One Skills row = one reusable skill.  
Idempotency key = Skill Name (HA `data.name`); normalised slug used for collision checks.

## IN scope (this Amber job)

### Schema ops

1. **Create field** `Description` — `multilineText` on Skills (human short blurb).  
2. **Rename field** `Category (AI)` (`fldbPgOwCBOOLDTQw`) → `Suggested Category (AI)` (assist only; never SSOT).  
3. **Replace Category choices** on `fldKYnGJP0ESq7RKh` with exactly:  
   Operational / Reference / Tooling / Other  
   Before-state old choices (must match live):  
   `selTXk0RP3mYCoWzZ` Data & Research, `sel0RzBMOJ5i3Xd77` Content & Comms, `selofpMkxvdU0z48S` Integration / API, `selnXk3Fut0Hm6eol` Workflow / Ops, `selfkvzgjkV83uJnP` Utility.  
4. **Replace Created By choices** on `fldFs09KnfcIALY7G` with exactly:  
   Agent / Matthew / System  
   Before-state: `selz1Q5BS74IVKPi7` Agent, `selTlJa0tudd91PhW` Human (Human removed).  
5. Keep `Skill Summary (AI)` and `Suggested When to Use (AI)` as assist-only (no delete).  
6. **Script rule (data policy, not a field delete):** `Scripts / Repo Path` (`fldFDdSX9HcD3BMgI`) wins; `Script` (`fldTDoPCrvcws6IZu`) left empty on this seed (HA script bodies not inlined).

### Record ops

7. **Delete** junk row `recgFOHJ58ckFEUIr` only if Skill Name still equals `"Active"`.  
8. **Create 63** Pending seed rows from `seed-payload-v0.2.json`:  
   - Provenance Status = Pending (`seleMdbXKQSP9aZso`)  
   - Created By = System  
   - Status = Active  
   - Category per payload  
   - Household Members links only where payload lists exact member record IDs  

### Link policy baked into payload

| Policy | Count | Behaviour |
|---|---|---|
| Single confident member | 54 | Link that member record ID |
| Dual kate + milo (fal-*) | 3 | Link both |
| Household-shared standards | 4 | **No links** this job (Matthew can link later) |
| Owner deferred (delivery-control / rec-centre pens) | 2 | **No links** this job |

## OUT of scope

- Outbound sync Household → agent-base Skills  
- Any Approved-Canonical write  
- Skill Forge cutover automation  
- Seeding the 9 skills missing from the HA dump  
- Editing `architecture.md`  
- Fleet sync freeze lift  
- Writes outside `appPrpfvsAr71RPP3`

## Preconditions (must be true before Executor)

1. Expanded Build pen **v2.2.0-skills-ssot** (or successor) implemented per `EXPANDED-BUILD-PEN-DELTA-v0.2.md` and fixture-green.  
2. Matthew signature on **this V2** (fresh — v0.1 signature does not authorise V2).  
3. Build Challenger **PROCEED** on V2 (or PROCEED on Challenger-repaired successor that Matthew re-signs if material).  
4. External approval JSON bound to manifest + seed-payload hashes.  
5. Live beforeState matches typed manifest (Skills still only junk row, or empty of real skills; field IDs unchanged).

## Caps

| Cap | Value |
|---|---|
| Max record deletes | 1 |
| Max record creates | 63 |
| Max record updates | 0 |
| Bases writable | 1 (`appPrpfvsAr71RPP3`) |
| Tables mutated | 1 (`tblAIXtDBBMrLuEYc`) |

## Kill criteria

Abort if: wrong base; beforeState mismatch; junk row name ≠ Active; seed name collision with different content; any Approved-Canonical in payload; outbound sync attempted; pen version below expanded minimum; payload hash mismatch; >63 creates; any update op.

## Signature ask

Reply exactly:

> Signed: RUTH-SKILLS-SSOT-2026-08-11-v0.2 — proceed to Build Challenger

After signature: **yes — dispatch Build Challenger immediately** (process).  
Executor only after Challenger PROCEED + pen v2.2 ready + approval JSON.
