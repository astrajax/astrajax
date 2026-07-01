"use client";

import { useEffect, useState } from "react";
import { BUILDER_LOG, DEMO_AGENT } from "@/lib/workshop-demo/demo-data";
import { createBuildCompletePaperTrail } from "@/lib/workshop-demo/paper-trail";
import type { StepNavProps } from "@/lib/workshop-demo/types";

export function BuilderStep({ state, onUpdate, onNext, onBack }: StepNavProps) {
  const [visibleLines, setVisibleLines] = useState(state.buildComplete ? BUILDER_LOG.length : 0);
  const [running, setRunning] = useState(!state.buildComplete);

  useEffect(() => {
    if (!state.humanApproved || state.buildComplete) return;

    const prefersReduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (prefersReduced) {
      setVisibleLines(BUILDER_LOG.length);
      setRunning(false);
      onUpdate({
        buildComplete: true,
        paperTrail: [
          ...state.paperTrail,
          createBuildCompletePaperTrail(state.approverName.trim() || "Operator"),
        ],
      });
      return;
    }

    let line = 0;
    const interval = window.setInterval(() => {
      line += 1;
      setVisibleLines(line);
      if (line >= BUILDER_LOG.length) {
        window.clearInterval(interval);
        setRunning(false);
        onUpdate({
          buildComplete: true,
          paperTrail: [
            ...state.paperTrail,
            createBuildCompletePaperTrail(state.approverName.trim() || "Operator"),
          ],
        });
      }
    }, 650);

    return () => window.clearInterval(interval);
  }, [state.humanApproved, state.buildComplete, state.approverName, state.paperTrail, onUpdate]);

  if (!state.humanApproved) {
    return (
      <div className="workshop-build-demo__step space-y-4">
        <p className="text-parchment/85">Approve the build before Composer runs.</p>
        {onBack ? (
          <button type="button" className="btn-secondary" onClick={onBack}>
            Back to approval
          </button>
        ) : null}
      </div>
    );
  }

  return (
    <div className="workshop-build-demo__step space-y-6">
      <div>
        <p className="section-label text-parchment/70">Step 6 — Hyperagent Builder</p>
        <h2 className="font-display mt-2 text-2xl font-semibold text-parchment">Composer build</h2>
        <p className="mt-3 max-w-2xl text-parchment/85">
          Mechanical repo work runs on Composer — not an expensive reasoning model.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="workshop-build-demo__badge">composer-2.5-fast</span>
        <span className="text-sm text-parchment/75">Doc&apos;s Workshop Hyperagent Builder</span>
      </div>

      <div
        className="workshop-build-demo__log rounded-xl border border-parchment/15 bg-graphite/50 p-4 font-mono text-sm"
        aria-live="polite"
        aria-busy={running}
      >
        <ul className="space-y-2">
          {BUILDER_LOG.slice(0, visibleLines).map((line) => (
            <li key={line} className="text-parchment/90">
              <span className="text-sage mr-2" aria-hidden>
                ›
              </span>
              {line}
            </li>
          ))}
        </ul>
        {running ? (
          <p className="mt-3 text-parchment/60">Building…</p>
        ) : (
          <p className="mt-3 text-sage">Validator passed — {DEMO_AGENT.exportFilename}</p>
        )}
      </div>

      <div className="flex flex-wrap gap-3">
        {onBack ? (
          <button type="button" className="btn-secondary" onClick={onBack} disabled={running}>
            Back
          </button>
        ) : null}
        <button type="button" className="btn-primary" disabled={running} onClick={onNext}>
          View export
        </button>
      </div>
    </div>
  );
}
