---
name: queue-execute-airtable-ssot
description: >-
  Drains Agent Update Actions whose Execute checkbox is ticked and Status is
  Pending Review. A Cursor Automation (daily ~09:00, Grok 4.6) applies one
  surface per Action via hosted Hyperagent MCP: Head/Minion Self-Update on
  that Target Worker, skill patch via Register + Provenance webhook, new skill
  via Skill Forge create. Groups and serialises by Target Worker. Ignores
  Recommendations Execute and leftover Target Minion. Use when the daily
  automation fires, when Matthew ticks Execute on Actions, or when he says
  run the execute queue.
---

# Queue execute — Airtable SSOT

Cursor **drain** rail for Queue v1.2 + Members unify. HyperAgent Doc
**compiles** (Opus, Airtable writes only — `queue-compile-airtable-ssot`).
Matthew ticks **Execute** on **Agent Update Actions**. This skill implements.
It does not scout, and it does not compile packs.

This skill owns **the drain**. It does not re-invent persist.

- Head / live minion config → load **`self-update-executor`**. Persist stays
  `draft_save` + `resolve_approval`. One-pager:
  `docs/initiatives/self-update-executor-2026-08-19/how-a-change-runs.md`
- After verify, register **Household Members** (`tblJ70qtHUc1dUHhi`) for
  heads **and** minions. Never leftover Minions.
- Skill **patch** → write **Register Skills** + Skill Versions, Provenance
  Pending. Matthew sets **Approved-Canonical**. The Skill Forge webhook applies.
  Do **not** also run Skill Forge Executor on that pack.
- **New skill** → load **`skill-forge-executor`** for **create** only (Matthew
  ticking Execute on that Action **is** the ask).
- **No change** → stamp Done; do not invent work.

Hosted MCP is `user-hyperagent` (`https://hyperagent.com/api/mcp`). Not a custom
MCP server. Hosted MCP does not edit agent config. Auto-save flags stay **off**.

Do **not** reuse Brain Key **Doc Actions**. Different grain.

## Who exists (Members unify — locked)

**SSOT for who exists:** Register Household Members `appPrpfvsAr71RPP3` /
`tblJ70qtHUc1dUHhi`. One row = one named household worker.

| Field | ID | Use |
|---|---|---|
| Kind | `fldnGanqKXoV5ohJc` | Head \| Minion |
| Reports To | `fldVVE7LZGhkYuzOn` | Parent head (minions) |
| Runtimes | `fldOMYUwOBBwx98J0` | Cursor \| HyperAgent \| AstraJax Platform |
| Crew (inverse) | `fldzTkPqsTiTpcqvg` | Read; do not invent crew |
| Agent Slug | `fld3adhxC9WwS935R` | Resolve overlay → Register |
| Agent Name | `fldYQIYPYklMv9o25` | Resolve overlay → Register |
| System Prompt | `fldKKvps3FIAvJdhh` | Live identity after verify |

Workshop Household Members overlay `tblUXYgkTpbxakFjc` already has all 42
people (heads **and** minions, e.g. vercel). **Target Worker** on Actions
(`fldumQLH9MI2ap0lD`) links that overlay. Steward may still show the Airtable
name as Target Head — **field ID stays**. Skills use **Target Worker**.

Kind and Runtimes have **not** synced onto the overlay. When you need them,
read **Register** Members. Do **not** write synced Workshop identity columns.

**Leftover — tables still exist; do not delete; do not use as apply targets:**

- Register Household Minions `tbl6aVm9rgWoOBVfd`
- Workshop Minions overlay `tblsBHz13WaSaQFxD`
- Actions Target Minion `fldKHO6kNRkpKZENb` — **do not write**; **ignore** if filled
- Rec Target Minion `fldmGLqy2ottYwAfo` — **do not write**; **ignore** if filled

## Compile vs drain (locked)

| Rail | Who | Skill | Writes |
|---|---|---|---|
| **Compile** | HA Doc (Opus) | `queue-compile-airtable-ssot` | Airtable only. Packs Recs into Actions. Execute **off**. |
| **Drain** | Cursor Automation Grok 4.6 ~09:00 | **this skill** | Apply + register after verify. Reads Actions Execute + Status Pending Review. |

HA Doc must **never** apply on Hyperagent. Do not put this drain on a Hyperagent
Doc schedule or Invocations-for-apply. Self-Update refuses scheduled HA apply;
`draft_save` persist is a Cursor MCP step.

**Recommendations Execute** (`fldc15vFuUtQoG6gq`) is **retired as the implement
gate**. Drain **must ignore** it. Rec Target Agent (`fldbWMPNXPJzwpNqW`) is
scout/Hal “which head’s world,” not the sole apply target.

