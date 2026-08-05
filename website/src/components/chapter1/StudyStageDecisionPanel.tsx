"use client";

import type { ReactNode } from "react";
import { StudyStageRightPanel } from "@/components/chapter1/StudyStageRightPanel";
import { useFolioStage } from "@/components/chapter1/FolioStageContext";

type StudyStageDecisionPanelProps = {
  children: ReactNode;
  className?: string;
};

/**
 * Portals a decision card to the right-hand book page (lower half, centred).
 *
 * In the folio's interaction state the card is the action record, and the
 * record must not show before the message has reached Clive: while a pulse
 * is in flight the card mounts pre-revealed (opacity 0, no layout shift)
 * until markPulseArrived flips it. In the teaching state, or once arrived,
 * it renders plainly. Reduced motion resolves the same flag on a short
 * fade, so the gating holds identically — only the travel disappears.
 */
export function StudyStageDecisionPanel({ children, className = "" }: StudyStageDecisionPanelProps) {
  const folio = useFolioStage();
  const awaitingArrival = Boolean(folio?.pulse) && !folio?.pulseArrived;

  const cardClass = ["chapter1-right-decision-card", "study-stage__right-summary", className]
    .filter(Boolean)
    .join(" ");

  return (
    <StudyStageRightPanel>
      <div className={cardClass} data-folio-reveal={awaitingArrival ? "pending" : undefined}>
        {children}
      </div>
    </StudyStageRightPanel>
  );
}
