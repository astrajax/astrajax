"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { CliveVideoStageHandle } from "@/components/chapter1/CliveVideoStage";
import { usePrefersReducedMotion } from "@/components/command-centre/usePortraitTransition";
import {
  CLIVE_WELCOME_BEATS,
  estimateReadingMs,
} from "@/lib/clive/welcome-sequence";
import { CLIVE_WELCOME_BEAT_1_STITCHED } from "@/lib/clive/video-reactions";

const CAPTION_ENTER_DELAY_MS = 1500;
const FADE_MS = 700;

type FadePhase = "hidden" | "entering" | "visible" | "exiting";

type CliveWelcomeSequenceProps = {
  sessionId: string;
  onComplete: () => void;
  videoRef?: React.RefObject<CliveVideoStageHandle | null>;
};

async function audioFileExists(src: string): Promise<boolean> {
  try {
    const response = await fetch(src, { method: "HEAD" });
    return response.ok;
  } catch {
    return false;
  }
}

function fadeClass(base: string, phase: FadePhase): string {
  return [
    base,
    phase === "visible" ? `${base}--visible` : "",
    phase === "entering" ? `${base}--entering` : "",
    phase === "exiting" ? `${base}--exiting` : "",
  ]
    .filter(Boolean)
    .join(" ");
}

