"use client";

import Link from "next/link";
import { useEffect, useRef, type ReactNode } from "react";
import { PortraitLoopVideo } from "@/components/command-centre/PortraitLoopVideo";
import { usePortraitTransition } from "@/components/command-centre/usePortraitTransition";
import type { CommandRoomSlug } from "@/lib/command-centre/rooms";
import { setReturnPortrait } from "@/lib/command-centre/focus-restore";
import { castHeroByProduct, castHeroVideoByProduct } from "@/lib/agent-cast-assets";

export type RoomShellTheme = CommandRoomSlug;

type RoomShellProps = {
  theme: RoomShellTheme;
  roomLabel: string;
  roomTitle: string;
  portraitSlug?: CommandRoomSlug;
  badge?: ReactNode;
  headerActions?: ReactNode;
  onReset?: () => void;
  resetLabel?: string;
  children: ReactNode;
  showExit?: boolean;
};

const PORTRAIT_PATH: Record<CommandRoomSlug, string> = {
  clive: "/agent-cast/clive-wigglesworth.png",
  doc: "/agent-cast/doc-albright.png",
  pam: "/agent-cast/pam-portiscue/hero.png",
};

export function RoomShell({
  theme,
  roomLabel,
  roomTitle,
  portraitSlug,
  badge,
  headerActions,
  onReset,
  resetLabel = "Start again",
  children,
  showExit = true,
}: RoomShellProps) {
  const mainRef = useRef<HTMLElement>(null);
  const { prefersReducedMotion } = usePortraitTransition();
  const slug = portraitSlug ?? theme;
  const portraitSrc = castHeroByProduct(slug) ?? PORTRAIT_PATH[slug];
  const portraitVideoSrc = castHeroVideoByProduct(slug);

  useEffect(() => {
    mainRef.current?.focus();
  }, []);

  return (
    <div className={`room-shell room-shell--${theme} min-h-screen`}>
      <div className="room-shell__ambient" aria-hidden>
        <div className="room-shell__lamp" />
        <div className="room-shell__shelf room-shell__shelf--left" />
        <div className="room-shell__shelf room-shell__shelf--right" />
        {theme === "doc" ? <div className="room-shell__workbench" /> : null}
        {theme === "pam" ? <div className="room-shell__chart-glow" /> : null}
      </div>

      <header className="room-shell__header">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div className="flex items-center gap-4">
            <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-full border-2 border-parchment/60 shadow-md">
              <PortraitLoopVideo
                posterSrc={portraitSrc}
                videoSrc={portraitVideoSrc}
                alt=""
                width={56}
                height={56}
                prefersReducedMotion={prefersReducedMotion}
                className="h-full w-full object-cover object-top"
              />
            </div>
            <div>
              <p className="section-label text-parchment/70">{roomLabel}</p>
              <h1 className="font-display text-lg font-semibold text-parchment">{roomTitle}</h1>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {badge}
            {headerActions}
            {showExit ? (
              <Link
                href="/#agent-cast"
                className="room-shell__ghost-btn"
                onClick={() => setReturnPortrait(theme)}
              >
                Back to command centre
              </Link>
            ) : null}
            {onReset ? (
              <button type="button" className="room-shell__ghost-btn" onClick={onReset}>
                {resetLabel}
              </button>
            ) : null}
          </div>
        </div>
      </header>

      <main
        ref={mainRef}
        tabIndex={-1}
        className="room-shell__main mx-auto max-w-5xl px-4 pb-10 pt-2 outline-none sm:px-6"
      >
        {children}
      </main>
    </div>
  );
}

/** @deprecated Use RoomShell — kept for Chapter 1 imports */
export function CliveStudyRoomShell(props: Omit<RoomShellProps, "theme">) {
  return <RoomShell theme="clive" {...props} />;
}
