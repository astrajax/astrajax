"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
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
      headline: string;
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
      label: "The set-up",
      headline: intro.headline,
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

function romanFromActLabel(label: string): string {
  return label.replace(/^Act\s+/i, "").trim();
}

function actTagline(intro?: string): string {
  if (!intro) return "";
  const sentence = intro.split(/[.!?]/)[0]?.trim() ?? "";
  if (sentence.length <= 72) return sentence;
  return `${sentence.slice(0, 69).trim()}…`;
}

function ActDiamond() {
  return (
    <span
      className="relative z-10 block h-5 w-5 rotate-45 bg-apricot shadow-[0_0_0_5px_var(--color-cream-deep)]"
      aria-hidden
    />
  );
}

function ActSeparator({
  label,
  title,
  intro,
}: {
  label: string;
  title: string;
  intro?: string;
}) {
  const tagline = actTagline(intro);

  return (
    <div className="flex w-full max-w-[15rem] flex-col items-center px-2 text-center">
      <p className="font-display text-5xl font-semibold leading-none tracking-tight text-apricot sm:text-6xl">
        {romanFromActLabel(label)}
      </p>
      <h3 className="mt-3 font-display text-base font-semibold leading-snug tracking-tight text-moss sm:text-lg">
        {title}
      </h3>
      {tagline ? (
        <p className="mt-2 text-xs leading-relaxed text-ink-muted sm:text-sm">{tagline}</p>
      ) : null}
    </div>
  );
}

