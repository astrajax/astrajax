# Executor Dispatch Brief — Ristral (Weekly Best-Practice Scout)

Target: `agents/registry/hyperagent/household/ristral/executor-dispatch-brief-v0.2.md`
From: Doc Albright (On-Platform), thread `cmsg1c6z30aiy07ad7ptadrpg`
To: Doc's Workshop Executor (on-platform)
Date: 2026-08-06 (v0.2 — watch-roster pulse amendment, same day)
Status: CLEARED FOR BUILD — Matthew's explicit approval in-thread. **v0.2 supersedes v0.1: adds the watch-roster pulse amendment (below).**

## Approval instrument (verbatim quote — required, a brief without it is not cleared)

> **"I approve of his build plan. Invoke Ruth for him pls"**
> — Matthew, Hyperagent thread `cmsg1c6z30aiy07ad7ptadrpg`, 2026-08-06 (Europe/London)

**Amendment authorization (verbatim, Matthew-instructed via Clive, 2026-08-06):** "Let's get Ristral to review the watch list on a weekly pulse too in case it needs updating vs the usage" + "send the brief to doc to update Ristral". Session IDs: parent `clive--20260806T1043Z--rx`, root `clive--20260805T0717Z--kx`.

**Approval-version note:** the approving message referenced "build pack v0.3." v0.4 is v0.3 plus Matthew's own ten item decisions and two directed design changes (per-agent runs; activity-log context read), folded and Challenger-verified (pass 5 DELTA CLEARED) under the same approval conversation. The approval covers **v0.4 as the designed state**. Build to v0.4.

## Amendment v0.2 — watch-roster pulse (appended to the weekly run contract)

Matthew-instructed, tier **Green** (draft-base additive writes, human-gated curation; reuses the existing findings table + gate + read-only activity read; **zero new surfaces**). Appended to pack v0.4 §7 as step 7 (subsequent steps renumber 8/9/10) and to the schedule prompt:

> **Watch-roster pulse (weekly, after findings are written).** Read the household's recent Household Activity rows for the watched agents (read-only). Then review the Scout Watch Roster and write proposed changes as NEW ROWS in Scout Reports with Topic = `Watch Roster` and Proposed Action describing the change — never edit roster rows yourself. Propose: (a) **New watchers** — an agent with rising Household Activity whose best-practice surface isn't yet watched (draft the full roster row contents in the proposal: Topics, Trusted Sources, Delta Format); (b) **Topic drift** — a watched agent's usage has shifted so its Topics To Watch / Trusted Sources should change; (c) **Quiet agents** — an agent with no meaningful activity for 4+ weeks whose watch may be paused. Findings flow through the normal gate: Matthew's click curates; roster edits are his alone. Cap: **at most 3 roster-proposal findings per weekly run.**

Bounds carried into the Never list: she **never edits roster rows directly** — roster changes are proposals only, gated through Matthew's click. The digest (step 9) now includes the pulse proposals alongside findings and dispatches.

## Trinity record (carried into every artifact header)

| Gate | Outcome |
|---|---|
| Commission | Clive Wigglesworth Stage 4 brief, 2026-08-05 |
| Challenger | pass 1 REVISE (R1–R5) → pass 2 DELTA CLEARED → pass 3 R6 FOLDED CORRECTLY → pass 4 DELTA CLEARED → pass 5 DELTA CLEARED (v0.4) |
| Pam | PROCEED-WITH-CONDITIONS (A1/A2/B1/C1/D1/D2), all folded |
| Matthew | item decisions + build approval + **watch-roster pulse amendment** — 2026-08-06 |

## What you build (the agent artifacts only)

| Artifact | Path |
|---|---|
| Build pack (design) | `agents/registry/hyperagent/household/ristral/build-pack-v0.4.md` |
| This dispatch brief | `agents/registry/hyperagent/household/ristral/executor-dispatch-brief-v0.2.md` |
| Generator | `hyperagent/builds/build_ristral_v0_1.py` (amended: schedule prompt + skill run-contract now carry the pulse) |
| Agent export | `hyperagent/exports/agents/agent-ristral-v0_1.json` (regen — schedule prompt carries the pulse) |
| Embedded skill export | `hyperagent/exports/skills/skill-ristral-weekly-scout-v0_1.json` (regen — run-contract step 7 carries the pulse) |
| LINEAGE | `agents/registry/hyperagent/household/ristral/LINEAGE.md` |

