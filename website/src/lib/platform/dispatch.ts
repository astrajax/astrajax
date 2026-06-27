import type { PaperTrailLine } from "./brain-health";

export type DispatchExecutor =
  | "direct-write"
  | "hyperagent-package"
  | "opus-composer"
  | "escalate";

export type JobStatus =
  | "approved"
  | "running"
  | "draft-ready"
  | "needs-review"
  | "failed"
  | "published";

export interface RoutingRule {
  id: string;
  actionLabel: string;
  executor: DispatchExecutor;
  executorLabel: string;
  rationale: string;
}

export interface ImplementationJob {
  id: string;
  title: string;
  briefReference: string;
  executor: DispatchExecutor;
  executorLabel: string;
  status: JobStatus;
  diffSummary: string;
  promptSummary?: string;
  startedAt?: string;
  completedAt?: string;
}

export interface DispatchGuardrail {
  id: string;
  text: string;
}

export interface DispatchSnapshot {
  brainName: string;
  routingRules: RoutingRule[];
  jobs: ImplementationJob[];
  guardrails: DispatchGuardrail[];
  metaProofNote: string;
}

export const EXECUTOR_LABELS: Record<DispatchExecutor, string> = {
  "direct-write": "Direct structured write",
  "hyperagent-package": "HyperAgent package",
  "opus-composer": "Opus → Composer build",
  escalate: "Escalate, no worker run",
};

export const JOB_STATUS_LABELS: Record<JobStatus, string> = {
  approved: "Approved",
  running: "Running",
  "draft-ready": "Draft ready",
  "needs-review": "Needs review",
  failed: "Failed",
  published: "Published",
};

