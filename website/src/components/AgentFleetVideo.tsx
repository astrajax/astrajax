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
    <div className="h-full min-h-[16rem] w-full overflow-hidden rounded-lg border border-ink/10 bg-white sm:min-h-[20rem] lg:min-h-[28rem]">
      <video
        ref={videoRef}
        className="block h-full w-full bg-white object-contain object-center"
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        poster="/video/agent-fleet-poster.jpg"
        aria-label="Screen recording of the Direct Sales agent fleet dashboard with moving character profiles"
      >
        <source src="/video/agent-fleet-loop.mp4" type="video/mp4" />
      </video>
    </div>
  );
}
