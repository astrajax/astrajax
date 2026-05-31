import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { BOOKING_URL } from "@/lib/site";
import {
  seedsAgenticLayer,
  seedsAsk,
  seedsDifferentiators,
  seedsHero,
  seedsLinksPartnership,
  seedsMalawiRows,
  seedsModelRows,
  seedsNavLinks,
  seedsNeed,
  seedsParallelComparison,
  seedsUnlocks,
  type SeedsSplitRow,
} from "@/lib/seeds-of-promise";

function ClayButton({
  href,
  children,
  external,
}: {
  href: string;
  children: ReactNode;
  external?: boolean;
}) {
  const className =
    "inline-flex items-center gap-2 rounded-full bg-[#A95A2E] px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#95491F]";
  if (external) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
        {children}
      </a>
    );
  }
  return (
    <a href={href} className={className}>
      {children}
    </a>
  );
}

function PhotoCard({
  image,
}: {
  image: SeedsSplitRow["image"];
}) {
  return (
    <figure className="overflow-hidden rounded-2xl bg-black/10 shadow-lg shadow-black/10">
      <div className="relative aspect-[4/3] lg:aspect-auto lg:min-h-[24rem] lg:h-full">
        <Image
          src={image.src}
          alt={image.alt}
          fill
          className="object-cover"
          sizes="(max-width: 1024px) 100vw, 50vw"
        />
        {image.caption && (
          <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-4 pb-4 pt-10 font-mono text-[0.625rem] uppercase tracking-[0.12em] text-white/85">
            {image.caption}
          </figcaption>
        )}
      </div>
    </figure>
  );
}

