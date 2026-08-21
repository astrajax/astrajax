# Cursor-native agents

Agents whose **production runtime is Cursor** - invoked as subagents in the IDE.

| Agent | Slug | Registry | Runtime |
|---|---|---|---|
| Clive Wigglesworth | `clive` | `clive/clive/` | `.cursor/agents/clive.md` |
| Pam Portiscue | `pam` | `clive/pam/` | `.cursor/agents/pam.md` |
| Clive's Man | `clive-man` | `clive/clive-man/` | `.cursor/agents/clive-man.md` |
| Clive's Man Proposer | `clive-man-proposer` | `clive/clive-man/` | `.cursor/agents/clive-man-proposer.md` |
| Clive's Man Challenger | `clive-man-challenger` | `clive/clive-man/` | `.cursor/agents/clive-man-challenger.md` |
| Clive's Man Executor | `clive-man-executor` | `clive/clive-man/` | `.cursor/agents/clive-man-executor.md` |
| Hyperagent Release Scanner | `clive-hyperagent-release-scanner` | `clive/hyperagent-release-scanner/` | `.cursor/agents/clive-hyperagent-release-scanner.md` |
| Daily change summary (Cursor automation) | `summarize-changes-daily` | `clive/daily-change-summary/` | Cursor automation [Summarize changes daily](https://cursor.com/automations/3d8feb77-8e64-11f1-a7d1-d6b4613131ce) — not an `@` agent. Follow `runbook.md`. |
| Clive's weekly report reading (Cursor automation) | `clive-report-reading-weekly` | `clive/report-reading-weekly/` | Weekly Cursor automation — not an `@` agent. Writes one field, Clive's Reading, on Household Activity Reports. Follow `runbook.md`. |
| Merged-PR paper-trail guard (Cursor automation) | `merged-pr-paper-trail` | `clive/merged-pr-paper-trail/` | Cursor automation **Check merged-PR paper trail** — URL pending until Matthew creates it. Not an `@` agent. Follow `runbook.md`. |

Clive is the visible reasoning partner. **Pam** is the challenger who stress-tests
assumptions before action gates and does not decide. **Clive's Man** is the same person as **The Man**
in Clive's character canon — partner, study keeper, and brain steward (`@clive-man`).
He is a full cast member, not an offstage device. He replaces the old active Clive
context lane (Intake, Curator, Publisher, Context Scanner). Their logic now lives
as workflows inside `clive-man`; their active artifacts are archived so the roster
has one context upkeep route.

Two Clive's Man **automations** sit alongside him and are not `@` agents. The
daily change summary is the cadence digest — it files one handoff report a day
whether or not anything is wrong. The merged-PR paper-trail guard is the alarm —
it runs on every merge to `main` and files a report **only** when durable work
shipped without a Clive's Man handoff. Silence from the guard is the healthy
outcome; the two do not overlap.

Add new Cursor-native agents under `agents/registry/cursor/<family>/<name>/`.
