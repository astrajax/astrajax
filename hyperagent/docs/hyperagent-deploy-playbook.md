# Hyperagent deploy playbook (stop the delete-and-rewire loop)

Matthew's pain: every fix means delete old agent, import JSON, **new webhook**, re-paste Airtable automation URL, re-test. This doc separates **what actually requires that** from **what you can change in place**.

## Golden rule

**Do not delete the Hyperagent agent** unless you are deliberately retiring it.

Deleting the agent destroys the webhook endpoint (new URL + new secret). That is what forces the Airtable nightmare.

## What to do instead (by change type)

| You changed | Do this | Delete agent? |
|-------------|---------|---------------|
| **Pinned Python script** (audit, scan, create intake) | Re-import **skill JSON only** (`skill-clive-context-curator-v5.json`, etc.). Same skill name overwrites bundled scripts. | No |
| **System prompt / skill markdown only** | Hyperagent → agent → **Identity** tab: paste from `.cursor/agents/…` or export JSON `systemPrompt`. Or re-import skill. | No |
| **Schedule time / schedule prompt** | Hyperagent → **Invocations → Scheduled**: edit in UI (export also sets this on first import). | No |
| **Credentials** (Airtable PAT) | Hyperagent → **Skills** → skill → credentials. Never in git. | No |
| **Slack channel / repo attach** | Hyperagent UI: Slack **Add to channel**, repo/GitHub attach on agent. | No |
| **New agent version** (rare) | Import skill, then import agent **with same display name** if Hyperagent offers update/merge. If it only offers duplicate, edit existing agent in UI rather than delete. | Only if unavoidable |
| **Webhook truly lost** (agent deleted) | Create webhook on agent again → update **one** Airtable field (see below) → secret on automation Secrets tab only. | Was already deleted |

## One-time wiring (Workbench automations)

Put the webhook URL on the **Agent Environments** row, not inside each automation step.

1. Add field **Hyperagent Webhook URL** on table Agent Environments (URL or single line text).
2. On row **Clive Curator**, paste Curator `/receive` URL once.
3. On row **Clive Scanner** (or Clive Context Scanner), paste Scanner `/receive` URL once.
4. Automations: Run script step **does not need** a hardcoded `webhookUrl` input if the script reads the field from the triggering record (see updated `trigger_*_from_agent_environment.airtable.js`).

When Hyperagent gives you a **new** webhook after disaster recovery:

- Update the URL on that agent's row in Agent Environments only.
- Re-copy secret into Airtable automation **Secrets** tab if Hyperagent rotated it.
- Do **not** rebuild the automation from scratch.

Optional: run once to create the field via script:

```bash
python3 hyperagent/scripts/ensure_agent_environment_webhook_field.py
```

## Import order (first time only)

1. Skill JSON  
2. Agent JSON  
3. Credentials on skill  
4. Webhook on agent (auto-run, pass body)  
5. Paste webhook URL into Agent Environments row  
6. Attach repo / Slack as needed  

See per-agent: `agents/hyperagent/clive/curator/LIVE.md`, Scanner build pack, Intake build pack.

## Smoke test without touching Airtable

```bash
# Curator — from .env
bash hyperagent/scripts/test_curator_webhook.sh
```

Scanner: `hyperagent/docs/clive-scanner-webhook-setup.md` curl example.

## Why exports do not include webhooks

`webhookEndpoints` is empty in export JSON by design. Hyperagent creates webhooks in the UI after import. That is platform behaviour, not a mistake in our build scripts. The playbook above works **around** it by storing the stable operational URL in Airtable.

## When you truly must re-import the agent

- Hyperagent broke and the agent record is gone.  
- You need a clean room new agent name for testing.  

Treat it like moving house: update Agent Environments URL, confirm secret, one curl smoke test, then tick Workbench once.