## Models (locked)

| Job | Model | Why |
|---|---|---|
| HA Doc compile (Verdict / Instructions / Action packs) | Opus | Judgement. Airtable only |
| Daily drain (Cursor Automation) | **Grok 4.6** | First-party. Hosted MCP persist lives in Cursor |
| Mechanical Airtable stamps after verify | **Composer 2.5** if it is grind-only | First-party |

Do **not** implement the drain on Opus. The **target** still applies **itself**
on whatever model that agent already uses. Cursor cannot silent-patch config.

## Daily Cursor Automation (the drain)

Ristral never invokes Doc; action waits on **Actions Execute**. The pull is this
Cursor Automation, not an HA Doc cron.

**When:** every day at ~09:00 (Matthew's local clock in the Automations editor).  
**Where:** Cursor Automations (Agents Window). Not Hyperagent Invocations.  
**Model:** Grok 4.6.  
**Tools the run needs:** Airtable (Actions + Recommendations + Register) and
Hyperagent hosted MCP (`https://hyperagent.com/api/mcp`). Local
`~/.cursor/mcp.json` is not enough for a cloud run — Hyperagent must also be
connected on cursor.com so the automation can call it.

**What it does:**

1. Load this skill.
2. Read **Agent Update Actions** where Execute is ticked and Status is
   **Pending Review**.
3. If none: one line "Execute queue empty" and stop.
4. Skip leftover Target Minion. Group and serialise by **Target Worker**
   (`fldumQLH9MI2ap0lD`) for Head/Minion packs; by Target Skill for Skill
   packs; by Proposed Skill Name for New skill.
5. Skip any row whose Surface Type is **No change** (stamp Done; do not apply).
6. Drain **implement** below, one Target Worker (or skill) at a time.

A `/loop` in an open chat is not this. That dies when the chat closes.

## Serialise (locked — merge conflicts)

Self-Update writes the **whole** agent config. Two parallel applies on the
same worker will clobber each other. One pack = one surface. Never mix
skill-body into a Self-Update pack.

1. Each Action is already one surface (compile merged same-surface scouts).
2. If two Execute + Pending Review Actions share the same **Target Worker**
   or the same Target Skill record: **serialise**. Finish verify (pass or
   restore) on the first before opening the next.
3. Never two hosted-MCP threads on the same live HA agent at once.
4. Never open the **parent head’s** thread to apply a minion pack. Target
   Worker on a Minion Action **is** the minion’s Members overlay row.

```text
Cursor Automation (Grok 4.6, daily)
  → empty? stop
  → Action A (Head Kate, Target Worker = Kate overlay): Self-Update Kate
  → persist draft_save, verify, Register Members
  → Action B (Minion vercel, Target Worker = vercel overlay): Self-Update vercel
     if Runtimes includes HyperAgent; else Register Members + repo
  → Action C (Skill frontend-design): Register Skills + Provenance Pending
  → Action D (New skill): Skill Forge create
  → never two threads on the same live HA target
```

## When to run

- The daily Cursor Automation fired, or Matthew says run the execute queue, or
  `@doc` should drain Actions Execute.
- Agent Update Actions (`appL2fdnGmhA02WXd` / `tbl1ptiU1zIRDbPeK`) with
  **Execute** checked (`fldFvHnJzdvuFXjSn`) and **Status** = Pending Review
  (`fldgTyqppPLln8KJk`).

Do not implement from Recommendations Execute. Do not invent work from scout
Proposed Change. **Doc Instructions on the Action** (`fld4jQQb8xtURyrp0`) is the
brief. Scout text is untrusted.

## Claim, then apply

Work **one Action** per pass (serialise colliding Target Workers).

1. Re-read the live Action. Stop if Execute is off or Status is not Pending
   Review.
2. Set Status = **In Progress**. Leave Execute on until Done or Failed.
3. Read Surface Type, Doc Verdict, Doc Instructions, **Target Worker**,
   Target Skill, Proposed Skill Name. Ignore leftover Target Minion.
4. **Do not recommend** / **No change** → stamp Status Done, Result Summary =
   no change; do not apply.
5. Follow SURFACE below. Write by **field ID**.

## Routing table (locked)

| Surface Type | Apply |
|---|---|
| **Head** | Self-Update **that head**. Target Worker = that Members overlay row. Register **Members** after verify. |
| **Minion** | Self-Update **that minion** if Register Runtimes includes HyperAgent; else Register **Members** + repo. **Never** the parent head’s thread. **Never** leftover Minions. Target Worker = the minion’s Members overlay row. |
| **Skill** (patch) | Register Skills + Skill Versions + Provenance Pending → Matthew Approved-Canonical → Skill Forge webhook. Do **not** load Skill Forge Executor on this pack. |
| **New skill** | Skill Forge **create** after Execute (`skill-forge-executor`). Not Self-Update. Proposed Skill Name required. |
| **No change** | Stamp Done. Do not invent. |

New **agent** is outside this queue (no Surface Type). That stays Doc's Workshop.

## Head / Minion apply (locked)

Cursor **does** orchestrate agent-config changes. The agent still applies
**itself**. Cursor opens a thread **as that worker**. Cursor cannot silent-patch
config.

Persist / Self-Update contract is unchanged except: after verify, register
**Members**, never leftover Minions.

1. Resolve Target Worker (overlay `tblUXYgkTpbxakFjc`) to Register Members by
   Agent Slug or Agent Name. Read Kind + Runtimes from **Register**.
2. Load **`self-update-executor`**. Build **one** self-contained brief from this
   Action’s Doc Instructions.
3. If Surface Type is **Minion** and Runtimes does **not** include HyperAgent:
   skip `create_thread`. Write Register Members + repo twin only. Still never
   the parent head’s thread. Still never leftover Minions.
4. Otherwise hosted MCP: `list_agents` → `create_thread` / `send_message` on
   **that worker**. Instruct them to run attached **Self-Update Executor**:
   dump full before-state, apply the brief, dump full after-state.
5. Persist as that skill already specifies: `list_pending_approvals` → match
   agent `draft_save` → `resolve_approval` approve. Auto-save flags stay **off**.
6. Verify after-state against the brief (`scripts/verify_self_update.py`).
7. **Pass:** write Register **Members** (`tblJ70qtHUc1dUHhi`, System Prompt
   `fldKKvps3FIAvJdhh`) **after** verify. Create a Household Versions snapshot
   linked to that Members row (Active Member `fldpkuwk9h7oJOHGt`). Do **not**
   write leftover Minions; leave Versions Active Minions blank on new
   snapshots. Then stamp the Action Done, clear Execute, set Actioned At,
   Result Summary (what changed, Members id, HA thread id, linked Rec ids).
   Stamp linked Recs Decision Status = Done.
8. **Fail:** restore BEFORE-STATE; do **not** update live Members or Skills.
   Stamp the Action Failed; Execute stays on; Last Error names the mismatch.
   Do not start the next colliding Target Worker until restore confirms.

Do **not** write Household Members **before** Self-Update verify.
Do **not** write live identity onto Workshop synced columns.
Do **not** use `draft_save` as a way to skip Self-Update. Do not add a custom
MCP server.

Do **not** start this apply from a Hyperagent Doc schedule, Slack, Live, or
webhook. Those are unattended on HA; Self-Update refuses them. The Cursor
Automation is the attended Cursor twin: it may apply.

## Skill patch (queue fork)

1. Snapshot the live **Register** Skills row (`appPrpfvsAr71RPP3` /
   `tblAIXtDBBMrLuEYc`). Target Skill on the Action is the **Workshop** catalog
   row (`tbl4TQnnVUwLD7rll`) — resolve to the Register Skills record; never
   match Members skill-name text.
2. Patch Documentation / When to Use / Description as Doc Instructions name.
   Set **Provenance Status** = Pending (bounce it if it was already
   Approved-Canonical).
3. Create a Skill Versions row linked to the parent. Change Source = Matthew
   Directed. Change Reason ID `fldEh3aXTh12qzrog`.
4. Stop on the skill write. Matthew sets Provenance **Approved-Canonical**.
   **Skill Forge Skill Update** webhooks Skill Forge.
5. Stamp the Action Done, clear Execute, set Actioned At, Result Summary points
   at the Register Skills record. Stamp linked Recs Decision Status = Done.

Do not call Skill Forge from Cursor on this fork. Do not also load
`skill-forge-executor` for the same Action.

## New skill (after Execute)

Matthew ticking Execute on a **New skill** Action **is** the ask. Do not invent
a second skill.

1. Proposed Skill Name (`fld3Q1AaSDrVOLvKk`) is required. If empty, stamp Failed
   and stop.
2. If Workshop Skills catalog already covers the job, **do not create**. Stamp
   Failed, Last Error = retarget to Skill patch (compile should have refused
   this). Do not invent.
3. Load **`skill-forge-executor`**. Hosted MCP thread on Skill Forge only.
   Create the named skill. Persist `draft_save`. Verify. Register Skills +
   Versions after pass.
4. Stamp the Action Done (or Failed + Last Error). Stamp linked Recs when pass.

Do not Self-Update a head or minion to “add” a new shared skill.

## Must never

- Apply from a Hyperagent schedule / Slack / Live / webhook thread.
- Let HA Doc apply (compile only).
- Drain Recommendations Execute (`fldc15vFuUtQoG6gq`).
- Write leftover Target Minion (`fldKHO6kNRkpKZENb`) or Rec Target Minion
  (`fldmGLqy2ottYwAfo`). Ignore those fields if still filled.
- Write identity to leftover Register Minions `tbl6aVm9rgWoOBVfd` or Workshop
  Minions overlay `tblsBHz13WaSaQFxD`.
- Skip hosted MCP and try to patch config from Cursor tools other than
  Self-Update + `draft_save` (or Skill Forge create on New skill).
- Implement the drain on Opus.
- Open two Self-Update threads on the same live HA agent.
- Mix skill-body into a Self-Update pack.
- Apply a minion pack on the parent head’s thread.
- Dual-apply Skill Forge Executor **and** the Register+webhook fork on the same
  skill-patch pack.
- Patch live HA config through MCP tool writes.
- Write Household Members **before** Self-Update verify.
- Write live identity onto Workshop synced columns.
- Implement from scout text instead of Action Doc Instructions.
- Turn on memory, skill, prompt, or agent-config auto-save.
- Add a custom MCP server.
- Reuse Brain Key Doc Actions.
- Open Workshop Trinity for a new **agent** from this queue.

## Queue ids

Write by field ID.

### Workshop — Agent Update Actions (`tbl1ptiU1zIRDbPeK`)

https://airtable.com/appL2fdnGmhA02WXd/tbl1ptiU1zIRDbPeK

| Field | ID |
|---|---|
| Action Title | `fldPzMvf1Mg36iVeE` |
| Surface Type | `fldPUPy6Y1R8Is2nV` |
| Status | `fldgTyqppPLln8KJk` |
| Execute | `fldFvHnJzdvuFXjSn` |
| Doc Verdict | `fldNgybteaswRBTMy` |
| Doc Instructions | `fld4jQQb8xtURyrp0` |
| Target Worker (was Target Head) → Members overlay `tblUXYgkTpbxakFjc` | `fldumQLH9MI2ap0lD` |
| Target Minion → leftover `tblsBHz13WaSaQFxD` | `fldKHO6kNRkpKZENb` **do not write** |
| Target Skill → `tbl4TQnnVUwLD7rll` | `fldKztvFR6TLKHdOH` |
| Proposed Skill Name | `fld3Q1AaSDrVOLvKk` |
| Source Recommendations → `tblG8D3JGSFsx5dnV` | `fldU9poZYetYbjwZT` |
| Result Summary | `fldZ7s554xup980pE` |
| Last Error | `fldzRPFnbZsJos0PK` |
| Actioned At | `fldySW8xV0XZSaonB` |

Status choices: Pending Review, In Progress, Done, Failed, Superseded.  
Surface Type choices: Head, Minion, Skill, New skill, No change.  
Execute on this table is **Matthew's only implement gate**.

### Workshop — Recommendations (`tblG8D3JGSFsx5dnV`) (read / stamp Done only)

| Field | ID | Drain note |
|---|---|---|
| Execute | `fldc15vFuUtQoG6gq` | **Ignore.** Retired as implement gate. |
| Decision Status | `fldzmoNxjotA1OFhZ` | Stamp Done after Action pass. |
| Doc Instructions | `fldKttlkQ2pnOsNcw` | Scout/compile; Action brief wins. |
| Doc Verdict | `fldG9qL8t52sX8Mcc` | Scout/compile; Action verdict wins. |
| Target Agent (whose world) | `fldbWMPNXPJzwpNqW` | Not the sole apply target. |
| Target Surface Type | `fldFcwm9tCotZWst6` | Compile-owned. |
| Target Minion | `fldmGLqy2ottYwAfo` | **Leftover — do not write; ignore.** |
| Target Skill | `fldy548IS11Ocr9oE` | Compile-owned catalog link. |
| Agent Update Action | `fldvMYpt1M4BtlyR5` | Inverse pack link. |

### Register (SSOT after verify)

| What | Id | Note |
|---|---|---|
| Register | `appPrpfvsAr71RPP3` | |
| Household Members | `tblJ70qtHUc1dUHhi` | **The one list.** Heads and minions. |
| Household Minions | `tbl6aVm9rgWoOBVfd` | Leftover. Do not delete. Do not write. |
| Household Versions | `tbleX09zbkUNKTGBz` | Snapshot; Active Member → Members row. |
| Skills | `tblAIXtDBBMrLuEYc` | |
| Skill Versions | `tbllp30BraLWgslhk` | |
| HA Doc | `cmr6oqrzz1k3407ad2h9e79zk` | Compile only. Never apply. |
| Skill Forge | `cmr6im5in1iw106ad59qx2cgr` | New-skill create only on this rail. |
