"use client";

import { PROPOSER_PACK } from "@/lib/workshop-demo/demo-data";
import type { StepNavProps } from "@/lib/workshop-demo/types";

export function ProposerStep({ onNext, onBack }: StepNavProps) {
  return (
    <div className="workshop-build-demo__step space-y-6">
      <div>
        <p className="section-label text-parchment/70">Step 3 — Workshop Proposer</p>
        <h2 className="font-display mt-2 text-2xl font-semibold text-parchment">Config pack</h2>
        <p className="mt-3 max-w-2xl text-parchment/85">{PROPOSER_PACK.proposerNote}</p>
      </div>

      <div className="workshop-build-demo__grid">
        <section className="workshop-build-demo__card rounded-xl border border-parchment/15 bg-parchment/5 p-4">
          <p className="section-label text-parchment/60">Mission</p>
          <p className="mt-2 text-sm text-parchment/90">{PROPOSER_PACK.mission}</p>
        </section>

        <section className="workshop-build-demo__card rounded-xl border border-parchment/15 bg-parchment/5 p-4">
          <p className="section-label text-parchment/60">Non-goals</p>
          <ul className="mt-2 list-disc space-y-1 pl-4 text-sm text-parchment/90">
            {PROPOSER_PACK.nonGoals.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>

        <section className="workshop-build-demo__card rounded-xl border border-parchment/15 bg-parchment/5 p-4 sm:col-span-2">
          <p className="section-label text-parchment/60">Tool plan</p>
          <ul className="mt-3 space-y-2">
            {PROPOSER_PACK.toolsPlan.map((tool) => (
              <li key={tool.id} className="flex flex-wrap items-baseline gap-2 text-sm">
                <span
                  className={
                    tool.enabled ? "workshop-build-demo__badge" : "workshop-build-demo__badge--off"
                  }
                >
                  {tool.enabled ? "ON" : "OFF"}
                </span>
                <span className="font-medium text-parchment">{tool.label}</span>
                <span className="text-parchment/65">{tool.why}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="workshop-build-demo__card rounded-xl border border-parchment/15 bg-parchment/5 p-4">
          <p className="section-label text-parchment/60">Eval floor</p>
          <p className="mt-2 text-sm text-parchment/90">{PROPOSER_PACK.evalFloor}</p>
        </section>

        <section className="workshop-build-demo__card rounded-xl border border-parchment/15 bg-parchment/5 p-4">
          <p className="section-label text-parchment/60">Roster decision</p>
          <p className="mt-2 text-sm text-parchment/90">{PROPOSER_PACK.rosterDecision}</p>
        </section>
      </div>

      <div className="flex flex-wrap gap-3">
        {onBack ? (
          <button type="button" className="btn-secondary" onClick={onBack}>
            Back
          </button>
        ) : null}
        <button type="button" className="btn-primary" onClick={onNext}>
          Send to Challenger
        </button>
      </div>
    </div>
  );
}
