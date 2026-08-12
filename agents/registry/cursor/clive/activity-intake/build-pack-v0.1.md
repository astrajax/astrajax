# Clive's Man — Activity Intake (Cursor) v0.1 — Build Pack

**Doc's Workshop Cursor Builder — Phase B — 12 Aug 2026.**

Workshop Challenger verdict: **PROCEED**. Matthew explicit approval in-thread
("Build it now. One cursor native, one HA.").

HyperAgent export JSON and schedule enablement are **out of scope** for this pack —
handoff to `@doc-workshop-hyperagent` for the HA twin only.

## Decision

**BUILD NEW** — one Cursor-native on-demand adapter plus registry/skill artifacts.
Does **not** replace or mutate legacy v0.4 HyperAgent thread intake.

```text
Household Activity (Sessions + Activity)
  → clive-man-activity-intake-cursor (Cursor, on-demand)
  → V1 Proposed on Context Amendment Versions (tblsuOKGjSGYv0Vov)
  → existing Context Auditor / Challenger / Executor lanes (unchanged)

Parallel HA twin (future): clive-man-activity-intake-hyperagent (scheduled intent only)
```

## Slug and naming discipline

| Rule | Value |
|------|-------|
| Cursor agent slug | `clive-man-activity-intake-cursor` |
| Skill name / path | `clive-man-activity-intake` |
| HA partner slug (record only) | `clive-man-activity-intake-hyperagent` |
| Display | "Clive's Man — Activity Intake (Cursor)" |

**Prohibited in new slug / skill / path / display / capability / checkpoint key:**
the word `ambient` (case-insensitive). Sealed pen env name `AMBIENT_V1_CREATE` is
allowed — it is the governed workshop pen label, not a new artifact slug.

## Risk tier

**Medium** — writes repo agent/skill/registry files only in this Phase B slice.
Live Airtable mutation blocked until pens minted and human gates cleared.

## Runtime artifacts (this build)

| Artifact | Path |
|----------|------|
| Cursor agent | `.cursor/agents/clive-man-activity-intake-cursor.md` |
| Cursor skill | `.cursor/skills/clive-man-activity-intake/SKILL.md` |
| Registry build pack | `agents/registry/cursor/clive/activity-intake/build-pack-v0.1.md` |

**Not in scope:** `.claude/` mirrors, Hyperagent JSON, generators, scripts, credential
mint, schedule creation, Airtable schema changes, edits to legacy thread-intake artifacts.

## Cursor agent config

| Property | Value |
|----------|-------|
| Model | `composer-2.5-fast` |
| readonly | `false` |
| is_background | `false` |
| Trigger | **On-demand only** (`@clive-man-activity-intake-cursor`) |

## Pens (UNVERIFIED until minted)

| Pen | HTTP | Scope |
|-----|------|-------|
| `HOUSEHOLD_ACTIVITY_READ` | GET only | Base `appF7jQD4ZKrDC7e1` — Sessions `tblUi4nmBKX2u8nFx`, Activity `tblNxNLyC31KDQbRl` |
| `AMBIENT_V1_CREATE` | POST create only | Base `appL2fdnGmhA02WXd` — Context Amendment Versions `tblsuOKGjSGYv0Vov` |

**Never:** Draft Brain Truth `tblswvXNYFDqnl6af` direct write; PATCH/PUT/DELETE;
Draft / Trusted / V2 paths; Airtable MCP in runtime.

## V1 create contract

| Field | Requirement |
|-------|-------------|
| Stage | V1 |
| Verdict | Proposed |
| Action class | `CREATE_DRAFT_TRUTH` |
| Created By Agent | `clive-man-activity-intake-cursor` |
| after_payload.capture_source | Chat Session |
| Capture Source Chat Session | Sessions `rec…` — **same payload, never blank** |
| Adapter version | `context-amendment-adapters-v2.0` |

## Phase-one read filter

- **Include:** Activity exchange rows with **both** User Message and Reply Digest.
- **Exclude:** Reports table; legacy thread-intake actor (`clive-man-ambient-capture`);
  both adapter slugs; Session End; routine Action / Completion / Question; incomplete rows.

## Caps

| Phase | V1 creates / run |
|-------|------------------|
| First live | 1 |
| Steady | 10 |

## Checkpoint

| Property | Value |
|----------|-------|
| Stream key | `household-activity:activity:clive-man-activity-intake:v1` |
| Table | `tblRbjD0PHtuTWsIL` (Ambient Checkpoint Versions — shared infra) |
| Append pen | `AMBIENT_CHECKPOINT_APPEND` — not minted in this build |

**Runtime lease interlock:** checkpoint `cursor_token_json` carries `runtime_owner`
and `lease_until_utc`. Refuse a fresh lease held by another runtime. Cursor owner
literal: `"cursor"`. HA twin owner literal: `"hyperagent"`.

