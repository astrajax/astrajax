# Clive Curator webhook setup

Wire Airtable interface buttons to **Clive Curator V5** in Hyperagent.

Pattern (same as DS Bot Ops): **Airtable button → Run script → POST Hyperagent `/receive` → Curator runs audit → findings in Hyperagent run output.**

Curator V5 agent export: `hyperagent/exports/agents/agent-clive-curator-v5.json`

---

## Part 1 — Hyperagent (do this first)

### 1. Import or update the agent

1. Import skill: `hyperagent/exports/skills/skill-clive-context-curator-v5.json`
2. Import agent: `hyperagent/exports/agents/agent-clive-curator-v5.json`
3. On the skill, add credential **`AIRTABLE_READ_TOKEN`** (read PAT for Context Items / Context Packs) if not already set.
4. Confirm **GitHub / repo access** is attached so Curator can read the AstraJax repo.

### 2. Create the webhook **on the agent** (not a standalone orphan webhook)

In Hyperagent, open **Clive Curator** → **Triggers** (or External / Webhook):

1. Add **Webhook** trigger.
2. **Run this agent on receive** / **Auto-run:** enabled.
3. **Pass the request body** into the agent message (full JSON body, not just a static prompt).

Paste this into the webhook / trigger instructions:

```text
Always run Clive Curator immediately when this webhook receives a POST.
Pass the full JSON request body as the user message.
The agent parses mode, target, checks, and requestedBy.
Do not skip. Do not rely on IF text in this description as executable code.
```

4. Copy the **receive URL** (ends with `/receive`), e.g.  
   `https://hyperagent.com/api/webhooks/XXXXXXXX/receive`
5. Copy the **webhook secret** (for header `X-Hyperagent-Webhook-Secret`).

**Common failure:** HTTP 202 but Hyperagent shows **skipped** instantly. That means no agent was bound. Fix: webhook must live **on the Clive Curator agent** with auto-run enabled (see DS doc `hyperagent-webhook-skipped.md` pattern).

### 3. Smoke test from terminal

Store URL and secret locally (do not commit). Example `.env` keys:

```bash
HYPERAGENT_CURATOR_WEBHOOK_URL=https://hyperagent.com/api/webhooks/XXXXXXXX/receive
HYPERAGENT_WEBHOOK_SECRET=your_secret_here
```

Run:

```bash
bash hyperagent/scripts/test_curator_webhook.sh
```

**Pass:** HTTP 2xx, JSON includes `runId`, and Hyperagent **Runs** shows a completed Curator invocation (not instant **skipped**).

---

## Part 2 — Airtable (custom interface / Workbench)

The Context Workbench extension cannot use native “interface button clicked” triggers.
Use **checkbox fields** on **Agent Environments** instead:

| Field | Field ID | Purpose |
|-------|----------|---------|
| Trigger Curator | `fldWdobWahSsYE2cH` | Workbench → Curator Hyperagent webhook |
| Trigger Scanner | `fldeQgWOhXemToGvf` | Workbench → Context Scanner (wire when live) |

### Interface Designer

On the Workbench extension → **Data** → **Agent Environments**, expose both trigger fields with **Edit** access.

### Curator automation

1. **Trigger:** Agent Environments — when record matches → **Trigger Curator** is checked
2. **Action:** Run script — `hyperagent/scripts/trigger_curator_from_agent_environment.airtable.js`
3. **Input variables:** `recordId` = `{{recordId}}` only (webhook URL comes from the row — see deploy playbook)
4. **Secret:** `HYPERAGENT_WEBHOOK_SECRET`

**Stop rewiring automations:** paste the Curator `/receive` URL once on the **Clive Curator** row, field **Hyperagent Webhook URL**. See `hyperagent/docs/hyperagent-deploy-playbook.md`.

The script POSTs to Hyperagent, then **clears Trigger Curator** on success.

### Scanner automation