export function CliveWelcomeSequence({
  onComplete,
  videoRef,
}: CliveWelcomeSequenceProps) {
  const prefersReducedMotion = usePrefersReducedMotion();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const beatIndexRef = useRef(0);
  const readingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const captionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const monologueTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cancelledRef = useRef(false);
  const mutedRef = useRef(false);
  const readingStartedAtRef = useRef<number | null>(null);
  const readingDurationRef = useRef(0);
  const lastStartedBeatRef = useRef<number | null>(null);

  const [beatIndex, setBeatIndex] = useState(0);
  const [caption, setCaption] = useState<string | null>(null);
  const [captionPhase, setCaptionPhase] = useState<FadePhase>("hidden");
  const [monologue, setMonologue] = useState<string | null>(null);
  const [monologuePhase, setMonologuePhase] = useState<FadePhase>("hidden");
  const [muted, setMuted] = useState(false);
  const [paused, setPaused] = useState(false);
  const [usingReadingTimer, setUsingReadingTimer] = useState(false);
  const [readingMsRemaining, setReadingMsRemaining] = useState(0);

  mutedRef.current = muted;

  const clearTimers = useCallback(() => {
    if (readingTimerRef.current) {
      clearTimeout(readingTimerRef.current);
      readingTimerRef.current = null;
    }
    if (captionTimerRef.current) {
      clearTimeout(captionTimerRef.current);
      captionTimerRef.current = null;
    }
    if (monologueTimerRef.current) {
      clearTimeout(monologueTimerRef.current);
      monologueTimerRef.current = null;
    }
  }, []);

  const stopAudio = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.pause();
    audio.removeAttribute("src");
    audio.load();
  }, []);

  const finishSequence = useCallback(() => {
    if (cancelledRef.current) return;
    cancelledRef.current = true;
    clearTimers();
    stopAudio();
    videoRef?.current?.stopIdleReel();
    videoRef?.current?.returnToIdle();
    onComplete();
  }, [clearTimers, onComplete, stopAudio, videoRef]);

  const revealFade = useCallback(
    (
      setText: (value: string) => void,
      setPhase: (value: FadePhase) => void,
      text: string,
      timerRef: React.MutableRefObject<ReturnType<typeof setTimeout> | null>,
    ) => {
      setText(text);
      if (prefersReducedMotion) {
        setPhase("visible");
        return;
      }
      setPhase("entering");
      timerRef.current = setTimeout(() => {
        setPhase("visible");
      }, FADE_MS);
    },
    [prefersReducedMotion],
  );

  const hideFade = useCallback(
    (
      setText: (value: string | null) => void,
      setPhase: (value: FadePhase) => void,
      timerRef: React.MutableRefObject<ReturnType<typeof setTimeout> | null>,
      onHidden?: () => void,
    ) => {
      if (prefersReducedMotion) {
        setText(null);
        setPhase("hidden");
        onHidden?.();
        return;
      }

      setPhase("exiting");
      timerRef.current = setTimeout(() => {
        setText(null);
        setPhase("hidden");
        onHidden?.();
      }, FADE_MS);
    },
    [prefersReducedMotion],
  );

  const showCaption = useCallback(
    (text: string) => {
      revealFade(setCaption, setCaptionPhase, text, captionTimerRef);
    },
    [revealFade],
  );

  const hideCaption = useCallback(
    (onHidden?: () => void) => {
      hideFade(setCaption, setCaptionPhase, captionTimerRef, onHidden);
    },
    [hideFade],
  );

  const showMonologue = useCallback(
    (text: string) => {
      revealFade(setMonologue, setMonologuePhase, text, monologueTimerRef);
    },
    [revealFade],
  );

  const hideMonologue = useCallback(
    (onHidden?: () => void) => {
      hideFade(setMonologue, setMonologuePhase, monologueTimerRef, onHidden);
    },
    [hideFade],
  );

  const advanceBeat = useCallback(() => {
    const nextIndex = beatIndexRef.current + 1;
    if (nextIndex >= CLIVE_WELCOME_BEATS.length) {
      finishSequence();
      return;
    }
    beatIndexRef.current = nextIndex;
    setBeatIndex(nextIndex);
  }, [finishSequence]);

  const scheduleReadingAdvance = useCallback(
    (durationMs: number) => {
      setUsingReadingTimer(true);
      readingDurationRef.current = durationMs;
      readingStartedAtRef.current = Date.now();
      setReadingMsRemaining(durationMs);
      setPaused(false);

      readingTimerRef.current = setTimeout(() => {
        setUsingReadingTimer(false);
        advanceBeat();
      }, durationMs);
    },
    [advanceBeat],
  );

  const runBeat = useCallback(
    async (index: number) => {
      if (cancelledRef.current) return;

      const beat = CLIVE_WELCOME_BEATS[index];
      if (!beat) {
        finishSequence();
        return;
      }

      setUsingReadingTimer(false);
      clearTimers();
      stopAudio();

      if (index === 0) {
        videoRef?.current?.playClip(CLIVE_WELCOME_BEAT_1_STITCHED, false, true);
      } else {
        videoRef?.current?.startIdleReel();
      }

      const revealMonologue = () => showMonologue(beat.monologue);
      const revealCaption = () => showCaption(beat.caption);

      if (index === 0) {
        revealMonologue();
        captionTimerRef.current = setTimeout(revealCaption, CAPTION_ENTER_DELAY_MS);
      } else {
        hideMonologue(revealMonologue);
        hideCaption(revealCaption);
      }

      if (beat.audioSrc) {
        const hasAudio = await audioFileExists(beat.audioSrc);
        if (cancelledRef.current) return;

        if (hasAudio) {
          const audio = audioRef.current ?? new Audio();
          audioRef.current = audio;
          audio.src = beat.audioSrc;
          audio.muted = mutedRef.current;
          audio.preload = "auto";

          const onEnded = () => {
            audio.removeEventListener("ended", onEnded);
            audio.removeEventListener("error", onError);
            advanceBeat();
          };

          const onError = () => {
            audio.removeEventListener("ended", onEnded);
            audio.removeEventListener("error", onError);
            scheduleReadingAdvance(estimateReadingMs(beat.monologue));
          };

          audio.addEventListener("ended", onEnded);
          audio.addEventListener("error", onError);

          try {
            await audio.play();
            if (cancelledRef.current) return;
          } catch {
            if (cancelledRef.current) return;
            onError();
          }
          return;
        }
      }

      scheduleReadingAdvance(estimateReadingMs(beat.monologue));
    },
    [
      advanceBeat,
      clearTimers,
      finishSequence,
      hideCaption,
      hideMonologue,
      scheduleReadingAdvance,
      showCaption,
      showMonologue,
      stopAudio,
      videoRef,
    ],
  );

  useEffect(() => {
    cancelledRef.current = false;
    beatIndexRef.current = 0;

    return () => {
      cancelledRef.current = true;
      clearTimers();
      stopAudio();
      videoRef?.current?.stopIdleReel();
      videoRef?.current?.returnToIdle();
    };
  }, [clearTimers, stopAudio, videoRef]);

  useEffect(() => {
    if (lastStartedBeatRef.current === beatIndex) return;
    lastStartedBeatRef.current = beatIndex;
    void runBeat(beatIndex);
  }, [beatIndex, runBeat]);

  useEffect(() => {
    const audio = audioRef.current;
    if (audio) audio.muted = muted;
  }, [muted]);

  const handlePauseResume = useCallback(() => {
    const audio = audioRef.current;

    if (usingReadingTimer) {
      if (paused) {
        readingStartedAtRef.current = Date.now();
        readingTimerRef.current = setTimeout(() => {
          setUsingReadingTimer(false);
          setPaused(false);
          advanceBeat();
        }, readingDurationRef.current);
        setPaused(false);
      } else {
        if (readingTimerRef.current) clearTimeout(readingTimerRef.current);
        const elapsed = Date.now() - (readingStartedAtRef.current ?? Date.now());
        readingDurationRef.current = Math.max(0, readingDurationRef.current - elapsed);
        setReadingMsRemaining(readingDurationRef.current);
        setPaused(true);
      }
      return;
    }

    if (!audio || !audio.src) return;

    if (paused) {
      void audio.play();
      setPaused(false);
    } else {
      audio.pause();
      setPaused(true);
    }
  }, [advanceBeat, paused, usingReadingTimer]);

  const handleContinue = useCallback(() => {
    if (!usingReadingTimer) return;
    clearTimers();
    setUsingReadingTimer(false);
    setPaused(false);
    advanceBeat();
  }, [advanceBeat, clearTimers, usingReadingTimer]);

  const currentBeat = CLIVE_WELCOME_BEATS[beatIndex];

  return (
    <div className="clive-welcome">
      {caption ? (
        <p className={fadeClass("clive-welcome-caption", captionPhase)} aria-live="polite">
          {caption}
        </p>
      ) : null}

      <div className="clive-welcome-monologue" aria-live="polite">
        <p className="clive-welcome-monologue__label">Clive Wigglesworth</p>
        {monologue ? (
          <p className={fadeClass("clive-welcome-monologue__text", monologuePhase)}>
            {monologue}
          </p>
        ) : (
          <p className="clive-welcome-monologue__text clive-welcome-monologue__text--placeholder">
            &nbsp;
          </p>
        )}
      </div>

      <div className="clive-welcome__controls" role="toolbar" aria-label="Welcome sequence controls">
        <button type="button" className="study-stage__ghost-btn" onClick={finishSequence}>
          Skip intro
        </button>
        <button
          type="button"
          className="study-stage__ghost-btn"
          onClick={handlePauseResume}
          aria-pressed={paused}
        >
          {paused ? "Resume" : "Pause"}
        </button>
        <button
          type="button"
          className="study-stage__ghost-btn"
          onClick={() => setMuted((value) => !value)}
          aria-pressed={muted}
        >
          {muted ? "Unmute" : "Mute"}
        </button>
        {usingReadingTimer ? (
          <button type="button" className="study-stage__ghost-btn" onClick={handleContinue}>
            Continue
          </button>
        ) : null}
      </div>

      {usingReadingTimer && paused && readingMsRemaining > 0 ? (
        <p className="clive-welcome__hint" aria-live="polite">
          Reading time paused — about {Math.ceil(readingMsRemaining / 1000)}s left on{" "}
          {currentBeat?.title ?? "this beat"}.
        </p>
      ) : null}
    </div>
  );
}
