# Doc family — Cursor-native

Doc Albright is the **dispatcher** Matthew talks to first for repo, MCP, and
Composer build work. He triages the job, names the minion, and that minion
builds. Matthew invokes `@doc` only; the minions below are direct-entry
shortcuts, not the front door.

## Minions and build packs

| Agent | Slug | Registry | Runtime |
|---|---|---|---|
| Doc Albright (router) | `doc` | `doc/router/` | `.cursor/agents/doc.md` |
| Brain Base Builder | `doc-brain-base-builder` | `doc/doc-brain-base-builder/` | `.cursor/agents/doc-brain-base-builder.md` |
| Vercel Minion | `doc-vercel-minion` | `doc/vercel-minion/` | `.cursor/agents/doc-vercel-minion.md` |
| Workshop Proposer | `doc-workshop-proposer` | `doc/workshop-proposer/` | `.cursor/agents/doc-workshop-proposer.md` |
| Workshop Challenger | `doc-workshop-challenger` | `doc/workshop-challenger/` | `.cursor/agents/doc-workshop-challenger.md` |
| Workshop Cursor Builder | `doc-workshop-cursor` | `doc/workshop-cursor/` | `.cursor/agents/doc-workshop-cursor.md` |
| Workshop Hyperagent Builder | `doc-workshop-hyperagent` | `doc/workshop-hyperagent/` | `.cursor/agents/doc-workshop-hyperagent.md` |

`doc/agent-factory/` is the retired name for the Workshop Proposer lane — see the
pointer README in that folder.

## Automations

Not `@` agents. Each is a Cursor Automation whose prompt is a short pointer at a
runbook in this registry, so the long instructions live at HEAD of `main` and can
be edited without re-authoring the automation.

| Automation | Slug | Registry | Runtime |
|---|---|---|---|
| Pull-request review | `pr-review` | `doc/pr-review/` | Cursor automation **Review pull requests** — URL pending until Matthew creates it. Follow `runbook.md`. |

The pull-request review runs the `@doc` lane in **Phase A only**: it reads the
diff, runs `npx tsc --noEmit` and the vitest scripts covering the changed paths
when `website/` changed, and leaves one comment. It never edits the branch,
approves, merges, or deploys.

Paper trail after a merge is a different question and a different lane — see
`agents/registry/cursor/clive/merged-pr-paper-trail/`.

Add new Doc-family artifacts under `agents/registry/cursor/doc/<name>/`.
