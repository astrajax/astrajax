import { AskClivePanel } from "@/components/AskClivePanel";

const capabilities = [
  {
    title: "Clive reasons",
    body: "Explains, drafts, and helps shape context with the operator — he does not write canonical truth.",
  },
  {
    title: "Pam challenges",
    body: "Stress-tests assumptions, evidence, scope, and action readiness before anything sticks.",
  },
  {
    title: "You decide",
    body: "The Architect chooses what becomes trusted context, policy, or live action.",
  },
  {
    title: "Doc executes",
    body: "Approved work is dispatched with a paper trail. HyperAgent runs the agents.",
  },
];

export function CliveSection() {
  return (
    <section id="clive" className="scroll-mt-24 border-b border-ink/10 bg-white">
      <div className="mx-auto grid max-w-6xl gap-12 px-6 py-16 lg:grid-cols-2 lg:py-20">
        <div>
          <p className="section-label mb-4">Build the brain</p>
          <h2 className="font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
            Agents are only as useful as the context they reason from.
          </h2>
          <p className="mt-3 text-sm font-medium text-apricot">
            Not a chatbot. Context as an operating layer.
          </p>
          <blockquote className="mt-6 font-display text-xl italic text-apricot">
            AstraJax structures adoption. Clive structures context. Agent runtimes execute the work.
          </blockquote>
          <p className="mt-6 text-lg leading-relaxed text-ink-muted">
            Clive reasons with you — explains, drafts, and helps shape context. He does not write
            canonical truth. Pam challenges. You decide what becomes trusted. That is how the
            command centre stays useful without becoming loose.
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
