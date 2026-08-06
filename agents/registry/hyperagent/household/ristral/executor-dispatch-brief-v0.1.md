# Executor Dispatch Brief — Ristral (Weekly Best-Practice Scout)

Target: `agents/registry/hyperagent/household/ristral/executor-dispatch-brief-v0.1.md`
From: Doc Albright (On-Platform), thread `cmsg1c6z30aiy07ad7ptadrpg`
To: Doc's Workshop Executor (on-platform)
Date: 2026-08-06
Status: CLEARED FOR BUILD — Matthew's explicit approval in-thread.

## Approval instrument (verbatim quote — required, a brief without it is not cleared)

> **"I approve of his build plan. Invoke Ruth for him pls"**
> — Matthew, Hyperagent thread `cmsg1c6z30aiy07ad7ptadrpg`, 2026-08-06 (Europe/London)

Session IDs: dispatching session parent `clive--20260806T1043Z--rx`, root `clive--20260805T0717Z--kx`. Doc's own session this thread carries root `clive--20260805T0717Z--kx`. Executor: carry these as parent/root session IDs in your logging.

**Approval-version note for the record:** the approving message referenced "build pack v0.3." v0.4 is v0.3 plus Matthew's own ten item decisions and two directed design changes (per-agent runs; activity-log context read), folded and Challenger-verified (pass 5 DELTA CLEARED) under the same approval conversation. The approval covers **v0.4 as the designed state**. Build to v0.4.

## Trinity record (carried into every artifact header)

| Gate | Outcome |
|---|---|
| Commission | Clive Wigglesworth Stage 4 brief, 2026-08-05 |
| Challenger | pass 1 REVISE (R1–R5) → pass 2 DELTA CLEARED → pass 3 R6 FOLDED CORRECTLY → pass 4 DELTA CLEARED → pass 5 DELTA CLEARED (v0.4) |
| Pam | PROCEED-WITH-CONDITIONS (A1/A2/B1/C1/D1/D2), all folded |
| Matthew | item decisions 2026-08-06; **build approval 2026-08-06, quote above** |

## What you build (the agent artifacts only)

| Artifact | Path |
|---|---|
| Build pack (land the design) | `agents/registry/hyperagent/household/ristral/build-pack-v0.4.md` (already staged in-repo scratch; move to canonical on your branch) |
| This dispatch brief | `agents/registry/hyperagent/household/ristral/executor-dispatch-brief-v0.1.md` |
| Generator | `hyperagent/builds/build_ristral_v0_1.py` |
| Agent export | `hyperagent/exports/agents/agent-ristral-v0_1.json` |
| Embedded skill export | `hyperagent/exports/skills/skill-ristral-weekly-scout-v0_1.json` |
| LINEAGE | `agents/registry/hyperagent/household/ristral/LINEAGE.md` |

**Branch:** `workshop/ristral-v0-1` (workshop branch; Matthew merges — his approval gate, per the asset-delivery rule). Use the connected GitHub MCP write actions (`github__create_branch`, `github__push_files` staged via `paramsFile` for large payloads) — **not** local git push; the sandbox token is read-only for push. Address the repo as owner **`astrajax`** (`astrajax/astrajax`), never `mphopkinson92/astrajax` (owner mismatch, blocked 10 Jul 2026).

## Config to encode in the export (from pack v0.4 §3 — verbatim targets)