**Legacy thread stream untouched:**
`hyperagent:eligible-threads:clive-man-ambient-capture:v1`.

## HyperAgent partner (intent only)

| Slug | Notes |
|------|-------|
| `clive-man-activity-intake-hyperagent` | Same pens, stream key, lease rules; scheduled unattended runs — **metadata in HA build pack only** |

Suggested HA schedule placeholder (not enabled): daily Europe/London after Household
Activity rollups stable — exact cron is HA Builder + Matthew gate.

## Hash-preservation list — v0.4 legacy thread-intake artifacts

**Do not modify** these paths/content hashes when landing Activity Intake. They remain
the HyperAgent thread axis until explicitly retired.

| Path | Role |
|------|------|
| `.cursor/agents/clive-man-ambient-capture.md` | Cursor registry mirror (HA runtime) |
| `.cursor/skills/clive-man-ambient-capture/SKILL.md` | Governed skill mirror |
| `.claude/agents/clive-man-ambient-capture.md` | Claude mirror |
| `.claude/skills/clive-man-ambient-capture/SKILL.md` | Claude skill mirror |
| `hyperagent/builds/_clive_man_v0_4_contract.py` | Frozen v0.4 family constants |
| `hyperagent/builds/_clive_man_ambient_intake.py` | Thread intake script loader |
| `hyperagent/builds/sources/clive-man-v0_4/ambient/ambient_config.py` | Thread intake constants |
| `hyperagent/builds/sources/clive-man-v0_4/ambient/ambient_v1_intake.py` | Thread intake + checkpoint script |
| `hyperagent/exports/agents/agent-clive-man-ambient-capture-v0_4.json` | HA export (when on branch) |
| `hyperagent/exports/agents/agent-clive-man-ambient-capture-v0_1.json` | Legacy stub export |
| Checkpoint stream `hyperagent:eligible-threads:clive-man-ambient-capture:v1` | Legacy cursor — **no advances from Activity Intake** |
| Bootstrap `recHsDmDx00c636BP` / event `acp-genesis-hyperagent-ambient-v1` | Legacy stream genesis only |

Activity Intake uses a **new stream key** on the **same checkpoint table** — no fork of
legacy stream rows.

## Challenger clearance

- Verdict: **PROCEED**
- Matthew: explicit "Build it now. One cursor native, one HA."
- Human gates deferred: pen mint, HA import, schedule enable, first-live cap lift

## Acceptance tests (Cursor static)

| ID | Check |
|----|-------|
| ACT-INT-001 | Agent slug `clive-man-activity-intake-cursor` |
| ACT-INT-002 | Model `composer-2.5-fast`, readonly false, not background |
| ACT-INT-003 | Skill path `clive-man-activity-intake` — no `ambient` in path |
| ACT-INT-004 | Pens documented; MCP/browser/websearch forbidden |
| ACT-INT-005 | V1-only write table `tblsuOKGjSGYv0Vov` |
| ACT-INT-006 | Capture Source Chat Session never-blank rule present |
| ACT-INT-007 | Exchange filter + exclusion list present |
| ACT-INT-008 | Caps 1 then 10 |
| ACT-INT-009 | Stream key + lease interlock documented |
| ACT-INT-010 | HA partner slug recorded; schedule intent only |
| ACT-INT-011 | Hash-preservation list present |
| ACT-INT-012 | Zero edits to hash-preservation paths in this Phase B diff |

## Pre-deploy checklist (human gates — not Phase B)

- [ ] `HOUSEHOLD_ACTIVITY_READ` minted (GET-only, Household Activity base)
- [ ] `AMBIENT_V1_CREATE` minted (POST-only, Amendment Versions)
- [ ] `AMBIENT_CHECKPOINT_APPEND` minted (if checkpoint advances required)
- [ ] Governed intake script wired for Cursor shell invocation
- [ ] First live run at cap **1**
- [ ] HA twin built by `@doc-workshop-hyperagent` as `clive-man-activity-intake-hyperagent`
- [ ] Matthew enables HA schedule after Cursor + HA parity verified

## Hyperagent Builder handoff (HA twin only)

1. Read this pack + `.cursor/skills/clive-man-activity-intake/SKILL.md`.
2. Emit `clive-man-activity-intake-hyperagent` export (not in this Cursor Phase B).
3. Mirror pens, stream key, lease interlock, caps, and exclusion set.
4. Schedule metadata only — disabled until Matthew + pen mint gates pass.
5. Do **not** modify hash-preservation artifacts above.

## Matthew — next steps

1. Review the three new files at contracted paths.
2. Mint pens when Ruth + Matthew ready (not in this build).
3. Dispatch `@doc-workshop-hyperagent` for the HA twin when Cursor artifacts look right.
4. First live Cursor run at cap **1** after script wiring lands.
