"use client";

import { useEffect } from "react";
import { useFolioStage } from "@/components/chapter1/FolioStageContext";
import { usePrefersReducedMotion } from "@/components/command-centre/usePortraitTransition";

/**
 * The message pulse — the folio's thought-vein.
 *
 * After a send, one thin warm-gold vein travels from the send plate across
 * the centre binding to Clive's portrait edge, in the same family as the
 * House brain-tree veins: contained gold leaf under parchment — no
 * lightning, no particles, one journey (~0.9s), no scale or overshoot.
 *
 * Rendered as an SVG overlay sized to the stage. The path is expressed in a
 * 1000×625 viewBox (16:9 stage space) and drawn with stroke-dashoffset so
 * the line *grows* from send plate to portrait. On arrival it calls
 * markPulseArrived() so the action rows on the right page reveal — the
 * record never shows before the message has reached him.
 *
 * Reduced motion: no travelling path. The destination halo and the action
 * reveal resolve with one gentle opacity change.
 */

/** ms from vein start until it reaches the portrait edge (halo + reveal go). */
export const FOLIO_PULSE_TRAVEL_MS = 900;

export function FolioMessagePulse() {
  const folio = useFolioStage();
  const prefersReducedMotion = usePrefersReducedMotion();
  const pulse = folio?.pulse ?? null;

  useEffect(() => {
    if (!pulse || !folio) return;
    // Arrival is timed, not animation-event-driven, so it also lands if the
    // tab throttles the CSS animation: the reveal is a state of truth, not
    // a side-effect of a style.
    const timer = window.setTimeout(() => {
      folio.markPulseArrived();
    }, prefersReducedMotion ? 350 : FOLIO_PULSE_TRAVEL_MS);
    return () => window.clearTimeout(timer);
  }, [folio, pulse, prefersReducedMotion]);

  if (!pulse) return null;

  return (
    <div
      key={pulse.nonce}
      className="folio-pulse"
      aria-hidden
      data-reduced-motion={prefersReducedMotion ? "true" : undefined}
    >
      <svg
        className="folio-pulse__svg"
        viewBox="0 0 1000 625"
        preserveAspectRatio="none"
        focusable="false"
      >
        <path
          className="folio-pulse__vein"
          d="M 300 556 C 380 545, 430 520, 500 508 C 575 494, 640 420, 726 336"
          pathLength={1}
          fill="none"
        />
        <circle className="folio-pulse__halo" cx="726" cy="336" r="30" />
      </svg>
    </div>
  );
}
