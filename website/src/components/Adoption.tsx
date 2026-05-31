import { TRAINING_HUB_URL } from "@/lib/site";

const signals = [
  { label: "Training hub", href: TRAINING_HUB_URL },
  { label: "Sandboxes", href: TRAINING_HUB_URL },
  { label: "Leaderboards", href: TRAINING_HUB_URL },
  { label: "Characterful agents", href: TRAINING_HUB_URL },
];

export function Adoption() {
  return (
    <section className="border-b border-ink/10 bg-cream-deep">
      <div className="mx-auto max-w-6xl px-6 py-16 lg:py-20">
        <p className="section-label mb-4">Adoption by design</p>
        <blockquote className="font-display max-w-2xl text-2xl font-medium italic text-ink">
          Personality is not decoration — it is adoption infrastructure.
        </blockquote>
        <div className="mt-6 flex flex-wrap gap-2">
          {signals.map((signal) => (
            <a
              key={signal.label}
              href={signal.href}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full border border-ink/10 bg-white px-3 py-1 text-xs font-medium text-ink-muted transition hover:border-apricot/40 hover:text-apricot"
            >
              {signal.label}
            </a>
          ))}
        </div>
        <div className="mt-8">
          <a
            href={TRAINING_HUB_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-secondary"
          >
            Open the DS training hub
            <span aria-hidden>→</span>
          </a>
          <p className="mt-3 max-w-xl text-sm text-ink-muted">
            Live from production — operational bases, walkthroughs, and a training leaderboard
            synced from Agent Ops.
          </p>
        </div>
      </div>
    </section>
  );
}
