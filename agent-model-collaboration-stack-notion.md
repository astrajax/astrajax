# Agent Model Collaboration Stack — Reference

**Last reviewed:** 24 May 2026  
**Purpose:** A practical, Notion-friendly reference for choosing model collaborators when designing, testing, and implementing effective agent configurations.

---

## Executive summary

The current best approach is **not** to choose one “best” model for every part of agent building.

Use a small **model committee**:

```text
GPT-5.5 → architecture and first config draft
Claude Opus 4.7 → adversarial critique and risk review
Composer 2.5 → Cursor-native implementation and iteration
Gemini 3.5 Flash → scale, subagents, managed-agent experiments, eval generation
Smaller/cheaper models → repeatable worker tasks after the workflow is proven
```

The guiding principle: **start simple, build a strong single-agent baseline, then add routing, subagents, or multi-agent orchestration only when there is a clear reason.**

Useful reasons to add complexity:

- The agent has too many tools for one model to use reliably.
- The workflow naturally splits into parallel tasks.
- Different subtasks need different cost, latency, context, or reasoning profiles.
- You need an independent reviewer or red-team pass.
- You need repeatable, low-cost subagents for narrow work.

---

## Recommended model roles

| Role | Best collaborator | Use it for | Why it earns the slot | Watch-outs |
|---|---|---|---|---|
| **Primary agent architect** | **GPT-5.5 / Codex with GPT-5.5** | First-pass agent config, tool policy, orchestration, eval design, code-heavy workflow planning | OpenAI positions GPT-5.5 as a frontier model for complex professional work, coding, tool-heavy agents, grounded assistants, long-context retrieval, and production workflows. | More expensive than smaller models. Do not blindly reuse old prompts; tune fresh baselines, reasoning effort, verbosity, and tool descriptions. |
| **Adversarial reviewer** | **Claude Opus 4.7** | Red-team reviews, config critique, tool-risk analysis, ambiguity detection, long-context agent review | Anthropic describes Opus 4.7 as its most capable generally available model for long-horizon agentic work and complex reasoning. Anthropic recommends high or xhigh effort for coding and agentic use cases. | Higher effort settings can increase token use. Best used for “review and improve” rather than every cheap worker task. |
| **Cursor-native builder** | **Composer 2.5** | Implementing agent files, Cursor workflows, multi-file edits, test harnesses, fast iteration | Cursor says Composer 2.5 improves over Composer 2 on long-running tasks, complex instruction following, communication style, and effort calibration. | Still needs evals and review. Use it as a builder, not a substitute for governance. |
| **Cost/performance daily driver** | **Composer 2.5 Standard or Fast** | Repeated coding-agent loops where cost and responsiveness matter | Artificial Analysis ranks Composer 2.5 near the top of its Coding Agent Index and highlights unusually low per-task cost versus higher-effort frontier alternatives. | Benchmark results are useful, not gospel. Validate on your own repo and workflows. |
| **Scale / subagents / sandbox experiments** | **Gemini 3.5 Flash** | Managed agents, custom agents, subagent deployment, eval generation, long-horizon tool workflows | Google describes Gemini 3.5 Flash as GA/stable, optimized for agentic execution, coding, long-horizon tasks, subagent deployment, and rapid agentic loops at scale. | Check current feature support and limits. Google notes computer use is not supported at the time of its Gemini 3.5 Flash Interactions API guide. |
| **Cheap worker/subagent tasks** | **GPT-5.4 mini, smaller Gemini tiers, smaller Claude tiers, Composer Standard** | Classification, summarisation, retrieval triage, test generation, log parsing, simple code edits | OpenAI describes GPT-5.4 mini as a faster, efficient model for high-volume workloads and subagents. | Use after the frontier model defines the standard of quality. Do not let cheap subagents invent policy. |

---

## The practical ranking

### 1. GPT-5.5 for architecture

Use GPT-5.5 to design the agent’s core configuration:

- Mission
- Non-goals
- Autonomy level
- Tool permissions
- Tool-use rules
- Memory/context policy
- Escalation and handoff rules
- Failure recovery
- Acceptance tests
- Red-team scenarios

**Best use:** the first serious version of the agent spec.

**Prompt pattern:**

```text
Design an agent configuration for [workflow].

Return:
1. Agent mission
2. Non-goals
3. Autonomy level
4. Tools and permissions
5. Tool-use rules
6. Memory/context policy
7. Handoff/escalation rules
8. Failure recovery
9. Acceptance tests
10. Red-team scenarios

Optimise for reliability, inspectability, and low operational surprise.
```

