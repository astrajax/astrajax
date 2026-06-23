const points = [
  "Agent demos work once, then fail when they meet messy data, vague context and real judgement calls.",
  "Most tools are still shaped by developer assumptions, even when they call themselves no-code.",
  "Teams stop feeding the system when feedback disappears into a slow build queue.",
];

export function Problem() {
  return (
    <section id="problem" className="border-b border-ink/10">
      <div className="mx-auto max-w-6xl px-6 py-16 lg:py-20">
        <p className="section-label mb-4">01 · The problem</p>
        <h2 className="font-display max-w-2xl text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
          The market has solved agent building. It has not solved adoption.
        </h2>
        <p className="mt-5 max-w-2xl text-lg leading-relaxed text-ink-muted">
          Non-technical users are told they can build with AI, but too often the experience still
          feels like being invited into someone else&apos;s technical world. The people closest to the
          work know what matters; the tools rarely start there.
        </p>
        <ul className="mt-8 max-w-2xl space-y-4">
          {points.map((point) => (
            <li key={point} className="flex gap-3 text-lg leading-relaxed text-ink-muted">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-apricot" aria-hidden />
              {point}
            </li>
          ))}
        </ul>
        <aside className="card-muted mt-10 max-w-xl p-5">
          <p className="section-label mb-2">Where we start</p>
          <p className="text-sm leading-relaxed text-ink-muted">
            Not another agent builder. AstraJax starts with the human judgement, context and
            feedback loops that make agents worth using after the demo.
          </p>
        </aside>
      </div>
    </section>
  );
}
