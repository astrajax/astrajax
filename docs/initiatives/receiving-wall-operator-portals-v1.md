# Receiving Wall — operator portals v1 (handover)

**Status:** Working. Matthew commissioned 13 Aug 2026.  
**Surface:** `/man/receiving-wall` — zoomed-in portal (`beat === "zoomedIn"`).  
**Owners:** Kate (scenic), Kathryn (look), Doc → Vercel minion (data/API).  
**Done when:** a v1 draft is on a preview URL / draft PR Matthew can click through. Not production-final. Not Trusted canon. Not a public-claims change.

Matthew’s gate: **none until that draft exists.** Do not pause for Phase A approval, taste sign-off, or a second “should we?”. Keep running. Show him the wall.

This is the **operator** home (AstraJax = command centre for operators). Matthew is the first person in the chair. Design for that chair, not a founder-only shed.

---

## Goal

The idle wall is a set of **portals** (doors into different jobs). Zooming in still uses the existing portal grammar: pinned arch, travelling bay, letter/ledger in the aperture — not a dashboard pasted on the painting.

v1 lets an operator:

1. See what needs judgement, and open a record.
2. See how the brains are.
3. Read this morning’s written reports (including the daily change summary).

It does **not** let anyone start Auditor, iterate Challenger, or run the drain. Clocks stay independent.

---

## Matthew’s three portals (required)

### 1. Judgement — drafts, auditor findings, routing to brains

**His words:** Auditor reports & Draft truths pending approval and routing to brains. He is unsure the current wall grouping is still right.

**Current (keep the room, change the organising principle):**

- Ledger groups **Draft Brain Truth** by **Proposed Category** (Business Definition, Positioning, …).
- Code: `website/src/lib/receiving-wall.ts`, `website/src/components/man/ReceivingWall.tsx`.
- Read: Workshop `appL2fdnGmhA02WXd` → Draft Brain Truth `tblswvXNYFDqnl6af`.
- Opened letter: provenance, Capture Source, category, destination brain (`System Brain Name` / slug), Accept, Discuss with Clive.

**Why that top level is stale:** the morning pipe now writes **Context Amendment Versions** first (`tblsuOKGjSGYv0Vov`, Stage V1 / V2). Executor then writes Draft. A 142-row Intake burst and a killed Auditor overflow **do not show on the wall** until they become drafts. Category is *what kind of truth*, not *what the operator must do*.

**v1 judgement portal — organise by job, not by category:**

| Bay section | Source | What the operator does |
|---|---|---|
| Needs a human | Draft Brain Truth still pending (today’s Accept path) | Read, discuss with Clive, Accept |
| Held / stuck | Amendment Versions with Challenger Verdict Held, or `Human Decision Needed` | Read why; no silent rewrite of V1 |
| This morning’s proposals | Recent V1 Proposed (Intake, Ambient, Auditor) not yet drafted | See the queue; do not execute |

Category and destination brain stay **on the opened letter**, and may still sort *inside* the pending-drafts section. They are not the doors on the idle wall.

Auditor **reports** (the written V1/V2 report bodies) live in Household Activity **Reports** (`tblFzWUIPSiIGZPln`). Those are portal 3, not a second Airtable home. The judgement portal shows the *work items*; the reports portal shows the *write-up*.

Keep **Discuss with Clive** and **Accept** on drafts. Do not add Start Auditor / Re-run Challenger.

### 2. Brain health

**His pointer:** `brand/system-assets/Brain Assets/` (happy / okay / unhappy / rotting / thriving stills + loops).

**Live site already serves the shrine from** `website/public/brain/shrine-*.mp4` (see `website/src/lib/platform/brains.ts`). Brand folder is the **master**; public paths are what the page plays. Do not hotlink the brand folder from the wall. Copy or Blob only if a new master must ship; prefer the existing shrine art.

**Current product cousin:** `/brain/health` redirects to `/brain/{slug}?tab=overview` (`BrainWorkspace` + shrine jars + `/api/brains/health`).

**v1 health portal:** zoomed bay shows the household’s brains as living shrine states (the jars / bands), not a table. One glance: which brains are thriving vs rotten. Click-through to the existing workspace is allowed; the portal itself must still feel like the wall, not a route hijack that dumps the operator into admin chrome.

Kathryn owns how health reads on the paint (band colour vs shrine loop). Kate implements. No new character art.

### 3. Daily change summary (and sibling reports)

**Example row (use as the canonical shape):**  
Household Activity `appF7jQD4ZKrDC7e1` → Reports `tblFzWUIPSiIGZPln` → `recSmDfozEz98ZTH2`  
Title: *Daily change summary — 13 Aug 2026*  
Agent slug: `summarize-changes-daily`  
Report type: **Handoff**  
Headline + Body already written for a human.

