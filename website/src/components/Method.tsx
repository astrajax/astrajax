const steps = [
  {
    num: "01",
    title: "Map the operator",
    body: "Understand the person in the chair before asking them to shape agents.",
  },
  {
    num: "02",
    title: "Build the brain",
    body: "Capture the business, rules, goals, edge cases and what good looks like.",
  },
  {
    num: "03",
    title: "Shape the fleet",
    body: "Task-scoped agents — personality editable, competence locked.",
  },
  {
    num: "04",
    title: "Challenge & decide",
    body: "Clive reasons. Pam challenges. The Architect decides.",
  },
  {
    num: "05",
    title: "Doc dispatches",
    body: "Approved briefs become records, packages or builds — then the runtime runs.",
  },
  {
    num: "06",
    title: "Coach & mature",
    body: "Feedback improves the brain. Better context lowers cost.",
  },
];

export function Method() {
  return (
    <section id="method" className="scroll-mt-24 border-b border-ink/10 bg-moss text-parchment">
      <div className="mx-auto max-w-6xl px-6 py-16 lg:py-20">
        <p className="section-label mb-4 text-parchment/60">02 · The method</p>
        <h2 className="font-display max-w-2xl text-3xl font-semibold tracking-tight sm:text-4xl">
          A closed loop for getting AI used.
        </h2>
        <p className="mt-4 max-w-2xl text-lg leading-relaxed text-parchment/80">
          Operator map → brain → fleet → challenge → human approval → Doc → runtime → coaching.
          Every step keeps the domain expert in charge of what good means.
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
          The personality is editable. The competence is locked.
        </blockquote>
        <p className="mt-4 text-sm text-parchment/60">
          People get creative control without being allowed to break the machine. That is how
          Architects stay safe while still feeling ownership. Story mode is configurable: theatre
          when it helps adoption, restraint when the room needs it.
        </p>
      </div>
    </section>
  );
}
