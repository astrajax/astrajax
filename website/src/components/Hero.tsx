import { AgentFleetVideo } from "@/components/AgentFleetVideo";
import { BOOKING_URL } from "@/lib/site";

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
            <a
              href={BOOKING_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary"
            >
              Get a Commercial OS Audit
              <span aria-hidden>→</span>
            </a>
            <a href="#proof" className="btn-secondary">
              See the Butternut story
            </a>
          </div>
        </div>

        <div className="card overflow-hidden p-6 lg:p-8">
          <div className="mb-4 flex items-center justify-between gap-3">
            <p className="section-label">Agent fleet — production</p>
            <span className="status-pill status-pill--live">Live</span>
          </div>
          <AgentFleetVideo />
          <p className="mt-4 text-sm text-ink-muted">
            The gang — Bot Fleet from production. The product is the proof.
          </p>
        </div>
      </div>
    </section>
  );
}