function SpineMarker({ kind }: { kind: TimelineNode["kind"] }) {
  if (kind === "act") {
    return <ActDiamond />;
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

function ClipPlayer({
  clip,
  dark,
  stacked,
}: {
  clip: JourneyClip;
  dark?: boolean;
  stacked?: boolean;
}) {
  return (
    <figure className={stacked ? "mt-5 flex min-h-0 flex-1 flex-col" : "shrink-0"}>
      <video
        className={
          stacked
            ? "min-h-[14rem] w-full flex-1 bg-black object-contain sm:min-h-[18rem]"
            : "aspect-video w-full bg-black object-cover"
        }
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
    <article className="timeline-intro-card flex max-h-full w-full flex-col overflow-hidden rounded-xl border border-apricot/30 bg-moss text-parchment shadow-md">
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto p-6 sm:p-8">
        <span className="inline-block w-fit rounded border border-parchment/20 px-2.5 py-1 font-mono text-[0.625rem] uppercase tracking-wider text-parchment/70">
          {node.label}
        </span>
        <h2 className="mt-5 font-display text-2xl font-semibold leading-snug tracking-tight text-parchment sm:text-3xl">
          {node.headline}
        </h2>
        <p className="mt-5 text-base leading-relaxed text-parchment/90 sm:text-lg">
          {node.summary}
        </p>
        <ol className="mt-8 space-y-4 border-l-2 border-apricot pl-5">
          {node.structure.map((part, index) => (
            <li key={part} className="text-parchment/90">
              <span className="font-mono text-sm text-buttermilk sm:text-base">
                {String(index + 1).padStart(2, "0")}
              </span>
              <span className="mt-1.5 block text-base leading-relaxed sm:text-lg">{part}</span>
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
  if (node.kind === "act") return null;

  const dark = node.dark;
  const clip = node.clip;
  const stacked = clip?.layout === "stack";
  const paragraphs =
    node.kind === "beat" ? (clip && !stacked ? node.body.slice(0, 1) : node.body) : [];

  const textBlock = (
    <div className={`flex flex-col ${stacked ? "shrink-0" : "min-h-0 flex-1 overflow-y-auto"} p-4 sm:p-5`}>
      <span
        className={`inline-block w-fit rounded border px-2 py-0.5 font-mono text-[0.5625rem] uppercase tracking-wider ${
          dark ? "border-parchment/20 text-parchment/70" : "border-ink/15 text-ink-muted"
        }`}
      >
        {node.label}
      </span>

      <h3
        className={`mt-2.5 font-display text-lg font-semibold leading-snug tracking-tight sm:text-xl ${
          dark ? "text-parchment" : "text-ink"
        }`}
      >
        {node.title}
      </h3>

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
  );

  return (
    <article
      className={`flex max-h-full w-full flex-col overflow-hidden ${
        stacked ? "min-h-[calc(72vh+16vh*var(--focus,0))]" : ""
      } ${
        dark
          ? "rounded-xl border border-parchment/15 bg-graphite text-parchment shadow-sm"
          : "card-muted"
      }`}
    >
      {stacked ? (
        <>
          {textBlock}
          {clip ? <ClipPlayer clip={clip} dark={dark} stacked /> : null}
        </>
      ) : (
        <>
          {clip ? <ClipPlayer clip={clip} dark={dark} /> : null}
          {textBlock}
        </>
      )}
    </article>
  );
}

function TimelineColumn({
  node,
  stagger,
  columnRef,
}: {
  node: TimelineNode;
  stagger: "left" | "right";
  columnRef?: (element: HTMLDivElement | null) => void;
}) {
  const isIntro = node.kind === "intro";
  const isClose = node.kind === "close";
  const wide = isClose;
  const isAct = node.kind === "act";
  const connector = <span className="h-6 w-px shrink-0 bg-ink/20" aria-hidden />;

  const content =
    node.kind === "act" ? (
      <ActSeparator label={node.label} title={node.title} intro={node.intro} />
    ) : (
      <TimelineCard node={node} />
    );

  const staggerClass =
    node.kind === "beat"
      ? stagger === "left"
        ? "-translate-x-3 sm:-translate-x-5"
        : "translate-x-3 sm:translate-x-5"
      : "";

  return (
    <div
      ref={columnRef}
      id={isAct ? node.id.replace("-act", "") : undefined}
      data-wide={wide ? "true" : "false"}
      data-intro={isIntro ? "true" : "false"}
      data-act={isAct ? "true" : "false"}
      className="timeline-column flex h-full shrink-0 flex-col items-center scroll-ml-6 scroll-mr-6 px-3 sm:scroll-ml-12 sm:scroll-mr-12 sm:px-5"
      style={
        {
          "--focus": "0",
          scrollSnapAlign: "center",
        } as React.CSSProperties
      }
    >
      <div className="relative z-10 flex h-5 shrink-0 items-center justify-center">
        <SpineMarker kind={node.kind} />
      </div>
      {connector}
      <div
        className={`timeline-column-card flex min-h-0 w-full flex-1 justify-center pt-1 ${staggerClass}`}
      >
        {content}
      </div>
    </div>
  );
}

export function JourneyTimeline({ intro, acts, close }: JourneyTimelineProps) {
  const nodes = buildTimelineNodes(intro, acts, close);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const columnRefs = useRef<(HTMLDivElement | null)[]>([]);
  const rafRef = useRef<number | null>(null);
  const dragState = useRef<{ active: boolean; startX: number; scrollLeft: number }>({
    active: false,
    startX: 0,
    scrollLeft: 0,
  });
  const [isDragging, setIsDragging] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(0);

  const updateColumnFocus = useCallback(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;

    const scrollerRect = scroller.getBoundingClientRect();
    const viewportCenter = scrollerRect.width / 2;
    const falloff = scrollerRect.width * 0.62;

    // Read every rect first, then write — interleaving reads and style writes
    // forces a synchronous reflow per tile and makes scrolling stutter.
    const focuses = columnRefs.current.map((column) => {
      if (!column) return 0;
      const rect = column.getBoundingClientRect();
      const columnCenter = rect.left - scrollerRect.left + rect.width / 2;
      const distance = Math.abs(columnCenter - viewportCenter);
      return Math.max(0, 1 - distance / falloff);
    });

    let bestIndex = 0;
    let bestFocus = -1;
    focuses.forEach((focus, index) => {
      columnRefs.current[index]?.style.setProperty("--focus", focus.toFixed(3));
      if (focus > bestFocus) {
        bestFocus = focus;
        bestIndex = index;
      }
    });

    setFocusedIndex((current) => (current === bestIndex ? current : bestIndex));
  }, []);

  const scheduleFocusUpdate = useCallback(() => {
    if (rafRef.current !== null) return;
    rafRef.current = window.requestAnimationFrame(() => {
      rafRef.current = null;
      updateColumnFocus();
    });
  }, [updateColumnFocus]);

  useEffect(() => {
    scheduleFocusUpdate();
    window.addEventListener("resize", scheduleFocusUpdate);

    return () => {
      window.removeEventListener("resize", scheduleFocusUpdate);
      if (rafRef.current !== null) {
        window.cancelAnimationFrame(rafRef.current);
      }
    };
  }, [nodes.length, scheduleFocusUpdate]);

  const scrollBy = useCallback(
    (direction: "left" | "right") => {
      const scroller = scrollerRef.current;
      if (!scroller) return;

      const nextIndex =
        direction === "left"
          ? Math.max(0, focusedIndex - 1)
          : Math.min(nodes.length - 1, focusedIndex + 1);
      const column = columnRefs.current[nextIndex];
      if (!column) return;

      const targetLeft =
        column.offsetLeft - (scroller.clientWidth - column.offsetWidth) / 2;

      scroller.scrollTo({ left: targetLeft, behavior: "smooth" });
    },
    [focusedIndex, nodes.length],
  );

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
    scheduleFocusUpdate();
  };

  const endDrag = (event: React.PointerEvent<HTMLDivElement>) => {
    dragState.current.active = false;
    setIsDragging(false);
    scrollerRef.current?.releasePointerCapture(event.pointerId);
    scheduleFocusUpdate();
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
        className={`timeline-scroll relative min-h-0 flex-1 overflow-x-auto overflow-y-hidden scroll-smooth bg-[linear-gradient(color-mix(in_srgb,var(--color-ink)_4%,transparent)_1px,transparent_1px),linear-gradient(90deg,color-mix(in_srgb,var(--color-ink)_4%,transparent)_1px,transparent_1px)] bg-size-[1.5rem_1.5rem] ${
          isDragging ? "cursor-grabbing select-none" : "cursor-grab"
        }`}
        style={{ scrollSnapType: isDragging ? "none" : "x mandatory" }}
        onScroll={scheduleFocusUpdate}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerLeave={endDrag}
        aria-label="Journey timeline"
      >
        <div className="relative h-full min-w-max px-6 pt-8 pb-6 sm:px-12 sm:pt-10 sm:pb-8">
          <div
            className="pointer-events-none absolute inset-x-6 top-[2.125rem] h-px bg-ink/20 sm:inset-x-12 sm:top-[2.375rem]"
            aria-hidden
          />
          <div className="relative flex h-full items-stretch">
            {nodes.map((node, index) => (
              <TimelineColumn
                key={node.id}
                node={node}
                stagger={index % 2 === 0 ? "left" : "right"}
                columnRef={(element) => {
                  columnRefs.current[index] = element;
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
