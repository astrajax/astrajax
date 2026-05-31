const deliverables = [
  "Workflow map & data / tool audit",
  "AI-readiness assessment",
  "Prioritised roadmap + sprint plan",
];

export function CtaClose() {
  return (
    <section id="start" className="bg-moss text-parchment">
      <div className="mx-auto max-w-6xl px-6 py-20 lg:py-28">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-start">
          <div>
            <p className="section-label mb-4 text-parchment/60">Start with an Audit</p>
            <h2 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
              Your experts don&apos;t need to become technical.
            </h2>
            <p className="mt-4 text-lg text-parchment/80">
              You keep the judgement; agents take the sludge.
            </p>
            <a href="mailto:hello@astrajax.com" className="btn-primary mt-8">
              Request your Audit
              <span aria-hidden>→</span>
            </a>
            <p className="mt-4 text-xs text-parchment/50">
              Booking mechanism TBC — replace mailto with Calendly or form when ready.
            </p>
          </div>
          <div className="rounded-xl border border-parchment/10 bg-graphite/40 p-6">
            <p className="section-label mb-4 text-parchment/60">What you get</p>
            <ul className="space-y-3">
              {deliverables.map((item) => (
                <li key={item} className="flex gap-3 text-sm text-parchment/80">
                  <span className="text-sage" aria-hidden>
                    ✓
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
