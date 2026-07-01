"use client";

import type { StepNavProps } from "@/lib/workshop-demo/types";
import { createApprovalPaperTrail } from "@/lib/workshop-demo/paper-trail";

export function ApprovalStep({ state, onUpdate, onNext, onBack }: StepNavProps) {
  const canApprove = state.approverName.trim().length > 0;

  function handleApprove() {
    if (!canApprove) return;
    onUpdate({
      humanApproved: true,
      paperTrail: [...state.paperTrail, createApprovalPaperTrail(state.approverName.trim())],
    });
    onNext();
  }

  return (
    <div className="workshop-build-demo__step space-y-6">
      <div>
        <p className="section-label text-parchment/70">Step 5 — Human gate</p>
        <h2 className="font-display mt-2 text-2xl font-semibold text-parchment">
          Approve build
        </h2>
        <p className="mt-3 max-w-2xl text-parchment/85">
          Phase B starts only after explicit approval. Challenger cleared the pack; you decide
          whether Composer writes files.
        </p>
      </div>

      <div className="workshop-build-demo__gate rounded-xl border border-parchment/20 bg-parchment/5 p-5">
        <p className="text-xs text-parchment/70">
          Human gate before export or build. Demo only — no live repo writes from this page.
        </p>
        <label className="mt-4 block text-sm" htmlFor="workshop-approver">
          <span className="section-label mb-1 block text-parchment/70">Your name</span>
          <input
            id="workshop-approver"
            name="approver"
            type="text"
            value={state.approverName}
            onChange={(e) => onUpdate({ approverName: e.target.value })}
            autoComplete="off"
            spellCheck={false}
            className="workshop-build-demo__input w-full rounded-lg border border-parchment/20 bg-graphite/40 px-3 py-2 text-sm text-parchment"
            placeholder="Who is authorising this build?"
          />
        </label>
      </div>

      <div className="flex flex-wrap gap-3">
        {onBack ? (
          <button type="button" className="btn-secondary" onClick={onBack}>
            Back
          </button>
        ) : null}
        <button type="button" className="btn-primary" disabled={!canApprove} onClick={handleApprove}>
          Approve build — Phase B
        </button>
      </div>
    </div>
  );
}
