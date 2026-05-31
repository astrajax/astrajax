# Human Approval Path — Context Architecture V2

**Status:** Operational.  
**Owner:** Matthew.

## Rule

Agents may create `Context Items` with `Status = Proposed` only. Agents cannot set
`Confirmed By Human`, `Approved`, `Published`, or `Deprecated`.

An item is canonical only when `Status = Approved` AND `Confirmed By Human` is set
by a human-only path.

## How to approve

Choose one path:

### 1. Airtable direct edit

Open the Context Item in Airtable. Set:

- `Status` → `Approved` or `Rejected`
- `Confirmed By Human` → `Matthew` or `TL`
- `Confirmation Method` → `Airtable edit`

### 2. Interface Extension (Clive Context Items)

Open the **Clive // Context Items** interface extension on the AstraJax base.

- Each card shows **Proposed By Agent** (which agent proposed the item).
- Use search or the agent filter to find items by agent name.
- **Approve** or **Reject** sets `Confirmed By Human` (logged-in user mapped to Matthew or TL) and `Confirmation Method` → `Interface button`.

Repo: `interface-extensions/clive-context-items/`

### 3. Approver script (Matthew terminal only)

Requires `AIRTABLE_APPROVER_TOKEN` in your local `.env`. This token must not be
configured in Cursor agent skills, Hyperagent, or `mcp.json`.

```bash
python3 hyperagent/scripts/approve_context_item.py RECXXXXXXXXXXXX \
  --status Approved \
  --confirmed-by Matthew \
  --approval-notes "Reviewed in Airtable queue"
```

Allowed statuses via approver script:

- `Needs decision`
- `Approved`
- `Rejected`
- `Deprecated`
- `Published` (Publisher workflow only; also writes Change Log separately)

## What agents must not use

- `matthew_confirmation` in JSON payloads (removed in V2)
- `--confirmed-by` on any agent-invokable script (removed in V2)
- `update_context_item_status.py` (removed; use approver script or Airtable edit)
