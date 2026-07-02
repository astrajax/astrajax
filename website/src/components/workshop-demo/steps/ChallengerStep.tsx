"use client";

import { CHALLENGER_VERDICT } from "@/lib/workshop-demo/demo-data";
import type { StepNavProps } from "@/lib/workshop-demo/types";

export function ChallengerStep({ onNext, onBack }: StepNavProps) {
  return (
    <div className="workshop-build-demo__step space-y-6">
      <div>
        <p className="section-label text-parchment/70">Step 4 — Workshop Challenger</p>
        <h2 className="font-display mt-2 text-2xl font-semibold text-parchment">
          Red-team verdict
        </h2>
        <p className="mt-3 max-w-2xl text-parchment/85">
          Every pack passes through Challenger before you see it for approval. No self-certification.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="workshop-build-demo__badge workshop-build-demo__badge--proceed">
          {CHALLENGER_VERDICT.verdict}
        </span>
        <p className="text-sm text-parchment/85">{CHALLENGER_VERDICT.summary}</p>
      </div>

      <ul className="workshop-build-demo__checklist space-y-2">
        {CHALLENGER_VERDICT.checks.map((check) => (
          <li
            key={check.id}
            className="workshop-build-demo__check-item rounded-lg border border-parchment/10 bg-parchment/5 px-4 py-3 text-sm"
          >
            <span className="workshop-build-demo__check-pass" aria-hidden>
              ✓
            </span>
            <span className="text-parchment/90">{check.label}</span>
          </li>
        ))}
      </ul>

      <div className="flex flex-wrap gap-3">
        {onBack ? (
          <button type="button" className="btn-secondary" onClick={onBack}>
            Back
          </button>
        ) : null}
        <button type="button" className="btn-primary" onClick={onNext}>
          Ready for your approval
        </button>
      </div>
    </div>
  );
}
