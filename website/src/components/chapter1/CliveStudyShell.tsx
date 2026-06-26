"use client";

import Image from "next/image";
import type { ReactNode } from "react";

type CliveStudyShellProps = {
  children: ReactNode;
  maturityLabel: string;
  onReset: () => void;
  onOpenPaperTrail?: () => void;
};

export function CliveStudyShell({
  children,
  maturityLabel,
  onReset,
  onOpenPaperTrail,
}: CliveStudyShellProps) {
  return (
    <div className="clive-study min-h-screen">
      <div className="clive-study__ambient" aria-hidden>
        <div className="clive-study__lamp" />
        <div className="clive-study__shelf clive-study__shelf--left" />
        <div className="clive-study__shelf clive-study__shelf--right" />
      </div>

      <header className="clive-study__header">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div className="flex items-center gap-4">
            <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-full border-2 border-parchment/60 shadow-md">
              <Image
                src="/agent-cast/clive-wigglesworth.png"
                alt=""
                width={56}
                height={56}
                className="h-full w-full object-cover object-top"
              />
            </div>
            <div>
              <p className="section-label">Clive&apos;s study</p>
              <p className="font-display text-lg font-semibold text-parchment">Chapter 1</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <span className="rounded-full bg-moss/40 px-3 py-1 font-mono text-xs text-parchment/90">
              {maturityLabel}
            </span>
            {onOpenPaperTrail && (
              <button type="button" className="clive-study__ghost-btn" onClick={onOpenPaperTrail}>
                Paper trail
              </button>
            )}
            <button type="button" className="clive-study__ghost-btn" onClick={onReset}>
              Start again
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 pb-10 pt-2 sm:px-6">{children}</main>
    </div>
  );
}
