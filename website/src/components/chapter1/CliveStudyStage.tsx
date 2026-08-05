"use client";

import Image from "next/image";
import Link from "next/link";
import {
  forwardRef,
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  CliveVideoStage,
  type CliveVideoStageHandle,
} from "@/components/chapter1/CliveVideoStage";
import { StudyStageRightPanelProvider } from "@/components/chapter1/StudyStageRightPanel";
import { FolioStageProvider, useFolioStage } from "@/components/chapter1/FolioStageContext";
import { FolioMessagePulse } from "@/components/chapter1/FolioMessagePulse";

const STUDY_BOOK_SRC = "/agent-cast/clive-wigglesworth/study-book-spread.png";

type CliveStudyStageProps = {
  children: ReactNode;
  onReset: () => void;
  label?: string;
  subtitle?: string;
  backHref?: string;
  backLabel?: string;
  headerActions?: ReactNode;
  /**
   * W4 — the ledger on the desk. When provided, the stage shows the
   * paper-trail tab (bottom-left) and hands open/close control to the
   * render slot: (open, onClose) => drawer. The stage stays ignorant of
   * loop state; the consumer supplies the drawer with its own data.
   */
  paperTrail?: (open: boolean, onClose: () => void) => ReactNode;
};

const CliveStudyStageInner = forwardRef<CliveVideoStageHandle, CliveStudyStageProps>(
  function CliveStudyStage(
    { children, onReset, label, subtitle, backHref, backLabel, headerActions, paperTrail },
    ref,
  ) {
    const mainRef = useRef<HTMLElement>(null);
    const ledgerRef = useRef<HTMLButtonElement>(null);
    const [rightPanelEl, setRightPanelEl] = useState<HTMLElement | null>(null);
    const [trailOpen, setTrailOpen] = useState(false);
    const folio = useFolioStage();
    const folioState = folio?.stageState ?? "teaching";

    useEffect(() => {
      mainRef.current?.focus();
    }, []);

    const closeTrail = useCallback(() => {
      setTrailOpen(false);
      ledgerRef.current?.focus();
    }, []);

    return (
      <StudyStageRightPanelProvider container={rightPanelEl}>
      <div className="study-stage study-stage--book" data-folio-state={folioState}>
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
          <div className="study-stage__clive-feather clive-portrait-feather">
            <CliveVideoStage ref={ref} className="study-stage__clive-media" />
          </div>
        </div>

        <FolioMessagePulse />

        <aside
          ref={setRightPanelEl}
          className="study-stage__right-panel"
          aria-live="polite"
        />

        {paperTrail ? (
          <>
            <button
              ref={ledgerRef}
              type="button"
              className="study-stage__ledger"
              aria-haspopup="dialog"
              aria-expanded={trailOpen}
              onClick={() => setTrailOpen(true)}
            >
              <span className="study-stage__ledger-ribbon" aria-hidden />
              Paper trail
            </button>
            {paperTrail(trailOpen, closeTrail)}
          </>
        ) : null}
      </div>
      </StudyStageRightPanelProvider>
    );
  },
);

/** Outer wrapper: owns the folio stage state for the whole stage tree. */
const CliveStudyStageWithFolio = forwardRef<CliveVideoStageHandle, CliveStudyStageProps>(
  function CliveStudyStageWithFolio(props, ref) {
    return (
      <FolioStageProvider>
        <CliveStudyStageInner {...props} ref={ref} />
      </FolioStageProvider>
    );
  },
);

export { CliveStudyStageWithFolio as CliveStudyStage };
