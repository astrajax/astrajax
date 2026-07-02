"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  COMMAND_ROOMS,
  DOC_WORKSHOP_DEFAULT_PLAQUE,
} from "@/lib/command-centre/rooms";

const WORKSHOP_VIDEO_SRC = "/agent-cast/doc-albright/workshop/stage.mp4";
const WORKSHOP_POSTER_SRC = "/agent-cast/doc-albright/workshop/stage-poster.jpg";

const WORKSHOP_VIDEO_ARIA =
  "Doc Albright at his steampunk workshop — brass automata in the side alcoves, forge glow behind the bench";

type StationHotspot = {
  stationId: string;
  ariaLabel: string;
  left: string;
  width: string;
  top: string;
  height: string;
};

/** Percentage-positioned targets on the 1920×1080 workshop stage loop. */
const STATION_HOTSPOTS: StationHotspot[] = [
  {
    stationId: "fleet",
    ariaLabel: "Design the fleet — task-scoped agents",
    left: "5%",
    width: "21%",
    top: "13%",
    height: "52%",
  },
  {
    stationId: "deploy",
    ariaLabel: "Package and deploy — HyperAgent-ready packages",
    left: "74%",
    width: "21%",
    top: "13%",
    height: "52%",
  },
  {
    stationId: "dispatch",
    ariaLabel: "Doc dispatch — implementation jobs board",
    left: "31%",
    width: "19%",
    top: "84%",
    height: "11%",
  },
  {
    stationId: "agents",
    ariaLabel: "Agent bases — persona config and memories",
    left: "50%",
    width: "19%",
    top: "84%",
    height: "11%",
  },
];

function usePrefersReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const syncPreference = () => setPrefersReducedMotion(mediaQuery.matches);

    syncPreference();
    mediaQuery.addEventListener("change", syncPreference);
    return () => mediaQuery.removeEventListener("change", syncPreference);
  }, []);

  return prefersReducedMotion;
}

export function DocWorkshopHub() {
  const router = useRouter();
  const prefersReducedMotion = usePrefersReducedMotion();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [focusedStationId, setFocusedStationId] = useState<string | null>(null);

  const stations = COMMAND_ROOMS.doc.stations;
  const stationById = Object.fromEntries(stations.map((station) => [station.id, station]));

  const plaqueLabel =
    (focusedStationId ? stationById[focusedStationId]?.plaqueLabel : null) ??
    DOC_WORKSHOP_DEFAULT_PLAQUE;

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (prefersReducedMotion) {
      video.pause();
      video.currentTime = 0;
      return;
    }

    void video.play().catch(() => {});
  }, [prefersReducedMotion]);

  const handleStationEnter = useCallback((stationId: string) => {
    setFocusedStationId(stationId);
  }, []);

  const handleStationLeave = useCallback((stationId: string) => {
    setFocusedStationId((current) => (current === stationId ? null : current));
  }, []);

  return (
    <div className="doc-workshop-hub">
      <header className="doc-workshop-hub__header">
        <p className="doc-workshop-hub__label">Doc&apos;s workshop</p>
        <p className="doc-workshop-hub__subtitle">
          Agent building — pick a bench or the nameplate below
        </p>
      </header>

      <div className="doc-workshop-hub__stage">
        <div className="doc-workshop-hub__surface">
          <video
            ref={videoRef}
            className="doc-workshop-hub__media"
            src={WORKSHOP_VIDEO_SRC}
            poster={WORKSHOP_POSTER_SRC}
            autoPlay={!prefersReducedMotion}
            muted
            loop
            playsInline
            preload="auto"
            aria-label={WORKSHOP_VIDEO_ARIA}
          />

          <div
            className="doc-workshop-hub__nameplate"
            aria-live="polite"
            aria-atomic="true"
          >
            <span className="doc-workshop-hub__nameplate-text">{plaqueLabel}</span>
          </div>

          {STATION_HOTSPOTS.map((hotspot) => {
            const station = stationById[hotspot.stationId];
            if (!station) return null;

            return (
              <button
                key={hotspot.stationId}
                type="button"
                className={`doc-workshop-hub__station${
                  focusedStationId === hotspot.stationId
                    ? " doc-workshop-hub__station--focused"
                    : ""
                }`}
                style={{
                  left: hotspot.left,
                  width: hotspot.width,
                  top: hotspot.top,
                  height: hotspot.height,
                }}
                aria-label={hotspot.ariaLabel}
                onClick={() => router.push(station.href)}
                onMouseEnter={() => handleStationEnter(hotspot.stationId)}
                onMouseLeave={() => handleStationLeave(hotspot.stationId)}
                onFocus={() => handleStationEnter(hotspot.stationId)}
                onBlur={() => handleStationLeave(hotspot.stationId)}
              />
            );
          })}
        </div>
      </div>

      <footer className="doc-workshop-hub__footer">
        <Link href="/fleet" className="doc-workshop-hub__fleet-link">
          Fleet design (full surface) →
        </Link>
        <Link href="/#agent-cast" className="doc-workshop-hub__back">
          ← Back to command centre
        </Link>
      </footer>
    </div>
  );
}
