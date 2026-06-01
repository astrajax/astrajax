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
    <div className="overflow-hidden">
      <video
        ref={videoRef}
        className="block aspect-[1500/584] min-h-[18rem] w-full scale-[1.04] bg-transparent object-cover object-center sm:min-h-[24rem] lg:min-h-[30rem] xl:min-h-[34rem]"
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
    </div>
  );
}
