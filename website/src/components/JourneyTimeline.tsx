"use client";

import Link from "next/link";
import { useCallback, useRef, useState } from "react";
import { BOOKING_URL } from "@/lib/site";
import type { JourneyAct } from "@/lib/journey";
import { clipForAct, clipForBeat, type JourneyClip } from "@/lib/journey-clips";

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
      clip?: JourneyClip;
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
      clip?: JourneyClip;
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
      clip: clipForAct(act.id),
    });

    for (const [index, beat] of act.beats.entries()) {
      nodes.push({
        id: `${act.id}-${beat.title}`,
        kind: "beat",
        label: `${act.label} · ${index + 1}`,
        sectionName: act.label,
        title: beat.title,
        body: beat.body,
        pullQuote: beat.pullQuote,
        dark,
        clip: clipForBeat(beat.title),
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
        className="block h-4 w-4 rotate-45 border-2 border-apricot bg-cream-deep shadow-[0_0_0_4px_var(--color-cream-deep)]"
        aria-hidden
      />
    );
  }

  if (kind === "intro" || kind === "close") {
    return (
      <span
        className="block h-3.5 w-3.5 rounded-full bg-apricot shadow-[0_0_0_4px_var(--color-cream-deep)]"
        aria-hidden
      />
    );
  }

  return (
    <span
      className="block h-3 w-3 rounded-full border-2 border-ink/40 bg-cream shadow-[0_0_0_4px_var(--color-cream-deep)]"
      aria-hidden
    />
  );
}

function ClipPlayer({ clip, dark }: { clip: JourneyClip; dark?: boolean }) {
  return (
    <figure className="shrink-0">
      <video
        className="aspect-video w-full bg-black object-cover"
        controls
        muted
        playsInline
        preload="metadata"
        aria-label={clip.caption}
      >
        <source src={clip.src} type="video/mp4" />
      </video>
      <figcaption
        className={`px-4 pt-2 font-mono text-[0.625rem] uppercase tracking-wider ${
          dark ? "text-parchment/55" : "text-ink-muted"
        }`}
      >
        {clip.caption}
      </figcaption>
    </figure>
  );
}

function IntroCard({ node }: { node: Extract<TimelineNode, { kind: "intro" }> }) {
  return (
    <article className="flex max-h-full w-full flex-col overflow-hidden rounded-xl border border-apricot/25 bg-moss text-parchment shadow-sm">
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto p-5">
        <span className="inline-block w-fit rounded border border-parchment/20 px-2 py-0.5 font-mono text-[0.5625rem] uppercase tracking-wider text-parchment/70">
          {node.label}
        </span>
        <p className="mt-4 text-sm leading-relaxed text-parchment/85">{node.summary}</p>
        <ol className="mt-5 space-y-3 border-l-2 border-apricot/60 pl-4">
          {node.structure.map((part, index) => (
            <li key={part} className="text-parchment/85">
              <span className="font-mono text-xs text-buttermilk">
                {String(index + 1).padStart(2, "0")}
              </span>
              <span className="mt-1 block text-sm leading-relaxed">{part}</span>
            </li>
          ))}
        </ol>
      </div>
    </article>
  );
}

