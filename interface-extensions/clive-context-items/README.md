# Clive Context Items — Interface Extension

Human review inbox for **Context Items** (`appYv601Oq7fKTCj0`). Shows **Proposed By Agent** on every card.

## Block

Block ID: **`blkPAJw91ne3ACEHo`** (`.block/remote.json` + `.block/astrajax.remote.json`)

Link once if missing:

```bash
npx block add-remote appYv601Oq7fKTCj0/blkPAJw91ne3ACEHo default
```

## Local dev / release

```bash
cd interface-extensions/clive-context-items
npm install && npm run typecheck
npx block release                    # default remote (baseId NONE)
npx block release --remote astrajax  # base-scoped install — run both after changes
```

Then hard-refresh the **Interface page** (`Cmd+Shift+R`). **Not** the in-browser code editor — that preview stays Hello world forever.

## Interface setup (two layers)

### 1. Extension properties

- **Context Items table** → `Context Items`

### 2. Interface Designer → extension → **Data**

Add **Context Items**. Expose:

| Field | Notes |
|-------|--------|
| Title | |
| Canonical Text | **Edit** — quick fix in Show details |
| Category | |
| Owner | |
| Status | **Edit** |
| Authority | |
| Freshness | |
| Created By | |
| Proposed By Agent | **Edit** not required — read only |
| Confirmed By Human | **Edit** — Approve/Reject |
| Confirmation Method | **Edit** |
| Bootstrap Source | Search |
| Source Notes | Search |
| Approval Notes | **Edit** |
| Last Reviewed | **Edit** |
| Created at | Sort |

**Approve / Reject** sets `Confirmed By Human` to the logged-in user (Matthew or TL), `Confirmation Method` = Interface button.

## Queues

| Tab | Filter |
|---|---|
| Matthew review | Draft, Agent proposed, Proposed, Needs decision |
| Draft / quarantine | `Status = Draft` |
| Proposed | Proposed / Agent proposed |
| Needs decision | Needs decision |
| All | Full table |

Search: title, canonical text, agent name, bootstrap source, source notes. Filter by **Proposed By Agent**.

## Related

- Approval path: `docs/context/human-approval-path.md`
- Workbench (read layer): `interface-extensions/clive-context-workbench/`
