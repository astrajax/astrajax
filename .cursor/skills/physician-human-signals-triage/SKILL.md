---
name: physician-human-signals-triage
description: >-
  Human-feedback triage discipline — implicit vs explicit signals, trace-attached
  evidence, intake-candidate routing. Physician duty 4.
---

# Human-Signals Triage (Physician, duty 4)

Distilled 7 Jul 2026 (Clive research pass, thread cmraaexie06av06ad9wog44n2).
Primary research: Implicit User Feedback in Human-LLM Dialogues
https://arxiv.org/abs/2507.23158 (implicit feedback is useful but NOISY
and context-dependent); Naturally Occurring Feedback
https://arxiv.org/abs/2407.10944 (extractable at scale). Secondary
(practitioner): Confident AI HITL guide, tianpan feedback-loop essays,
FutureAGI six-stage loop, Maxim HITL framework, AI/TLDR signal taxonomy.

## Signals (starting heuristics, not laws)
- HEURISTIC (secondary sources): explicit ratings are sparse (~1–3%
  response) and outlier-biased; implicit signals are the dense stream
  (~20–60%): corrections, rephrases, regenerations, abandonment,
  escalations, copy/reuse.
- HEURISTIC: a user correcting an agent twice in one thread is a strong
  triage-priority signal — treat as priority, not proof. Primary research
  warns implicit signals are noisy and task-dependent: REVIEW IN TRACE
  CONTEXT before diagnosis; Concern/Urgent requires corroboration (two
  independent signals, or one reviewed in full trace context).
- The unit of feedback is an annotation attached to a REPLAYABLE TRACE
  (thread id + turn). A floating complaint is gossip, not evidence.

## The loop
Capture → join to trace context → calibrate → route → fix → verify.
The Physician owns capture-through-route; fix is Doc's lane (via
Matthew's Red gate); verify is the discharge criterion on the
prescription.

## Fleet mapping
- Clive's Man's digests and Ambient Capture ARE the implicit-signal
  stream. Consume; never duplicate their capture.
- Triage outcomes: (a) symptom → Observation event with trace reference;
  (b) canon-worthy context → intake-candidate event (paste-ready draft)
  surfaced in the digest for the Man's lane — NEVER a direct Workshop
  write; (c) noise → drop, note nothing.
- Route to human review by exception only (uncertainty, high stakes,
  novelty, drift). The goal is a maturing eval system that SHRINKS human
  review — the Autonomy & Gating Policy restated as evaluation practice.
