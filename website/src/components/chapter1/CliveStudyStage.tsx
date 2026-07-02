"use client";

import Image from "next/image";
import Link from "next/link";
import { forwardRef, useEffect, useRef, useState, type ReactNode } from "react";
import {
  CliveVideoStage,
  type CliveVideoStageHandle,
} from "@/components/chapter1/CliveVideoStage";
import { StudyStageRightPanelProvider } from "@/components/chapter1/StudyStageRightPanel";

const STUDY_BOOK_SRC = "/agent-cast/clive-wigglesworth/study-book-spread.png";

type CliveStudyStageProps = {
  children: ReactNode;
  onReset: () => void;
  label?: string;
  subtitle?: string;
  backHref?: string;
  backLabel?: string;
  headerActions?: ReactNode;
};

export const CliveStudyStage = forwardRef<CliveVideoStageHandle, CliveStudyStageProps>(
  function CliveStudyStage(
    { children, onReset, label, subtitle, backHref, backLabel, headerActions },
    ref,
  ) {
    const mainRef = useRef<HTMLElement>(null);
    const [rightPanelEl, setRightPanelEl] = useState<HTMLElement | null>(null);

    useEffect(() => {
      mainRef.current?.focus();
    }, []);

    return (
      <StudyStageRightPanelProvider container={rightPanelEl}>
      <div className="study-stage study-stage--book">
        <div className="study-stage__book" aria-hidden>
          <Image
            src={STUDY_BOOK_SRC}
            alt=""
            fill
            priority
            sizes="100vw"
            className="study-stage__book-image"
          />
        </div>

        <header className="study-stage__header">
          <div className="study-stage__header-copy">
            {backHref ? (
              <Link href={backHref} className="study-stage__back-link">
                ← {backLabel ?? "Back"}
              </Link>
            ) : null}
            <p className="study-stage__label">{label ?? "Clive's study"}</p>
            <p className="study-stage__subtitle">{subtitle ?? "Chapter 1"}</p>
          </div>
          <div className="study-stage__header-actions">
            {headerActions}
            <button type="button" className="study-stage__ghost-btn" onClick={onReset}>
              Start again
            </button>
          </div>
        </header>

        <main
          ref={mainRef}
          tabIndex={-1}
          className="study-stage__content outline-none"
        >
          {children}
        </main>

        <div className="study-stage__clive-spot" aria-hidden>
          <div className="study-stage__clive-feather">
            <CliveVideoStage ref={ref} className="study-stage__clive-media" />
          </div>
        </div>

        <aside
          ref={setRightPanelEl}
          className="study-stage__right-panel"
          aria-live="polite"
        />
      </div>
      </StudyStageRightPanelProvider>
    );
  },
);
