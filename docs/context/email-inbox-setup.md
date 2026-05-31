# Emails — Gmail capture for AstraJax

**Status:** Operational setup guide  
**Base:** AstraJax (`appYv601Oq7fKTCj0`)  
**Table:** Emails (`tblq8QM5IegQxurYJ`)

This mirrors your DS Trinity pattern: **Gmail → Apps Script → Airtable webhook → Emails row**. All mail lands in Airtable. Airtable AI categorises it. The Hyperagent Release Scanner reads only **Hyperagent Release** rows.

---

## Architecture

```text
Gmail (all new messages)
  → Apps Script (gmail-to-airtable-email.gs)
  → Airtable automation webhook
  → Emails table
  → Airtable AI: Generate structured data → Email Category
  → Release Scanner (--mode airtable)
  → docs/context/hyperagent-releases.json
  → Matthew promotes → docs/context/hyperagent-platform.md
  → Agent Factory preloads before Hyperagent builds
```

---

## 1. Emails table (done)

The table is provisioned. Re-run if needed:

```bash
python3 hyperagent/scripts/setup_email_inbox_table.py
```

Key fields:

| Field | Purpose |
|---|---|
| Subject, From, Body | Raw email |
| Gmail Message ID | Dedupe key |
| Email Category | Set by Airtable AI (see step 3) |
| Scanner Status | `New` → `Synced to repo` after scanner runs |
| AI Summary / AI Structured JSON | Optional AI outputs for downstream flows |

Default category on ingest: **Uncategorised** until AI runs.

---

## 2. Airtable automation webhook

1. Open base **AstraJax** → **Automations** → **Create automation**.
2. **Trigger:** *When webhook received*.
3. Copy the webhook URL (you will paste this into Apps Script).
4. **Action:** *Create record* in **Emails**.
5. Map incoming JSON keys to fields:

| Webhook key | Airtable field |
|---|---|
| `subject` | Subject |
| `from` | From |
| `fromEmail` | From Email |
| `to` | To |
| `cc` | Cc |
| `receivedAt` | Received At |
| `gmailMessageId` | Gmail Message ID |
| `gmailLink` | Gmail Link |
| `threadId` | Thread ID |
| `body` | Body |
| `bodyExcerpt` | Body Excerpt |
| `ingestSource` | Ingest Source → `Apps Script Gmail` |
| `emailCategory` | Email Category → `Uncategorised` |
| `scannerStatus` | Scanner Status → `New` |
| `hasAttachments` | Has Attachments |
| `attachmentNames` | Attachment Names |

6. Turn automation **on**.

**Dedupe:** Airtable does not auto-dedupe. If you re-run backfill, you may get duplicates unless you add a later automation that skips rows where Gmail Message ID already exists. For v1, avoid re-backfilling the same window.

---

## 3. Airtable AI — categorise every email

Add an AI field (or use **Generate structured data** on a new field) that reads **Subject**, **From**, **Body Excerpt**, and writes into **Email Category**.

Suggested prompt (adapt in Airtable UI):

> Classify this email into exactly one category for a small business founder inbox.  
> Categories: Hyperagent Release, Platform / SaaS Update, Customer / Sales, Finance / Billing, Newsletter / Marketing, Personal, Internal / Team, Notification / System, Other, Uncategorised.  
> Use **Hyperagent Release** for product updates, changelogs, or release notes from Hyperagent (hyperagent.ai or similar senders).  
> Return JSON: `{ "category": "...", "summary": "one sentence", "confidence": "high|medium|low" }`

Wire outputs:

- `category` → **Email Category** (single select)
- `summary` → **AI Summary**
- full JSON → **AI Structured JSON** (optional)

Run AI on new records (auto on create, or a scheduled automation).

**Views to create:**

- **All inbox** — everything, newest first
- **Hyperagent releases** — Email Category = Hyperagent Release
- **Needs categorisation** — Email Category = Uncategorised

---

## 4. Apps Script on Gmail

Two scripts — use one or both:

| Script | When it sends |
|---|---|
| `gmail-to-airtable-email.gs` | All new inbox mail (automatic poll every 5 min) |
| `gmail-astrajax-label-to-airtable.gs` | Only when **you** apply Gmail label **AstraJax** (~1 min later) |

Use **separate Apps Script projects** for each so triggers do not clash. Same webhook URL and same **Emails** table for both.

---

### Option A — all inbox mail

Source: `hyperagent/scripts/apps-script/gmail-to-airtable-email.gs`

**Note:** Standalone Apps Script cannot trigger instantly on every new email. This script **polls every 5 minutes**, posts uncaptured mail, then applies Gmail label **`AstraJax/Captured`** so nothing is sent twice.

