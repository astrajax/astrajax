# Doc's Airtable Minion v0.1 — Build Pack

**Platform:** Cursor (subagent)  
**Family:** doc (minion)  
**Risk tier:** Medium  
**Owner:** Matthew  
**Created:** 24 June 2026  
**Renamed:** 24 June 2026 — `doc-airtable-builder` → `doc-airtable-minion`  
**Registry:** `agents/registry/cursor/doc/airtable-minion/`

## Roster decision

**BUILD NEW** — no existing agent covers Airtable base scaffolding under Doc's lane.

Axes summary: Platform Cursor ✓ | Channel Cursor chat ✓ | Audience Matthew/TL ✓ |
Trigger @ invoke / build brief ✓ | Scope Airtable MCP structure ✓ | Persona Doc minion ✓

Closest matches: none. Composes imported Airtable skills; does not duplicate Clive
Intake or Doc's Workshop.

## Purpose (one line)

Scaffold and extend Airtable bases (brain homes or Matthew's ops bases) from a
plain-language brief, under two-phase human approval, via MCP.

## Runtime artifacts

| Artifact | Path |
|----------|------|
| Cursor subagent | `.cursor/agents/doc-airtable-minion.md` |
| Cursor skill | `.cursor/skills/doc-airtable-minion/SKILL.md` |
| Build pack | `agents/registry/cursor/doc/airtable-minion/build-pack-v0.1.md` |

No HyperAgent export (Cursor-native build tool only).

## Invoke

Primary: `@doc` (Doc routes to Airtable Minion).

Direct:

```text
@doc-airtable-minion
Propose a Trusted Brain base for [theme] — schema only, Phase A.
```

Phase B: switch to **Agent mode**, then `approved — build it`.

## Context from design thread

- Track A: Airtable's open-source skills imported to `.cursor/skills/` (overview,
  filters, show-airtable-link, agent-activity-log, product/sales/marketing-ops).
- Track B: this minion wraps governed brain builds + composes those skills for
  Matthew's workbench.
- Chapter 1 four-base model **Phase B complete** (25 Jun 2026); IDs in
  `website/src/lib/brains/airtable-ids.ts`. Status runbook:
  `docs/initiatives/brain-base-builder-agent.md`.
- Client-facing Vercel + Claude interface is **out of scope** for v0.1 (post-AIE).

## Positioning guardrail

Not an Airtable build shop. Mode 1 = governed brain shapes only. Mode 2 =
Matthew's internal speed tool, not a client deliverable.

## Self red-team (Medium tier)

| Check | Result |
|-------|--------|
| Strongest part | Reuses Airtable-authored MCP skills; two-phase approval; clear Doc lane |
| Weakest assumption | Generic ops mode could drift into "build shop" framing if prompts are loose |
| Missing evidence | No evals yet; first real builds will surface MCP edge cases |
| Rabbit-hole risk | Over-scoping schema before AIE; keep brain builds minimal until needed |
| Safe to ship v0.1? | Yes for Matthew-only Cursor use |

## Forbidden (v0.1)

- Commit, push, HyperAgent deploy
- Approve context or Brain Key grants
- Client multi-tenant / billing (Phase 2)
- Destructive MCP without explicit confirm

## Next versions (not v0.1)

- v0.2: evals for Phase A proposal quality and Phase B ID handoff
- Phase 2 (High): Vercel route + Opus red-team + per-client credential scoping
