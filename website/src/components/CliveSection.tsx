export function CliveSection() {
  return (
    <section id="clive" className="border-b border-ink/10 bg-white">
      <div className="mx-auto grid max-w-6xl gap-12 px-6 py-16 lg:grid-cols-2 lg:py-20">
        <div>
          <p className="section-label mb-4">The context product</p>
          <h2 className="font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
            Clive
          </h2>
          <blockquote className="mt-6 font-display text-xl italic text-apricot">
            AstraJax structures the work. Clive structures the context. Agents use both.
          </blockquote>
          <p className="mt-6 text-lg leading-relaxed text-ink-muted">
            Keeps the context agents rely on clean and current. Fits the hand-over &amp; maintain
            step, so agents stay trustworthy as the business changes.
          </p>
        </div>

        <div className="card flex flex-col p-6">
          <div className="mb-4 flex items-center justify-between">
            <p className="section-label">Ask Clive</p>
            <span className="status-pill status-pill--pending">Coming soon</span>
          </div>
          <div className="card-muted flex flex-1 flex-col justify-between p-5">
            <div className="space-y-3">
              <div className="rounded-lg bg-white px-4 py-3 text-sm text-ink-muted">
                Context health · sources current
              </div>
              <div className="rounded-lg bg-apricot/10 px-4 py-3 text-sm text-ink">
                <span className="font-medium">Clive:</span> Ask me about AstraJax, the method, or
                how context governance works.
              </div>
            </div>
            <p className="mt-6 text-xs text-ink-muted">
              Shell placeholder — wire to a live agent in the next build pass.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
