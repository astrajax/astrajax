"use client";

import Link from "next/link";
import { ACCESS_RECEIPT_LINE, RECEIPT_CARDS } from "@/lib/aie-demo/demo-data";
import type { StepProps } from "@/lib/aie-demo/types";

export function ReceiptsStep({ state, onBack }: StepProps) {
  return (
    <div className="space-y-8">
      <div>
        <p className="section-label">Outputs — not full product tabs</p>
        <h2 className="font-display mt-2 text-3xl font-semibold text-ink">What Chapter 1 unlocks</h2>
        <p className="mt-3 max-w-2xl text-lg text-ink-muted">
          Receipt cards from the context layer. HyperAgent runs deployed agents downstream — it is
          the runtime partner, not the brain owner.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {RECEIPT_CARDS.map((card) => (
          <article
            key={card.id}
            className="rounded-xl border border-ink/10 bg-white/50 p-5 transition hover:border-apricot/30"
          >
            {card.tag && (
              <span className="font-mono text-xs uppercase tracking-wide text-apricot">
                {card.tag}
              </span>
            )}
            <h3 className="mt-2 font-display text-lg font-semibold text-ink">{card.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-ink-muted">{card.summary}</p>
          </article>
        ))}
      </div>

      {state.grant && (
        <p className="rounded-lg bg-sage/10 px-4 py-3 text-sm text-ink">{ACCESS_RECEIPT_LINE}</p>
      )}

      {state.promoteReceipt && (
        <p className="rounded-lg bg-sage/10 px-4 py-3 text-sm text-ink">
          Working Brain — first approved context promoted. Next: QA pass, fleet design, HyperAgent
          package.
        </p>
      )}

      <div className="flex flex-wrap gap-4 border-t border-ink/10 pt-6">
        {onBack && (
          <button type="button" className="btn-secondary" onClick={onBack}>
            Back
          </button>
        )}
        <Link href="/" className="btn-secondary">
          Back to site
        </Link>
      </div>
    </div>
  );
}
