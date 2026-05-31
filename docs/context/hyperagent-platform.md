# Hyperagent Platform Context

**Status:** Seeded platform reference.  
**Owner:** Matthew.  
**Last verified:** 2026-05-31.  
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

## Current Capability Baseline

Source: manual review of Matthew's Hyperagent email export on 2026-05-31.

Do not design from the old assumption that Hyperagent has no native
integrations or only generic browser/web tools. Hyperagent currently supports
agent work across native integrations, custom MCP, Slack, Gmail/GSuite, GitHub
connection paths, Airtable, Databricks examples, schedules, Live mode, skills,
knowledge modes, subagents, files, code execution, and generated artifacts.

Before finalising a Hyperagent build pack, still verify the exact integration
catalogue and auth path in the Hyperagent UI. The design default is now
"available, verify configuration", not "unavailable".

### Integrations and MCP

- Hyperagent announced native integrations for common tools and support for
  custom MCP servers.
- The Composio incident disabled Composio-powered integrations, but it did not
  mean third-party access disappeared. Many services can connect natively
  through skills that call the service API directly and store credentials on
  the skill.
- Hyperagent said native integrations for widely used tools such as GSuite and
  GitHub were being built, and later announced native integrations plus custom
  MCP. Matthew has also flagged GitHub and Slack as real native integration
  paths. Do not mark GitHub or Slack impossible without checking current UI
  support.
- Airtable integration was rebuilt using the latest MCP server and can query
  Airtable even when the user only has interface-level permissions.

### Slack Runtime

- Hyperagent agents can be deployed directly in Slack.
- Slack deployment supports a custom identity so teammates can @mention the
  agent by name.
- Connected agents can read Slack threads, and examples include analytics
  agents answering questions directly in Slack.
- Use mentions-only in shared channels unless the channel is explicitly owned
  by the agent. Always include anti-loop rules: never respond to other bots or
  to self.

### Agent Autonomy Patterns

- Live mode lets an agent keep working in the background in a single thread,
  using a checklist and schedule, and reach out proactively when attention is
  needed.
- Scheduled agents are first-class enough for Command Center visibility, failed
  run surfacing, timeout/billing error reporting, and daily or weekly cron-style
  operating patterns.
- Hyperagent can dispatch specialized subagents in parallel. Each subagent has
  a name, role, and focused task; the orchestrator synthesizes their findings.
- Agents and skills can be published to a Team for web-app use. Shared agents
  can be packaged with skills, memories, and tools. Shared credentials can be
  included, or teammates can bring their own credentials.
- Current limitation from the release notes: agents still have one owner; team
  co-owning or collaborative agent config editing was not yet supported in the
  reviewed emails.

### Skills, Knowledge, and Context

- Skills are reusable workspace instructions/processes that teach agents how to
  do a job in a repeatable way. Hyperagent's guidance is to codify important
  agent work into skills, scripts, and memories once outputs are valuable.
- Repeatable work should become a skill rather than remaining buried in a chat
  transcript.
- Knowledge access can use predefined modes. Reviewed examples mention
  Personal mode for broad access to a user's memories and skills, and Curated
  mode for explicit linking. Granular knowledge permissions can still be set
  when needed.
- Named agents can use more than one account for the same integration, such as
  multiple Gmail accounts, selected from a multi-select picker in agent config.

### Built-in Work Surface

- Hyperagent can search live websites, write and run code, analyze data, create
  visualizations, work with uploaded files, and generate images, video, and
  audio in one thread.
- Activation examples mention reading Slack threads, pulling from Airtable,
  HubSpot, or a data warehouse, checking calendar context, and reading Gmail to
  draft replies.
- Agents can edit webpages and dashboards inline and save changes directly to
  the artifact.
- Threads and artifacts can be shared read-only, with links limited to trusted
  email domains.

### Models and Context

- Claude Opus 4.8 is available in Hyperagent.
- Agents can be set to always use the latest Opus or Sonnet model.
- Supported Claude models use their full 1M-token context window by default;
  the reviewed release says the per-agent toggle was removed.

## Current Known Constraints

### Composio Integrations

Composio Airtable was disabled platform-wide in the Clive Intake testing period.
For AstraJax Hyperagent agents, do not assume Composio Airtable works.

Current pattern:

- Use skill scripts for Airtable REST calls.
- Store credentials on the skill (`authType = api_key`).
- Enable `execute-script`.
- Keep `allowedIntegrations` empty unless a live native integration is actually
  required and has been checked against the current Hyperagent UI.

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

Custom MCP support is confirmed by the reviewed Hyperagent release emails.
Design around MCP only when it materially improves the agent, and still verify
the exact server, authentication, and permission setup before final export.

## Observed Model Identifiers

These appear in current repo exports and should be treated as known observed
values, not a complete current catalogue:

- `claude-opus-4-7`
- `claude-opus-4-8`
- `opus-latest`
- latest Opus / latest Sonnet auto-update setting

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
