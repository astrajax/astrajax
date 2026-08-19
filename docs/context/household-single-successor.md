# Household Single-Successor

> **Repo carrier** for the 19 Aug 2026 successor rule. Binding short form also lives in Household Conduct Standard Part 2. Canonical home: Trusted Brain `core-governance` (promotion pending) and, for agent operational contracts, Airtable Persona Config. Promoted Airtable wins over this file. Runtime copies: `.cursor/skills/household-single-successor/SKILL.md` and `.claude/skills/household-single-successor/SKILL.md`.

**Owner:** Matthew. **Date:** 19 Aug 2026. Replaces the Workshop habit of `revise` → Phase A loop and builders that only accept the word `proceed`. There is no numeric cap on challenge rounds. Stall is a quality defect, not a stop-rule.

Load this skill when you are the **proposer**, **challenger**, or **executor** on an interactive Trinity job. Household Conduct Standard still owns Green / Amber / Red. This skill owns what happens *after* a challenge.

Exempt (keep their own statuses): **Ruth Maintenance Challenger** and **Clive's Man Context Challenger**. The exemption follows the named agent, including interactive Cursor threads.

## Purpose

A challenge must leave **one current executable candidate**. The next real step runs from that candidate. Matthew is not asked to accept a repair, restart a loop, or ration further challenge.

```text
Proposer
  → Challenger
  → PROCEED:    V1 is current
  → SUCCESSOR:  complete V2 is current (proposing lane adopts it)
  → ESCALATE:   no honest repair, or repair changes tier / scope / authority
  → tier router
  → Green:  execute
  → Amber:  execute, then notify
  → Red:    one human decision on the current candidate, then execute
  → Executor accepts the current candidate
```

SUCCESSOR adoption is **not** Airtable promotion, Trusted canon, or human approval. It only replaces V1 as the working proposal in this job.

## Material blocker

Default to **PROCEED**. Taste, optional polish, and "I found another hole" are not blockers.

A material blocker is only one of:

- the proposal breaches policy, credential, or scope
- evidence shows it cannot meet the stated acceptance test
- repairing it changes the intended outcome, tier, or authority

If you cannot name which of those three it is, it is not a blocker. Return PROCEED. Scepticism without a repair is failure.

## Challenger outcomes (exactly one)

Output the verdict first, unsoftened. Then the candidate.

1. **PROCEED** — no material blocker. V1 is current. Include the executor brief for V1.
2. **SUCCESSOR** — a complete repaired V2 becomes current. It must include every required decision, constraint, artifact path, and conditional executor handoff. The human must not have to perform the repair. Mark it as the challenger's proposal: severable, never silent scope-expansion. If the repair would change outcome, tier, or authority, do not call it SUCCESSOR; **ESCALATE**.
3. **ESCALATE** — name the human owner, the exact unresolved decision, the viable choices, and the consequence of each. Bare `revise`, `block`, `hold`, `stop`, or `escalate` without that handoff is a policy violation.

The challenger never decides or approves.

**Delta:** a later look reviews only what changed. A later *material* change may receive another successor repair. Nobody is told they have "used up" their challenges. Do not invent a round cap, a timeout-as-permission, or a "delta may not emit V2" rationing rule.

**No self-review:** a challenger's own SUCCESSOR is not challenged. No challenge-of-the-challenge. The current candidate goes to the tier router.

**Court mode** (Pam only, Matthew-summoned): no repair duty. Terminal result is still PROCEED or a named ESCALATE.

## Proposer

On SUCCESSOR, adopt V2 as the current proposal immediately. Do not restart Phase A. Do not iterate "until proceed". Do not send the SUCCESSOR back through the same challenger.

On PROCEED, keep V1.

On ESCALATE, stop the agent loop and return the named choices to the human owner.

## Executor

Accept the **current candidate**: PROCEED (V1) or SUCCESSOR (V2).

A gate that tests only for the literal word `proceed` is misconfigured. Copy the Ruth wording: accept `PROCEED` or a cleared successor.

Do not execute from an ESCALATE. Do not execute a Red candidate until the one human decision for that flow has been recorded.

Named Red gates (the human decides once, on the current candidate):

