import { AskClivePanel } from "@/components/AskClivePanel";

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
            In plain terms: Clive keeps track of what your agents are allowed to know, where that
            knowledge came from, and when it needs updating — so they stay trustworthy as the
            business changes.
          </p>
        </div>

        <AskClivePanel />
      </div>
    </section>
  );
}
