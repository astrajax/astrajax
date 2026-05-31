import Link from "next/link";
import { AgentFleetVideo } from "@/components/AgentFleetVideo";
import { BOOKING_URL } from "@/lib/site";

export function Hero() {
  return (
    <section id="story" className="border-b border-ink/10">
      <div className="mx-auto grid max-w-7xl gap-10 px-6 py-20 lg:grid-cols-[0.88fr_1.32fr] lg:items-stretch lg:gap-12 lg:py-28">
        <div className="flex flex-col justify-between gap-10 lg:min-h-[34rem]">
          <div className="space-y-8">
            <p className="section-label">Built with AI, by a non-technical operator</p>
            <h1 className="font-display text-4xl leading-[1.08] font-semibold tracking-tight text-ink sm:text-5xl lg:text-[3.25rem]">
              Stop running high-value work through low-leverage tools.
            </h1>
            <p className="max-w-xl text-lg leading-relaxed text-ink-muted">
              AstraJax turns messy workflows, scattered data and trapped know-how into{" "}
              <strong className="font-medium text-ink">AI-ready operating systems</strong> — then adds
              bounded agents your team can actually trust. Built for and by the people who run the
              business — not the data team.
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
              <Link href="/journey" className="btn-secondary">
                See the Butternut story
              </Link>
            </div>
          </div>

          <a
            href="#ask-clive"
            className="font-display text-xl italic text-ink transition hover:text-apricot sm:text-2xl"
          >
            Ask Clive about AstraJax ↓
          </a>
        </div>

        <div className="card flex min-h-0 flex-col overflow-hidden p-2 sm:p-3 lg:min-h-[34rem]">
          <div className="mb-2 flex shrink-0 items-center justify-between gap-3 px-1 sm:mb-3">
            <p className="section-label">Agent fleet — production</p>
            <span className="status-pill status-pill--live">Live</span>
          </div>
          <div className="min-h-0 flex-1">
            <AgentFleetVideo />
          </div>
          <p className="mt-3 shrink-0 px-1 text-sm text-ink-muted sm:mt-4">
            The gang — Bot Fleet from production. The product is the proof.
          </p>
        </div>
      </div>
    </section>
  );
}
