# Clive's Man v0.3 — Build Pack (Context Flow / Option 3)

**Cursor Builder Phase B — 12 Aug 2026.** Workshop Challenger verdict: **PROCEED**.
Matthew explicit approval in-thread. Hyperagent export JSON deferred to Hyperagent Builder.

## Lineage

| Version | Scope |
|---------|-------|
| v0.1 | Consolidated steward + Trinity minions; retired Intake/Curator/Publisher/Scanner |
| v0.2 | HyperAgent on-platform family (ACC stub, Daily Context Review seeds) |
| **v0.3** | **Option 3 lanes**, scheduled specialist contract, v0.4 Pending gate, ID ledger |

Prior packs: `build-pack-v0.1.md`, `agents/registry/hyperagent/clive/man/build-pack-v0.2.md`.

## Decision summary

Implement **Option 3** consistently across Cursor agents/skills, routing mirrors, ID
map, persona resolver gate, and governed Ambient + Context specialist source docs.

```text
Lane A  → @clive-man-executor (complete verbatim capture only)
Lane B  → @clive-man → Proposer → Challenger → Executor
Lane C  → Human (Matthew / TL)
```

Route 1 (`household-routing-standard`): only **complete Lane A** → Executor.

## Challenger clearance

- Verdict: **PROCEED**
- Pending v0.4 Persona Config (`recSKTT8NTTJOmuRu`) remains **Pending** — fail-closed
- Checkpoint sentinel `PENDING_RUTH_CHECKPOINT_STORE` — no invented schema
- Archive / control IDs labelled **live-observed**, not canonical promotion

## Persona Config gate

| Record | Config Name | Status | Repo action |
|--------|-------------|--------|-------------|
| `rect04amPJAZrWCi4` | Operational v0.3 | Approved | Current `persona-config.generated.md` |
| `recSKTT8NTTJOmuRu` | Operational v0.4 | **Pending** | ID map only; `--pin-version` fails closed |

Regenerate v0.4 sync only after Matthew sets Status → Approved in Airtable:

```bash
python3 scripts/generate_persona_config_sync.py --agent clive-man --pin-version "Operational v0.4"
```

Verify gate without generating:

```bash
python3 scripts/generate_persona_config_sync.py --agent clive-man --verify-pending-gate
```

## 76-test manifest arithmetic

| Bucket | IDs | Count | Owner |
|--------|-----|-------|-------|
| Cursor static + resolver | CM-CUR-001 … CM-CUR-038 | **38** | This pack (`scripts/test_clive_man_context_flow.py`, `scripts/test_generate_persona_config_sync.py`) |
| Hyperagent runtime / offline | CM-HA-001 … CM-HA-047 + seam + executable + hardening | **50 + 26 + 17 + 25 + 112 specialist** | Hyperagent Builder (exports, schedules, pen scripts) |
| **Total offline (Hyperagent family)** | | **230** | |

Cursor suites (separate from Hyperagent family total):

| Suite | File | Count |
|-------|------|------:|
| CM-CUR static + routing | `scripts/test_clive_man_context_flow.py` | 40 |
| Persona resolver gate | `scripts/test_generate_persona_config_sync.py` | 12 |
| **Cursor offline** | | **52** |

Cursor tests **do not** claim Hyperagent runtime passes.

**Routing freshness note:** Clive's Man family v0_4 exports embed Option 3 Route 1 from
`.claude/skills/household-routing-standard/SKILL.md`. The standalone Hyperagent export
`skill-household-routing-standard-v0_1.json` is unchanged legacy text — do not conflate.

## Scheduled family contract (HyperAgent — repo metadata)

| Local time (Europe/London) | Actor slug |
|----------------------------|------------|
| 05:00 | `clive-man-ambient-capture` |
| 06:00 | `clive-man-context-auditor` |
| 07:00 | `clive-man-context-challenger` |
| 08:00 | `clive-man-context-executor` |

Ambient: V1-only `CREATE_DRAFT_TRUTH` on Context Amendment Versions
(`tblsuOKGjSGYv0Vov`) — **no direct Draft Brain Truth write**; tools
`searchthreads` + `execute-script` only; Kimi K3 low; $20 cap; schedule **disabled**.

## Household Versions archive ledger (live-observed 2026-08-12)

