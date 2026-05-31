export function Hero() {
  return (
    <section id="story" className="border-b border-ink/10">
      <div className="mx-auto grid max-w-6xl gap-12 px-6 py-20 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:py-28">
        <div className="space-y-8">
          <p className="section-label">Built with AI, by a non-technical operator</p>
          <h1 className="font-display text-4xl leading-[1.08] font-semibold tracking-tight text-ink sm:text-5xl lg:text-[3.25rem]">
            Stop running high-value work through low-leverage tools.
          </h1>
          <p className="max-w-xl text-lg leading-relaxed text-ink-muted">
            AstraJax turns messy workflows, scattered data and trapped know-how into{" "}
            <strong className="font-medium text-ink">AI-ready operating systems</strong> — built
            with the people who know the work best.
          </p>
          <div className="flex flex-wrap gap-4">
            <a href="#start" className="btn-primary">
              Get a Commercial OS Audit
              <span aria-hidden>→</span>
            </a>
            <a href="#proof" className="btn-secondary">
              See the Butternut story
            </a>
          </div>
        </div>

        <div className="card p-6 lg:p-8">
          <div className="mb-4 flex items-center justify-between">
            <p className="section-label">Operating system — illustrative</p>
            <span className="status-pill status-pill--live">Live preview</span>
          </div>
          <div className="space-y-3 font-mono text-xs">
            <div className="flex items-center justify-between rounded-lg bg-cream px-4 py-3">
              <span className="text-ink-muted">Pipeline · market</span>
              <span className="status-pill status-pill--live">Live</span>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-cream px-4 py-3">
              <span className="text-ink-muted">Approvals</span>
              <span className="status-pill status-pill--pending">2 pending</span>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-cream px-4 py-3">
              <span className="text-ink-muted">Data health</span>
              <span className="status-pill status-pill--clean">Clean</span>
            </div>
          </div>
          <p className="mt-4 text-sm text-ink-muted">
            The product is the proof — don&apos;t just describe the system, show it.
          </p>
        </div>
      </div>
    </section>
  );
}
