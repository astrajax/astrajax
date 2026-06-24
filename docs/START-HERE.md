# START HERE

**This is the front door to AstraJax context. Read this first.**

If you are an AI agent or a new chat working on AstraJax, load this file before anything else. It tells you what is current truth, what is working material, and what to ignore.

---

## The two systems (do not confuse them)

AstraJax context lives in two distinct places. Mixing them is the main cause of confusion.

| System | Location | What it is |
|--------|----------|------------|
| **Business brain** | `docs/business/` | The current AstraJax direction: what the business is, how the product works, how the company runs. **Start here for positioning, strategy, product, and pitch work.** |
| **Clive context-engine** | `docs/context/` | The live operational machinery for the Clive context-curation agents (Intake, Curator, Publisher, Scanner). Governed by Airtable + the source registry. **Do not treat as business positioning. Do not restructure without care — live agents read it.** |

---

## Canonical business docs (`docs/business/`)

These are the source of truth. One file per concept. If two docs disagree, these win.

- `positioning.md` — what AstraJax is, who it is for, offers, proof, claim-control.
- `internal-brief.md` — internal priorities, ownership, launch rules, and AI guardrails (not public positioning).
- `brand-colours.md` — visual identity palette (Nocturne Orchard).
- `architecture.md` — how the product works: agent roles, user brain, brain maturity, Doc routing.
- `how-we-work.md` — how the company runs (Cursor as Doc, creative specialists, agent-first).
- `one-pager.md` — the short marketing version (product).
- `investor-one-pager.md` — external investor narrative (company thesis, labour model, proof).
- `proof.md` — the evidence locker (Butternut build, fleet, validation).

## Working / time-boxed (`docs/initiatives/`)

Active initiatives that **point at** the canonical docs — they never copy them.

- `aie-2026-07.md` — the AI Engineer World's Fair sprint brain: story, scope, do-not-build list (retires after 2 July 2026).
- `aie-build-plan.md` — the day-by-day build plan for the AIE sprint (23 June to 2 July).
- `tara-lee-visual-brief.md` — visual brief for the founding cast.
- `character-provenance.md` — character rationale, life goals, and design decisions (founding cast).
- `doc-minions.md` — Doc (`@doc`) triages build work to minions (Airtable, Vercel).

## Archive (`docs/archive/`)

Superseded material. **Not truth.** Kept for history and provenance only. Never brief agents from here.

---

## The rules that keep this clean

1. **One canonical doc per concept.** If a concept already has a doc in `docs/business/`, edit it — do not create a second one.
2. **Version with git, not filenames.** No `_v2`, `_STRONG`, or dates in live filenames. Git holds history. Anything version- or date-suffixed belongs in `docs/archive/`.
3. **Three states only:** canonical (`business/`) → working (`initiatives/`) → archive. If it is not canonical, it does not drive agents.
4. **Downloads is never source of truth.** It is a scratchpad. Truth lives in the repo.
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
