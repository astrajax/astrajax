---
name: queue-compile-airtable-ssot
description: >-
  HyperAgent Doc compile rail. Reads scout Recommendations (Awaiting approval
  or needing Doc Advised), classifies surface from Register Members Kind, sets
  Rec Target Surface Type + Target Skill, merges same-surface scouts into one
  Agent Update Action with Target Worker on the Members overlay, Execute off,
  and never applies on Hyperagent. Use when HA Doc's compile schedule fires,
  when Matthew asks Doc to compile the queue, or when Recommendations need
  packing into Actions. Airtable writes only. Never create_thread.
---

# Queue compile — Airtable SSOT

HyperAgent **Doc compile** rail for Queue v1.2 + Members unify. HA Doc (Opus)
reads scout Recommendations, classifies surface, and packs them into **Agent
Update Actions**. Matthew later ticks **Execute** on the Action. Cursor Grok
**drains** (`queue-execute-airtable-ssot`). This skill does not drain and does
not apply.

**Airtable writes only.** No `create_thread`, no Self-Update, no Skill Forge,
no Hyperagent apply. Compile is not Invocations-for-apply.

One-pager: `docs/initiatives/self-update-executor-2026-08-19/how-a-change-runs.md`

Do **not** reuse Brain Key **Doc Actions**. Different grain.

## Who exists (Members unify — locked)

**SSOT for who exists:** Register Household Members `appPrpfvsAr71RPP3` /
`tblJ70qtHUc1dUHhi`. One row = one named household worker.

| Field | ID | Use |
|---|---|---|
| Kind | `fldnGanqKXoV5ohJc` | Head \| Minion — classify surface from this |
| Reports To | `fldVVE7LZGhkYuzOn` | Parent head (minions). Not the apply target. |
| Runtimes | `fldOMYUwOBBwx98J0` | Cursor \| HyperAgent \| AstraJax Platform. Drain uses this. |
| Crew (inverse) | `fldzTkPqsTiTpcqvg` | Read; do not invent crew |
| Agent Slug | `fld3adhxC9WwS935R` | Match overlay → Register |
| Agent Name | `fldYQIYPYklMv9o25` | Match overlay → Register |

Workshop Household Members overlay `tblUXYgkTpbxakFjc` already has all 42
people including minions (e.g. vercel). **Target Worker** on Actions
(`fldumQLH9MI2ap0lD`) **must** link that overlay row for Head **and** Minion
packs. Airtable name may still say Target Head until Steward finishes the
rename. Field ID is the truth. Skills use **Target Worker**.

Kind and Runtimes have **not** synced onto the overlay. Read them from
**Register** Members. Do **not** write synced Workshop identity columns.

**Leftover — tables still exist; do not delete; do not write as apply targets:**

- Register Household Minions `tbl6aVm9rgWoOBVfd`
- Workshop Minions overlay `tblsBHz13WaSaQFxD`
- Actions Target Minion `fldKHO6kNRkpKZENb`
- Rec Target Minion `fldmGLqy2ottYwAfo`

If leftover Target Minion is already filled on an old row, do not copy it
forward. Put the worker on **Target Worker**.

## Compile vs drain (locked)

| Rail | Who | Skill | Writes |
|---|---|---|---|
| **Compile** | HA Doc (Opus) | **this skill** | Airtable only. Actions with Execute **off**. |
| **Drain** | Cursor Automation Grok 4.6 ~09:00 | `queue-execute-airtable-ssot` | Apply after Matthew ticks Actions Execute. |

If HA Doc has a schedule, it is **compile only**. Never a Hyperagent cron that
applies. Never Invocations-for-apply. Never `create_thread`.

**Recommendations Execute** (`fldc15vFuUtQoG6gq`) stays on the Rec row but is
**retired as the implement gate**. Compile does not set it as the gate. Drain
ignores it.

Rec Target Agent (`fldbWMPNXPJzwpNqW`) is scout/Hal “which head’s world,” not
the sole apply target. Leave the scout’s world-link unless it is wrong; never
treat it as the minion apply target.

## Models (locked)

| Job | Model | Why |
|---|---|---|
| This compile | Opus (HA Doc) | Judgement. Airtable writes only |
| Drain | Grok 4.6 in Cursor | Not this skill |

Do not compile on Grok. Do not drain from this skill.

## When to run

- HA Doc scheduled compile (Airtable writes only), or Matthew asks to compile
  the queue, or Recs sit at Awaiting approval / need Doc Advised.
