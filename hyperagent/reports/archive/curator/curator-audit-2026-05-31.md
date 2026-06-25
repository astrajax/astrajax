# Clive Curator Context Health Audit - 2026-05-31

Target: `daily`
Checks: `conflicts, duplicates, risky, stale, unsupported`
Sources read: 53
Findings: 118

Safety: audit mode is read-only. This run did not create, approve, publish, demote, or edit context.

## Findings

### CUR-20260531-077 - High

- Check: risky
- Surface: agents/cursor/clive/curator/build-pack-v2.md
- Evidence: Write credential and approval language appear in the same surface.
- Why it matters: Write credentials must not be confused with human approval authority.
- Recommended action: Split write and approval language; verify no approver token is exposed.
- Owner or route: Matthew

### CUR-20260531-079 - High

- Check: risky
- Surface: docs/context/hyperagent-platform.md
- Evidence: `autoSaveMemories` appears with `true` nearby.
- Why it matters: Auto-saved memories bypass the deliberate context approval lane.
- Recommended action: Disable auto-save or document why this agent is exempt.
- Owner or route: Agent Factory

### CUR-20260531-080 - High

- Check: risky
- Surface: hyperagent/builds/build_clive_curator_v0_1.py
- Evidence: `autoSaveMemories` appears with `true` nearby.
- Why it matters: Auto-saved memories bypass the deliberate context approval lane.
- Recommended action: Disable auto-save or document why this agent is exempt.
- Owner or route: Agent Factory

### CUR-20260531-081 - High

- Check: risky
- Surface: hyperagent/builds/build_clive_curator_v1.py
- Evidence: `autoSaveMemories` appears with `true` nearby.
- Why it matters: Auto-saved memories bypass the deliberate context approval lane.
- Recommended action: Disable auto-save or document why this agent is exempt.
- Owner or route: Agent Factory

### CUR-20260531-082 - High

- Check: risky
- Surface: hyperagent/builds/build_clive_curator_v1.py
- Evidence: Write credential and approval language appear in the same surface.
- Why it matters: Write credentials must not be confused with human approval authority.
- Recommended action: Split write and approval language; verify no approver token is exposed.
- Owner or route: Matthew

### CUR-20260531-084 - High

- Check: risky
- Surface: hyperagent/builds/build_clive_curator_v2.py
- Evidence: `autoSaveMemories` appears with `true` nearby.
- Why it matters: Auto-saved memories bypass the deliberate context approval lane.
- Recommended action: Disable auto-save or document why this agent is exempt.
- Owner or route: Agent Factory

### CUR-20260531-085 - High

- Check: risky
- Surface: hyperagent/builds/build_clive_curator_v2.py
- Evidence: Write credential and approval language appear in the same surface.
- Why it matters: Write credentials must not be confused with human approval authority.
- Recommended action: Split write and approval language; verify no approver token is exposed.
- Owner or route: Matthew

### CUR-20260531-087 - High

- Check: risky
- Surface: hyperagent/builds/build_clive_curator_v3.py
- Evidence: `autoSaveMemories` appears with `true` nearby.
- Why it matters: Auto-saved memories bypass the deliberate context approval lane.
- Recommended action: Disable auto-save or document why this agent is exempt.
- Owner or route: Agent Factory

### CUR-20260531-088 - High

- Check: risky
- Surface: hyperagent/builds/build_clive_curator_v3.py
- Evidence: Write credential and approval language appear in the same surface.
- Why it matters: Write credentials must not be confused with human approval authority.
- Recommended action: Split write and approval language; verify no approver token is exposed.
- Owner or route: Matthew

### CUR-20260531-090 - High

- Check: risky
- Surface: hyperagent/builds/build_clive_curator_v4.py
- Evidence: `autoSaveMemories` appears with `true` nearby.
- Why it matters: Auto-saved memories bypass the deliberate context approval lane.
- Recommended action: Disable auto-save or document why this agent is exempt.
- Owner or route: Agent Factory

### CUR-20260531-091 - High

- Check: risky
- Surface: hyperagent/builds/build_clive_curator_v4.py
- Evidence: Write credential and approval language appear in the same surface.
- Why it matters: Write credentials must not be confused with human approval authority.
- Recommended action: Split write and approval language; verify no approver token is exposed.
- Owner or route: Matthew

### CUR-20260531-093 - High

- Check: risky
- Surface: hyperagent/context_architecture_schema_v1.json
- Evidence: Write credential and approval language appear in the same surface.
- Why it matters: Write credentials must not be confused with human approval authority.
- Recommended action: Split write and approval language; verify no approver token is exposed.
- Owner or route: Matthew

### CUR-20260531-094 - High

- Check: risky
- Surface: hyperagent/exports/agents/agent-clive-curator-v0_1.json
- Evidence: `autoSaveMemories` appears with `true` nearby.
- Why it matters: Auto-saved memories bypass the deliberate context approval lane.
- Recommended action: Disable auto-save or document why this agent is exempt.
- Owner or route: Agent Factory

### CUR-20260531-095 - High

- Check: risky
- Surface: hyperagent/exports/agents/agent-clive-curator-v1.json
- Evidence: `autoSaveMemories` appears with `true` nearby.
- Why it matters: Auto-saved memories bypass the deliberate context approval lane.
- Recommended action: Disable auto-save or document why this agent is exempt.
- Owner or route: Agent Factory

### CUR-20260531-096 - High

- Check: risky
- Surface: hyperagent/exports/agents/agent-clive-curator-v1.json
- Evidence: Write credential and approval language appear in the same surface.
- Why it matters: Write credentials must not be confused with human approval authority.
- Recommended action: Split write and approval language; verify no approver token is exposed.
- Owner or route: Matthew

### CUR-20260531-098 - High

