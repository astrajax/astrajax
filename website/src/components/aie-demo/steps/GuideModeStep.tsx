"use client";

import { GUIDE_MODE_OPTIONS } from "@/lib/aie-demo/demo-data";
import type { StepProps } from "@/lib/aie-demo/types";

export function GuideModeStep({ state, onUpdate, onNext, onBack }: StepProps) {
  return (
    <div className="space-y-8">
      <div>
        <p className="section-label">Pick your guide</p>
        <h2 className="font-display mt-2 text-3xl font-semibold text-ink">Guide mode</h2>
        <p className="mt-3 max-w-2xl text-lg text-ink-muted">
          Same scopes and governance underneath — story mode controls how much character the system
          shows.
        </p>
      </div>

      <div className="grid gap-4">
        {GUIDE_MODE_OPTIONS.map((option) => {
          const selected = state.guideMode === option.id;
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => onUpdate({ guideMode: option.id })}
              className={`rounded-xl border p-5 text-left transition ${
                selected
                  ? "border-apricot bg-apricot/5 ring-2 ring-apricot/30"
                  : "border-ink/10 bg-white/40 hover:border-ink/20"
              }`}
            >
              <p className="font-medium text-ink">{option.label}</p>
              <p className="mt-2 text-sm text-ink-muted">{option.description}</p>
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap gap-4">
        {onBack && (
          <button type="button" className="btn-secondary" onClick={onBack}>
            Back
          </button>
        )}
        <button
          type="button"
          className="btn-primary disabled:opacity-40"
          disabled={!state.guideMode}
          onClick={onNext}
        >
          Start with Clive
          <span aria-hidden>→</span>
        </button>
      </div>
    </div>
  );
}
