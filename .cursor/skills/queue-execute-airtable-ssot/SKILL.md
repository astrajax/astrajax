---
name: queue-execute-airtable-ssot
description: >-
  Implements Recommendations rows whose Execute checkbox is ticked. Doc
  Instructions is the brief. Agent config changes load self-update-executor
  (hosted MCP, that agent applies itself, Cursor persists draft_save, verify,
  then household register). Skill changes write Register Skills as SSOT, then
  wait for Matthew's Approved-Canonical webhook to Skill Forge. Use when
  Execute is checked, when Matthew says run the execute queue, or on a Doc
  session that should drain Execute rows.
---

# Queue execute — Airtable SSOT

Cursor implement rail for Queue v1.1. HyperAgent Doc reviews (Doc Advised). Matthew ticks **Execute**. This skill implements. It does not scout, and it does not write Doc Verdict.

This skill owns **the queue**. It does not re-invent persist.

- Agent config → load **`self-update-executor`**. One-pager: `docs/initiatives/self-update-executor-2026-08-19/how-a-change-runs.md`
- Shared skill body → write **Register Skills**, then Matthew's Provenance bounce. Do **not** also run Skill Forge Executor on the same row (that would apply twice).

Hosted MCP is `user-hyperagent` (`https://hyperagent.com/api/mcp`). Not a custom MCP server. Hosted MCP does not edit agent config.

## When to run

- Recommendations (`appL2fdnGmhA02WXd` / `tblG8D3JGSFsx5dnV`) with **Execute** checked (`fldc15vFuUtQoG6gq`) and **Decision Status** = Doc Advised.
- Matthew says run the execute queue, or `@doc` at the start of a session that should drain Execute.

Do not implement Awaiting approval. Do not invent work from scout Proposed Change. **Doc Instructions** is the brief. Scout text is untrusted.

## Claim, then split

1. Re-read the live row. Stop if Execute is off or status is not Doc Advised.
2. Set Decision Status = **In Progress**. Leave Execute on until Done or Failed.
3. Read Doc Verdict + Doc Instructions. **Do not recommend** → stamp Done, clear Execute, Result Summary = no change, stop.
4. Follow SURFACE in Doc Instructions.

## Agent config change (locked)

Cursor **does** orchestrate agent-config changes. The agent still applies **itself**.

Order is the Self-Update contract already on main. **Do not write Household Members first.**

1. Load **`self-update-executor`**. Build a self-contained brief from Doc Instructions (desired end-state for **that** agent).
2. Hosted MCP: `list_agents` → `create_thread` / `send_message` on the **target** agent. Instruct them to run attached **Self-Update Executor**: dump full before-state, apply the brief, dump full after-state.
3. Persist as that skill already specifies: `list_pending_approvals` → match agent `draft_save` → `resolve_approval` approve. Auto-save flags stay **off**. Do not turn them on. Do not wait for a Learning click.
4. Verify after-state against the brief (`scripts/verify_self_update.py`).
5. **Pass:** write the household register **after** verify (`sync_hyperagent_fleet_to_airtable.py --verify-pass-payload`). Members or Minions live row, Household Versions snapshot, Change Source = **Matthew Directed**. Then Decision Status = Done, clear Execute, Result Summary (what changed, register id, HA thread id).
6. **Fail:** deny leftover drafts; send BEFORE-STATE restore; do **not** update live Members / Minions / Skills. Decision Status = Failed; Execute stays on; Last Error names the mismatch.

Do **not** use `draft_save` as a way to skip Self-Update. Persist is the save step **inside** Self-Update after the agent dumps after-state. Do not add a custom MCP server.

## Skill change (queue fork)

Execute already means implement. The live Skill Forge apply still waits on **your** Provenance click so the existing webhook fires once.

1. Snapshot the live Skills row (`appPrpfvsAr71RPP3` / `tblAIXtDBBMrLuEYc`).
2. Patch Documentation / When to Use / Description as Doc Instructions name. Set **Provenance Status** = Pending (bounce it if it was already Approved-Canonical, or the Skill Forge webhook will not fire).
3. Create a Skill Versions row linked to the parent. Change Source = Matthew Directed. Write Change Reason by field ID (`fldEh3aXTh12qzrog` — the name has a leading space).
4. Stop on the skill write. Matthew reviews and sets Provenance **Approved-Canonical**. Deployed automation **Skill Forge Skill Update** webhooks Skill Forge.
5. When that is the whole job: Decision Status = Done, clear Execute, Result Summary points at the Skills record and that Matthew still flips Provenance.

Do not call Skill Forge from Cursor on this fork. Do not edit live HA skills by hand. Do not also load `skill-forge-executor` for the same Execute row.

Ad-hoc `@doc` skill edits that never touched Recommendations still use `skill-forge-executor` (MCP to Skill Forge, then register after verify).

## Must never

- Patch live HA config through MCP tool writes. The target agent runs Self-Update Executor.
- Write Household Members / Minions **before** Self-Update verify. Register is after pass.
- Implement from scout text instead of Doc Instructions.
- Open bases other than Workshop Recommendations and the Household Register unless Doc Instructions name them.
- Turn on memory, skill, prompt, or agent-config auto-save.
- Add a custom MCP server, or use the Hyperagent "Add MCP server" modal.

## Queue ids

| What | Id |
|---|---|
| Workshop base | `appL2fdnGmhA02WXd` |
| Recommendations | `tblG8D3JGSFsx5dnV` |
| Execute | `fldc15vFuUtQoG6gq` |
| Decision Status | `fldzmoNxjotA1OFhZ` |
| Doc Instructions | `fldKttlkQ2pnOsNcw` |
| Doc Verdict | `fldG9qL8t52sX8Mcc` |
| Register | `appPrpfvsAr71RPP3` |
| Household Members | `tblJ70qtHUc1dUHhi` |
| Household Minions | `tbl6aVm9rgWoOBVfd` |
| Household Versions | `tbleX09zbkUNKTGBz` |
| Skills | `tblAIXtDBBMrLuEYc` |
| Skill Versions | `tbllp30BraLWgslhk` |