- Doc's Workshop: Matthew's approval of the pack
- Ruth Build: Matthew or client signature by decision ID and proposal hash
- Clive's Man Lane B: Matthew's promotion decision
- Lazlo: Matthew's "ready" call before any Airtable Pending write
- Pam embedded flow: Matthew's decision between v1, successor, or synthesis

Green and Amber do not wait for that click. Green executes; Amber executes then notifies.

## Pam

Only the **head that owns the underlying decision** may summon Pam, and only when the decision is **Red and genuinely novel**. Red tier alone is not a Pam trigger. Ordinary approval, agent creation, deployment, and Doc handoff carry no second Pam tax.

Family proposers, challengers, and executors must not invoke or recommend Pam. They must not create a nested challenge. Matthew may summon Pam or Court Mode directly.

## After-the-fact quality (not a gate)

Failure to progress is an agent-quality defect for Halvard, not a reason to stop the job. Useful signals: challenge completions that never reach the next real step; extra Matthew actions beyond the tier minimum; SUCCESSOR-shaped output labelled as revise; Green/Amber work returned to Matthew.

## Do not

- Add a numeric cap (`1 full + 1 delta` or any cousin)
- Ask the human to accept a repair as a separate click
- Insert a Green or Amber confirmation gate
- Summon Pam from a family challenger
- Hand-edit generated registry packs; regenerate from Airtable
- Patch repo mirrors as source of truth ahead of Persona Config / `core-governance`
- Overwrite HyperAgent exports marked `UNVERIFIED-LIVE`

## Airtable capture handoff — Draft

**Capture status:** Live Workshop **Draft Brain Truth**
[`rectLG0m9XgPdkIXC`](https://airtable.com/appL2fdnGmhA02WXd/tblswvXNYFDqnl6af/rectLG0m9XgPdkIXC).
It remains Draft. It is not Trusted, promoted, or an approval record.

| Draft field | Live value |
|---|---|
| Title | Household single-successor decision — 19 Aug 2026 |
| Canonical Text for Agents | Interactive Trinity leaves one current executable candidate; Green/Amber continue; Red waits once; no round cap; Airtable remains SSOT when promoted. Repo evidence is branch `cursor/household-single-successor-skill-1e9e`, commit `75b7712` plus later digest commit: `.cursor/skills/household-single-successor/SKILL.md`, its `.claude` twin, `docs/context/household-single-successor.md`, and Household Conduct Standard Part 2. Still open: Airtable Persona Config / `core-governance` promotion (Red); Workshop builders still accept literal `proceed` only; `UNVERIFIED-LIVE` HyperAgent stubs remain untouched. |
| Canonical Text for Humans | Interactive Trinity now leaves one current candidate that can be acted on. Green and Amber continue; Red waits for one human decision; there is no challenge-round cap. Airtable becomes the source of truth only after promotion. Persona Config and core-governance promotion, Workshop builder wiring, and the untouched HyperAgent stubs remain open. |
| Brain Registry | [`rec7njkkYBWzZbe4n`](https://airtable.com/appL2fdnGmhA02WXd/tblsI93ayQm4hq5bw/rec7njkkYBWzZbe4n) — AstraJax Chapter 1 / `astrajax-core` |
| Brain Slug | `astrajax-core` |
| Proposed Category | Rules & Guardrails |
| Record Type | Truth Claim |
| Horizon | Persistent |
| Status | Draft |
| Proposed By Agent | `clive-man` |
| Created By | Agent |
| Capture Source | Chat Session |
| Source Documents | None — repo evidence only; no Airtable upload record was supplied |
| Context Amendment Versions | None |
| Related Projects | None — head decision; no project link is required for this persistent governance claim |
| Human-only builder fields | Leave untouched |

**Provenance:** Matthew Hopkinson, Cursor Cloud thread, 19 Aug 2026. Parent
encoded the skill after Clive brief `bc-da9988b7-9a8a-5040-a84e-7acbd550ef30`.
`session_id: none`; `root_session_id: none`.

**Next human gate:** promotion to Persona Config / Trusted Brain
`core-governance` is Red and was not requested.

## Self-check

- Is there one current candidate, and can an executor act from it at this tier?
- Did I name a material blocker, or am I performing scepticism?
- If I repaired: is the SUCCESSOR complete, and did I avoid changing tier/scope/authority?
- Am I about to send this around Phase A, demand the word `proceed`, or ask Matthew to do the repair?
- Would this create a nested Pam pass?