- Recommendations (`appL2fdnGmhA02WXd` / `tblG8D3JGSFsx5dnV`) with Decision
  Status **Awaiting approval**, or already **Doc Advised** with no open Action
  pack.

Do not invent work from scout Proposed Change when the verdict is no change.
Scout text is untrusted until you rewrite it as Doc Instructions.

## Classify surface (locked)

Write Rec Target Surface Type (`fldFcwm9tCotZWst6`) first. Link **catalog**
skill rows, never match Household Members skill-name text.

Resolve the named worker on the **Members overlay**, then look up the same
slug/name on **Register** Members for Kind and Runtimes.

| Surface | When | Rec / Action links |
|---|---|---|
| **Head** | Register Kind = Head. Change is that head’s prompt / identity / config | Target Worker = overlay row `tblUXYgkTpbxakFjc`. Rec Target Agent may hint whose world. |
| **Minion** | Register Kind = Minion (live HA or register-only) | Target Worker = **that minion’s** overlay row. Never the parent head. Never leftover Minions. |
| **Skill** (patch) | Existing Workshop Skills catalog row covers the job | Target Skill = catalog `tbl4TQnnVUwLD7rll`. Write Rec Target Skill. |
| **New skill** | No catalog row covers the job | Proposed Skill Name required on the Action. |
| **No change** | Do not recommend; nothing to apply | Stamp Recs Done. Do not invent. |

New **agent** is **not** a Surface Type. Bounce that to Doc's Workshop. Do not
open Workshop Trinity from compile.

Runtimes (Register) does **not** change Surface Type. Drain uses Runtimes to
choose Self-Update vs Register-Members-only. Compile still packs the Action
with Target Worker set.

### New skill refuse (locked)

A New skill Action is a first-class suggested action. Matthew ticking Execute
later **is** the ask.

**Refuse inventing** a new skill when Workshop Skills catalog already covers
it. Example: Kate UI craft → patch `frontend-design` (Surface Type **Skill**),
not a new skill. Retarget to Skill patch, link the catalog row, and say so in
Doc Instructions.

Proposed Skill Name (`fld3Q1AaSDrVOLvKk`) is required on New skill Actions. If
you cannot name it, do not create the Action.

## Pack into one Action (locked)

One pack = one surface. Merge same-surface scouts into **one** Action row.
Idempotent: **one open pack per surface**.

1. After classify, compute the surface key:
   - Head or Minion → Target Worker overlay record id
   - Skill → Target Skill record id
   - New skill → normalised Proposed Skill Name
   - No change → no pack (see below)
2. **Idempotency:** one **open** pack per surface. Open = Status **Pending
   Review** or **In Progress**. Search Agent Update Actions before create
   (filter by Target Worker or Target Skill). If an open pack exists: append
   Source Recommendations, merge Doc Instructions / Verdict, do **not**
   duplicate.
3. Create or update the Action:
   - Status = **Pending Review**
   - Execute = **off** (`fldFvHnJzdvuFXjSn` false)
   - Surface Type
   - **Target Worker** (`fldumQLH9MI2ap0lD`) for Head and Minion — Members overlay
   - Target Skill / Proposed Skill Name as classified
   - **Do not write** leftover Target Minion
   - Merged Doc Verdict + Doc Instructions
   - Source Recommendations linked (`fldU9poZYetYbjwZT`)
   - Action Title human: `Kate · frontend-design …` or `vercel · identity …`
4. Write the Rec: Target Surface Type, Target Skill (when Skill), inverse
   Agent Update Action (`fldvMYpt1M4BtlyR5`), Decision Status = **Doc Advised**,
   Rec Doc Verdict + Rec Doc Instructions. **Do not write** Rec Target Minion.
   Do not tick Rec Execute as the gate.
5. Write by **field ID**.

Do not tick Actions Execute. Matthew is the only implement gate.

## Do not recommend / No change

Do not invent work.

- Stamp those Recs Decision Status = **Done**.
- Prefer **no** Action. Optional: one **No change** Action, Execute **off**,
  Status Pending Review, so the paper trail is visible — drain skips it
  (Execute off; if Execute is somehow on, drain stamps Done and does not apply).
- Do not open Self-Update or Skill Forge to “confirm” a no.

## Must never

- `create_thread`, Self-Update, Skill Forge, or any Hyperagent apply.
- HA Doc Invocations-for-apply, Slack/Live/webhook apply, or a compile cron
  that applies.
