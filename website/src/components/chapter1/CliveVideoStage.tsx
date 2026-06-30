"use client";

import Image from "next/image";
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
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

type LayerIndex = 0 | 1;

export type CliveVideoStageHandle = {
  playReaction: (reaction: CliveReaction) => void;
  startIdleReel: () => void;
  stopIdleReel: () => void;
};

type CliveVideoStageProps = {
  className?: string;
};

function loadAndPlay(
  video: HTMLVideoElement,
  src: string,
  loop: boolean,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const onReady = () => {
      cleanup();
      video.loop = loop;
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
    const layerRefs = [useRef<HTMLVideoElement>(null), useRef<HTMLVideoElement>(null)];
    const activeLayerRef = useRef<LayerIndex>(0);
    const actionPlayingRef = useRef(false);
    const idleReelActiveRef = useRef(false);
    const idleReelIndexRef = useRef(0);
    const idleReelPendingRef = useRef(false);
    const endedHandlerRef = useRef<(() => void) | null>(null);

    const setActive = useCallback((layer: LayerIndex) => {
      activeLayerRef.current = layer;
      setActiveLayer(layer);
    }, []);

    const clearEndedHandler = useCallback(() => {
      const layer = activeLayerRef.current;
      const video = layerRefs[layer].current;
      if (video && endedHandlerRef.current) {
        video.removeEventListener("ended", endedHandlerRef.current);
        endedHandlerRef.current = null;
      }
    }, [layerRefs]);

    const crossfadeToClip = useCallback(
      async (src: string, loop: boolean): Promise<HTMLVideoElement | null> => {
        const current = activeLayerRef.current;
        const next: LayerIndex = current === 0 ? 1 : 0;
        const nextVideo = layerRefs[next].current;
        if (!nextVideo) return null;

        await loadAndPlay(nextVideo, src, loop);
        setActive(next);
        return nextVideo;
      },
      [layerRefs, setActive],
    );

    const playIdleReelClip = useCallback(async () => {
      if (!idleReelActiveRef.current || actionPlayingRef.current || prefersReducedMotion) {
        return;
      }

      clearEndedHandler();

      const src = CLIVE_IDLE_REEL[idleReelIndexRef.current] ?? CLIVE_IDLE_REEL[0];
      idleReelIndexRef.current = (idleReelIndexRef.current + 1) % CLIVE_IDLE_REEL.length;

      try {
        const video = await crossfadeToClip(src, false);
        if (!video || !idleReelActiveRef.current) return;

        const onEnded = () => {
          video.removeEventListener("ended", onEnded);
          endedHandlerRef.current = null;
          void playIdleReelClip();
        };
        endedHandlerRef.current = onEnded;
        video.addEventListener("ended", onEnded);
      } catch {
        idleReelIndexRef.current =
          (idleReelIndexRef.current + CLIVE_IDLE_REEL.length - 1) % CLIVE_IDLE_REEL.length;
      }
    }, [clearEndedHandler, crossfadeToClip, prefersReducedMotion]);

    const returnToIdle = useCallback(async () => {
      clearEndedHandler();
      actionPlayingRef.current = false;

      if (idleReelActiveRef.current) {
        void playIdleReelClip();
        return;
      }

      try {
        await crossfadeToClip(CLIVE_REACTION_CLIPS.idle, true);
      } catch {
        setVideoReady(false);
      }
    }, [clearEndedHandler, crossfadeToClip, playIdleReelClip]);

    const startIdleReel = useCallback(() => {
      if (prefersReducedMotion) return;
      idleReelActiveRef.current = true;
      idleReelIndexRef.current = 0;
      if (!videoReady) {
        idleReelPendingRef.current = true;
        return;
      }
      idleReelPendingRef.current = false;
      void playIdleReelClip();
    }, [playIdleReelClip, prefersReducedMotion, videoReady]);

    const stopIdleReel = useCallback(() => {
      idleReelActiveRef.current = false;
      clearEndedHandler();
    }, [clearEndedHandler]);

    const playReaction = useCallback(
      async (reaction: CliveReaction) => {
        if (prefersReducedMotion || !videoReady) return;

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
          endedHandlerRef.current = onEnded;
          nextVideo.addEventListener("ended", onEnded);
        } catch {
          actionPlayingRef.current = false;
        }
      },
      [clearEndedHandler, crossfadeToClip, prefersReducedMotion, returnToIdle, videoReady],
    );

    useImperativeHandle(
      ref,
      () => ({ playReaction, startIdleReel, stopIdleReel }),
      [playReaction, startIdleReel, stopIdleReel],
    );

    useEffect(() => {
      if (prefersReducedMotion) return;

      const video = layerRefs[0].current;
      if (!video) return;

      let cancelled = false;

      loadAndPlay(video, CLIVE_REACTION_CLIPS.idle, true)
        .then(() => {
          if (!cancelled) {
            setVideoReady(true);
            if (idleReelPendingRef.current && idleReelActiveRef.current) {
              idleReelPendingRef.current = false;
              void playIdleReelClip();
            }
          }
        })
        .catch(() => {
          if (!cancelled) setVideoReady(false);
        });

      return () => {
        cancelled = true;
        stopIdleReel();
      };
    }, [layerRefs, playIdleReelClip, prefersReducedMotion, stopIdleReel]);

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