| Role | Head | Minion |
|------|------|--------|
| head | `recAYg5sOLH1JHYdK` | `reclxxOUDOW6FoztJ` |
| proposer | `recNXbUfwRw0LyIoD` | `recj6Hi6DSOafmyhB` |
| challenger | `recLffOxIGvnzg5pM` | `rec7wUHWrDBwxlY5j` |
| executor | `recjSvUrWZdms2WV5` | `rec26uMdaXzMhghVR` |
| ambient | `rec7jSAcGf464sVli` | `rec7PtTNAhAZX6ATT` |
| context auditor | `recj8VrSp8iFecHf5` | `recfPjrVRbmG0l3yH` |
| context challenger | `reckC1zjpHVovd4jA` | `recsDPj5MkDEkduys` |
| context executor | `recRKvsDUVicStHBu` | `reccRTyohm8BOwxJX` |

`What changed` fields blank until post-build parent update.

## Workshop control plane IDs (live-observed)

- Amendments: `tblsuOKGjSGYv0Vov`
- Events: `tblM7gxcsWYijdaM8`
- Fingerprints: `tblakbMPiim1K13Ru`
- Household Versions: `appPrpfvsAr71RPP3` / `tbleX09zbkUNKTGBz`

## Active Cursor artifacts

### Agents (`.cursor/agents/`)

- `clive-man.md` — head; Option 3 routing
- `clive-man-proposer.md`, `clive-man-challenger.md`, `clive-man-executor.md`
- `clive-man-ambient-capture.md` — **new**

### Skills (`.cursor/skills/` + `.claude/skills/` mirrors)

- `clive-man/` — Option 3, Draft status, scheduled family
- `clive-man-proposer/`, `clive-man-challenger/`, `clive-man-executor/` — injection fence
- `clive-man-ambient-capture/` — **new**
- `clive-man-context-auditor/`, `clive-man-context-challenger/`, `clive-man-context-executor/` — **new**
- `household-routing-standard/` — Route 1 Lane A gate (Cursor + Claude mirrors)

### Shared plumbing

- `scripts/generate_persona_config_sync.py` — strict pin, full SHA-256, Pending gate
- `website/src/lib/brains/airtable-ids.ts` — control tables, ledger, v0.4 Pending
- `hyperagent/scripts/fleet_sync_roster.json` — hyphen / no-dash aliases
- `docs/initiatives/brain-key-schema.md` — four-value Draft status row
- `docs/business/architecture.md`, `docs/context/source-registry.md`

## Model pins (unchanged doctrine)

| Agent | Model |
|-------|-------|
| `clive-man` | `gpt-5.6-sol-xhigh` |
| Trinity minions | `composer-2.5-fast` |
| Ambient Capture (HA) | Kimi K3 low |
| Context Executor (HA) | Kimi K3 low |

## Remaining gates (explicit)

1. **Persona v0.4** — Matthew approves `recSKTT8NTTJOmuRu` in Airtable → re-run pin sync
2. **Ruth checkpoint** — `PENDING_RUTH_CHECKPOINT_STORE` schema + live store
3. **Hyperagent Builder** — export JSON, enabled schedules, pen wiring, offline CM-HA tests
4. **UI verification** — Ambient schedule hard stop before 05:00 enablement

## Hyperagent Builder handoff (self-contained)

**Branch:** `cursor/clive-man-context-flow-f54c` (isolated workspace; do not merge until parent review)

**Build:**

1. Read this pack + governed skills under `.cursor/skills/clive-man-*`
2. Emit/update Hyperagent exports for:
   - `clive-man-ambient-capture` (05:00 disabled)
   - `clive-man-context-auditor` (06:00)
   - `clive-man-context-challenger` (07:00)
   - `clive-man-context-executor` (08:00)
3. Wire tools exactly per Ambient skill; actor slugs must match literals (no alias on actor). Ambient create credential: `appL2fdnGmhA02WXd` / `tblsuOKGjSGYv0Vov` (V1 proposal queue) — **not** Draft Brain Truth `tblswvXNYFDqnl6af`.
4. Run CM-HA-001 … CM-HA-038 against live/runtime surfaces
5. Do **not** mark Persona v0.4 Approved or fabricate hashes

**Do not:** commit Persona approval, mutate Airtable schema, enable 05:00 without Ruth + UI sign-off.

## Pre-build checklist

- [x] Option 3 in head agent + clive-man skill
- [x] Injection fence in P/C/E skills
- [x] Route 1 Lane A gate in routing standard mirrors
- [x] Ambient agent + skill + Claude mirror
- [x] Three Context specialist governed skills
- [x] Persona resolver Pending gate + tests
- [x] ID map + archive ledger + fleet aliases
- [x] Cursor test manifest (40 CM-CUR + 12 persona gate)
- [ ] Hyperagent exports (next builder)
- [ ] v0.4 Persona Approved (Matthew)
- [ ] Ruth checkpoint store live
