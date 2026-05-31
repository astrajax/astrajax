# Best Models for Compiling and Curating Context Environments

**Research date:** 24 May 2026  
**Use case:** Choosing model collaborators for building, maintaining, and improving *context environments* for AI agents and knowledge workflows.

---

## Working definition

A **context environment** is the curated information layer an agent or AI workflow can draw from.

It usually includes:

- Source documents, files, emails, tickets, product specs, CRM notes, code repositories, meeting notes, web research, and decision logs
- A context map: taxonomy, source-of-truth hierarchy, glossary, entities, owners, freshness rules, and permissions
- Agent instructions: `AGENTS.md`, `SKILL.md`, system/developer prompts, tool descriptions, escalation rules, and output contracts
- Retrieval infrastructure: vector stores, file search, embeddings, rerankers, citations, metadata filters, and provenance
- Memory: durable user/project facts, scratchpads, task state, resolved decisions, unresolved questions, and expiry rules
- Eval packs: test questions, adversarial cases, expected citations, failure modes, and quality rubrics

In plain English: this is the agent’s “briefing room.” If that room is messy, even the smartest model starts acting like it has been handed a shoebox of receipts and told to do strategy.

---

## Executive answer

The best setup is **not one model**. The best setup is a small model committee:

| Role | Best model/tooling | Why |
|---|---|---|
| Primary context curator | **Claude Opus 4.7** | Best fit for judgement-heavy curation, long-horizon knowledge work, memory usage, ambiguity handling, and identifying what should or should not survive into the context layer. |
| Context architect and final packager | **GPT-5.5** | Best fit for designing context contracts, structured outputs, grounded assistants, long-context retrieval workflows, and polished reference packs. |
| Bulk ingestion and large-corpus sweep | **Gemini 3.5 Flash** | Strong fit for fast, scaled ingestion with 1M-token context, agentic loops, long-horizon tasks, File Search, and Managed Agents. |
| Specialist retrieval/pruning subagent | **Chroma Context-1** | Purpose-built for agentic search: decompose queries, search iteratively, rank documents, and self-edit/prune its own context. |
| Reranking layer | **Cohere Rerank 4**, **Voyage AI rerankers**, or **Jina rerankers** | Use after initial retrieval to reduce noise before handing context to a frontier model. |
| Embedding layer | **Gemini Embedding 2**, **Jina Embeddings v4**, **Voyage embeddings**, **Cohere Embed**, or **OpenAI embeddings/File Search** | Pick based on modality, language, ecosystem, latency, and evaluation on your own corpus. |
| Codebase context environment builder | **Composer 2.5 in Cursor** | Excellent for creating and maintaining repo-local context assets: `AGENTS.md`, `SKILL.md`, repo maps, Cursor rules, tests, and implementation docs. |
| Enterprise multilingual RAG option | **Cohere Command A / Command A+** | Strong option where enterprise RAG, multilingual retrieval, tool use, and deployability matter. |

**Recommended default stack:**  
**Claude Opus 4.7 → GPT-5.5 → Gemini 3.5 Flash → Chroma Context-1 / Cohere Rerank 4 → Composer 2.5**

---

## My practical ranking

### 1. Claude Opus 4.7 — best judgement-heavy context curator

Use Claude Opus 4.7 when the problem is not “summarise this pile,” but “decide what matters, what conflicts, what is stale, what is missing, and what should become memory.”

Best for:

- Curating project memory
- Turning messy source material into a clean context map
- Finding contradictions and missing evidence
- Reviewing whether context is overstuffed or under-specified
- Maintaining long-running project state
- Building durable “how this project works” context
- Red-teaming context packs before they are used by agents

Why it matters:

- Claude Opus 4.7 supports a **1M token context window** and **128k max output tokens**.
- Anthropic says Opus 4.7 performs well on long-horizon agentic work, knowledge work, vision tasks, and memory tasks.
- It is specifically better at writing and using file-system-based memory, including scratchpads, notes files, and structured memory stores.
- Anthropic’s context engineering guidance is also unusually strong: it treats context as the full state available to the model, not just a prompt.

