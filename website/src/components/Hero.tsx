import Image from "next/image";
import { FoundingCastHero } from "@/components/FoundingCastHero";
import { BOOKING_URL } from "@/lib/site";

export function Hero() {
  return (
    <section id="story" className="border-b border-ink/10 bg-cream">
      <div className="mx-auto grid max-w-[96rem] gap-12 px-6 py-20 lg:grid-cols-[minmax(0,0.72fr)_minmax(0,1.48fr)] lg:items-stretch lg:gap-10 lg:py-28">
        <div className="flex flex-col justify-center gap-10 lg:min-h-[34rem] lg:gap-12 lg:pr-2 xl:pr-6">
          <div className="flex flex-col items-center justify-center text-center lg:items-start lg:text-left">
            <Image
              src="/astrajax-logo.png"
              alt="AstraJax"
              width={112}
              height={112}
              priority
              className="h-20 w-20 shrink-0 sm:h-24 sm:w-24 lg:h-28 lg:w-28"
            />
            <p className="mt-5 font-body text-xs font-medium tracking-[0.38em] text-ink uppercase sm:text-sm">
              ASTRAJAX
            </p>
          </div>

          <div className="space-y-4 text-center lg:text-left">
            <h1 className="text-balance font-display text-3xl leading-[1.12] font-semibold tracking-tight text-ink sm:text-4xl lg:text-[2.75rem]">
              The AI Adoption
              <span className="block">Operating System</span>
            </h1>
            <p className="text-base leading-relaxed text-ink-muted sm:text-lg">
              Building is commoditised. Adoption is the moat.
            </p>
            <a
              href={BOOKING_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary mt-2 inline-flex"
            >
              Start with an Adoption Audit
              <span aria-hidden>→</span>
            </a>
          </div>
        </div>

        <div
          id="agent-cast"
          className="flex min-h-0 scroll-mt-24 items-center justify-center lg:min-h-[38rem] xl:min-w-0"
        >
          <FoundingCastHero />
        </div>
      </div>
    </section>
  );
}
