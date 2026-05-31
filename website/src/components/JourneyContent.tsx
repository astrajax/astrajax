import Link from "next/link";
import { JourneyTimeline } from "@/components/JourneyTimeline";
import { BOOKING_URL } from "@/lib/site";
import {
  journeyActs,
  journeyClose,
  journeyIntro,
} from "@/lib/journey";

export function JourneyContent() {
  return (
    <main>
      <section className="border-b border-ink/10 bg-moss text-parchment">
        <div className="mx-auto max-w-6xl px-6 py-20 lg:py-28">
          <p className="section-label mb-4 text-parchment/60">{journeyIntro.eyebrow}</p>
          <h1 className="font-display max-w-3xl text-4xl font-semibold tracking-tight sm:text-5xl">
            {journeyIntro.headline}
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-parchment/80">
            {journeyIntro.summary}
          </p>
          <ol className="mt-8 max-w-2xl space-y-3 border-l-2 border-apricot/60 pl-5">
            {journeyIntro.structure.map((part, index) => (
              <li key={part} className="text-parchment/85">
                <span className="font-mono text-xs text-buttermilk">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span className="mt-1 block text-base leading-relaxed">{part}</span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <JourneyTimeline acts={journeyActs} />

      <section className="border-b border-ink/10 bg-moss text-parchment">
        <div className="mx-auto max-w-6xl px-6 py-16 lg:py-20">
          <p className="section-label mb-4 text-parchment/60">The close</p>
          <h2 className="font-display max-w-3xl text-3xl font-semibold tracking-tight sm:text-4xl">
            {journeyClose.headline}
          </h2>
          <ul className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {journeyClose.lines.map((line) => (
              <li
                key={line}
                className="rounded-xl border border-parchment/10 bg-graphite/40 px-4 py-3 font-display text-lg"
              >
                {line}
              </li>
            ))}
          </ul>
          <div className="mt-8 max-w-3xl space-y-4 text-lg leading-relaxed text-parchment/80">
            {journeyClose.body.map((paragraph) => (
              <p key={paragraph.slice(0, 48)}>{paragraph}</p>
            ))}
          </div>
          <blockquote className="mt-10 border-l-2 border-apricot pl-5 font-display text-2xl italic text-buttermilk sm:text-3xl">
            {journeyClose.pullQuote}
          </blockquote>
          <div className="mt-10 flex flex-wrap gap-4">
            <a
              href={BOOKING_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary"
            >
              Book a Commercial OS Audit
              <span aria-hidden>→</span>
            </a>
            <Link href="/" className="btn-secondary">
              Back to AstraJax
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
