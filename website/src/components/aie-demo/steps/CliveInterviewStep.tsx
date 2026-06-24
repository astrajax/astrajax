"use client";

import { useState } from "react";
import { requestBrainKey } from "@/lib/aie-demo/brain-client";
import {
  CLIVE_DRAFT_SUMMARY,
  CLIVE_INTERVIEW_PROMPTS,
  DEMO_SCOPE,
} from "@/lib/aie-demo/demo-data";
import { DEMO_BRAIN_SLUG } from "@/lib/aie-demo/types";
import type { StepProps } from "@/lib/aie-demo/types";
import {
  UI_STATE_COPY,
  UI_STATE_LABELS,
  cliveMessageForState,
} from "@/lib/brains/ui-states";

export function CliveInterviewStep({ state, accessState, onUpdate, onNext, onBack }: StepProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pamNote =
    state.userBrain?.pamSensitivity === "high"
      ? "Pam will be suggested sooner when scope or evidence wobbles."
      : state.userBrain?.pamSensitivity === "low"
        ? "Mandatory Pam still applies at action gates — expertise does not remove governance."
        : "Pam calibrates to your profile at action gates and risk signals.";

  async function handleRequestKey() {
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
          reason: "Demo Brain Key request",
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
        <p className="font-mono text-xs uppercase tracking-wide text-ink-muted">Access state</p>
        <p className="mt-2 font-medium text-ink">{UI_STATE_LABELS[accessState]}</p>
        <p className="mt-1 text-sm text-ink-muted">{UI_STATE_COPY[accessState]}</p>
        <p className="mt-3 text-sm italic text-ink">{cliveMessageForState(accessState)}</p>
      </div>

      <p className="text-sm text-ink-muted">{pamNote}</p>

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
            onClick={handleRequestKey}
          >
            {loading ? "Requesting Brain Key…" : "Clive requests Brain Key"}
          </button>
        )}
        {state.keyRequest && (
          <button type="button" className="btn-primary" onClick={onNext}>
            Continue to business brain
            <span aria-hidden>→</span>
          </button>
        )}
      </div>
    </div>
  );
}
