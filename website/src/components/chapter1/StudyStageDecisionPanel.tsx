"use client";

import type { ReactNode } from "react";
import { StudyStageRightPanel } from "@/components/chapter1/StudyStageRightPanel";

type StudyStageDecisionPanelProps = {
  children: ReactNode;
  className?: string;
};

/** Portals a decision card to the right-hand book page (lower half, centred). */
export function StudyStageDecisionPanel({ children, className = "" }: StudyStageDecisionPanelProps) {
  const cardClass = ["chapter1-right-decision-card", "study-stage__right-summary", className]
    .filter(Boolean)
    .join(" ");

  return (
    <StudyStageRightPanel>
      <div className={cardClass}>{children}</div>
    </StudyStageRightPanel>
  );
}