- Check: risky
- Surface: hyperagent/exports/agents/agent-clive-curator-v2.json
- Evidence: `autoSaveMemories` appears with `true` nearby.
- Why it matters: Auto-saved memories bypass the deliberate context approval lane.
- Recommended action: Disable auto-save or document why this agent is exempt.
- Owner or route: Agent Factory

### CUR-20260531-099 - High

- Check: risky
- Surface: hyperagent/exports/agents/agent-clive-curator-v2.json
- Evidence: Write credential and approval language appear in the same surface.
- Why it matters: Write credentials must not be confused with human approval authority.
- Recommended action: Split write and approval language; verify no approver token is exposed.
- Owner or route: Matthew

### CUR-20260531-101 - High

- Check: risky
- Surface: hyperagent/exports/agents/agent-clive-curator-v3.json
- Evidence: `autoSaveMemories` appears with `true` nearby.
- Why it matters: Auto-saved memories bypass the deliberate context approval lane.
- Recommended action: Disable auto-save or document why this agent is exempt.
- Owner or route: Agent Factory

### CUR-20260531-102 - High

- Check: risky
- Surface: hyperagent/exports/agents/agent-clive-curator-v3.json
- Evidence: Write credential and approval language appear in the same surface.
- Why it matters: Write credentials must not be confused with human approval authority.
- Recommended action: Split write and approval language; verify no approver token is exposed.
- Owner or route: Matthew

### CUR-20260531-104 - High

- Check: risky
- Surface: hyperagent/exports/agents/agent-clive-curator-v4.json
- Evidence: `autoSaveMemories` appears with `true` nearby.
- Why it matters: Auto-saved memories bypass the deliberate context approval lane.
- Recommended action: Disable auto-save or document why this agent is exempt.
- Owner or route: Agent Factory

### CUR-20260531-105 - High

- Check: risky
- Surface: hyperagent/exports/agents/agent-clive-curator-v4.json
- Evidence: Write credential and approval language appear in the same surface.
- Why it matters: Write credentials must not be confused with human approval authority.
- Recommended action: Split write and approval language; verify no approver token is exposed.
- Owner or route: Matthew

### CUR-20260531-107 - High

- Check: risky
- Surface: hyperagent/exports/agents/agent-clive-intake-v1.json
- Evidence: `autoSaveMemories` appears with `true` nearby.
- Why it matters: Auto-saved memories bypass the deliberate context approval lane.
- Recommended action: Disable auto-save or document why this agent is exempt.
- Owner or route: Agent Factory

### CUR-20260531-108 - High

- Check: risky
- Surface: hyperagent/exports/skills/skill-clive-context-curator-v1.json
- Evidence: Write credential and approval language appear in the same surface.
- Why it matters: Write credentials must not be confused with human approval authority.
- Recommended action: Split write and approval language; verify no approver token is exposed.
- Owner or route: Matthew

### CUR-20260531-109 - High

- Check: risky
- Surface: hyperagent/exports/skills/skill-clive-context-curator-v2.json
- Evidence: Write credential and approval language appear in the same surface.
- Why it matters: Write credentials must not be confused with human approval authority.
- Recommended action: Split write and approval language; verify no approver token is exposed.
- Owner or route: Matthew

### CUR-20260531-110 - High

- Check: risky
- Surface: hyperagent/exports/skills/skill-clive-context-curator-v3.json
- Evidence: Write credential and approval language appear in the same surface.
- Why it matters: Write credentials must not be confused with human approval authority.
- Recommended action: Split write and approval language; verify no approver token is exposed.
- Owner or route: Matthew

### CUR-20260531-112 - High

- Check: risky
- Surface: hyperagent/exports/skills/skill-clive-context-curator-v4.json
- Evidence: `autoSaveMemories` appears with `true` nearby.
- Why it matters: Auto-saved memories bypass the deliberate context approval lane.
- Recommended action: Disable auto-save or document why this agent is exempt.
- Owner or route: Agent Factory

### CUR-20260531-113 - High

- Check: risky
- Surface: hyperagent/exports/skills/skill-clive-context-curator-v4.json
- Evidence: Write credential and approval language appear in the same surface.
- Why it matters: Write credentials must not be confused with human approval authority.
- Recommended action: Split write and approval language; verify no approver token is exposed.
- Owner or route: Matthew

### CUR-20260531-115 - High

- Check: conflicts
- Surface: approve context
- Evidence: .cursor/agents/clive-curator.md: cans approved context, proposed context,   context | .cursor/agents/clive-hyperagent-release-scanner.md: candidate changes for `docs/context/hyperagent-platform.md` for matthew to approve  ## forbidden work  - edit `docs/context | .cursor/agents/clive-intake.md: never set status to approved, rejected, published, or deployed. - never write outside context | .cursor/skills/clive-agent-factory/SKILL.md: never deploys to hyperagent, commits, pushes, approves canonical context
- Why it matters: Contradictory permission language can make agents choose the wrong authority boundary.
- Recommended action: Decide the canonical rule and update or archive the conflicting surface.
- Owner or route: Matthew or Agent Factory

### CUR-20260531-116 - High

- Check: conflicts
- Surface: create context items
- Evidence: .cursor/skills/clive-context-curator/SKILL.md: canonicalise context - write airtable records - create context item | agents/cursor/clive/curator/build-pack-v2.md: canonical.  in v2, you may create context item | .cursor/agents/clive-curator.md: must never:  - approve, reject, publish, deploy, or canonicalise context - create context item | .cursor/skills/clive-agent-factory/SKILL.md: may read these. it must not create or update agent environments, context item
- Why it matters: Contradictory permission language can make agents choose the wrong authority boundary.
- Recommended action: Decide the canonical rule and update or archive the conflicting surface.
- Owner or route: Matthew or Agent Factory

### CUR-20260531-117 - High

