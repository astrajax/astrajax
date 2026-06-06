# Clive Curator Context Health Audit - 2026-06-02

Target: `curator`
Checks: `duplicates`
Sources read: 28
Findings: 7
Repo root: `/Users/matthewhopkinson/Documents/AstraJax`

Safety: audit mode is read-only. This run did not create, approve, publish, demote, or edit context.

## Findings

### CUR-20260602-001 - Medium

- Check: duplicates
- Surface: .cursor/agents/clive-curator.md, hyperagent/exports/agents/agent-clive-curator-v0_1.json, hyperagent/exports/agents/agent-clive-curator-v1.json, hyperagent/exports/agents/agent-clive-curator-v2.json, hyperagent/exports/agents/agent-clive-curator-v3.json, hyperagent/exports/agents/agent-clive-curator-v4.json
- Evidence: 7 sources share title 'clive-curator'.
- Why it matters: Duplicate context titles make it unclear which copy is canonical.
- Recommended action: Choose a canonical copy; mark or archive superseded copies.
- Owner or route: Matthew or Publisher

### CUR-20260602-002 - Medium

- Check: duplicates
- Surface: .cursor/skills/clive-context-curator/SKILL.md, hyperagent/exports/skills/skill-clive-context-curator-v5.json
- Evidence: 2 sources share title 'clive-context-curator'.
- Why it matters: Duplicate context titles make it unclear which copy is canonical.
- Recommended action: Choose a canonical copy; mark or archive superseded copies.
- Owner or route: Matthew or Publisher

### CUR-20260602-003 - Medium

- Check: duplicates
- Surface: agents/cursor/clive/curator/archive/build-pack-v2.md, agents/cursor/clive/curator/build-pack-v2.md
- Evidence: 2 sources share title 'Clive Curator V2 — Build Pack'.
- Why it matters: Duplicate context titles make it unclear which copy is canonical.
- Recommended action: Choose a canonical copy; mark or archive superseded copies.
- Owner or route: Matthew or Publisher

### CUR-20260602-004 - Medium

- Check: duplicates
- Surface: agents/cursor/clive/curator/archive/build-pack-v3.md, agents/cursor/clive/curator/build-pack-v3.md
- Evidence: 2 sources share title 'Clive Curator V3 - Build Pack'.
- Why it matters: Duplicate context titles make it unclear which copy is canonical.
- Recommended action: Choose a canonical copy; mark or archive superseded copies.
- Owner or route: Matthew or Publisher

### CUR-20260602-005 - Medium

- Check: duplicates
- Surface: agents/cursor/clive/curator/archive/build-pack-v4.md, agents/cursor/clive/curator/build-pack-v4.md
- Evidence: 2 sources share title 'Clive Curator V4 - Build Pack'.
- Why it matters: Duplicate context titles make it unclear which copy is canonical.
- Recommended action: Choose a canonical copy; mark or archive superseded copies.
- Owner or route: Matthew or Publisher

### CUR-20260602-006 - Medium

- Check: duplicates
- Surface: hyperagent/builds/build_clive_curator_v0_1.py, hyperagent/builds/build_clive_curator_v1.py, hyperagent/builds/build_clive_curator_v2.py, hyperagent/builds/build_clive_curator_v3.py, hyperagent/builds/build_clive_curator_v4.py, hyperagent/builds/build_clive_curator_v5.py
- Evidence: 6 sources share title '!/usr/bin/env python3'.
- Why it matters: Duplicate context titles make it unclear which copy is canonical.
- Recommended action: Choose a canonical copy; mark or archive superseded copies.
- Owner or route: Matthew or Publisher

### CUR-20260602-007 - Low

- Check: duplicates
- Surface: hyperagent/exports/agents/agent-clive-curator-v0_1.json, hyperagent/exports/agents/agent-clive-curator-v1.json, hyperagent/exports/agents/agent-clive-curator-v2.json, hyperagent/exports/agents/agent-clive-curator-v3.json, hyperagent/exports/agents/agent-clive-curator-v4.json, hyperagent/exports/agents/agent-clive-curator-v5.json
- Evidence: 6 exports exist for clive-curator.
- Why it matters: Multiple exports are acceptable as history, but the live one should be obvious.
- Recommended action: Mark the current export in the build pack or archive older exports.
- Owner or route: Agent Factory

## Dashboard Button Prompts

Use these as Airtable dashboard button prompt payloads:

```text
@clive-curator audit target=clive-core checks=stale,conflicts,unsupported,risky
@clive-curator audit target=agent-factory checks=stale,unsupported,risky
@clive-curator audit target=context-packs checks=duplicates,risky
@clive-curator audit target=hyperagent-platform checks=stale,conflicts
@clive-curator cleanup finding=CUR-YYYYMMDD-001
```

## Next Decisions

- Pick any High or Medium finding for cleanup draft.
- Ignore Low findings unless they cluster around the same surface.
- Route prompt/skill/build fixes to Agent Factory or normal Cursor implementation.
