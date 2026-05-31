import { AskClivePanel } from "@/components/AskClivePanel";

const capabilities = [
  { title: "Intake", body: "Capture rules, decisions and know-how as they happen." },
  { title: "Curate", body: "Keep one source of truth — sourced and current." },
  { title: "Human approval", body: "Nothing enters the knowledge layer unapproved." },
  { title: "Scan", body: "Flag stale, conflicting or missing context before agents trip on it." },
];

export function CliveSection() {
  return (
    <section id="clive" className="border-b border-ink/10 bg-white">
      <div className="mx-auto grid max-w-6xl gap-12 px-6 py-16 lg:grid-cols-2 lg:py-20">
        <div>
          <p className="section-label mb-4">The context product</p>
          <h2 className="font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
            Clive
          </h2>
          <p className="mt-3 text-sm font-medium text-apricot">
            A managed context environment — not a chatbot.
          </p>
          <blockquote className="mt-6 font-display text-xl italic text-apricot">
            AstraJax structures the work. Clive structures the context. Agents use both.
          </blockquote>
          <p className="mt-6 text-lg leading-relaxed text-ink-muted">
            Clive is the system that decides what your agents are allowed to know, where that
            knowledge came from, and when it needs updating — a human-approved knowledge layer that
            keeps every agent trustworthy as the business changes. The chat is just one way to ask
            it questions.
          </p>
          <dl className="mt-8 grid gap-x-6 gap-y-5 sm:grid-cols-2">
            {capabilities.map((capability) => (
              <div key={capability.title}>
                <dt className="font-display text-base font-semibold text-ink">
                  {capability.title}
                </dt>
                <dd className="mt-1 text-sm leading-relaxed text-ink-muted">{capability.body}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div>
          <p className="section-label mb-3">A small taste — ask the context layer</p>
          <AskClivePanel />
        </div>
      </div>
    </section>
  );
}
