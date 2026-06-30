"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";

const LOOP_EPSILON_SECONDS = 0.04;

export type PortraitLoopVideoProps = {
  posterSrc: string;
  videoSrc?: string;
  alt: string;
  width: number;
  height: number;
  className?: string;
  sizes?: string;
  priority?: boolean;
  prefersReducedMotion: boolean;
  seamlessLoop?: boolean;
  eagerPreload?: boolean;
};

export function PortraitLoopVideo({
  posterSrc,
  videoSrc,
  alt,
  width,
  height,
  className = "",
  sizes,
  priority,
  prefersReducedMotion,
  seamlessLoop = true,
  eagerPreload = false,
}: PortraitLoopVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const showVideo = Boolean(videoSrc) && !prefersReducedMotion;
  const mediaClass = className.trim() || undefined;

  useEffect(() => {
    if (!showVideo) return;

    const video = videoRef.current;
    if (!video) return;

    const tryPlay = () => {
      void video.play().catch(() => {
        // Autoplay blocked — poster still shows until user interacts.
      });
    };

    const handleTimeUpdate = () => {
      if (!seamlessLoop || !Number.isFinite(video.duration)) return;
      if (video.currentTime >= video.duration - LOOP_EPSILON_SECONDS) {
        video.currentTime = 0;
      }
    };

    tryPlay();
    video.addEventListener("loadeddata", tryPlay);
    video.addEventListener("canplay", tryPlay);
    if (seamlessLoop) {
      video.addEventListener("timeupdate", handleTimeUpdate);
    }
    return () => {
      video.removeEventListener("loadeddata", tryPlay);
      video.removeEventListener("canplay", tryPlay);
      if (seamlessLoop) {
        video.removeEventListener("timeupdate", handleTimeUpdate);
      }
    };
  }, [showVideo, seamlessLoop]);

  if (showVideo && videoSrc) {
    return (
      <video
        ref={videoRef}
        className={mediaClass}
        autoPlay
        muted
        loop
        playsInline
        preload={eagerPreload ? "auto" : "metadata"}
        poster={posterSrc}
        width={width}
        height={height}
        aria-label={alt}
      >
        <source src={videoSrc} type="video/mp4" />
      </video>
    );
  }

  return (
    <Image
      src={posterSrc}
      alt={alt}
      width={width}
      height={height}
      priority={priority}
      sizes={sizes}
      className={mediaClass}
    />
  );
}