- Check: conflicts
- Surface: edit repo
- Evidence: .cursor/agents/clive-curator.md: canonicalise context - create context items from scheduled mode - edit agents, skills, rules, repo file | .cursor/skills/clive-agent-factory/SKILL.md: canonical context, writing change log, editing unrelated repo file | .cursor/agents/clive-intake.md: never write outside context intake. - never edit other agents, github files, notion, or repo | .cursor/skills/clive-context-intake/SKILL.md: must never: approve, publish, deploy, or canonicalise context; edit hyperagent prompts or skills; write to github
- Why it matters: Contradictory permission language can make agents choose the wrong authority boundary.
- Recommended action: Decide the canonical rule and update or archive the conflicting surface.
- Owner or route: Matthew or Agent Factory

### CUR-20260531-118 - High

- Check: conflicts
- Surface: auto-save memories
- Evidence: .cursor/skills/clive-agent-factory/SKILL.md: enable auto-save memor | agents/cursor/clive/agent-factory/build-pack-v2.md: enable auto-save memor | hyperagent/builds/build_clive_curator_v4.py: must not|never).{0,80}edit.{0,80}(repo|file|github)"),         ("auto-save memories", r"(enable|disable|must|never|allow).{0,80}auto.?save.{0,80}memor | hyperagent/exports/skills/skill-clive-context-curator-v4.json: must not|never).{0,80}edit.{0,80}(repo|file|github)\\\"),\\n        (\\\"auto-save memories\\\", r\\\"(enable|disable|must|never|allow).{0,80}auto.?save.{0,80}memor
- Why it matters: Contradictory permission language can make agents choose the wrong authority boundary.
- Recommended action: Decide the canonical rule and update or archive the conflicting surface.
- Owner or route: Matthew or Agent Factory

### CUR-20260531-001 - Medium

- Check: duplicates
- Surface: .cursor/agents/clive-agent-factory.md, .cursor/skills/clive-agent-factory/SKILL.md
- Evidence: 2 sources share title 'clive-agent-factory'.
- Why it matters: Duplicate context titles make it unclear which copy is canonical.
- Recommended action: Choose a canonical copy; mark or archive superseded copies.
- Owner or route: Matthew or Publisher

### CUR-20260531-002 - Medium

- Check: duplicates
- Surface: .cursor/agents/clive-context-scanner.md, .cursor/skills/clive-context-scanner/SKILL.md
- Evidence: 2 sources share title 'clive-context-scanner'.
- Why it matters: Duplicate context titles make it unclear which copy is canonical.
- Recommended action: Choose a canonical copy; mark or archive superseded copies.
- Owner or route: Matthew or Publisher

### CUR-20260531-003 - Medium

- Check: duplicates
- Surface: .cursor/agents/clive-curator.md, hyperagent/exports/agents/agent-clive-curator-v0_1.json, hyperagent/exports/agents/agent-clive-curator-v1.json, hyperagent/exports/agents/agent-clive-curator-v2.json, hyperagent/exports/agents/agent-clive-curator-v3.json, hyperagent/exports/agents/agent-clive-curator-v4.json
- Evidence: 6 sources share title 'clive-curator'.
- Why it matters: Duplicate context titles make it unclear which copy is canonical.
- Recommended action: Choose a canonical copy; mark or archive superseded copies.
- Owner or route: Matthew or Publisher

### CUR-20260531-004 - Medium

- Check: duplicates
- Surface: .cursor/agents/clive-hyperagent-release-scanner.md, .cursor/skills/clive-hyperagent-release-scanner/SKILL.md
- Evidence: 2 sources share title 'clive-hyperagent-release-scanner'.
- Why it matters: Duplicate context titles make it unclear which copy is canonical.
- Recommended action: Choose a canonical copy; mark or archive superseded copies.
- Owner or route: Matthew or Publisher

### CUR-20260531-005 - Medium

- Check: duplicates
- Surface: .cursor/agents/clive-intake.md, hyperagent/exports/agents/agent-clive-intake-v1.json
- Evidence: 2 sources share title 'clive-intake'.
- Why it matters: Duplicate context titles make it unclear which copy is canonical.
- Recommended action: Choose a canonical copy; mark or archive superseded copies.
- Owner or route: Matthew or Publisher

### CUR-20260531-006 - Medium

- Check: duplicates
- Surface: .cursor/skills/clive-context-curator/SKILL.md, hyperagent/exports/skills/skill-clive-context-curator-v0_1.json, hyperagent/exports/skills/skill-clive-context-curator-v1.json, hyperagent/exports/skills/skill-clive-context-curator-v2.json, hyperagent/exports/skills/skill-clive-context-curator-v3.json, hyperagent/exports/skills/skill-clive-context-curator-v4.json
- Evidence: 6 sources share title 'clive-context-curator'.
- Why it matters: Duplicate context titles make it unclear which copy is canonical.
- Recommended action: Choose a canonical copy; mark or archive superseded copies.
- Owner or route: Matthew or Publisher

### CUR-20260531-007 - Medium

- Check: duplicates
- Surface: .cursor/skills/clive-context-intake/SKILL.md, hyperagent/exports/skills/skill-clive-context-intake-v1.json
- Evidence: 2 sources share title 'clive-context-intake'.
- Why it matters: Duplicate context titles make it unclear which copy is canonical.
- Recommended action: Choose a canonical copy; mark or archive superseded copies.
- Owner or route: Matthew or Publisher

### CUR-20260531-008 - Medium

- Check: duplicates
- Surface: .cursor/skills/clive-context-intake-slack-blocks/SKILL.md, hyperagent/exports/skills/skill-clive-context-intake-slack-blocks-v1.json
- Evidence: 2 sources share title 'clive-context-intake-slack-blocks'.
- Why it matters: Duplicate context titles make it unclear which copy is canonical.
- Recommended action: Choose a canonical copy; mark or archive superseded copies.
- Owner or route: Matthew or Publisher

