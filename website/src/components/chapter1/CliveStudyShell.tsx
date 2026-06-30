"use client";

import { CliveStudyStage } from "@/components/chapter1/CliveStudyStage";
import type { CliveVideoStageHandle } from "@/components/chapter1/CliveVideoStage";
import { forwardRef, type ReactNode } from "react";

type CliveStudyShellProps = {
  children: ReactNode;
  maturityLabel: string;
  onReset: () => void;
  onOpenPaperTrail?: () => void;
};

export const CliveStudyShell = forwardRef<CliveVideoStageHandle, CliveStudyShellProps>(
  function CliveStudyShell(
    { children, maturityLabel, onReset, onOpenPaperTrail },
    ref,
  ) {
    return (
      <CliveStudyStage
        ref={ref}
        maturityLabel={maturityLabel}
        onReset={onReset}
        onOpenPaperTrail={onOpenPaperTrail}
      >
        {children}
      </CliveStudyStage>
    );
  },
);
