# Doc Brain Base Builder — Agent Plan

**Status:** Track A done (Airtable skills imported). Track B v0.1 **shipped** — `@doc-brain-base-builder` (via `@doc`). Chapter 1 **four-base model Phase B complete** (25 Jun 2026): Registry Agents table, Trusted Brain Memories, four Agent bases seeded, `airtable-ids.ts` updated. **26 Jun 2026:** Brain Interactions review fields live; Clive Agent tier scaffold live (`CLIVE_NARRATIVE_ARCH_TIER_FIELDS` in `airtable-ids.ts`); legacy Trusted Personas table removed in Airtable UI. **26 Jun 2026:** renamed from `doc-airtable-minion` / Brain Base Builder → **`doc-brain-base-builder`**. Registry: `agents/registry/cursor/doc/doc-brain-base-builder/build-pack-v0.1.md`.
**Owner:** Matthew.
**Character name:** **Doc Brain Base Builder** (`doc-brain-base-builder`).
**Read with (canonical trio):** [`brain-key-schema.md`](./brain-key-schema.md) (field shapes — source of truth for tables/fields), [`brain-key-wiring.md`](./brain-key-wiring.md) (access model + credentials), [`architecture.md`](../business/architecture.md) (governance + Doc routing). Sprint scope: [`aie-2026-07.md`](./aie-2026-07.md). Minion family: [`doc-minions.md`](./doc-minions.md).
**Front door:** [`docs/START-HERE.md`](../START-HERE.md).

---

## 1. What this agent is (one line)

> **An agent that scaffolds and evolves the Airtable bases a Brain and its agents live in — Registry, Workshop, Trusted Brains, and Agent bases — from a plain-language brief, under human approval.**

It is the part of **Doc** that builds the *physical home* for a brain: tables, typed fields, linked records, the Brain Key governance tables. It does not decide what context is true, does not approve, and does not deploy runtime agents.

The Registry, Workshop, Trusted Chapter 1, and four Chapter 1 Agent bases were first scaffolded via MCP (24–25 Jun 2026). **Doc Brain Base Builder** turns that one-off into a repeatable, governed, audited build — same shapes, same handoff, every time.

---

## 1a. Two tracks (don't confuse them)

The "Airtable build agent" idea splits cleanly. Both are valid; only one touches the guardrail.

- **Track A — Matthew's own workbench (done).** Matthew still builds a lot directly on Airtable (DS platform, AstraJax's own bases). Airtable's open-source skill pack is authored *by Airtable* and ships in the exact `SKILL.md` format Cursor uses, so it imports as-is and rides the Airtable MCP already wired here. Imported into `.cursor/skills/` on 24 Jun: `airtable-overview`, `airtable-filters`, `show-airtable-link`, `agent-activity-log`, `product-ops`, `sales-ops`, `marketing-ops` (skipped `airtable-cli` — it assumes the `@airtable/mcp-cli` npm tool). These are **Doc-family build skills** (Doc acts/builds; Clive reasons), kept under their original names so the skills' cross-references stay intact, with Airtable authorship preserved in frontmatter. The build-shop guardrail does **not** apply here — this is tooling Matthew uses, not the product.
- **Track B — Doc Brain Base Builder (this plan).** The client-facing capability that scaffolds governed brains under the Brain Key model. This is where §2 and the governance below apply.

The one watch-item linking them: Track A skills are generic base-building helpers. Use them freely for your own speed; do not let "I imported Airtable's generic skills" quietly become "this is the AstraJax offering."

## 2. The positioning guardrail (read this before building Track B)

AstraJax is explicitly **not an Airtable build shop** (positioning §13, internal-brief §3, AIE brain §3). An agent literally called an "Airtable build agent" is the most drift-prone thing in the fleet. The plan stays on-thesis only if:

- It builds **governed brains** (context homes with the Brain Key model baked in), not generic bases-for-hire.
- It is **bounded to the AstraJax brain schema** — Registry / Workshop / Trusted Brain / **Agent** shapes — not "describe any base and I'll build it."
- Client-facing use (Phase 2) scaffolds **a client's brain inside the AstraJax governance model**, not "we'll build your Airtable for you."

