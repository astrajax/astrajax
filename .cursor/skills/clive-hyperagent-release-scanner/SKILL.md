---
name: clive-hyperagent-release-scanner
description: Captures Hyperagent release notes from Airtable Emails into an unverified repo log; protects the curated Hyperagent platform doc used by Agent Factory.
---

# clive-hyperagent-release-scanner

## Purpose

Operational source of truth for the Hyperagent release scanner.

All Gmail is captured in Airtable **Emails** via Apps Script webhook. Airtable AI
categorises each row. This scanner reads only **Hyperagent Release** emails, stores
raw entries in `docs/context/hyperagent-releases.json`, and keeps `docs/context/hyperagent-platform.md` as the curated platform
truth that Agent Factory must preload before designing any Hyperagent-deployed agent.

Setup guide: `docs/context/email-inbox-setup.md`

## Core Rule

Scanner captures signals. It does not make platform knowledge canonical.

Raw release entries are written with `status = unverified`. Matthew or a review
pass promotes durable, relevant platform facts into `docs/context/hyperagent-platform.md`.

## Capture Layer (Airtable)

```text
Gmail → Apps Script → Airtable webhook → Emails → AI category → Scanner
```

- **All email** lands in `Emails` (downstream flows can use other categories).
- **Email Category** is set by Airtable AI structured data (see setup doc).
- Scanner filters **Email Category = Hyperagent Release** only.

## Inputs

Primary sync mode (recommended):

```bash
python3 hyperagent/scripts/sync_hyperagent_releases.py --mode airtable
python3 hyperagent/scripts/sync_hyperagent_releases.py --mode airtable --dry-run
```

Fallback modes (manual / legacy):

```bash
python3 hyperagent/scripts/sync_hyperagent_releases.py --mode stdin --sender <sender-or-domain>
python3 hyperagent/scripts/sync_hyperagent_releases.py --mode files --source-dir path/to/exported-emails --sender <sender-or-domain>
python3 hyperagent/scripts/sync_hyperagent_releases.py --mode imap --sender <sender-or-domain>
```

Read Emails without syncing:

```bash
python3 hyperagent/scripts/read_email_inbox.py --category "Hyperagent Release"
python3 hyperagent/scripts/read_email_inbox.py --all-categories --max-records 20
```

Airtable mode needs `AIRTABLE_READ_TOKEN` and `AIRTABLE_WRITE_TOKEN` in repo-root `.env`.

IMAP fallback needs:

- `HYPERAGENT_RELEASE_IMAP_USER`
- `HYPERAGENT_RELEASE_IMAP_PASSWORD`
- optional `HYPERAGENT_RELEASE_IMAP_HOST` (defaults to `imap.gmail.com`)
- optional `HYPERAGENT_RELEASE_MAILBOX` (defaults to `INBOX`)

Apps Script source: `hyperagent/scripts/apps-script/gmail-to-airtable-email.gs`

## Output

The sync script writes only `docs/context/hyperagent-releases.json`. It does not edit `docs/context/hyperagent-platform.md`.

On airtable sync it also marks processed rows **Scanner Status = Synced to repo** in `Emails`.

Each new entry includes:

- source id or content hash
- airtable record id (airtable mode)
- sender, date, subject
- extracted bullets
- raw excerpt
- `status = unverified`

## Review Workflow

1. Confirm Gmail → Airtable capture is running (see `docs/context/email-inbox-setup.md`).
2. Confirm AI has categorised Hyperagent release mail.
3. Run `python3 hyperagent/scripts/sync_hyperagent_releases.py --mode airtable`.
4. Review new unverified entries in `docs/context/hyperagent-releases.json`.
5. Promote durable platform facts into `docs/context/hyperagent-platform.md`.
6. Mark Airtable row **Scanner Status = Promoted** when done.

## Agent Factory Preload Contract

Before designing a Hyperagent-deployed agent, Agent Factory must read:

1. `docs/context/hyperagent-platform.md`
2. `docs/context/hyperagent-releases.json`

If `last_synced_at` is older than seven days or null, Factory should flag the
staleness and offer to run the scanner before continuing.

## Guardrails

The scanner must never:

- Deploy or update Hyperagent agents
- Edit `.cursor/agents`, `.cursor/skills`, or `hyperagent/exports`
- Treat unverified release entries as authoritative
- Store secrets in repo files
- Commit, push, or publish changes
- Read or process non-Hyperagent email categories (other categories are for future flows)

## Acceptance Tests

### HRS-001: Airtable ingest

Given an Emails row with Email Category = Hyperagent Release and Scanner Status = New,
airtable mode adds one unverified entry to `docs/context/hyperagent-releases.json` and marks the row Synced to repo.

### HRS-002: Dedupe

Given the same email twice, the script does not append a duplicate.

### HRS-003: No platform doc mutation

Given a release note, the script does not edit `docs/context/hyperagent-platform.md`.

### HRS-004: Staleness flag

Given `last_synced_at = null` or older than seven days, Factory flags stale
Hyperagent platform context before designing a Hyperagent agent.

### HRS-005: Category filter

Given Emails rows with other categories, airtable mode ignores them.
