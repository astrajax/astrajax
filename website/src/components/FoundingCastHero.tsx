"use client";

import Image from "next/image";
import type { CSSProperties } from "react";
import { useEffect, useRef, useState } from "react";
import { PortraitDoor } from "@/components/command-centre/PortraitDoor";
import { useStoryMode } from "@/components/command-centre/StoryModeProvider";
import type { CommandRoomSlug } from "@/lib/command-centre/rooms";
import { consumeReturnPortrait, focusPortraitDoor } from "@/lib/command-centre/focus-restore";
import { foundingCastHeroTriptych } from "@/lib/agent-cast-assets";

/** Caption fade-in order (left-to-right): Pam, then Clive, then Doc — quick staggered. */
const CAPTION_DELAY: Record<string, string> = {
  "pam-portiscue": "0.3s",
  "clive-wigglesworth": "0.65s",
  "doc-albright": "1s",
};

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

const ASSET_TO_PRODUCT: Record<string, CommandRoomSlug> = {
  "clive-wigglesworth": "clive",
  "doc-albright": "doc",
  "pam-portiscue": "pam",
};

const DOOR_HINT: Record<CommandRoomSlug, string> = {
  clive: "Enter Clive's study — reasoning and context",
  doc: "Enter Doc's workshop — agent building",
  pam: "Enter Pam's desk — brain bases and challenge",
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

function PortraitCaption({
  name,
  role,
  delay,
}: {
  name: string;
  role: string;
  delay?: string;
}) {
  const style = delay ? ({ "--caption-delay": delay } as CSSProperties) : undefined;

  return (
    <figcaption className="hero-portrait-caption" style={style}>
      <span className="hero-portrait-caption__name font-display">{name}</span>
      <span className="hero-portrait-caption__role">{role}</span>
    </figcaption>
  );
}

/** Seek back to start before the native loop hits a bad tail frame or `ended` gap. */
const LOOP_EPSILON_SECONDS = 0.04;

function PortraitFrame({
  posterSrc,
  videoSrc,
  ariaLabel,
  width,
  height,
  sizes,
  priority,
  eagerPreload,
  seamlessLoop,
  prefersReducedMotion,
}: {
  posterSrc: string;
  videoSrc?: string;
  ariaLabel: string;
  width: number;
  height: number;
  sizes: string;
  priority?: boolean;
  /** Homepage landing: fetch full video immediately, not metadata-only. */
  eagerPreload?: boolean;
  /** Manual loop seam — avoids black flash when the asset or browser loop boundary glitches. */
  seamlessLoop?: boolean;
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
  }, [showVideo, videoSrc, seamlessLoop]);

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
          preload={eagerPreload ? "auto" : "metadata"}
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

function HeroWallBrand() {
  return (
    <a href="/" aria-label="AstraJax — home" className="hero-wall-brand">
      <Image
        src="/astrajax-logo.png"
        alt=""
        aria-hidden
        width={60}
        height={60}
        className="hero-wall-brand__mark"
      />
      <span className="hero-wall-brand__word font-sans">AstraJax</span>
    </a>
  );
}

function CastPortrait({
  entry,
  displayName,
  sizes,
  priority,
  eagerPreload,
  seamlessLoop,
  prefersReducedMotion,
  portraitDoorsEnabled,
}: {
  entry: CastEntry;
  displayName: string;
  sizes: string;
  priority?: boolean;
  eagerPreload?: boolean;
  seamlessLoop?: boolean;
  prefersReducedMotion: boolean;
  portraitDoorsEnabled: boolean;
}) {
  const role = HERO_ROLE[entry.slug] ?? entry.role;
  const productSlug = ASSET_TO_PRODUCT[entry.slug];

  const portrait = (
    <figure className="hero-portrait">
      <PortraitFrame
        posterSrc={entry.src}
        videoSrc={entry.videoSrc}
        ariaLabel={HERO_ALT[entry.slug]}
        width={1024}
        height={entry.slug === "doc-albright" ? 686 : 571}
        sizes={sizes}
        priority={priority}
        eagerPreload={eagerPreload}
        seamlessLoop={seamlessLoop}
        prefersReducedMotion={prefersReducedMotion}
      />
      <PortraitCaption name={displayName} role={role} delay={CAPTION_DELAY[entry.slug]} />
    </figure>
  );

  if (portraitDoorsEnabled && productSlug) {
    return (
      <PortraitDoor
        mode="navigate"
        character={productSlug}
        ariaLabel={DOOR_HINT[productSlug]}
        className="hero-portrait-door-wrap"
      >
        {portrait}
      </PortraitDoor>
    );
  }

  return portrait;
}

function CommandCentreHint({ enabled }: { enabled: boolean }) {
  if (!enabled) return null;
  return (
    <p className="hero-command-centre-hint">
      Click a portrait to step inside — or switch to Light story for the flat directory below.
    </p>
  );
}

export function FoundingCastHero() {
  const prefersReducedMotion = usePrefersReducedMotion();
  const { portraitDoorsEnabled } = useStoryMode();

  useEffect(() => {
    if (!portraitDoorsEnabled) return;
    const slug = consumeReturnPortrait();
    if (!slug) return;
    focusPortraitDoor(slug);
  }, [portraitDoorsEnabled]);

  return (
    <div className="hero-asymmetric-wall w-full" aria-label="Founding cast portraits">
      <p className="sr-only">
        Founding cast: {triptych.map((c) => c.name).join(", ")}
        {portraitDoorsEnabled
          ? ". Each portrait opens that character's command centre room."
          : ""}
      </p>
      <CommandCentreHint enabled={portraitDoorsEnabled} />
      <noscript>
        <ul className="hero-command-centre-fallback">
          <li>
            <a href="/command/clive">Clive&apos;s study</a>
          </li>
          <li>
            <a href="/command/doc">Doc&apos;s workshop</a>
          </li>
          <li>
            <a href="/command/pam">Pam&apos;s desk</a>
          </li>
        </ul>
      </noscript>

      {/* Desktop: asymmetric composition — Clive centre, Pam lower-left, Doc upper-right */}
      <div className="hero-asymmetric-wall__desktop hidden lg:block">
        <div className="hero-asymmetric-wall__composition">
          <div className="hero-asymmetric-wall__slot hero-asymmetric-wall__slot--pam">
            <div className="hero-wall-name-rail">
              <HeroWallBrand />
              <CastPortrait
                entry={pam}
                displayName={pam.name}
                sizes="(min-width: 1536px) 28vw, (min-width: 1024px) 28vw, 40vw"
                eagerPreload
                seamlessLoop
                prefersReducedMotion={prefersReducedMotion}
                portraitDoorsEnabled={portraitDoorsEnabled}
              />
            </div>
          </div>
          <div className="hero-asymmetric-wall__slot hero-asymmetric-wall__slot--clive">
            <CastPortrait
              entry={clive}
              displayName="Clive Wigglesworth Esq."
              sizes="(min-width: 1536px) 40vw, (min-width: 1024px) 40vw, 92vw"
              priority
              prefersReducedMotion={prefersReducedMotion}
              portraitDoorsEnabled={portraitDoorsEnabled}
            />
          </div>
          <div className="hero-asymmetric-wall__slot hero-asymmetric-wall__slot--doc">
            <CastPortrait
              entry={doc}
              displayName={doc.name}
              sizes="(min-width: 1536px) 26vw, (min-width: 1024px) 26vw, 40vw"
              eagerPreload
              prefersReducedMotion={prefersReducedMotion}
              portraitDoorsEnabled={portraitDoorsEnabled}
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
          prefersReducedMotion={prefersReducedMotion}
          portraitDoorsEnabled={portraitDoorsEnabled}
        />
        <div className="hero-asymmetric-wall__mobile-flanks grid grid-cols-2 gap-3 sm:gap-3.5">
          <div className="hero-asymmetric-wall__pam-mobile">
            <div className="hero-wall-name-rail">
              <HeroWallBrand />
              <CastPortrait
                entry={pam}
                displayName={pam.name}
                sizes="46vw"
                eagerPreload
                seamlessLoop
                prefersReducedMotion={prefersReducedMotion}
                portraitDoorsEnabled={portraitDoorsEnabled}
              />
            </div>
          </div>
          <CastPortrait
            entry={doc}
            displayName={doc.name}
            sizes="46vw"
            eagerPreload
            prefersReducedMotion={prefersReducedMotion}
            portraitDoorsEnabled={portraitDoorsEnabled}
          />
        </div>
      </div>
    </div>
  );
}
