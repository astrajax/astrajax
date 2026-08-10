---
name: physician-rubric-craft
description: >-
  Rubric design and calibration discipline for the fleet-health lane — orthogonal
  dimensions, adoption contract, platform mapping. Physician duty 1.
---

# Rubric Craft (Physician, duty 1)

Distilled 7 Jul 2026 (Clive research pass, thread cmraaexie06av06ad9wog44n2).
Primary sources: AdaRubric https://arxiv.org/abs/2603.21362 (task-specific,
orthogonal dimensions; concrete level definitions); Autorubric
https://arxiv.org/abs/2603.00077 (atomic criteria, coarse scales, explicit
uncertainty, psychometric reliability). Secondary: LangChain
judge-calibration guide, G-Eval 2026 guide, Deepchecks & luismori bias
catalogues.

## Design (research-backed)
- Derive dimensions from the task's success criteria — orthogonal,
  complete, calibrated; reuse across a task family. [AdaRubric]
- One dimension per criterion; prefer binary/coarse scales; define every
  scale point concretely; include an explicit CANNOT_ASSESS verdict.
  [Autorubric]
- Tell the judge what to IGNORE (counters verbosity bias); require
  score + one-line rationale; preserve judge reasoning for regression
  diagnosis. [secondary guides]
- General (style/process) vs fact-based (per-run ground truth) criteria
  map 1:1 to the platform's rubric types; auto-eval is safe only for the
  former.

## Calibration (starting heuristics — operational, NOT universal laws)
- Pin judge model + rubric version together; recalibrate when either
  changes.
- HEURISTIC: 50–200 human-labelled examples per rubric, agreement target
  Cohen's kappa ≥ ~0.6 — a widely used starting point, not a law. At
  current fleet volume, treat Matthew's explicit agreements/disagreements
  with scores as the label stream and record them as calibration events.
- Judge biases to control: verbosity, self-preference, score drift,
  false precision.

## Adoption contract (fleet-specific)
Adopting a rubric for an agent REQUIRES, in the adoption record:
(a) the rubric + judge-model version pair; (b) the rubric-score →
house-ladder mapping; (c) the evidence floor (minimum scored runs per
window) below which the agent is Not Graded; (d) the pinned baseline for
drift detection.

## Platform mapping
- Eval-history insight types decide treatment: `rubric_mismatch` =
  CALIBRATION work on the rubric; `confirmed_weak` = PRESCRIPTION work on
  the agent. Never tune a threshold to make a bad score pass.
- Rubric updates are confirm-gated; there is no pin action and no
  suggestions-inbox action on the agent surface — record such needs as
  platform-limited asks for Matthew, batched into the digest.

## Tiering
Drafts GREEN; adoption AMBER (record + notify); canon promotion RED.
