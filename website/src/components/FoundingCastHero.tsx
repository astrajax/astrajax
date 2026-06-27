"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { foundingCastHeroTriptych } from "@/lib/agent-cast-assets";

const HERO_ALT: Record<string, string> = {
  "doc-albright":
    "Doc Albright — Jack Russell terrier in a workshop portrait, tools and blueprints at paw",
  "clive-wigglesworth":
    "Clive Wigglesworth — golden retriever in a warm Victorian library portrait",
  "pam-portiscue":
    "Pam Portiscue — grey cat with a map and compass, challenger at the chart table",
};

const triptych = foundingCastHeroTriptych();
const [doc, clive, pam] = triptych;

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

/**
 * Hanging hardware — a brass hook on the picture rail with twin cords down to
 * the frame top. Anchored to the frame (sits directly above it), so the hang
 * reads correctly regardless of how the wall photo is cover-cropped.
 */
function FrameHanger() {
  return (
    <svg
      className="hero-portrait__hanger"
      viewBox="0 0 88 48"
      fill="none"
      aria-hidden="true"
    >
      <path d="M44 8 26 48" stroke="#100b06" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
      <path d="M44 8 62 48" stroke="#100b06" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
      <path d="M44 8 26 48" stroke="#e9cd92" strokeWidth="0.55" strokeLinecap="round" opacity="0.32" />
      <path d="M44 8 62 48" stroke="#e9cd92" strokeWidth="0.55" strokeLinecap="round" opacity="0.32" />
      <circle cx="44" cy="7" r="3.6" fill="#9c6f31" />
      <circle cx="44" cy="7" r="3.6" fill="none" stroke="#33210e" strokeWidth="0.8" opacity="0.7" />
      <circle cx="42.7" cy="5.7" r="1.1" fill="#f6e1a6" opacity="0.9" />
    </svg>
  );
}

function PortraitFrame({
  posterSrc,
  videoSrc,
  ariaLabel,
  width,
  height,
  sizes,
  priority,
  portraitClassName,
  prefersReducedMotion,
}: {
  posterSrc: string;
  videoSrc?: string;
  ariaLabel: string;
  width: number;
  height: number;
  sizes: string;
  priority?: boolean;
  portraitClassName?: string;
  prefersReducedMotion: boolean;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const showVideo = Boolean(videoSrc) && !prefersReducedMotion;

  useEffect(() => {
    if (!showVideo) return;

    const video = videoRef.current;
    if (!video) return;

    const tryPlay = () => {
      void video.play().catch(() => {
        // Autoplay blocked — poster still shows until user interacts.
      });
    };

    tryPlay();
    video.addEventListener("loadeddata", tryPlay);
    return () => video.removeEventListener("loadeddata", tryPlay);
  }, [showVideo]);

  return (
    <div className={`hero-portrait ${portraitClassName ?? ""}`}>
      <FrameHanger />
      {/* The ornate gold frame is baked into the artwork itself — no second
          frame, mat, or card. We only mount it on the wall with a soft shadow. */}
      <div className="hero-portrait-frame">
        {showVideo ? (
          <video
            ref={videoRef}
            className="hero-portrait-frame__media"
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            poster={posterSrc}
            width={width}
            height={height}
            aria-label={ariaLabel}
          >
            <source src={videoSrc} type="video/mp4" />
          </video>
        ) : (
          <Image
            src={posterSrc}
            alt={ariaLabel}
            width={width}
            height={height}
            priority={priority}
            sizes={sizes}
            className="hero-portrait-frame__media"
          />
        )}
      </div>
    </div>
  );
}

export function FoundingCastHero() {
  const prefersReducedMotion = usePrefersReducedMotion();

  return (
    <figure className="hero-triptych-wall w-full">
      <figcaption className="sr-only">
        Founding cast: {triptych.map((c) => c.name).join(", ")}
      </figcaption>

      <div className="hero-triptych-wall__gallery relative z-10">
        {/* Desktop: Doc | Clive | Pam — hung directly on the wall */}
        <div className="hero-triptych-wall__desktop hidden lg:grid">
          <div className="hero-triptych-wall__slot hero-triptych-wall__slot--doc">
            <PortraitFrame
              posterSrc={doc.src}
              videoSrc={doc.videoSrc}
              ariaLabel={HERO_ALT[doc.slug]}
              width={1024}
              height={686}
              sizes="(min-width: 1536px) 24vw, (min-width: 1024px) 26vw, 40vw"
              portraitClassName="hero-portrait--side"
              prefersReducedMotion={prefersReducedMotion}
            />
          </div>
          <div className="hero-triptych-wall__slot hero-triptych-wall__slot--clive">
            <PortraitFrame
              posterSrc={clive.src}
              videoSrc={clive.videoSrc}
              ariaLabel={HERO_ALT[clive.slug]}
              width={1024}
              height={571}
              priority
              sizes="(min-width: 1536px) 34vw, (min-width: 1024px) 36vw, 92vw"
              portraitClassName="hero-portrait--clive"
              prefersReducedMotion={prefersReducedMotion}
            />
          </div>
          <div className="hero-triptych-wall__slot hero-triptych-wall__slot--pam">
            <PortraitFrame
              posterSrc={pam.src}
              videoSrc={pam.videoSrc}
              ariaLabel={HERO_ALT[pam.slug]}
              width={1024}
              height={571}
              sizes="(min-width: 1536px) 24vw, (min-width: 1024px) 26vw, 40vw"
              portraitClassName="hero-portrait--side"
              prefersReducedMotion={prefersReducedMotion}
            />
          </div>
        </div>

        {/* Mobile: Clive prominent, Pam + Doc in a row below */}
        <div className="hero-triptych-wall__mobile flex w-full flex-col gap-5 lg:hidden">
          <PortraitFrame
            posterSrc={clive.src}
            videoSrc={clive.videoSrc}
            ariaLabel={HERO_ALT[clive.slug]}
            width={1024}
            height={571}
            priority
            sizes="92vw"
            portraitClassName="hero-portrait--clive"
            prefersReducedMotion={prefersReducedMotion}
          />
          <div className="grid grid-cols-2 gap-4">
            <PortraitFrame
              posterSrc={pam.src}
              videoSrc={pam.videoSrc}
              ariaLabel={HERO_ALT[pam.slug]}
              width={1024}
              height={571}
              sizes="46vw"
              portraitClassName="hero-portrait--side"
              prefersReducedMotion={prefersReducedMotion}
            />
            <PortraitFrame
              posterSrc={doc.src}
              videoSrc={doc.videoSrc}
              ariaLabel={HERO_ALT[doc.slug]}
              width={1024}
              height={686}
              sizes="46vw"
              portraitClassName="hero-portrait--side"
              prefersReducedMotion={prefersReducedMotion}
            />
          </div>
        </div>
      </div>
    </figure>
  );
}
