const steps = [
  { num: "01", title: "Diagnose", body: "Find the trapped work." },
  { num: "02", title: "Boring layer", body: "Clean data, clear flows." },
  { num: "03", title: "Architects", body: "Judgement → system." },
  { num: "04", title: "Bounded agents", body: "Approved, audited." },
  { num: "05", title: "Adoption", body: "Trust, training, value." },
  { num: "06", title: "Maintain", body: "Context governance." },
];

export function Method() {
  return (
    <section id="method" className="scroll-mt-24 border-b border-ink/10 bg-moss text-parchment">
      <div className="mx-auto max-w-6xl px-6 py-16 lg:py-20">
        <p className="section-label mb-4 text-parchment/60">02 · The method</p>
        <h2 className="font-display max-w-2xl text-3xl font-semibold tracking-tight sm:text-4xl">
          From mess to a system your team trusts.
        </h2>
        <p className="mt-4 max-w-2xl text-lg leading-relaxed text-parchment/80">
          Diagnose the mess → build the boring layer → turn experts into architects → add bounded
          agents → engineer adoption → hand over &amp; maintain.
        </p>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {steps.map((step) => (
            <article
              key={step.num}
              className="rounded-xl border border-parchment/10 bg-graphite/40 p-5"
            >
              <p className="font-mono text-xs text-buttermilk">{step.num}</p>
              <h3 className="mt-2 font-display text-xl font-semibold">{step.title}</h3>
              <p className="mt-2 text-sm text-parchment/70">{step.body}</p>
            </article>
          ))}
        </div>
        <blockquote className="mt-10 border-l-2 border-apricot pl-5 font-display text-xl italic text-buttermilk">
          The boring layer makes the exciting layer possible.
        </blockquote>
        <p className="mt-4 text-sm text-parchment/60">
          ~12 months on the boring layer → screens in ~1 month → first agents in ~2 weeks. Built
          with AI, on clean data — never hand-coded.
        </p>
      </div>
    </section>
  );
}
