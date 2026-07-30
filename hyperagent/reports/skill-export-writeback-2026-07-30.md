# Skill Export Write-back — 2026-07-30

- Captured-at: 2026-07-30T13:50:00.000Z
- Branch: workshop/fleet-config-snapshot-v0_1
- Basis: Skill Forge Phase 1 gap report + live GetKnowledgeDetails captures (Doc's widened skill access).

| Skill | Export path | Action |
|---|---|---|
| Household Communication Standard | hyperagent/exports/skills/skill-household-communication-standard-v0_1.json | new (live capture) |
| Household Conduct Standard | hyperagent/exports/skills/skill-household-conduct-standard-v0_1.json | new (live capture) |
| Household Routing Standard | hyperagent/exports/skills/skill-household-routing-standard-v0_1.json | new (live capture) |
| Household Activity Logging | hyperagent/exports/skills/skill-household-activity-logging-v0_1.json | new (live capture) |
| Household Activity Review | hyperagent/exports/skills/skill-household-activity-review-v0_1.json | new (live capture) |
| external-context-scanner | hyperagent/exports/skills/skill-external-context-scanner-v0_1.json | new (standalone twin of embedded) |
| Milo Cadence (embedded char-craft) | hyperagent/exports/agents/agent-milo-cadence-v0_1.json | refreshed (stale copy -> standalone 11f893a1) |

## Not captured (scope)

- fal-image-edit and fal-first-last-frame-video: outside Doc's skill scope (skillScope=selected) and absent from the repo. Need capture via a workspace-scoped reader or Matthew's UI export. NOT guessed.
- Drift on the 14 existing persona skill exports: readable only per-agent; deferred (stub upgrade was descoped).
- CredentialSchema included for the two credentialled skills; credential VALUES never captured (secrets stay sealed).