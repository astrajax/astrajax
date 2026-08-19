# How a change actually runs

Matthew-facing one-pager for the live-apply family (19 Aug 2026).

## Your part

1. Ask **`@doc`** for the change in Cursor (same as today).
2. That is it.

No Hyperagent import per change. No Learning-queue click. No pinning skills on
twelve agents. No pasting prompts into Airtable. No approve-each-apply.

Doc picks the fork. You do not.

## Agent change vs skill change

| You asked for… | Doc loads | Who applies on Hyperagent |
|---|---|---|
| This agent's prompt / identity / config | **Self-Update Executor** | **That** agent, on itself |
| Create or change a **skill** | **Skill Forge Executor** | **Skill Forge** (`cmr6im5in1iw106ad59qx2cgr`) |
| Brand-new agent export / first-time generator | Doc's Workshop | Not a live apply |

Do not ask Clive or Kathryn to edit a shared skill themselves.

## Uncommitted files

If a file is not committed to the repo, Hyperagent agents cannot source it from GitHub. Do not tell Skill Forge (or any Hyperagent agent) to “read `.cursor/skills/…` from the attached repo” for work that only exists on a local branch.

Cursor must send the bytes instead:

1. **MCP attach** — `create_attachment_upload`, PUT the file, pass `fileId` on `create_thread` / `send_message`
2. **Airtable upload** — attach the file on a register or skill row they can already read

Live dumps are native reads (the agent reading its own config, or Skill Forge reading a live skill). That is not GitHub.

## What the machines do

```text
You ask @doc in Cursor
  → Doc names the fork (agent = Self-Update, skill = Skill Forge)
  → Doc opens a Hyperagent thread via hosted MCP
      Self-Update: on THAT agent
      Skill Forge: on Skill Forge only
  → Dump full BEFORE-STATE
      (skills: current skill, or "none — creating")
  → Apply the brief (draft is fine; auto-save stays OFF)
  → Dump full AFTER-STATE
  → Cursor list_pending_approvals
  → Match the agent or skill draft
  → If kind=draft_save and canResolve: resolve_approval approve
      (saves the draft exactly as authored; you do not click Learning)
  → Cursor diffs after-state vs brief
  → Pass: Airtable register + repo sync
  → Fail: deny leftover drafts; restore BEFORE-STATE; live Skills untouched
```

## Persist (why you never click Learning)

Agents often cannot auto-save. Auto-save stays **off**. Cursor persists the
draft from here:

- `list_pending_approvals` — finds agent/skill drafts awaiting a save
- `resolve_approval` kind `draft_save` — approve saves it; deny drops it
- Skip `canResolve: false` (break-glass: that row must be handled in the
  Hyperagent thread)

This is the persist step for **both** forks.

## Register writes (only after Doc says pass)

| Fork | Tables |
|---|---|
| Self-Update (agent) | Household Members or Minions; Household Versions; Skills / Skill Versions only if that job also touched an attached skill definition |
| Skill Forge (skill) | **Skills** live row after verify; **Skill Versions** snapshot (before and/or after). No live Skills write on fail. A Versions row that says rolled back is OK. |

Change Source defaults to **Matthew Directed** when you asked in Cursor.
If Skill Forge proposed and you already said go: **Skill Forge Suggested - Matthew Approved**.

Skill Forge does not write Airtable. Cursor writes after verify, same writer as
Self-Update (`--verify-pass-payload`).

## Hosted MCP (one-time)

Cursor talks to Hyperagent's **hosted** MCP. We do not host a server, and this is not the Hyperagent "Add MCP server" custom-URL path.

- **Server name in Cursor Settings:** `hyperagent`
- **Server id for Doc / tools:** `user-hyperagent`
- **URL:** `https://hyperagent.com/api/mcp`
- **Config:** `~/.cursor/mcp.json` (your Cursor user file, not in git)

**Status (19 Aug 2026):** connected. Cursor can already list your Hyperagent agents.

If it ever drops: Cursor Settings → Tools & MCP → `hyperagent` → **Connect**, then Google sign-in. Once. Revoke at https://hyperagent.com/settings/mcp-access.

## One-time bootstrap (not a per-change click)

Once: land the method skills in the Hyperagent **Skills** library. After that, Doc
attaches them on the right agents. Auto-save stays off. You do not pin agents by hand.

Skill Forge: https://hyperagent.com/agents/cmr6im5in1iw106ad59qx2cgr

**Register IDs (19 Aug 2026, verify-pass only):** Skills `rec7RyCUDcQmvW0hl`; Skill Versions
`recPJbVxIB4SID3Ye`. Self-Update row `rec4RH5aHrDNfQFp3` is the agent fork — leave
untouched on skill jobs.

**Teach thread (still running):** https://hyperagent.com/threads/cmszsb3vb08ra07ad34laghxd —
live Skill Forge prompt teach is a follow-up Self-Update on Skill Forge itself.

## Break-glass

If restore itself fails, or a draft has `canResolve: false`, stop and tell
**Doc** (`@doc`). Do not hand-edit the live agent or skill unless you choose to.

## Paths

- Self-Update skill: `hyperagent/exports/skills/skill-self-update-executor-v0_1.json`
- Skill Forge skill: `hyperagent/exports/skills/skill-skill-forge-executor-v0_1.json`
- Writer: `hyperagent/scripts/sync_hyperagent_fleet_to_airtable.py --verify-pass-payload …`
- Persist matcher: `.cursor/skills/self-update-executor/scripts/match_pending_approval.py`
- Cursor verify (agent): `.cursor/skills/self-update-executor/scripts/verify_self_update.py`
- Cursor verify (skill): `.cursor/skills/skill-forge-executor/scripts/verify_skill_forge.py`
- Playbook: `hyperagent/docs/hyperagent-deploy-playbook.md`