- **name** Ristral · **slug** `ristral` · **icon** a red kite (generate a custom icon per the character — a red kite in flight — or a fitting emoji if generation is declined; do not invent a URL)
- **description:** "Weekly best-practice scout — household functional minion (Red Kite, female). One focused run per watched agent weekly: reads that agent's recent Household Activity (read-only) to understand real use, then searches its trusted sources for operating deltas; findings written to draft tables, untrusted-tagged. Human click-to-action (self-stamping Button) is the only finding-to-change path; on an Actioned row she fires a fixed-shape InvokeNamedAgent brief to Doc Albright (On-Platform). Never edits skills/memories/configs/canon; no credentials for other agents; no user interaction."
- **modelId** `sonnet-latest` · **effort** `high` · **maxThinkingTokens** 16000 · **defaultSubagentModel** `inherit`
- **maxBudgetUsd** **10** (Matthew, 2026-08-06)
- **executionMode** **auto** (R2: auto is what lets a scheduled dispatch fire without a pended card)
- **allowedIntegrations** `["airtable"]`
- **toolSettings:** `web-search` ON (Exa mode), `execute-script` ON, everything else OFF (`browser`, `documents`, `searchthreads`, `tables`, `webpage`, `slides`, `hyperapps`, media, `geocode`, Exa-side `exafindsimilar`/`exaanswer`/`exaresearch`/`exawebsets` all OFF)
- **skills:** embedded `ristral-weekly-scout` (selected, preload) — carries the full system-prompt detail (§8) + the cursor-write helper script (§7 D1)
- **learning:** autoSaveMemories/Skills/Agents/Prompts all `false`; enableMemory/Prompt/SkillSuggestions `false`; enableKnowledgeDiscovery `true`; skillScope `selected`; skillLoadMode `preload`
- **scheduledInvocations:** one — RRULE `FREQ=WEEKLY;BYDAY=MO;BYHOUR=7;BYMINUTE=30;BYSECOND=0`, timezone `Europe/London`, threadStrategy `new`; prompt = pack v0.4 §7 run contract (per-agent sequence)
- **systemPrompt:** assemble from pack v0.4 §1 (what she is) + §5 roster fit + §7 run contract + §8 prompt shape. The §8 Never list, injection fence, per-agent grounding, and model-tiering honesty are load-bearing — carry them verbatim.

## Embedded skill `ristral-weekly-scout` (must carry)

1. **Documentation** — the full §8 operational contract + §7 weekly-run contract, verbatim where load-bearing.
2. **Cursor-write helper script** (D1 — the structural bound):
   - Holds a **field-ID allowlist containing exactly `Last Scanned`** — a payload naming any other field is structurally refused before any write.
   - Whole-call preflight → write → **readback-by-field-ID with exact compare** → **append-only change-log row per cursor write**.
   - Scoped credential (create+update on the Workshop base only), injected as an env var at run time (RunWithCredentials pattern), never printed or logged.
   - Mirrors the household's Context Amendment Execute rail.
3. All 12 required skill fields; `skillScope=selected`, `skillLoadMode=preload`.

## Validation (run before landing)

- Reconstruct and run `validate_hyperagent_export.py` against the agent JSON + skill JSON (the Clive's Man family pattern): all PASS. Governed defaults confirmed: autoSave* false, skillScope selected, skillLoadMode preload, allowedIntegrations `["airtable"]` only.
- Confirm the embedded skill JSON carries the helper script + the field-ID allowlist.

## Out of scope — DO NOT DO (named explicitly)

- **The two Airtable tables** (Scout Watch Roster, Scout Reports). These are **Ruth Hadley's parallel commission** — her Build Challenger/Executor flow lands the manifest. Do not create, design, or mutate them. Do not write the table schemas as agent artifacts beyond referencing them in the prompt.
- **The seed roster data rows.** Seeding one row per Active registry agent is a **data write into Ruth's tables**, executed at Phase B after her tables exist — coordinate with her lane; do not pre-empt it by creating tables yourself.
- **The Button field mechanics.** The Button (flip + stamp Actioned By/At) is part of Ruth's table build. Note for coordination: per the pack, the Button **only** flips + stamps; the InvokeNamedAgent dispatch is fired by **Ristral's next weekly run** reading Actioned rows, NOT by the button — there is no button→dispatch coupling to build. If Ruth's native button cannot carry flip+stamp in one action, flag to Matthew, do not improvise a workaround.
- **No GitHub main push, no deploy, no import.** Workshop branch only; Matthew merges and imports.
- **No canon promotion, no Airtable writes outside the design, no Trusted Brain contact.**

## Pre-build UI checks — held OPEN for Matthew (do not treat as done)

- **R1** — create-only airtable granularity: Matthew reported it exists ("It can"). He applies it via **Configure access** after the draft config card exists. Executor: note this in the handoff summary; it is Matthew's action, not yours.
- **R2** — scheduled InvokeNamedAgent: verified at import with **one supervised run** (fire-vs-pend observed). Executor: this is part of the import checklist you hand back, not something you can settle on the branch.

## After you land

Hand back: what changed (branch, commit, artifact list, validation result), what Matthew does next (merge → import → Configure access R1 → supervised R2 run → Ruth's tables → seed roster), and the line **"Clive's Man context sync owed (Cursor lane)"**.
