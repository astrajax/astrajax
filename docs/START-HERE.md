# START HERE

**This is the front door to AstraJax context. Read this first.**

If you are an AI agent or a new chat working on AstraJax, load this file before anything else. It tells you what is current truth, what is working material, and what to ignore.

---

## The two systems (do not confuse them)

AstraJax context lives in two distinct places. Mixing them is the main cause of confusion.

| System | Location | What it is |
|--------|----------|------------|
| **Business brain** | Brain Registry → System Brains (https://airtable.com/appbdTVHevH6Bl5ZZ/tblAUtpgSjtKf3BBr); Household Register → Estate Bases (https://airtable.com/appPrpfvsAr71RPP3/tblWygUeD4Qo8vq4s) | Look up the context, then go to the trusted base that row names. Estate Bases maps which physical Airtable base is which. |
| **Clive context-engine** | `docs/context/` | The live operational machinery for Clive's Man's context workflows: intake, curation, quarantine, publish-prep, and source registry upkeep. Operator walkthrough: `docs/context/clive-man-context-flow.md`. The old Intake, Curator, Publisher, and Scanner agents are retired as active owners; their duties now sit inside Clive's Man. Governed by Airtable + the source registry. **Do not treat as business positioning. Do not restructure without care — live agents read it.** |

---

## Leftover business docs (`docs/business/`)

These Origin files are leftover copies, not living truth. Living notes are in the trusted brain the register names, not a hardcoded Chapter 1 table. Physical bases are mapped in Household Register → Estate Bases. This list is a map of leftovers so people can find them until they move. If a leftover disagrees with the trusted brain, the leftover does not win.

- `positioning.md` — what AstraJax is, who it is for, offers, proof, claim-control.
- `internal-brief.md` — internal priorities, ownership, launch rules, and AI guardrails (not public positioning).
- `brand-colours.md` — visual identity palette (Nocturne Orchard).
- `architecture.md` — how the product works: agent roles, user brain, brain maturity, Doc routing. **Also:** Creative Trusted Brain home for visual doctrine + media catalogue (§ Airtable).
- `how-we-work.md` — how the company runs (Cursor as Doc, creative specialists, agent-first).
- `one-pager.md` — the short marketing version (product).
- `investor-one-pager.md` — external investor narrative (company thesis, labour model, proof).
- `proof.md` — the evidence locker (Butternut build, fleet, validation).

## Working / time-boxed (`docs/initiatives/`)

Active initiatives that **point at** leftover Origin docs — they never copy them.

- `aie-2026-07.md` — the AI Engineer World's Fair sprint brain: story, scope, do-not-build list (retires after 2 July 2026).
- `aie-build-plan.md` — the day-by-day build plan for the AIE sprint (23 June to 2 July).
- `chapter1-context-structure.md` — Chapter 1 canonical operator profile, brain themes, categories, onboarding disclosure levels (29 Jun 2026).
- `source-document-mining.md` — Clive's Man V1: Workshop Source Documents → summarise → propose Draft Brain Truth (Pam gates, 29 Jun 2026).
- `brain-key-schema.md` — Airtable table/field blueprint (includes Trusted Creative + **Media Assets**).
- `brain-key-wiring.md` — Brain Key access model; live IDs in `website/src/lib/brains/airtable-ids.ts`.
- `tara-lee-visual-brief.md` — visual brief for the founding cast.
- `character-provenance.md` — character rationale, life goals, and design decisions (founding cast).
- `doc-minions.md` — Doc (`@doc`) triages build work to minions (Airtable, Vercel).
- `build-velocity-tracks.md` — one-track factory roadmap (Doc twins, tiers, handoff, job queue, generator, digests).
- `hyperagent-handoff-contract.md` — HyperAgent import/on-platform handoff lanes.

**Creative media home (do not invent a second one):** Trusted Brain slug `creative` → Airtable **Media Assets** + Vercel Blob for bytes. Governance sentence lives in `architecture.md`; field shapes in `brain-key-schema.md`.

## Archive (`docs/archive/`)

Superseded material. **Not truth.** Kept for history and provenance only. Never brief agents from here.

---

## The rules that keep this clean

1. **Leftover Origin essays do not win.** Living notes are in Airtable. If a leftover in `docs/business/` disagrees with the trusted brain, do not treat the leftover as current and do not create a second Origin copy.
2. **Version with git, not filenames.** No `_v2`, `_STRONG`, or dates in live filenames. Git holds history. Anything version- or date-suffixed belongs in `docs/archive/`.
3. **Three states only:** leftover (`business/`) → working (`initiatives/`) → archive. Leftover essays do not drive agents. Living business notes are in Airtable.
4. **Downloads is never source of truth.** It is a scratchpad. Living business truth lives in Airtable; find the trusted brain via the Brain Registry and the physical base via the Household Register. Origin holds code + this door sign.
5. **New material gets a home on arrival.** Decide canonical / working / archive immediately. Do not let loose files pile up at the repo root.

> **These rules are enforced.** They live as always-on Cursor rules in `.cursor/rules/`: `context-structure.mdc` (this discipline), `model-routing.mdc` (right model/tool for the job), and `pam-check.mdc` (sceptical pass before high-stakes calls). Every chat and agent in this repo loads them automatically — keep this file and those rules in sync.

---

## One-screen summary of the business

```text
AstraJax helps domain experts build the brain and shape the fleet.

Clive reasons.
Pam challenges.
Humans decide.
Doc acts.
Composer/Cursor builds what Doc proposed.
HyperAgent runs deployed agents.

The brain matures. The team gets coached. The agents get better.
Better context lowers cost.

This is AI adoption for people who know the work, not developers.
```
