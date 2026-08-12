"use client";

import { useEffect } from "react";
import { useFolioStage } from "@/components/chapter1/FolioStageContext";
import { usePrefersReducedMotion } from "@/components/command-centre/usePortraitTransition";

/**
 * Living Folio send effect — Kathryn Direction A: "Ink discharge".
 *
 * A thin, angular gold lightning bolt (not a smooth vein) discharges from the
 * SEND plate across the book spine into Clive's chest. Magical-scholar
 * register: white-hot core, Buttermilk sheath, soft Terracotta-warmed bloom,
 * two short tendrils, two-strike timing.
 *
 * Geometry (viewBox 1000×625 stage space = CSS % of the study-stage):
 *   Origin  (450, 548) ≈ 45% × / 87.7% y — right edge of the brass SEND plate
 *           on the left page (page ends ~48.6%; plate anchors bottom-right of
 *           the left-page composer).
 *   Terminus (728, 232) ≈ 72.8% × / 37.1% y — Clive's chest inside the
 *           interaction plate (plate centre ~72.75% ×; top 13.5cqh; width
 *           32cqw at 1024/755 → chest mid-plate reads ~35–40% stage height,
 *           not the bottom deckle dissolve).
 *   Spine cross passes mid-high (~y 340–380) so the bolt reads across the
 *           leather binding, not skimming the bottom margin.
 *
 * Aspect: preserveAspectRatio="none" so path % stays locked to the measured
 * CSS layout (send plate + Clive spot). Stroke weight stays sane via CSS
 * `vector-effect: non-scaling-stroke` — thin hairlines do not thicken when
 * the viewport aspect drifts (Kathryn's rubber-geometry concern).
 *
 * Timing contract (FOLIO_PULSE_TRAVEL_MS):
 *   0–140ms   first strike (fast dash draw)
 *   140–210ms dark gap
 *   210–360ms weaker second strike
 *   360–820ms decay + arrival warmth under the plate
 *   820ms     markPulseArrived() → right-page action rows may reveal
 *
 * Reduced motion: no travelling bolt — destination halo + origin orb only;
 * markPulseArrived still fires on a short delay (350ms).
 *
 * Taste: drafted for Tara-Lee / Kathryn eye — not declared final.
 */

/** ms from strike start until arrival reveal (gates action rows). */
export const FOLIO_PULSE_TRAVEL_MS = 820;

/** Main bolt — 6 hard zags (7 segments), polyline only, no curves. */
const BOLT_PATH =
  "M 450 548 L 468 455 L 498 490 L 522 355 L 585 385 L 655 275 L 700 305 L 728 232";

/**
 * Tendrils branch at the sharpest angles and die within ~1/5 of a full
 * branch length — wisps, not second bolts.
 */
const TENDRIL_A = "M 498 490 L 512 468 L 518 458";
const TENDRIL_B = "M 585 385 L 568 368 L 560 360";

const ORIGIN = { cx: 450, cy: 548, r: 5.5 } as const;
const TERMINUS = { cx: 728, cy: 232, r: 22 } as const;

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
        {/* Soft arrival warmth — under/inside plate reading; softer than deckle */}
        <circle
          className="folio-pulse__halo"
          cx={TERMINUS.cx}
          cy={TERMINUS.cy}
          r={TERMINUS.r}
        />

        {/* Three-layer bolt: bloom → Buttermilk sheath → near-white core */}
        <g className="folio-pulse__bolt">
          <path
            className="folio-pulse__stroke folio-pulse__stroke--bloom"
            d={BOLT_PATH}
            pathLength={1}
            fill="none"
          />
          <path
            className="folio-pulse__stroke folio-pulse__stroke--sheath"
            d={BOLT_PATH}
            pathLength={1}
            fill="none"
          />
          <path
            className="folio-pulse__stroke folio-pulse__stroke--core"
            d={BOLT_PATH}
            pathLength={1}
            fill="none"
          />
        </g>

        <g className="folio-pulse__tendrils">
          <path
            className="folio-pulse__tendril folio-pulse__tendril--a"
            d={TENDRIL_A}
            pathLength={1}
            fill="none"
          />
          <path
            className="folio-pulse__tendril folio-pulse__tendril--b"
            d={TENDRIL_B}
            pathLength={1}
            fill="none"
          />
        </g>

        {/* Concentrated origin orb on the SEND plate's right edge */}
        <circle
          className="folio-pulse__origin"
          cx={ORIGIN.cx}
          cy={ORIGIN.cy}
          r={ORIGIN.r}
        />
      </svg>
    </div>
  );
}
