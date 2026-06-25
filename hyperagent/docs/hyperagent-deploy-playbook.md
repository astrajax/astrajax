# Hyperagent deploy playbook

Matthew's pain: every fix means delete old agent, import JSON, **new webhook**,
re-paste Airtable automation URL, re-test. This doc separates **what actually
requires that** from **what you can change in place**.

## Golden rule

**Do not delete the Hyperagent agent** unless you are deliberately retiring it.

Deleting the agent destroys the webhook endpoint (new URL + new secret). That is
what forces the Airtable nightmare.

## What to do instead (by change type)

| You changed | Do this | Delete agent? |
|-------------|---------|---------------|
| **Pinned Python script** on a skill | Re-import **skill JSON only**. Same skill name overwrites bundled scripts. | No |
| **System prompt / skill markdown only** | Hyperagent → agent → **Identity** tab: paste from `.cursor/agents/…` or export JSON `systemPrompt`. Or re-import skill. | No |
| **Schedule time / schedule prompt** | Hyperagent → **Invocations → Scheduled**: edit in UI. | No |
| **Credentials** (Airtable PAT) | Hyperagent → **Skills** → skill → credentials. Never in git. | No |
| **Slack channel / repo attach** | Hyperagent UI: Slack **Add to channel**, repo/GitHub attach on agent. | No |
| **New agent version** (rare) | Import **agent JSON** (embedded skills update with it). If Hyperagent offers update/merge on same display name, use that. Re-import skill JSON separately only for skill-only changes. If it only offers duplicate, edit existing agent in UI rather than delete. | Only if unavoidable |
| **Webhook truly lost** (agent deleted) | Create webhook on agent again → update Airtable if wired → secret on automation Secrets tab only. | Was already deleted |

## Live Hyperagent agent

| Agent | Export | Registry |
|-------|--------|----------|
| Clive Agent Factory (Hyperagent) v3 | `hyperagent/exports/agents/agent-clive-agent-factory-v3.json` | `agents/registry/hyperagent/clive/agent-factory/build-pack-v3.md` |
| Kathryn Goodchild v0.1 | `hyperagent/exports/agents/agent-kathryn-goodchild-v0_1.json` | `agents/registry/hyperagent/astrajax/kathryn-goodchild/build-pack-v0.1.md` |

Regenerate Factory: `python3 hyperagent/builds/build_clive_agent_factory_v3.py`  
Regenerate Kathryn: `python3 hyperagent/builds/build_kathryn_goodchild_v0_1.py`

## Retired context lane

Intake, Curator, Scanner, and Publisher Hyperagent agents are **retired**.
Clive's Man (Cursor) replaced them. Historical exports and webhook wiring docs
are in:

- `hyperagent/exports/archive/`
- `hyperagent/docs/archive/`
- `hyperagent/scripts/archive/`

Do not re-import archived JSON for production unless you are deliberately
rolling back (and you accept webhook rewiring).

## First-time import (default)

Standard AstraJax agent exports embed full skill objects in `skills[]`. For those
builds, import **agent JSON only**. Hyperagent creates the workspace skill(s) and
attaches them to the agent.

1. Import **agent JSON**
2. Verify agent → **Skills** tab shows attached skill(s)
3. Verify `/skills` → skill shows **Agents ≥ 1**
4. Add credentials on skill if `authType: api_key` (before first run)
5. Create webhook on agent in UI if needed (auto-run, pass body)
6. Attach repo / Slack as needed

## When to import skill JSON separately

Import the standalone skill JSON only when:

- updating scripts or skill markdown **without** re-importing the agent
- the skill is **shared** across multiple agents
- you prefer to stage credentials before attaching the agent (optional, not required)

The repo still ships separate skill JSON files for those workflows. They are not
required for a normal first-time deploy when skills are embedded in the agent export.

**Legacy note:** older AstraJax docs said "skill JSON first, then agent JSON." That
was conservative guidance for credential-heavy Clive bots. Agent-only import is the
default for embedded-skill exports.

See also: `docs/context/hyperagent-platform.md` (export schema) and
`.cursor/skills/doc-workshop-hyperagent/SKILL.md` (Workshop deploy handoff).

## Why exports do not include webhooks

`webhookEndpoints` is empty in export JSON by design. Hyperagent creates
webhooks in the UI after import. That is platform behaviour, not a mistake in
our build scripts.

## When you truly must re-import the agent

- Hyperagent broke and the agent record is gone.  
- You need a clean room new agent name for testing.  

Treat it like moving house: confirm secret, one smoke test, then tick Workbench once.
