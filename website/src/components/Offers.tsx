const offers = [
  {
    title: "Commercial OS Audit",
    body: "Diagnose & plan.",
    detail: "Where you lose time, visibility and leverage — with a roadmap to fix it.",
  },
  {
    title: "Commercial OS Sprint",
    body: "Build the first layer.",
    detail: "A done-with-you build of your first clean, AI-ready operating layer.",
  },
  {
    title: "Domain Architect Enablement",
    body: "Coach the experts.",
    detail: "Your people learn to shape, run and safely improve the system themselves.",
  },
  {
    title: "Clive",
    body: "Keep context clean.",
    detail: "Keeps the context your agents rely on current, sourced and trustworthy.",
    highlight: true,
  },
];

export function Offers() {
  return (
    <section id="offers" className="border-b border-ink/10">
      <div className="mx-auto max-w-6xl px-6 py-16 lg:py-20">
        <p className="section-label mb-4">Four ways in</p>
        <h2 className="font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
          Start where it&apos;s safe to start.
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
            Start with the Audit
            <span aria-hidden>→</span>
          </a>
        </div>
      </div>
    </section>
  );
}
