"use client";

import { useEffect, useRef } from "react";

export function AgentFleetVideo() {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
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
  }, []);

  return (
    <video
      ref={videoRef}
      className="block w-full bg-transparent object-contain object-center"
      autoPlay
      muted
      loop
      playsInline
      preload="auto"
      aria-label="Moving gallery of the Direct Sales agent cast"
    >
      <source src="/video/direct-sales-agent-cast.mov" type="video/quicktime" />
    </video>
  );
}
