# Doc's Vercel Minion v0.1 — Build Pack

**Platform:** Cursor (subagent)  
**Family:** doc (minion)  
**Risk tier:** Medium  
**Owner:** Matthew  
**Created:** 24 June 2026  
**Registry:** `agents/registry/cursor/doc/vercel-minion/`

## Roster decision

**BUILD NEW** — complements Airtable Minion; no existing agent owns `website/` Vercel builds.

Axes: Platform Cursor ✓ | Channel Cursor chat ✓ | Audience Matthew/TL ✓ |
Trigger @ invoke ✓ | Scope `website/` Next.js/Vercel ✓ | Persona Doc minion ✓

## Purpose

Implement approved Vercel/Next.js work in `website/` after Doc (Opus) proposes
and Matthew approves. Composer/Cursor execution lane — not HyperAgent runtime.

## Model split

| Layer | Model / runtime |
|-------|-----------------|
| Doc (reasoning, brief, route) | Opus 4.8 (production instinct in architecture.md) |
| Vercel Minion (build) | Composer / Cursor Agent mode |

## Runtime artifacts

| Artifact | Path |
|----------|------|
| Cursor subagent | `.cursor/agents/doc-vercel-minion.md` |
| Cursor skill | `.cursor/skills/doc-vercel-minion/SKILL.md` |
| Family spec | `docs/initiatives/doc-minions.md` |
| Build pack | `agents/registry/cursor/doc/vercel-minion/build-pack-v0.1.md` |

## Invoke

```text
@doc-vercel-minion
Phase A: propose the /aie-demo route skeleton per aie-build-plan.md.
```

Then Agent mode: `approved — build it`.

## Self red-team (Medium)

| Check | Result |
|-------|--------|
| Strongest part | Clear split from Airtable minion; reuses Vercel plugin skills |
| Weakest assumption | Demo scope creep under time pressure |
| Safe for v0.1? | Yes — Matthew-only, two-phase approval |

## Forbidden

- Commit/push without explicit ask
- Production promote without explicit ask
- Airtable MCP builds (Airtable Minion)
- HyperAgent deploy
