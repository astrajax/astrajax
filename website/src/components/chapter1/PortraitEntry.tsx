"use client";

import Image from "next/image";
import { BOOTH_HEADLINE, BOOTH_SUBHEAD } from "@/lib/aie-demo/demo-data";

type PortraitEntryProps = {
  onEnter: () => void;
};

export function PortraitEntry({ onEnter }: PortraitEntryProps) {
  return (
    <section className="portrait-entry portrait-entry--study">
      <div className="portrait-entry__frame clive-portrait-feather" aria-hidden>
        <Image
          src="/agent-cast/clive-wigglesworth/hero.png"
          alt=""
          width={1024}
          height={571}
          priority
          sizes="(min-width: 768px) 20rem, 80vw"
          className="portrait-entry__image"
        />
        <div className="portrait-entry__lamplight" />
      </div>

      <div className="portrait-entry__copy">
        <p className="section-label mb-3">Chapter 1</p>
        <h1 className="font-display text-4xl font-semibold tracking-tight text-ink">
          Step into Clive&apos;s study
        </h1>
        <p className="mt-4 text-base leading-relaxed text-ink-muted">{BOOTH_HEADLINE}</p>
        <p className="mt-3 text-sm leading-relaxed text-ink-muted">{BOOTH_SUBHEAD}</p>
        <button type="button" className="btn-primary mt-7" onClick={onEnter}>
          Enter the study
        </button>
      </div>
    </section>
  );
}
