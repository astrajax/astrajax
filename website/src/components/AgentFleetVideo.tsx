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
      className="block aspect-[1430/650] min-h-[16rem] w-full bg-transparent object-contain object-center sm:min-h-[20rem] lg:min-h-[24rem]"
      autoPlay
      muted
      loop
      playsInline
      preload="auto"
      poster="/video/direct-sales-agent-cast-poster.jpg"
      aria-label="Moving gallery of the Direct Sales agent cast"
    >
      <source src="/video/direct-sales-agent-cast.mp4" type="video/mp4" />
    </video>
  );
}
