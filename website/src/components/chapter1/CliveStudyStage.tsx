"use client";

import Image from "next/image";
import { forwardRef, useEffect, useRef, type ReactNode } from "react";
import {
  CliveVideoStage,
  type CliveVideoStageHandle,
} from "@/components/chapter1/CliveVideoStage";

const STUDY_BOOK_SRC = "/agent-cast/clive-wigglesworth/study-book-spread.png";

type CliveStudyStageProps = {
  children: ReactNode;
  onReset: () => void;
};

export const CliveStudyStage = forwardRef<CliveVideoStageHandle, CliveStudyStageProps>(
  function CliveStudyStage({ children, onReset }, ref) {
    const mainRef = useRef<HTMLElement>(null);

    useEffect(() => {
      mainRef.current?.focus();
    }, []);

    return (
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
            <p className="study-stage__label">Clive&apos;s study</p>
            <p className="study-stage__subtitle">Chapter 1</p>
          </div>
          <div className="study-stage__header-actions">
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
      </div>
    );
  },
);