### CUR-20260531-009 - Medium

- Check: duplicates
- Surface: hyperagent/builds/build_clive_agent_factory_v2.py, hyperagent/builds/build_clive_curator_v0_1.py, hyperagent/builds/build_clive_curator_v1.py, hyperagent/builds/build_clive_curator_v2.py, hyperagent/builds/build_clive_curator_v3.py, hyperagent/builds/build_clive_curator_v4.py
- Evidence: 6 sources share title '!/usr/bin/env python3'.
- Why it matters: Duplicate context titles make it unclear which copy is canonical.
- Recommended action: Choose a canonical copy; mark or archive superseded copies.
- Owner or route: Matthew or Publisher

### CUR-20260531-039 - Medium

- Check: stale
- Surface: docs/context/hyperagent-releases.json
- Evidence: Release log has no last_synced_at.
- Why it matters: Agent Factory should not rely on an unsynced release log for platform truth.
- Recommended action: Run the Hyperagent release scanner or mark the log intentionally unsynced.
- Owner or route: Release Scanner

### CUR-20260531-040 - Medium

- Check: unsupported
- Surface: .cursor/agents/clive-curator.md
- Evidence: Uncertainty markers found: placeholder, tbc, todo.
- Why it matters: Uncertain or placeholder language can be mistaken for durable context.
- Recommended action: Either source and approve the claim, or mark it as draft/unverified.
- Owner or route: Matthew or source owner

### CUR-20260531-041 - Medium

- Check: unsupported
- Surface: .cursor/agents/clive-hyperagent-release-scanner.md
- Evidence: Uncertainty markers found: unverified.
- Why it matters: Uncertain or placeholder language can be mistaken for durable context.
- Recommended action: Either source and approve the claim, or mark it as draft/unverified.
- Owner or route: Matthew or source owner

### CUR-20260531-042 - Medium

- Check: unsupported
- Surface: .cursor/skills/clive-agent-factory/SKILL.md
- Evidence: Uncertainty markers found: placeholder, unverified.
- Why it matters: Uncertain or placeholder language can be mistaken for durable context.
- Recommended action: Either source and approve the claim, or mark it as draft/unverified.
- Owner or route: Matthew or source owner

### CUR-20260531-043 - Medium

- Check: unsupported
- Surface: .cursor/skills/clive-context-curator/SKILL.md
- Evidence: Uncertainty markers found: guess, placeholder, tbc, todo.
- Why it matters: Uncertain or placeholder language can be mistaken for durable context.
- Recommended action: Either source and approve the claim, or mark it as draft/unverified.
- Owner or route: Matthew or source owner

### CUR-20260531-044 - Medium

- Check: unsupported
- Surface: .cursor/skills/clive-context-intake-slack-blocks/SKILL.md
- Evidence: Uncertainty markers found: placeholder.
- Why it matters: Uncertain or placeholder language can be mistaken for durable context.
- Recommended action: Either source and approve the claim, or mark it as draft/unverified.
- Owner or route: Matthew or source owner

### CUR-20260531-045 - Medium

- Check: unsupported
- Surface: .cursor/skills/clive-context-scanner/SKILL.md
- Evidence: Uncertainty markers found: placeholder.
- Why it matters: Uncertain or placeholder language can be mistaken for durable context.
- Recommended action: Either source and approve the claim, or mark it as draft/unverified.
- Owner or route: Matthew or source owner

### CUR-20260531-046 - Medium

- Check: unsupported
- Surface: .cursor/skills/clive-hyperagent-release-scanner/SKILL.md
- Evidence: Uncertainty markers found: unverified.
- Why it matters: Uncertain or placeholder language can be mistaken for durable context.
- Recommended action: Either source and approve the claim, or mark it as draft/unverified.
- Owner or route: Matthew or source owner

### CUR-20260531-047 - Medium

- Check: unsupported
- Surface: agents/cursor/clive/agent-factory/build-pack-v2.md
- Evidence: Uncertainty markers found: placeholder, unverified.
- Why it matters: Uncertain or placeholder language can be mistaken for durable context.
- Recommended action: Either source and approve the claim, or mark it as draft/unverified.
- Owner or route: Matthew or source owner

### CUR-20260531-049 - Medium

- Check: unsupported
- Surface: docs/context/hyperagent-platform.md
- Evidence: Uncertainty markers found: unknown, unverified.
- Why it matters: Uncertain or placeholder language can be mistaken for durable context.
- Recommended action: Either source and approve the claim, or mark it as draft/unverified.
- Owner or route: Matthew or source owner

### CUR-20260531-050 - Medium

- Check: unsupported
- Surface: docs/context/hyperagent-releases.json
- Evidence: Uncertainty markers found: unverified.
- Why it matters: Uncertain or placeholder language can be mistaken for durable context.
- Recommended action: Either source and approve the claim, or mark it as draft/unverified.
- Owner or route: Matthew or source owner

### CUR-20260531-051 - Medium

- Check: unsupported
- Surface: hyperagent/builds/build_clive_agent_factory_v2.py
- Evidence: Uncertainty markers found: placeholder, unverified.
- Why it matters: Uncertain or placeholder language can be mistaken for durable context.
- Recommended action: Either source and approve the claim, or mark it as draft/unverified.
- Owner or route: Matthew or source owner

### CUR-20260531-055 - Medium

- Check: unsupported
- Surface: hyperagent/builds/build_clive_curator_v4.py
- Evidence: Uncertainty markers found: guess, maybe, not sure, placeholder, probably, tbc, todo, unknown, unverified.
- Why it matters: Uncertain or placeholder language can be mistaken for durable context.
- Recommended action: Either source and approve the claim, or mark it as draft/unverified.
- Owner or route: Matthew or source owner