Best prompt role:

```text
You are the context curator.

Your job is to decide what information should survive into the agent's reusable context environment.

For every source, classify:
- Relevance
- Source authority
- Freshness
- Reusability
- Risk if included
- Risk if omitted
- Conflicts with other sources
- Suggested destination: system instruction, project memory, retrieval store, eval case, or discard

Return a structured context map and a list of open questions.
```

Sources:  
[Claude Opus 4.7 docs](https://platform.claude.com/docs/en/about-claude/models/whats-new-claude-4-7)  
[Claude Opus 4.7 announcement](https://www.anthropic.com/news/claude-opus-4-7)  
[Anthropic: Effective context engineering for AI agents](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents)  
[Anthropic: Compaction](https://platform.claude.com/docs/en/build-with-claude/compaction)  
[Anthropic: Prompt caching](https://platform.claude.com/docs/en/build-with-claude/prompt-caching)

---

### 2. GPT-5.5 — best context architect and final synthesis model

Use GPT-5.5 when you need the context environment to become a clean, usable operating asset.

Best for:

- Designing context schemas
- Creating source-of-truth hierarchies
- Producing structured context packs
- Turning messy research into polished reference docs
- Creating reusable templates and eval rubrics
- Building grounded assistant workflows
- Designing retrieval, compaction, and prompt-caching strategies
- Producing final documentation for humans and agents

Why it matters:

- OpenAI lists GPT-5.5 as a frontier model for complex professional work.
- GPT-5.5 has a **1,050,000 token context window** and **128,000 max output tokens**.
- OpenAI’s GPT-5.5 guide describes it as a strong fit for tool-heavy agents, grounded assistants, long-context retrieval, and product-spec-to-plan workflows.
- OpenAI supports File Search, prompt caching, and compaction, which are all directly relevant to context environments.

Best prompt role:

```text
You are the context architect.

Design a reusable context environment for this workflow.

Return:
1. Context purpose
2. Source-of-truth hierarchy
3. Context map
4. Memory schema
5. Retrieval schema
6. Prompt/context packing rules
7. Staleness and expiry rules
8. Permission boundaries
9. Eval pack
10. Versioning and maintenance process
```

Sources:  
[GPT-5.5 model docs](https://developers.openai.com/api/docs/models/gpt-5.5)  
[Using GPT-5.5](https://developers.openai.com/api/docs/guides/latest-model)  
[OpenAI File Search](https://developers.openai.com/api/docs/guides/tools-file-search)  
[OpenAI Prompt Caching](https://developers.openai.com/api/docs/guides/prompt-caching)  
[OpenAI Compaction](https://developers.openai.com/api/docs/guides/compaction)  
[OpenAI Practical Guide to Building Agents](https://openai.com/business/guides-and-resources/a-practical-guide-to-building-ai-agents/)

---

### 3. Gemini 3.5 Flash — best bulk ingestion and scaled context environment work

Use Gemini 3.5 Flash when the job involves lots of documents, repeated analysis, parallel agent loops, or hosted sandbox execution.

Best for:

- First-pass corpus scanning
- Long-document ingestion
- Massive source triage
- Generating context summaries from many files
- Running subagent-style context jobs
- Creating draft context packs at scale
- Building in the Google AI / Gemini ecosystem
- Managed sandboxed agent execution

Why it matters:

- Gemini 3.5 Flash is generally available and stable.
- Google says it supports a **1M token context window**, **65k max output tokens**, thinking, long-horizon workflows, sub-agent deployment, and rapid agentic loops.
- Gemini File Search imports, chunks, indexes, and retrieves files for RAG, including text embeddings through `gemini-embedding-001` and multimodal/image embeddings through `gemini-embedding-2`.
- Gemini Managed Agents can run agents in isolated Linux environments, preserve environment state, and define custom agents through files such as `AGENTS.md` and `SKILL.md`.

Best prompt role:

```text
You are the bulk context ingestion agent.

Read the supplied corpus and produce:
1. Source inventory
2. Source clusters
3. Key facts
4. Repeated concepts
5. Conflicting claims
6. Stale or weak sources
7. Candidate glossary
8. Candidate memory items
9. Suggested retrieval metadata
10. Questions for the primary curator
```

Sources:  
[Gemini 3.5 Flash docs](https://ai.google.dev/gemini-api/docs/interactions/whats-new-gemini-3.5)  
[Gemini Long Context](https://ai.google.dev/gemini-api/docs/long-context)  
[Gemini File Search](https://ai.google.dev/gemini-api/docs/file-search)  
[Gemini Context Caching](https://ai.google.dev/gemini-api/docs/caching)  
[Google Managed Agents](https://blog.google/innovation-and-ai/technology/developers-tools/managed-agents-gemini-api/)  
[Building Managed Agents](https://ai.google.dev/gemini-api/docs/custom-agents)

---

### 4. Chroma Context-1 — best specialist context retrieval and pruning subagent

Use Chroma Context-1 when the bottleneck is retrieval quality, not final reasoning.

Best for:

- Agentic search
- Multi-hop retrieval
- Finding relevant documents across a corpus
- Ranking candidate documents
- Pruning irrelevant documents from the active context
- Acting as a retrieval subagent underneath GPT-5.5, Claude, or Gemini

Why it matters:

- Chroma describes Context-1 as a **20B parameter agentic search model**.
- It is designed to be used as a subagent with a frontier reasoning model.
- Given a query, it produces a ranked list of documents relevant to satisfying the query.
- It is trained to decompose queries into subqueries, iteratively search a corpus, and selectively edit its own context.

Best prompt role:

```text
You are the retrieval-pruning subagent.

Given this user goal and candidate corpus:
1. Decompose the information need into subqueries
2. Retrieve broadly first
3. Rerank for actual utility
4. Remove irrelevant or redundant material
5. Return only evidence that changes the answer
6. Include source IDs and reasons for inclusion
```

Source:  
[Chroma Context-1: Training a Self-Editing Search Agent](https://www.trychroma.com/research/context-1)

---

### 5. Composer 2.5 — best for codebase context environments in Cursor

Composer 2.5 is not my first choice for general enterprise knowledge curation. It **is** one of the best choices for implementing and maintaining context environments inside a codebase.

Best for:

- Creating `AGENTS.md`
- Creating `SKILL.md`
- Writing repo maps
- Maintaining Cursor rules
- Building context fixtures
- Generating eval files
- Turning model recommendations into versioned repo assets
- Updating docs alongside code
- Refactoring context files after architecture changes

Why it matters:

- Cursor says Composer 2.5 is a substantial improvement over Composer 2, especially on sustained long-running tasks and complex instruction following.
- Artificial Analysis ranked Composer 2.5 third on its Coding Agent Index behind Claude Opus 4.7 and GPT-5.5 variants, while being materially cheaper per task.
- Composer 2.5’s real value here is not “knows everything.” Its value is that it lives where repo context is created, edited, tested, and versioned.

Best prompt role:

```text
Use Composer 2.5 inside Cursor.

Implement the context environment as repo-local assets.

Create:
- AGENTS.md
- SKILL.md
- docs/context-map.md
- docs/source-of-truth.md
- docs/memory-policy.md
- evals/context_quality_cases.jsonl
- scripts/context_audit.py

Rules:
- Keep files small and composable
- Add clear source IDs
- Add freshness and owner metadata
- Add tests for stale, conflicting, and missing context
- Do not invent project facts
```

Sources:  
[Cursor: Introducing Composer 2.5](https://cursor.com/blog/composer-2-5)  
[Artificial Analysis: Composer 2.5 Coding Agent Index](https://artificialanalysis.ai/articles/cursor-composer-2-5-coding-agent-index)  
[How Kimi, Cursor, and Chroma Train Agentic Models with RL](https://www.philschmid.de/kimi-composer-context)

---

## Retrieval and RAG layer recommendations

For context environments, the retrieval layer often matters as much as the final chat model.

### Best retrieval pattern

```text
Source corpus
→ source inventory
→ chunking / parsing
→ embeddings
→ lexical + vector retrieval
→ reranking
→ context pruning
→ source-grounded synthesis
→ memory update
→ eval
```

### Recommended retrieval stack

| Layer | Good options | Notes |
|---|---|---|
| Hosted file search | OpenAI File Search, Gemini File Search | Fastest route if you are already in one ecosystem. |
| Embeddings | Gemini Embedding 2, Jina Embeddings v4, Voyage embeddings, Cohere Embed, OpenAI embeddings | Test against your own corpus. Public leaderboards rarely predict every domain. |
| Reranking | Cohere Rerank 4, Voyage rerankers, Jina rerankers | Use reranking when vector search returns “kind of related” chunks rather than truly useful evidence. |
| Agentic search | Chroma Context-1 | Use for multi-hop retrieval and context pruning. |
| Final synthesis | Claude Opus 4.7 or GPT-5.5 | Use after retrieval has already reduced noise. |

### Notes on specific retrieval tools

**Cohere Rerank 4**  
Best when you already have candidate documents and need to rank them by semantic relevance before passing them into a context pack or RAG answer. Cohere’s docs describe rerankers as sorting documents from most to least relevant for a query.

**Voyage AI**  
Strong general option for embedding and reranking APIs. Voyage positions its models as modular components that integrate with vector stores and generative LLMs.

**Jina Embeddings v4**  
Strong option for multimodal and multilingual retrieval. It supports text and image representations, single-vector and multi-vector embeddings, and long-context inputs up to 32,768 tokens.

**Gemini File Search / Gemini Embedding 2**  
Especially useful when your context environment is document-heavy, PDF/image-heavy, or already in the Google ecosystem.

Sources:  
[Cohere Rerank 4](https://cohere.com/blog/rerank-4)  
[Cohere Rerank docs](https://docs.cohere.com/docs/rerank-overview)  
[Voyage AI docs](https://docs.voyageai.com/docs/introduction)  
[Jina Embeddings v4](https://jina.ai/models/jina-embeddings-v4/)  
[Gemini File Search](https://ai.google.dev/gemini-api/docs/file-search)

---

## Model choice by context environment type

| Context environment type | Best primary model | Best support models/tools |
|---|---|---|
| Personal operating context | Claude Opus 4.7 | GPT-5.5 for structure; Gemini 3.5 Flash for ingestion |
| Team/project knowledge base | GPT-5.5 | Claude Opus 4.7 for audit; Cohere/Chroma for retrieval |
| Sales/account intelligence hub | GPT-5.5 | Claude Opus 4.7 for contradiction checks; Gemini for large-account docs |
| Product/spec context | GPT-5.5 | Claude for critique; Composer 2.5 for repo implementation |
| Codebase context | Composer 2.5 | Claude Opus 4.7 or GPT-5.5 for architecture reviews |
| Enterprise RAG | Claude Opus 4.7 or GPT-5.5 | Chroma Context-1, Cohere Rerank 4, Voyage/Jina/Gemini embeddings |
| Multimodal docs | Gemini 3.5 Flash or Claude Opus 4.7 | Jina Embeddings v4; Gemini File Search |
| Long-running agent memory | Claude Opus 4.7 | Anthropic/OpenAI compaction; file-system memory |
| High-volume cheap triage | Gemini 3.5 Flash | Smaller models for classification; rerankers for quality |
| Notion / Markdown context packs | GPT-5.5 | Claude for audit; Composer 2.5 if stored in repo |

---

## The best working stack

### “Context Environment Committee”

Use this division of labour:

1. **Gemini 3.5 Flash** does the first broad sweep.
2. **Chroma Context-1** or a reranker reduces noise.
3. **Claude Opus 4.7** decides what survives into durable context.
4. **GPT-5.5** turns the curated material into structured, reusable context assets.
5. **Composer 2.5** implements the assets inside the repo or Cursor workspace.
6. **A smaller/cheaper model** runs recurring hygiene checks.

The strongest pattern:

```text
Ingest wide → retrieve carefully → curate aggressively → package cleanly → version everything → evaluate continuously
```

---

## Suggested workflow

### Step 1: Source inventory

Create a source registry before summarising anything.

Minimum fields:

| Field | Meaning |
|---|---|
| Source ID | Stable ID for citation and retrieval |
| Title | Human-readable name |
| Type | Doc, repo, CRM, meeting note, email, web page, ticket, etc. |
| Owner | Person/team accountable |
| Date | Created/updated date |
| Authority | Canonical, supporting, historical, anecdotal |
| Freshness | Current, ageing, stale, unknown |
| Permissions | Who/what can use it |
| Key claims | Important facts |
| Conflicts | Known contradictions |
| Destination | Memory, RAG, prompt, eval, discard |

### Step 2: Context map

Create a map of the environment:

```markdown
# Context Map

## Purpose

## Source-of-truth hierarchy

## Core entities

## Glossary

## Key workflows

## Current decisions

## Open questions

## Known conflicts

## Retrieval metadata

## Memory policy

## Update cadence

## Evaluation cases
```

### Step 3: Curation pass

Claude Opus 4.7 is the best first choice here.

Ask it:

```text
Review this source inventory and context map.

Decide:
- What should become durable memory
- What should stay retrievable only
- What should be excluded
- What needs source verification
- What is stale
- What conflicts with higher-authority sources
- What context is missing
```

### Step 4: Packaging pass

GPT-5.5 is the best first choice here.

Ask it:

```text
Turn this curated context into production-ready context assets.

Create:
1. AGENTS.md
2. SKILL.md
3. Context pack
4. Memory schema
5. Retrieval schema
6. Evaluation cases
7. Maintenance checklist

Keep everything concise, source-linked, and versionable.
```

### Step 5: Repo implementation

Composer 2.5 is the best first choice here.

Ask it:

```text
Implement these context assets in the repository.

Requirements:
- Create a /docs/context directory
- Create AGENTS.md and SKILL.md
- Add context audit tests
- Add JSONL eval fixtures
- Add source IDs everywhere
- Add update instructions
- Keep diffs small and reviewable
```

### Step 6: Quality evaluation

Run recurring checks:

```text
Evaluate this context environment against the following:

1. Source coverage
2. Freshness
3. Contradictions
4. Permission safety
5. Token efficiency
6. Retrieval precision
7. Missing entities
8. Reusable memory quality
9. Agent instruction clarity
10. Human readability
```

---

## Context quality rubric

Score every context environment from 1–5.

| Dimension | What good looks like |
|---|---|
| Relevance | Context directly supports the agent’s tasks. |
| Authority | Canonical sources outrank anecdotal or stale sources. |
| Freshness | Dates, owners, and expiry rules are clear. |
| Completeness | Key entities, workflows, constraints, and exceptions are covered. |
| Brevity | Context is dense, not bloated. No “corporate soup.” |
| Retrieval quality | Search returns useful evidence, not loosely related chunks. |
| Conflict handling | Contradictions are marked, not silently blended. |
| Permission safety | Sensitive context is scoped to allowed workflows. |
| Memory quality | Durable facts are stable, useful, and correctable. |
| Versionability | Context files can be diffed, reviewed, and rolled back. |
| Evaluation | There are test cases for context failures. |

---

## What to avoid

### Avoid “giant prompt syndrome”

A 1M-token window does not mean you should use 1M tokens every time. Long context can help, but stale or irrelevant context still distracts the model. Use curation, retrieval, and compaction.

### Avoid treating summaries as truth

Summaries are lossy. Keep source IDs and links back to raw evidence.

### Avoid one memory bucket

Split memory into:

- Durable facts
- Project decisions
- User preferences
- Temporary task state
- Scratchpad notes
- Deprecated facts

### Avoid hiding uncertainty

A good context environment should explicitly show:

- Unknowns
- Conflicts
- Stale assumptions
- Weak sources
- Permission boundaries

### Avoid overusing frontier models for every step

Use frontier models for judgement. Use cheaper models or specialist retrieval systems for repeatable triage.

---

## Best model by job-to-be-done

| Job | Best pick |
|---|---|
| Decide what belongs in durable context | Claude Opus 4.7 |
| Turn curated material into clean docs/templates | GPT-5.5 |
| Ingest a huge pile of files quickly | Gemini 3.5 Flash |
| Search and prune noisy evidence | Chroma Context-1 |
| Rerank retrieved chunks | Cohere Rerank 4 |
| Build repo-local context files | Composer 2.5 |
| Multimodal retrieval | Jina Embeddings v4 or Gemini Embedding 2 |
| Enterprise RAG with multilingual requirements | Cohere Command A / Command A+ |
| Hosted RAG in OpenAI ecosystem | OpenAI File Search + GPT-5.5 |
| Hosted RAG in Google ecosystem | Gemini File Search + Gemini 3.5 Flash |
| Ongoing context hygiene | Smaller/cheaper model plus scheduled evals |

---

## Recommended prompts

### Context environment architect

```text
You are designing a context environment for an AI agent.

The goal of the environment is:
[GOAL]

Available sources:
[SOURCES]

Produce:
1. Context environment purpose
2. Source-of-truth hierarchy
3. Required memory objects
4. Retrieval metadata schema
5. Context packing rules
6. Exclusion rules
7. Staleness rules
8. Permission boundaries
9. Eval questions
10. Maintenance workflow

Do not invent facts. Mark unknowns clearly.
```

### Source curator

```text
Review these sources and classify each one.

For each source, return:
- Source ID
- Summary
- Key facts
- Authority level
- Freshness
- Relevance
- Conflicts
- Sensitive data risk
- Recommended destination
- Include/exclude decision
- Reasoning summary
```

### Context compactor

```text
Compress this project history into durable context.

Preserve:
- Decisions
- Constraints
- Named entities
- Open tasks
- Current plan
- Risks
- Source IDs
- Things the agent must not forget

Remove:
- Chit-chat
- Duplicates
- Resolved intermediate steps
- Unverified claims
- Low-value tool logs

Return a compact, source-linked memory object.
```

### Retrieval critic

```text
Given the user goal and retrieved context, judge the retrieval quality.

Return:
1. Relevant chunks
2. Irrelevant chunks
3. Missing evidence
4. Duplicates
5. Conflicts
6. Suggested follow-up searches
7. Final context pack under [TOKEN_LIMIT] tokens
```

### Composer 2.5 implementation prompt

```text
You are working inside Cursor with Composer 2.5.

Create a versioned context environment for this repo.

Deliverables:
- AGENTS.md
- SKILL.md
- docs/context/context-map.md
- docs/context/source-registry.md
- docs/context/memory-policy.md
- docs/context/retrieval-schema.md
- evals/context_quality_cases.jsonl

Constraints:
- Keep each file concise
- Use source IDs
- Add maintenance instructions
- Add eval cases for stale, missing, conflicting, and overbroad context
- Do not make code changes unless needed to support the context audit
```

---

## Suggested file structure

```text
/context
  source-registry.md
  context-map.md
  source-of-truth.md
  glossary.md
  memory-policy.md
  retrieval-schema.md
  permissions.md
  eval-rubric.md

/evals
  context_quality_cases.jsonl
  retrieval_precision_cases.jsonl
  memory_regression_cases.jsonl

AGENTS.md
SKILL.md
```

---

## Example `AGENTS.md` skeleton

```markdown
# Agent Operating Context

## Mission

## Non-goals

## Source-of-truth hierarchy

1. Canonical internal docs
2. Current project decisions
3. Approved external sources
4. Historical notes
5. Anecdotal notes

## Context rules

- Prefer current canonical sources.
- Mark stale or conflicting sources.
- Do not treat summaries as source-of-truth.
- Use source IDs when making factual claims.
- Ask for missing source access rather than guessing.

## Memory rules

- Store only stable, reusable facts.
- Expire temporary assumptions.
- Keep unresolved questions separate from decisions.
- Never overwrite a higher-authority source with a lower-authority note.

## Retrieval rules

- Retrieve before answering factual/domain-specific questions.
- Rerank retrieved material.
- Exclude irrelevant chunks.
- Cite source IDs.

## Escalation

Escalate to a human when:
- Sources conflict
- Permissions are unclear
- Required evidence is missing
- The action has legal, financial, security, or customer-impacting consequences
```

---

## My final recommendation

For compiling and curating context environments, I would use this exact setup:

```text
Claude Opus 4.7 = curator and memory judge
GPT-5.5 = architect and final context packager
Gemini 3.5 Flash = bulk ingestion and scaled processing
Chroma Context-1 = search/pruning subagent
Cohere Rerank 4 / Voyage / Jina / Gemini embeddings = retrieval quality layer
Composer 2.5 = repo-local implementation and maintenance
```

The one-line version:

> **Use Claude to decide what matters, GPT-5.5 to make it operational, Gemini to process at scale, Chroma/Cohere/Voyage/Jina to retrieve signal, and Composer 2.5 to make the whole thing live in the repo without becoming context spaghetti.**

---

## Source list

- [Anthropic: Effective context engineering for AI agents](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents)
- [Anthropic: Claude Opus 4.7 docs](https://platform.claude.com/docs/en/about-claude/models/whats-new-claude-4-7)
- [Anthropic: Claude Opus 4.7 announcement](https://www.anthropic.com/news/claude-opus-4-7)
- [Anthropic: Compaction](https://platform.claude.com/docs/en/build-with-claude/compaction)
- [Anthropic: Prompt caching](https://platform.claude.com/docs/en/build-with-claude/prompt-caching)
- [OpenAI: GPT-5.5 model docs](https://developers.openai.com/api/docs/models/gpt-5.5)
- [OpenAI: Using GPT-5.5](https://developers.openai.com/api/docs/guides/latest-model)
- [OpenAI: File Search](https://developers.openai.com/api/docs/guides/tools-file-search)
- [OpenAI: Prompt Caching](https://developers.openai.com/api/docs/guides/prompt-caching)
- [OpenAI: Compaction](https://developers.openai.com/api/docs/guides/compaction)
- [OpenAI: Practical guide to building agents](https://openai.com/business/guides-and-resources/a-practical-guide-to-building-ai-agents/)
- [Google: Gemini 3.5 Flash docs](https://ai.google.dev/gemini-api/docs/interactions/whats-new-gemini-3.5)
- [Google: Gemini Long Context](https://ai.google.dev/gemini-api/docs/long-context)
- [Google: Gemini File Search](https://ai.google.dev/gemini-api/docs/file-search)
- [Google: Gemini Context Caching](https://ai.google.dev/gemini-api/docs/caching)
- [Google: Managed Agents](https://blog.google/innovation-and-ai/technology/developers-tools/managed-agents-gemini-api/)
- [Chroma: Context-1](https://www.trychroma.com/research/context-1)
- [Cursor: Composer 2.5](https://cursor.com/blog/composer-2-5)
- [Artificial Analysis: Composer 2.5 Coding Agent Index](https://artificialanalysis.ai/articles/cursor-composer-2-5-coding-agent-index)
- [Cohere: Rerank 4](https://cohere.com/blog/rerank-4)
- [Cohere: Rerank docs](https://docs.cohere.com/docs/rerank-overview)
- [Cohere: Model overview](https://docs.cohere.com/docs/models)
- [Voyage AI docs](https://docs.voyageai.com/docs/introduction)
- [Jina Embeddings v4](https://jina.ai/models/jina-embeddings-v4/)
- [LangChain: Context engineering in agents](https://docs.langchain.com/oss/python/langchain/context-engineering)