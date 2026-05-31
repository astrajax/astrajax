# Archived Hyperagent / Curator schedules

**Do not load these on macOS launchd.** They are historical Cursor-era runners.

## Canonical runtime (V5+)

- **Daily audit:** Hyperagent native schedule on `agent-clive-curator-v5.json`
  - `FREQ=DAILY;BYHOUR=8;BYMINUTE=0;BYSECOND=0`
  - Timezone: `Europe/London`
- **Workbench buttons:** Hyperagent webhook on the Curator agent (see `hyperagent/docs/clive-curator-webhook-setup.md`)

## Archived files

| File | Was | Replaced by |
|------|-----|-------------|
| `com.astrajax.clive-curator-daily.plist` | launchd 08:00 local → `run_curator_daily.sh` | Hyperagent `scheduledInvocations` on Curator V5 |

If this job is still loaded: `launchctl bootout gui/$(id -u) ~/Library/LaunchAgents/com.astrajax.clive-curator-daily.plist` (path may vary).
