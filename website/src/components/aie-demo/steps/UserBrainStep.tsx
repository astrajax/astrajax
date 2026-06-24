"use client";

import { USER_BRAIN_PROFILES } from "@/lib/aie-demo/demo-data";
import type { StepProps } from "@/lib/aie-demo/types";

export function UserBrainStep({ state, onUpdate, onNext }: StepProps) {
  return (
    <div className="space-y-8">
      <div>
        <p className="section-label">Step 0 — before the business brain</p>
        <h2 className="font-display mt-2 text-3xl font-semibold text-ink">
          Who is sitting in the chair?
        </h2>
        <p className="mt-3 max-w-2xl text-lg text-ink-muted">
          AstraJax maps the human before it maps the business. Clive adapts to experience; Pam
          calibrates challenge to where you need protection.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-1 lg:grid-cols-1">
        {USER_BRAIN_PROFILES.map((profile) => {
          const selected = state.userBrain?.id === profile.id;
          return (
            <button
              key={profile.id}
              type="button"
              onClick={() => onUpdate({ userBrain: profile })}
              className={`rounded-xl border p-5 text-left transition ${
                selected
                  ? "border-apricot bg-apricot/5 ring-2 ring-apricot/30"
                  : "border-ink/10 bg-white/40 hover:border-ink/20"
              }`}
            >
              <p className="font-medium text-ink">{profile.label}</p>
              <dl className="mt-3 grid gap-2 text-sm text-ink-muted sm:grid-cols-3">
                <div>
                  <dt className="font-mono text-xs uppercase tracking-wide">AI</dt>
                  <dd className="capitalize">{profile.aiConfidence}</dd>
                </div>
                <div>
                  <dt className="font-mono text-xs uppercase tracking-wide">Context</dt>
                  <dd className="capitalize">{profile.contextConfidence}</dd>
                </div>
                <div>
                  <dt className="font-mono text-xs uppercase tracking-wide">Commercial</dt>
                  <dd className="capitalize">{profile.commercialJudgement}</dd>
                </div>
              </dl>
              {selected && (
                <p className="mt-3 text-sm text-ink">
                  <span className="font-medium">Clive:</span> {profile.cliveTone}
                </p>
              )}
            </button>
          );
        })}
      </div>

      <button
        type="button"
        className="btn-primary disabled:opacity-40"
        disabled={!state.userBrain}
        onClick={onNext}
      >
        Continue with this profile
        <span aria-hidden>→</span>
      </button>
    </div>
  );
}
