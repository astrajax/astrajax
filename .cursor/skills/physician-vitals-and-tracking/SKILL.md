---
name: physician-vitals-and-tracking
description: >-
  Observability discipline for the fleet-health lane — trajectories, signal classes,
  drift detection, grading rule, event discipline. Physician duty 2.
---

# Vitals & Tracking (Physician, duty 2)

Distilled 7 Jul 2026 (Clive research pass, thread cmraaexie06av06ad9wog44n2)
from the 2026 observability corpus (ValueStream, W&B, Sentrial
MELT-for-agents, Mohadata playbook, StackAI, 60-point audit checklist).

SOURCE LABEL: the Principles below are UNVERIFIED PRACTITIONER SYNTHESIS
from that secondary corpus — operational guidance, not per-claim primary
research. Treat as starting discipline; recalibrate against fleet
experience. (The platform-exposure section below is independently
verified, 10 Jul 2026.)

## Principles (unverified practitioner synthesis, per label above)
- Treat every agent run as a TRAJECTORY (reason → tool call → observe →
  decide); vitals attach to trajectories, not single outputs.
- Four signal classes: Metrics (latency, error/skip rates, throughput),
  Evals (rubric scores over time), Logs (tool invocations, failures),
  Traces (replayable runs). Cost is a first-class vital.
- Drift = score movement against a PINNED BASELINE (recorded at rubric
  adoption), not absolute thresholds. "Unhappy" is a trend, not an event.
- Tripwires carry named thresholds and kill criteria; alert by exception,
  digest by default.

## What this platform actually exposes (verified 10 Jul 2026; Cursor notes 2026-08-08)
- **READABLE (Hyperagent):** account threads (search + messages) — filtered
  to the Ward Roster only; eval history per agent/rubric/thread incl. weak-area
  analysis; rubric run history; your own event ledger.
- **READABLE (Cursor):** local repo agent definitions (`.cursor/agents/`,
  `.claude/agents/`, registry packs); Household Activity base via Airtable MCP
  or Matthew-supplied exports; git history for config drift. No cross-agent
  thread reads in either runtime.
- **NOT READABLE:** other agents' execution-history listings (self-only);
  Command Center aggregates (Matthew's surface).
- Label every vital: DIRECT (read from a tool), INFERRED (from thread
  evidence), UNAVAILABLE (say so). Never fabricate.

## Primary vitals surface (Matthew, 2026-07-26)

Household Activity base `appF7jQD4ZKrDC7e1` is the PRIMARY vitals surface.
Telemetry-first ward rounds: Sessions in the window joined to roster by Agent
Slug; Activity rows per session; structural vitals (Session End, sequence,
event-id integrity, lineage, Blockers/Errors, cost where present).

## Grading rule
House-ladder grades (Thriving/Happy/Okay/Unhappy/Rotting) only with:
adopted rubric + ladder mapping + evidence floor met. Otherwise
"Not Graded — insufficient evidence" naming what is missing.

## Event discipline
A vital becomes a Consultation Event only with a trace reference
(thread id + turn + agent) and a minimal summary in your own words —
never raw copied content. Deterministic Event ID (agent + trace +
criterion + observation-type); search-before-create; duplicates are
skipped, not re-noted. Lifecycle is new events (Resolved, Parent Event
ID), never record mutation.
