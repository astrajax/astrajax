const offers = [
  {
    title: "Adoption Readiness Audit",
    body: "Find the adoption gap.",
    detail:
      "Where AI adoption is stalling: context readiness, trust gaps, workflow fit, model usage, and a clear roadmap.",
  },
  {
    title: "Brain & Fleet Sprint",
    body: "Build the first loop.",
    detail:
      "A done-with-you build of the first context brain, agent fleet, approval rules, and deployment package.",
  },
  {
    title: "Partnership",
    body: "Move faster with support.",
    detail:
      "Hands-on architecture, Architect training, context design, and adoption support for teams that want to go further.",
    highlight: true,
  },
];

export function Offers() {
  return (
    <section id="offers" className="border-b border-ink/10">
      <div className="mx-auto max-w-6xl px-6 py-16 lg:py-20">
        <p className="section-label mb-4">Three ways in</p>
        <h2 className="font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
          Start where adoption usually breaks.
        </h2>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {offers.map((offer) => (
            <article
              key={offer.title}
              className={`card p-6 ${offer.highlight ? "border-apricot/30 bg-apricot/5" : ""}`}
            >
              <h3 className="font-display text-xl font-semibold">{offer.title}</h3>
              <p className="mt-1 text-sm font-medium text-apricot">{offer.body}</p>
              <p className="mt-3 text-sm leading-relaxed text-ink-muted">{offer.detail}</p>
            </article>
          ))}
        </div>
        <div className="mt-8">
          <a href="#start" className="btn-primary">
            Start with the Adoption Readiness Audit
            <span aria-hidden>→</span>
          </a>
        </div>
      </div>
    </section>
  );
}
