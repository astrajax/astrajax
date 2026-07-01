"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import type { HubBookId } from "@/lib/chapter1/hub-books";

export type { HubBookId };

const HUB_IMAGE_SRC = "/agent-cast/clive-wigglesworth/clive-study-hub.png";

const BOOK_GLOW_VIDEOS: Record<HubBookId, string> = {
  welcome: "/agent-cast/clive-wigglesworth/book-glow/welcome.mp4",
  reason: "/agent-cast/clive-wigglesworth/book-glow/reasoning-with-clive.mp4",
  architect: "/agent-cast/clive-wigglesworth/book-glow/architect-journal.mp4",
  "brain-building": "/agent-cast/clive-wigglesworth/book-glow/brain-building.mp4",
};

type BookHotspot = {
  id: HubBookId;
  ariaLabel: string;
  left: string;
  width: string;
  top: string;
  height: string;
};

const BOOK_HOTSPOTS: BookHotspot[] = [
  {
    id: "welcome",
    ariaLabel: "Welcome — start Clive's welcome sequence",
    left: "8%",
    width: "14%",
    top: "35%",
    height: "50%",
  },
  {
    id: "reason",
    ariaLabel: "Reasoning with Clive — ask Clive about context and judgement",
    left: "26%",
    width: "22%",
    top: "35%",
    height: "50%",
  },
  {
    id: "architect",
    ariaLabel: "The Architect Journal — map your user brain and build the loop",
    left: "52%",
    width: "20%",
    top: "35%",
    height: "50%",
  },
  {
    id: "brain-building",
    ariaLabel: "Brain Building — learn how governed brains work",
    left: "76%",
    width: "19%",
    top: "35%",
    height: "50%",
  },
];

type CliveStudyHubProps = {
  onSelectBook: (book: HubBookId) => void;
};

export function CliveStudyHub({ onSelectBook }: CliveStudyHubProps) {
  const [hoveredBook, setHoveredBook] = useState<HubBookId | null>(null);
  const [motionAllowed, setMotionAllowed] = useState(true);
  const glowRefs = useRef<Partial<Record<HubBookId, HTMLVideoElement>>>({});

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setMotionAllowed(!media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
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

  const handleBookEnter = useCallback(
    (bookId: HubBookId) => {
      if (hoveredBook && hoveredBook !== bookId) {
        stopGlow(hoveredBook);
      }
      setHoveredBook(bookId);
      startGlow(bookId);
    },
    [hoveredBook, startGlow, stopGlow],
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
        <div className="clive-study-hub__surface">
          <Image
            src={HUB_IMAGE_SRC}
            alt="Bird's-eye view of Clive's desk with four leather-bound books: Welcome, Reasoning with Clive, The Architect Journal, and Brain Building"
            fill
            priority
            sizes="100vw"
            className="clive-study-hub__image"
          />

          {motionAllowed ? (
            <div className="clive-study-hub__glows" aria-hidden>
              {BOOK_HOTSPOTS.map((book) => (
                <video
                  key={book.id}
                  ref={(node) => {
                    if (node) glowRefs.current[book.id] = node;
                    else delete glowRefs.current[book.id];
                  }}
                  className={`clive-study-hub__glow${
                    hoveredBook === book.id ? " clive-study-hub__glow--active" : ""
                  }`}
                  src={BOOK_GLOW_VIDEOS[book.id]}
                  muted
                  loop
                  playsInline
                  preload="none"
                />
              ))}
            </div>
          ) : null}

          {BOOK_HOTSPOTS.map((book) => (
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
        </div>
      </div>
    </div>
  );
}
