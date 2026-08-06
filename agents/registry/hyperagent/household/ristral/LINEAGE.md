# Ristral — LINEAGE

Registry home: `agents/registry/hyperagent/household/ristral/` (`household` is a
new registry category created with this agent).

## Design lineage (build packs)

| Version | Date | Note |
|---|---|---|
| `build-pack-v0.2.md` | 2026-08-06 | R3/R4/R5 folded, R1/R2 held; Challenger pass 2 DELTA CLEARED; R6 fold. History — superseded. |
| `build-pack-v0.3.md` | 2026-08-06 | Pam A1/A2/B1/C1/D1/D2 folded; Challenger pass 4 DELTA CLEARED. History — superseded. |
| `build-pack-v0.4.md` | 2026-08-06 | Matthew's ten item decisions + his two design changes (per-agent runs; activity-log context read) folded; Challenger pass 5 DELTA CLEARED. **Build-to version.** |

v0.1 (2026-08-05) was the Challenger pass-1 REVISE (R1-R5) draft; it was never
landed as a separate file in this directory — its content is carried forward
into v0.2.

## Trinity record (carried into every artifact header)

| Gate | Outcome |
|---|---|
| Commission | Clive Wigglesworth Stage 4 brief, 2026-08-05 |
| Challenger | pass 1 REVISE (R1-R5) → pass 2 DELTA CLEARED → pass 3 R6 FOLDED CORRECTLY → pass 4 DELTA CLEARED → pass 5 DELTA CLEARED (v0.4) |
| Pam | PROCEED-WITH-CONDITIONS (A1/A2/B1/C1/D1/D2), all folded |
| Matthew | item decisions 2026-08-06; build approval 2026-08-06 (quote below) |

## Build approval instrument (verbatim)

> **"I approve of his build plan. Invoke Ruth for him pls"**
> — Matthew, Hyperagent thread `cmsg1c6z30aiy07ad7ptadrpg`, 2026-08-06 (Europe/London)

The approving message referenced "build pack v0.3"; v0.4 is v0.3 plus Matthew's
own ten item decisions and two directed design changes, folded and
Challenger-verified (pass 5 DELTA CLEARED) under the same approval conversation.
The approval covers **v0.4 as the designed state**; the build was produced to
v0.4.

## Build artifacts (this build, v0.1)

| Artifact | Path |
|---|---|
| Dispatch brief | `agents/registry/hyperagent/household/ristral/executor-dispatch-brief-v0.1.md` |
| Generator | `hyperagent/builds/build_ristral_v0_1.py` |
| Agent export | `hyperagent/exports/agents/agent-ristral-v0_1.json` |
| Embedded skill export | `hyperagent/exports/skills/skill-ristral-weekly-scout-v0_1.json` |
| This lineage file | `agents/registry/hyperagent/household/ristral/LINEAGE.md` |

## Out-of-scope (owned by other lanes)

The two Airtable tables (Scout Watch Roster, Scout Reports), the seed roster
data rows, and the Button field mechanics are **Ruth Hadley's parallel
data-layer commission** (Matthew item 1). Ristral consumes the tables; Ruth's
lane owns their structure. Not built here.

## Session IDs

Dispatching session parent `clive--20260806T1043Z--rx`; root
`clive--20260805T0717Z--kx`.
