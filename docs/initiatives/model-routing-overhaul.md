# Model Routing Overhaul - Draft Handoff

**Status:** draft context / Doc execution handoff. Do not promote to canonical without Matthew.  
**Owner:** Matthew.  
**Captured:** 2026-08-10.  
**Read with:** `.cursor/rules/model-routing.mdc`, `.cursor/rules/agent-dispatch.mdc`, [`doc-minions.md`](./doc-minions.md), [`docs/business/architecture.md`](../business/architecture.md) section 9, [`docs/context/model-collaboration.md`](../context/model-collaboration.md).

---

## Approval Context

Matthew approved a household-wide model-routing overhaul plus Pam's V2 revision suggestions after a Clive decision thread and a Pam challenge pass.

The operating context was Matthew moving AstraJax from HyperAgent to Cursor for website vibecoding, upgrading to Cursor Ultra, and reserving roughly `$10k` of HyperAgent inference credits for test users.

## Doctrine Decided

Cursor bills from two pools, and that fact now drives the design:

| Pool | Models | Operating meaning |
|------|--------|-------------------|
| First-party pool | Grok 4.5, Composer 2.5, Auto | Subsidised, generous. Use for build and grind work. |
| Frontier / "Other Models" pool | GPT Sol, Claude Opus 5, Sonnet 5, Kimi K3 | Metered. Reserve for judgement. |

Observed problem: Matthew repeatedly emptied the frontier pool while leaving first-party unused.

Root cause: build agents pinned `model: inherit` stayed on frontier when dispatched by a frontier parent, and several pins referenced dead Cursor slugs: `gpt-5.5-high`, `claude-opus-4-8-thinking`, and `kimi-k2.5`.

The adopted split:

| Tier | Model lane | Pool | Work |
|------|------------|------|------|
| Think | `gpt-5.6-sol-xhigh` | Frontier | Strategy and trade-offs. |
| Challenge / taste | `claude-opus-5-thinking-high`; `claude-sonnet-5-thinking-xhigh` for structured verification | Frontier | Red-team, craft judgement, Doc Phase A. |
| Build | `cursor-grok-4.5-high-fast` | First-party | Website vibecoding, scenic craft, MCP schema. |
| Grind | `composer-2.5-fast` | First-party | Automations, Trinity executors, repetitive edits. |

The OpenAI / Anthropic family split is deliberate: OpenAI reasons, Anthropic challenges. Matthew considered Claude Fable 5 for Pam and chose Opus 5 instead. Fable is also not available to Cursor subagents.

## Kimi K3 Runtime Finding

Kimi K3 economics depend on the runtime.

On HyperAgent, K3 at low effort with high cache-hit rates is cheap hands. Ruth's executors are correctly pinned to `moonshotai/kimi-k3` with effort `low` there.

In Cursor, K3 draws from the frontier pool, so it is escalation only after Grok fails the same task twice. Cursor twins of HyperAgent agents should mirror the doctrine, not the slug.

## Repo Changes Already Made

`.cursor/agents/` received 17 model-pin changes:

| Lane | Model | Agents |
|------|-------|--------|
| Think | `gpt-5.6-sol-xhigh` | `clive`, `clive-man`, `ruth-hadley`, `doc-workshop-proposer` |
| Challenge / taste | `claude-opus-5-thinking-high` | `pam`, `doc`, `kathryn-goodchild`, `lazlo-marlowe`, `doc-workshop-challenger` |
| Structured verification | `claude-sonnet-5-thinking-xhigh` | `ruth-build-challenger`, `ruth-maintenance-challenger` |
| Build | `cursor-grok-4.5-high-fast` | `doc-vercel-minion`, `kate`, `doc-brain-base-builder` |
| Grind | `composer-2.5-fast` | `ruth-build-executor`, `ruth-maintenance-executor`, `lazlo-marlowe-proposer` |

`.cursor/agents/pam.md` was upgraded from v0.1 to v0.3:

- Added the two-mode contract: embedded flow by default, Court Mode only by explicit summons.
- Corrected the Persona Config pointer from `Operational v0.2` / `rect3MIejCMhCWdH1` to `Operational v0.3` / `recKn1Z7AGUXQ0TTh`.
- Added `fleet-activity-logging` to required skills.
- Replaced the superseded Triggers section.
- Kept the Clive's Man paper-trail section, which the HyperAgent export lacks.

`.cursor/rules/model-routing.mdc` was rewritten with:

- The two-pool distinction.
- The four-tier split.
- The current pin map.
- The K3 runtime note.
- The load-bearing rule: "Frontier heads never perform mechanical edits."

`.cursor/rules/agent-dispatch.mdc` was added. It routes Matthew's un-`@`'d messages to the right household agent via Task and asks only when genuinely torn between two lanes.

Prose was corrected to match pins in:

- `.cursor/agents/doc.md`
- `.cursor/agents/doc-vercel-minion.md`
- `.cursor/agents/kate.md`
- `.claude/skills/doc/SKILL.md`
- `.claude/skills/doc-brain-base-builder/SKILL.md`
- `.cursor/skills/clive-man/SKILL.md`
- `.cursor/skills/doc-workshop-proposer/SKILL.md`
- `.cursor/skills/doc-workshop-challenger/SKILL.md`
- `.cursor/skills/lazlo-marlowe/SKILL.md`

## Decisions And Findings To Preserve

### Version Drift

Pam's V2 item 3 was partially applied.

Cursor agent files say "Repo sync until the generator emits from Airtable," but there is no generator, sync check, or staleness alarm. Pam's Cursor file was two versions behind her HyperAgent twin, and the drift was only discovered because Matthew happened to open it. Ruth's five files showed the same pattern.

A `Sync state` header convention was added to `pam.md` only. It records the mirrored export version and date and states that Persona Config wins on conflict. The other fifteen agents do not have this header yet.

### Open Governance Question

Not resolved: HyperAgent Pam's `allowedIntegrations` is `["airtable","github","gmail"]`, while her governed-defaults paragraph in the same export says `["airtable"]` and describes a "minimum viable read-only posture."

Agent permissions are Red tier. This was flagged and not touched.

### Duplicate Cursor Agent Files

Not done deliberately: eight duplicate `* 2.md` files in `.cursor/agents/` are gitignored, so deletion would not be git-recoverable. They were left in place pending Matthew's explicit yes.

They are the likely cause of Matthew's `@` picker being hard to navigate.

### Deferred Household Health Work

Deferred to Halvard: run a version audit of the remaining fifteen Cursor agents against their HyperAgent exports.

Discovery so far happened by coincidence twice in one session, which is itself the signal.

### Airtable Source-Of-Truth Direction

Matthew noted AstraJax is getting very close to Airtable being the only source of truth, but explicitly not yet.

The `Sync state` header was written so it does not fight a future Airtable generator.

## Candidate Sources For Clive's Man

These sources likely need later updates if Matthew chooses to promote this doctrine:

- `docs/business/architecture.md` section 9 currently describes an "Opus -> Composer" two-tier routing model. The four-tier pool-aware split supersedes it.
- `docs/context/model-collaboration.md` still lists GPT-5.5 / Opus 4.7 / Composer 2.5 / Gemini 3.5 Flash roles.
- `docs/initiatives/doc-minions.md` has a Doc's Workshop minion model column that still lists `gpt-5.5-high`.

The `.cursor/` and `.claude/` agent and skill files listed above were already updated by this build.