### CUR-20260531-061 - Medium

- Check: unsupported
- Surface: hyperagent/exports/agents/agent-clive-curator-v4.json
- Evidence: Uncertainty markers found: guess, maybe, not sure, placeholder, probably, tbc, todo, unknown, unverified.
- Why it matters: Uncertain or placeholder language can be mistaken for durable context.
- Recommended action: Either source and approve the claim, or mark it as draft/unverified.
- Owner or route: Matthew or source owner

### CUR-20260531-062 - Medium

- Check: unsupported
- Surface: hyperagent/exports/agents/agent-clive-intake-v1.json
- Evidence: Uncertainty markers found: placeholder.
- Why it matters: Uncertain or placeholder language can be mistaken for durable context.
- Recommended action: Either source and approve the claim, or mark it as draft/unverified.
- Owner or route: Matthew or source owner

### CUR-20260531-067 - Medium

- Check: unsupported
- Surface: hyperagent/exports/skills/skill-clive-context-curator-v4.json
- Evidence: Uncertainty markers found: guess, maybe, not sure, placeholder, probably, tbc, todo, unknown, unverified.
- Why it matters: Uncertain or placeholder language can be mistaken for durable context.
- Recommended action: Either source and approve the claim, or mark it as draft/unverified.
- Owner or route: Matthew or source owner

### CUR-20260531-068 - Medium

- Check: unsupported
- Surface: hyperagent/exports/skills/skill-clive-context-intake-slack-blocks-v1.json
- Evidence: Uncertainty markers found: placeholder.
- Why it matters: Uncertain or placeholder language can be mistaken for durable context.
- Recommended action: Either source and approve the claim, or mark it as draft/unverified.
- Owner or route: Matthew or source owner

### CUR-20260531-078 - Medium

- Check: risky
- Surface: agents/cursor/clive/curator/build-pack-v3.md
- Evidence: Scheduled context mentions `create_context_item.py`.
- Why it matters: Scheduled creation can blur audit with proposal creation.
- Recommended action: Verify scheduled mode is read-only.
- Owner or route: Curator

### CUR-20260531-083 - Medium

- Check: risky
- Surface: hyperagent/builds/build_clive_curator_v1.py
- Evidence: Scheduled context mentions `create_context_item.py`.
- Why it matters: Scheduled creation can blur audit with proposal creation.
- Recommended action: Verify scheduled mode is read-only.
- Owner or route: Curator

### CUR-20260531-086 - Medium

- Check: risky
- Surface: hyperagent/builds/build_clive_curator_v2.py
- Evidence: Scheduled context mentions `create_context_item.py`.
- Why it matters: Scheduled creation can blur audit with proposal creation.
- Recommended action: Verify scheduled mode is read-only.
- Owner or route: Curator

### CUR-20260531-089 - Medium

- Check: risky
- Surface: hyperagent/builds/build_clive_curator_v3.py
- Evidence: Scheduled context mentions `create_context_item.py`.
- Why it matters: Scheduled creation can blur audit with proposal creation.
- Recommended action: Verify scheduled mode is read-only.
- Owner or route: Curator

### CUR-20260531-092 - Medium

- Check: risky
- Surface: hyperagent/builds/build_clive_curator_v4.py
- Evidence: Scheduled context mentions `create_context_item.py`.
- Why it matters: Scheduled creation can blur audit with proposal creation.
- Recommended action: Verify scheduled mode is read-only.
- Owner or route: Curator

### CUR-20260531-097 - Medium

- Check: risky
- Surface: hyperagent/exports/agents/agent-clive-curator-v1.json
- Evidence: Scheduled context mentions `create_context_item.py`.
- Why it matters: Scheduled creation can blur audit with proposal creation.
- Recommended action: Verify scheduled mode is read-only.
- Owner or route: Curator

### CUR-20260531-100 - Medium

- Check: risky
- Surface: hyperagent/exports/agents/agent-clive-curator-v2.json
- Evidence: Scheduled context mentions `create_context_item.py`.
- Why it matters: Scheduled creation can blur audit with proposal creation.
- Recommended action: Verify scheduled mode is read-only.
- Owner or route: Curator

### CUR-20260531-103 - Medium

- Check: risky
- Surface: hyperagent/exports/agents/agent-clive-curator-v3.json
- Evidence: Scheduled context mentions `create_context_item.py`.
- Why it matters: Scheduled creation can blur audit with proposal creation.
- Recommended action: Verify scheduled mode is read-only.
- Owner or route: Curator

### CUR-20260531-106 - Medium

- Check: risky
- Surface: hyperagent/exports/agents/agent-clive-curator-v4.json
- Evidence: Scheduled context mentions `create_context_item.py`.
- Why it matters: Scheduled creation can blur audit with proposal creation.
- Recommended action: Verify scheduled mode is read-only.
- Owner or route: Curator

### CUR-20260531-111 - Medium

- Check: risky
- Surface: hyperagent/exports/skills/skill-clive-context-curator-v3.json
- Evidence: Scheduled context mentions `create_context_item.py`.
- Why it matters: Scheduled creation can blur audit with proposal creation.
- Recommended action: Verify scheduled mode is read-only.
- Owner or route: Curator

### CUR-20260531-114 - Medium

- Check: risky
- Surface: hyperagent/exports/skills/skill-clive-context-curator-v4.json
- Evidence: Scheduled context mentions `create_context_item.py`.
- Why it matters: Scheduled creation can blur audit with proposal creation.
- Recommended action: Verify scheduled mode is read-only.
- Owner or route: Curator

### CUR-20260531-010 - Low

