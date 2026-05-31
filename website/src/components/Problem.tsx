const points = [
  "Work lives across Sheets, Slack, Gmail, WhatsApp, Notion — or in people's heads.",
  "Operators copy, chase, reconcile and report instead of doing the work that matters.",
  "AI experiments fail because the data and workflows underneath aren't ready.",
];

export function Problem() {
  return (
    <section id="problem" className="border-b border-ink/10">
      <div className="mx-auto max-w-6xl px-6 py-16 lg:py-20">
        <p className="section-label mb-4">01 · The problem</p>
        <h2 className="font-display max-w-2xl text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
          Heroic people hold the business together; the systems don&apos;t.
        </h2>
        <ul className="mt-8 max-w-2xl space-y-4">
          {points.map((point) => (
            <li key={point} className="flex gap-3 text-lg leading-relaxed text-ink-muted">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-apricot" aria-hidden />
              {point}
            </li>
          ))}
        </ul>
        <aside className="card-muted mt-10 max-w-xl p-5">
          <p className="section-label mb-2">What we&apos;re not</p>
          <p className="text-sm leading-relaxed text-ink-muted">
            Not a generic AI consultancy, lead-gen agency, Airtable build shop, CRM installer or
            chatbot vendor.
          </p>
        </aside>
      </div>
    </section>
  );
}
