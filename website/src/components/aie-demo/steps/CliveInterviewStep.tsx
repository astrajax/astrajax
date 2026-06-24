"use client";

import {
  CLIVE_DRAFT_SUMMARY,
  CLIVE_INTERVIEW_PROMPTS,
} from "@/lib/aie-demo/demo-data";
import type { StepProps } from "@/lib/aie-demo/types";
import { SEEDLING_HEADER_LABEL, UI_STATE_COPY } from "@/lib/brains/ui-states";

export function CliveInterviewStep({ state, onNext, onBack }: StepProps) {
  const pamNote =
    state.userBrain?.pamSensitivity === "high"
      ? "Pam will be suggested sooner when scope or evidence wobbles."
      : state.userBrain?.pamSensitivity === "low"
        ? "Mandatory Pam still applies at action gates — expertise does not remove governance."
        : "Pam calibrates to your profile at action gates and risk signals.";

  return (
    <div className="space-y-8">
      <div>
        <p className="section-label">Clive — reasoning partner</p>
        <h2 className="font-display mt-2 text-3xl font-semibold text-ink">Build the business brain</h2>
        <p className="mt-3 max-w-2xl text-lg text-ink-muted">{state.userBrain?.cliveTone}</p>
      </div>

      <div className="rounded-xl border border-ink/10 bg-white/50 p-6">
        <p className="font-mono text-xs uppercase tracking-wide text-ink-muted">Interview</p>
        <ul className="mt-4 space-y-3">
          {CLIVE_INTERVIEW_PROMPTS.map((prompt) => (
            <li key={prompt} className="flex gap-3 text-ink">
              <span className="text-apricot" aria-hidden>
                →
              </span>
              <span>{prompt}</span>
            </li>
          ))}
        </ul>
        <p className="mt-6 border-t border-ink/10 pt-4 text-ink-muted">{CLIVE_DRAFT_SUMMARY}</p>
      </div>

      <div className="rounded-xl border border-sage/30 bg-sage/10 p-5">
        <p className="font-mono text-xs uppercase tracking-wide text-ink-muted">Brain maturity</p>
        <p className="mt-2 font-medium text-ink">{SEEDLING_HEADER_LABEL}</p>
        <p className="mt-1 text-sm text-ink-muted">{UI_STATE_COPY.locked}</p>
      </div>

      <p className="text-sm text-ink-muted">{pamNote}</p>

      <div className="flex flex-wrap gap-4">
        {onBack && (
          <button type="button" className="btn-secondary" onClick={onBack}>
            Back
          </button>
        )}
        <button type="button" className="btn-primary" onClick={onNext}>
          Continue to business brain
          <span aria-hidden>→</span>
        </button>
      </div>
    </div>
  );
}