- Check: duplicates
- Surface: hyperagent/exports/agents/agent-clive-curator-v0_1.json, hyperagent/exports/agents/agent-clive-curator-v1.json, hyperagent/exports/agents/agent-clive-curator-v2.json, hyperagent/exports/agents/agent-clive-curator-v3.json, hyperagent/exports/agents/agent-clive-curator-v4.json
- Evidence: 5 exports exist for clive-curator.
- Why it matters: Multiple exports are acceptable as history, but the live one should be obvious.
- Recommended action: Mark the current export in the build pack or archive older exports.
- Owner or route: Agent Factory

### CUR-20260531-011 - Low

- Check: stale
- Surface: .cursor/agents/clive-agent-factory.md
- Evidence: Source has authority language but no ISO review date.
- Why it matters: Authority claims need a review date so Clive can judge freshness.
- Recommended action: Add or update a Last Reviewed date.
- Owner or route: Matthew

### CUR-20260531-012 - Low

- Check: stale
- Surface: .cursor/agents/clive-context-scanner.md
- Evidence: Source has authority language but no ISO review date.
- Why it matters: Authority claims need a review date so Clive can judge freshness.
- Recommended action: Add or update a Last Reviewed date.
- Owner or route: Matthew

### CUR-20260531-013 - Low

- Check: stale
- Surface: .cursor/agents/clive-hyperagent-release-scanner.md
- Evidence: Source has authority language but no ISO review date.
- Why it matters: Authority claims need a review date so Clive can judge freshness.
- Recommended action: Add or update a Last Reviewed date.
- Owner or route: Matthew

### CUR-20260531-014 - Low

- Check: stale
- Surface: .cursor/skills/clive-agent-factory/SKILL.md
- Evidence: Source has authority language but no ISO review date.
- Why it matters: Authority claims need a review date so Clive can judge freshness.
- Recommended action: Add or update a Last Reviewed date.
- Owner or route: Matthew

### CUR-20260531-015 - Low

- Check: stale
- Surface: .cursor/skills/clive-context-curator/SKILL.md
- Evidence: Source has authority language but no ISO review date.
- Why it matters: Authority claims need a review date so Clive can judge freshness.
- Recommended action: Add or update a Last Reviewed date.
- Owner or route: Matthew

### CUR-20260531-016 - Low

- Check: stale
- Surface: .cursor/skills/clive-context-intake/SKILL.md
- Evidence: Source has authority language but no ISO review date.
- Why it matters: Authority claims need a review date so Clive can judge freshness.
- Recommended action: Add or update a Last Reviewed date.
- Owner or route: Matthew

### CUR-20260531-017 - Low

- Check: stale
- Surface: .cursor/skills/clive-hyperagent-release-scanner/SKILL.md
- Evidence: Source has authority language but no ISO review date.
- Why it matters: Authority claims need a review date so Clive can judge freshness.
- Recommended action: Add or update a Last Reviewed date.
- Owner or route: Matthew

### CUR-20260531-018 - Low

- Check: stale
- Surface: AGENTS.md
- Evidence: Source has authority language but no ISO review date.
- Why it matters: Authority claims need a review date so Clive can judge freshness.
- Recommended action: Add or update a Last Reviewed date.
- Owner or route: Matthew

### CUR-20260531-019 - Low

- Check: stale
- Surface: agents/cursor/clive/agent-factory/build-pack-v2.md
- Evidence: Source has authority language but no ISO review date.
- Why it matters: Authority claims need a review date so Clive can judge freshness.
- Recommended action: Add or update a Last Reviewed date.
- Owner or route: Matthew

### CUR-20260531-020 - Low

- Check: stale
- Surface: clive_context_architecture_v2.md
- Evidence: Source has authority language but no ISO review date.
- Why it matters: Authority claims need a review date so Clive can judge freshness.
- Recommended action: Add or update a Last Reviewed date.
- Owner or route: Matthew

### CUR-20260531-021 - Low

- Check: stale
- Surface: docs/context/human-approval-path.md
- Evidence: Source has authority language but no ISO review date.
- Why it matters: Authority claims need a review date so Clive can judge freshness.
- Recommended action: Add or update a Last Reviewed date.
- Owner or route: Matthew

### CUR-20260531-022 - Low

- Check: stale
- Surface: hyperagent/builds/build_clive_agent_factory_v2.py
- Evidence: Source has authority language but no ISO review date.
- Why it matters: Authority claims need a review date so Clive can judge freshness.
- Recommended action: Add or update a Last Reviewed date.
- Owner or route: Matthew

### CUR-20260531-023 - Low

- Check: stale
- Surface: hyperagent/builds/build_clive_curator_v0_1.py
- Evidence: Source has authority language but no ISO review date.
- Why it matters: Authority claims need a review date so Clive can judge freshness.
- Recommended action: Add or update a Last Reviewed date.
- Owner or route: Matthew

### CUR-20260531-024 - Low

- Check: stale
- Surface: hyperagent/builds/build_clive_curator_v1.py
- Evidence: Source has authority language but no ISO review date.
- Why it matters: Authority claims need a review date so Clive can judge freshness.
- Recommended action: Add or update a Last Reviewed date.
- Owner or route: Matthew

### CUR-20260531-025 - Low

- Check: stale
- Surface: hyperagent/context_architecture_schema_v1.json
- Evidence: Source has authority language but no ISO review date.
- Why it matters: Authority claims need a review date so Clive can judge freshness.
- Recommended action: Add or update a Last Reviewed date.
- Owner or route: Matthew

### CUR-20260531-026 - Low

- Check: stale
- Surface: hyperagent/exports/agents/agent-clive-curator-v0_1.json
- Evidence: Source has authority language but no ISO review date.
- Why it matters: Authority claims need a review date so Clive can judge freshness.
- Recommended action: Add or update a Last Reviewed date.
- Owner or route: Matthew

### CUR-20260531-027 - Low

