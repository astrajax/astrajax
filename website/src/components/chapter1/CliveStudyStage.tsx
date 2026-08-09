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
import {
  FolioStageProvider,
  useFolioStage,
  type FolioStageState,
} from "@/components/chapter1/FolioStageContext";
import { FolioMessagePulse } from "@/components/chapter1/FolioMessagePulse";

/**
 * The Living Folio background master. Canonical source is the TRUE 16:9
 * production master Kathryn supplied — "Living Folio wide 16_9
 * edge-to-edge.png" (5504×3072, walnut edge-to-edge on all sides) — served
 * from the connected public Vercel Blob store through next/image. Rendered
 * full-bleed object-fit:cover: the master IS the viewport aspect, so cover
 * fills the frame edge-to-edge with NO letterbox, flat bars or sidebars.
 * The Git SVG derivative is a stopgap fallback only when env is absent.
 */
const STUDY_BOOK_FALLBACK_SRC =
  "/agent-cast/clive-wigglesworth/folio/living-folio-master-2048.svg";

const LIVING_FOLIO_CANONICAL_STORE_ID = "store_cvu4L5KwtlOCutGD";
const LIVING_FOLIO_MASTER_PATHNAME =
  "folio/Living Folio wide 16_9 edge-to-edge.png";

/** Vercel public-store host: bare lowercase id, no "store_" prefix. */
function publicBlobHost(storeId: string): string {
  const bare = storeId.trim().toLowerCase().replace(/^store_/, "");
  return `${bare}.public.blob.vercel-storage.com`;
}

function studyBookSrc(): string {
  if (process.env.LIVING_FOLIO_USE_FALLBACK === "true") {
    return STUDY_BOOK_FALLBACK_SRC;
  }
  const host = publicBlobHost(LIVING_FOLIO_CANONICAL_STORE_ID);
  return `https://${host}/${encodeURIComponent(LIVING_FOLIO_MASTER_PATHNAME)}`;
}

const STUDY_BOOK_SRC = studyBookSrc();

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
  /**
   * Controlled folio composition. When the caller supplies this, the visible
   * data-folio-state resolves directly from the prop — the composition is
   * driven by the caller's step machine, not by any descendant effect. When
   * omitted, the stage falls back to the FolioStageContext value so existing
   * chapter-1 callers keep their context-driven behaviour. The provider is
   * always mounted (it also owns the message pulse); this prop only
   * overrides the READ of the visible composition, never the provider.
   */
  stageState?: FolioStageState;
};

const CliveStudyStageInner = forwardRef<CliveVideoStageHandle, CliveStudyStageProps>(
  function CliveStudyStage(
    { children, onReset, label, subtitle, backHref, backLabel, headerActions, paperTrail, stageState },
    ref,
  ) {
    const mainRef = useRef<HTMLElement>(null);
    const ledgerRef = useRef<HTMLButtonElement>(null);
    const [rightPanelEl, setRightPanelEl] = useState<HTMLElement | null>(null);
    const [trailOpen, setTrailOpen] = useState(false);
    const folio = useFolioStage();
    // The controlled prop wins when supplied; otherwise the context value
    // (which defaults to teaching) drives the visible composition.
    const folioState = stageState ?? folio?.stageState ?? "teaching";

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

        {/* FolioCrest intentionally not rendered: Matthew's finished Living
            Folio master bakes its own AstraJax rail ornament, so the separate
            AJ crest overlay (added only because the K8 master shipped with no
            centre crest) is suppressed in globals.css pending Kathryn's
            visual clearance. */}

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
