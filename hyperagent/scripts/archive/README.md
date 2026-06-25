# Retired Curator / Scanner wiring scripts

These scripts supported **Hyperagent webhook triggers** and **daily Curator
launchd** runs for the old context lane. Clive's Man replaced that lane; these
are kept for reference only.

| Script | Was |
|--------|-----|
| `run_curator_daily.sh` | launchd runner → Curator daily audit |
| `draft_curator_daily_review.py` | Draft output for daily review |
| `test_curator_webhook.sh` | Smoke-test Curator webhook |
| `trigger_clive_curator_webhook.airtable.js` | Airtable → Curator webhook |
| `trigger_curator_from_agent_environment.airtable.js` | Agent Environments → Curator |
| `trigger_scanner_from_agent_environment.airtable.js` | Agent Environments → Scanner |
| `ensure_agent_environment_webhook_field.py` | One-time Airtable field setup |
| `add_agent_environment_trigger_fields.py` | Agent Environments trigger fields |

## Shared tools still live

Context read/write scripts (`create_context_intake.py`, `read_context_items.py`,
`scan_context_sources.py`, etc.) stay in `../` — Clive's Man reuses them.

Historical setup docs: `../../docs/archive/`
