const advantages = [
  {
    title: "The best tools are shaped closest to the work.",
    body: "The operator knows the awkward exceptions, the real incentives, the messy handoffs and the moment an answer is quietly wrong. AstraJax keeps that judgement in the build instead of translating it away.",
  },
  {
    title: "Speed makes the system better.",
    body: "No coordinator → operator → product manager → developer → product manager → operator loop. The expert can shape context, test the agent, spot what broke and feed the correction back while the work is still warm.",
  },
  {
    title: "Speed keeps people engaged.",
    body: "When teams see feedback understood and actioned quickly, they stay tolerant of early failures. The tool gets stress-tested in real operation, improves faster and earns trust because people can see it learning.",
  },
];

export function CitizenBuilder() {
  return (
    <section id="citizen-builder" className="border-b border-ink/10 bg-cream-deep">
      <div className="mx-auto max-w-6xl px-6 py-16 lg:py-20">
        <div className="grid gap-10 lg:grid-cols-[0.82fr_1.18fr] lg:items-start">
          <div>
            <p className="section-label mb-4">Citizen-as-builder</p>
            <h2 className="font-display max-w-xl text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
              The people closest to the work should shape the AI.
            </h2>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-ink-muted">
              Most agent tools are still built by developers, or by teams who think like builders.
              Even when the interface is cleaner, the assumptions can still make non-technical
              people feel like guests in someone else&apos;s world.
            </p>
            <p className="mt-4 max-w-xl text-lg leading-relaxed text-ink-muted">
              AstraJax exists to decodify that world: to make citizen-as-builder the standard, not
              the exception.
            </p>
          </div>

          <div className="space-y-4">
            {advantages.map((advantage) => (
              <article key={advantage.title} className="card p-5">
                <h3 className="font-display text-xl font-semibold text-ink">{advantage.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-muted">{advantage.body}</p>
              </article>
            ))}
          </div>
        </div>

        <div className="mt-10 rounded-2xl border border-apricot/25 bg-white/70 p-6">
          <div className="grid gap-6 lg:grid-cols-[1fr_0.9fr] lg:items-start">
            <div>
              <p className="section-label mb-3">Humans keep judgement</p>
              <p className="font-display text-2xl leading-snug font-medium text-ink italic">
                This is your decision. You now have context-aware, bias-checked opinions. You
                decide.
              </p>
              <p className="mt-4 text-sm leading-relaxed text-ink-muted">
                AstraJax does not ask AI to replace judgement. It gives the expert the helpful
                case, the sceptical case, the evidence and the trade-off, then makes ownership
                explicit.
              </p>
            </div>
            <p className="text-sm leading-relaxed text-ink-muted">
              For high-stakes decisions, Court Mode can bring in multiple role-based perspectives:
              upside, risk, evidence, implementation and human reaction. Full Story, Light Story or
              No Story; the substance stays the same. HyperAgent is the first runtime AstraJax
              services, while the adoption layer stays tool-agnostic.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