1. **Trigger:** Agent Environments — when record matches → **Trigger Scanner** is checked  
   (filter: Agent Name = `Clive Scanner` if you can)
2. **Action:** Run script — `hyperagent/scripts/trigger_scanner_from_agent_environment.airtable.js`
3. **Input variables:** `recordId` = `{{recordId}}`, `webhookUrl` = Scanner Hyperagent `/receive` URL  
   Optional: `previewOnly` = `true` for preview-only (no Intake creates)
4. **Secret:** `HYPERAGENT_WEBHOOK_SECRET` (from the Scanner agent webhook)

Full guide: **`hyperagent/docs/clive-scanner-webhook-setup.md`**

### Legacy: native interface button

If you use a non-custom Airtable interface page, you can still use
`hyperagent/scripts/trigger_clive_curator_webhook.airtable.js` with “interface button clicked”.

### Input variables (per automation)

| Variable | Example | Notes |
|----------|---------|--------|
| `webhookUrl` | `https://hyperagent.com/api/webhooks/XXXXXXXX/receive` | From Hyperagent Curator trigger |
| `target` | `clive-core` | See targets below |
| `checks` | `stale,conflicts,unsupported,risky` | Comma-separated |
| `requestedBy` | `Matthew` | Optional provenance |
| `mode` | `curator-audit` | Optional; default `curator-audit` |

### Secret (required)

Automation → Run script → **Secrets** tab:

| Name | Value |
|------|--------|
| `HYPERAGENT_WEBHOOK_SECRET` | Exact secret from Hyperagent Curator webhook |

Do **not** put the secret in the script source or in git. Do **not** duplicate it as a plain `webhookSecret` input variable unless you are sure it matches — stale input vars cause **HTTP 403**.

### Suggested buttons (one automation per button, or one automation with fixed inputs)

| Button label | `target` | `checks` |
|--------------|----------|----------|
| Audit Clive core | `clive-core` | `stale,conflicts,unsupported,risky` |
| Audit Agent Factory | `agent-factory` | `stale,unsupported,risky` |
| Audit context packs | `context-packs` | `duplicates,risky` |
| Audit Hyperagent platform | `hyperagent-platform` | `stale,conflicts` |
| Daily-style sweep | `daily` | `stale,conflicts,duplicates,unsupported,risky` |

### Webhook payload shape

```json
{
  "mode": "curator-audit",
  "target": "clive-core",
  "checks": "stale,conflicts,unsupported,risky",
  "requestedBy": "Matthew",
  "source": "airtable-interface-button",
  "requestedAt": "2026-05-31T12:00:00.000Z",
  "message": "Curator audit requested for target=clive-core"
}
```

For cleanup drafts only (does not apply fixes):

```json
{
  "mode": "curator-cleanup-draft",
  "target": "clive-core",
  "findingId": "CUR-20260531-077",
  "requestedBy": "Matthew"
}
```

Set Airtable input `mode` = `curator-cleanup-draft` and add input `findingId` when wiring a cleanup button.

---

## Part 3 — Where findings appear

Curator returns findings in the **Hyperagent run thread** (not automatically as Airtable rows). Review there, then decide cleanup routes (Matthew, Agent Factory, Publisher, etc.).

Scheduled daily audit (08:00 Europe/London) is already defined in the V5 export `scheduledInvocations`; confirm it is enabled after import.

---

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| HTTP 403 Invalid webhook secret | Re-copy secret from Hyperagent; set only on Airtable Secrets tab; remove stale `webhookSecret` input var |
| HTTP 202 but **skipped** in Hyperagent | Bind **Clive Curator** agent on webhook with auto-run; do not use orphan hub webhook only |
| Airtable script error: Missing webhookUrl | Add input variable `webhookUrl` on the Run script step |
| Empty findings / read gaps | Set `AIRTABLE_READ_TOKEN` on skill; confirm repo access on agent |
