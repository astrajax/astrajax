# Email Inbox — Interface Extension

Browse captured Gmail in **Emails** (`appYv601Oq7fKTCj0`) by category — same ten labels as your Airtable AI classifier.

## Block

Block ID: **`blkEn20927wOhYhKt`** (`.block/remote.json` + `.block/astrajax.remote.json`)

Link once if missing:

```bash
npx block add-remote appYv601Oq7fKTCj0/blkEn20927wOhYhKt default
```

Once: `npx block set-api-key` (PAT with **block:manage**).

## Local dev / release

```bash
cd interface-extensions/email-inbox
npm run typecheck
npx block release                    # default remote (baseId NONE)
npx block release --remote astrajax  # if astrajax remote exists
```

Hard-refresh the **Interface page** (`Cmd+Shift+R`). Not the in-browser code editor.

If you see Hello world on the **live page**: wrong block on the element, or release not run. This extension must use block **`blkEn20927wOhYhKt`**, not a newly created scaffold. See [`../README.md`](../README.md) for the block ID checklist.

## Interface setup (two layers)

### 1. Extension properties (cog)

- **Emails table** → `Emails`

### 2. Interface Designer → extension → **Data**

Add **Emails**. Expose (read is enough):

| Field | Notes |
|-------|--------|
| Subject | |
| From | |
| From Email | |
| Received At | Sort in Airtable views if needed |
| Body | |
| Body Excerpt | |
| Email Category | |
| Scanner Status | Hyperagent Release rows |
| AI Summary | |
| AI Structured JSON | Optional |
| Gmail Link | Open in Gmail button |
| Ingest Source | |
| Notes | |
| To | |
| Cc | |
| Has Attachments | |
| Attachment Names | |

## Category tabs

| Tab | Filter |
|-----|--------|
| All inbox | Every captured email |
| Uncategorised | Awaiting AI category |
| Hyperagent Release | Release notes + scanner status badge |
| Platform / SaaS Update | |
| Customer / Sales | |
| Finance / Billing | |
| Newsletter / Marketing | |
| Personal | |
| Internal / Team | |
| Notification / System | |
| Other | |

Search runs across subject, sender, AI summary, and body. Newest first within each tab.

## Related

- Gmail capture setup: `docs/context/email-inbox-setup.md`
- Hyperagent scanner: `.cursor/skills/clive-hyperagent-release-scanner/SKILL.md`