If the scope ever creeps toward "scaffold arbitrary Airtable bases for arbitrary workflows," it has become the thing we said we are not. That is the line to watch.

---

## 3. Where it fits the existing model

```text
Clive reasons -> Pam challenges -> Human approves -> Doc acts -> Composer/Cursor builds (Airtable/code)
                                                                 -> HyperAgent runs deployed agents (fleet)
```

This agent is **inside Doc's build lane** — invoked in Cursor (Composer/Agent mode) after Matthew approves the proposed schema. It is not a HyperAgent runtime agent.

It is **not** the demo, and **not** a runtime agent. It is build-side tooling: it stands up the substrate that the Brain Key API routes (`website/src/app/api/brains/`) then read and write through.

---

## 4. Two phases

### Phase 1 — Now: founder build tool for AIE (Cursor-native)

**Goal:** let Matthew stand up and evolve the real brain bases quickly and consistently, without hand-clicking Airtable, so the Chapter‑1 wiring has a clean, governed home.

- **Runtime:** Cursor subagent (the build lane), using the Airtable MCP server already wired in this workspace (`project-0-AstraJax-airtable`).
- **Audience:** Matthew (and TL) only.
- **Scope of writes:** create/extend tables and fields in the AstraJax brain and agent bases; seed structural records (e.g. a new Brain row or Agents row in the Registry). Bounded to the **four** base shapes.
- **What it does for AIE specifically:** when a new Trusted Brain theme or Agent base is needed (one base per theme / per agent, per `brain-key-wiring.md`), it scaffolds that base to the canonical shape and registers it — minutes, not manual clicking.

**Important AIE boundary:** this agent is **not part of the recordable demo**. The sprint do-not-build list bans real Airtable writes *in the demo route* — that still holds. This tool operates on the production backbone, off-camera, to support the build. Keep them separate.

### Phase 2 — Later: client-facing, inside Vercel, through a Claude interface

**Goal:** a domain expert describes their brain in plain language through a Claude-powered interface in the Vercel app; the agent scaffolds their Workshop + Trusted Brain bases under the Brain Key governance and human approval.

- **Runtime:** Vercel server route (not the browser) calling Claude via the AI SDK, plus Airtable writes through scoped server-side credentials — never the client's browser, never the model holding tokens.
- **Audience:** AstraJax clients (domain experts), supervised by a human approver.
- **Governance:** every base-creation is a Doc action gated by the Brain Key model — request → human approve → scoped write → logged. No client model ever receives an Airtable token (see `brain-key-wiring.md` no-memory rule).
- **Why it waits:** it depends on multi-tenant identity, per-client credential scoping, and billing — all explicitly on the AIE do-not-build list. Phase 2 starts *after* AIE.

---

## 5. What to borrow from Airtable's published skills (for Track B)

Airtable open-sourced a skill pack (`github.com/Airtable/skills`, `plugins/airtable/skills`). For **Track A** these are already imported as-is (see §1a). For **Track B**, the governed builder should **adapt the patterns** rather than reuse the generic skills wholesale, because Track B needs the Brain Key model baked in:

| Airtable skill | Borrow as | Why |
|----------------|-----------|-----|
| `airtable-filters` | Core MCP operating rules | Teaches field IDs vs names, choice IDs for selects, AND/OR filter JSON — the gotchas that break writes |
| `airtable-overview` | Data-model primer | Shared vocabulary: bases, tables, fields, views, interfaces |
| `airtable-cli` | Optional, scriptable lane | Only if you want terminal/CI base-builds outside Cursor; the MCP server already covers in-Cursor use |
| `agent-activity-log` | The audit pattern | Opt-in audit table: what the agent created and why, session IDs, Decision/Blocker events. Maps onto your Registry **Change Log** rather than a separate table |
| `show-airtable-link` | Handoff UX | After every build, hand back a clickable link to the base/table created — high value for a non-technical operator |
| `product-ops` *setup mode* | The build-flow template | Its **interview → pick schema shape → build via MCP → hand off UI steps** flow is the closest existing blueprint. Steal the *shape*, not the product-ops content |

The genuinely reusable insight is the four-layer build model: **schema (via MCP) → native Airtable UX → portals → custom Vercel app**. That mirrors your own stack (Airtable governs → Cursor builds → GitHub versions → humans approve).

