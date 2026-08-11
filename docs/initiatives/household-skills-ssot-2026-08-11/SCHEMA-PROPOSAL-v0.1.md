# Household Skills SSOT — Schema Proposal v0.1

**Status:** Signed by Matthew 2026-08-11 — Build Challenger returned **ESCALATE** (see CHALLENGER-OUTCOME.md). Not cleared for Executor.  
**Lane:** Ruth Hadley (discovery / proposal only — no live writes)  
**Date:** 2026-08-11  
**Target base:** Household Register `appPrpfvsAr71RPP3`  
**Target table:** Skills `tblAIXtDBBMrLuEYc`  
**Live link:** https://airtable.com/appPrpfvsAr71RPP3/tblAIXtDBBMrLuEYc  
**Proposal ID (for signature):** `RUTH-SKILLS-SSOT-2026-08-11-v0.1`  
**Inventory artifact:** `docs/initiatives/household-skills-ssot-2026-08-11/ha-skills-inventory.json`

## Locked direction (Matthew, after Pam)

1. Household Skills is the skill SSOT; one-way sync to agent bases later.
2. Created By choices: **Agent / Matthew / System** (no TL).
3. Category taxonomy: **Operational / Reference / Tooling / Other** (Kathryn set).
4. Seed source: HyperAgent JSON dumps in Downloads (not Kathryn-only).
5. This Amber job: schema tidy + Pending seed only. **No fleet outbound sync. Freeze remains respected.**

## Grain

One Skills row is exactly **one reusable skill** (named capability package).  
Idempotency key: **Skill Name** as stable slug (from HA `data.name`, normalised).

## Scope of this Amber build (IN)

| # | Change | Notes |
|---|---|---|
| 1 | Replace Category choices with Operational / Reference / Tooling / Other | Retire old Household five |
| 2 | Replace Created By choices with Agent / Matthew / System | Drop Human; no TL |
| 3 | Ensure human **Description** field exists (multiline) | Map from HA `description`. If only Skill Summary (AI) exists today, add Description; do not treat AI as SSOT |
| 4 | Retire or demote **Category (AI)** | Prefer delete; else rename Suggested Category (AI) and never sync outbound |
| 5 | Keep or demote **Skill Summary (AI)** | Prefer keep as assist only; never seed SSOT from it |
| 6 | Keep **Suggested When to Use (AI)** as assist only | Human When to Use remains SSOT |
| 7 | Field rule: **Scripts / Repo Path** = pointer; **Script** = optional inline body only when no path | Path wins when both present. Seed: path from repo convention where known; Script body only if HA scripts present and no path |
| 8 | Delete junk row `recgFOHJ58ckFEUIr` ("Active") | Not a skill |
| 9 | Seed **63 unique** HA skills as Status=Proposed or Active (see seed plan), **Provenance Status=Pending**, Created By=System | No Approved-Canonical on seed |
| 10 | Link Household Members where mapping is confident | Flag unknowns / dual-links for Matthew |

## Out of scope (NOT in this Amber build)

- Fleet outbound sync Household → agent-base Skills
- Skill Forge cutover automation (human/config change; note as precondition)
- Cursor / HyperAgent generator emit from Household
- Promoting any seed row to Approved-Canonical
- Kathryn Airtable Skills as ongoing SSOT
- Architecture.md edit (Doc/Clive paper trail after signature — separate)

## Seed plan (Pending only)

**Source:** 64 files under Downloads → **63 unique skills** after dedupe.  
**Dropped duplicate:** `skill-astrajax-website-map (2).json` (older) → keep `(3).json`.

**Defaults per row**

| Field | Seed value |
|---|---|
| Skill Name | HA `data.name` (slug form preserved) |
| Description | HA `description` |
| When to Use | HA `whenToUse` |
| Documentation | HA `documentation` or `skillMdBody` |
| Category | Mapped Operational / Reference / Tooling / Other (see inventory `category_refined`) |
| Status | Active if HA skill is live export; else Proposed |
| Provenance Status | **Pending** |
| Created By | **System** (import). Later Forge writes = Agent; Matthew edits = Matthew |
| Scripts / Repo Path | Fill when a clear `.cursor/skills/<slug>/` or scripts path exists; else blank |
| Script | Only if HA `scripts[]` present and no repo path decided |
| Household Members | Per inventory `member_refined` (+ dual fal links kate+milo where noted) |
| Minions | Blank unless confidently known |

**Inventory headline**

| Metric | Count |
|---|---|
| Files listed | 64 |
| Missing files | 0 |
| Unique skills | 63 |
| Duplicates dropped | 1 |
| Missing required fields (name/desc/when/docs) | 0 |
| With scripts | 32 |
| With credentialSchema (api_key) | 21 |

**Category seed counts (refined)**

| Category | Count |
|---|---|
| Tooling | 31 |
| Operational | 17 |
| Reference | 15 |
| Other | 0 |

**Member link confidence**

| Bucket | Count | Notes |
|---|---|---|
| Confident single member | ~52 | Direct slug/tag map |
| Household-shared | 4 | Communication, Routing, Conduct, Activity Logging — link all heads that load them, or leave unlinked until Matthew picks policy |
| Investing-lane | 3 | investing-lane-doctrine + two eToro skills — confirm member records |
| Dual media (fal-*) | 3 | Recommend link **kate + milo-cadence** |
| Ask Matthew | delivery-control-build-pen, rec-centre-schema-pen | Tags span Ruth / Doc Workshop — pick owner |

**Known gaps in dump (not invented; flag only)**

Not in this Downloads set (were in Kathryn Airtable or repo earlier): e.g. `lazlo-marlowe-character-craft`, `lazlo-marlowe-airtable`, `clive-man` hub skill, `clive-man-challenger`, `advanced-image-techniques`, `hyperframes`, `hyperframes-cli`. **Do not fabricate.** Optional second seed if Matthew supplies more HA dumps.

## Validation / kill criteria for later Executor

- No Approved-Canonical written by import
- No outbound sync
- Junk row gone
- 63 rows idempotent on Skill Name (retry does not duplicate)
- Category choices exactly the four approved
- Created By choices exactly Agent / Matthew / System
- Readback report vs this proposal hash

## Signature ask

Matthew signs **`RUTH-SKILLS-SSOT-2026-08-11-v0.1`** by reply:

> Signed: RUTH-SKILLS-SSOT-2026-08-11-v0.1 — proceed to Build Challenger

Until that exact sign-off: **no Build Challenger, no Build Executor, no schema/data writes.**
