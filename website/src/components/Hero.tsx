import Link from "next/link";
import { AgentFleetVideo } from "@/components/AgentFleetVideo";
import { BOOKING_URL } from "@/lib/site";

export function Hero() {
  return (
    <section id="story" className="border-b border-ink/10">
      <div className="mx-auto grid max-w-[96rem] gap-10 px-6 py-20 lg:grid-cols-[minmax(0,0.72fr)_minmax(0,1.48fr)] lg:items-stretch lg:gap-8 lg:py-28">
        <div className="flex flex-col justify-between gap-10 lg:min-h-[34rem]">
          <div className="space-y-8">
            <p className="section-label">The adoption operating system for AI agents</p>
            <h1 className="font-display text-4xl leading-[1.08] font-semibold tracking-tight text-ink sm:text-5xl lg:text-[3.25rem]">
              For the people who know the work — not the developers.
            </h1>
            <p className="max-w-xl text-lg leading-relaxed text-ink-muted">
              Anyone can build an agent now. AstraJax helps teams actually adopt them — starting
              with curated context, turning domain experts into agent architects, and building
              fleets people trust, use and keep improving.
            </p>
            <div className="flex flex-wrap gap-4">
              <a
                href={BOOKING_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary"
              >
                Start with an Adoption Audit
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
            Ask Clive about the adoption OS ↓
          </a>
        </div>

        <div
          id="agent-cast"
          className="flex min-h-0 scroll-mt-24 flex-col justify-center lg:min-h-[34rem] xl:min-w-0 xl:pr-0"
        >
          <h2 className="font-display text-3xl leading-tight font-medium text-ink italic sm:text-4xl lg:text-[2.75rem]">
            Proof that personality drives adoption
          </h2>
          <div className="mt-4 w-full lg:mt-5">
            <AgentFleetVideo />
          </div>
          <p className="mt-4 text-sm leading-relaxed text-ink-muted/70 italic sm:text-base">
            A real operational agent fleet with names, jobs and just enough theatre to make people
            actually use it.
          </p>
        </div>
      </div>
    </section>
  );
}
