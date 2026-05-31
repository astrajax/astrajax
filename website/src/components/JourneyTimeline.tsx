"use client";

import { useCallback, useRef, useState } from "react";
import { BOOKING_URL } from "@/lib/site";
import type { JourneyAct } from "@/lib/journey";

type TimelineNode =
  | {
      id: string;
      kind: "act";
      label: string;
      title: string;
      intro?: string;
      dark?: boolean;
    }
  | {
      id: string;
      kind: "beat";
      label: string;
      sectionName: string;
      title: string;
      body: string[];
      pullQuote?: string;
      dark?: boolean;
      showVideo?: boolean;
      showCta?: boolean;
    };

type JourneyTimelineProps = {
  acts: JourneyAct[];
};

function buildTimelineNodes(acts: JourneyAct[]): TimelineNode[] {
  const nodes: TimelineNode[] = [];

  for (const act of acts) {
    const dark = act.id === "agents";

    nodes.push({
      id: `${act.id}-act`,
      kind: "act",
      label: act.label,
      title: act.title,
      intro: act.intro,
      dark,
    });

    for (const [index, beat] of act.beats.entries()) {
      const isHeroBeat =
        beat.title === "Gmail, WhatsApp, Notion and Sheets → an operating system";

      nodes.push({
        id: `${act.id}-${beat.title}`,
        kind: "beat",
        label: isHeroBeat ? "Hero" : `${act.label} · ${index + 1}`,
        sectionName: act.label,
        title: beat.title,
        body: beat.body,
        pullQuote: beat.pullQuote,
        dark,
        showVideo: isHeroBeat,
        showCta: isHeroBeat,
      });
    }
  }

  return nodes;
}

function TimelineLegend() {
  const items = [
    { icon: "node", label: "Step node" },
    { icon: "act", label: "Act / phase marker" },
    { icon: "video", label: "Video placeholder" },
    { icon: "section", label: "Section name" },
    { icon: "claim", label: "Claim / design note" },
  ] as const;

  return (
    <ul className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-ink-muted">
      {items.map((item) => (
        <li key={item.label} className="flex items-center gap-2">
          {item.icon === "node" ? (
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-apricot" aria-hidden />
          ) : null}
          {item.icon === "act" ? (
            <span
              className="inline-block h-2.5 w-2.5 rotate-45 bg-apricot"
              aria-hidden
            />
          ) : null}
          {item.icon === "video" ? (
            <span
              className="inline-flex h-5 w-7 items-center justify-center rounded border border-ink/20 bg-white text-[0.5rem]"
              aria-hidden
            >
              ▶
            </span>
          ) : null}
          {item.icon === "section" ? (
            <span
              className="inline-block rounded border border-ink/15 px-1.5 py-0.5 font-mono text-[0.5625rem] uppercase tracking-wider"
              aria-hidden
            >
              Label
            </span>
          ) : null}
          {item.icon === "claim" ? (
            <span className="font-display text-apricot" aria-hidden>
              →
            </span>
          ) : null}
          <span>{item.label}</span>
        </li>
      ))}
    </ul>
  );
}

function SpineMarker({ kind }: { kind: TimelineNode["kind"] }) {
  if (kind === "act") {
    return (
      <span
        className="relative z-10 inline-block h-3.5 w-3.5 rotate-45 border-2 border-apricot bg-apricot/20"
        aria-hidden
      />
    );
  }

  return (
    <span
      className="relative z-10 inline-block h-3 w-3 rounded-full border-2 border-ink/30 bg-cream"
      aria-hidden
    />
  );
}

