# Hyperagent artifacts

Clive agent **generators**, **runtime scripts**, and optional **Hyperagent import exports**.

Agents are **designed and built in Cursor**. Registry folders are split by
**production runtime**:

- `agents/cursor/` — Cursor subagents (e.g. Agent Factory)
- `agents/hyperagent/` — Hyperagent web/Slack agents (e.g. Intake, Curator)

See `agents/README.md` for the full layout.

## Layout

```text
hyperagent/
  builds/              # build_*.py generators (run from repo root)
  exports/
    agents/            # agent-*.json for Hyperagent import
    skills/            # skill-*.json for Hyperagent import
  scripts/             # Airtable + roster helper scripts
  context_architecture_schema_v1.json
```

## Deploy without deleting agents

**Do not delete Hyperagent agents to update them** — that destroys webhooks and forces Airtable rewiring.

See **`hyperagent/docs/hyperagent-deploy-playbook.md`** (skill-only re-import, in-UI prompt edits, webhook URL on Agent Environments).

## Regenerate an agent

```bash
python3 hyperagent/builds/build_clive_hyperagent_release_scanner_v0_1.py
python3 hyperagent/builds/build_clive_curator_v1.py
python3 hyperagent/builds/build_clive_agent_factory_v2.py
python3 hyperagent/builds/build_clive_intake_v1_2.py
```

## Hyperagent release sync

```bash
python3 hyperagent/scripts/sync_hyperagent_releases.py --mode files --source-dir path/to/exported-emails --sender <sender-or-domain>
python3 hyperagent/scripts/sync_hyperagent_releases.py --mode imap --sender <sender-or-domain>
```

Raw entries go to `docs/context/hyperagent-releases.json` as unverified. Curated
platform truth lives in `docs/context/hyperagent-platform.md`.

## Roster scan

```bash
python3 hyperagent/scripts/list_repo_agents.py --include-skills --include-registry
```
