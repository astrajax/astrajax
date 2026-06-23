const offers = [
  {
    title: "Adoption OS Audit",
    body: "Find the adoption gap.",
    detail: "Where agents will fail: context, ownership, trust, workflow fit and feedback loops.",
  },
  {
    title: "Brain & Fleet Sprint",
    body: "Build the first loop.",
    detail: "A guided context brain, first agent fleet, approval rules and deployment package.",
  },
  {
    title: "Domain Architect Enablement",
    body: "Coach the citizen-builders.",
    detail: "Your experts learn to shape, test and improve agents without becoming developers.",
  },
  {
    title: "Clive",
    body: "Keep the brain clean.",
    detail: "Keeps agent context current, sourced, human-approved and ready for the runtime.",
    highlight: true,
  },
];

export function Offers() {
  return (
    <section id="offers" className="border-b border-ink/10">
      <div className="mx-auto max-w-6xl px-6 py-16 lg:py-20">
        <p className="section-label mb-4">Four ways in</p>
        <h2 className="font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
          Start where adoption usually breaks.
        </h2>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
            Start with the Adoption Audit
            <span aria-hidden>→</span>
          </a>
        </div>
      </div>
    </section>
  );
}
