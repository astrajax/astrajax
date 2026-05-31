# Hyperagent-deployed agent template

Production runtime: **Hyperagent** (web, Slack, or schedule).

```text
agents/hyperagent/<family>/<short-name>/
  build-pack-v0.1.md
hyperagent/exports/agents/agent-<slug>-v0.1.json
hyperagent/exports/skills/skill-<skill-name>-v0.1.json
hyperagent/builds/build_<project>_<short>_v0.1.py
```

Optional **Cursor mirror** for local dev:

```text
.cursor/agents/<slug>.md
.cursor/skills/<skill-name>/SKILL.md
```

The registry stays under `agents/hyperagent/` even when a Cursor mirror exists.
