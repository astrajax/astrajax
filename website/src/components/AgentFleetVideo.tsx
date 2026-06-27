"use client";

import { useEffect, useRef, useState } from "react";

export function AgentFleetVideo() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const syncPreference = () => setPrefersReducedMotion(mediaQuery.matches);

    syncPreference();
    mediaQuery.addEventListener("change", syncPreference);
    return () => mediaQuery.removeEventListener("change", syncPreference);
  }, []);

  useEffect(() => {
    if (prefersReducedMotion) return;

    const video = videoRef.current;
    if (!video) return;

    const tryPlay = () => {
      void video.play().catch(() => {
        // Autoplay blocked — poster still shows the fleet until user interacts.
      });
    };

    tryPlay();
    video.addEventListener("loadeddata", tryPlay);
    return () => video.removeEventListener("loadeddata", tryPlay);
  }, [prefersReducedMotion]);

  if (prefersReducedMotion) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src="/video/direct-sales-agent-cast-poster.jpg"
        alt="Gallery of the Direct Sales agent cast"
        className="block w-full max-w-none bg-cream object-contain object-center"
      />
    );
  }

  return (
    <video
      ref={videoRef}
      className="block w-full max-w-none bg-cream object-contain object-center"
      autoPlay
      muted
      loop
      playsInline
      preload="metadata"
      poster="/video/direct-sales-agent-cast-poster.jpg"
      aria-label="Moving gallery of the Direct Sales agent cast"
    >
      <source src="/video/direct-sales-agent-cast.mp4" type="video/mp4" />
    </video>
  );
}
