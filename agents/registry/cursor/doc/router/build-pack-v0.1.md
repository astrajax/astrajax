# Doc Albright (router) v0.1 — Build Pack

**Platform:** Cursor (subagent)  
**Family:** doc (parent dispatcher)  
**Risk tier:** Medium (delegates to minions)  
**Owner:** Matthew  
**Created:** 24 June 2026  
**Registry:** `agents/registry/cursor/doc/router/`

## Roster decision

**BUILD NEW** — parent entry point; minions remain direct-invokable.

## Purpose

Single **`@doc`** invoke. Doc triages, names the minion, runs Phase A/B through
that minion's skill. Opus-class reasoning for routing; Composer for Phase B build.

## Child minions

| Minion | Slug | Skill |
|--------|------|-------|
| Doc Brain Base Builder | `doc-brain-base-builder` | `doc-brain-base-builder` |
| Vercel Minion | `doc-vercel-minion` | `doc-vercel-minion` |

## Invoke

```text
@doc
I need the AIE demo route in website/.
```

Doc responds with routing block + Phase A plan.

## Artifacts

| Artifact | Path |
|----------|------|
| Cursor subagent | `.cursor/agents/doc.md` |
| Cursor skill | `.cursor/skills/doc/SKILL.md` |
| Family spec | `docs/initiatives/doc-minions.md` |
