# Clive Context Workbench — Interface Extension

One extension, three tabs: **Agent Fleet**, **Context Library**, **Change Log**.

Review/approval stays on `clive-context-items`. Intake stays on `clive-context-intake`.

## Block

**Block ID:** `blkN9GDiYsKhWjLzJ` (`.block/remote.json` + `.block/astrajax.remote.json`)

## Release

```bash
cd interface-extensions/clive-context-workbench
npm install && npm run typecheck
npx block release
npx block release --remote astrajax
```

Hard-refresh the **Interface page** (`Cmd+Shift+R`) — not the extension code editor (that stays Hello world).

## Interface setup (two layers)

### 1. Extension properties

| Property | Table |
|----------|--------|
| Agent Environments | `Agent Environments` |
| Context Items | `Context Items` |
| Change Log | `Change Log` |

### 2. Interface Designer → extension → **Data**

Add all three tables. Expose fields below.

#### Agent Environments (Fleet tab)

| Field | Access |
|-------|--------|
| Agent Name, Platform, Purpose, Status, Owner | Read |
| Context Packs, Repo Path | Read |
| Runtime Environment, Skills, Tool Permissions | Read only (reference — edit in Cursor) |
| Last Config Review, Notes | **Edit** |
| Created at | Read |

#### Context Items (Library tab)

| Field | Access |
|-------|--------|
| Title, Category, Applies To, Owner | Read |
| Canonical Text, Last Reviewed | **Edit** — quick fix in Show full text |
| Status, Authority, Freshness, Confirmed By Human | Read |
| Context Pack, Created at | Read |

Library shows **Approved** only (+ in-review count in header).

#### Change Log (audit tab)

| Field | Access |
|-------|--------|
| Change Summary, Change Type, Destination, Changed By | Read |
| Approved By, Published Path, Commit SHA, Status, Notes | Read |
| Created at, Prev Hash, Entry Hash | Read |

Banner: hash chain intact / broken (client-side).

## Repo paths on agents

```bash
python3 hyperagent/scripts/populate_agent_repo_paths.py
```

## Related

- `interface-extensions/README.md` — canonical Airtable setup
- ds-platform reference: `~/ds-platform/Interface_Extensions/bot-fleet/`