export const DEFAULT_DISPATCH: DispatchSnapshot = {
  brainName: "Northline Field Ops Brain",
  metaProofNote:
    "Approved brief in, routed executor out, full log on every job. Structured writes go direct, build work goes Opus to Composer. Chapter 3 was built through this loop, see the draft-ready Chapter 3 platform build job below.",
  routingRules: [
    {
      id: "route-truth-promote",
      actionLabel: "Promote approved brain truth to Trusted",
      executor: "direct-write",
      executorLabel: EXECUTOR_LABELS["direct-write"],
      rationale:
        "Schema-bound record write, no repo work. Doc uses direct Airtable tools with full audit trail.",
    },
    {
      id: "route-change-log-draft",
      actionLabel: "Change log, approval stamp, status to Draft",
      executor: "direct-write",
      executorLabel: EXECUTOR_LABELS["direct-write"],
      rationale: "Deterministic structured write, no worker needed.",
    },
    {
      id: "route-fleet-package",
      actionLabel: "Export approved fleet agent to HyperAgent",
      executor: "hyperagent-package",
      executorLabel: EXECUTOR_LABELS["hyperagent-package"],
      rationale:
        "Runtime packaging with scoped tools and governed defaults, not a code change.",
    },
    {
      id: "route-chapter3-build",
      actionLabel: "Build Chapter 3 platform surfaces (Fleet, Deploy, Dispatch, Adoption)",
      executor: "opus-composer",
      executorLabel: EXECUTOR_LABELS["opus-composer"],
      rationale:
        "Bounded implementation work from an approved brief: Opus compiles the prompt, Composer executes in repo.",
    },
    {
      id: "route-interface-ext",
      actionLabel: "Add Airtable interface extension panel",
      executor: "opus-composer",
      executorLabel: EXECUTOR_LABELS["opus-composer"],
      rationale:
        "Multi-file TypeScript build, requires diff review before publish to canonical.",
    },
    {
      id: "route-vague-brief",
      actionLabel: "Unclear scope in approved brief",
      executor: "escalate",
      executorLabel: EXECUTOR_LABELS.escalate,
      rationale:
        "Doc sets job to Needs review. No Composer without a clear approved brief.",
    },
  ],
  jobs: [
    {
      id: "job-ch3-build",
      title: "Chapter 3 platform surfaces",
      briefReference: "Approved brief: downstream loop, Fleet, Deploy, Dispatch, Adoption",
      executor: "opus-composer",
      executorLabel: EXECUTOR_LABELS["opus-composer"],
      status: "draft-ready",
      diffSummary:
        "14 new files, 3 additive edits: seed data, four route shells, FeatureHub + PlatformNav wiring.",
      promptSummary: "Prompt hash ch3-platform-surfaces (Opus compile, 26 Jun)",
      startedAt: "2026-06-26T09:00:00.000Z",
      completedAt: "2026-06-26T11:30:00.000Z",
    },
    {
      id: "job-truth-promote",
      title: "Promote off-script discount guardrail",
      briefReference: "Approved brief: pricing guardrail truth, RM sign-off 24 Jun",
      executor: "direct-write",
      executorLabel: EXECUTOR_LABELS["direct-write"],
      status: "published",
      diffSummary: "Single Trusted truth row created with tamper alarm on change log.",
      startedAt: "2026-06-24T14:00:00.000Z",
      completedAt: "2026-06-24T14:02:00.000Z",
    },
    {
      id: "job-fleet-export",
      title: "Package Forecast Coach for HyperAgent",
      briefReference: "Approved brief: fleet design sign-off, Forecast Coach",
      executor: "hyperagent-package",
      executorLabel: EXECUTOR_LABELS["hyperagent-package"],
      status: "running",
      diffSummary: "Scoped tools + governed defaults bundle assembling…",
      startedAt: "2026-06-26T10:15:00.000Z",
    },
    {
      id: "job-vague-interface",
      title: "New dashboard widget (scope unclear)",
      briefReference: "Approved brief: dashboard refresh, missing acceptance criteria",
      executor: "opus-composer",
      executorLabel: EXECUTOR_LABELS["opus-composer"],
      status: "needs-review",
      diffSummary: "Doc escalated, brief lacks widget boundaries. No worker started.",
      promptSummary: "Prompt hash dashboard-refresh (held, scope incomplete)",
    },
    {
      id: "job-failed-migration",
      title: "Legacy schema migration script",
      briefReference: "Approved brief: data migration v2, superseded by v3 workshop row",
      executor: "opus-composer",
      executorLabel: EXECUTOR_LABELS["opus-composer"],
      status: "failed",
      diffSummary: "Composer run halted, brief referenced retired schema. Awaiting revised brief.",
      promptSummary: "Prompt hash legacy-migration-v2 (run halted)",
      startedAt: "2026-06-25T16:00:00.000Z",
      completedAt: "2026-06-25T16:45:00.000Z",
    },
    {
      id: "job-approved-coach",
      title: "Coach shell calibration table refresh",
      briefReference: "Approved brief: user brain calibration copy update",
      executor: "opus-composer",
      executorLabel: EXECUTOR_LABELS["opus-composer"],
      status: "approved",
      diffSummary: "Queued, waiting for worker pickup.",
      promptSummary: "Prompt hash coach-calibration-copy (queued)",
    },
  ],
  guardrails: [
    {
      id: "g1",
      text: "No Composer run without an approved brief; vague scope stays in Needs review.",
    },
    {
      id: "g2",
      text: "Structured writes skip Composer, context records go through direct Doc tools.",
    },
    {
      id: "g3",
      text: "Output lands in Draft, Composer implements; humans publish to canonical.",
    },
    {
      id: "g4",
      text: "Brief and diff logged on every job; Composer runs also record the compiled prompt summary.",
    },
    {
      id: "g5",
      text: "Doc escalates, not guesses, vague briefs become Needs review, not orphan runs.",
    },
    {
      id: "g6",
      text: "Users do not chat with Doc for exploration, dispatch is backend orchestration, not a second reasoning thread.",
    },
  ],
};

export function createPublishPaperTrail(
  jobTitle: string,
  actor: string,
  promptSummary?: string,
): PaperTrailLine {
  const promptNote = promptSummary ? ` Prompt: ${promptSummary}.` : "";
  return {
    id: `pt-publish-${Date.now()}`,
    action: `Published to canonical: ${jobTitle}`,
    actor,
    reason: `Human gate: draft reviewed and promoted from implementation output.${promptNote}`,
    timestamp: new Date().toISOString(),
  };
}

export function routingExecutorPillClass(executor: DispatchExecutor): string {
  switch (executor) {
    case "opus-composer":
      return "status-pill--live";
    case "hyperagent-package":
      return "status-pill--clean";
    case "escalate":
      return "status-pill--review";
    default:
      return "status-pill--pending";
  }
}

export function jobStatusPillClass(status: JobStatus): string {
  switch (status) {
    case "approved":
      return "status-pill--pending";
    case "running":
      return "status-pill--clean";
    case "draft-ready":
      return "status-pill--live";
    case "needs-review":
      return "status-pill--review";
    case "failed":
      return "status-pill--failed";
    case "published":
      return "status-pill--live";
    default:
      return "status-pill--pending";
  }
}
