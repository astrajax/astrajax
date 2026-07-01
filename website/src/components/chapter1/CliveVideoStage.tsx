"use client";

import Image from "next/image";
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import { castHeroByProduct } from "@/lib/agent-cast-assets";
import {
  CLIVE_IDLE_REEL,
  CLIVE_REACTION_CLIPS,
  CLIVE_VIDEO_CROSSFADE_MS,
  type CliveReaction,
} from "@/lib/clive/video-reactions";
import { usePrefersReducedMotion } from "@/components/command-centre/usePortraitTransition";

const POSTER_SRC =
  castHeroByProduct("clive") ?? "/agent-cast/clive-wigglesworth/hero.png";
const AMBIENT_PLAYBACK_RATE = 0.72;

type LayerIndex = 0 | 1;

export type CliveVideoStageHandle = {
  playReaction: (reaction: CliveReaction) => void;
  /** Play an arbitrary clip; when loop is true, runs until stopIdleReel/returnToIdle. */
  playClip: (src: string, loop?: boolean, holdOnEnd?: boolean) => void;
  startIdleReel: () => void;
  stopIdleReel: () => void;
  returnToIdle: () => void;
};

type CliveVideoStageProps = {
  className?: string;
};

function loadAndPlay(
  video: HTMLVideoElement,
  src: string,
  loop: boolean,
  playbackRate = AMBIENT_PLAYBACK_RATE,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const onReady = () => {
      cleanup();
      video.loop = loop;
      video.playbackRate = playbackRate;
      void video.play().then(() => resolve()).catch(reject);
    };
    const onError = () => {
      cleanup();
      reject(new Error(`Failed to load ${src}`));
    };
    const cleanup = () => {
      video.removeEventListener("canplay", onReady);
      video.removeEventListener("error", onError);
    };

    video.src = src;
    video.loop = loop;
    video.playbackRate = playbackRate;
    video.currentTime = 0;
    video.addEventListener("canplay", onReady);
    video.addEventListener("error", onError);
    video.load();
  });
}