- Check: stale
- Surface: hyperagent/exports/agents/agent-clive-curator-v1.json
- Evidence: Source has authority language but no ISO review date.
- Why it matters: Authority claims need a review date so Clive can judge freshness.
- Recommended action: Add or update a Last Reviewed date.
- Owner or route: Matthew

### CUR-20260531-028 - Low

- Check: stale
- Surface: hyperagent/exports/agents/agent-clive-curator-v2.json
- Evidence: Source has authority language but no ISO review date.
- Why it matters: Authority claims need a review date so Clive can judge freshness.
- Recommended action: Add or update a Last Reviewed date.
- Owner or route: Matthew

### CUR-20260531-029 - Low

- Check: stale
- Surface: hyperagent/exports/agents/agent-clive-curator-v3.json
- Evidence: Source has authority language but no ISO review date.
- Why it matters: Authority claims need a review date so Clive can judge freshness.
- Recommended action: Add or update a Last Reviewed date.
- Owner or route: Matthew

### CUR-20260531-030 - Low

- Check: stale
- Surface: hyperagent/exports/agents/agent-clive-intake-v1.json
- Evidence: Source has authority language but no ISO review date.
- Why it matters: Authority claims need a review date so Clive can judge freshness.
- Recommended action: Add or update a Last Reviewed date.
- Owner or route: Matthew

### CUR-20260531-031 - Low

- Check: stale
- Surface: hyperagent/exports/skills/skill-clive-context-curator-v0_1.json
- Evidence: Source has authority language but no ISO review date.
- Why it matters: Authority claims need a review date so Clive can judge freshness.
- Recommended action: Add or update a Last Reviewed date.
- Owner or route: Matthew

### CUR-20260531-032 - Low

- Check: stale
- Surface: hyperagent/exports/skills/skill-clive-context-curator-v1.json
- Evidence: Source has authority language but no ISO review date.
- Why it matters: Authority claims need a review date so Clive can judge freshness.
- Recommended action: Add or update a Last Reviewed date.
- Owner or route: Matthew

### CUR-20260531-033 - Low

- Check: stale
- Surface: hyperagent/exports/skills/skill-clive-context-curator-v2.json
- Evidence: Source has authority language but no ISO review date.
- Why it matters: Authority claims need a review date so Clive can judge freshness.
- Recommended action: Add or update a Last Reviewed date.
- Owner or route: Matthew

### CUR-20260531-034 - Low

- Check: stale
- Surface: hyperagent/exports/skills/skill-clive-context-curator-v3.json
- Evidence: Source has authority language but no ISO review date.
- Why it matters: Authority claims need a review date so Clive can judge freshness.
- Recommended action: Add or update a Last Reviewed date.
- Owner or route: Matthew

### CUR-20260531-035 - Low

- Check: stale
- Surface: hyperagent/exports/skills/skill-clive-context-curator-v4.json
- Evidence: Source has authority language but no ISO review date.
- Why it matters: Authority claims need a review date so Clive can judge freshness.
- Recommended action: Add or update a Last Reviewed date.
- Owner or route: Matthew

### CUR-20260531-036 - Low

- Check: stale
- Surface: hyperagent/exports/skills/skill-clive-context-intake-v1.json
- Evidence: Source has authority language but no ISO review date.
- Why it matters: Authority claims need a review date so Clive can judge freshness.
- Recommended action: Add or update a Last Reviewed date.
- Owner or route: Matthew

### CUR-20260531-037 - Low

- Check: stale
- Surface: Context Items/recPQzHHxvayexRre
- Evidence: Source has authority language but no ISO review date.
- Why it matters: Authority claims need a review date so Clive can judge freshness.
- Recommended action: Add or update a Last Reviewed date.
- Owner or route: Matthew

### CUR-20260531-038 - Low

- Check: stale
- Surface: Context Items/recJabWSwJbZASaCq
- Evidence: Source has authority language but no ISO review date.
- Why it matters: Authority claims need a review date so Clive can judge freshness.
- Recommended action: Add or update a Last Reviewed date.
- Owner or route: Matthew

### CUR-20260531-048 - Low

- Check: unsupported
- Surface: agents/cursor/clive/curator/build-pack-v2.md
- Evidence: Uncertainty markers found: unknown.
- Why it matters: Uncertain or placeholder language can be mistaken for durable context.
- Recommended action: Either source and approve the claim, or mark it as draft/unverified.
- Owner or route: Matthew or source owner

### CUR-20260531-052 - Low

- Check: unsupported
- Surface: hyperagent/builds/build_clive_curator_v0_1.py
- Evidence: Uncertainty markers found: unknown.
- Why it matters: Uncertain or placeholder language can be mistaken for durable context.
- Recommended action: Either source and approve the claim, or mark it as draft/unverified.
- Owner or route: Matthew or source owner

### CUR-20260531-053 - Low

- Check: unsupported
- Surface: hyperagent/builds/build_clive_curator_v1.py
- Evidence: Uncertainty markers found: unknown.
- Why it matters: Uncertain or placeholder language can be mistaken for durable context.
- Recommended action: Either source and approve the claim, or mark it as draft/unverified.
- Owner or route: Matthew or source owner

### CUR-20260531-054 - Low

- Check: unsupported
- Surface: hyperagent/builds/build_clive_curator_v3.py
- Evidence: Uncertainty markers found: unknown.
- Why it matters: Uncertain or placeholder language can be mistaken for durable context.
- Recommended action: Either source and approve the claim, or mark it as draft/unverified.
- Owner or route: Matthew or source owner

### CUR-20260531-056 - Low

- Check: unsupported
- Surface: hyperagent/context_architecture_schema_v1.json
- Evidence: Uncertainty markers found: unknown.
- Why it matters: Uncertain or placeholder language can be mistaken for durable context.
- Recommended action: Either source and approve the claim, or mark it as draft/unverified.
- Owner or route: Matthew or source owner