**Branch:** `workshop/ristral-v0-1` (Matthew merges). GitHub MCP write actions (`github__create_branch`, `github__push_files` via `paramsFile`) — **not** local git push. Owner **`astrajax`**.

## Config to encode (pack v0.4 §3 — verbatim targets; unchanged by the amendment except the schedule prompt)

- **name** Ristral · **slug** `ristral` · **icon** 🪶
- **description:** "Weekly best-practice scout — household functional minion (Red Kite, female). One focused run per watched agent weekly: reads that agent's recent Household Activity (read-only) to understand real use, then searches its trusted sources for operating deltas; findings written to draft tables, untrusted-tagged. Human click-to-action (self-stamping Button) is the only finding-to-change path; on an Actioned row she fires a fixed-shape InvokeNamedAgent brief to Doc Albright (On-Platform). Never edits skills/memories/configs/canon; no credentials for other agents; no user interaction."
- **modelId** `sonnet-latest` · **effort** `high` · **maxThinkingTokens** 16000 · **defaultSubagentModel** `inherit`
- **maxBudgetUsd** **10** · **executionMode** **auto**
- **allowedIntegrations** `["airtable"]`
- **toolSettings:** `web-search` ON (Exa mode), `execute-script` ON, everything else OFF
- **skills:** embedded `ristral-weekly-scout` (selected, preload) — §8 contract + §7 run contract (incl. the pulse step) + cursor-write helper (D1)
- **learning:** autoSave* false; suggestions false; enableKnowledgeDiscovery true; skillScope selected; skillLoadMode preload
- **scheduledInvocations:** one — RRULE `FREQ=WEEKLY;BYDAY=MO;BYHOUR=7;BYMINUTE=30;BYSECOND=0`, Europe/London, threadStrategy `new`; prompt = pack v0.4 §7 run contract **including the watch-roster pulse**
- **systemPrompt:** pack v0.4 §1 + §5 + §7 + §8 verbatim

## Embedded skill `ristral-weekly-scout` (must carry)

1. **Documentation** — §8 operational contract + §7 run contract (now with the pulse as step 7), verbatim where load-bearing.
2. **Cursor-write helper script** (D1): field-ID allowlist = exactly `Last Scanned`; whole-call preflight; readback-by-field-ID exact compare; append-only change-log row per write; scoped credential via env var, never printed. Mirrors the Context Amendment Execute rail.
3. All 12 required skill fields; skillScope selected; skillLoadMode preload.

## Validation (run before landing)

- `validate_hyperagent_export.py` against agent JSON + skill JSON: **both PASS** (re-run after the regen; confirmed 2026-08-06, pulse present in both).
- Governed defaults confirmed: autoSave* false, skillScope selected, skillLoadMode preload, allowedIntegrations `["airtable"]` only.

## Out of scope — DO NOT DO

- **The two Airtable tables** (Scout Watch Roster, Scout Reports) — Ruth Hadley's parallel commission. Do not create, design, or mutate.
- **Seed roster data rows** — data write into Ruth's tables, Phase B with her lane.
- **Button field mechanics** — the Button only flips + stamps; the InvokeNamedAgent dispatch fires from Ristral's weekly run, NOT the button.
- **No GitHub main push, no deploy, no import; no canon promotion; no Trusted Brain contact.**

## Pre-build UI checks — held OPEN for Matthew

- **R1** — create-only airtable granularity: Matthew applies via Configure access after the draft config card exists.
- **R2** — scheduled InvokeNamedAgent: verified at import with one supervised run.

## After you land

Hand back: what changed (branch, commit, artifact list, validation result), what Matthew does next (merge → save card → Configure access R1 → supervised R2 run → Ruth's tables → seed roster), and the line **"Clive's Man context sync owed (Cursor lane)"**.