export const CliveVideoStage = forwardRef<CliveVideoStageHandle, CliveVideoStageProps>(
  function CliveVideoStage({ className = "" }, ref) {
    const prefersReducedMotion = usePrefersReducedMotion();
    const [activeLayer, setActiveLayer] = useState<LayerIndex>(0);
    const [videoReady, setVideoReady] = useState(false);
    const layer0Ref = useRef<HTMLVideoElement>(null);
    const layer1Ref = useRef<HTMLVideoElement>(null);
    const layerRefs = useMemo(() => [layer0Ref, layer1Ref] as const, []);
    const activeLayerRef = useRef<LayerIndex>(0);
    const actionPlayingRef = useRef(false);
    const idleReelActiveRef = useRef(false);
    const idleReelIndexRef = useRef(0);
    const videoReadyRef = useRef(false);
    const bootstrapPromiseRef = useRef<Promise<void> | null>(null);
    const endedHandlerRef = useRef<(() => void) | null>(null);

    const setActive = useCallback((layer: LayerIndex) => {
      activeLayerRef.current = layer;
      setActiveLayer(layer);
    }, []);

    const markVideoReady = useCallback(() => {
      videoReadyRef.current = true;
      setVideoReady(true);
    }, []);

    const clearEndedHandler = useCallback(() => {
      const layer = activeLayerRef.current;
      const video = layerRefs[layer].current;
      if (video && endedHandlerRef.current) {
        video.removeEventListener("ended", endedHandlerRef.current);
        endedHandlerRef.current = null;
      }
    }, [layerRefs]);

    const attachEndedHandler = useCallback(
      (video: HTMLVideoElement, onEnded: () => void) => {
        clearEndedHandler();
        endedHandlerRef.current = onEnded;
        video.addEventListener("ended", onEnded);
      },
      [clearEndedHandler],
    );

    const crossfadeToClip = useCallback(
      async (
        src: string,
        loop: boolean,
        playbackRate = AMBIENT_PLAYBACK_RATE,
      ): Promise<HTMLVideoElement | null> => {
        const current = activeLayerRef.current;
        const next: LayerIndex = current === 0 ? 1 : 0;
        const nextVideo = layerRefs[next].current;
        if (!nextVideo) return null;

        await loadAndPlay(nextVideo, src, loop, playbackRate);
        setActive(next);
        return nextVideo;
      },
      [layerRefs, setActive],
    );

    const bootstrapFirstClip = useCallback(
      async (
        src: string,
        loop: boolean,
        playbackRate = AMBIENT_PLAYBACK_RATE,
      ): Promise<HTMLVideoElement | null> => {
        if (videoReadyRef.current) return layerRefs[activeLayerRef.current].current;

        if (bootstrapPromiseRef.current) {
          await bootstrapPromiseRef.current;
          return layerRefs[activeLayerRef.current].current;
        }

        const video = layerRefs[0].current;
        if (!video) return null;

        const bootstrap = loadAndPlay(video, src, loop, playbackRate).then(() => {
          setActive(0);
          markVideoReady();
        });

        bootstrapPromiseRef.current = bootstrap;
        try {
          await bootstrap;
          return video;
        } finally {
          bootstrapPromiseRef.current = null;
        }
      },
      [layerRefs, markVideoReady, setActive],
    );

    const playIdleReelClip = useCallback(async () => {
      if (!idleReelActiveRef.current || actionPlayingRef.current || prefersReducedMotion) {
        return;
      }

      clearEndedHandler();

      const src = CLIVE_IDLE_REEL[idleReelIndexRef.current] ?? CLIVE_IDLE_REEL[0];
      idleReelIndexRef.current = (idleReelIndexRef.current + 1) % CLIVE_IDLE_REEL.length;

      try {
        const video = videoReadyRef.current
          ? await crossfadeToClip(src, false)
          : await bootstrapFirstClip(src, false);
        if (!video || !idleReelActiveRef.current) return;

        const onEnded = () => {
          video.removeEventListener("ended", onEnded);
          endedHandlerRef.current = null;
          void playIdleReelClip();
        };
        attachEndedHandler(video, onEnded);
      } catch {
        idleReelIndexRef.current =
          (idleReelIndexRef.current + CLIVE_IDLE_REEL.length - 1) % CLIVE_IDLE_REEL.length;
      }
    }, [
      attachEndedHandler,
      bootstrapFirstClip,
      clearEndedHandler,
      crossfadeToClip,
      prefersReducedMotion,
    ]);

    const returnToIdle = useCallback(async () => {
      clearEndedHandler();
      actionPlayingRef.current = false;

      if (idleReelActiveRef.current) {
        void playIdleReelClip();
        return;
      }

      try {
        if (videoReadyRef.current) {
          await crossfadeToClip(CLIVE_REACTION_CLIPS.idle, true);
        } else {
          await bootstrapFirstClip(CLIVE_REACTION_CLIPS.idle, true);
        }
      } catch {
        videoReadyRef.current = false;
        setVideoReady(false);
      }
    }, [bootstrapFirstClip, clearEndedHandler, crossfadeToClip, playIdleReelClip]);

    const startIdleReel = useCallback(() => {
      if (prefersReducedMotion) return;
      idleReelActiveRef.current = true;
      idleReelIndexRef.current = 0;
      void playIdleReelClip();
    }, [playIdleReelClip, prefersReducedMotion]);

    const stopIdleReel = useCallback(() => {
      idleReelActiveRef.current = false;
      clearEndedHandler();
      actionPlayingRef.current = false;
    }, [clearEndedHandler]);

    const playClip = useCallback(
      async (src: string, loop = false, holdOnEnd = false) => {
        if (prefersReducedMotion || !src) return;

        idleReelActiveRef.current = false;
        clearEndedHandler();
        actionPlayingRef.current = true;

        try {
          const nextVideo = videoReadyRef.current
            ? await crossfadeToClip(src, loop)
            : await bootstrapFirstClip(src, loop);
          if (!nextVideo) {
            actionPlayingRef.current = false;
            return;
          }

          if (loop || holdOnEnd) return;

          const onEnded = () => {
            nextVideo.removeEventListener("ended", onEnded);
            endedHandlerRef.current = null;
            void returnToIdle();
          };
          attachEndedHandler(nextVideo, onEnded);
        } catch {
          actionPlayingRef.current = false;
        }
      },
      [
        attachEndedHandler,
        bootstrapFirstClip,
        clearEndedHandler,
        crossfadeToClip,
        prefersReducedMotion,
        returnToIdle,
      ],
    );

    const playReaction = useCallback(
      async (reaction: CliveReaction) => {
        if (prefersReducedMotion || !videoReadyRef.current) return;

        if (reaction === "idle") {
          await returnToIdle();
          return;
        }

        const src = CLIVE_REACTION_CLIPS[reaction];
        if (!src) return;

        clearEndedHandler();
        actionPlayingRef.current = true;

        try {
          const nextVideo = await crossfadeToClip(src, false);
          if (!nextVideo) {
            actionPlayingRef.current = false;
            return;
          }

          const onEnded = () => {
            nextVideo.removeEventListener("ended", onEnded);
            endedHandlerRef.current = null;
            void returnToIdle();
          };
          attachEndedHandler(nextVideo, onEnded);
        } catch {
          actionPlayingRef.current = false;
        }
      },
      [attachEndedHandler, clearEndedHandler, crossfadeToClip, prefersReducedMotion, returnToIdle],
    );

    useImperativeHandle(
      ref,
      () => ({ playReaction, playClip, startIdleReel, stopIdleReel, returnToIdle }),
      [playClip, playReaction, returnToIdle, startIdleReel, stopIdleReel],
    );

    useEffect(() => {
      return () => {
        stopIdleReel();
        videoReadyRef.current = false;
      };
    }, [stopIdleReel]);

    const rootClass = ["clive-video-stage", className].filter(Boolean).join(" ");

    if (prefersReducedMotion) {
      return (
        <div className={rootClass}>
          <Image
            src={POSTER_SRC}
            alt=""
            fill
            priority
            sizes="(min-width: 1024px) 58vw, 100vw"
            className="clive-video-stage__poster"
          />
        </div>
      );
    }

    return (
      <div className={rootClass}>
        {!videoReady ? (
          <Image
            src={POSTER_SRC}
            alt=""
            fill
            priority
            sizes="(min-width: 1024px) 58vw, 100vw"
            className="clive-video-stage__poster"
          />
        ) : null}
        {([0, 1] as const).map((index) => (
          <video
            key={index}
            ref={layerRefs[index]}
            className={`clive-video-stage__layer ${
              videoReady && activeLayer === index
                ? "clive-video-stage__layer--active"
                : "clive-video-stage__layer--inactive"
            }`}
            muted
            playsInline
            preload="auto"
            poster={POSTER_SRC}
            aria-hidden
          />
        ))}
      </div>
    );
  },
);

export { CLIVE_VIDEO_CROSSFADE_MS };