function ContentCard({
  eyebrow,
  headline,
  lead,
  bullets,
  callout,
}: Pick<SeedsSplitRow, "eyebrow" | "headline" | "lead" | "bullets" | "callout">) {
  return (
    <article className="flex h-full flex-col justify-center rounded-2xl bg-[#F3EDDB] p-8 shadow-lg shadow-black/10 lg:p-10">
      <p className="section-label mb-4 text-[#6E7B52]">{eyebrow}</p>
      <h2 className="font-display text-3xl font-semibold tracking-tight text-[#23271B] sm:text-4xl">
        {headline}
      </h2>
      {lead && (
        <p className="mt-5 text-lg leading-relaxed text-[#4a4f4c]">{lead}</p>
      )}
      {bullets && (
        <ul className="mt-5 space-y-2.5 text-[#4a4f4c]">
          {bullets.map((item) => (
            <li key={item.slice(0, 48)} className="flex gap-3 leading-relaxed">
              <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#6E7B52]" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      )}
      {callout && (
        <p className="mt-6 border-l-2 border-[#A95A2E] pl-4 font-display text-lg italic text-[#23271B]">
          {callout}
        </p>
      )}
    </article>
  );
}

function SplitRow({ row }: { row: SeedsSplitRow }) {
  const photo = <PhotoCard image={row.image} />;
  const card = (
    <ContentCard
      eyebrow={row.eyebrow}
      headline={row.headline}
      lead={row.lead}
      bullets={row.bullets}
      callout={row.callout}
    />
  );

  return (
    <section id={row.id} className="scroll-mt-24">
      <div className="mx-auto grid max-w-6xl gap-6 px-6 py-8 lg:grid-cols-2 lg:items-stretch lg:gap-8 lg:py-10">
        {row.imageSide === "left" ? (
          <>
            {photo}
            {card}
          </>
        ) : (
          <>
            <div className="lg:order-2">{photo}</div>
            <div className="lg:order-1">{card}</div>
          </>
        )}
      </div>
    </section>
  );
}

function DifferentiatorGrid() {
  return (
    <section className="scroll-mt-24">
      <div className="mx-auto max-w-6xl px-6 py-8 lg:py-10">
        <div className="mb-6 max-w-3xl">
          <p className="section-label mb-4 text-[#F3EDDB]/70">Why this is different</p>
          <h2 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
            The agentic layer is the bridge between outside expertise and local action.
          </h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {seedsDifferentiators.map((item) => (
            <article
              key={item.title}
              className="rounded-2xl border border-white/10 bg-[#F3EDDB]/95 p-5 text-[#23271B] shadow-lg shadow-black/10"
            >
              <h3 className="font-display text-xl font-semibold tracking-tight">
                {item.title}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-[#4a4f4c]">
                {item.body}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function LinksPartnership() {
  const { links, sam } = seedsLinksPartnership;

  return (
    <section id={seedsLinksPartnership.id} className="scroll-mt-24 border-t border-white/10">
      <div className="mx-auto max-w-6xl px-6 py-16 lg:py-24">
        <article className="rounded-2xl bg-[#F3EDDB] p-8 text-[#23271B] shadow-lg shadow-black/10 lg:p-12">
          <p className="section-label mb-4 text-[#6E7B52]">
            {seedsLinksPartnership.eyebrow}
          </p>
          <h2 className="font-display max-w-3xl text-3xl font-semibold tracking-tight sm:text-4xl">
            {seedsLinksPartnership.headline}
          </h2>
          <p className="mt-6 max-w-3xl text-lg leading-relaxed text-[#4a4f4c]">
            {seedsLinksPartnership.lead}
          </p>

          <div className="mt-10 grid gap-6 lg:grid-cols-2">
            <div className="rounded-xl border border-[#6E7B52]/15 bg-white/60 p-6">
              <p className="section-label mb-3 text-[#6E7B52]">Who Links are</p>
              <h3 className="font-display text-2xl font-semibold tracking-tight">
                <a
                  href={links.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="transition-colors hover:text-[#A95A2E]"
                >
                  {links.name}
                </a>
              </h3>
              <p className="mt-4 text-sm leading-relaxed text-[#4a4f4c]">
                {links.description}
              </p>
              <a
                href={links.url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-[#A95A2E] transition-colors hover:text-[#95491F]"
              >
                Visit links.charity
                <span aria-hidden>→</span>
              </a>
            </div>

            <div className="rounded-xl border border-[#6E7B52]/15 bg-white/60 p-6">
              <p className="section-label mb-3 text-[#6E7B52]">Why Sam matters</p>
              <h3 className="font-display text-2xl font-semibold tracking-tight">
                {sam.name}
              </h3>
              <p className="mt-1 text-sm text-[#6E7B52]">{sam.role}</p>
              <p className="mt-4 text-sm leading-relaxed text-[#4a4f4c]">{sam.body}</p>
            </div>
          </div>

          <ul className="mt-10 grid gap-3 sm:grid-cols-2">
            {seedsLinksPartnership.confidence.map((item) => (
              <li
                key={item.slice(0, 48)}
                className="flex gap-3 rounded-xl border border-[#6E7B52]/15 bg-white/60 px-4 py-3 text-sm leading-relaxed text-[#4a4f4c]"
              >
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#6E7B52]" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </article>
      </div>
    </section>
  );
}

function ParallelLayers() {
  return (
    <section id={seedsParallelComparison.id} className="scroll-mt-24 border-t border-white/10">
      <div className="mx-auto max-w-6xl px-6 py-16 lg:py-24">
        <div className="mb-10 max-w-3xl">
          <p className="section-label mb-4 text-[#F3EDDB]/70">
            {seedsParallelComparison.eyebrow}
          </p>
          <h2 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
            {seedsParallelComparison.headline}
          </h2>
          <p className="mt-5 text-lg leading-relaxed text-[#F3EDDB]/85">
            {seedsParallelComparison.summary}
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {seedsParallelComparison.columns.map((column) => (
            <article
              key={column.title}
              className="rounded-2xl bg-[#F3EDDB] p-8 shadow-lg shadow-black/10 lg:p-10"
            >
              <header className="border-b border-[#6E7B52]/15 pb-6">
                <h3 className="font-display text-2xl font-semibold tracking-tight text-[#23271B]">
                  {column.title}
                </h3>
                <p className="mt-1 text-sm text-[#6E7B52]">{column.subtitle}</p>
              </header>
              <ol className="mt-6 space-y-6">
                {column.layers.map((layer) => (
                  <li key={layer.title} className="space-y-2">
                    <p className="font-mono text-xs uppercase tracking-[0.12em] text-[#6E7B52]">
                      {layer.layer}
                    </p>
                    <h4 className="font-display text-xl font-semibold text-[#23271B]">
                      {layer.title}
                    </h4>
                    <p className="text-sm leading-relaxed text-[#4a4f4c]">{layer.body}</p>
                  </li>
                ))}
              </ol>
            </article>
          ))}
        </div>

        <blockquote className="mt-10 max-w-3xl border-l-2 border-[#A95A2E] pl-5 font-display text-xl italic text-[#F3EDDB] sm:text-2xl">
          {seedsParallelComparison.principle}
        </blockquote>
      </div>
    </section>
  );
}

export function SeedsOfPromiseContent() {
  return (
    <main className="seeds-sage-page text-[#F3EDDB]">
      <div className="border-b border-white/10">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-5">
          <Link
            href="/"
            className="flex items-center gap-2.5 font-display text-lg font-semibold tracking-tight text-[#F3EDDB]"
          >
            <Image
              src="/astrajax-logo.png"
              alt=""
              width={28}
              height={28}
              className="h-7 w-7 shrink-0 rounded-sm"
            />
            <span>Seeds of Promise</span>
            <span className="hidden text-sm font-normal text-[#F3EDDB]/70 sm:inline">
              | An AstraJax initiative
            </span>
          </Link>
          <nav className="hidden items-center gap-5 md:flex">
            {seedsNavLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-sm text-[#F3EDDB]/85 transition-colors hover:text-[#F3EDDB]"
              >
                {link.label}
              </a>
            ))}
          </nav>
          <ClayButton href={BOOKING_URL} external>
            {seedsAsk.ctaPrimary}
            <span aria-hidden>→</span>
          </ClayButton>
        </div>
      </div>

      <section className="border-b border-white/10">
        <div className="mx-auto grid max-w-6xl gap-8 px-6 py-16 lg:grid-cols-2 lg:items-center lg:gap-12 lg:py-24">
          <div className="space-y-8">
            <h1 className="font-display text-4xl font-semibold tracking-tight sm:text-5xl lg:text-[3.25rem] lg:leading-[1.08]">
              {seedsHero.headline}
            </h1>
            <p className="max-w-xl text-lg leading-relaxed text-[#F3EDDB]/85">
              {seedsHero.summary}
            </p>
            <div className="flex flex-wrap gap-4">
              <ClayButton href={BOOKING_URL} external>
                {seedsHero.ctaPrimary}
                <span aria-hidden>→</span>
              </ClayButton>
              <a
                href={seedsHero.ctaSecondaryHref}
                className="inline-flex items-center gap-2 rounded-full border border-[#F3EDDB]/35 px-5 py-2.5 text-sm font-medium text-[#F3EDDB] transition-colors hover:border-[#F3EDDB]/60"
              >
                {seedsHero.ctaSecondary}
              </a>
            </div>
          </div>
          <PhotoCard image={seedsHero.image} />
        </div>
      </section>

      <SplitRow row={seedsNeed} />
      {seedsModelRows.map((row) => (
        <SplitRow key={row.id} row={row} />
      ))}
      <SplitRow row={seedsAgenticLayer} />
      <DifferentiatorGrid />
      <SplitRow row={seedsUnlocks} />
      {seedsMalawiRows.map((row) => (
        <SplitRow key={row.id} row={row} />
      ))}

      <LinksPartnership />

      <section id={seedsAsk.id} className="scroll-mt-24 border-t border-white/10">
        <div className="mx-auto max-w-6xl px-6 py-16 lg:py-24">
          <article className="rounded-2xl bg-[#F3EDDB] p-8 text-[#23271B] shadow-lg shadow-black/10 lg:p-12">
            <p className="section-label mb-4 text-[#6E7B52]">{seedsAsk.eyebrow}</p>
            <h2 className="font-display max-w-3xl text-3xl font-semibold tracking-tight sm:text-4xl">
              {seedsAsk.headline}
            </h2>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-[#4a4f4c]">
              {seedsAsk.lead}
            </p>
            <blockquote className="mt-8 max-w-3xl border-l-2 border-[#A95A2E] pl-5 font-display text-xl italic text-[#23271B] sm:text-2xl">
              {seedsAsk.quote}
            </blockquote>

            <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {seedsAsk.fundingItems.map((item) => (
                <div
                  key={item}
                  className="rounded-xl border border-[#6E7B52]/15 bg-white/60 px-4 py-3 text-sm text-[#4a4f4c]"
                >
                  {item}
                </div>
              ))}
            </div>

            <p className="mt-10 max-w-2xl text-lg leading-relaxed text-[#4a4f4c]">
              {seedsAsk.closing}
            </p>

            <div className="mt-10 flex flex-wrap gap-4">
              <ClayButton href={BOOKING_URL} external>
                {seedsAsk.ctaPrimary}
                <span aria-hidden>→</span>
              </ClayButton>
              <Link
                href="/"
                className="inline-flex items-center gap-2 rounded-full border border-[#23271B]/20 px-5 py-2.5 text-sm font-medium text-[#23271B] transition-colors hover:border-[#23271B]/40"
              >
                {seedsAsk.ctaSecondary}
              </Link>
            </div>
          </article>

          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {seedsAsk.gallery.map((photo) => (
              <figure
                key={photo.src}
                className="overflow-hidden rounded-2xl bg-black/10 shadow-lg shadow-black/10"
              >
                <div className="relative aspect-[4/3]">
                  <Image
                    src={photo.src}
                    alt={photo.alt}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 100vw, 33vw"
                  />
                </div>
              </figure>
            ))}
          </div>
        </div>
      </section>

      <ParallelLayers />
    </main>
  );
}
