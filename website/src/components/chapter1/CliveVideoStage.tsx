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
import {
  decideCue,
  initialReactionQueueState,
  nextAfterNaturalEnd,
  type PlayerPhase,
  type ReactionQueueState,
} from "@/components/chapter1/reaction-queue";

const POSTER_SRC =
  castHeroByProduct("clive") ?? "/agent-cast/clive-wigglesworth/hero.png";

export type CliveVideoStageHandle = {
  playReaction: (reaction: CliveReaction) => void;
  /** Play an arbitrary clip; when loop is true, runs until stopIdleReel/returnToIdle. */
  playClip: (src: string, loop?: boolean, holdOnEnd?: boolean) => void;
  /**
   * Play a scripted state-change / welcome / speaking clip — the MOST
   * protected phase. Contextual reaction cues queue behind it and only
   * play on its natural end if still relevant.
   */
  playScripted: (src: string, loop?: boolean, holdOnEnd?: boolean) => void;
  startIdleReel: () => void;
  stopIdleReel: () => void;
  returnToIdle: () => void;
  /** Scope the reaction queue to the current turn/page state (drops stale cues). */
  setContextTurn: (token: string | null) => void;
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

    /**
     * Non-interruption contract state (Matthew's addendum). phaseRef is the
     * player's own read of what is protected right now — a reaction clip,
     * an arbitrary playClip clip, or a scripted/speaking clip — and
     * queueRef holds the single coalesced contextual cue. A cue NEVER cuts
     * while phaseRef is protected; it waits for a natural end.
     */
    const phaseRef = useRef<PlayerPhase>("idle");
    const queueRef = useRef<ReactionQueueState>(initialReactionQueueState());
    const turnTokenRef = useRef<string | null>(null);
    // Latest settleProtectedEnd, read by driveReaction's ended handler
    // without a dependency cycle.
    const settleProtectedEndRef = useRef<(() => void) | null>(null);

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
        // The reel is playing — interruptible idle, cues may cut in.
        phaseRef.current = "idle";

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
      phaseRef.current = "idle";

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

    /**
     * Drive the actual playback of a reaction clip (the gate has already
     * said yes). Marks the phase protected and stamps the cooldown.
     */
    const driveReaction = useCallback(
      async (reaction: CliveReaction): Promise<void> => {
        const src = CLIVE_REACTION_CLIPS[reaction];
        if (!src) return;

        clearEndedHandler();
        actionPlayingRef.current = true;
        phaseRef.current = "reaction";
        queueRef.current = {
          ...queueRef.current,
          lastPlayedAt: Date.now(),
        };

        try {
          const nextVideo = await cutToClip(src, false, reactionPlaybackRate(reaction));
          if (!nextVideo) {
            actionPlayingRef.current = false;
            phaseRef.current = "idle";
            return;
          }

          const onEnded = () => {
            nextVideo.removeEventListener("ended", onEnded);
            endedHandlerRef.current = null;
            // Natural end of this reaction: settle through the gate — play a
            // still-valid queued cue once, else return to idle.
            settleProtectedEndRef.current?.();
          };
          attachEndedHandler(nextVideo, onEnded);
        } catch {
          actionPlayingRef.current = false;
          phaseRef.current = "idle";
        }
      },
      [attachEndedHandler, clearEndedHandler, cutToClip],
    );

    /**
     * A protected clip ended NATURALLY. The contract: if a valid queued
     * contextual cue exists (fresh TTL, same turn), play it ONCE; otherwise
     * return to idle/idle reel. Never cut mid-clip.
     */
    const settleProtectedEnd = useCallback(() => {
      const next = nextAfterNaturalEnd({
        state: queueRef.current,
        now: Date.now(),
        turnToken: turnTokenRef.current,
        prefersReducedMotion,
      });
      // Consume the queue slot either way — it never accumulates.
      queueRef.current = { ...queueRef.current, queued: null };

      if (next) {
        void driveReaction(next);
      } else {
        void returnToIdle();
      }
    }, [driveReaction, prefersReducedMotion, returnToIdle]);

    // Let driveReaction's ended handler reach the latest settleProtectedEnd
    // without a dependency cycle.
    settleProtectedEndRef.current = settleProtectedEnd;

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
      phaseRef.current = "idle";
      // Explicit stop: context no longer applies — drop any queued cue.
      queueRef.current = { ...queueRef.current, queued: null };
    }, [clearEndedHandler]);

    /**
     * Shared driver for protected clips (arbitrary action clips AND scripted
     * welcome/speaking/state-change clips). Both are protected from reaction
     * cues; the only difference is the phase tag the queue reads. On natural
     * end, the gate settles (valid queued cue once, else idle).
     */
    const playProtectedClip = useCallback(
      async (
        src: string,
        phase: PlayerPhase,
        loop = false,
        holdOnEnd = false,
      ) => {
        idleReelActiveRef.current = false;
        clearEndedHandler();
        actionPlayingRef.current = true;
        phaseRef.current = phase;

        try {
          const nextVideo = await cutToClip(src, loop);
          if (!nextVideo) {
            actionPlayingRef.current = false;
            phaseRef.current = "idle";
            return;
          }

          if (loop || holdOnEnd) return;

          const onEnded = () => {
            nextVideo.removeEventListener("ended", onEnded);
            endedHandlerRef.current = null;
            settleProtectedEndRef.current?.();
          };
          attachEndedHandler(nextVideo, onEnded);
        } catch {
          actionPlayingRef.current = false;
          phaseRef.current = "idle";
        }
      },
      [attachEndedHandler, clearEndedHandler, cutToClip],
    );

    const playClip = useCallback(
      async (src: string, loop = false, holdOnEnd = false) => {
        if (prefersReducedMotion || !src) return;
        await playProtectedClip(src, "clip", loop, holdOnEnd);
      },
      [playProtectedClip, prefersReducedMotion],
    );

    const playScripted = useCallback(
      async (src: string, loop = false, holdOnEnd = false) => {
        if (prefersReducedMotion || !src) return;
        await playProtectedClip(src, "scripted", loop, holdOnEnd);
      },
      [playProtectedClip, prefersReducedMotion],
    );

    /**
     * Contextual reaction cue — the ONLY public way to play a reaction. The
     * cue is a typed CliveReaction (never a path/URL), so the allowlist is
     * structural. This is where the non-interruption contract is enforced:
     * a cue NEVER cuts a protected clip; it plays now only from idle, else
     * coalesces into the single queue slot and waits for a natural end.
     */
    const playReaction = useCallback(
      (reaction: CliveReaction) => {
        if (prefersReducedMotion || !videoReadyRef.current) return;

        if (reaction === "idle") {
          // Explicit return-to-idle: clear any queued cue whose context no
          // longer applies, then settle.
          queueRef.current = { ...queueRef.current, queued: null };
          void returnToIdle();
          return;
        }

        const decision = decideCue({
          reaction,
          phase: phaseRef.current,
          state: queueRef.current,
          now: Date.now(),
          turnToken: turnTokenRef.current,
          prefersReducedMotion,
        });

        if (decision.kind === "play-now") {
          void driveReaction(reaction);
          return;
        }

        if (decision.kind === "queue") {
          // Coalesce: the single slot holds the latest relevant cue.
          queueRef.current = {
            ...queueRef.current,
            queued: reaction,
            queuedAt: Date.now(),
            turnToken: turnTokenRef.current,
          };
          return;
        }

        // "drop": reduced-motion, duplicate cue, or similar — no-op by design.
      },
      [driveReaction, prefersReducedMotion, returnToIdle],
    );

    useImperativeHandle(
      ref,
      () => ({
        playReaction,
        playClip,
        playScripted,
        startIdleReel,
        stopIdleReel,
        returnToIdle,
        /**
         * Scope the reaction queue to the current conversation turn / page
         * state. Call on beat/step change: any cue queued under the old turn
         * goes stale and drops on the next natural end.
         */
        setContextTurn: (token: string | null) => {
          turnTokenRef.current = token;
          if (queueRef.current.queued && queueRef.current.turnToken !== token) {
            queueRef.current = { ...queueRef.current, queued: null };
          }
        },
      }),
      [playClip, playReaction, playScripted, returnToIdle, startIdleReel, stopIdleReel],
    );

    useEffect(() => {
      return () => {
        // Unmount: clear any queued reaction — its context is gone.
        queueRef.current = initialReactionQueueState();
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
