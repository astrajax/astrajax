"use client";

import Image from "next/image";
import { useCallback, useState } from "react";
import { BOOTH_SUBHEAD } from "@/lib/aie-demo/demo-data";

type PortraitEntryProps = {
  onEnter: () => void;
};

export function PortraitEntry({ onEnter }: PortraitEntryProps) {
  const [transitioning, setTransitioning] = useState(false);

  const handleEnter = useCallback(() => {
    if (transitioning) return;
    setTransitioning(true);
    window.setTimeout(onEnter, 900);
  }, [onEnter, transitioning]);

  return (
    <div
      className={`portrait-entry ${transitioning ? "portrait-entry--leaving" : ""}`}
      aria-live="polite"
    >
      <div className="portrait-entry__frame">
        <Image
          src="/agent-cast/clive-wigglesworth.png"
          alt="Clive Wigglesworth — Victorian golden retriever in a warm library portrait"
          width={480}
          height={600}
          priority
          className="portrait-entry__image"
        />
        <div className="portrait-entry__lamplight" aria-hidden />
      </div>

      <div className="portrait-entry__copy">
        <p className="section-label">Chapter 1</p>
        <h1 className="font-display mt-3 text-3xl font-semibold text-ink sm:text-4xl">
          Step into Clive&apos;s study
        </h1>
        <p className="mt-4 max-w-md text-lg text-ink-muted">
          {BOOTH_SUBHEAD}
        </p>
        <button
          type="button"
          className="btn-primary mt-8"
          onClick={handleEnter}
          disabled={transitioning}
        >
          {transitioning ? "Opening the study…" : "Enter the study"}
          <span aria-hidden>→</span>
        </button>
      </div>
    </div>
  );
}
