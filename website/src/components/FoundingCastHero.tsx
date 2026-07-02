"use client";

import Image from "next/image";
import type { CSSProperties } from "react";
import { useEffect, useRef, useState } from "react";
import { PortraitDoor } from "@/components/command-centre/PortraitDoor";
import { useStoryMode } from "@/components/command-centre/StoryModeProvider";
import type { CommandRoomSlug } from "@/lib/command-centre/rooms";
import { consumeReturnPortrait, focusPortraitDoor } from "@/lib/command-centre/focus-restore";
import {
  castHeroSrc,
  castHeroVideoPosterSrc,
  foundingCastHeroTriptych,
} from "@/lib/agent-cast-assets";

/** Caption fade-in order (left-to-right): Pam, then Clive, then Doc — quick staggered. */
const CAPTION_DELAY: Record<string, string> = {
  "pam-portiscue": "0.3s",
  "clive-wigglesworth": "0.65s",
  "doc-albright": "1s",
  "clives-man": "1.35s",
  "lazlo-marlowe": "1.7s",
};

const HERO_ALT: Record<string, string> = {
  "doc-albright":
    "Doc Albright — Jack Russell terrier in a workshop portrait, tools and blueprints at paw",
  "clive-wigglesworth":
    "Clive Wigglesworth — golden retriever in a warm Victorian library portrait",
  "pam-portiscue":
    "Pam Portiscue — grey cat with a map and compass, challenger at the chart table",
  "clives-man":
    "Clive's Man — badger at a study desk with ledger and lamp, context steward and keeper of the study",
  "lazlo-marlowe":
    "Lazlo Marlowe — red fox at a writing desk with quill, agent scriptwriter in an ornate gold frame",
};

/** Editorial role lines for the hero captions (mockup-approved). */
const HERO_ROLE: Record<string, string> = {
  "clive-wigglesworth": "The Thought Companion",
  "pam-portiscue": "The Challenger",
  "doc-albright": "The Engineer",
  "clives-man": "The Context Steward",
  "lazlo-marlowe": "Agent Scriptwriter",
};

const triptych = foundingCastHeroTriptych();
const [doc, clive, pam] = triptych;

const clivesManSrc = castHeroSrc("clives-man");
if (!clivesManSrc) {
  throw new Error("Missing hero still for founding cast: clives-man");
}
const clivesMan = {
  slug: "clives-man" as const,
  name: "Clive's Man",
  src: clivesManSrc,
  role: "Context Steward",
  videoSrc: undefined,
};

const lazloMarloweSrc = castHeroSrc("lazlo-marlowe");
if (!lazloMarloweSrc) {
  throw new Error("Missing hero still for founding cast: lazlo-marlowe");
}
const lazloMarlowe = {
  slug: "lazlo-marlowe" as const,
  name: "Lazlo Marlowe",
  src: lazloMarloweSrc,
  role: "Agent Scriptwriter",
  videoSrc: undefined,
};

/** Doc's workshop — supporting steampunk robot minions above his hero still. */
const DOC_WORKSHOP_ROBOTS = [
  {
    src: "/agent-cast/doc-albright/workshop/robot-1.png",
    alt: "Steampunk workshop robot minion — brass smokestack crown and gear-toothed grin",
  },
  {
    src: "/agent-cast/doc-albright/workshop/robot-2.png",
    alt: "Steampunk workshop robot minion — brass hands clutching a golden bolt",
  },
] as const;

const DOC_WORKSHOP_ROBOT_SIZE = 1024;

/** Intrinsic hero still dimensions — keeps layout stable without cropping baked-in frames. */
const HERO_FRAME_SIZE: Record<string, { width: number; height: number }> = {
  "pam-portiscue": { width: 2560, height: 1440 },
  "doc-albright": { width: 2752, height: 1536 },
  "clive-wigglesworth": { width: 1024, height: 571 },
  "clives-man": { width: 1024, height: 764 },
  "lazlo-marlowe": { width: 1024, height: 571 },
};

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
      <span className="hero-portrait-caption__sep" aria-hidden="true">
        ·
      </span>
      <span className="hero-portrait-caption__role">{role}</span>
    </figcaption>
  );
}

/** Seek back to start before the native loop hits a bad tail frame or `ended` gap. */
const LOOP_EPSILON_SECONDS = 0.04;

/** Clive hero loop — ambient pace, matches study CliveVideoStage. */
const CLIVE_HERO_PLAYBACK_RATE = 0.72;

