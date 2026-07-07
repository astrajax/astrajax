"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { isHubBookId, stepForBook, type HubBookId } from "@/lib/chapter1/hub-books";
import { HUB_SCENE_MANIFEST } from "@/lib/chapter1/hub-manifest";
import { loadPersistedLoopSlice } from "@/lib/aie-demo/user-brain-intake";
import type { LoopStep } from "@/lib/aie-demo/types";
import { beatLabel } from "@/lib/clive/loop-context";

export type { HubBookId };

type ResumeMark = {
  book: HubBookId;
  stepLabel: string;
};

type CliveStudyHubProps = {
  onSelectBook: (book: HubBookId) => void;
};

export function CliveStudyHub({ onSelectBook }: CliveStudyHubProps) {
  const [hoveredBook, setHoveredBook] = useState<HubBookId | null>(null);
  const [hubImageLoaded, setHubImageLoaded] = useState(false);
  const [motionAllowed, setMotionAllowed] = useState(true);
  const [hoverCapable, setHoverCapable] = useState(false);
  const [resumeMark, setResumeMark] = useState<ResumeMark | null>(null);
  const glowRefs = useRef<Partial<Record<HubBookId, HTMLVideoElement>>>({});

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setMotionAllowed(!media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    const media = window.matchMedia("(hover: hover) and (pointer: fine)");
    const sync = () => setHoverCapable(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  // W7: the bookmark ribbon. If the ledger holds a mid-read session (a book
  // and a step beyond that book's opening page), hang a ribbon over the desk
  // so a returning architect can resume where they left off. Brain-building
  // is excluded — it opens the curate sitting, which keeps its own docket.
  useEffect(() => {
    const slice = loadPersistedLoopSlice();
    const book = slice?.book;
    const step = slice?.currentStep;
    if (!book || !isHubBookId(book) || book === "brain-building" || !step) return;
    if (step === stepForBook(book).currentStep) return;
    setResumeMark({ book, stepLabel: beatLabel(step as LoopStep) });
  }, []);

  const stopGlow = useCallback((bookId: HubBookId) => {
    const video = glowRefs.current[bookId];
    if (!video) return;
    video.pause();
    video.currentTime = 0;
  }, []);

  const startGlow = useCallback(
    (bookId: HubBookId) => {
      if (!motionAllowed) return;
      const video = glowRefs.current[bookId];
      if (!video) return;
      video.currentTime = 0;
      void video.play().catch(() => {});
    },
    [motionAllowed],
  );

  /**
   * Pre-warm: nudge the lazy glow videos (preload="none") into the browser cache on
   * first pointer contact with the desk, so the first hover glows instantly instead
   * of waiting on a fetch. Runs once. Skipped where it would waste bytes: touch
   * devices (no hover), reduced motion (glow layer not rendered), Save-Data users.
   */
  const warmedRef = useRef(false);

  const warmGlowVideos = useCallback(() => {
    if (warmedRef.current || !hoverCapable || !motionAllowed) return;
    const connection = (navigator as Navigator & { connection?: { saveData?: boolean } })
      .connection;
    if (connection?.saveData) return;
    warmedRef.current = true;
    for (const video of Object.values(glowRefs.current)) {
      if (!video || !video.paused) continue;
      video.preload = "auto";
      video.load();
    }
  }, [hoverCapable, motionAllowed]);

  const handleBookEnter = useCallback(
    (bookId: HubBookId) => {
      warmGlowVideos();
      if (hoveredBook && hoveredBook !== bookId) {
        stopGlow(hoveredBook);
      }
      setHoveredBook(bookId);
      startGlow(bookId);
    },
    [hoveredBook, startGlow, stopGlow, warmGlowVideos],
  );

  const handleBookLeave = useCallback(
    (bookId: HubBookId) => {
      setHoveredBook((current) => (current === bookId ? null : current));
      stopGlow(bookId);
    },
    [stopGlow],
  );

  return (
    <div className="clive-study-hub">
      <header className="clive-study-hub__header">
        <p className="clive-study-hub__label">Clive&apos;s study</p>
        <p className="clive-study-hub__subtitle">Chapter 1 — choose a book on the desk</p>
      </header>

      <div className="clive-study-hub__desk">
        <div className="clive-study-hub__surface" onPointerEnter={warmGlowVideos}>
          <Image
            src={HUB_SCENE_MANIFEST.image}
            alt={HUB_SCENE_MANIFEST.imageAlt}
            fill
            priority
            sizes="100vw"
            className={`clive-study-hub__image${
              hubImageLoaded ? " clive-study-hub__image--loaded" : ""
            }`}
            onLoad={() => setHubImageLoaded(true)}
          />

          {motionAllowed ? (
            <div className="clive-study-hub__glows" aria-hidden>
              {HUB_SCENE_MANIFEST.hotspots.map((book) => (
                <video
                  key={book.id}
                  ref={(node) => {
                    if (node) glowRefs.current[book.id] = node;
                    else delete glowRefs.current[book.id];
                  }}
                  className={`clive-study-hub__glow${
                    hoveredBook === book.id ? " clive-study-hub__glow--active" : ""
                  }`}
                  src={book.glow}
                  muted
                  loop
                  playsInline
                  preload="none"
                />
              ))}
            </div>
          ) : null}

          {HUB_SCENE_MANIFEST.hotspots.map((book) => (
            <button
              key={book.id}
              type="button"
              className={`clive-study-hub__book${
                hoveredBook === book.id ? " clive-study-hub__book--hovered" : ""
              }`}
              style={{
                left: book.left,
                width: book.width,
                top: book.top,
                height: book.height,
              }}
              aria-label={book.ariaLabel}
              onClick={() => onSelectBook(book.id)}
              onMouseEnter={() => handleBookEnter(book.id)}
              onMouseLeave={() => handleBookLeave(book.id)}
              onFocus={() => handleBookEnter(book.id)}
              onBlur={() => handleBookLeave(book.id)}
            />
          ))}

          {resumeMark ? (
            <Link
              href={`/chapter-1?book=${resumeMark.book}&resume=1`}
              className="clive-study-hub__resume"
              aria-label={`Resume where you left off — ${resumeMark.stepLabel}`}
            >
              <span>Resume</span>
              <span className="clive-study-hub__resume-step">{resumeMark.stepLabel}</span>
            </Link>
          ) : null}
        </div>
      </div>
    </div>
  );
}
