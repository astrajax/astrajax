# Brain Base Builder — Agent Plan

**Status:** Track A done (Airtable skills imported). Track B v0.1 **built** — invoke `@doc-airtable-builder` in Cursor. Registry: `agents/cursor/doc/airtable-builder/build-pack-v0.1.md`.
**Owner:** Matthew.
**Working name:** "Brain Base Builder" (a capability in Doc's family — final name/character is Matthew's call).
**Read with:** [`brain-key-wiring.md`](./brain-key-wiring.md) (the access model it builds for), [`aie-2026-07.md`](./aie-2026-07.md) (sprint scope and do-not-build list), and `docs/business/architecture.md` (Doc routing, agent roles).
**Front door:** [`docs/START-HERE.md`](../START-HERE.md).

---

## 1. What this agent is (one line)

> **An agent that scaffolds and evolves the Airtable bases a Brain lives in — Registry, Workshop, and Trusted Brains — from a plain-language brief, under human approval.**

It is the part of **Doc** that builds the *physical home* for a brain: tables, typed fields, linked records, the Brain Key governance tables. It does not decide what context is true, does not approve, and does not deploy runtime agents.

You already did this by hand once: the Registry (`appbdTVHevH6Bl5ZZ`), Workshop (`appL2fdnGmhA02WXd`), and Trusted Chapter‑1 (`app6tjzzG0L0lOeVb`) bases were created via MCP on 24 Jun. This agent turns that one-off into a repeatable, governed, audited build.

---

## 1a. Two tracks (don't confuse them)

The "Airtable build agent" idea splits cleanly. Both are valid; only one touches the guardrail.

- **Track A — Matthew's own workbench (done).** Matthew still builds a lot directly on Airtable (DS platform, AstraJax's own bases). Airtable's open-source skill pack is authored *by Airtable* and ships in the exact `SKILL.md` format Cursor uses, so it imports as-is and rides the Airtable MCP already wired here. Imported into `.cursor/skills/` on 24 Jun: `airtable-overview`, `airtable-filters`, `show-airtable-link`, `agent-activity-log`, `product-ops`, `sales-ops`, `marketing-ops` (skipped `airtable-cli` — it assumes the `@airtable/mcp-cli` npm tool). These are **Doc-family build skills** (Doc acts/builds; Clive reasons), kept under their original names so the skills' cross-references stay intact, with Airtable authorship preserved in frontmatter. The build-shop guardrail does **not** apply here — this is tooling Matthew uses, not the product.
- **Track B — the governed Brain Base Builder (this plan).** The client-facing capability that scaffolds governed brains under the Brain Key model. This is where §2 and the governance below apply.

The one watch-item linking them: Track A skills are generic base-building helpers. Use them freely for your own speed; do not let "I imported Airtable's generic skills" quietly become "this is the AstraJax offering."

## 2. The positioning guardrail (read this before building Track B)

AstraJax is explicitly **not an Airtable build shop** (positioning §13, internal-brief §3, AIE brain §3). An agent literally called an "Airtable build agent" is the most drift-prone thing in the fleet. The plan stays on-thesis only if:

- It builds **governed brains** (context homes with the Brain Key model baked in), not generic bases-for-hire.
- It is **bounded to the AstraJax brain schema** — Registry / Workshop / Trusted Brain shapes — not "describe any base and I'll build it."
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
- **Scope of writes:** create/extend tables and fields in the AstraJax brain bases; seed structural records (e.g. a new Brain row in the Registry). Bounded to the three base shapes.
- **What it does for AIE specifically:** when a new Trusted Brain theme is needed (one base per theme, per `brain-key-wiring.md`), it scaffolds that base to the canonical shape and registers it — minutes, not manual clicking.

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

What the pack does **not** give you, and you must supply: the Brain Key access model, Registry/Workshop/Trusted separation, scoped credentials, the human approval gate, and the Clive fleet integration.

---

## 6. Canonical schema shapes (what it is allowed to build)

Bounded to three shapes, all defined in `brain-key-wiring.md` and already live in `website/src/lib/brains/airtable-ids.ts`:

1. **Registry base** — `brains`, `keyRequests`, `accessGrants`, `changeLog`. One per AstraJax (or per client tenant in Phase 2). Index + governance only; never holds trusted context or tokens.
2. **Workshop base** — `userBrains`, `draftBrainContext`, `brainInteractions`, `pamReviews`, `approvalDecisions`, `docActions`. Draft/propose space.
3. **Trusted Brain base** — `brainContext`, `personas`. One base per brain theme, scoped credentials. Approved context only.

The agent's job is to reproduce these shapes faithfully and register a new brain — not to invent new schemas on the fly. Schema changes to the canonical shapes are a human decision, made in `brain-key-wiring.md` first, then applied.

---

## 7. Risk tier and guardrails

Per Agent Factory risk classification:

- **Phase 1: Medium.** Writes to Airtable, internal audience. Requires: edit-safety protocol, boundary evals, a named human approval gate before any write, and audit to the Change Log.
- **Phase 2: High.** Client-facing, creates bases, touches client data and credential scoping. Requires: independent Opus red-team, explicit recorded Matthew sign-off, rollback note, and the full Brain Key request→approve→scoped-write→log path with no token ever reaching a model or browser.

**Always forbidden (both phases):** approving context, deploying runtime agents, committing/pushing, writing to a Trusted Brain without a validated grant, exposing or remembering any Airtable token, building outside the three canonical shapes.

---

## 8. How to build it (the right lane for each step)

This is a textbook **Clive Agent Factory** job — don't hand-roll it:

1. **Design (Phase A, read-only):** run Factory's interview and roster check; confirm it's a new build vs an extension of Doc. Classify risk (Medium now). Draft the config pack and skill.
2. **Independent review:** Medium tier needs the self red-team; when Phase 2 (High) is designed, add the Opus review gate.
3. **Build (Phase B, on approval):** Factory emits the Cursor subagent + skill + build pack. Mechanical scaffolding goes to **Composer**, not an expensive reasoning model.
4. **Skill content:** fold in the adapted Airtable patterns (§5) plus the canonical schema shapes (§6) and the Brain Key rules.

Model routing: design/architecture on a strong reasoning model; the actual file/skill generation on Composer; the Phase‑2 runtime calls Claude via the Vercel AI SDK.

---

## 9. First concrete step

Open Clive Agent Factory and run a Phase‑A design pass for the Phase‑1 (Medium, Cursor-native) version only. The single decision that matters most before any building: **confirm the scope boundary in §2** — that this builds governed brains to fixed shapes, and will not become a general Airtable base builder.

Everything else (which Airtable skill files to adapt, naming, character) is downstream of that boundary decision.
