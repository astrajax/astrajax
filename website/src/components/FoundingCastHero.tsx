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

/** Editorial role lines for the hero captions (mockup-approved). */
const HERO_ROLE: Record<string, string> = {
  "clive-wigglesworth": "The Thought Campion",
  "pam-portiscue": "The Challenger",
  "doc-albright": "The Executor",
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

function PortraitCaption({
  name,
  role,
  srOnly,
}: {
  name: string;
  role: string;
  srOnly?: boolean;
}) {
  return (
    <figcaption className={srOnly ? "sr-only" : "hero-portrait-caption"}>
      <span className="hero-portrait-caption__name font-display">{name}</span>
      <span className="hero-portrait-caption__role">{role}</span>
    </figcaption>
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
  prefersReducedMotion,
}: {
  posterSrc: string;
  videoSrc?: string;
  ariaLabel: string;
  width: number;
  height: number;
  sizes: string;
  priority?: boolean;
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
  );
}

type CastEntry = (typeof triptych)[number];

function CastPortrait({
  entry,
  displayName,
  sizes,
  priority,
  captionSrOnly,
  prefersReducedMotion,
}: {
  entry: CastEntry;
  displayName: string;
  sizes: string;
  priority?: boolean;
  captionSrOnly?: boolean;
  prefersReducedMotion: boolean;
}) {
  const role = HERO_ROLE[entry.slug] ?? entry.role;

  return (
    <figure className="hero-portrait">
      <PortraitFrame
        posterSrc={entry.src}
        videoSrc={entry.videoSrc}
        ariaLabel={HERO_ALT[entry.slug]}
        width={1024}
        height={entry.slug === "doc-albright" ? 686 : 571}
        sizes={sizes}
        priority={priority}
        prefersReducedMotion={prefersReducedMotion}
      />
      <PortraitCaption name={displayName} role={role} srOnly={captionSrOnly} />
    </figure>
  );
}

export function FoundingCastHero() {
  const prefersReducedMotion = usePrefersReducedMotion();

  return (
    <div className="hero-asymmetric-wall w-full" aria-label="Founding cast portraits">
      <p className="sr-only">
        Founding cast: {triptych.map((c) => c.name).join(", ")}
      </p>

      {/* Desktop: asymmetric composition — Pam upper-left, Clive centre, Doc lower-right */}
      <div className="hero-asymmetric-wall__desktop hidden lg:block">
        <div className="hero-asymmetric-wall__composition">
          <div className="hero-asymmetric-wall__slot hero-asymmetric-wall__slot--pam">
            <CastPortrait
              entry={pam}
              displayName={pam.name}
              sizes="(min-width: 1536px) 18vw, (min-width: 1024px) 20vw, 40vw"
              prefersReducedMotion={prefersReducedMotion}
            />
          </div>
          <div className="hero-asymmetric-wall__slot hero-asymmetric-wall__slot--clive">
            <CastPortrait
              entry={clive}
              displayName="Clive Wigglesworth Esq."
              sizes="(min-width: 1536px) 58vw, (min-width: 1024px) 62vw, 92vw"
              priority
              captionSrOnly
              prefersReducedMotion={prefersReducedMotion}
            />
          </div>
          <div className="hero-asymmetric-wall__slot hero-asymmetric-wall__slot--doc">
            <CastPortrait
              entry={doc}
              displayName={doc.name}
              sizes="(min-width: 1536px) 18vw, (min-width: 1024px) 20vw, 40vw"
              prefersReducedMotion={prefersReducedMotion}
            />
          </div>
        </div>
      </div>

      {/* Mobile: Clive dominant, Pam + Doc below with captions */}
      <div className="hero-asymmetric-wall__mobile flex w-full flex-col gap-6 lg:hidden">
        <CastPortrait
          entry={clive}
          displayName="Clive Wigglesworth Esq."
          sizes="94vw"
          priority
          captionSrOnly
          prefersReducedMotion={prefersReducedMotion}
        />
        <div className="grid grid-cols-2 gap-4 sm:gap-5">
          <CastPortrait
            entry={pam}
            displayName={pam.name}
            sizes="46vw"
            prefersReducedMotion={prefersReducedMotion}
          />
          <CastPortrait
            entry={doc}
            displayName={doc.name}
            sizes="46vw"
            prefersReducedMotion={prefersReducedMotion}
          />
        </div>
      </div>
    </div>
  );
}
