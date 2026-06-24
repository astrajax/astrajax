"use client";

import { useState } from "react";
import { promoteToTrusted } from "@/lib/aie-demo/brain-client";
import { PROMOTE_DRAFT } from "@/lib/aie-demo/demo-data";
import { DEMO_BRAIN_SLUG } from "@/lib/aie-demo/types";
import type { StepProps } from "@/lib/aie-demo/types";

export function DocHandoffStep({ state, onUpdate, onNext, onBack }: StepProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!state.humanApproved) {
    return (
      <div className="space-y-6">
        <p className="section-label">Doc — action dispatcher</p>
        <h2 className="font-display text-3xl font-semibold text-ink">Doc is waiting</h2>
        <p className="text-lg text-ink-muted">
          Doc acts only from an approved brief. Complete human approval before Doc can promote
          context to the Trusted Brain.
        </p>
        {onBack && (
          <button type="button" className="btn-secondary" onClick={onBack}>
            Back to your decision
          </button>
        )}
      </div>
    );
  }

  async function handlePromote() {
    setLoading(true);
    setError(null);
    try {
      const result = await promoteToTrusted({
        approvalDecisionId: state.approvalDecisionId || `apd_${Date.now()}`,
        brainSlug: DEMO_BRAIN_SLUG,
        promotions: [PROMOTE_DRAFT],
        approver: "Matthew",
        reason: "Human approved business brain brief after Pam sniff test",
      });

      onUpdate({
        promoteReceipt: {
          promotedRecordIds: result.promotedRecordIds,
          changeSummary: `Promoted ${result.promotedRecordIds.length} draft(s) to Trusted Brain`,
          executingAgent: "Doc",
          approver: "Matthew",
        },
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Promote failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <p className="section-label">Doc Albright — approved brief received</p>
        <h2 className="font-display mt-2 text-3xl font-semibold text-ink">Doc handoff</h2>
        <p className="mt-3 max-w-2xl text-lg text-ink-muted">
          Doc promotes approved draft context into the Trusted Brain — new row, workshop draft
          quarantined, change log written. Category and scope set at promote, not copied from
          draft fields.
        </p>
      </div>

      <div className="rounded-xl border border-ink/10 bg-white/50 p-6 font-mono text-sm">
        <p className="text-ink-muted">Approved brief ID</p>
        <p className="mt-1 text-ink">{state.approvalDecisionId}</p>
        <p className="mt-4 text-ink-muted">Promotion target</p>
        <p className="mt-1 text-ink">
          {PROMOTE_DRAFT.category} → {PROMOTE_DRAFT.scope}
        </p>
      </div>

      {state.promoteReceipt ? (
        <div className="rounded-xl border border-sage/40 bg-sage/10 p-6">
          <p className="font-mono text-xs uppercase text-ink-muted">Change log receipt</p>
          <dl className="mt-4 space-y-3 text-sm">
            <div>
              <dt className="text-ink-muted">Summary</dt>
              <dd>{state.promoteReceipt.changeSummary}</dd>
            </div>
            <div>
              <dt className="text-ink-muted">Executing agent</dt>
              <dd>{state.promoteReceipt.executingAgent}</dd>
            </div>
            <div>
              <dt className="text-ink-muted">Approved by</dt>
              <dd>{state.promoteReceipt.approver}</dd>
            </div>
            <div>
              <dt className="text-ink-muted">Affected records</dt>
              <dd className="font-mono">{state.promoteReceipt.promotedRecordIds.join(", ")}</dd>
            </div>
          </dl>
        </div>
      ) : (
        <button
          type="button"
          className="btn-primary disabled:opacity-40"
          disabled={loading}
          onClick={handlePromote}
        >
          {loading ? "Doc promoting…" : "Doc promotes to Trusted Brain"}
        </button>
      )}

      {error && <p className="rounded-lg bg-apricot/10 px-4 py-2 text-sm text-apricot">{error}</p>}

      <div className="flex flex-wrap gap-4">
        {onBack && (
          <button type="button" className="btn-secondary" onClick={onBack}>
            Back
          </button>
        )}
        {state.promoteReceipt && (
          <button type="button" className="btn-primary" onClick={onNext}>
            See what this unlocks
            <span aria-hidden>→</span>
          </button>
        )}
      </div>
    </div>
  );
}
