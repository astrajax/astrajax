# Hyperagent artifacts

Clive agent **generators**, **runtime scripts**, and **Hyperagent import exports**.

Agents are **designed and built in Cursor**. Registry folders are split by
**production runtime**:

- `agents/registry/cursor/` — Cursor subagents (Clive's Man, Doc's Minions, …)
- `agents/registry/hyperagent/` — Hyperagent web/Slack agents

See `agents/README.md` for the full layout.

## What is live today

| Role | Runtime | Registry | Export / generator |
|------|---------|----------|-------------------|
| **Clive Agent Factory (Hyperagent)** | Hyperagent | `agents/registry/hyperagent/clive/agent-factory/` | `exports/agents/agent-clive-agent-factory-v3.json` · `builds/build_clive_agent_factory_v3.py` |
| **Clive's Man** (+ minions) | Cursor | `agents/registry/cursor/clive/clive-man/` | `builds/build_clive_man_v0_1.py` |
| **Doc's Workshop** (+ minions) | Cursor | `agents/registry/cursor/doc/` | `builds/build_doc_workshop_*.py` |
| **Hyperagent Release Scanner** | Cursor | `agents/registry/cursor/clive/hyperagent-release-scanner/` | `builds/build_clive_hyperagent_release_scanner_v0_2.py` |

The old **Intake → Curator → Scanner → Publisher** Hyperagent lane is **retired**.
Clive's Man replaced it. Historical exports, build scripts, and wiring docs live
under `exports/archive/`, `builds/archive/`, `scripts/archive/`, and
`docs/archive/`.

## Folder layout

```text
hyperagent/
  builds/                 # live generators only
    build_*.py
    archive/              # retired Intake/Curator/Scanner/Publisher generators
  exports/
    agents/               # live Hyperagent agent JSON (import these)
    skills/               # live Hyperagent skill JSON
    archive/              # superseded exports — do not import for production
  scripts/                # shared Airtable + context tools (Clive's Man reuses these)
    archive/              # retired Curator/Scanner webhook + daily runners
  config/                 # scanner source config (still used by source-scan workflow)
  docs/                   # deploy playbook
    archive/              # retired webhook setup guides
  reports/archive/        # historical audit outputs
  schedule/archive/       # retired launchd schedules
  logs/                   # runtime noise — gitignored
```

## Regenerate live artifacts

```bash
# Only Hyperagent production export today
python3 hyperagent/builds/build_clive_agent_factory_v3.py

# Cursor-native replacements for the retired context lane
python3 hyperagent/builds/build_clive_man_v0_1.py

# Platform truth upkeep
python3 hyperagent/builds/build_clive_hyperagent_release_scanner_v0_2.py

# Doc's Workshop minions
python3 hyperagent/builds/build_doc_workshop_proposer_v0_2.py
python3 hyperagent/builds/build_doc_workshop_challenger_v0_1.py
python3 hyperagent/builds/build_doc_workshop_cursor_v0_1.py
python3 hyperagent/builds/build_doc_workshop_hyperagent_v0_1.py
```

## Deploy without deleting agents

**Do not delete Hyperagent agents to update them** — that destroys webhooks and
forces Airtable rewiring.

See **`hyperagent/docs/hyperagent-deploy-playbook.md`**.

## Hyperagent release sync

```bash
python3 hyperagent/scripts/sync_hyperagent_releases.py --mode files --source-dir path/to/exported-emails --sender <sender-or-domain>
python3 hyperagent/scripts/sync_hyperagent_releases.py --mode imap --sender <sender-or-domain>
```

Raw entries go to `docs/context/hyperagent-releases.json`. Curated platform truth
lives in `docs/context/hyperagent-platform.md`.

## Roster scan

```bash
python3 hyperagent/scripts/list_repo_agents.py --include-skills --include-registry
python3 hyperagent/scripts/list_repo_agents.py --platform hyperagent
python3 hyperagent/scripts/list_repo_agents.py --platform cursor
```
