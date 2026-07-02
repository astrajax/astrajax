"use client";

import { CliveStudyStage } from "@/components/chapter1/CliveStudyStage";
import type { CliveVideoStageHandle } from "@/components/chapter1/CliveVideoStage";
import { forwardRef, type ReactNode } from "react";

type CliveStudyShellProps = {
  children: ReactNode;
  onReset: () => void;
  label?: string;
  subtitle?: string;
  backHref?: string;
  backLabel?: string;
  headerActions?: ReactNode;
};

export const CliveStudyShell = forwardRef<CliveVideoStageHandle, CliveStudyShellProps>(
  function CliveStudyShell(
    { children, onReset, label, subtitle, backHref, backLabel, headerActions },
    ref,
  ) {
    return (
      <CliveStudyStage
        ref={ref}
        onReset={onReset}
        label={label}
        subtitle={subtitle}
        backHref={backHref}
        backLabel={backLabel}
        headerActions={headerActions}
      >
        {children}
      </CliveStudyStage>
    );
  },
);
