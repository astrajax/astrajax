"use client";

import { CliveStudyStage } from "@/components/chapter1/CliveStudyStage";
import type { CliveVideoStageHandle } from "@/components/chapter1/CliveVideoStage";
import type { FolioStageState } from "@/components/chapter1/FolioStageContext";
import { forwardRef, type ReactNode } from "react";

type CliveStudyShellProps = {
  children: ReactNode;
  onReset: () => void;
  label?: string;
  subtitle?: string;
  backHref?: string;
  backLabel?: string;
  headerActions?: ReactNode;
  /** W4 — forwarded to the stage: the ledger tab + drawer render slot. */
  paperTrail?: (open: boolean, onClose: () => void) => ReactNode;
  /**
   * Controlled folio composition from the caller's step machine. When
   * supplied, the stage's visible data-folio-state resolves directly from
   * this prop — never from a descendant effect. Omit to keep the existing
   * context-driven behaviour (chapter-1 callers that don't drive it).
   */
  stageState?: FolioStageState;
};

export const CliveStudyShell = forwardRef<CliveVideoStageHandle, CliveStudyShellProps>(
  function CliveStudyShell(
    { children, onReset, label, subtitle, backHref, backLabel, headerActions, paperTrail, stageState },
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
        paperTrail={paperTrail}
        stageState={stageState}
      >
        {children}
      </CliveStudyStage>
    );
  },
);
