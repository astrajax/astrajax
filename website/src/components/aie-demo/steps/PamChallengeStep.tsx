"use client";

import type { StepProps } from "@/lib/aie-demo/types";

const PAM_FIELDS: { key: keyof StepProps["state"]["pamReview"]; label: string }[] = [
  { key: "strongestPart", label: "Strongest part" },
  { key: "weakestAssumption", label: "Weakest assumption" },
  { key: "missingEvidence", label: "Missing evidence" },
  { key: "rabbitHoleRisk", label: "Rabbit-hole risk" },
];

export function PamChallengeStep({ state, onUpdate, onNext, onBack }: StepProps) {
  const pam = state.pamReview;
  const sensitivity = state.userBrain?.pamSensitivity ?? "medium";

  return (
    <div className="space-y-8">
      <div>
        <p className="section-label">Pam Portiscue — action gate</p>
        <h2 className="font-display mt-2 text-3xl font-semibold text-ink">Pam&apos;s sniff test</h2>
        <p className="mt-3 max-w-2xl text-lg text-ink-muted">
          Helpful by default, sceptical before action. Pam stress-tests canonical approval and Doc
          handoff — not routine Brain Key unlock for read access.
          {sensitivity === "high" && " Your profile: contextual Pam sensitivity is high."}
        </p>
      </div>

      <div className="rounded-xl border border-ink/10 bg-moss/5 p-6">
        <p className="font-display text-lg italic text-ink">
          Better now than never, I suppose. Show me the assumption everyone has become far too
          comfortable with.
        </p>
        <dl className="mt-6 space-y-4">
          {PAM_FIELDS.map(({ key, label }) => (
            <div key={key}>
              <dt className="font-mono text-xs uppercase tracking-wide text-ink-muted">{label}</dt>
              <dd className="mt-1 text-ink">{pam[key]}</dd>
            </div>
          ))}
          <div>
            <dt className="font-mono text-xs uppercase tracking-wide text-ink-muted">
              Safe to send to Doc?
            </dt>
            <dd className="mt-1">
              <button
                type="button"
                onClick={() =>
                  onUpdate({
                    pamReview: {
                      ...pam,
                      safeToSendToDoc: pam.safeToSendToDoc === "yes" ? "not_yet" : "yes",
                    },
                  })
                }
                className={`rounded-full px-4 py-1 text-sm font-medium ${
                  pam.safeToSendToDoc === "yes"
                    ? "bg-sage/30 text-ink"
                    : "bg-apricot/15 text-apricot"
                }`}
              >
                {pam.safeToSendToDoc === "yes" ? "Yes" : "Not yet"}
              </button>
            </dd>
          </div>
        </dl>
      </div>

      <div className="flex flex-wrap gap-4">
        {onBack && (
          <button type="button" className="btn-secondary" onClick={onBack}>
            Back
          </button>
        )}
        <button type="button" className="btn-primary" onClick={onNext}>
          Ready for your decision
          <span aria-hidden>→</span>
        </button>
      </div>
    </div>
  );
}
