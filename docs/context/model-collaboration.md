# Model Collaboration Context Pack

**Status:** Bootstrap draft.  
**Primary destination:** Cursor/GitHub.  
**Owner:** Matthew.  
**Primary sources:** `agent-model-collaboration-stack-notion.md`,
`best-models-for-context-environments-notion.md`.

## Purpose

Define practical model roles for designing, curating, packaging, implementing,
and evaluating Clive context environments.

## Working Policy

Start with one strong model and clear tool boundaries. Add subagents or routing
only when real workflow evidence shows a need for parallelism, specialisation,
or cost control.

## Model Roles

- GPT-5.5: architecture, schema design, first agent config, context packaging,
  eval design.
- Claude Opus 4.7: judgement-heavy curation, adversarial review, conflict
  detection, risk review.
- Composer 2.5: Cursor-native implementation, repo changes, multi-file edits,
  test harnesses.
- Gemini 3.5 Flash: later bulk ingestion, eval generation, scale, and
  subagent experiments.
- Smaller/cheaper models: repeatable classification and summarisation only
  after the quality bar is proven.

## Context Environment Workflow

```text
Ingest wide -> retrieve carefully -> curate aggressively -> package cleanly -> version everything -> evaluate continuously
```

## V1 Rule

Curator V1 should run as a strong single agent. The model committee is a design
policy, not a requirement to activate multi-model orchestration before the
baseline works.

## Source IDs

- `SRC-MODEL-STACK`: `agent-model-collaboration-stack-notion.md`
- `SRC-CONTEXT-MODELS`: `best-models-for-context-environments-notion.md`
