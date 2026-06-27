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

const frameClass =
  "rounded-sm bg-white p-1.5 shadow-[0_8px_32px_rgba(26,26,26,0.12)] ring-1 ring-ink/8 sm:p-2";

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

function PortraitFrame({
  posterSrc,
  videoSrc,
  ariaLabel,
  width,
  height,
  sizes,
  priority,
  className,
  prefersReducedMotion,
}: {
  posterSrc: string;
  videoSrc?: string;
  ariaLabel: string;
  width: number;
  height: number;
  sizes: string;
  priority?: boolean;
  className?: string;
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
    <div className={frameClass}>
      {showVideo ? (
        <video
          ref={videoRef}
          className={`block h-auto w-full object-contain ${className ?? ""}`}
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          poster={posterSrc}
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
          className={`block h-auto w-full object-contain ${className ?? ""}`}
        />
      )}
    </div>
  );
}

export function FoundingCastHero() {
  const prefersReducedMotion = usePrefersReducedMotion();

  return (
    <figure className="w-full">
      <figcaption className="sr-only">
        Founding cast: {triptych.map((c) => c.name).join(", ")}
      </figcaption>

      {/* Desktop: Doc | Clive | Pam — distinct frames on a gallery wall */}
      <div className="hidden w-full items-end gap-3 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.26fr)_minmax(0,1fr)] lg:gap-4 xl:gap-5 2xl:gap-6">
        <div className="self-end">
          <PortraitFrame
            posterSrc={doc.src}
            videoSrc={doc.videoSrc}
            ariaLabel={HERO_ALT[doc.slug]}
            width={640}
            height={800}
            sizes="(min-width: 1280px) 24vw, (min-width: 1024px) 21vw"
            className="object-bottom"
            prefersReducedMotion={prefersReducedMotion}
          />
        </div>
        <div className="self-end">
          <PortraitFrame
            posterSrc={clive.src}
            videoSrc={clive.videoSrc}
            ariaLabel={HERO_ALT[clive.slug]}
            width={768}
            height={960}
            priority
            sizes="(min-width: 1280px) 30vw, (min-width: 1024px) 26vw"
            className="object-bottom"
            prefersReducedMotion={prefersReducedMotion}
          />
        </div>
        <div className="self-end">
          <PortraitFrame
            posterSrc={pam.src}
            videoSrc={pam.videoSrc}
            ariaLabel={HERO_ALT[pam.slug]}
            width={640}
            height={800}
            sizes="(min-width: 1280px) 24vw, (min-width: 1024px) 21vw"
            className="object-bottom"
            prefersReducedMotion={prefersReducedMotion}
          />
        </div>
      </div>

      {/* Mobile: Clive prominent, Pam + Doc in a row below */}
      <div className="flex w-full flex-col gap-4 lg:hidden">
        <PortraitFrame
          posterSrc={clive.src}
          videoSrc={clive.videoSrc}
          ariaLabel={HERO_ALT[clive.slug]}
          width={768}
          height={960}
          priority
          sizes="100vw"
          className="object-center"
          prefersReducedMotion={prefersReducedMotion}
        />
        <div className="grid grid-cols-2 gap-3">
          <PortraitFrame
            posterSrc={pam.src}
            videoSrc={pam.videoSrc}
            ariaLabel={HERO_ALT[pam.slug]}
            width={640}
            height={800}
            sizes="50vw"
            className="object-bottom"
            prefersReducedMotion={prefersReducedMotion}
          />
          <PortraitFrame
            posterSrc={doc.src}
            videoSrc={doc.videoSrc}
            ariaLabel={HERO_ALT[doc.slug]}
            width={640}
            height={800}
            sizes="50vw"
            className="object-bottom"
            prefersReducedMotion={prefersReducedMotion}
          />
        </div>
      </div>
    </figure>
  );
}
