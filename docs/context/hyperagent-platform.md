# Hyperagent Platform Context

**Status:** Curated platform reference (Agent Factory preload).  
**Owner:** Matthew.  
**Last verified:** 2026-05-31 (logged-in UI pass on Matthew's account, exports, release emails, setup docs).  
**Authenticated UI pass:** Complete on `matt@butternutbox.com` workspace (38 agents; AstraJax Clive Curator/Intake/Scanner exports not yet imported here).  
**Primary consumer:** Clive Agent Factory when designing Hyperagent-deployed agents.  
**Raw release log:** `docs/context/hyperagent-releases.json`.

## Purpose

Keep the current Hyperagent platform reality in one small, versioned place so
Agent Factory does not design agents from stale model training data or old
assumptions.

Agent Factory must read this file before designing or updating any agent whose
primary runtime is Hyperagent.

## UI verification status (2026-05-31)

| Source | What it confirms |
|--------|------------------|
| Logged-in app (`matt@butternutbox.com`) | Sidebar nav, Command Center, agent editor tabs, integrations catalogue, invocations, tools toggles, model limits, library filters, global search destinations |
| Public `hyperagent.com` + `/login` | Marketing positioning, auth providers, demo workflow gallery with run time and cost |
| Matthew's Hyperagent release emails | Capability deltas (integrations, Live mode, Command Center, Team publish, etc.) |
| `hyperagent/exports/agents/*.json` | Export schema v1, `toolSettings` keys, `allowedIntegrations`, schedules, model fields |
| Downloaded DS agents (Skill Forge, Agent Factory, etc.) | Live `allowedIntegrations` slugs: `airtable`, `github`, `gmail`, `googlesheets`, `openai` |
| `hyperagent/docs/clive-*-webhook-setup.md` | Webhook URL shape, agent-bound triggers, secret header, skip-on-202 failure mode |

**Account note:** Matthew's live workspace is the Butternut DS bot fleet (~38 agents). AstraJax Clive agents (Curator, Intake, Scanner) are defined in-repo exports; import them before assuming they appear in Command Center or Agents list.

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

## Product URLs and auth (browser-verified login surface)

| URL | Role |
|-----|------|
| `https://hyperagent.com` | Public marketing site |
| `https://hyperagent.com/login` | Sign-in; also shows demo workflow gallery |
| `https://hyperagent.com/api/auth/google/callback` | Google OAuth redirect (observed in OAuth flow) |
| `https://hyperagent.com/api/webhooks/<id>/receive` | Inbound webhook for agent triggers (AstraJax pattern) |
| `https://hyperagent.com/s/<shareId>` | Read-only shared thread/artifact links (domain-trusted) |
| `https://hyperagent.com/threads/new` | Default thread composer (named agent picker, execution mode) |
| `https://hyperagent.com/thread/<threadId>` | Individual thread |
| `https://hyperagent.com/agents` | Agent roster + AI-suggested agent ideas |
| `https://hyperagent.com/agents/<agentId>` | Agent overview (observability, version history) |
| `https://hyperagent.com/agents/<agentId>?page=<tab>` | Agent config tabs (see below) |
| `https://hyperagent.com/command-center` | Fleet dashboard (⌘K → Command Center) |
| `https://hyperagent.com/settings/integrations` | Workspace integrations (**not** `/integrations` — that 404s) |
| `https://hyperagent.com/settings` | Profile, billing, security, referrals, Manus import |
| `https://hyperagent.com/skills` | Workspace skill library (reusable agent capabilities) |
| `https://hyperagent.com/memories` | Persistent facts and domain notes agents can recall |
| `https://hyperagent.com/rubrics` | LLM-as-judge quality rubrics and score history |
| `https://hyperagent.com/library` | Saved thread artifacts (scripts, reports, images) |
| `https://hyperagent.com/learning` | Review queue for auto-suggested skills/memories/prompts |
| `https://hyperagent.com/teams` | Shared team spaces for published agents/skills |

Sign-in providers on `/login`: **Google**, **Apple**, **Microsoft**. Google OAuth scopes observed: `email`, `profile`, `openid`; `prompt=select_account`.

Do not use `app.hyperagent.com` — it does not resolve (chrome error as of 2026-05-31).

## Authenticated navigation (UI-verified)

**Sidebar (persistent):** New thread, Search (⌘K), Library, Learning (badge = pending suggestions count), Integrations → `/settings/integrations`, Agents, Projects, Threads (recent list), Teams, Help, user menu.

**Global search (⌘K) destinations:** recent Threads, plus jump targets — Projects, Threads, Agents, **Command Center**, Skills, Memories, Documents, Rubrics, HyperApps, Workflows, Library, Learning, Integrations.

**Thread composer:** pick **named agent** or default "Hyperagent"; **Execution mode** control (observed: `Plan`); quick prompts (Design a website, Source candidates, Research a topic, Generate images, More…).

## Agent editor (UI-verified)

URL pattern: `/agents/<agentId>?page=<tab>`.

| Tab (`page=` param) | What Matthew configures here |
|---------------------|------------------------------|
| (default / overview) | Recent threads, observability chart (cost per day/thread/run), eval placeholder, version history snapshots |
| `identity` | System prompt and agent description |
| `activity` | Run history for this agent |
| `config` | **Model & Limits** (UI label) — see below |
| `integrations` | Per-agent integration attachments |
| `invocations` | Thread, Slack, Telegram, Schedule, Webhook, Email, Live mode |
| `tools` | Enable/disable platform tools (labels differ from export keys — see Tools catalogue) |
| `skills` | Attached skills + credentials |
| `knowledge` | Curated knowledge mode toggle on overview sidebar; dedicated knowledge tab |

**Overview sidebar cards (per agent):** Access ("Reachable by anyone via invocation sources"), Curated knowledge, Runs on **Auto mode** vs **Ask first**, invocation shortcuts, integration chips, counts for Tools / Skills / Memory / Library.

### Model & Limits tab (`page=config`)

| UI control | Observed on Doc's Minion - Fixer |
|------------|----------------------------------|
| Model | **Latest (Opus)** — auto-updates to newest Opus |
| Extended thinking | Toggle on; **Effort level** = High (Deep reasoning) |
| Budget limit per query | Optional cap per agent query |
| Subagent model | Default (Sonnet) |
| Execution mode | **Auto** (default) vs **Ask first** (pause before sensitive external actions). Threads can override per conversation. |

Maps to export fields: `modelId`, `maxThinkingTokens`, `effort`, `maxBudgetUsd`, plus runtime execution policy (not always present in export JSON).

### Invocations tab (`page=invocations`)

| Invocation type | UI behaviour |
|-----------------|--------------|
| **Thread** | Standard chat threads |
| **Slack** | "Use @Hyperagent in Slack" — **Add to channel** (workspace Slack already connected) |
| **Telegram** | Connect bot |
| **Scheduled** | Cron-style schedule + prompt (example: "Every day at 8 and 14") |
| **Webhook** | **Create webhook** / **Configure** — must be agent-bound with auto-run (AstraJax pattern) |
| **Email** | **Create email** aliases |
| **Live mode** | "Always-on agent. Context stays in one continuous thread." — **Set up** |

Scheduled prompts and RRULE from exports still import via JSON; UI also supports plain-language schedule editing.

## Command Center (UI-verified)

Route: `/command-center` (also via ⌘K).

**Fleet summary cards:** Agents count, Active (running now), Total runs, Avg score (%), Total cost, Pending (learning/rubric suggestions backlog).

**Agent roster table columns:** Agent, Runs, Quality (%), Quality trend, Cost/run, Cost, Last active.

**Sections:** Active Operations (long-running scheduled jobs with elapsed time), Score Trends (90-day chart per agent), Cost Breakdown, **Needs Attention** (pending improvements, schedule failures, agents declining), **Recent Runs** (per-run quality % and cost).

**Schedule failures example (UI):** surfaces agent name, schedule label, error text (e.g. auth token revoked), age.

This is the operational home for scheduled-run health referenced in release emails — not a separate hidden admin page.

## Workspace integrations catalogue (UI-verified)

Path: `/settings/integrations`. Banner when degraded: "Some connected integrations are temporarily unavailable." Guidance: use **API skills with credentials** when no first-party/MCP path exists; **Open Skills** link.

**Integration types in UI:** `NATIVE`, `MCP`, `COMPOSIO` (legacy — disconnect section).

### Featured (connect via OAuth unless configured)

| Service | Type | Notes |
|---------|------|--------|
| Airtable | MCP | Database and applications |
| Gmail | NATIVE | Email send/read |
| Google Calendar | NATIVE | Scheduling |
| Google Drive | NATIVE | Files |
| GitHub | MCP | Repos, issues, PRs |

### Connected example (Matthew's workspace)

| Service | Type | Notes |
|---------|------|--------|
| Slack | NATIVE | Workspace "Butternut Box"; **28** channel deployments — **Manage** |

### All other (catalogue — Connect / Configure)

Databricks (NATIVE), Dropbox (MCP), Google Contacts/Docs/Sheets/Slides/Tasks (NATIVE), Granola (MCP), HubSpot (MCP), Linear (MCP), Microsoft OneDrive/Outlook (NATIVE), Notion (MCP), Sentry (MCP), Supabase (MCP), Twitter/X (NATIVE).

### Composio disconnect bucket (legacy)

Separate section listing old Composio connections (Gmail, OpenAI, Google Drive, GitHub, Fathom, Notion, Sheets, WhatsApp, Calendar, Airtable) with agent reference counts. Hyperagent instructs: migrate agents to native/MCP/skills before disconnecting; revoke Composio in each service after.

Settings copy claims **250+** integrations via OAuth at workspace level.

## Agent excellence stack (Factory — UI-verified 2026-05-31)

Hyperagent separates **how an agent works** (skills + memories + rubrics) from
**what it produced** (library artifacts). Agent Factory must design all five
surfaces deliberately — not treat them as interchangeable "context."

```text
Operational truth (governed)
  Skills     → repeatable procedures + optional Python + credentials
  Memories   → short persistent facts (scoped Global or per-agent)
  Rubrics    → quality scoring for runs (LLM judge)

Ephemeral / outputs
  Library    → files/HTML/scripts saved from threads (not agent memory)
  Learning   → inbox of auto-suggestions → human accepts or ignores
```

**Factory defaults for governed Clive / DS production agents:** keep all four
`autoSave*` flags `false`; route durable knowledge through Intake/Curator/repo;
use Learning only as Matthew's review queue; attach **selected** skills with
`skillLoadMode = preload`; pair production bots with a **Skill Waterfall** +
domain skills (see Matthew's DS fleet).

---

### Skills (`/skills`)

**Purpose:** Building blocks that add specific capabilities to agents and
threads — not the system prompt itself.

**Workspace UI (Matthew's account):**

| Control | Behaviour |
|---------|-----------|
| Tagline | "Building blocks that add specific capabilities to your agents and threads." |
| **Create skill** | New workspace skill |
| **Show Archived** | Include retired skills |
| **Your skills (N)** | Sort: Most recent (also by Name) |
| Table columns | Name, Description, **Agents** (attachment count), **Threads** (usage), Installed on, Actions |

**What excellent DS skills look like (live examples):**

| Pattern | Example skill | Factory note |
|---------|---------------|--------------|
| Skill Waterfall | `ds-clive-skill-waterfall`, `ds-reggie-skill-waterfall` | First load — routes question type → ordered skill chain |
| Domain + scripts | `ds-weekly-report-scripts` (fetch/build/upload Python) | LLM writes analysis only; numbers/charts from scripts |
| Intake + credentials | `bot-operations-feedback-intake` + `airtable_feedback.py` | `authType = api_key`, `execute-script` on agent |
| Guardrails | `ds-kpi-guardrails`, `abs-edit-safety-protocol` | Attach to any bot that reports KPIs or writes ABS |
| Meta | `skill-authoring-best-practices`, `hyperagent-named-agent-design` | Use when Factory designs new agents/skills |
| Fleet registry | `freedom-project-bot-roster` | Agent Factory duplication check — live-query Bot Ops |

**Export / attach fields (from `hyperagent/exports/agents/*.json`):**

- Embedded skill objects: `name`, `description`, `documentation`, `whenToUse`,
  `tags`, `authType` (`none` | `api_key`), `credentialSchema`, `skillMdBody`,
  `scripts` (often JSON-stringified), `references`, `isPinned`
- Agent flags: `skillScope = selected`, `skillLoadMode = preload`,
  `enableKnowledgeDiscovery = true`, `enableSkillSuggestions = false`,
  `autoSaveSkills = false`
- Scripts are **not** documentation-only — agent needs `execute-script` in
  `toolSettings`

**Factory rules:**

1. Codify repeatable work as a **named skill**, not buried prompt prose.
2. One **Waterfall** skill per production bot that routes before data access.
3. Prefer PAT/API scripts on skills over Composio (platform-wide offline).
4. Track attachment counts in UI — if Agents = 0 after deploy, import/attach failed.
5. Use `skill-authoring-best-practices` patterns: activation line, exclusion
   clause, bundled `skill_lint.py`, negative tests.

Skill URLs are slug-based in the list; detail view may require in-app navigation
(slug path alone 404'd for `bot-operations-feedback-intake` during audit).

---

### Memories (`/memories`)

**Purpose:** Persistent notes the runtime can inject — lighter than skills, no
script execution. **Not** a substitute for canonical repo/Airtable context.

**Workspace UI:**

| Control | Behaviour |
|---------|-----------|
| Count | "489 memories stored" (Matthew workspace) |
| **Add Memory** | Manual create |
| **Dedupe Memories** | Workspace cleanup for near-duplicates |
| **Show Archived** | Include retired |
| Filters | **All Memories** vs per-agent scope; **All categories (N)**; search |
| Card fields | Body text, **When to use** (bulb icon line), tags, **Importance** date, **Global** vs named agent chips |

**Categories observed (Learning summary + Memories UI):**

| Category | Typical use |
|----------|-------------|
| Domain Knowledge | Business rules, schema maps, process truth |
| Project Context | Thread/project-scoped working facts |
| User Facts | People, preferences, org facts |
| Preferences | Tone, formatting, defaults |
| tools_and_workflows | Integration paths, PAT vs Composio, tool choice |
| people | Roster / stakeholder notes |

**Scoping:** Memories can be **Global** (all agents) or pinned to specific
agents (e.g. shared Composio-offline warning on Doc Intake + Fixer). Prefer
narrow agent scope over Global unless the fact is fleet-wide policy.

**Factory rules:**

1. `autoSaveMemories = false` on governed agents — use
   `ds-governed-learning-loop` pattern (Slack approval before persist).
2. Do not store large schemas in memories — use **skills** with scripts/refs.
3. After incidents, promote verified fixes to **skills** or repo docs, not only
   memories (memories drift; skills version with export).
4. Schedule periodic **Dedupe** when Learning backlog is high.

---

### Library (`/library`) — artifacts, not agent memory

**Purpose:** Cross-thread gallery of **outputs** saved from runs — evidence and
deliverables, not instructions.

**UI:**

| Control | Behaviour |
|---------|-----------|
| **Show Archived** | Retired items |
| Sort | **Newest** |
| Filters | **Type**, **Visibility**, **Source** (thread/agent) |
| Search | `Search library...` |

**Artifact types (Type filter):** Images, Video, Audio, Webpages, Slides,
Tables, Documents, Apps.

**Live examples in Matthew's library:** `airtable_feedback.py`, `build_report.py`,
`report.html`, `SKILL.md`, agent export JSON, CSV exports, screenshots from
triage threads, `schema-field-ids.md` (some tagged **Global** source).

**Factory rules:**

1. Do not point agents at Library as "knowledge base" — use Skills/Memories/Curated knowledge.
2. Expect scripts and HTML reports to land here after runs — design skills to
   produce deterministic files worth reusing.
3. Agent overview shows **Library** count — high counts signal verbose artifact
   generation; tighten tool/skill scope if unintended.

---

### Learning (`/learning`)

**Purpose:** Human review queue for things Hyperagent **proposes** after
conversations — skills, memories, prompt tweaks, even whole agent drafts.

**UI:**

| Area | Behaviour |
|------|-----------|
| Header | "Your agents learn from conversations" — review and accept worth keeping |
| Pending badge | Sidebar + header count (observed **7286–7289**) — hygiene debt if ignored |
| Summary cards | Quick counts: **Skills** (126, 2 pinned), **Memories** (484+), **Rubrics** (16) with "View all →" links |
| **Agent** filter | Dropdown of all named agents + "No Agent" |
| **Type** filter | Counts per type — observed: Skills **219**, Memories **6340**, Prompts **705**, Agents **22** (type totals ≠ accepted totals; includes pending suggestions) |
| Feed | Per-thread cards: title, agent, message count, age, **suggestion count**, run **quality %** when rubric scored |

**Suggestion types Factory cares about:**

| Type | On accept | Factory stance |
|------|-----------|----------------|
| Skills | New or updated workspace skill | Review like a PR — prefer repo-authored skills for governed bots |
| Memories | New memory card | High risk of duplicate/stale truth — prefer governed loop |
| Prompts | System prompt delta | Treat as prompt change — version in export + Change Log |
| Agents | New agent draft | Run duplication check against `freedom-project-bot-roster` |

**Factory rules:**

1. Never enable `autoSaveSkills` / `autoSaveMemories` / `autoSavePrompts` on
   production Clive agents — Learning exists precisely because auto-save is off.
2. Command Center **Needs Attention** and **Pin Rubric** prompts often originate
   from the same learning pipeline — triage weekly.
3. For DS fleet: bulk pending count is normal after heavy scheduled runs; do not
   interpret as "agents are learning well" without acceptance rate.
4. Click **Type → Skills** to batch-review skill suggestions by category.

---

### Rubrics (`/rubrics`)

**Purpose:** Measure agent output quality with **LLM-as-judge** scoring —
criteria lists, run history, and thread pinning.

**UI:**

| Control | Behaviour |
|---------|-----------|
| Tagline | "Manage evaluation rubrics and track scoring history for agent task quality." |
| **How Evaluations Work** (expandable) | Platform help — see below |
| **Rubric Suggestions** | Separate inbox (observed **50** pending) |
| Search | `Search rubrics...` |
| **All Types** | Filter rubric category |
| **Archived** toggle | Show retired rubrics |
| **Recent Activity** | Latest scored threads with % and rubric name |

**How Evaluations Work (in-app copy, expanded):**

| Topic | Detail |
|-------|--------|
| **Rubric types** | **Style/process** — safe for auto-eval, reusable. **Factual/ground truth** — verifies entities; auto-eval only tests consistency, not live accuracy |
| **Evaluation modes** | **Evaluate Existing** (score last response, no re-run); **Replay & Evaluate** (re-run prompt, then score); **A/B Comparison** (two configs, side-by-side) |
| **Judge model** | Opus 4.6 (recommended), Sonnet 4.6 (faster/cheaper), Same as thread |
| **Auto-Evaluation** | Rubrics with auto-eval on score outputs when tasks complete |
| **Quick start** | Ask agent to "create an evaluation rubric for [task type]" — **Pin rubric to thread** |

**Matthew's live rubrics (examples):**

| Rubric | Type tag | Criteria | Avg score |
|--------|----------|----------|-----------|
| Agent Factory Performance Rubric | support | 5 | 39–64% |
| Clive Wigglesworth Esq. Quality Evaluation | support | 5 | 56–81% |
| DS Airtable Scripting Excellence Rubric | coding | 5 | 59% |
| Debug Bot Performance Rubric | support | 5 | 49% |
| DS Strategy Lab Performance Rubric | analysis | 5–6 | 29–53% |
| Bonus Bot Processing & Logic Rubric | analysis | 4 | — |
| Ops Data Scout Output Quality Rubric | analysis | 5 | — |

Many rubrics show **From conversation** (created via Learning/thread, not hand-authored).

**Factory rules:**

1. Every production Hyperagent bot should have **one primary rubric** aligned to
   its job (support vs analysis vs coding vs operations).
2. Prefer **style/process** criteria for scheduled auto-eval; use ground-truth
   criteria only when inputs are captured in the same thread.
3. Pin rubric to **scheduled dry-run threads** (Marcel/Fixer/Reggie morning runs)
   before trusting Command Center quality %.
4. Low scores (e.g. Strategy Lab ~29%) signal prompt/skill drift — fix in Cursor
   export, not by tweaking rubric thresholds to pass.
5. Command Center **Pin Rubric** / **Needs Attention** links here — use when
   onboarding a new agent from Factory.

---

### How the five surfaces work together (Factory checklist)

When Agent Factory finishes a Hyperagent build pack, confirm:

| # | Check |
|---|--------|
| 1 | **Skill Waterfall** + domain skills attached; `execute-script` if any script |
| 2 | `autoSave*` all `false`; `enableSkillSuggestions = false` |
| 3 | **Rubric** named and pinned on test thread; auto-eval only if stable schedule |
| 4 | **Memories** empty or minimal at launch — facts live in skills/repo |
| 5 | **Learning** reviewed after first week of runs (not left at thousands pending) |
| 6 | **Library** not used as source of truth — only outputs |
| 7 | Curated knowledge / Intake path documented for anything that must be canonical |

## Product surface map (for Factory navigation)

```text
Hyperagent (logged-in — UI-verified)
├── ⌘K Search → Command Center, Skills, Memories, Documents, …
├── Command Center — fleet health, costs, schedules, pending learning items
├── Threads / Projects — conversational work
├── Agents — roster, editor tabs, import/export JSON
│   ├── Invocations — Slack, Telegram, email, webhook, schedule, live mode
│   ├── Tools — platform capability toggles
│   ├── Skills — scripts + credentials (api_key)
│   └── Knowledge — curated vs broad access
├── Skills — workspace library (waterfalls, scripts, credentials)
├── Memories — persistent facts (Global or per-agent)
├── Rubrics — LLM-judge quality + auto-eval
├── Library — thread artifacts (outputs only)
├── Learning — review queue (skills/memories/prompts/agents)
├── Settings → Integrations — OAuth + MCP catalogue
└── Teams — publish agents/skills to coworkers
```

## Login / marketing demo gallery (public UI)

The login page advertises example runs with **duration and USD cost** (useful for Factory cost guardrails, not as capability proof):

| Demo | Duration | Cost (USD) |
|------|----------|------------|
| Out-of-home campaign | 8m 38s | 6.41 |
| Apparel launch | 9m 17s | 6.42 |
| Hiring command center | 22m 11s | 14.18 |
| Small business rebrand | 15m 7s | 3.88 |
| Podcast launch | 25m 56s | 14.20 |
| Product merchandising | 25m 22s | 10.47 |
| Cinematic real estate video | 29m 55s | 24.79 |
| Multi-channel product launch | 16m 10s | 8.79 |
| Real estate listing kit | 9m 35s | 6.75 |
| Personalized prospect outreach | 23m 49s | 8.82 |
| Startup investment research | 18m 28s | 12.05 |
| Brand sponsorship strategy | 8m 36s | 9.02 |

Public homepage agent picker personas (marketing): Chief of Staff, Recruiter, Sales Prospector, Data Analyst — with staged narratives for technical recruiting, growth marketing OOH, etc.

## Current Capability Baseline

Sources: manual review of Matthew's Hyperagent email export, `hyperagent.com`,
and public Hyperagent launch/search snippets from Andrew Busse and Howie Liu on
2026-05-31.

Important source separation: do **not** treat `hyperfx.ai` / `docs.hyperfx.ai`
as Hyperagent evidence. Those pages appear to describe a separate "Hyper AI"
marketing-agent product. They must not be used as canonical source material for
Clive Agent Factory unless Matthew explicitly confirms a relationship.

Do not design from the old assumption that Hyperagent has no native
integrations or only generic browser/web tools. Hyperagent currently supports
agent work across native integrations, custom MCP, Slack, Gmail/GSuite, GitHub
connection paths, Airtable, Databricks/Snowflake examples, schedules, Live
mode, skills, knowledge modes, subagents, browser work, data analysis, code
execution, generated artifacts, images, video, and interactive apps.

Before finalising a Hyperagent build pack, confirm the agent still uses the right
integration type (NATIVE vs MCP vs skill+credentials) in `/settings/integrations`
and per-agent Integrations tab. The design default is now "available, verify
configuration", not "unavailable".

### Source Confidence After Web Recheck

High-confidence sources for this document:

- Matthew's Hyperagent release emails exported from Gmail.
- `hyperagent.com`, which publicly describes Hyperagent as a fleet-of-agents
  product connected to tools and data.
- Public posts/search snippets tied to Andrew Busse, Howie Liu, and Airtable
  team members announcing Hyperagent and describing launch capabilities.

Rejected or non-canonical sources:

- `hyperfx.ai` / `docs.hyperfx.ai`: appears to be a separate "Hyper AI"
  marketing-agent product. Do not use it for Hyperagent capability design.
- `hyperbrowser.ai` / `@hyperbrowser/agent`: appears to be a separate
  browser-automation SDK called HyperAgent. Do not mix it with Airtable's
  Hyperagent.
- Generic "hyperagents" research papers or SDK repos: name collision only.

Public web recheck did **not** find an official Hyperagent action catalogue.
Therefore Factory must not invent exact Slack, GitHub, MCP, task, permission,
or webhook fields from public web docs. Use the current Hyperagent UI, exports,
or Matthew-confirmed release emails for exact configuration.

### Integrations and MCP

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
- Public Hyperagent launch/search snippets mention hundreds of integrations and
  examples including Shopify, HubSpot, Gmail, Slack, calendars, Databricks, and
  Snowflake. Treat the exact catalogue as UI-verified only.
- Public examples also mention Airtable, QuickBooks, Gong, CRM workflows, data
  warehouse access, and Slack/channel usage. Treat these as capability signals.
- UI catalogue (2026-05-31): see **Workspace integrations catalogue** above for
  NATIVE/MCP/COMPOSIO split and featured connectors.
- Downloaded DS agent exports confirm these `allowedIntegrations` slugs in live
  agent configs: `airtable`, `github`, `gmail`, `googlesheets`, and `openai`.
  They are stored as a JSON string array, not a native JSON array.
- Legacy Agent Factory prompt text says Gmail had a "one account at a time"
  constraint. Treat that as superseded by the later release email saying named
  agents can use multiple Gmail accounts for the same integration via a
  multi-select picker.

### Slack Runtime

- Hyperagent agents can be deployed directly in Slack.
- Slack deployment supports a custom identity so teammates can @mention the
  agent by name.
- Connected agents can read Slack threads, and examples include analytics
  agents answering questions directly in Slack.
- Public launch material describes one-click Slack deployment as "intelligent
  coworkers" and examples where Hyperagent lives in private Slack channels.
- Use mentions-only in shared channels unless the channel is explicitly owned
  by the agent. Always include anti-loop rules: never respond to other bots or
  to self.

### GitHub Runtime

GitHub is not safely described as unavailable. The Composio incident email said
some GitHub OAuth tokens were affected, and later Hyperagent release material
announced native integrations plus custom MCP. Matthew has also flagged GitHub
as a real native integration path.

Exact GitHub actions must be checked in the current Hyperagent UI before design
or export. For AstraJax, default GitHub writes to human approval and treat merge,
delete, release, permission, and repository-creation capabilities as high-risk
unless Matthew explicitly narrows the scope.

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
- Public launch material describes Hyperagent as cloud-native with an isolated
  full computing environment per session, avoiding local Mac Mini or hosting
  setup.
- Command Center is live at `/command-center` with fleet metrics, per-agent
  quality/cost, active schedules, score trends, and "Needs Attention" queue
  (see **Command Center** section above).

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
- Public launch material says Hyperagent learns skills for deep domain
  expertise and that skill learning compounds over time. This supports the
  existing Factory rule that repeated process should become a skill rather than
  staying trapped in chat.
- Public examples describe sharing agents/skills across teams or functions
  rather than burying them in local repos or dead Slack DMs. Treat exact sharing
  mechanics as UI-verified.

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
- `hyperagent.com` describes cloud agents with a full computing environment
  that can autonomously browse websites, pull and analyze data, generate images
  and video, create interactive apps, and use existing tools/services.
- Public launch/search snippets mention real browser, shell, filesystem, code
  execution, mapping, data warehouse access, output deliverables such as web
  pages, slides, audio podcasts, and Hyper apps, plus rich visual output.
  Treat exact UI names and toggles as UI-verified only.
- `hyperagent.com` public examples include technical recruiting, chief-of-staff
  morning briefs, and growth marketing campaign planning. These examples show
  Hyperagent using web research, LinkedIn/GitHub/Google Scholar style research
  surfaces, Shopify/HubSpot/Gmail style business data, Slack/calendar context,
  competitor web monitoring, maps, street-view imagery, generated creative, and
  interactive app outputs.

### Public Web Unknowns

Still not verified in a Hyperagent-owned **public** doc (UI or exports may cover them):

- exact Slack **action** list (deployment and @mention flow are UI-verified)
- exact GitHub **action** list (MCP connector exists; actions are UI/runtime-specific)
- exact webhook configure form field names (URL + secret pattern confirmed in AstraJax setup docs)
- whether Hyperagent exposes external-client MCP in the same way HyperFX does

Factory must ask Matthew to check the Hyperagent UI, inspect an export, or use a
Matthew-confirmed release email before relying on those details.

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

### Webhooks and schedules (AstraJax operational truth)

**Schedules** ship in agent export JSON as `scheduledInvocations[]`:

- `name`, `rrule` (iCal, e.g. `FREQ=DAILY;BYHOUR=8;BYMINUTE=0;BYSECOND=0`), `timezone`, `prompt`, `threadNamingHint`
- Clive Curator V5: daily 08:00 `Europe/London`, audit `target=daily`
- Clive Context Scanner V0.4: daily 08:30 `Europe/London`, then one Slack summary

**Webhooks** are configured in the Hyperagent UI on the **agent** (not a standalone hub webhook). Exports leave `webhookEndpoints: []` — endpoints are created in UI after import.

| Item | Value |
|------|--------|
| Receive URL | `https://hyperagent.com/api/webhooks/<webhookId>/receive` |
| Auth header | `X-Hyperagent-Webhook-Secret` (exact secret from trigger UI) |
| Body | JSON passed as user message when "pass request body" is enabled |
| Success signal | HTTP 2xx + `runId` in response; run appears in **Runs**, not instant **skipped** |
| Common failure | HTTP 202 + **skipped** = webhook not bound to agent with auto-run |

Setup guides: `hyperagent/docs/clive-curator-webhook-setup.md`, `hyperagent/docs/clive-scanner-webhook-setup.md`.

**Slack deploy (inbound)** is separate from outbound `allowedIntegrations: ["slack"]`: agents need both outbound integration in config and inbound channel assignment in Hyperagent settings.

### Skill scripts and credentials (post-Composio pattern)

For governed AstraJax agents, prefer **skill scripts + credentials**, not Composio:

| Mechanism | Use |
|-----------|-----|
| `execute-script: true` | Run pinned `.py` files embedded in skill export |
| `authType: api_key` + `credentialSchema` | PAT/API keys on skill (e.g. `AIRTABLE_READ_TOKEN`, `AIRTABLE_WRITE_TOKEN`, `AIRTABLE_API_KEY`) |
| **RunWithCredentials** | Intake calls `create_context_intake.py` after human confirm |
| `allowedIntegrations: ["slack"]` | Native Slack outbound (Scanner scheduled summary, Intake channel) |
| GitHub / repo access | Curator audits — attach on agent in UI; not always in export JSON |

Composio-powered integrations remain **disabled** platform-wide after the May 2026 incident. Native integrations and direct API skills are the supported path.

### AstraJax Clive fleet on Hyperagent (reference)

| Agent | Export | Native Slack | Schedule | Webhook | Airtable writes |
|-------|--------|--------------|----------|---------|-----------------|
| Clive Intake | `agent-clive-intake-v1.json` | Outbound | — | — | Context Intake only (script) |
| Clive Curator V5 | `agent-clive-curator-v5.json` | — | Daily 08:00 London | Airtable button → `curator-audit` / `curator-cleanup-draft` | Read-only |
| Clive Context Scanner V0.4 | `agent-clive-context-scanner-v0_4.json` | Outbound summary (scheduled only) | Daily 08:30 London | Optional | Context Intake candidates (script) |

## Observed Model Identifiers

These appear in current repo exports and should be treated as known observed
values, not a complete current catalogue:

- `claude-opus-4-7`
- `claude-opus-4-8`
- `opus-latest`
- latest Opus / latest Sonnet auto-update setting

Downloaded Skill Forge and Agent Factory exports both use:

- `modelId: "claude-opus-4-7"`
- `maxThinkingTokens: 32000`
- `effort: "max"`
- `maxBudgetUsd: null`
- `visualMode: "off"`

For Cursor agents, use Cursor model slugs from the active environment instead
of Hyperagent model IDs.

## Export JSON (schema v1 — from Clive and DS exports)

Wrapper:

```json
{ "version": 1, "type": "agent" | "skill", "exportedAt": "<ISO8601>", "data": { ... } }
```

Agent `data` fields observed in repo/downloaded exports (preserve all; do not
strip unknown keys):

| Field | Notes |
|-------|--------|
| `name`, `description`, `icon` | Display |
| `systemPrompt` | Primary behaviour contract |
| `themeColors`, `visualMode` | UI theming (`visualMode: "off"` on Clive agents) |
| `skillScope` | `selected` for governed Clive agents; `global` observed on legacy DS build agents |
| `skillLoadMode` | `preload` for governed operational skills; `discover` observed on legacy DS build agents |
| `toolSettings` | JSON string — see catalogue below |
| `allowedIntegrations` | JSON string array, e.g. `["slack"]` or `[]` |
| `enableKnowledgeDiscovery` | Usually `true` for Clive |
| `enableMemorySuggestions`, `enableSkillSuggestions`, `enablePromptSuggestions` | `false` for governed Clive; `true` observed on legacy DS build agents |
| `autoSaveMemories`, `autoSaveSkills`, `autoSaveAgents`, `autoSavePrompts` | `false` for governed Clive |
| `modelId` | e.g. `claude-opus-4-7`, `claude-opus-4-8`, `opus-latest` |
| `maxThinkingTokens`, `effort`, `maxBudgetUsd` | Opus + effort tiering |
| `imageModel`, `customBackgroundStyle`, `customMessageCoverStyle` | Often null |
| `skills[]` | Embedded skill objects (name, documentation, scripts, credentials, `isPinned`) |
| `scheduledInvocations[]` | Native cron — RRULE + timezone + prompt |
| `emailInvocations[]` | Email triggers (empty on Clive exports) |
| `webhookEndpoints[]` | Usually empty in export; webhooks added in UI post-import |

Skill `data` adds: `tags`, `whenToUse`, `authType`, `credentialSchema`, `skillMdBody`, `scripts[]` (`filename`, `content`, `description`), `references`.

Import order for AstraJax: **skill JSON first**, then **agent JSON**; configure credentials on skill; attach repo/GitHub on agent when needed; enable schedules and webhooks in UI.

### Additional DS agent exports reviewed

Reviewed downloaded exports:

- `/Users/matthewhopkinson/Downloads/agent-skill-forge (11).json`
- `/Users/matthewhopkinson/Downloads/agent-agent-factory (14).json`

Both are wrapper `version: 1`, `type: "agent"` exports with no
`scheduledInvocations`, `emailInvocations`, or `webhookEndpoints`.

| Agent | Integrations | Tool pattern | Skills |
|-------|--------------|--------------|--------|
| Skill Forge | `gmail`, `googlesheets`, `airtable`, `github`, `openai` | `execute-script`, `persistent-sandbox`, `documents`; native search; bloat tools off | 19 skills; 12 with scripts; api-key credential schemas on Airtable/Bot Ops skills |
| Agent Factory | `gmail`, `github`, `airtable` | `browser`, Exa family, `web-search`, `tables`, `documents`, `searchthreads`, `execute-script`, `persistent-sandbox` | 17 skills; 12 with scripts; api-key credential schemas on Bot Ops / action / decision-log skills |

Useful platform facts from these exports:

- `toolSettings` and `allowedIntegrations` are JSON-encoded strings inside the
  export, so build scripts must serialize them deliberately.
- Skill objects include `name`, `description`, `documentation`, `tags`,
  `whenToUse`, `authType`, `credentialSchema`, `skillMdBody`, `scripts`,
  `references`, and `isPinned`.
- `scripts` may be a large JSON-encoded string on each embedded skill. Do not
  assume a skill is documentation-only.
- `authType` values observed: `none`, `api_key`.
- `credentialSchema` is present only on some api-key skills. Do not require it
  for every skill, but preserve it when present.
- `isPinned: false` across both exports even for important skills. Importance is
  not the same as pinning.
- These two exports are broad build/meta-agents, not narrow production runtime
  defaults. Do not copy their broad browser/Exa/persistent-sandbox settings into
  governed Clive agents without a specific reason.

### `toolSettings` catalogue (observed keys)

Stored as a JSON **string** in export. Clive governed agents typically enable
only `execute-script` (and Intake adds `tables`, `searchthreads`). Legacy DS
build agents may enable broader research/build tooling.

**UI label → export key** (Tools tab, 2026-05-31):

| UI label | Export key |
|----------|------------|
| Script | `execute-script` |
| Full VM | `persistent-sandbox` |
| Thread Search | `searchthreads` |
| Browser | `browser` |
| Search | `web-search` |
| Exa / Exa* family | `exa-mode`, `exafindsimilar`, `exaanswer`, `exaresearch`, `exawebsets` |
| Tables | `tables` |
| Documents | `documents` |
| Webpages / Slides | `webpage`, `slides` |
| HyperApps | `hyperapps` |
| Images / Video / Audio / Transcribe / Avatar | `image-generation`, `video-generation`, `audio-generation`, `transcribeaudio`, `avatar-video` |
| Maps | `geocode` |
| Global tables | `globalTablesEnabled` |

| Key | Clive default | Capability signal |
|-----|---------------|-------------------|
| `execute-script` | on (when skill has scripts) | Run skill Python in sandbox |
| `persistent-sandbox` | off (legacy build agents: on) | Long-lived sandbox |
| `tables` | off (Intake / Agent Factory: on) | Structured tables tool |
| `documents` | off (legacy build agents: on) | Document tool |
| `searchthreads` | off (Intake: on) | Thread search (Slack flows) |
| `web-search` | off (Agent Factory: on) | General web search |
| `browser` | off (Agent Factory: on) | In-environment browser |
| `image-generation`, `video-generation`, `audio-generation`, `transcribeaudio`, `avatar-video` | off | Media generation |
| `webpage`, `slides` | off | Artifact generators |
| `hyperapps` | off | Interactive apps |
| `geocode` | off | Maps / geocoding |
| `exa-mode`, `exafindsimilar`, `exaanswer`, `exaresearch`, `exawebsets` | off (Agent Factory: on) | Exa search family |
| `globalTablesEnabled` | off | Global tables feature |
| `searchMode` | `native` or `exa` | Search backend selector, not boolean |
| `slideGenerationModel`, `webpageGenerationModel` | `gemini-3-flash-preview` observed | Artifact model selectors |

Factory rule unchanged: default **off** unless the agent's job requires the capability; justify browser, web search, media, slides, and sandbox in the build pack.

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
