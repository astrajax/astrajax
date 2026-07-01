"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, type MouseEvent, type ReactNode } from "react";
import type { CommandRoomSlug } from "@/lib/command-centre/rooms";
import { COMMAND_ROOMS } from "@/lib/command-centre/rooms";
import { setReturnPortrait } from "@/lib/command-centre/focus-restore";
import { isPlainLeftClick } from "@/lib/command-centre/portrait-navigation";
import { usePortraitTransition } from "@/components/command-centre/usePortraitTransition";

type PortraitDoorNavigateProps = {
  character: CommandRoomSlug;
  children: ReactNode;
  className?: string;
  ariaLabel: string;
};

export type PortraitDoorProps = PortraitDoorNavigateProps;

export function PortraitDoor({
  character,
  children,
  className = "",
  ariaLabel,
}: PortraitDoorProps) {
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