What the pack does **not** give you, and you must supply: the Brain Key access model, Registry/Workshop/Trusted/**Agent** separation, scoped credentials, the human approval gate, and the Clive fleet integration.

---

## 6. Canonical schema shapes (what it is allowed to build)

Bounded to **four** shapes. **Do not duplicate field-level schemas here** — they live in [`brain-key-schema.md`](./brain-key-schema.md). Access rules and credentials: [`brain-key-wiring.md`](./brain-key-wiring.md). Live IDs: [`airtable-ids.ts`](../../website/src/lib/brains/airtable-ids.ts).

| Shape | Table keys (in `airtable-ids.ts`) | One-liner |
|-------|-----------------------------------|-----------|
| **Registry** | `brains`, `agents`, `keyRequests`, `accessGrants`, `changeLog` | Index + governance only |
| **Workshop** | `userBrains`, `draftBrainTruth`, `brainInteractions`, `pamReviews`, `approvalDecisions`, `docActions` | Draft / propose |
| **Trusted Brain** | `brainTruth`, `brainMemories` | One base per brain theme — approved business context |
| **Agent** | `narrativeArch`, `personaConfig`, `personaMemories`, `minions` | One base per agent — character + role memory |

The minion reproduces these shapes faithfully and registers new brains or agents — it does not invent schemas on the fly. Shape changes are a human decision in `brain-key-schema.md` and `brain-key-wiring.md` first, then applied in Phase B.

---

## 7. Risk tier and guardrails

Per Doc's Workshop risk classification:

- **Phase 1: Medium.** Writes to Airtable, internal audience. Requires: edit-safety protocol, boundary evals, a named human approval gate before any write, and audit to the Change Log.
- **Phase 2: High.** Client-facing, creates bases, touches client data and credential scoping. Requires: independent Opus red-team, explicit recorded Matthew sign-off, rollback note, and the full Brain Key request→approve→scoped-write→log path with no token ever reaching a model or browser.

**Always forbidden (both phases):** approving context, deploying runtime agents, committing/pushing, writing to a Trusted Brain without a validated grant, exposing or remembering any Airtable token, building outside the four canonical shapes, storing durable memory in HyperAgent for product agents.

---

## 8. How to build it (the right lane for each step)

This is a textbook **Doc's Workshop** job — don't hand-roll it:

1. **Design (Phase A, read-only):** run Factory's interview and roster check; confirm it's a new build vs an extension of Doc. Classify risk (Medium now). Draft the config pack and skill.
2. **Independent review:** Medium tier needs the self red-team; when Phase 2 (High) is designed, add the Opus review gate.
3. **Build (Phase B, on approval):** Factory emits the Cursor subagent + skill + build pack. Mechanical scaffolding goes to **Composer**, not an expensive reasoning model.
4. **Skill content:** fold in the adapted Airtable patterns (§5) plus the canonical schema shapes (§6) and the Brain Key rules.

Model routing: design/architecture on a strong reasoning model; the actual file/skill generation on Composer; the Phase‑2 runtime calls Claude via the Vercel AI SDK.

---

## 9. Implementation (shipped v0.1)

Doc Brain Base Builder is a **named minion** in Doc's family. **Mode 1** (brain) is its governed lane; **Mode 2** (ops) composes Matthew's Airtable workbench skills in the same minion.

| Artifact | Path |
|----------|------|
| Front door | `@doc` → routes to Doc Brain Base Builder when the job is base scaffolding |
| Cursor subagent | `.cursor/agents/doc-brain-base-builder.md` |
| Cursor skill | `.cursor/skills/doc-brain-base-builder/SKILL.md` |
| Build pack | `agents/registry/cursor/doc/doc-brain-base-builder/build-pack-v0.1.md` |
| Live ID map | `website/src/lib/brains/airtable-ids.ts` |
| Schema blueprint | `docs/initiatives/brain-key-schema.md` |
| Access + credentials | `docs/initiatives/brain-key-wiring.md` |
| Governance + Doc routing | `docs/business/architecture.md` §7, §9 |
| Minion family | `docs/initiatives/doc-minions.md` |

**Invoke (typical):**

```text
@doc
Stand up a Trusted Brain base for [theme] — Phase A only.
```

After review, switch to **Agent mode** and say `approved — build it`. Doc dispatches the minion; Phase B runs MCP writes, updates `airtable-ids.ts` when new bases are created, and hands back one Airtable link.

Direct lane (skip triage when you already know):

```text
@doc-brain-base-builder
Extend Registry Agents table — Phase A.
```

**Phase B completion checklist** (minion skill): MCP build → `airtable-ids.ts` if new IDs → Registry **Brains** or **Agents** row → `show-airtable-link` handoff → stop (no commit unless Matthew asks).

---

## 10. Live Chapter 1 inventory (26 Jun 2026)

Canonical IDs live in code — **do not duplicate IDs in other docs** except this initiative's snapshot. When IDs change, update `airtable-ids.ts` first; other docs link there.

**Scope:** Chapter 1 product agents only (`clive`, `pam`, `doc`, `clive-man`). Other Agent bases (e.g. Lazlo Marlowe) are out of this snapshot — register in Registry **Agents** + `airtable-ids.ts` when they enter the governed fleet.

| Shape | Airtable name | Base ID | Tables (keys in `airtable-ids.ts`) |
|-------|---------------|---------|-------------------------------------|
| Registry | AstraJax Brain Registry | `appbdTVHevH6Bl5ZZ` | `brains`, `agents`, `keyRequests`, `accessGrants`, `changeLog` |
| Workshop | AstraJax Brain Workshop | `appL2fdnGmhA02WXd` | `userBrains`, `draftBrainTruth`, `brainInteractions`, `pamReviews`, `approvalDecisions`, `docActions` |
| Trusted Brain | AstraJax Trusted Brain — Chapter 1 | `app6tjzzG0L0lOeVb` | `brainTruth`, `brainMemories` |
| Agent | AstraJax Agent — Clive | `appBd9tudgvOSrhSX` | `narrativeArch`, `personaConfig`, `personaMemories`, `minions` (+ tier fields — see below) |
| Agent | AstraJax Agent — Pam | `appH7NeSSNntuKRL4` | same four tables (tier fields not yet rolled out) |
| Agent | AstraJax Agent — Doc | `appI5tpwsKNwjfrqR` | same four tables (tier fields not yet rolled out) |
| Agent | AstraJax Agent — Clive's Man | `appZ71CSKBlhnb4hR` | same four tables (tier fields not yet rolled out) |

Registry **Agents** rows link slugs `clive`, `pam`, `doc`, `clive-man` to Agent base IDs and repo paths.

**Tiered character context (26 Jun 2026):** only the **Clive** Agent base has Narrative Arch tier fields (`Provenance Status`, `Tier`, `Known Truth Slot`, `Injection Priority`) and the Persona Memories → Known Truth link. Pam, Doc, and Clive's Man are pending rollout — see `CLIVE_NARRATIVE_ARCH_TIER_FIELDS` in `airtable-ids.ts` and [`brain-key-schema.md`](./brain-key-schema.md) (Tiered character context).

**Seeded in Phase B:** Narrative Arch + Persona Config for Clive/Pam/Doc (migrated from legacy Trusted Personas); Clive's Man scaffold + three minions (proposer, challenger, executor); Doc Agent base minion row **`doc-brain-base-builder`** (synced in Airtable via MCP, 26 Jun 2026); Trusted **Brain Memories** table (empty, ready for promotion path); Clive tier scaffold (Pending Super Objective + five Pending Known Truth slots).

---

## 11. Credentials (where PATs go)

PATs are **created in Airtable** ([airtable.com/create/tokens](https://airtable.com/create/tokens)), scoped per base/role. They are **stored server-side only** — never in the repo, Airtable records, browser, or model prompts.

| Where | Use |
|-------|-----|
| **Vercel** → Project → Settings → Environment Variables | Production and Preview for deployed `website/` Brain Key routes |
| **`website/.env.local`** | Local dev (never commit) |
| **HyperAgent / Cursor MCP** | Separate MCP PAT with write access for `@doc-brain-base-builder` Phase B builds |

After real tokens are set in Vercel, set `BRAIN_KEY_USE_MEMORY=false` so grants and requests persist in Airtable instead of the in-memory demo store.

**Brain Key env vars** (existing routes):

| Variable | Base / role |
|----------|-------------|
| `BRAIN_REGISTRY_READ_TOKEN` | Registry read |
| `BRAIN_KEY_ADMIN_TOKEN` | Registry write (approve grants) |
| `BRAIN_WORKSHOP_WRITE_TOKEN` | Workshop write |
| `BRAIN_WORKSHOP_READ_TOKEN` | Workshop read (workbench) |
| `BRAIN_TRUSTED_READ_TOKEN` | Trusted Chapter 1 read (or per-slug via `BRAIN_TRUSTED_BRAINS` JSON) |
| `BRAIN_DOC_PROMOTE_TOKEN` | Doc promote (Workshop + Trusted + Change Log) |
| `BRAIN_KEY_ADMIN_SECRET` | Human approve proxy header (not an Airtable PAT) |

**Agent base env vars** (Phase B schema — mint when wiring runtime memory):

| Variable | Purpose |
|----------|---------|
| `BRAIN_AGENT_CLIVE_READ_TOKEN` | Clive Agent base read |
| `BRAIN_AGENT_CLIVE_WRITE_TOKEN` | Clive Persona Memories write |
| `BRAIN_AGENT_PAM_READ_TOKEN` / `_WRITE_TOKEN` | Pam Agent base |
| `BRAIN_AGENT_DOC_READ_TOKEN` / `_WRITE_TOKEN` | Doc Agent base |
| `BRAIN_AGENT_CLIVE_MAN_READ_TOKEN` / `_WRITE_TOKEN` | Clive's Man Agent base |

Slug pattern: `BRAIN_AGENT_{SLUG}_READ_TOKEN` where slug is uppercased with hyphens → underscores (`clive-man` → `CLIVE_MAN`).

You do not need every token on day one. Minimum for Brain Key unlock testing: Registry + Workshop + Trusted. Add Agent tokens when `website/` routes load persona memory from Agent bases.

---

## 12. Remaining work (post–Phase B)

**Matthew manual (Airtable UI):**

- Add `doc` to Brain Key Requests **Persona** single-select if grant flows need Doc as requester.
- On Trusted **Brain Truth**: delete **LEGACY Scope (delete in UI)** text field (still present live as of 26 Jun); retire legacy `read:brain-context:*` Scope options when no grants use them (canonical scopes are `read:brain-truth:positioning` and `read:brain-truth:governance`).
- Roll out tier fields to Pam / Doc / Clive's Man Agent bases when ready (Clive is the reference — see `CLIVE_NARRATIVE_ARCH_TIER_FIELDS` in `airtable-ids.ts`).
- Mint scoped PATs per base; add to Vercel per §11.

**Repo / product (separate briefs — not the minion's job unless Matthew asks):**

- Wire `website/src/lib/brains/` to read Narrative Arch, Persona Config, Persona Memories, and Minions from Agent bases (env vars above).
- Persona memory auto-save into Airtable (server-side only; `sanitizeForClient` on responses).
- Change Log entry for Phase B migration (optional paper trail).

**Minion v0.2 (future):**

- Evals for Phase A proposal quality and Phase B ID handoff.
- Automated diff check: `airtable-ids.ts` vs MCP `list_tables_for_base`.

**Phase 2 (post-AIE, High risk):**

- Vercel server route + AI SDK + per-client credential scoping.
- Opus red-team before client-facing ship.
- See §4 Phase 2 — explicitly not v0.1.

---

## 13. What's next

For **new brain themes or agents**, invoke `@doc` or `@doc-brain-base-builder` — Phase A propose, then Phase B build in Agent mode. Scope stays §2: governed shapes only.

For **website Brain Key + memory wiring**, invoke `@doc` → **Vercel Minion** (or a dedicated brief) — that lane owns `website/src/lib/brains/`, not Doc Brain Base Builder.

The positioning decision in §2 is **closed for v0.1**: Mode 1 builds fixed brain shapes; Mode 2 is Matthew's workbench only. Revisit only if client-facing Phase 2 scope is opened.
