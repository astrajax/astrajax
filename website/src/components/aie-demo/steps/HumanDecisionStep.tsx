"use client";

import { OWNERSHIP_LINE } from "@/lib/aie-demo/demo-data";
import type { StepProps } from "@/lib/aie-demo/types";
import { SEEDLING_HEADER_LABEL, UI_STATE_COPY } from "@/lib/brains/ui-states";

export function HumanDecisionStep({ state, onUpdate, onNext, onBack }: StepProps) {
  function handleApproveBrief() {
    onUpdate({
      humanApproved: true,
      approvalDecisionId: `apd_${Date.now()}`,
    });
  }

  return (
    <div className="space-y-8">
      <div>
        <p className="section-label">Human approver</p>
        <h2 className="font-display mt-2 text-3xl font-semibold text-ink">Your decision</h2>
        <p className="mt-3 max-w-2xl text-lg text-ink-muted">
          Pam challenged the thinking. You decide what becomes trusted context and whether Doc may
          promote it. This is canonical approval — not context access for a live task yet.
        </p>
      </div>

      <div className="rounded-xl border border-ink/10 bg-white/50 p-6">
        <p className="font-mono text-xs uppercase tracking-wide text-ink-muted">Brief summary</p>
        <p className="mt-2 text-ink">{state.businessBrain.goal}</p>
        <p className="mt-3 text-sm text-ink-muted">
          Pam: {state.pamReview.safeToSendToDoc === "yes" ? "Safe to send to Doc" : "Not yet — review gaps first"}
        </p>
      </div>

      <blockquote className="border-l-4 border-apricot pl-6 font-display text-xl italic text-ink">
        {OWNERSHIP_LINE}
      </blockquote>

      <div className="rounded-xl border border-sage/30 bg-sage/10 p-5">
        <p className="font-medium text-ink">{SEEDLING_HEADER_LABEL}</p>
        <p className="mt-1 text-sm text-ink-muted">{UI_STATE_COPY.locked}</p>
      </div>

      <div className="flex flex-wrap gap-4">
        {onBack && (
          <button type="button" className="btn-secondary" onClick={onBack}>
            Back
          </button>
        )}
        {!state.humanApproved && (
          <button type="button" className="btn-primary" onClick={handleApproveBrief}>
            Approve brief for Doc
          </button>
        )}
        {state.humanApproved && (
          <button type="button" className="btn-primary" onClick={onNext}>
            Send approved brief to Doc
            <span aria-hidden>→</span>
          </button>
        )}
      </div>
    </div>
  );
}
