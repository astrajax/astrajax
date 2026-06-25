# Archived Hyperagent / Curator schedules

**Do not load these on macOS launchd.** They are historical Cursor-era runners for
the **retired** Clive Curator agent.

Clive's Man (Cursor) replaced the active context lane on 2026-06-24. There is no
Hyperagent Curator schedule to maintain.

## Archived files

| File | Was | Replaced by |
|------|-----|-------------|
| `com.astrajax.clive-curator-daily.plist` | launchd 08:00 local → `run_curator_daily.sh` | Clive's Man workflows in Cursor |

If this job is still loaded:

```bash
launchctl bootout gui/$(id -u) ~/Library/LaunchAgents/com.astrajax.clive-curator-daily.plist
```

(path may vary)

Script archived at: `hyperagent/scripts/archive/run_curator_daily.sh`
