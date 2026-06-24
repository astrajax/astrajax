"use client";

import type { StepProps } from "@/lib/aie-demo/types";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="font-mono text-xs uppercase tracking-wide text-ink-muted">{title}</p>
      <div className="mt-2 text-ink">{children}</div>
    </div>
  );
}

export function BusinessBrainStep({ state, onNext, onBack }: StepProps) {
  const brain = state.businessBrain;

  return (
    <div className="space-y-8">
      <div>
        <p className="section-label">Workshop draft — not trusted yet</p>
        <h2 className="font-display mt-2 text-3xl font-semibold text-ink">Business brain brief</h2>
        <p className="mt-3 max-w-2xl text-lg text-ink-muted">
          Structured context for <strong>{brain.clientName}</strong>. The boring layer is the
          product — better context makes better agents.
        </p>
      </div>

      <div className="grid gap-6 rounded-xl border border-ink/10 bg-white/50 p-6 lg:grid-cols-2">
        <Section title="Goal">{brain.goal}</Section>
        <Section title="Good output looks like">{brain.goodOutput}</Section>
        <Section title="Key workflows">
          <ul className="list-inside list-disc space-y-1">
            {brain.workflows.map((w) => (
              <li key={w}>{w}</li>
            ))}
          </ul>
        </Section>
        <Section title="Data sources">
          <ul className="list-inside list-disc space-y-1">
            {brain.dataSources.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        </Section>
        <Section title="Approval rules">
          <ul className="list-inside list-disc space-y-1">
            {brain.approvalRules.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
        </Section>
        <Section title="Agents must never">
          <ul className="list-inside list-disc space-y-1">
            {brain.neverDo.map((n) => (
              <li key={n}>{n}</li>
            ))}
          </ul>
        </Section>
        <Section title="Known gaps (not yet trusted)">
          <ul className="list-inside list-disc space-y-1 text-apricot">
            {brain.knownGaps.map((g) => (
              <li key={g}>{g}</li>
            ))}
          </ul>
        </Section>
      </div>

      <div className="flex flex-wrap gap-4">
        {onBack && (
          <button type="button" className="btn-secondary" onClick={onBack}>
            Back
          </button>
        )}
        <button type="button" className="btn-primary" onClick={onNext}>
          Ask Pam before approval
          <span aria-hidden>→</span>
        </button>
      </div>
    </div>
  );
}