---

### 2. Claude Opus 4.7 for critique

Use Claude Opus 4.7 as the calm, slightly ruthless reviewer.

Ask it to find:

- Ambiguous instructions
- Over-broad permissions
- Unsafe tool access
- Missing escalation points
- Weak acceptance tests
- Context-management risks
- Multi-agent complexity that is not justified
- Places where the agent may “wing it”

**Best use:** second-pass review before implementation.

**Prompt pattern:**

```text
Act as an adversarial reviewer of this agent configuration.

Find:
- Ambiguity
- Unsafe or over-broad permissions
- Missing constraints
- Overcomplicated routing
- Tool misuse risks
- Evaluation gaps
- Context-management failure modes
- Places where a human approval step is needed

Then rewrite the config to be simpler, safer, and more reliable.
```

---

### 3. Composer 2.5 for Cursor implementation

Composer 2.5 deserves a proper seat at the table.

Use it when you are inside Cursor and want to convert the config into working files, tests, and repo changes.

Recommended outputs:

- `AGENTS.md`
- `SKILL.md`
- Tool specs
- Eval fixtures
- Test harness
- Example tasks
- Versioned prompt templates
- Failure-mode regression tests

**Best use:** turning reviewed agent design into real repo assets.

**Prompt pattern:**

```text
Implement this as versioned agent configuration files.

Create:
- AGENTS.md
- SKILL.md
- Tool specifications
- Evaluation fixtures
- A minimal test harness
- Example success and failure cases

Prefer small, composable changes.
Run tests before fixing.
Report failures clearly before applying patches.
```

---

### 4. Gemini 3.5 Flash for scale, subagents, and managed agents

Gemini 3.5 Flash is especially interesting for scale-oriented agent work.

Use it for:

- Subagent deployment
- Rapid eval generation
- Long-context analysis
- Managed-agent experiments
- Custom agent instructions and skills
- Sandbox-style code execution experiments
- Parallel exploration of workflow variants

**Best use:** breadth, scale, and managed-agent infrastructure.

**Prompt pattern:**

```text
Generate 50 realistic eval cases for this agent configuration.

Include:
- Normal user requests
- Edge cases
- Ambiguous requests
- Bad inputs
- Tool failures
- Stale context
- Partial data
- Multi-step workflows
- Requests that require escalation

Group cases by failure mode and define the expected agent behaviour.
```

---

### 5. Smaller models for repeatable worker tasks

After the main workflow is proven, use cheaper models for high-volume subtasks.

Good worker tasks:

- Categorising requests
- Summarising long documents
- Pulling structured fields from logs
- Generating test cases
- Searching codebase sections
- Drafting simple patches
- Checking formatting
- Running narrow policy checks

Bad worker tasks:

- Defining final safety policy
- Making irreversible decisions
- Approving production changes
- Handling high-stakes escalation alone
- Interpreting vague business requirements without review

---

## Suggested model committee workflow

### Step 1 — Draft the config

**Model:** GPT-5.5  
**Goal:** Create the first complete agent configuration.

```text
Build the smallest reliable agent configuration for [workflow].
Avoid multi-agent complexity unless there is a clear operational reason.
Include tool rules, autonomy limits, handoff triggers, and evals.
```

### Step 2 — Red-team the config

**Model:** Claude Opus 4.7  
**Goal:** Make the config safer, clearer, and more robust.

```text
Review this config as if it will be deployed in production.
Identify failure modes, vague instructions, missing human approvals, and unnecessary complexity.
Return a revised version and explain the top 10 changes.
```

### Step 3 — Implement in Cursor

**Model:** Composer 2.5  
**Goal:** Turn the design into versioned files and tests.

```text
Convert the reviewed config into repo-ready files.
Create AGENTS.md, SKILL.md, eval fixtures, and a minimal test harness.
Use small commits/patches and explain every change.
```

### Step 4 — Generate broader evals

**Model:** Gemini 3.5 Flash  
**Goal:** Expand the test suite and explore edge cases.

```text
Generate a broad eval pack for this agent.
Include adversarial, ambiguous, stale-context, tool-failure, and multi-step cases.
Return expected behaviour and pass/fail criteria for each case.
```

### Step 5 — Optimise cost and routing

**Model:** GPT-5.5 or Claude Opus 4.7 for design; smaller models for execution  
**Goal:** Route cheap tasks to cheap models without lowering quality.

```text
Review this workflow and identify which tasks can safely move to smaller models.
For each task, specify:
- Required capability
- Failure risk
- Suggested model tier
- Escalation trigger
- Eval needed before deployment
```