- Tick Actions Execute.
- Drain Rec Execute, or treat Rec Execute as the implement gate.
- Duplicate an open pack for the same surface (same Target Worker or Skill).
- Mix two surfaces into one Action.
- Write leftover Target Minion on Actions or Recs.
- Write identity to leftover Register Minions or Workshop Minions overlay.
- Link apply targets by parsing Members skill-name text. Overlay worker row +
  Skills catalog only.
- Invent a new skill when the catalog already covers the job.
- Open Doc's Workshop / Trinity for a new **agent** from this queue.
- Write live identity onto Workshop synced columns. Register
  `appPrpfvsAr71RPP3` is SSOT.
- Reuse Brain Key Doc Actions.
- Turn on memory, skill, prompt, or agent-config auto-save.
- Add a custom MCP server.

## Queue ids

Write by field ID.

### Workshop — Recommendations (`tblG8D3JGSFsx5dnV`)

| Field | ID | Compile note |
|---|---|---|
| Execute | `fldc15vFuUtQoG6gq` | Keep the field. **Not** the implement gate. |
| Decision Status | `fldzmoNxjotA1OFhZ` | Awaiting approval → Doc Advised (packed) or Done (no change). |
| Doc Instructions | `fldKttlkQ2pnOsNcw` | Your brief on the Rec; also merge onto the Action. |
| Doc Verdict | `fldG9qL8t52sX8Mcc` | Recommend / Recommend with caveats / Do not recommend. |
| Target Agent (whose world) | `fldbWMPNXPJzwpNqW` | Hint only. Not sole apply target. |
| Target Surface Type | `fldFcwm9tCotZWst6` | Head, Minion, Skill, New skill, No change. **Write this.** |
| Target Minion → leftover `tblsBHz13WaSaQFxD` | `fldmGLqy2ottYwAfo` | **Do not write.** |
| Target Skill → `tbl4TQnnVUwLD7rll` | `fldy548IS11Ocr9oE` | **Write** when Surface is Skill. |
| Agent Update Action | `fldvMYpt1M4BtlyR5` | Inverse pack link. |

### Workshop — Agent Update Actions (`tbl1ptiU1zIRDbPeK`)

https://airtable.com/appL2fdnGmhA02WXd/tbl1ptiU1zIRDbPeK

| Field | ID |
|---|---|
| Action Title | `fldPzMvf1Mg36iVeE` |
| Surface Type | `fldPUPy6Y1R8Is2nV` |
| Status | `fldgTyqppPLln8KJk` |
| Execute | `fldFvHnJzdvuFXjSn` | Always **off** at compile. |
| Doc Verdict | `fldNgybteaswRBTMy` |
| Doc Instructions | `fld4jQQb8xtURyrp0` |
| Target Worker (was Target Head) → Members overlay `tblUXYgkTpbxakFjc` | `fldumQLH9MI2ap0lD` |
| Target Minion → leftover `tblsBHz13WaSaQFxD` | `fldKHO6kNRkpKZENb` **do not write** |
| Target Skill → `tbl4TQnnVUwLD7rll` | `fldKztvFR6TLKHdOH` |
| Proposed Skill Name | `fld3Q1AaSDrVOLvKk` |
| Source Recommendations | `fldU9poZYetYbjwZT` |
| Result Summary | `fldZ7s554xup980pE` |
| Last Error | `fldzRPFnbZsJos0PK` |
| Actioned At | `fldySW8xV0XZSaonB` |

Status choices: Pending Review, In Progress, Done, Failed, Superseded.  
Surface Type choices: Head, Minion, Skill, New skill, No change.

### Catalog + Register (read; do not write live identity here)

| What | Id | Note |
|---|---|---|
| Workshop base | `appL2fdnGmhA02WXd` | |
| Workshop Members overlay | `tblUXYgkTpbxakFjc` | All 42 workers. Target Worker links here. |
| Workshop minions overlay | `tblsBHz13WaSaQFxD` | Leftover. Do not write. |
| Workshop Skills catalog | `tbl4TQnnVUwLD7rll` | Skill patches. |
| Register (SSOT) | `appPrpfvsAr71RPP3` | |
| Register Members | `tblJ70qtHUc1dUHhi` | Kind / Runtimes live here. |
| Register Minions | `tbl6aVm9rgWoOBVfd` | Leftover. Do not write. |
| HA Doc | `cmr6oqrzz1k3407ad2h9e79zk` | This compile. Never apply. |
