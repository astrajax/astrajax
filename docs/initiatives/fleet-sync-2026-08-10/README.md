# Fleet sync — 2026-08-10

## What happened

On **2026-08-10**, a fleet-wide sync pushed **25 agents** from HyperAgent exports into their Airtable agent bases (Persona Config, Skills, and related tables per agent schema).

## Reversal record (preserve these)

The files in this folder are the **only reversal record** for undoing the sync. They list record IDs created during the run:

| File | Contents |
|------|----------|
| `fleet_sync_reversal_log.json` | Structured reversal log (created record IDs) |
| `wave3_output.txt` | Wave 3 execution output |
| `wave4_output.txt` | Wave 4 execution output |

**Do not delete this folder** until the sync is confirmed stable and any rollback is no longer needed.

## Known follow-ups

1. **Halvard's base** (`appr3I2G6Ix1BLAwM`) has no Skills table (physician schema) — 8 skills from his export were not written.
2. **Duplicate Persona Config v1.0 rows** on Clive, Doc, and Lazlo from an interrupted pass.
3. **Two test bases** pending deletion (see Task 3 verification).
4. **17 minion bases** were created without Ruth's schema sign-off — architectural review outstanding.
5. **No Pam check** was run before execution.
