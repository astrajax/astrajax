# Context Architecture V2 Context Pack

**Status:** Operational (enforcement layer).  
**Primary destination:** Cursor/GitHub.  
**Owner:** Matthew.  
**Primary sources:** `clive_context_architecture_v2.md`, `docs/context/human-approval-path.md`.

## Purpose

Summarise the V2 corrections to human approval, provenance, and traceability.
V1 table shape and agent boundaries stay; V2 replaces forgeable approval gates.

Read `context-architecture-v1.md` for tables, lifecycle, and write surfaces. Read
this pack for **how approval is enforced**.

## Why V2 exists

V1 let agents assert human confirmation via script flags (`matthew_confirmation`,
`--confirmed-by`). That is not a gate — any agent with script access could
self-approve. V2 makes human confirmation structurally impossible from agent paths.

## Canonical rule

An item is canonical only when:

- `Status = Approved`, **and**
- `Confirmed By Human` is set by a human-only path (Airtable edit, Interface
  button, or Matthew's approver script).

Agents may create `Proposed` only. They cannot set `Confirmed By Human`,
`Approved`, `Published`, or `Deprecated`.

## Human approval paths

See `human-approval-path.md` for the three allowed paths:

1. Airtable direct edit
2. Clive Context Items interface extension
3. `approve_context_item.py` with `AIRTABLE_APPROVER_TOKEN` (Matthew terminal only)

## Provenance fields (Context Items)

- `Created By` — Agent / Matthew / TL
- `Proposed By Agent` — which agent proposed it
- `Confirmed By Human` — Matthew / TL / empty
- `Confirmation Method` — Airtable edit / Interface button / approver script

## V2 design principles

1. A gate is only real if the agent cannot satisfy it alone.
2. Provenance is explicit on every record.
3. Traceability uses links, not prose alone.
4. Least privilege on credentials.
5. The audit trail must be hard to rewrite.
6. Fail early and locally, not late at the API.

## Audit mirror

Change Log entries may be mirrored to `docs/context/audit/audit.jsonl` with hash
chain fields. Do not edit lines manually.

## Source IDs

- `SRC-CLIVE-ARCH-V2`: `clive_context_architecture_v2.md`
- `SRC-CLIVE-APPROVAL`: `docs/context/human-approval-path.md`
