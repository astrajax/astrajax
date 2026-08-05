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
  CLIVE_AMBIENT_PLAYBACK_RATE,
  CLIVE_IDLE_REEL,
  CLIVE_REACTION_CLIPS,
  reactionPlaybackRate,
  type CliveReaction,
} from "@/lib/clive/video-reactions";
import { usePrefersReducedMotion } from "@/components/command-centre/usePortraitTransition";

const POSTER_SRC =
  castHeroByProduct("clive") ?? "/agent-cast/clive-wigglesworth/hero.png";

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
  playbackRate = CLIVE_AMBIENT_PLAYBACK_RATE,
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
    const [videoReady, setVideoReady] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);
    const actionPlayingRef = useRef(false);
    const idleReelActiveRef = useRef(false);
    const idleReelIndexRef = useRef(0);
    const videoReadyRef = useRef(false);
    const bootstrapPromiseRef = useRef<Promise<void> | null>(null);
    const endedHandlerRef = useRef<(() => void) | null>(null);

    const markVideoReady = useCallback(() => {
      videoReadyRef.current = true;
      setVideoReady(true);
    }, []);

    /**
     * Warm reaction clips once the stage is playing so the first listen/think
     * hard-cut is instant. Idle-time, once; skipped for reduced motion and
     * Save-Data users.
     */
    const warmedReactionsRef = useRef(false);

    useEffect(() => {
      if (!videoReady || warmedReactionsRef.current || prefersReducedMotion) return;
      const connection = (navigator as Navigator & { connection?: { saveData?: boolean } })
        .connection;
      if (connection?.saveData) return;
      warmedReactionsRef.current = true;

      const warm = () => {
        for (const [name, src] of Object.entries(CLIVE_REACTION_CLIPS)) {
          if (name === "idle") continue;
          void fetch(src, { cache: "force-cache" }).catch(() => {});
        }
      };

      if (typeof window.requestIdleCallback === "function") {
        window.requestIdleCallback(warm);
      } else {
        window.setTimeout(warm, 1200);
      }
    }, [prefersReducedMotion, videoReady]);

    const clearEndedHandler = useCallback(() => {
      const video = videoRef.current;
      if (video && endedHandlerRef.current) {
        video.removeEventListener("ended", endedHandlerRef.current);
        endedHandlerRef.current = null;
      }
    }, []);

    const attachEndedHandler = useCallback(
      (video: HTMLVideoElement, onEnded: () => void) => {
        clearEndedHandler();
        endedHandlerRef.current = onEnded;
        video.addEventListener("ended", onEnded);
      },
      [clearEndedHandler],
    );

    /** Hard-cut to a clip on the single video layer — no crossfade, no scene blend. */
    const cutToClip = useCallback(
      async (
        src: string,
        loop: boolean,
        playbackRate = CLIVE_AMBIENT_PLAYBACK_RATE,
      ): Promise<HTMLVideoElement | null> => {
        const video = videoRef.current;
        if (!video) return null;

        if (!videoReadyRef.current) {
          if (bootstrapPromiseRef.current) {
            await bootstrapPromiseRef.current;
          } else {
            const bootstrap = loadAndPlay(video, src, loop, playbackRate).then(() => {
              markVideoReady();
            });
            bootstrapPromiseRef.current = bootstrap;
            try {
              await bootstrap;
            } finally {
              bootstrapPromiseRef.current = null;
            }
            return video;
          }
        }

        await loadAndPlay(video, src, loop, playbackRate);
        markVideoReady();
        return video;
      },
      [markVideoReady],
    );

    const playIdleReelClip = useCallback(async () => {
      if (!idleReelActiveRef.current || actionPlayingRef.current || prefersReducedMotion) {
        return;
      }

      clearEndedHandler();

      const src = CLIVE_IDLE_REEL[idleReelIndexRef.current] ?? CLIVE_IDLE_REEL[0];
      idleReelIndexRef.current = (idleReelIndexRef.current + 1) % CLIVE_IDLE_REEL.length;

      try {
        const video = await cutToClip(src, false);
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
    }, [attachEndedHandler, clearEndedHandler, cutToClip, prefersReducedMotion]);

    const returnToIdle = useCallback(async () => {
      clearEndedHandler();
      actionPlayingRef.current = false;

      if (idleReelActiveRef.current) {
        void playIdleReelClip();
        return;
      }

      try {
        await cutToClip(CLIVE_REACTION_CLIPS.idle, true);
      } catch {
        videoReadyRef.current = false;
        setVideoReady(false);
      }
    }, [clearEndedHandler, cutToClip, playIdleReelClip]);

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
          const nextVideo = await cutToClip(src, loop);
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
        clearEndedHandler,
        cutToClip,
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
          const nextVideo = await cutToClip(src, false, reactionPlaybackRate(reaction));
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
      [attachEndedHandler, clearEndedHandler, cutToClip, prefersReducedMotion, returnToIdle],
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
        <video
          ref={videoRef}
          className={[
            "clive-video-stage__layer",
            videoReady
              ? "clive-video-stage__layer--active"
              : "clive-video-stage__layer--inactive",
          ].join(" ")}
          muted
          playsInline
          preload="metadata"
          poster={POSTER_SRC}
          aria-hidden
        />
      </div>
    );
  },
);
