# Cursor-native agent template

Production runtime: **Cursor subagent**.

```text
agents/cursor/<family>/<short-name>/
  build-pack-v0.1.md
.cursor/agents/<slug>.md
.cursor/skills/<skill-name>/SKILL.md
hyperagent/builds/build_<project>_<short>_v0.1.py
```

Do **not** create `hyperagent/exports/agents/` JSON unless you later add a
Hyperagent mirror with tools that work in Hyperagent's VM.