function TimelineCard({ node }: { node: TimelineNode }) {
  const dark = "dark" in node && node.dark;

  return (
    <article
      className={`card-muted flex min-h-[18rem] w-full flex-col p-5 ${
        dark ? "border-parchment/15 bg-graphite/90 text-parchment" : ""
      }`}
    >
      <div className="mb-3 flex items-start justify-between gap-2">
        <span
          className={`inline-block rounded border px-2 py-0.5 font-mono text-[0.5625rem] uppercase tracking-wider ${
            dark
              ? "border-parchment/20 text-parchment/70"
              : "border-ink/15 text-ink-muted"
          }`}
        >
          {node.label}
        </span>
      </div>

      {"sectionName" in node && node.sectionName ? (
        <p
          className={`section-label mb-2 ${dark ? "text-parchment/55" : ""}`}
        >
          {node.sectionName}
        </p>
      ) : null}

      <h3
        className={`font-display text-xl font-semibold leading-snug tracking-tight sm:text-2xl ${
          dark ? "text-parchment" : "text-ink"
        }`}
      >
        {node.title}
      </h3>

      {"intro" in node && node.intro ? (
        <p
          className={`mt-3 text-sm leading-relaxed ${
            dark ? "text-parchment/75" : "text-ink-muted"
          }`}
        >
          {node.intro}
        </p>
      ) : null}

      {"body" in node && node.body ? (
        <div className="mt-3 space-y-3">
          {node.body.map((paragraph) => (
            <p
              key={paragraph.slice(0, 48)}
              className={`text-sm leading-relaxed ${
                dark ? "text-parchment/75" : "text-ink-muted"
              }`}
            >
              {paragraph}
            </p>
          ))}
        </div>
      ) : null}

      {"pullQuote" in node && node.pullQuote ? (
        <blockquote
          className={`mt-4 border-l-2 border-apricot pl-4 font-display text-base italic ${
            dark ? "text-buttermilk" : "text-ink"
          }`}
        >
          {node.pullQuote}
        </blockquote>
      ) : null}

      {"showVideo" in node && node.showVideo ? (
        <div
          className={`mt-4 flex flex-1 flex-col items-center justify-center rounded-lg border border-dashed px-4 py-8 text-center ${
            dark ? "border-parchment/20 bg-moss/40" : "border-ink/15 bg-white/60"
          }`}
        >
          <span
            className={`mb-3 inline-flex h-10 w-10 items-center justify-center rounded-full border ${
              dark ? "border-parchment/25 text-parchment/70" : "border-ink/15 text-ink-muted"
            }`}
            aria-hidden
          >
            ▶
          </span>
          <p className={`font-display text-sm ${dark ? "text-parchment" : "text-ink"}`}>
            Matthew, in 90 seconds
          </p>
          <p className={`mt-1 text-xs ${dark ? "text-parchment/55" : "text-ink-muted"}`}>
            drop-in film
          </p>
        </div>
      ) : null}

      {"showCta" in node && node.showCta ? (
        <a
          href={BOOKING_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-primary mt-4 w-full justify-center text-sm"
        >
          Book an Audit
          <span aria-hidden>→</span>
        </a>
      ) : null}
    </article>
  );
}

export function JourneyTimeline({ acts }: JourneyTimelineProps) {
  const nodes = buildTimelineNodes(acts);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const dragState = useRef<{ active: boolean; startX: number; scrollLeft: number }>({
    active: false,
    startX: 0,
    scrollLeft: 0,
  });
  const [isDragging, setIsDragging] = useState(false);

  const scrollBy = useCallback((direction: "left" | "right") => {
    scrollerRef.current?.scrollBy({
      left: direction === "left" ? -420 : 420,
      behavior: "smooth",
    });
  }, []);

  const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement;
    if (target.closest("a, button")) return;

    const scroller = scrollerRef.current;
    if (!scroller) return;

    dragState.current = {
      active: true,
      startX: event.clientX,
      scrollLeft: scroller.scrollLeft,
    };
    setIsDragging(true);
    scroller.setPointerCapture(event.pointerId);
  };

  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const scroller = scrollerRef.current;
    if (!scroller || !dragState.current.active) return;

    const delta = event.clientX - dragState.current.startX;
    scroller.scrollLeft = dragState.current.scrollLeft - delta;
  };

  const endDrag = (event: React.PointerEvent<HTMLDivElement>) => {
    dragState.current.active = false;
    setIsDragging(false);
    scrollerRef.current?.releasePointerCapture(event.pointerId);
  };

  return (
    <section className="border-b border-ink/10 bg-cream-deep" aria-label="Journey timeline">
      <div className="mx-auto max-w-6xl px-6 py-10 lg:py-12">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="section-label mb-2">Timeline view</p>
            <h2 className="font-display text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
              The journey, as a left-to-right timeline
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-muted">
              Scroll, drag, or use the arrows — nodes along a spine, grouped by act.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => scrollBy("left")}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-ink/15 bg-white text-ink transition hover:border-ink/30"
              aria-label="Scroll timeline left"
            >
              ←
            </button>
            <button
              type="button"
              onClick={() => scrollBy("right")}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-ink/15 bg-white text-ink transition hover:border-ink/30"
              aria-label="Scroll timeline right"
            >
              →
            </button>
          </div>
        </div>

        <div className="mt-6">
          <TimelineLegend />
        </div>
      </div>

      <div className="mx-auto max-w-[calc(100%-3rem)] overflow-hidden rounded-t-xl border border-b-0 border-ink/10 bg-cream shadow-sm lg:max-w-6xl">
        <div className="flex items-center gap-2 border-b border-ink/10 bg-white/80 px-4 py-2.5">
          <div className="flex gap-1.5" aria-hidden>
            <span className="h-2.5 w-2.5 rounded-full bg-ink/15" />
            <span className="h-2.5 w-2.5 rounded-full bg-ink/15" />
            <span className="h-2.5 w-2.5 rounded-full bg-ink/15" />
          </div>
          <p className="mx-auto font-mono text-[0.625rem] text-ink-muted">
            astrajax.com/journey
          </p>
          <span className="rounded border border-ink/10 px-2 py-0.5 font-mono text-[0.5625rem] uppercase tracking-wider text-ink-muted">
            Timeline view
          </span>
        </div>

        <div
          ref={scrollerRef}
          className={`timeline-scroll bg-[linear-gradient(color-mix(in_srgb,var(--color-ink)_4%,transparent)_1px,transparent_1px),linear-gradient(90deg,color-mix(in_srgb,var(--color-ink)_4%,transparent)_1px,transparent_1px)] bg-size-[1.25rem_1.25rem] bg-position-[0_0,0_0] overflow-x-auto ${
            isDragging ? "cursor-grabbing select-none" : "cursor-grab"
          }`}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerLeave={endDrag}
        >
          <div className="relative min-w-max px-8 pb-10 pt-14">
            <div
              className="pointer-events-none absolute left-8 right-8 top-[3.25rem] h-px bg-ink/20"
              aria-hidden
            />

            <div className="relative flex items-start gap-0">
              {nodes.map((node) => (
                <div
                  key={node.id}
                  id={node.kind === "act" ? node.id.replace("-act", "") : undefined}
                  className="timeline-column w-72 shrink-0 px-3 sm:w-80"
                >
                  <div className="flex flex-col items-center">
                    <SpineMarker kind={node.kind} />
                    <div className="h-8 w-px bg-ink/20" aria-hidden />
                    <TimelineCard node={node} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
