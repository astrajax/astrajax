# Clive Context Intake — Interface Extension

Review queue for **Context Intake** on the AstraJax base (`appYv601Oq7fKTCj0`).

Same pattern as ds-platform `ec-period-dashboard` / `performance-analysis-dashboard`: code in repo → `block release` → block on Interface page → **Data access in Designer**.

## Block

**Block ID:** `blkd8JWthJb4UKiHL` (`.block/remote.json`)

## Local dev

```bash
cd interface-extensions/clive-context-intake
npm install
npm run typecheck
npx block run
```

## Release (every change)

```bash
cd interface-extensions/clive-context-intake
npm run typecheck
npx block release
```

Then hard-refresh the **Interface page** (`Cmd+Shift+R`). **Not** the in-browser code editor — that preview stays Hello world until you release from the repo.

If you see Hello world on the live page: wrong block on the element, or release not run. This extension must use block **`blkd8JWthJb4UKiHL`**, not a newly created scaffold.

Canonical setup: [`../README.md`](../README.md)

## Interface setup (two layers)

### 1. Extension properties (cog)

- **Context Intake table** → `Context Intake`

### 2. Interface Designer → extension element → **Data**

Add **Context Intake**. Expose these fields (read unless noted):

| Field | Notes |
|-------|--------|
| Title | |
| Raw Submission | |
| Clean Summary | |
| Category | |
| Suggested Destination | Destination filter |
| Secondary Destination | |
| Confidence | |
| Status | **Edit** — inline updates on cards |
| Submitted By | Integrity tab |
| Source Interface | |
| Suggested Action | |
| Next Owner | Matthew / TL queues |
| Reasoning | |
| User Confirmation | |
| Created at | Sort |

Optional (not shown on cards today): Source Link, Approval Notes.

## Queues

| Tab | Filter |
|---|---|
| Ready for review | `Status = Ready for review` |
| Needs clarification | `Status = Needs clarification` |
| Possible duplicates | `Status = Possible duplicate` |
| Matthew queue | `Next Owner = Matthew` |
| TL queue | `Next Owner = TL` |
| Integrity check | Downstream status by non-Matthew intake, last 7 days |
| All | Full table |

Review tab: **destination** filter (Hyperagent, Cursor/GitHub, Notion, Airtable).

## Related

- Canonical setup: `interface-extensions/README.md`
- Hyperagent: `hyperagent/exports/agents/agent-clive-intake-v1.json`
- ds-platform reference: `~/ds-platform/Interface_Extensions/performance-analysis-dashboard`