**v1 reports portal:** latest daily change summary as the opened “letter” (sill letter hotspot may land here). List recent reports of useful types in the bay — at least:

- Daily change summary (`summarize-changes-daily` / Handoff)
- Context Auditor V1 reports (same table; Amendment Versions already store `V1 Report URL` pointing here)
- Context Challenger V2 reports if present

Reports are create-only; revisions are new rows via Supersedes. Show the tip. Do not invent a second report store.

---

## Anything else? (in v1 vs later)

**In v1 (do these):**

- Idle wall = **portal doors**, not category plaques. Three doors matching the sections above.
- Same zoom grammar (`website/docs/receiving-wall-portal-spec.md`). Arch stays a frame.
- Seed/fallback if a token is missing — wall never blank (today’s seed pattern).
- Operator copy, not engineer field names. Matthew, not Matt. Teach one craft word if you use it (portal, ledger, bay).
- Paper trail on Accept stays.

**Out of v1 (do not build):**

- Buttons that start or iterate the morning machine.
- A new house room or a Clive’s-study book for this.
- Replacing `/brain/[slug]` — cousin, not rival.
- Spend, Ward Rounds, Ristral queue, fleet roster as their own doors.
- Production deploy, credential mint, HyperAgent schedule changes, Trusted promotion, public positioning claims.

---

## Craft and look (Kate + Kathryn)

Locked grammar: `website/docs/receiving-wall-portal-spec.md` (portal, dolly, pinned arch, travelling interior, sill). Chapter 1 pack only where the wall already cites it.

- Type stays incised into the paint. No SaaS cards, no neon, no mascot.
- Palette: `docs/business/brand-colours.md` (Nocturne Orchard).
- Kathryn: still direction and how three doors + health shrine read. She does not edit the repo. Kate implements. TL/Kathryn finish authority stands for *final* look; **v1 draft may ship to Matthew without waiting for a second human**. Mark working tints as working, as today’s category tints already do.
- No new full-scene painting. Layers, hotspots, ledger, letter, shrine loops you already have.
- Agent plates: if a cast still/video sits on parchment in this bay, full-perimeter deckle (`.cursor/rules/folio-agent-plate-deckle.mdc`). Prefer the wall’s own grammar over dropping a folio plate into the arch.

## Data and API (Doc → Vercel minion)

Hands: **Grok** (`cursor-grok-4.5-high-fast`), not a frontier head.

Extend or sibling the existing receiving-wall read. Do not use Airtable MCP in the browser. Server routes + scoped tokens, same pattern as `website/src/lib/brains/handlers/receiving-wall-records.ts`.

| Need | Where |
|---|---|
| Pending drafts | Workshop Draft Brain Truth (already wired) |
| V1 / Held queue | `tblsuOKGjSGYv0Vov` — Stage, Challenger Verdict, Human Decision Needed, Created By Agent, Reason, V1 Report URL |
| Reports | `tblFzWUIPSiIGZPln` — Title, Report Type, Agent Slug, Headline, Body, Period, Session |
| Brain health | existing `/api/brains/health` + `website/src/lib/platform/brain-health.ts` / shrine helpers |

If a PAT cannot read Amendments or Reports, degrade that bay with an honest empty/seed state. Do not mint tokens. Do not expand token scope in this job; if a read is impossible, show the gap on the wall and keep going.

`npx tsc --noEmit` in `website/`. Add or extend tests beside existing receiving-wall / brain-health tests. Do not run interactive `next lint`.

## Repo paths (start here)

- `website/src/components/man/ReceivingWall.tsx`
- `website/src/components/man/receiving-wall.module.css`
- `website/src/lib/receiving-wall.ts`
- `website/src/lib/brains/handlers/receiving-wall-records.ts`
- `website/src/app/api/brains/receiving-wall/`
- `website/docs/receiving-wall-portal-spec.md`
- `website/src/lib/platform/brains.ts`, `website/src/components/brain/BrainShrine.tsx`
- `website/src/lib/brains/airtable-ids.ts` (`BRAIN_WORKSHOP_TABLES.contextAmendments`)

## Conduct

- **Tier:** Amber, pre-cleared by Matthew for a **v1 draft only**.
- One job, one branch, one draft PR: `cursor/receiving-wall-operator-portals-f54c`.
- No production deploy. No Trusted writes. No schedule edits. No agent JSON imports.
- After the draft is clickable: Kate/Doc hand a Route 1 note to `@clive-man` (what shipped, what the wall still does not show). That is paper trail, not a gate.
- Stop when Matthew can zoom three portals and understand judgement / health / this morning. Then stop. Do not gold-plate.

## Provenance

Matthew, 13 Aug 2026, cloud agent thread after placing this work on the Receiving Wall (not Clive’s study). Pipe decision: independent clocks; Clive’s Man diagnoses, does not conduct. Wall is the operator manage-surface.
