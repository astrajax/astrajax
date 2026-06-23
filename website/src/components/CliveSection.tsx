import { AskClivePanel } from "@/components/AskClivePanel";

const capabilities = [
  { title: "Intake", body: "Extract the business, rules, goals and judgement calls." },
  { title: "Curate", body: "Turn raw know-how into scoped, sourced context." },
  { title: "Human approval", body: "Experts decide what becomes trusted agent knowledge." },
  { title: "Improve", body: "Fold feedback back into the brain as agents are used." },
];

export function CliveSection() {
  return (
    <section id="clive" className="scroll-mt-24 border-b border-ink/10 bg-white">
      <div className="mx-auto grid max-w-6xl gap-12 px-6 py-16 lg:grid-cols-2 lg:py-20">
        <div>
          <p className="section-label mb-4">Build the brain</p>
          <h2 className="font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
            Clive is the context engine inside AstraJax.
          </h2>
          <p className="mt-3 text-sm font-medium text-apricot">
            Not a chatbot. A human-approved brain for agent fleets.
          </p>
          <blockquote className="mt-6 font-display text-xl italic text-apricot">
            AstraJax structures adoption. Clive structures context. Agent runtimes execute the work.
          </blockquote>
          <p className="mt-6 text-lg leading-relaxed text-ink-muted">
            Adoption only sticks if the agents actually work. Clive gives them the scoped, sourced
            and human-approved context they reason from — then keeps that context current as people
            use the system and correct what it gets wrong.
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

        <div id="ask-clive" className="scroll-mt-24">
          <p className="section-label mb-3">A small taste — ask the brain</p>
          <AskClivePanel />
        </div>
      </div>
    </section>
  );
}
