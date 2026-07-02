"use client";

import { DEMO_AGENT, DEMO_BRIEF } from "@/lib/workshop-demo/demo-data";
import type { StepNavProps } from "@/lib/workshop-demo/types";

export function BriefStep({ onNext, onBack }: StepNavProps) {
  return (
    <div className="workshop-build-demo__step space-y-6">
      <div>
        <p className="section-label text-parchment/70">Step 2 — Workshop interview</p>
        <h2 className="font-display mt-2 text-2xl font-semibold text-parchment">Agent brief</h2>
        <p className="mt-3 max-w-2xl text-parchment/85">
          The Proposer turns your answers into a config pack. This demo walks the real brief
          behind the External Context Scanner — a scheduled web-sourcing agent in the fleet.
        </p>
      </div>

      <article className="workshop-build-demo__card rounded-xl border border-parchment/15 bg-parchment/5 p-5">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="font-display text-lg font-semibold text-parchment">{DEMO_AGENT.name}</h3>
          <span className="workshop-build-demo__badge">{DEMO_BRIEF.riskTier} risk</span>
        </div>
        <dl className="mt-4 space-y-3 text-sm">
          <div>
            <dt className="section-label text-parchment/60">Purpose</dt>
            <dd className="mt-1 text-parchment/90">{DEMO_BRIEF.purpose}</dd>
          </div>
          <div>
            <dt className="section-label text-parchment/60">Channel</dt>
            <dd className="mt-1 text-parchment/90">{DEMO_BRIEF.channel}</dd>
          </div>
          <div>
            <dt className="section-label text-parchment/60">Trigger</dt>
            <dd className="mt-1 text-parchment/90">{DEMO_BRIEF.trigger}</dd>
          </div>
          <div>
            <dt className="section-label text-parchment/60">Data and actions</dt>
            <dd className="mt-1 text-parchment/90">{DEMO_BRIEF.dataActions}</dd>
          </div>
          <div>
            <dt className="section-label text-parchment/60">Runtime</dt>
            <dd className="mt-1 text-parchment/90">{DEMO_BRIEF.runtime}</dd>
          </div>
        </dl>
      </article>

      <div className="flex flex-wrap gap-3">
        {onBack ? (
          <button type="button" className="btn-secondary" onClick={onBack}>
            Back
          </button>
        ) : null}
        <button type="button" className="btn-primary" onClick={onNext}>
          View Proposer pack
        </button>
      </div>
    </div>
  );
}
