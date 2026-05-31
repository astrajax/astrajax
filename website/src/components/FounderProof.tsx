const tags = ["Ex-actor, RADA", "Ex-Head of Direct Sales", "Never wrote code"];

export function FounderProof() {
  return (
    <section className="border-b border-ink/10 bg-white">
      <div className="mx-auto max-w-6xl px-6 py-16 lg:py-20">
        <p className="section-label mb-6">Founder proof</p>
        <blockquote className="font-display max-w-3xl text-2xl leading-snug font-medium italic text-ink sm:text-3xl">
          Domain experts don&apos;t need to become technical. With AI, they can become
          architects.
        </blockquote>
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-ink-muted">
          A non-technical commercial leader built a production operating system at scale — with
          AI, on clean data,{" "}
          <strong className="font-medium text-ink">never hand-coded</strong>.
        </p>
        <div className="mt-6 flex flex-wrap gap-2">
          {tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full border border-apricot/30 bg-apricot/10 px-3 py-1 text-xs font-medium text-apricot"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