function PortraitFrame({
  posterSrc,
  videoSrc,
  videoPosterSrc,
  ariaLabel,
  width,
  height,
  sizes,
  priority,
  eagerPreload,
  seamlessLoop,
  playbackRate = 1,
  prefersReducedMotion,
}: {
  posterSrc: string;
  videoSrc?: string;
  /** Compressed still for the `<video poster>` attribute, which bypasses next/image. */
  videoPosterSrc?: string;
  ariaLabel: string;
  width: number;
  height: number;
  sizes: string;
  priority?: boolean;
  /** Homepage landing: fetch full video immediately, not metadata-only. */
  eagerPreload?: boolean;
  /** Manual loop seam — avoids black flash when the asset or browser loop boundary glitches. */
  seamlessLoop?: boolean;
  /** Playback speed multiplier — e.g. 0.72 for ambient Clive loop. */
  playbackRate?: number;
  prefersReducedMotion: boolean;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoReady, setVideoReady] = useState(false);
  const showVideo = Boolean(videoSrc) && !prefersReducedMotion;

  useEffect(() => {
    setVideoReady(false);
  }, [videoSrc, posterSrc]);

  useEffect(() => {
    if (!showVideo) return;

    const video = videoRef.current;
    if (!video) return;

    const markReady = () => setVideoReady(true);

    const tryPlay = () => {
      video.playbackRate = playbackRate;
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
    video.addEventListener("playing", markReady);
    if (seamlessLoop) {
      video.addEventListener("timeupdate", handleTimeUpdate);
    }
    return () => {
      video.removeEventListener("loadeddata", tryPlay);
      video.removeEventListener("canplay", tryPlay);
      video.removeEventListener("playing", markReady);
      if (seamlessLoop) {
        video.removeEventListener("timeupdate", handleTimeUpdate);
      }
    };
  }, [showVideo, videoSrc, seamlessLoop, playbackRate]);

  const stillSrc = videoPosterSrc ?? posterSrc;

  return (
    <div className="hero-portrait-frame">
      <Image
        src={stillSrc}
        alt={showVideo ? "" : ariaLabel}
        aria-hidden={showVideo ? true : undefined}
        width={width}
        height={height}
        priority={priority}
        sizes={sizes}
        className={[
          "hero-portrait-frame__media",
          showVideo ? "hero-portrait-frame__media--poster" : "",
        ]
          .filter(Boolean)
          .join(" ")}
      />
      {showVideo ? (
        <video
          ref={videoRef}
          className={[
            "hero-portrait-frame__media",
            "hero-portrait-frame__media--video",
            videoReady ? "hero-portrait-frame__media--ready" : "",
          ]
            .filter(Boolean)
            .join(" ")}
          autoPlay
          muted
          loop={!seamlessLoop}
          playsInline
          preload={eagerPreload ? "auto" : "metadata"}
          width={width}
          height={height}
          aria-label={ariaLabel}
        >
          <source src={videoSrc} type="video/mp4" />
        </video>
      ) : null}
    </div>
  );
}

type CastEntry = (typeof triptych)[number] | typeof clivesMan | typeof lazloMarlowe;

function HeroWallBrand() {
  return (
    <a href="/" aria-label="AstraJax — home" className="hero-wall-brand">
      <Image
        src="/astrajax-logo.png"
        alt=""
        aria-hidden
        width={1024}
        height={929}
        className="hero-wall-brand__mark"
      />
      <span className="hero-wall-brand__word font-sans">ASTRAJAX</span>
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
  playbackRate,
  prefersReducedMotion,
  portraitDoorsEnabled,
}: {
  entry: CastEntry;
  displayName: string;
  sizes: string;
  priority?: boolean;
  eagerPreload?: boolean;
  seamlessLoop?: boolean;
  playbackRate?: number;
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
        videoPosterSrc={castHeroVideoPosterSrc(entry.slug)}
        ariaLabel={HERO_ALT[entry.slug]}
        width={HERO_FRAME_SIZE[entry.slug]?.width ?? 1024}
        height={HERO_FRAME_SIZE[entry.slug]?.height ?? 571}
        sizes={sizes}
        priority={priority}
        eagerPreload={eagerPreload}
        seamlessLoop={seamlessLoop}
        playbackRate={playbackRate}
        prefersReducedMotion={prefersReducedMotion}
      />
      <PortraitCaption name={displayName} role={role} delay={CAPTION_DELAY[entry.slug]} />
    </figure>
  );

  if (portraitDoorsEnabled && productSlug) {
    return (
      <PortraitDoor
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

function DocWorkshopRobotGrid() {
  return (
    <figure className="hero-doc-workshop">
      <div className="hero-doc-workshop-grid" aria-label="Doc's Minions — Doc's Executors">
        {DOC_WORKSHOP_ROBOTS.map((robot) => (
          <div key={robot.src} className="hero-doc-workshop-grid__cell">
            <div className="hero-doc-workshop-grid__frame">
              <Image
                src={robot.src}
                alt={robot.alt}
                width={DOC_WORKSHOP_ROBOT_SIZE}
                height={DOC_WORKSHOP_ROBOT_SIZE}
                sizes="(min-width: 1024px) 7vw, 12vw"
                className="hero-doc-workshop-grid__media"
              />
            </div>
          </div>
        ))}
      </div>
      <PortraitCaption name="Doc's Minions" role="Doc's Executors" />
    </figure>
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
        Founding cast: {triptych.map((c) => c.name).join(", ")}, {clivesMan.name},{" "}
        {lazloMarlowe.name}
        {portraitDoorsEnabled
          ? ". Each portrait opens that character's command centre room."
          : ""}
      </p>
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

      {/* Desktop: mockup gallery — Clive top-centre, Doc top-right, Pam bottom-left */}
      <div className="hero-asymmetric-wall__desktop hidden lg:block">
        <div className="hero-asymmetric-wall__composition">
          <div className="hero-asymmetric-wall__brand-overlay">
            <HeroWallBrand />
          </div>
          <div className="hero-asymmetric-wall__slot hero-asymmetric-wall__slot--clive">
            <CastPortrait
              entry={clive}
              displayName="Clive Wigglesworth Esq."
              sizes="(min-width: 1536px) 38vw, (min-width: 1024px) 38vw, 92vw"
              priority
              eagerPreload
              seamlessLoop
              playbackRate={CLIVE_HERO_PLAYBACK_RATE}
              prefersReducedMotion={prefersReducedMotion}
              portraitDoorsEnabled={portraitDoorsEnabled}
            />
          </div>
          <div className="hero-asymmetric-wall__slot hero-asymmetric-wall__slot--doc">
            <CastPortrait
              entry={doc}
              displayName={doc.name}
              sizes="(min-width: 1536px) 30vw, (min-width: 1024px) 30vw, 40vw"
              prefersReducedMotion={prefersReducedMotion}
              portraitDoorsEnabled={portraitDoorsEnabled}
            />
          </div>
          <div className="hero-asymmetric-wall__slot hero-asymmetric-wall__slot--pam">
            <CastPortrait
              entry={pam}
              displayName={pam.name}
              sizes="(min-width: 1536px) 34vw, (min-width: 1024px) 34vw, 40vw"
              seamlessLoop
              prefersReducedMotion={prefersReducedMotion}
              portraitDoorsEnabled={portraitDoorsEnabled}
            />
          </div>
          <div className="hero-asymmetric-wall__slot hero-asymmetric-wall__slot--man">
            <CastPortrait
              entry={clivesMan}
              displayName={clivesMan.name}
              sizes="(min-width: 1536px) 11vw, (min-width: 1024px) 11vw, 46vw"
              prefersReducedMotion={prefersReducedMotion}
              portraitDoorsEnabled={portraitDoorsEnabled}
            />
          </div>
          <div className="hero-asymmetric-wall__slot hero-asymmetric-wall__slot--lazlo">
            <CastPortrait
              entry={lazloMarlowe}
              displayName={lazloMarlowe.name}
              sizes="(min-width: 1536px) 14vw, (min-width: 1024px) 14vw, 72vw"
              prefersReducedMotion={prefersReducedMotion}
              portraitDoorsEnabled={portraitDoorsEnabled}
            />
          </div>
          <div className="hero-asymmetric-wall__slot hero-asymmetric-wall__slot--minions">
            <DocWorkshopRobotGrid />
          </div>
        </div>
      </div>

      {/* Mobile: Clive dominant with Man beneath, Pam + Doc below */}
      <div className="hero-asymmetric-wall__mobile flex w-full flex-col gap-6 lg:hidden">
        <div className="hero-asymmetric-wall__clive-stack-mobile">
          <CastPortrait
            entry={clive}
            displayName="Clive Wigglesworth Esq."
            sizes="94vw"
            priority
            eagerPreload
            seamlessLoop
            playbackRate={CLIVE_HERO_PLAYBACK_RATE}
            prefersReducedMotion={prefersReducedMotion}
            portraitDoorsEnabled={portraitDoorsEnabled}
          />
          <div className="hero-asymmetric-wall__man-mobile">
            <CastPortrait
              entry={clivesMan}
              displayName={clivesMan.name}
              sizes="47vw"
              prefersReducedMotion={prefersReducedMotion}
              portraitDoorsEnabled={portraitDoorsEnabled}
            />
          </div>
        </div>
        <div className="hero-asymmetric-wall__mobile-flanks grid grid-cols-2 gap-3 sm:gap-3.5">
          <div className="hero-asymmetric-wall__pam-mobile">
            <div className="hero-wall-name-rail">
              <HeroWallBrand />
              <CastPortrait
                entry={pam}
                displayName={pam.name}
                sizes="46vw"
                seamlessLoop
                prefersReducedMotion={prefersReducedMotion}
                portraitDoorsEnabled={portraitDoorsEnabled}
              />
            </div>
          </div>
          <div className="hero-asymmetric-wall__doc-mobile">
            <DocWorkshopRobotGrid />
            <CastPortrait
              entry={doc}
              displayName={doc.name}
              sizes="46vw"
              prefersReducedMotion={prefersReducedMotion}
              portraitDoorsEnabled={portraitDoorsEnabled}
            />
          </div>
        </div>
        <div className="hero-asymmetric-wall__lazlo-mobile">
          <CastPortrait
            entry={lazloMarlowe}
            displayName={lazloMarlowe.name}
            sizes="72vw"
            prefersReducedMotion={prefersReducedMotion}
            portraitDoorsEnabled={portraitDoorsEnabled}
          />
        </div>
      </div>
    </div>
  );
}
