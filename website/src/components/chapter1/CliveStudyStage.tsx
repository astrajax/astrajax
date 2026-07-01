"use client";

import Image from "next/image";
import { forwardRef, useEffect, useRef, type ReactNode } from "react";
import {
  CliveVideoStage,
  type CliveVideoStageHandle,
} from "@/components/chapter1/CliveVideoStage";

const STUDY_WALL_SRC = "/agent-cast/victorian-wall.png";

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
    <div className="study-stage">
      <div className="study-stage__rail">
        <div className="study-stage__rail-texture" aria-hidden>
          <Image
            src={STUDY_WALL_SRC}
            alt=""
            fill
            priority
            sizes="(min-width: 1024px) 42vw, 100vw"
            className="study-stage__wall-image"
          />
          <div className="study-stage__rail-overlay" />
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
      </div>

      <div className="study-stage__scene" aria-hidden>
        <CliveVideoStage ref={ref} className="study-stage__scene-media" />
        <div className="study-stage__scene-vignette" />
      </div>
    </div>
    );
  },
);