1. Go to [script.google.com](https://script.google.com) → New project.
2. Paste the script (replace any old version).
3. **Project Settings → Script properties:**
   - `WEBHOOK_URL` = your Airtable webhook URL from step 2
4. Run **`testLatestEmail()`** once to confirm webhook + authorisation (posts your latest inbox message).
5. Run **`createGmailTrigger()`** once to install the 5-minute polling trigger.

Optional Script properties:

| Property | Default | Purpose |
|---|---|---|
| `CAPTURED_LABEL` | `AstraJax/Captured` | Label applied after successful POST |
| `POLL_MAX_MESSAGES` | `25` | Max threads checked per poll |
| `LABEL_FILTER` | (blank) | Restrict to a Gmail label |

To stop polling: run **`deleteGmailTrigger()`**.

---

### Option B — AstraJax label only (manual curation)

Source: `hyperagent/scripts/apps-script/gmail-astrajax-label-to-airtable.gs`

**You choose** which emails go to Airtable by applying the Gmail label **AstraJax**. The script polls every **1 minute** (not instant — Apps Script limitation).

1. New Apps Script project at [script.google.com](https://script.google.com).
2. Paste the label script.
3. Paste the **same** `WEBHOOK_URL` as Option A.
4. Run **`setupAstraJaxLabels()`** — creates `AstraJax` and `AstraJax/Sent` in Gmail.
5. Run **`testWebhookPing()`** then **`createLabelTrigger()`**.

**Daily use:** open an email in Gmail → apply label **AstraJax** → within ~1 minute it appears in Emails (and gets **AstraJax/Sent** so it is not duplicated).

| Label | Who applies | Meaning |
|---|---|---|
| **AstraJax** | You | "Send this to Airtable" |
| **AstraJax/Sent** | Script | Already posted — do not apply manually |

Debug: **`debugLabelSetup()`** · retry failed sends: **`resetSentLabels()`** then re-apply **AstraJax**

Optional backfill (skips already-labelled mail):

```javascript
backfillRecent_(7, 25);
```

---

## 5. Release Scanner sync (Hyperagent only)

After emails are categorised, sync Hyperagent releases into the repo log:

```bash
python3 hyperagent/scripts/sync_hyperagent_releases.py --mode airtable
```

This:

1. Reads Emails where **Email Category = Hyperagent Release** and **Scanner Status = New**
2. Appends unverified entries to `docs/context/hyperagent-releases.json`
3. Marks those rows **Scanner Status = Synced to repo**

Dry run:

```bash
python3 hyperagent/scripts/sync_hyperagent_releases.py --mode airtable --dry-run
```

Read inbox without syncing:

```bash
python3 hyperagent/scripts/read_email_inbox.py --all-categories --max-records 10
```

Requires `AIRTABLE_READ_TOKEN` and `AIRTABLE_WRITE_TOKEN` in repo-root `.env`.

---

## 6. Review and promote (human gate)

1. Check new rows in **Hyperagent releases** view.
2. Run scanner sync (above).
3. Review `docs/context/hyperagent-releases.json`.
4. Promote durable facts into `docs/context/hyperagent-platform.md` (Matthew approves).
5. Mark row **Scanner Status = Promoted** in Airtable when done (manual for now).

Unverified release log entries are **not** platform truth until promoted.

---

## Downstream flows (future)

Because **all** email is in Airtable with AI category + summary, you can later:

- Route **Customer / Sales** into Context Intake
- Alert on **Finance / Billing**
- Ignore **Newsletter / Marketing** in a filtered view
- Build a separate agent per category without touching Gmail again

The Hyperagent Release Scanner stays narrow: it only reads **Hyperagent Release**.

---

## Troubleshooting

### Airtable says "This URL has not received any requests recently"

Work through these **in order** in the Apps Script editor (paste latest `gmail-to-airtable-email.gs` first):

1. **Project Settings → Script properties** — confirm `WEBHOOK_URL` is set to the URL from the automation **webhook trigger** step (starts with `https://hooks.airtable.com/...`). Not the base URL, not an interface link.
2. **Automation is ON** — toggle off/on if needed; copy the URL again after republishing.
3. Run **`debugSetup()`** → **Executions** (left sidebar) → open the run → read the log.
4. Run **`testWebhookPing()`** — this bypasses Gmail and POSTs a test row. Airtable should show a request within seconds.
5. If ping works but poll does not → run **`resetCapturedLabels()`** then **`runPollNow()`** (threads may already be labelled from a failed earlier run).

| Symptom | Likely cause |
|---|---|
| `WEBHOOK_URL set: NO` | Add Script property (exact name `WEBHOOK_URL`) |
| Ping fails HTTP 404/403 | Wrong URL or automation off |
| Ping OK, no Emails row | Webhook received but **Create record** action failed — check field mapping |
| Poll finds 0 threads, many labelled | Run `resetCapturedLabels()` |
| Only waiting on trigger | Trigger runs every 5 min — use `testWebhookPing()` or `runPollNow()` to test now |

**View logs:** Apps Script → **Executions** (not just the pop-up Logger when testing).

---

## Related files

- Table setup: `hyperagent/scripts/setup_email_inbox_table.py`
- Read script: `hyperagent/scripts/read_email_inbox.py`
- Sync script: `hyperagent/scripts/sync_hyperagent_releases.py`
- Scanner skill: `.cursor/skills/clive-hyperagent-release-scanner/SKILL.md`
- Schema: `hyperagent/context_architecture_schema_v1.json`
