"use client";

import { CliveStudyStage } from "@/components/chapter1/CliveStudyStage";
import type { CliveVideoStageHandle } from "@/components/chapter1/CliveVideoStage";
import { forwardRef, type ReactNode } from "react";

type CliveStudyShellProps = {
  children: ReactNode;
  onReset: () => void;
};

export const CliveStudyShell = forwardRef<CliveVideoStageHandle, CliveStudyShellProps>(
  function CliveStudyShell({ children, onReset }, ref) {
    return (
      <CliveStudyStage ref={ref} onReset={onReset}>
        {children}
      </CliveStudyStage>
    );
  },
);
