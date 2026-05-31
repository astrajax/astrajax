# Hyperagent Platform Context

**Status:** Seeded platform reference.  
**Owner:** Matthew.  
**Last verified:** 2026-05-30.  
**Primary consumer:** Clive Agent Factory when designing Hyperagent-deployed agents.  
**Raw release log:** `docs/context/hyperagent-releases.json`.

## Purpose

Keep the current Hyperagent platform reality in one small, versioned place so
Agent Factory does not design agents from stale model training data or old
assumptions.

Agent Factory must read this file before designing or updating any agent whose
primary runtime is Hyperagent.

## Authority Rule

Treat this file as the current working truth for Hyperagent agent design.

Treat `hyperagent-releases.json` entries with `status = unverified` as possible
signals only. Do not recommend a new Hyperagent capability from the raw release
log unless Matthew has confirmed it or this file has been updated.

## Current Build Pattern

Agents are designed and built in Cursor. Hyperagent runtime artifacts are import
exports generated from repo scripts.

```text
Agent Factory in Cursor
  -> generator script in hyperagent/builds/
  -> Cursor mirror in .cursor/agents/ and .cursor/skills/
  -> optional Hyperagent JSON in hyperagent/exports/
  -> Matthew imports/deploys manually
```

Registry folders are split by runtime:

- Cursor-native: `agents/cursor/<family>/<agent>/`
- Hyperagent-deployed: `agents/hyperagent/<family>/<agent>/`

## Current Known Constraints

### Composio Integrations

Composio Airtable was disabled platform-wide in the Clive Intake testing period.
For AstraJax Hyperagent agents, do not assume Composio Airtable works.

Current pattern:

- Use skill scripts for Airtable REST calls.
- Store credentials on the skill (`authType = api_key`).
- Enable `execute-script`.
- Keep `allowedIntegrations` empty unless a live native integration is actually
  required.

### Skills

For agents that depend on a skill for operational behaviour, prefer:

- `skillScope = selected`
- `skillLoadMode = preload`
- `enableKnowledgeDiscovery = true` if the runtime needs skill lookup
- `autoSaveSkills = false`
- `enableSkillSuggestions = false` unless explicitly experimenting

Skills that contain scripts are not documentation only. They require
`execute-script = true`.

### Memory and Auto-Save

For governed AstraJax/Clive agents:

- `autoSaveMemories = false`
- `autoSaveSkills = false`
- `autoSaveAgents = false`
- `autoSavePrompts = false`

Do not let Hyperagent agents silently create operational truth. Route durable
context through Clive Intake and Curator instead.

### Tool Defaults

Default off unless justified:

- browser
- web search / Exa
- image, video, audio generation
- geocode
- slides / webpage generation
- persistent sandbox

Default on only when needed:

- `execute-script` for scripted skills
- `searchthreads` for Slack/threaded confirmation flows

### Slack Runtime

Slack-deployed Hyperagent agents need two separate things:

- Outbound Slack capability in the agent config
- Inbound Slack channel assignment in Hyperagent settings

Use mentions-only in shared channels. Always include anti-loop rules: never
respond to other bots or to self.

### MCP

MCP support is treated as unverified until captured in a confirmed release entry
and promoted into this document. Do not design around MCP unless Matthew has
confirmed current runtime support and authentication requirements.

## Observed Model Identifiers

These appear in current repo exports and should be treated as known observed
values, not a complete current catalogue:

- `claude-opus-4-7`
- `opus-latest`

For Cursor agents, use Cursor model slugs from the active environment instead
of Hyperagent model IDs.

## Export JSON Fields to Preserve

When generating or reviewing Hyperagent exports, pay close attention to:

- `systemPrompt`
- `skillScope`
- `skillLoadMode`
- `toolSettings`
- `allowedIntegrations`
- `enableKnowledgeDiscovery`
- `enableMemorySuggestions`
- `enableSkillSuggestions`
- `enablePromptSuggestions`
- `autoSaveMemories`
- `autoSaveSkills`
- `autoSaveAgents`
- `autoSavePrompts`
- `skills`
- `scheduledInvocations`
- `emailInvocations`
- `webhookEndpoints`

Do not strip existing fields just because the current build script does not use
them. Unknown runtime fields should be preserved or deliberately reviewed.

## Release Scanner Workflow

Scanner writes raw release entries to `docs/context/hyperagent-releases.json`
with `status = unverified`.

Promotion rule:

1. Scanner captures raw release.
2. Matthew or an agent in review mode checks it.
3. Durable platform changes are added to this file.
4. Agent Factory can then rely on the promoted change.

## Staleness Rule

If `hyperagent-releases.json.last_synced_at` is older than seven days when
designing a Hyperagent-deployed agent, Agent Factory should say so and offer to
run:

```bash
python3 hyperagent/scripts/sync_hyperagent_releases.py --mode imap --sender <sender-or-domain>
```

If credentials are not configured, use files mode with exported emails:

```bash
python3 hyperagent/scripts/sync_hyperagent_releases.py --mode files --source-dir path/to/exported-emails --sender <sender-or-domain>
```
