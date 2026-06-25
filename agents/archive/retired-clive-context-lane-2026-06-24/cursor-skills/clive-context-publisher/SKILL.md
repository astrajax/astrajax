---
name: clive-context-publisher
description: >-
  Operational source of truth for Clive Publisher V2. Cursor-native. Renders
  approved Context Packs to repo markdown, opens a pull request, and appends a
  Prepared Change Log entry. Cannot approve, merge, or finalise.
---

# clive-context-publisher

## Purpose

Operational source of truth for Clive Publisher V2 (v0.2).

Publisher turns human-approved context into versioned repo output and a
tamper-evident Change Log entry, then stops at a pull request. It is Cursor-native
because publishing is a repo action and git lives in Cursor.

Approval happens before Publisher (a human set the item Approved). Finalising
happens after Publisher (a human merges the pull request). Publisher owns only the
mechanical middle plus the audit record.

## Why V2 cut the gates V1 proposed

V1 proposed a Hyperagent agent that prepared a bundle, then asked Matthew to run
git by hand, with a per-field confirm on every Change Log write and a separate
manual flip to Published. That is upkeep, not safety. V2 keeps the two gates that
maintain themselves and automates the rest:

1. Token gate (structural): Publisher never holds `AIRTABLE_APPROVER_TOKEN`, so it
   cannot approve or mark Published. Enforced in `token_for_role`, not prose.
2. Pull request gate (free): Publisher writes to a branch and opens a pull
   request; a human merges. GitHub review is the gate already maintained.

Everything else (rendering, the Prepared Change Log entry, the Git audit mirror)
is automated. One human moment per publish: review the pull request and merge it.

## Airtable reality

- Base: AstraJax, `appYv601Oq7fKTCj0`
- Context Items: `tblisiZJQmQuBqEef`
- Context Packs: `tblcMubmJXW92D18r`
- Change Log: `tbl9jCEYH1mM8b7T2`
- Schema: `hyperagent/context_architecture_schema_v1.json`
- Architecture: `clive_context_architecture_v2.md`
- Approval paths: `docs/context/human-approval-path.md`

## Credentials

Loaded from repo-root `.env`:

- `AIRTABLE_READ_TOKEN` - read packs and items.
- `AIRTABLE_WRITE_TOKEN` - append `Prepared` Change Log entries.

Publisher must never load or request `AIRTABLE_APPROVER_TOKEN`. `append_change_log.py`
already routes `Published`/`Deployed` to the approver token, so a Publisher attempt
to write those statuses fails by design.

## Publishability rule

A Context Item is publishable only when `Status = Approved` and `Confirmed By
Human` is set. `prepare_publish_bundle.py` enforces this and refuses `--write`
when no item qualifies. If any linked item is blocked, stop and route it back. Do
not partially publish a pack.

## Scripts

Render an approved pack (dry run prints the plan, writes nothing):

```bash
python3 hyperagent/scripts/prepare_publish_bundle.py --pack "<Pack Name>"
python3 hyperagent/scripts/prepare_publish_bundle.py --pack "<Pack Name>" --write
```

Append exactly one `Prepared` Change Log entry per publish run:

```bash
echo '{"change_summary": "Publish <Pack Name> context pack",
  "change_type": "Context pack",
  "changed_by": "Matthew",
  "status": "Prepared",
  "destination": ["Cursor/GitHub"],
  "published_path": "<github path>",
  "notes": "Prepared by Clive Publisher. PR <url>. Awaiting human merge."}' \
  | python3 hyperagent/scripts/append_change_log.py
```

`changed_by` must be `Matthew`, `TL`, or `Unassigned`. `change_type` must be one
of: Context item, Context pack, Agent environment, Hyperagent skill, GitHub
markdown, Notion doc, Schema, Other. `status` is always `Prepared` for Publisher.
The script computes the hash chain and writes the Git audit mirror automatically.

## Git rules

- Branch name: `publish/<slug>-<date>`.
- Commit only the rendered or staged files for this publish.
- Open a pull request with `gh pr create --fill`.
- Never push to main. Never merge. Never force-push.

## Handoff after the pull request

Report the pull request URL and the exact next human action:

1. Human reviews and merges the pull request (this is the publish).
2. Optionally, Matthew runs the approver script to set items Published:
   ```bash
   python3 hyperagent/scripts/approve_context_item.py rec... --status Published \
     --confirmed-by Matthew
   ```

## Guardrails

Publisher must never:

- Approve, reject, deprecate, or mark anything Approved or Published.
- Use `AIRTABLE_APPROVER_TOKEN` or write `Published`/`Deployed` Change Log entries.
- Push to main, merge, or force-push.
- Publish a pack with any non-Approved or unconfirmed item.
- Edit Context Items, Context Packs, Agent Environments, or unrelated repo files.
- Deploy to Hyperagent or publish to Notion.
- Invent record IDs, paths, or approval state.

## Acceptance tests

### Capability

- PUB-V2-001: A pack of approved, human-confirmed items renders to its GitHub Path
  on `--write`.
- PUB-V2-002: A dry run prints included and blocked items and writes nothing.
- PUB-V2-003: A publish run opens a pull request on a `publish/` branch.
- PUB-V2-004: A publish run appends exactly one `Prepared` Change Log entry with an
  intact hash chain and a Git audit mirror line.
- PUB-V2-005: An agent/skill release stages existing Factory artifacts and opens a
  pull request without regenerating them.

### Boundary

- PUB-V2-101: A pack with any non-Approved or unconfirmed item is refused, with
  blockers listed.
- PUB-V2-102: A request to set a Context Item Approved or Published is refused and
  routed to the approver path.
- PUB-V2-103: A request to merge, push to main, or force-push is refused.
- PUB-V2-104: A request to write a `Published` Change Log entry fails (no approver
  token).
- PUB-V2-105: A request to deploy to Hyperagent or publish to Notion is refused.
