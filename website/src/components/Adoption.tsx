import { TRAINING_HUB_URL } from "@/lib/site";

const signals = [
  { label: "Guided training", href: TRAINING_HUB_URL },
  { label: "Safe sandboxes", href: TRAINING_HUB_URL },
  { label: "Momentum loops", href: TRAINING_HUB_URL },
  { label: "Characterful agents", href: TRAINING_HUB_URL },
];

export function Adoption() {
  return (
    <section className="border-b border-ink/10 bg-cream-deep">
      <div className="mx-auto max-w-6xl px-6 py-16 lg:py-20">
        <p className="section-label mb-4">Adoption by design</p>
        <blockquote className="font-display max-w-2xl text-2xl font-medium italic text-ink">
          Personality makes the system approachable. Context makes it useful.
        </blockquote>
        <p className="mt-5 max-w-2xl text-lg leading-relaxed text-ink-muted">
          AstraJax turns adoption into a loop: people learn safely, see progress, get coached, and
          feed corrections back into the brain. That is how agents become part of the work instead
          of another tab people forget to open.
        </p>
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
            Live from production — walkthroughs, sandboxes, engagement loops and the training
            habits that helped a non-technical team learn by using the system.
          </p>
        </div>
      </div>
    </section>
  );
}
