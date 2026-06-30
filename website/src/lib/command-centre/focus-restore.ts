import type { CommandRoomSlug } from "@/lib/command-centre/rooms";

export const RETURN_PORTRAIT_KEY = "astrajax-command-return-portrait";

const VALID_SLUGS = new Set<CommandRoomSlug>(["clive", "doc", "pam"]);
const FOCUS_RETRY_MS = 500;
const FOCUS_RETRY_INTERVAL_MS = 50;

function isCommandRoomSlug(value: string): value is CommandRoomSlug {
  return VALID_SLUGS.has(value as CommandRoomSlug);
}

export function setReturnPortrait(slug: CommandRoomSlug): void {
  try {
    sessionStorage.setItem(RETURN_PORTRAIT_KEY, slug);
  } catch {
    // Private browsing or storage disabled — focus restore is best-effort.
  }
}

export function consumeReturnPortrait(): CommandRoomSlug | null {
  try {
    const value = sessionStorage.getItem(RETURN_PORTRAIT_KEY);
    sessionStorage.removeItem(RETURN_PORTRAIT_KEY);
    if (value && isCommandRoomSlug(value)) return value;
  } catch {
    // Ignore storage errors.
  }
  return null;
}

function tryFocusPortraitDoor(slug: CommandRoomSlug): boolean {
  if (typeof document === "undefined") return false;
  const target = document.querySelector<HTMLElement>(`[data-portrait-door="${slug}"]`);
  if (!target) return false;
  target.focus({ preventScroll: true });
  return document.activeElement === target;
}

/** Retry focus until the portrait door link mounts (e.g. after returning from a room). */
export function focusPortraitDoor(slug: CommandRoomSlug): void {
  if (typeof document === "undefined") return;

  const deadline = performance.now() + FOCUS_RETRY_MS;

  const retry = () => {
    if (tryFocusPortraitDoor(slug)) return;
    if (performance.now() >= deadline) return;

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (tryFocusPortraitDoor(slug)) return;
        setTimeout(retry, FOCUS_RETRY_INTERVAL_MS);
      });
    });
  };

  retry();
}
