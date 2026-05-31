const signals = ["Training hub", "Sandboxes", "Leaderboards", "Characterful agents"];

export function Adoption() {
  return (
    <section className="border-b border-ink/10 bg-cream-deep">
      <div className="mx-auto max-w-6xl px-6 py-16 lg:py-20">
        <p className="section-label mb-4">Adoption by design</p>
        <blockquote className="font-display max-w-2xl text-2xl font-medium italic text-ink">
          Personality is not decoration — it is adoption infrastructure.
        </blockquote>
        <div className="mt-6 flex flex-wrap gap-2">
          {signals.map((signal) => (
            <span
              key={signal}
              className="rounded-full border border-ink/10 bg-white px-3 py-1 text-xs font-medium text-ink-muted"
            >
              {signal}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
