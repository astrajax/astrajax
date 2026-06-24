"use client";

import { useState } from "react";
import {
  approveBrainKey,
  logInteraction,
  requestBrainKey,
  retrieveContext,
} from "@/lib/aie-demo/brain-client";
import { DEMO_SCOPE } from "@/lib/aie-demo/demo-data";
import { DEMO_BRAIN_SLUG, MATURITY_LABELS } from "@/lib/aie-demo/types";
import type { StepProps } from "@/lib/aie-demo/types";
import {
  UI_STATE_COPY,
  UI_STATE_LABELS,
  cliveMessageForState,
} from "@/lib/brains/ui-states";

export function ContextAccessStep({
  state,
  accessState,
  onUpdate,
  onNext,
  onBack,
}: StepProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (state.brainMaturity !== "working" || !state.promoteReceipt) {
    return (
      <div className="space-y-6">
        <p className="section-label">Context access</p>
        <h2 className="font-display text-3xl font-semibold text-ink">Not yet available</h2>
        <p className="text-lg text-ink-muted">
          Context access is maturity-gated. Doc must promote approved context first — the brain
          reaches Working maturity, then an agent can ask to use approved context for a task.
        </p>
        {onBack && (
          <button type="button" className="btn-secondary" onClick={onBack}>
            Back to Doc handoff
          </button>
        )}
      </div>
    );
  }

  async function handleRequestAccess() {
    setLoading(true);
    setError(null);
    try {
      const result = await requestBrainKey({
        brainSlug: DEMO_BRAIN_SLUG,
        persona: "clive",
        purpose: "Answer booth question about pricing guardrails from approved positioning",
        scope: DEMO_SCOPE,
        reason: state.businessBrain.knownGaps[0] ?? "Need approved snippets for demo task",
        sessionId: state.sessionId,
        requestedExpiryMinutes: 15,
      });

      onUpdate({
        keyRequest: {
          requestId: result.requestId,
          brainSlug: DEMO_BRAIN_SLUG,
          persona: "clive",
          purpose: "Answer booth question about pricing guardrails",
          scope: DEMO_SCOPE,
          reason: "Use approved positioning context for demo task",
          sessionId: state.sessionId,
          status: "pending",
          requestedAt: new Date().toISOString(),
          expiresAt: result.expiresAt,
        },
        demoScope: DEMO_SCOPE,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleApproveAccess() {
    if (!state.keyRequest) {
      setError("No context access request — ask Clive first.");
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
        userMessage: "Approve context access for positioning guardrails demo",
        assistantReply: cliveMessageForState("unlocked"),
        manifest: retrieveResult.manifest,
        channel: "booth",
      });

      onUpdate({
        grant,
        snippets: retrieveResult.snippets,
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
        <p className="section-label">{MATURITY_LABELS.working} — context access</p>
        <h2 className="font-display mt-2 text-3xl font-semibold text-ink">
          Use approved context for this task
        </h2>
        <p className="mt-3 max-w-2xl text-lg text-ink-muted">
          Approved context now exists in the Trusted Brain. Clive can ask to use it for a bounded
          task — you approve, access is scoped and logged. Separate bases stay the hard lock.
        </p>
      </div>

      <div className="rounded-xl border border-sage/30 bg-sage/10 p-5">
        <p className="font-medium text-ink">{UI_STATE_LABELS[accessState]}</p>
        <p className="mt-1 text-sm text-ink-muted">{UI_STATE_COPY[accessState]}</p>
        <p className="mt-3 text-sm italic text-ink">{cliveMessageForState(accessState)}</p>
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
        {!state.keyRequest && (
          <button
            type="button"
            className="btn-primary disabled:opacity-40"
            disabled={loading}
            onClick={handleRequestAccess}
          >
            {loading ? "Requesting…" : "Clive asks to use approved context"}
          </button>
        )}
        {state.keyRequest && !state.grant && (
          <button
            type="button"
            className="btn-primary disabled:opacity-40"
            disabled={loading}
            onClick={handleApproveAccess}
          >
            {loading ? "Approving…" : "Approve context access for this task"}
          </button>
        )}
        {state.grant && state.snippets.length > 0 && (
          <button type="button" className="btn-primary" onClick={onNext}>
            See what this unlocks
            <span aria-hidden>→</span>
          </button>
        )}
      </div>
    </div>
  );
}
