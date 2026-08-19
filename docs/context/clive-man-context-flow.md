# Clive's Man — context flow (operator)

**Status:** Operational. Lived through first Cursor + HyperAgent Activity Intake runs (12 Aug 2026).  
**Owner:** Matthew.  
**Audience:** you, and any new chat that should not re-invent this from Slack memory.

This is the founder walkthrough. Agent contracts and field IDs live in the skills and build packs at the bottom — do not brief from those first.

## Do we already have this?

Pieces, not this:

| What exists | What it is |
|---|---|
| `docs/context/clive-operating-rules.md` | Who may approve truth |
| `docs/context/trinity-agent-flow.md` | Propose → challenge → execute pattern |
| `docs/business/architecture.md` § Clive's Man | Product role, not a runbook |
| `.cursor/skills/clive-man-activity-intake/` and HyperAgent build packs | Builder contracts |

Until this file, the end-to-end “what actually happens, and what do I type” lived in chat.

---

## What this lane is for

Chats and agent work produce evidence. Clive's Man turns **durable** evidence into **proposals**. You decide what becomes canon. Nothing in this lane writes Trusted Brain Truth on its own.

*Canon* = the signed-off record the business is allowed to treat as true.

```text
Work happens
  → it is logged (Household Activity)
  → intake proposes (V1 queue)
  → scheduled review / on-demand Clive's Man
  → you approve
  → only then is it canon
```

---

## The picture

```text
  Cursor chat / HyperAgent run / website
              │
              ▼
   Household Activity  (Sessions + Activity)
     “this conversation happened”
              │
     ┌────────┴────────┐
     ▼                 ▼
 Activity Intake    Thread Ambient          @clive-man (on demand)
 (this week)        (older HA thread scan)  Trinity: propose → challenge → execute
     │                 │                         │
     └────────┬────────┘                         │
              ▼                                 ▼
   Context Amendment Versions              Draft Brain Truth
   Stage V1 · Verdict Proposed             (Workshop drafts — still not canon)
              │
              ▼
   Context Auditor 06:00 → Challenger 07:00 → Executor 08:00
   (HyperAgent machine chain — estate review, not a substitute for you)
              │
              ▼
         You approve  →  Trusted Brain Truth
```

Two intake doors read **different evidence**. They do not replace each other.

| Door | Reads | Trigger | Writes |
|---|---|---|---|
| **Activity Intake** | Household Activity **exchange** rows (your message **and** the agent reply, both present) | Cursor: `@clive-man-activity-intake-cursor` when you ask. HyperAgent: schedule, when you turn it on | V1 Proposed rows only |
| **Thread Ambient** | HyperAgent **threads** (the older scanner) | HyperAgent 05:00 — still off until you enable it | V1 Proposed rows only |

Both write to the same **proposal queue** (Context Amendment Versions). Neither writes Draft Brain Truth directly. Neither approves.

---

## What “worked” means (12 Aug 2026)

Both Activity Intake twins ran live:

- Cursor `@clive-man-activity-intake-cursor`
- HyperAgent `clive-man-activity-intake-hyperagent`

They can read Household Activity, judge exchange rows, and land proposals in the queue. Cap was **1** on first live. That is the proof. It is not “the schedule is on” and not “canon is updating itself.”

---

## Cursor vs HyperAgent

| | Cursor | HyperAgent |
|---|---|---|
| Job | On-demand backfill / “run it now” | Unattended repeat |
| How you start it | `@clive-man-activity-intake-cursor` in a chat | Import the agent JSON, paste credentials, enable schedule later |
| Secrets | Repo-root **`.env`** (not `.env.example`) | Skill **Credentials** tab, **Readable by scripts** on |
| Schedule | None | Empty in the export until you enable it |

Same three Airtable tokens. Two copies. Cursor does not read HyperAgent’s credential UI; HyperAgent does not read your laptop `.env`.

---

## Setup (Cursor)

1. On **your** machine: `git checkout main` then `git pull origin main`. Cloud agents pulling a VM does not update your laptop.
2. Agent file: `.cursor/agents/clive-man-activity-intake-cursor.md` (folder starts with a dot — Finder may hide it).
3. Secrets go in **`.env`** at the repo root (same folder as `.env.example`). Never put tokens in `.env.example`.

```bash
HOUSEHOLD_ACTIVITY_READ=pat...
AMBIENT_V1_CREATE=pat...
AMBIENT_CHECKPOINT_APPEND=pat...          # optional until the bookmark is live
FLEET_ACTIVITY_WRITE=pat...               # session logging
ACTIVITY_INTAKE_FIRST_LIVE_COMPLETE=true  # after first successful live run; lifts cap 1 → 10
```

If Cursor already had those names, it may have saved them as `HOUSEHOLD_ACTIVITY_READ2` (and so on). The scripts look for the names **without** `2`. Put the **same tokens** again under the unsuffixed names. You do not mint new Airtable tokens.

If a run still reports cap **1** after the flag is in `.env`, the intake script is not seeing the file — add the same line in Cursor → Settings → Environment.

### First run prompt

```text
@clive-man-activity-intake-cursor
Dry run first. Cap 1. Read Household Activity exchange rows and report eligible count — no V1 creates unless I confirm.
```

Then live, still cap 1, until you have looked at the proposal row.

