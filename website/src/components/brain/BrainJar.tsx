"use client";

import type { CSSProperties } from "react";
import { useEffect, useRef, useState } from "react";
import { HEALTH_BAND_CSS_VAR, shrineArtForBand, type BrainHealthBand } from "@/lib/platform/brains";

type BrainJarProps = {
  healthBand: BrainHealthBand;
  alt: string;
};

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

export function BrainJar({ healthBand, alt }: BrainJarProps) {
  const prefersReducedMotion = usePrefersReducedMotion();
  const videoRef = useRef<HTMLVideoElement>(null);
  const src = shrineArtForBand(healthBand);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (prefersReducedMotion) {
      video.pause();
      video.currentTime = 0;
      return;
    }

    void video.play().catch(() => {});
  }, [prefersReducedMotion, src]);

  return (
    <div
      className="brain-shrine__jar"
      style={{ "--health-glow": HEALTH_BAND_CSS_VAR[healthBand] } as CSSProperties}
    >
      <video
        ref={videoRef}
        className="brain-shrine__jar-media"
        src={src}
        autoPlay={!prefersReducedMotion}
        muted
        loop
        playsInline
        preload="metadata"
        aria-label={alt}
      />
    </div>
  );
}
