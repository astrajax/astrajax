# Fleet sync initiative — 2026-08-10

Working notes for the HyperAgent → Airtable fleet sync recovery.

## FREEZE — 2026-08-11

No HyperAgent→Airtable **full fleet** sync runs until Matthew has reviewed a clean dry-run and the idempotency test passes.

- Writer (when present): `hyperagent/scripts/sync_hyperagent_fleet_to_airtable.py`
- Roster: `hyperagent/scripts/fleet_sync_roster.json`
- Default: `--dry-run`. `--apply` writes a reversal log under this folder.

Do **not** re-run full fleet `--apply` while the freeze is in force.

## Exception — Kathryn Goodchild 2026-08-11

Matthew explicitly authorised a **Kathryn-only** setup outside the freeze:

| Item | Value |
|------|-------|
| Agent base | `appzvesAIpPxjfAMF` — **AstraJax Agent — Kathryn Goodchild** |
| Persona Config | `recZkhAbib7fQBL8Z` — `Operational v1.0 (HyperAgent sync)` |
| Household Members | `recd78kNWGdtLVY2f` — Agent Base ID + System Prompt filled |
| Skills written | 18 rows in agent base Skills table |
| Reversal log | `kathryn-goodchild-reversal-2026-08-11.json` |

Canonical export: `~/Downloads/agent-kathryn-goodchild.json` (`exportedAt` 2026-08-08). Prompt mirrored byte-for-byte (9060 chars) to Persona Config and Household Register.

Roster updated: `kathryn-goodchild` added as **Head** in `fleet_sync_roster.json`.
