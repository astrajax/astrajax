---
name: pam-pre-mortem
description: >-
  Runs a practical pre-mortem for launches, deployments, agent builds, pricing,
  public claims, client-facing work, and high-stakes plans. Use when Pam should
  assume failure first and work backward before Matthew commits.
---

# pam-pre-mortem

## Purpose

Assume the plan has failed, then work backward to find the reasons while there is
still time to change the plan.

Load `pam` first. This skill helps Pam challenge a plan. It does not decide or approve.

## When to use

- Before deploy, publish, launch, agent creation, or Doc handoff
- Before pricing, money, client material, public claims, or policy decisions
- When a plan sounds tidy but the downside is expensive or embarrassing
- When nobody has said, "How does this fail?"

## Method

1. **Set the scene.** "It is [timeframe] later. This failed badly."
2. **List failure causes.** Name plausible reasons, not generic doom.
3. **Separate causes.**
   - Assumption failure
   - Evidence failure
   - Scope failure
   - Operational failure
   - Governance or approval failure
   - Adoption or stakeholder failure
   - Technical or integration failure
4. **Pick the top three.** Choose the failures with high likelihood, high impact, or high embarrassment.
5. **Add early warnings.** What would show this is starting to happen?
6. **Add mitigations.** What should change before action?
7. **Recommend readiness.** Ready, Revise, Stop, or Escalate.

## Output template

```text
Pam pre-mortem:
Plan:
Failure scene:

Most likely failure causes:
1. Cause:
   Type:
   Early warning:
   Mitigation before action:

What would embarrass us:
What would be hard to reverse:
What needs a human decision:
Recommendation: Ready | Revise | Stop | Escalate
Matthew's decision:
```

Do not write a horror novel. Three to five failure causes are usually enough.

## Failure cause quality

Good causes are specific:

- "The public claim says production adoption, but the supporting proof is only internal demo usage."
- "Doc can build the route, but no one owns the Vercel env variable after deploy."
- "The agent permission lets it write where it should only propose."

Weak causes are vague:

- "Users might not like it."
- "Something could break."
- "Scope might creep."

If the cause is vague, rewrite it until the owner, trigger, and consequence are visible.

## Research notes

- Gary Klein's pre-mortem asks a team to imagine a plan has failed and generate threats before launch. See [Gary Klein's pre-mortem method](https://www.gary-klein.com/premortem).
- Klein, Sonkin, and Johnson describe the pre-mortem as a way to identify flaws in a plan, encourage candor, and address weaknesses before implementation. Their conditions include reframing, cognitive diversity, psychological safety, and equal participation.
- The UK MOD Red Teaming Handbook treats planning challenge as a way to guard against over-optimism, missing contingencies, and pathways to failure. See [GOV.UK Red Teaming Handbook](https://www.gov.uk/government/publications/a-guide-to-red-teaming).

## Must not

- Use the pre-mortem to perform cynicism.
- Generate failures with no mitigation or decision attached.
- Pretend a mitigation removes all risk.
- Approve the plan.
- Decide for Matthew.
