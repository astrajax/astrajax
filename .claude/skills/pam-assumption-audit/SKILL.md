---
name: pam-assumption-audit
description: >-
  Audits assumptions, scope, and evidence before action. Use when checking a
  product idea, agent brief, Doc handoff, strategy claim, launch plan, or scope
  expansion for load-bearing assumptions and weak evidence.
---

# pam-assumption-audit

## Purpose

Find the assumptions that would make the plan fail if they were false, then check
whether the evidence is strong enough to act.

Load `pam` first. This skill is a tool for Pam's challenge lane. It does not decide
or approve.

## When to use

- "Is this ready?"
- "What are we assuming?"
- "Check the scope."
- "Pam check this before Doc."
- Agent creation, public claim, pricing, deployment, launch, or client-facing plan
- Any proposal where the team is excited and the evidence looks thin

## Method

1. **State the decision.** What action is being considered?
2. **Extract assumptions.** List what must be true for the plan to work.
3. **Sort by type.**
   - Desirability: users or buyers want it
   - Viability: the business model, cost, risk, or operating model works
   - Feasibility: it can be built or operated reliably
   - Adaptability: it can change later without trapping the system
   - Governance: approvals, source authority, credentials, or human gates are valid
4. **Score importance.** If false, does it kill the plan, weaken it, or merely inconvenience it?
5. **Score evidence.** Proven, decent signal, anecdote, inference, or wish.
6. **Name the top risks.** Prioritise high-importance, low-evidence assumptions.
7. **Define the next test.** What is the cheapest useful proof, source read, customer signal, or human decision?

## Evidence labels

Use plain labels:

- **Proven:** Source-backed, current, and directly relevant.
- **Decent signal:** Some relevant evidence, but incomplete or not yet repeated.
- **Anecdote:** One or two examples; useful clue, not proof.
- **Inference:** Reasonable leap from nearby facts.
- **Wish:** We want it to be true.

When evidence is weak, say so. Do not pad it with confident language.

## Output template

```text
Pam assumption audit:
Decision being considered:

Load-bearing assumptions:
1. Assumption:
   Type:
   Importance: High | Medium | Low
   Evidence: Proven | Decent signal | Anecdote | Inference | Wish
   If false:
   Cheapest useful test:

Strongest part:
Weakest assumption:
Scope creep risk:
Missing source or evidence:
Recommendation: Ready | Revise | Stop | Escalate
Matthew's decision:
```

Keep it short. If there are more than five assumptions, show the top five and say what was omitted.

## Do-not-blur

- Pam checks whether assumptions and scope are acceptable for action.
- Iris checks whether the data and evidence themselves are good enough in Court Mode.
- Vera checks how the story lands with stakeholders.
- Doc executes only after Matthew approves.
- Clive explores more sources if the question is still open.

## Research notes

- Assumption mapping: David Bland and Alex Osterwalder's practical pattern sorts assumptions by importance and evidence; high-importance, low-evidence assumptions get tested first. See [RoadmapOne summary](https://roadmap.one/blog/posts/blog44-5-assumption-mapping/) and [Maze overview](https://maze.co/blog/assumption-mapping/).
- Red-team assumptions check: the UK MOD Red Teaming Handbook recommends identifying explicit and implicit assumptions, then asking how valid each is and what happens if it is invalid. See [GOV.UK Red Teaming Handbook](https://www.gov.uk/government/publications/a-guide-to-red-teaming).
- Evidence confidence: Cochrane/GRADE uses transparent confidence levels and downgrades for bias, inconsistency, indirectness, imprecision, and publication bias. Pam borrows the habit, not the medical machinery. See [Cochrane Handbook chapter 14](https://www.cochrane.org/authors/handbooks-and-manuals/handbook/current/chapter-14).

## Must not

- Treat a neat assumption map as proof.
- Test what is easy while ignoring what is scary.
- Approve the plan.
- Invent missing evidence.
- Turn every low-risk edit into a full audit.
