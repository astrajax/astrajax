"use client";

import { useState } from "react";
import {
  approveBrainKey,
  logInteraction,
  retrieveContext,
} from "@/lib/aie-demo/brain-client";
import { OWNERSHIP_LINE } from "@/lib/aie-demo/demo-data";
import { DEMO_BRAIN_SLUG } from "@/lib/aie-demo/types";
import type { StepProps } from "@/lib/aie-demo/types";
import {
  UI_STATE_COPY,
  UI_STATE_LABELS,
  cliveMessageForState,
} from "@/lib/brains/ui-states";

export function HumanDecisionStep({
  state,
  accessState,
  onUpdate,
  onNext,
  onBack,
}: StepProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleApprove() {
    if (!state.keyRequest) {
      setError("No Brain Key request — go back to Clive interview.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const approveResult = await approveBrainKey({
        requestId: state.keyRequest.requestId,
        decision: "approved",
        approver: "Matthew",
        grantMaxUses: 3,
        grantExpiryMinutes: 15,
      });

      const grant = {
        grantId: approveResult.grantId,
        requestId: state.keyRequest.requestId,
        brainSlug: DEMO_BRAIN_SLUG,
        persona: "clive" as const,
        scope: state.demoScope,
        sessionId: state.sessionId,
        approvedBy: "Matthew",
        approvedAt: new Date().toISOString(),
        expiresAt: approveResult.expiresAt,
        maxUses: approveResult.maxUses,
        useCount: 0,
        status: "active" as const,
      };

      const retrieveResult = await retrieveContext({
        grantId: approveResult.grantId,
        sessionId: state.sessionId,
        persona: "clive",
        brainSlug: DEMO_BRAIN_SLUG,
        scope: state.demoScope,
      });

      await logInteraction({
        sessionId: state.sessionId,
        persona: "clive",
        brainSlug: DEMO_BRAIN_SLUG,
        userMessage: "Approve Brain Key for positioning guardrails demo",
        assistantReply: cliveMessageForState("unlocked"),
        manifest: retrieveResult.manifest,
        channel: "booth",
      });

      onUpdate({
        grant,
        snippets: retrieveResult.snippets,
        humanApproved: true,
        approvalDecisionId: `apd_${Date.now()}`,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Approval failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <p className="section-label">Human approver</p>
        <h2 className="font-display mt-2 text-3xl font-semibold text-ink">Your decision</h2>
        <p className="mt-3 max-w-2xl text-lg text-ink-muted">
          Review scope, reason, and expiry — then approve or reject the Brain Key. Pam challenged
          the thinking; you decide what becomes true.
        </p>
      </div>

      {state.keyRequest && (
        <div className="rounded-xl border border-ink/10 bg-white/50 p-6">
          <dl className="grid gap-4 sm:grid-cols-2">
            <div>
              <dt className="font-mono text-xs uppercase text-ink-muted">Scope</dt>
              <dd className="mt-1 font-mono text-sm">{state.keyRequest.scope}</dd>
            </div>
            <div>
              <dt className="font-mono text-xs uppercase text-ink-muted">Reason</dt>
              <dd className="mt-1 text-sm">{state.keyRequest.reason}</dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="font-mono text-xs uppercase text-ink-muted">Purpose</dt>
              <dd className="mt-1 text-sm">{state.keyRequest.purpose}</dd>
            </div>
          </dl>
        </div>
      )}

      <blockquote className="border-l-4 border-apricot pl-6 font-display text-xl italic text-ink">
        {OWNERSHIP_LINE}
      </blockquote>

      <div className="rounded-xl border border-sage/30 bg-sage/10 p-5">
        <p className="font-medium text-ink">{UI_STATE_LABELS[accessState]}</p>
        <p className="mt-1 text-sm text-ink-muted">{UI_STATE_COPY[accessState]}</p>
      </div>

      {state.snippets.length > 0 && (
        <div className="space-y-3">
          <p className="section-label">Approved snippets (prompt-safe)</p>
          {state.snippets.map((s) => (
            <div key={s.recordId} className="rounded-lg border border-ink/10 bg-white/60 p-4">
              <p className="font-medium">{s.title}</p>
              <p className="mt-2 text-sm text-ink-muted">{s.text}</p>
            </div>
          ))}
        </div>
      )}

      {error && <p className="rounded-lg bg-apricot/10 px-4 py-2 text-sm text-apricot">{error}</p>}

      <div className="flex flex-wrap gap-4">
        {onBack && (
          <button type="button" className="btn-secondary" onClick={onBack}>
            Back
          </button>
        )}
        {!state.humanApproved && (
          <button
            type="button"
            className="btn-primary disabled:opacity-40"
            disabled={loading || !state.keyRequest}
            onClick={handleApprove}
          >
            {loading ? "Approving…" : "Approve Brain Key"}
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