---

## Agent configuration template

Use this as a reusable starting point.

```yaml
agent:
  name: ""
  version: "0.1.0"
  owner: ""
  last_reviewed: "2026-05-24"

mission:
  summary: ""
  primary_users: []
  success_definition: ""

non_goals:
  - ""

autonomy:
  level: "assistant | supervised_agent | autonomous_agent"
  can_take_external_actions: false
  requires_human_approval_for:
    - "financial commitments"
    - "customer-facing messages"
    - "production changes"
    - "irreversible actions"

tools:
  allowed:
    - name: ""
      purpose: ""
      allowed_inputs: ""
      forbidden_uses: ""
      approval_required: true
  forbidden:
    - ""

tool_rules:
  - "Use the most specific tool available."
  - "Do not call external tools unless the answer depends on fresh or private data."
  - "State uncertainty when a tool result is incomplete or conflicting."
  - "Escalate rather than guessing when the task has high business, legal, financial, or safety impact."

context_policy:
  required_context:
    - ""
  memory_rules:
    - "Only persist information explicitly approved for future use."
    - "Do not treat old context as current without verification."
  stale_context_trigger: ""

handoff_policy:
  escalate_to_human_when:
    - "The agent is asked to take an irreversible action."
    - "The user asks for something outside the agent mission."
    - "The tool output conflicts with the user's request."
    - "Confidence is low and consequences are meaningful."

failure_recovery:
  tool_failure: "Explain what failed, retry once if safe, then escalate or offer a fallback."
  incomplete_data: "Ask for the missing field only if it blocks progress; otherwise proceed with stated assumptions."
  ambiguity: "Resolve using the safest reasonable interpretation and document assumptions."

model_routing:
  architect: "gpt-5.5"
  reviewer: "claude-opus-4-7"
  implementation: "composer-2.5"
  eval_generation: "gemini-3.5-flash"
  cheap_workers:
    - "gpt-5.4-mini"
    - "composer-2.5-standard"

evaluation:
  acceptance_tests:
    - id: "eval-001"
      scenario: ""
      expected_behaviour: ""
      pass_criteria: ""
  red_team_tests:
    - id: "red-001"
      scenario: ""
      expected_refusal_or_escalation: ""
  regression_tests:
    - id: "reg-001"
      bug_prevented: ""
      expected_behaviour: ""

release_checklist:
  - "Agent mission is clear."
  - "Non-goals are explicit."
  - "Tool permissions are narrow."
  - "Human approval points are defined."
  - "Failure recovery is documented."
  - "Eval suite passes."
  - "Known risks are listed."
  - "Config is versioned."
```

---

## Evaluation matrix

| Failure mode | Example test | Expected behaviour | Best reviewer |
|---|---|---|---|
| Ambiguous request | User asks the agent to “handle this” with missing context | Agent asks only for blocking details or proceeds with safe assumptions | Claude Opus 4.7 |
| Tool overreach | Agent tries to use an external tool without need | Agent avoids unnecessary tool use and explains why | GPT-5.5 / Claude Opus 4.7 |
| Unsafe action | User requests production change without approval | Agent pauses and requests human approval | Claude Opus 4.7 |
| Stale context | Agent relies on outdated project info | Agent verifies freshness or marks assumption | GPT-5.5 |
| Cost bloat | Frontier model handles trivial classification | Route to cheaper worker model | GPT-5.5 / GPT-5.4 mini |
| Multi-agent confusion | Subagents duplicate or contradict each other | Manager agent consolidates and resolves conflicts | GPT-5.5 |
| Weak evals | Tests only cover happy paths | Add edge cases, bad inputs, and tool failures | Gemini 3.5 Flash |
| Poor implementation | Config exists but is not testable | Composer creates eval fixtures and test harness | Composer 2.5 |

---

## Operating principles

### 1. Start with an augmented single agent

Begin with one strong model plus the right tools, memory/context rules, and evals. Add subagents only when the work clearly benefits from parallelism, specialisation, or cost routing.

### 2. Separate design, critique, and implementation

Do not ask the same model to be architect, builder, and final judge without an independent review pass. A second model catches different failure modes.

### 3. Give tools narrow jobs

Each tool should have:

- A clear name
- A precise purpose
- Allowed inputs
- Forbidden uses
- Approval requirements
- Failure behaviour

### 4. Version the config like code

Treat prompts, skills, tool policies, and evals as product assets.

Recommended files:

```text
/agents
  AGENTS.md
  SKILL.md
  tool-specs.md
  routing-policy.md
  evals/
    happy-path.md
    edge-cases.md
    red-team.md
    regression.md
```

### 5. Optimise cost only after quality is measurable

First establish the quality bar with the best available model. Then move narrow tasks to cheaper models where evals prove the substitution is safe.

### 6. Keep humans in the loop for irreversible actions

Examples:

- Sending customer-facing messages
- Deploying production changes
- Spending money
- Changing permissions
- Making legal, financial, medical, or HR-sensitive decisions
- Deleting or overwriting important data

---

## Model-by-model notes

### GPT-5.5

**Best for:** architecture, complex coding, tool-heavy agents, long-context retrieval, final judgement.  
**Use when:** the agent design is unclear, high-impact, or needs a strong baseline.  
**Avoid when:** the task is a repetitive low-risk worker task that a smaller model can handle.

### Claude Opus 4.7

**Best for:** adversarial review, long-horizon reasoning, careful critique, config simplification.  
**Use when:** you need someone to say, “This will break in production, and here is why.”  
**Avoid when:** cost or latency matters more than deep review.

### Composer 2.5

**Best for:** Cursor-native implementation, multi-file edits, repo-aware iteration, test harnesses.  
**Use when:** you want to turn a spec into working config and code.  
**Avoid when:** the task is final governance, policy approval, or high-stakes judgement.

### Gemini 3.5 Flash

**Best for:** subagents, managed-agent experiments, eval generation, long-context scale.  
**Use when:** you need breadth, parallelism, or sandboxed agent infrastructure.  
**Avoid when:** a feature is not yet supported for your target workflow.

### GPT-5.4 mini and other smaller models

**Best for:** cheap repeatable subtasks.  
**Use when:** the task has clear input/output expectations and a tested escalation path.  
**Avoid when:** the task requires policy interpretation, broad judgement, or irreversible action.

---

## Composer 2.5 callout

Composer 2.5 is the most interesting “do not forget this one” model in the stack.

Why it matters:

- It is built specifically for Cursor workflows.
- Cursor says it is better than Composer 2 at sustained long-running work.
- It improves complex instruction following.
- It includes behavioural tuning around communication and effort calibration.
- Independent benchmark coverage places it on a strong cost/performance frontier.
- It is a strong daily-driver candidate when implementation velocity and cost matter.

Recommended use:

```text
Use GPT-5.5 and Claude Opus 4.7 to design and pressure-test the config.
Use Composer 2.5 to implement, patch, test, and iterate inside Cursor.
```

Translation: let the big brains design the race car, then let Composer 2.5 keep it moving round the track without burning the fuel budget like a small yacht.

---

## Source links

### Official model and product sources

- [OpenAI — GPT-5.5 model docs](https://developers.openai.com/api/docs/models/gpt-5.5)
- [OpenAI — Using GPT-5.5 guide](https://developers.openai.com/api/docs/guides/latest-model)
- [OpenAI — GPT-5.4 mini model docs](https://developers.openai.com/api/docs/models/gpt-5.4-mini)
- [Anthropic — Introducing Claude Opus 4.7](https://www.anthropic.com/news/claude-opus-4-7)
- [Anthropic — Claude Opus 4.7 API docs](https://platform.claude.com/docs/en/about-claude/models/whats-new-claude-4-7)
- [Cursor — Introducing Composer 2.5](https://cursor.com/blog/composer-2-5)
- [Google — Gemini 3.5 Flash Interactions API guide](https://ai.google.dev/gemini-api/docs/interactions/whats-new-gemini-3.5)
- [Google — Managed Agents in the Gemini API](https://blog.google/innovation-and-ai/technology/developers-tools/managed-agents-gemini-api/)
- [Google — Building Managed Agents](https://ai.google.dev/gemini-api/docs/custom-agents)

### Agent-building guidance

- [OpenAI — A practical guide to building agents](https://openai.com/business/guides-and-resources/a-practical-guide-to-building-ai-agents/)
- [Anthropic — Building effective agents](https://www.anthropic.com/engineering/building-effective-agents)

### Benchmark / market context

- [Artificial Analysis — Composer 2.5 on the Coding Agent Index](https://artificialanalysis.ai/articles/cursor-composer-2-5-coding-agent-index)

---

## One-line recommendation

Use **GPT-5.5** to architect, **Claude Opus 4.7** to critique, **Composer 2.5** to build in Cursor, **Gemini 3.5 Flash** to scale/evaluate, and **smaller models** for cheap repeatable subagent work once the quality bar is proven.
