"use client";

import { ROUTING_BLOCK } from "@/lib/workshop-demo/demo-data";
import type { StepNavProps } from "@/lib/workshop-demo/types";

export function RoutingStep({ onNext }: StepNavProps) {
  return (
    <div className="workshop-build-demo__step space-y-6">
      <div>
        <p className="section-label text-parchment/70">Step 1 — Doc triage</p>
        <h2 className="font-display mt-2 text-2xl font-semibold text-parchment">Routing</h2>
        <p className="mt-3 max-w-2xl text-parchment/85">
          Doc names the minion before any build work starts. Agent-making jobs route through
          Doc&apos;s Workshop, not a single agreeable model.
        </p>
      </div>

      <div className="workshop-build-demo__routing-block rounded-xl border border-parchment/15 bg-parchment/5 p-5 font-mono text-sm">
        <p>
          <span className="text-parchment/60">Routing:</span>{" "}
          <span className="text-parchment">{ROUTING_BLOCK.routing}</span>
        </p>
        <p className="mt-2">
          <span className="text-parchment/60">Why:</span>{" "}
          <span className="text-parchment">{ROUTING_BLOCK.why}</span>
        </p>
        <p className="mt-2">
          <span className="text-parchment/60">Not this lane:</span>{" "}
          <span className="text-parchment">{ROUTING_BLOCK.notThisLane}</span>
        </p>
      </div>

      <p className="text-sm text-parchment/70">
        Phase A — design and red-team. Phase B — Composer writes files after your approval.
      </p>

      <button type="button" className="btn-primary" onClick={onNext}>
        Continue to brief
      </button>
    </div>
  );
}
