"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useRef, useState, type MouseEvent, type ReactNode } from "react";
import type { CommandRoomSlug } from "@/lib/command-centre/rooms";
import { COMMAND_ROOMS } from "@/lib/command-centre/rooms";
import { setReturnPortrait } from "@/lib/command-centre/focus-restore";
import { isPlainLeftClick } from "@/lib/command-centre/portrait-navigation";
import { usePortraitTransition } from "@/components/command-centre/usePortraitTransition";
import { castHeroByProduct } from "@/lib/agent-cast-assets";

type PortraitDoorInlineProps = {
  mode: "inline";
  character: CommandRoomSlug;
  title: string;
  description: string;
  eyebrow?: string;
  cta: string;
  onEnter: () => void;
};

type PortraitDoorNavigateProps = {
  mode: "navigate";
  character: CommandRoomSlug;
  children: ReactNode;
  className?: string;
  ariaLabel: string;
};

export type PortraitDoorProps = PortraitDoorInlineProps | PortraitDoorNavigateProps;

const PORTRAIT_ALT: Record<CommandRoomSlug, string> = {
  clive: "Clive Wigglesworth — Victorian golden retriever in a warm library portrait",
  doc: "Doc Albright — Jack Russell terrier in a workshop portrait",
  pam: "Pam Portiscue — grey cat with a map and compass at the chart table",
};

export function PortraitDoor(props: PortraitDoorProps) {
  if (props.mode === "navigate") {
    return <PortraitDoorNavigate {...props} />;
  }
  return <PortraitDoorInline {...props} />;
}

function PortraitDoorInline({
  character,
  title,
  description,
  eyebrow = "Chapter 1",
  cta,
  onEnter,
}: PortraitDoorInlineProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [transitioning, setTransitioning] = useState(false);
  const { runDelayedTransition } = usePortraitTransition();
  const portraitSrc =
    castHeroByProduct(character) ?? `/agent-cast/${character === "clive" ? "clive-wigglesworth" : character === "doc" ? "doc-albright" : "pam-portiscue"}.png`;

  const handleEnter = useCallback(() => {
    if (transitioning) return;
    setTransitioning(true);
    runDelayedTransition(onEnter, rootRef.current);
  }, [onEnter, runDelayedTransition, transitioning]);

  return (
    <div
      ref={rootRef}
      className={`portrait-entry ${transitioning ? "portrait-entry--leaving" : ""}`}
      aria-live="polite"
    >
      <div className="portrait-entry__frame">
        <Image
          src={portraitSrc}
          alt={PORTRAIT_ALT[character]}
          width={480}
          height={600}
          priority
          className="portrait-entry__image"
        />
        <div className="portrait-entry__lamplight" aria-hidden />
      </div>

      <div className="portrait-entry__copy">
        <p className="section-label">{eyebrow}</p>
        <h1 className="font-display mt-3 text-3xl font-semibold text-ink sm:text-4xl">{title}</h1>
        <p className="mt-4 max-w-md text-lg text-ink-muted">{description}</p>
        <button
          type="button"
          className="btn-primary mt-8"
          onClick={handleEnter}
          disabled={transitioning}
        >
          {transitioning ? "Opening…" : cta}
          <span aria-hidden>→</span>
        </button>
      </div>
    </div>
  );
}

function PortraitDoorNavigate({
  character,
  children,
  className = "",
  ariaLabel,
}: PortraitDoorNavigateProps) {
  const router = useRouter();
  const { runWithPortraitTransition } = usePortraitTransition();
  const room = COMMAND_ROOMS[character];

  const handleClick = useCallback(
    (event: MouseEvent<HTMLAnchorElement>) => {
      if (!isPlainLeftClick(event)) {
        return;
      }
      event.preventDefault();
      setReturnPortrait(character);
      runWithPortraitTransition(
        () => {
          router.push(room.path);
        },
        { viewTransitionName: `portrait-${character}` },
      );
    },
    [character, room.path, router, runWithPortraitTransition],
  );

  return (
    <Link
      href={room.path}
      className={`hero-portrait-door group block ${className}`.trim()}
      aria-label={ariaLabel}
      data-portrait-door={character}
      onClick={handleClick}
    >
      {children}
    </Link>
  );
}
