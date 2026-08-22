import { BOOKING_URL } from "@/lib/site";

const deliverables = [
  "Adoption risk map",
  "Context and agent-readiness assessment",
  "First brain and fleet sprint plan",
];

export function CtaClose() {
  return (
    <section id="start" className="bg-moss text-parchment">
      <div className="mx-auto max-w-6xl px-6 py-20 lg:py-28">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-start">
          <div>
            <p className="section-label mb-4 text-parchment/60">Start with The Household</p>
            <h2 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
              Your experts should be shaping the AI already.
            </h2>
            <p className="mt-4 text-lg text-parchment/80">
              AstraJax gives them the context, guardrails and adoption loop to do it safely.
            </p>
            <a
              href={BOOKING_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary mt-8"
            >
              Book The AstraJax Household
              <span aria-hidden>→</span>
            </a>
          </div>
          <div className="rounded-xl border border-parchment/10 bg-graphite/40 p-6">
            <p className="section-label mb-4 text-parchment/60">What you get</p>
            <ul className="space-y-3">
              {deliverables.map((item) => (
                <li key={item} className="flex gap-3 text-sm text-parchment/80">
                  <span className="text-sage" aria-hidden>
                    ✓
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
