# Clive Context Scanner webhook setup

Wire the Workbench **Trigger Scanner** checkbox to **Clive Context Scanner v0.4** in Hyperagent.

Pattern: **Workbench → Trigger Scanner checked → Airtable automation → POST Hyperagent → Scanner runs (manual mode) → checkbox clears.**

Export: `hyperagent/exports/agents/agent-clive-context-scanner-v0_4.json`

---

## Part 1 — Hyperagent

1. Import skill + agent v0.4 from `hyperagent/exports/…`
2. Add skill credentials: `AIRTABLE_READ_TOKEN`, `AIRTABLE_WRITE_TOKEN`. Slack uses the native Hyperagent Slack integration (no token credential); connect it and confirm the agent can post to the configured `schedule_channel_id` for scheduled runs.
3. Attach AstraJax repo access to the agent
4. Open **Clive Context Scanner** → **Triggers** → add **Webhook** on the agent (not orphan hub webhook)
5. Enable **auto-run on receive**; pass full POST body to the agent message

Paste into webhook / trigger instructions:

```text
Always run Clive Context Scanner immediately when this webhook receives a POST.
Pass the full JSON request body as the user message.
If mode is manual, run the MANUAL workflow: gather, judge, preview claims; create Context Intake only when appropriate. Never post to Slack in manual mode.
If mode is scheduled, run the SCHEDULED workflow from the system prompt.
Do not skip. Do not rely on IF text in this description as executable code.
```

Copy **receive URL** and **secret**.

---

## Part 2 — Airtable automation

**Table:** Agent Environments  
**Row:** Clive Scanner (`rec8tHO48vMkrf15Y` at time of writing — confirm in base)

1. **Trigger:** When record matches → **Trigger Scanner** is checked  
   (Optional filter: Agent Name is `Clive Scanner`)
2. **Action:** Run script → `hyperagent/scripts/trigger_scanner_from_agent_environment.airtable.js`
3. **Input variables:**
   - `recordId` = `{{recordId}}`
   - `previewOnly` = `false` (or `true` for preview-only runs)
   - `webhookUrl` = optional override; default reads **Hyperagent Webhook URL** on the row
4. **Secret:** `HYPERAGENT_WEBHOOK_SECRET` (Scanner webhook secret)

Paste the Scanner `/receive` URL once on the **Clive Scanner** Agent Environments row (**Hyperagent Webhook URL**). See `hyperagent/docs/hyperagent-deploy-playbook.md`.

The script POSTs JSON, then **clears Trigger Scanner** on success.

### POST body shape

```json
{
  "mode": "manual",
  "previewOnly": false,
  "requestedBy": "Clive Workbench",
  "source": "airtable-agent-environments-trigger-scanner",
  "message": "Manual Scanner run from Clive Workbench…"
}
```

---

## Part 3 — Workbench

Interface Designer → Workbench → **Agent Environments** → expose **Trigger Scanner** with **Edit**.

Release extension after UI changes:

```bash
cd interface-extensions/clive-context-workbench && npx block release --remote astrajax
```

---

## Smoke test

```bash
curl -X POST "$HYPERAGENT_SCANNER_WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -H "X-Hyperagent-Webhook-Secret: $HYPERAGENT_WEBHOOK_SECRET" \
  -d '{"mode":"manual","previewOnly":true,"requestedBy":"curl smoke test","message":"Manual Scanner preview-only smoke test. Do not create rows or post Slack."}'
```

**Pass:** HTTP 2xx with `runId`; Hyperagent run completes (not instant **skipped**).

---

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| HTTP 403 | Re-copy Scanner webhook secret; use Secrets tab only |
| Instant **skipped** | Webhook must live **on the Scanner agent** with auto-run |
| Script error on wrong agent row | Automation must fire only on **Clive Scanner** row |
| Slack message from Workbench run | Should not happen — manual mode never posts Slack |
