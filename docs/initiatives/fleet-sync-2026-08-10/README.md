# Fleet sync 2026-08-10

Reversal record for the HyperAgent → Airtable fleet sync (25 agents).

## FREEZE — 2026-08-11

**No HyperAgent → Airtable fleet sync runs** until the idempotent writer exists and passes smoke tests.

- **Blocked:** ad-hoc MCP writes, manual wave scripts, or re-running the 2026-08-10 sync pattern.
- **Allowed:** dry-run and offline tests only against `hyperagent/scripts/sync_hyperagent_fleet_to_airtable.py`.
- **Writer:** `hyperagent/scripts/sync_hyperagent_fleet_to_airtable.py` + roster `hyperagent/scripts/fleet_sync_roster.json`.
- **Lift freeze when:** Matthew has reviewed a clean dry-run plan and the idempotency test passes (`python3 hyperagent/scripts/test_fleet_sync_idempotency.py`).

### How to dry-run (after env token present)

```bash
python3 hyperagent/scripts/sync_hyperagent_fleet_to_airtable.py \
  --input-dir hyperagent/exports/agents
```

Default is dry-run. Pass `--apply` only after Matthew explicitly approves a plan. Every apply writes a verified reversal log JSON in this folder.

### What the writer refuses

- Creating Agent bases for **minions** (ever).
- Creating any Agent base unless `--allow-create-bases` **and** roster classifies the agent as **head** (reserved; existing heads use known base IDs).
- Inserting a second Approved/Pending Persona Config row with the same Config Name.
- Writes to legacy Ruth control plane `appubDI76O0t8xisg`.

## Files in this folder

| File | Status | Size |
|------|--------|------|
| `fleet_sync_reversal_log.json` | **Present** — recovered from `/tmp` on 2026-08-10 | 32,486 bytes (1,439 lines) |
| `wave3_output.txt` | **Present** — recovered from `/tmp` on 2026-08-10 | 2,666 bytes (124 lines) |
| `wave4_output.txt` | **Present** — recovered from `/tmp` on 2026-08-10 | 1,613 bytes (78 lines) |
| `reconstructed-state-2026-08-10.json` | **Not present** — not needed; original log was recovered | — |

### Copy failure (earlier session)

A previous agent reported copying the three `/tmp` files into this folder but **did not actually do so** — only this README existed until the recovery pass. The originals remained in `/tmp` (`fleet_sync_reversal_log.json`, `wave3_output.txt`, `wave4_output.txt`) and were copied and verified here on 2026-08-10.

Use `fleet_sync_reversal_log.json` as the authoritative reversal record. The wave output files are supplementary run logs from waves 3 and 4.

---

## Cleanup pass

Executed 2026-08-10 (approved cleanup).

### Task 1 — Test bases (needs Matthew)

Airtable MCP exposes **no base-deletion tool** (`delete_table` and `delete_records_for_table` exist; `delete_base` does not).

Both bases were inspected before recommending deletion:

| Base ID | Name | Verdict |
|---------|------|---------|
| `appMpcYci4R8pJm5x` | TEST Fleet Sync Scaffold — DELETE ME | Empty scaffold (5 standard tables, 0 records) |
| `appPUJH7gjc9SQ726` | TEST Python create base | Empty scaffold (1 Persona Config table, 0 records) |

**Manual step:** In the Airtable UI, open each base → Settings → Delete base.

### Task 2 — Duplicate Persona Config rows (done)

Compared Operational System Prompt on each pair — identical. Kept first-created row; set second to **Retired**.

| Agent | Base | Kept | Retired |
|-------|------|------|---------|
| Clive | `appBd9tudgvOSrhSX` | `rec6iKE8eqihZf5kN` | `reccDlJmWwUMQmmy7` |
| Doc | `appI5tpwsKNwjfrqR` | `recBDRgPKfNbWTQmH` | `recy2ewynautqnngT` |
| Lazlo | `appMHIxnwPMljiAQB` | `rec8jDiStkEOVBuNd` | `recHJObh5AyMP0vuu` |

### Task 3 — Halvard Skills (done)

Created **Skills** table on Halvard base `appr3I2G6Ix1BLAwM`, field template copied from Ruth Hadley base (`appmbvCqh9CJv5Q4M`, table `tblwRexULqMKweBxH`). Wrote 8 skills from `agent-prof-halvard-bjornson (2).json` export; Provenance Status = Pending, Created By = Agent on all rows. Verified: 8 records present.

| Table | ID |
|-------|-----|
| Skills (Halvard) | `tblOcXbgRLPWhVVmV` |

| Skill Name | Record ID |
|------------|-----------|
| Household Communication Standard | `recphHEFDCP0ubK0F` |
| Household Routing Standard | `recerTvIK1GO1Y780` |
| Household Conduct Standard | `recJvMXMCpKlt5idM` |
| physician-human-signals-triage | `recClp3qH8FtSaUx9` |
| physician-vitals-and-tracking | `recOZDR6Kvivjx2tw` |
| physician-rubric-craft | `recTvYVkbDOUgI2ZZ` |
| Household Activity Logging | `recDCMhJXgIQ7CVho` |
| physician-activity-reviewer | `rec7KbgS8KzpMAZ1K` |

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

**Keep Kathryn out of `fleet_sync_roster.json`.** The in-repo bundle (`hyperagent/exports/agents/agent-kathryn-goodchild-v0_1.json`, `exportedAt` 2026-08-02, shorter prompt, 1 skill) is older than the live Airtable wiring. Registering her slug/base for fleet sync would let an approved `--apply` from the default input directory overwrite Persona Config and Household Register with that stale export. Base IDs stay in `website/src/lib/brains/airtable-ids.ts` and this exception log — not in the sync roster — until the repo export matches the canonical Downloads file.