---

## Setup (HyperAgent)

Import:

`hyperagent/exports/agents/agent-clive-man-activity-intake-hyperagent-v0_1.json`

On the **clive-man-activity-intake** skill → Credentials:

1. Advanced → **Readable by scripts** on.
2. Paste the raw PAT (no `Bearer`).
3. Ignore **Locked to one host** / `api.example.com` — that mode hides the token from Python.

`ACTIVITY_INTAKE_FIRST_LIVE_COMPLETE=true` must be set in **HyperAgent’s** environment if you want that twin on cap 10. Your laptop `.env` does not reach it.

Leave the schedule **off** until you want unattended repeats. That is when the bookmark matters.

---

## The bookmark (checkpoint)

Each run needs to know “we’ve already looked this far,” or it will start from the beginning and can propose the same old rows again.

That note is the **bookmark**. In the repo it is called a checkpoint. Same thing.

- **Not** a PAT, not a Cursor setting, not something you type into `.env`.
- **Not** needed for the first proving runs (empty bookmark is allowed; cap 1 protects you).
- **Needed** before you turn the HyperAgent schedule on.

When you are ready: an agent with `AMBIENT_CHECKPOINT_APPEND` writes one starter row in Ambient Checkpoint Versions for stream `household-activity:activity:clive-man-activity-intake:v1`, and you pick “don’t scan older than this date.” Later runs append new bookmark rows. Do not hand-build that row unless an agent is stuck.

This is a **different** bookmark from the older thread scanner (`hyperagent:eligible-threads:clive-man-ambient-capture:v1`). Do not reuse that starter row.

---

## What to look at after a run

In Brain Workshop → **Context Amendment Versions**:

| Check | Why |
|---|---|
| Stage = V1, Verdict = Proposed | Still a proposal |
| Created By Agent = `clive-man-activity-intake-cursor` or `…-hyperagent` | Honest actor — not aliased to Ambient |
| Capture Source Chat Session is filled (a `rec…` id) | Ties the proposal to the Household Activity session. Blank is a defect |

Then you review. Approval to Trusted is still you (or the human-only promote path). Clive's Man may draft and digest; he may not set Approved / Confirmed By Human.

---

## What you do not do in this lane

- Put secrets in `.env.example` or in chat.
- Ask Activity Intake to write Draft Brain Truth or Trusted rows.
- Turn on the HyperAgent schedule before you are happy with live rows **and** have a bookmark plan.
- Run Cursor and HyperAgent intake at the same moment if one holds a fresh bookmark lease — the other will refuse on purpose.
- Treat Thread Ambient and Activity Intake as the same agent. Different evidence, different names.

---

## Other ways context still enters (not this week’s twin)

| Path | When |
|---|---|
| `@clive-man` | You want a steward judgement / Trinity on something in the chat |
| Source document mining | Files in Workshop Source Documents → Draft Brain Truth proposals |
| Thread Ambient 05:00 | Old HyperAgent thread scan — parallel, still gated on its own enablement |

`docs/initiatives/source-document-mining.md` covers the file path. `docs/context/clive-operating-rules.md` covers who may approve.

### Draft Brain Truth write contract

Every route that creates a Draft Brain Truth row must write both text registers,
link the live Workshop Brain Registry record, and leave Matthew's builder-review
fields untouched. A Brain Slug is a label, not the destination. Website routes use
`website/src/lib/brains/draft-truth-write.ts`, which also refuses any status other
than Draft or Quarantined.

`Related Projects` is optional. Clive's Man (proposer) loads the live Active
Projects list and decides whether a new Draft claim belongs to one or more of
those rows, or none. He passes real record IDs. Blank is legal. The human does
not have to type the exact project title. Inventing a project or creating a
Projects row is forbidden. The executor writes only the IDs it was given. The
challenger checks those IDs exist, are Active, and are justified by the claim.
A document upload is not a substitute. Agents do not retro-link existing drafts.

The regenerated HyperAgent v0.4 family pack accepts this contract on executor
create (`hyperagent/exports/agents/agent-clive-man-context-executor-v0_4.json`
and `hyperagent/exports/agents/agent-clive-man-executor-v0_4.json`). Ambient
Capture and Activity Intake still write Context Amendment Versions only; the
executor materialises the Draft row. Matthew must import/merge the pack in
HyperAgent before the live agents use it. Until he does, do not describe the
scheduled V1 → executor route as live-updated.

---

## Technical contracts (do not start here)

| Artifact | Role |
|---|---|
| `.cursor/agents/clive-man-activity-intake-cursor.md` | Cursor agent |
| `.cursor/skills/clive-man-activity-intake/SKILL.md` | Cursor skill |
| `website/src/lib/brains/draft-truth-write.ts` | Shared website write contract for Draft Brain Truth |
| `agents/registry/cursor/clive/activity-intake/build-pack-v0.1.md` | Cursor build pack |
| `agents/registry/hyperagent/clive/activity-intake/build-pack-v0.1.md` | HyperAgent build pack |
| `hyperagent/exports/agents/agent-clive-man-activity-intake-hyperagent-v0_1.json` | Import file |
| `docs/initiatives/brain-key-schema.md` § Ambient Checkpoint Versions | Bookmark table shape |
| `docs/context/clive-operating-rules.md` | Human approval rule |
