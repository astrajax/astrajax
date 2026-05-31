"use client";

import Link from "next/link";
import { useCallback, useRef, useState } from "react";
import { BOOKING_URL } from "@/lib/site";
import type { JourneyAct } from "@/lib/journey";

type JourneyIntro = {
  eyebrow: string;
  headline: string;
  summary: string;
  structure: string[];
};

type JourneyClose = {
  headline: string;
  lines: string[];
  body: string[];
  pullQuote: string;
};

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
    }
  | {
      id: string;
      kind: "intro";
      label: string;
      summary: string;
      structure: string[];
    }
  | {
      id: string;
      kind: "close";
      label: string;
      close: JourneyClose;
    };

type JourneyTimelineProps = {
  intro: JourneyIntro;
  acts: JourneyAct[];
  close: JourneyClose;
};

function buildTimelineNodes(
  intro: JourneyIntro,
  acts: JourneyAct[],
  close: JourneyClose,
): TimelineNode[] {
  const nodes: TimelineNode[] = [
    {
      id: "intro",
      kind: "intro",
      label: "Intro",
      summary: intro.summary,
      structure: intro.structure,
    },
  ];

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

  nodes.push({
    id: "close",
    kind: "close",
    label: "The close",
    close,
  });

  return nodes;
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

function CloseCard({ close }: { close: JourneyClose }) {
  return (
    <article className="card-muted flex min-h-[calc(100dvh-7.5rem)] w-full flex-col border-apricot/20 bg-moss p-6 text-parchment sm:p-8">
      <span className="inline-block w-fit rounded border border-parchment/20 px-2 py-0.5 font-mono text-[0.5625rem] uppercase tracking-wider text-parchment/70">
        The close
      </span>
      <h3 className="mt-4 font-display text-2xl font-semibold leading-snug tracking-tight sm:text-3xl">
        {close.headline}
      </h3>
      <ul className="mt-6 grid gap-2 sm:grid-cols-2">
        {close.lines.map((line) => (
          <li
            key={line}
            className="rounded-lg border border-parchment/10 bg-graphite/40 px-3 py-2 font-display text-base"
          >
            {line}
          </li>
        ))}
      </ul>
      <div className="mt-6 space-y-3 text-sm leading-relaxed text-parchment/80">
        {close.body.map((paragraph) => (
          <p key={paragraph.slice(0, 48)}>{paragraph}</p>
        ))}
      </div>
      <blockquote className="mt-6 border-l-2 border-apricot pl-4 font-display text-lg italic text-buttermilk sm:text-xl">
        {close.pullQuote}
      </blockquote>
      <div className="mt-auto flex flex-wrap gap-3 pt-8">
        <a
          href={BOOKING_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-primary text-sm"
        >
          Book a Commercial OS Audit
          <span aria-hidden>→</span>
        </a>
        <Link href="/" className="btn-secondary border-parchment/20 text-parchment hover:border-parchment/40">
          Back to AstraJax
        </Link>
      </div>
    </article>
  );
}

function TimelineCard({ node }: { node: TimelineNode }) {
  if (node.kind === "close") {
    return <CloseCard close={node.close} />;
  }

  if (node.kind === "intro") {
    return (
      <article className="card-muted flex min-h-[calc(100dvh-7.5rem)] w-full flex-col overflow-y-auto border-apricot/20 bg-moss p-5 text-parchment sm:p-6">
        <span className="inline-block w-fit rounded border border-parchment/20 px-2 py-0.5 font-mono text-[0.5625rem] uppercase tracking-wider text-parchment/70">
          {node.label}
        </span>
        <p className="mt-4 text-sm leading-relaxed text-parchment/80">{node.summary}</p>
        <ol className="mt-6 space-y-3 border-l-2 border-apricot/60 pl-4">
          {node.structure.map((part, index) => (
            <li key={part} className="text-parchment/85">
              <span className="font-mono text-xs text-buttermilk">
                {String(index + 1).padStart(2, "0")}
              </span>
              <span className="mt-1 block text-sm leading-relaxed">{part}</span>
            </li>
          ))}
        </ol>
      </article>
    );
  }

  const dark = "dark" in node && node.dark;

  return (
    <article
      className={`card-muted flex min-h-[calc(100dvh-7.5rem)] w-full flex-col overflow-y-auto p-5 sm:p-6 ${
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
        <p className={`section-label mb-2 ${dark ? "text-parchment/55" : ""}`}>
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

export function JourneyTimeline({ intro, acts, close }: JourneyTimelineProps) {
  const nodes = buildTimelineNodes(intro, acts, close);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const dragState = useRef<{ active: boolean; startX: number; scrollLeft: number }>({
    active: false,
    startX: 0,
    scrollLeft: 0,
  });
  const [isDragging, setIsDragging] = useState(false);

  const scrollBy = useCallback((direction: "left" | "right") => {
    scrollerRef.current?.scrollBy({
      left: direction === "left" ? -480 : 480,
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
    <div className="fixed inset-0 z-50 flex h-dvh flex-col bg-cream-deep">
      <header className="flex shrink-0 items-center justify-between gap-4 border-b border-ink/10 bg-cream/95 px-4 py-3 backdrop-blur-md sm:px-6">
        <div className="flex min-w-0 items-center gap-4">
          <Link
            href="/"
            className="shrink-0 text-sm text-ink-muted transition hover:text-ink"
          >
            ← AstraJax
          </Link>
          <div className="min-w-0 border-l border-ink/10 pl-4">
            <p className="section-label truncate">{intro.eyebrow}</p>
            <p className="truncate font-display text-sm font-semibold text-ink sm:text-base">
              {intro.headline}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <p className="hidden text-xs text-ink-muted sm:block">Scroll or drag →</p>
          <button
            type="button"
            onClick={() => scrollBy("left")}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-ink/15 bg-white text-ink transition hover:border-ink/30"
            aria-label="Scroll timeline left"
          >
            ←
          </button>
          <button
            type="button"
            onClick={() => scrollBy("right")}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-ink/15 bg-white text-ink transition hover:border-ink/30"
            aria-label="Scroll timeline right"
          >
            →
          </button>
        </div>
      </header>

      <div
        ref={scrollerRef}
        className={`timeline-scroll relative min-h-0 flex-1 overflow-x-auto overflow-y-hidden bg-[linear-gradient(color-mix(in_srgb,var(--color-ink)_4%,transparent)_1px,transparent_1px),linear-gradient(90deg,color-mix(in_srgb,var(--color-ink)_4%,transparent)_1px,transparent_1px)] bg-size-[1.25rem_1.25rem] ${
          isDragging ? "cursor-grabbing select-none" : "cursor-grab"
        }`}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerLeave={endDrag}
        aria-label="Journey timeline"
      >
        <div className="relative flex h-full min-w-max items-stretch px-6 py-6 sm:px-10 sm:py-8">
          <div
            className="pointer-events-none absolute left-6 right-6 top-[2.75rem] h-px bg-ink/20 sm:left-10 sm:right-10"
            aria-hidden
          />

          <div className="relative flex h-full items-start">
            {nodes.map((node) => (
              <div
                key={node.id}
                id={node.kind === "act" ? node.id.replace("-act", "") : undefined}
                className={`timeline-column h-full shrink-0 px-2 sm:px-3 ${
                  node.kind === "close" || node.kind === "intro"
                    ? "w-[min(90vw,28rem)] sm:w-[32rem]"
                    : "w-[min(85vw,20rem)] sm:w-80"
                }`}
              >
                <div className="flex h-full flex-col items-center">
                  <SpineMarker kind={node.kind} />
                  <div className="h-6 w-px shrink-0 bg-ink/20" aria-hidden />
                  <div className="min-h-0 w-full flex-1">
                    <TimelineCard node={node} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
