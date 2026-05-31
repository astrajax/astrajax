const stats = [
  { value: "~£180k", label: "yr travel saved" },
  { value: "~3,000 hrs", label: "yr capacity at scale" },
  { value: "~£8.1m", label: "Direct Sales channel" },
];

export function Proof() {
  return (
    <section id="proof" className="border-b border-ink/10">
      <div className="mx-auto max-w-6xl px-6 py-16 lg:py-20">
        <p className="section-label mb-4">03 · Proof</p>
        <h2 className="font-display max-w-2xl text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
          From inboxes to an operating system.
        </h2>
        <p className="mt-4 max-w-2xl text-lg leading-relaxed text-ink-muted">
          From Gmail, WhatsApp, Notion, and Google Sheets to an operating system. ~12 months on the
          boring layer, then a fleet of custom screens in ~1 month and the first agents in ~2
          weeks — fast because the foundation existed.
        </p>
        <div className="mt-10 grid gap-4 sm:grid-cols-3">
          {stats.map((stat) => (
            <div key={stat.label} className="card p-6">
              <p className="font-display text-3xl font-semibold text-apricot">{stat.value}</p>
              <p className="mt-1 text-sm text-ink-muted">{stat.label}</p>
            </div>
          ))}
        </div>
        <p className="mt-8 max-w-2xl text-sm text-ink-muted">
          Bounded agents follow the Trinity pattern: link → propose → human approves → execute.
          Humans keep judgement; agents take the sludge.
        </p>
      </div>
    </section>
  );
}
