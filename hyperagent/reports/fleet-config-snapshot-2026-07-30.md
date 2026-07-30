# HA Fleet Config Snapshot — 2026-07-30

- Captured-at: 2026-07-30T13:35:00.000Z
- Repo HEAD at capture: `a985dc6f641a68ada65e9bf3cf051d9e789765c5`
- Branch target: `workshop/fleet-config-snapshot-v0_1` (not committed by Doc — no GitHub integration on this agent)

| Agent | Export path | Drift vs repo | Basis | Notes |
|---|---|---|---|---|
| Clive Agent Factory (Hyperagent) | hyperagent/exports/agents/agent-clive-agent-factory-v3.json | none (repo export = live at export time) | repo export | exportedAt 2026-06-25T07:12:07.000Z |
| Clive's Man — Challenger | hyperagent/exports/agents/agent-clive-man-challenger-v0_1.json | none (repo export = live at export time) | repo export | exportedAt 2026-07-04T21:27:40.000Z |
| Clive's Man — Executor | hyperagent/exports/agents/agent-clive-man-executor-v0_1.json | none (repo export = live at export time) | repo export | exportedAt 2026-07-04T21:27:40.000Z |
| Clive's Man — Proposer | hyperagent/exports/agents/agent-clive-man-proposer-v0_1.json | none (repo export = live at export time) | repo export | exportedAt 2026-07-04T21:27:40.000Z |
| Clive's Man | hyperagent/exports/agents/agent-clive-man-v0_1.json | none (repo export = live at export time) | repo export | exportedAt 2026-07-04T21:27:40.000Z |
| Doc's Workshop Builder (On-Platform) | hyperagent/exports/agents/agent-doc-workshop-hyperagent-onplatform-v0_1.json | none (repo export = live at export time) | repo export | exportedAt 2026-07-04T01:49:29.000Z |
| External Context Scanner | hyperagent/exports/agents/agent-external-context-scanner-v0_1.json | none (repo export = live at export time) | repo export | exportedAt 2026-07-01T23:18:22.000Z |
| Kathryn Goodchild | hyperagent/exports/agents/agent-kathryn-goodchild-v0_1.json | none (repo export = live at export time) | repo export | exportedAt 2026-06-25T11:50:00.000Z |
| Lazlo Marlowe | hyperagent/exports/agents/agent-lazlo-marlowe-v0_1.json | none (repo export = live at export time) | repo export | exportedAt 2026-06-27T07:27:41.000Z |
| Milo Cadence | hyperagent/exports/agents/agent-milo-cadence-v0_1.json | none (repo export = live at export time) | repo export | exportedAt 2026-06-27T07:09:59.000Z |
| 🛠️ Skill Forge (AstraJax) | hyperagent/exports/agents/agent-skill-forge-astrajax-v0_1.json | none (repo export = live at export time) | repo export | exportedAt 2026-07-04T15:20:47.000Z |
| Doc Albright | hyperagent/exports/agents/agent-doc-albright-onplatform-v0_1.json | new file | LIVE GetAgentConfig capture | modelId moonshotai/kimi-k3-fast; skills attached by id (7) |
| Clive Wigglesworth | hyperagent/exports/agents/agent-clive-wigglesworth-v0_1.json | new file (UNVERIFIED-LIVE stub) | spawnable roster metadata | reasoning head, thinking lane; Cursor twin .cursor/agents/clive.md |
| Pam Portiscue | hyperagent/exports/agents/agent-pam-portiscue-v0_1.json | new file (UNVERIFIED-LIVE stub) | spawnable roster metadata | challenger; Cursor twin .cursor/agents/pam.md |
| Doc's Workshop Challenger | hyperagent/exports/agents/agent-doc-workshop-challenger-v0_1.json | new file (UNVERIFIED-LIVE stub) | spawnable roster metadata | red-team minion; Cursor twin .cursor/agents/doc-workshop-challenger.md |
| Clive's Man — Ambient Capture | hyperagent/exports/agents/agent-clive-man-ambient-capture-v0_1.json | new file (UNVERIFIED-LIVE stub) | spawnable roster metadata | scheduled unattended capture; executionMode auto |
| Horace Farthing | hyperagent/exports/agents/agent-horace-farthing-v0_1.json | new file (UNVERIFIED-LIVE stub) | spawnable roster metadata | money-watch reasoning head; weekly digest + flash alerts |
| Kate | hyperagent/exports/agents/agent-kate-v0_1.json | new file (UNVERIFIED-LIVE stub) | spawnable roster metadata | website scene-craft; executionMode auto |
| Prof. Halvard Bjornson | hyperagent/exports/agents/agent-prof-halvard-bjornson-v0_1.json | new file (UNVERIFIED-LIVE stub) | spawnable roster metadata | fleet-health reasoning head; executionMode confirm |
| Doc's Workshop Proposer (On-Platform) | hyperagent/exports/agents/agent-doc-workshop-proposer-onplatform-v0_1.json | new file (UNVERIFIED-LIVE stub) | spawnable roster metadata | LEGACY / SUPERSEDED — merged into Doc Albright 2026-07-04 |

## Honesty notes

- 11 agents: repo export JSONs copied unchanged. These are live-at-export truth; drift unknown (cross-agent live reads not available to Doc).
- Doc Albright: full LIVE capture via his own GetAgentConfig this session.
- 8 agents: UNVERIFIED-LIVE stubs from spawnable-roster metadata only. systemPrompt, model, tools, skills NOT captured — platform siloing prevents cross-agent config reads. A true live snapshot of these requires either a platform admin export or each agent's own GetAgentConfig.
- Doc's Workshop Proposer (On-Platform) is superseded (merged into Doc Albright 2026-07-04); included for completeness, flagged.
- Skill exports are a parallel Skill Forge job; not covered here.