function CloseCard({ close }: { close: JourneyClose }) {
  return (
    <article className="flex max-h-full w-full flex-col overflow-hidden rounded-xl border border-apricot/25 bg-moss text-parchment shadow-sm">
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto p-5">
        <span className="inline-block w-fit rounded border border-parchment/20 px-2 py-0.5 font-mono text-[0.5625rem] uppercase tracking-wider text-parchment/70">
          The close
        </span>
        <h3 className="mt-3 font-display text-xl font-semibold leading-snug tracking-tight sm:text-2xl">
          {close.headline}
        </h3>
        <ul className="mt-4 grid gap-2">
          {close.lines.map((line) => (
            <li
              key={line}
              className="rounded-lg border border-parchment/10 bg-graphite/40 px-3 py-1.5 font-display text-sm"
            >
              {line}
            </li>
          ))}
        </ul>
        <blockquote className="mt-4 border-l-2 border-apricot pl-4 font-display text-base italic text-buttermilk">
          {close.pullQuote}
        </blockquote>
        <div className="mt-4 flex flex-wrap gap-2">
          <a
            href={BOOKING_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary text-sm"
          >
            Book a Commercial OS Audit
            <span aria-hidden>→</span>
          </a>
          <Link
            href="/"
            className="btn-secondary border-parchment/20 text-parchment hover:border-parchment/40"
          >
            Back to AstraJax
          </Link>
        </div>
      </div>
    </article>
  );
}

function TimelineCard({ node }: { node: TimelineNode }) {
  if (node.kind === "intro") return <IntroCard node={node} />;
  if (node.kind === "close") return <CloseCard close={node.close} />;

  const dark = node.dark;
  const clip = node.clip;
  // With a clip, the video carries the detail — keep the card light. Without one,
  // show the full narrative so the beat still reads on its own.
  const paragraphs =
    node.kind === "beat" ? (clip ? node.body.slice(0, 1) : node.body) : [];

  return (
    <article
      className={`flex max-h-full w-full flex-col overflow-hidden ${
        dark
          ? "rounded-xl border border-parchment/15 bg-graphite text-parchment shadow-sm"
          : "card-muted"
      }`}
    >
      {clip ? <ClipPlayer clip={clip} dark={dark} /> : null}

      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto p-4 sm:p-5">
        <span
          className={`inline-block w-fit rounded border px-2 py-0.5 font-mono text-[0.5625rem] uppercase tracking-wider ${
            dark ? "border-parchment/20 text-parchment/70" : "border-ink/15 text-ink-muted"
          }`}
        >
          {node.label}
        </span>

        <h3
          className={`mt-2.5 font-display font-semibold leading-snug tracking-tight ${
            node.kind === "act" ? "text-xl sm:text-2xl" : "text-lg sm:text-xl"
          } ${dark ? "text-parchment" : "text-ink"}`}
        >
          {node.title}
        </h3>

        {node.kind === "act" && node.intro ? (
          <p className={`mt-2.5 text-sm leading-relaxed ${dark ? "text-parchment/75" : "text-ink-muted"}`}>
            {node.intro}
          </p>
        ) : null}

        {paragraphs.length > 0 ? (
          <div className="mt-2.5 space-y-2.5">
            {paragraphs.map((paragraph) => (
              <p
                key={paragraph.slice(0, 48)}
                className={`text-sm leading-relaxed ${dark ? "text-parchment/75" : "text-ink-muted"}`}
              >
                {paragraph}
              </p>
            ))}
          </div>
        ) : null}

        {node.kind === "beat" && node.pullQuote ? (
          <blockquote
            className={`mt-3 border-l-2 border-apricot pl-3 font-display text-sm italic ${
              dark ? "text-buttermilk" : "text-ink"
            }`}
          >
            {node.pullQuote}
          </blockquote>
        ) : null}
      </div>
    </article>
  );
}

function TimelineColumn({ node, side }: { node: TimelineNode; side: "above" | "below" }) {
  const wide = node.kind === "intro" || node.kind === "close";
  const card = <TimelineCard node={node} />;
  const connector = <span className="h-6 w-px shrink-0 bg-ink/20" aria-hidden />;

  return (
    <div
      id={node.kind === "act" ? node.id.replace("-act", "") : undefined}
      className={`grid h-full shrink-0 grid-rows-[1fr_1.25rem_1fr] px-3 sm:px-5 ${
        wide ? "w-[86vw] sm:w-[24rem]" : "w-[84vw] sm:w-[22rem]"
      }`}
    >
      <div className="flex min-h-0 flex-col items-center justify-end">
        {side === "above" ? (
          <>
            <div className="flex min-h-0 w-full flex-1 items-end justify-center">{card}</div>
            {connector}
          </>
        ) : null}
      </div>

      <div className="relative z-10 flex items-center justify-center">
        <SpineMarker kind={node.kind} />
      </div>

      <div className="flex min-h-0 flex-col items-center justify-start">
        {side === "below" ? (
          <>
            {connector}
            <div className="flex min-h-0 w-full flex-1 items-start justify-center">{card}</div>
          </>
        ) : null}
      </div>
    </div>
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
      left: direction === "left" ? -560 : 560,
      behavior: "smooth",
    });
  }, []);

  const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement;
    if (target.closest("a, button, video")) return;

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
          <Link href="/" className="shrink-0 text-sm text-ink-muted transition hover:text-ink">
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
          <p className="hidden text-xs text-ink-muted sm:block">Scroll, drag or use the arrows</p>
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
        className={`timeline-scroll relative min-h-0 flex-1 overflow-x-auto overflow-y-hidden bg-[linear-gradient(color-mix(in_srgb,var(--color-ink)_4%,transparent)_1px,transparent_1px),linear-gradient(90deg,color-mix(in_srgb,var(--color-ink)_4%,transparent)_1px,transparent_1px)] bg-size-[1.5rem_1.5rem] ${
          isDragging ? "cursor-grabbing select-none" : "cursor-grab"
        }`}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerLeave={endDrag}
        aria-label="Journey timeline"
      >
        <div className="relative h-full min-w-max px-6 py-6 sm:px-12 sm:py-8">
          <div
            className="pointer-events-none absolute inset-x-6 top-1/2 h-px -translate-y-1/2 bg-ink/20 sm:inset-x-12"
            aria-hidden
          />
          <div className="relative flex h-full items-stretch">
            {nodes.map((node, index) => (
              <TimelineColumn
                key={node.id}
                node={node}
                side={index % 2 === 0 ? "above" : "below"}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
