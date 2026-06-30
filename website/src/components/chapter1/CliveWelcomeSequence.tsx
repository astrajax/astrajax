"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CliveChatSurface } from "@/components/chapter1/CliveChatSurface";
import type { CliveVideoStageHandle } from "@/components/chapter1/CliveVideoStage";
import { usePrefersReducedMotion } from "@/components/command-centre/usePortraitTransition";
import type { ChatMessage } from "@/lib/clive/types";
import {
  CLIVE_WELCOME_BEATS,
  estimateReadingMs,
} from "@/lib/clive/welcome-sequence";

const CAPTION_ENTER_DELAY_MS = 1500;
const CAPTION_FADE_MS = 700;

type CaptionPhase = "hidden" | "entering" | "visible" | "exiting";

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

export function CliveWelcomeSequence({
  sessionId,
  onComplete,
  videoRef,
}: CliveWelcomeSequenceProps) {
  const prefersReducedMotion = usePrefersReducedMotion();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const beatIndexRef = useRef(0);
  const readingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const captionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cancelledRef = useRef(false);
  const mutedRef = useRef(false);
  const readingStartedAtRef = useRef<number | null>(null);
  const readingDurationRef = useRef(0);
  const lastStartedBeatRef = useRef<number | null>(null);

  const [beatIndex, setBeatIndex] = useState(0);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [caption, setCaption] = useState<string | null>(null);
  const [captionPhase, setCaptionPhase] = useState<CaptionPhase>("hidden");
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
    onComplete();
  }, [clearTimers, onComplete, stopAudio, videoRef]);

  const showCaption = useCallback(
    (text: string) => {
      setCaption(text);
      if (prefersReducedMotion) {
        setCaptionPhase("visible");
        return;
      }
      setCaptionPhase("entering");
      captionTimerRef.current = setTimeout(() => {
        setCaptionPhase("visible");
      }, CAPTION_FADE_MS);
    },
    [prefersReducedMotion],
  );

  const hideCaption = useCallback(
    (onHidden?: () => void) => {
      if (prefersReducedMotion) {
        setCaption(null);
        setCaptionPhase("hidden");
        onHidden?.();
        return;
      }

      setCaptionPhase("exiting");
      captionTimerRef.current = setTimeout(() => {
        setCaption(null);
        setCaptionPhase("hidden");
        onHidden?.();
      }, CAPTION_FADE_MS);
    },
    [prefersReducedMotion],
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

      setChatMessages((prev) => [...prev, { role: "assistant", content: beat.monologue }]);

      const revealCaption = () => showCaption(beat.caption);

      if (index === 0) {
        captionTimerRef.current = setTimeout(revealCaption, CAPTION_ENTER_DELAY_MS);
      } else {
        hideCaption(revealCaption);
      }

      if (beat.audioSrc && (await audioFileExists(beat.audioSrc))) {
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
        } catch {
          onError();
        }
        return;
      }

      scheduleReadingAdvance(estimateReadingMs(beat.monologue));
    },
    [
      advanceBeat,
      clearTimers,
      finishSequence,
      hideCaption,
      scheduleReadingAdvance,
      showCaption,
      stopAudio,
    ],
  );

  useEffect(() => {
    cancelledRef.current = false;
    beatIndexRef.current = 0;
    const reelTimer = setTimeout(() => videoRef?.current?.startIdleReel(), 100);

    return () => {
      cancelledRef.current = true;
      clearTimeout(reelTimer);
      clearTimers();
      stopAudio();
      videoRef?.current?.stopIdleReel();
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
  const captionClass = [
    "clive-welcome-caption",
    captionPhase === "visible" ? "clive-welcome-caption--visible" : "",
    captionPhase === "entering" ? "clive-welcome-caption--entering" : "",
    captionPhase === "exiting" ? "clive-welcome-caption--exiting" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="clive-welcome">
      {caption ? (
        <p className={captionClass} aria-live="polite">
          {caption}
        </p>
      ) : null}

      <CliveChatSurface
        key={`welcome-chat-${chatMessages.length}`}
        sessionId={sessionId}
        transcriptOnly
        studyMode
        userLabel="The Architect"
        initialMessages={chatMessages}
      />

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