### CUR-20260531-057 - Low

- Check: unsupported
- Surface: hyperagent/exports/agents/agent-clive-curator-v0_1.json
- Evidence: Uncertainty markers found: unknown.
- Why it matters: Uncertain or placeholder language can be mistaken for durable context.
- Recommended action: Either source and approve the claim, or mark it as draft/unverified.
- Owner or route: Matthew or source owner

### CUR-20260531-058 - Low

- Check: unsupported
- Surface: hyperagent/exports/agents/agent-clive-curator-v1.json
- Evidence: Uncertainty markers found: unknown.
- Why it matters: Uncertain or placeholder language can be mistaken for durable context.
- Recommended action: Either source and approve the claim, or mark it as draft/unverified.
- Owner or route: Matthew or source owner

### CUR-20260531-059 - Low

- Check: unsupported
- Surface: hyperagent/exports/agents/agent-clive-curator-v2.json
- Evidence: Uncertainty markers found: unknown.
- Why it matters: Uncertain or placeholder language can be mistaken for durable context.
- Recommended action: Either source and approve the claim, or mark it as draft/unverified.
- Owner or route: Matthew or source owner

### CUR-20260531-060 - Low

- Check: unsupported
- Surface: hyperagent/exports/agents/agent-clive-curator-v3.json
- Evidence: Uncertainty markers found: unknown.
- Why it matters: Uncertain or placeholder language can be mistaken for durable context.
- Recommended action: Either source and approve the claim, or mark it as draft/unverified.
- Owner or route: Matthew or source owner

### CUR-20260531-063 - Low

- Check: unsupported
- Surface: hyperagent/exports/skills/skill-clive-context-curator-v0_1.json
- Evidence: Uncertainty markers found: unknown.
- Why it matters: Uncertain or placeholder language can be mistaken for durable context.
- Recommended action: Either source and approve the claim, or mark it as draft/unverified.
- Owner or route: Matthew or source owner

### CUR-20260531-064 - Low

- Check: unsupported
- Surface: hyperagent/exports/skills/skill-clive-context-curator-v1.json
- Evidence: Uncertainty markers found: unknown.
- Why it matters: Uncertain or placeholder language can be mistaken for durable context.
- Recommended action: Either source and approve the claim, or mark it as draft/unverified.
- Owner or route: Matthew or source owner

### CUR-20260531-065 - Low

- Check: unsupported
- Surface: hyperagent/exports/skills/skill-clive-context-curator-v2.json
- Evidence: Uncertainty markers found: unknown.
- Why it matters: Uncertain or placeholder language can be mistaken for durable context.
- Recommended action: Either source and approve the claim, or mark it as draft/unverified.
- Owner or route: Matthew or source owner

### CUR-20260531-066 - Low

- Check: unsupported
- Surface: hyperagent/exports/skills/skill-clive-context-curator-v3.json
- Evidence: Uncertainty markers found: unknown.
- Why it matters: Uncertain or placeholder language can be mistaken for durable context.
- Recommended action: Either source and approve the claim, or mark it as draft/unverified.
- Owner or route: Matthew or source owner

### CUR-20260531-069 - Low

- Check: unsupported
- Surface: Context Items/recUJaurBEHabB9DX
- Evidence: Approved Context Item text does not include an obvious source marker.
- Why it matters: Approved context should carry enough source trail for later audits.
- Recommended action: Add source notes or provenance.
- Owner or route: Matthew

### CUR-20260531-070 - Low

- Check: unsupported
- Surface: Context Items/recPQzHHxvayexRre
- Evidence: Approved Context Item text does not include an obvious source marker.
- Why it matters: Approved context should carry enough source trail for later audits.
- Recommended action: Add source notes or provenance.
- Owner or route: Matthew

### CUR-20260531-071 - Low

- Check: unsupported
- Surface: Context Items/recJabWSwJbZASaCq
- Evidence: Approved Context Item text does not include an obvious source marker.
- Why it matters: Approved context should carry enough source trail for later audits.
- Recommended action: Add source notes or provenance.
- Owner or route: Matthew

### CUR-20260531-072 - Low

- Check: unsupported
- Surface: Context Items/recuOM7itdyK3LBhS
- Evidence: Approved Context Item text does not include an obvious source marker.
- Why it matters: Approved context should carry enough source trail for later audits.
- Recommended action: Add source notes or provenance.
- Owner or route: Matthew

### CUR-20260531-073 - Low

- Check: unsupported
- Surface: Context Items/recoWcmc9fSwMwmDL
- Evidence: Approved Context Item text does not include an obvious source marker.
- Why it matters: Approved context should carry enough source trail for later audits.
- Recommended action: Add source notes or provenance.
- Owner or route: Matthew

### CUR-20260531-074 - Low

- Check: unsupported
- Surface: Context Items/rec4E2xltxXeCsicl
- Evidence: Approved Context Item text does not include an obvious source marker.
- Why it matters: Approved context should carry enough source trail for later audits.
- Recommended action: Add source notes or provenance.
- Owner or route: Matthew

### CUR-20260531-075 - Low

- Check: unsupported
- Surface: Context Items/reckhCIz5AFhFhag4
- Evidence: Approved Context Item text does not include an obvious source marker.
- Why it matters: Approved context should carry enough source trail for later audits.
- Recommended action: Add source notes or provenance.
- Owner or route: Matthew

### CUR-20260531-076 - Low

- Check: unsupported
- Surface: Context Items/recvWCNlwxlwqrQ0i
- Evidence: Approved Context Item text does not include an obvious source marker.
- Why it matters: Approved context should carry enough source trail for later audits.
- Recommended action: Add source notes or provenance.
- Owner or route: Matthew

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
