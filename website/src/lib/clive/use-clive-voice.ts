"use client";

// Clive voice playback hook — website/docs/clive-voice-t1-build-pack.md, Lane C.
// Safari constraints: (1) one shared media-element source, ever — createMediaElementSource
// works exactly once per <audio> element; (2) prime() gesture-unlocks playback/AudioContext.

import { useCallback, useEffect, useRef, useState } from "react";
import type { PlatformTurnContext } from "@/lib/platform-activity/types";

type UseCliveVoiceOptions = {
  enabled: boolean;
  targetRef: React.RefObject<HTMLElement | null>;
  onVoiceError?: (detail: string) => void;
};

type UseCliveVoiceResult = {
  speak: (text: string, platformTurn?: PlatformTurnContext | null) => Promise<void>;
  stop: () => void;
  speaking: boolean;
  prime: () => void;
};

// Safari only exposes Web Audio behind a vendor prefix on older versions.
interface WindowWithWebkitAudioContext extends Window {
  webkitAudioContext?: typeof AudioContext;
}

const SPEECH_LEVEL_PROPERTY = "--clive-speech-level";
const SPEAKING_ATTRIBUTE = "data-clive-speaking";
const ANALYSER_FFT_SIZE = 256;
const RMS_GAIN = 3;
const SMOOTHING_LERP = 0.25;

export function useCliveVoice({
  enabled,
  targetRef,
  onVoiceError,
}: UseCliveVoiceOptions): UseCliveVoiceResult {
  const [speaking, setSpeaking] = useState(false);

  // Safari: only one MediaElementSource per <audio> element, ever — so the
  // element and every node built from it live in refs and are created once.
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<MediaElementAudioSourceNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  // Pinned to ArrayBuffer (not ArrayBufferLike): getByteTimeDomainData
  // rejects SharedArrayBuffer-backed views under TS 5.7+ typed arrays.
  const analyserDataRef = useRef<Uint8Array<ArrayBuffer> | null>(null);

  const objectUrlRef = useRef<string | null>(null);
  const rafIdRef = useRef<number | null>(null);
  const smoothedLevelRef = useRef(0);

  const writeSpeechLevel = useCallback(
    (value: number) => {
      targetRef.current?.style.setProperty(SPEECH_LEVEL_PROPERTY, value.toFixed(3));
    },
    [targetRef],
  );

  const resetSpeechLevel = useCallback(() => {
    targetRef.current?.style.setProperty(SPEECH_LEVEL_PROPERTY, "0");
  }, [targetRef]);

  const cancelAmplitudeLoop = useCallback(() => {
    if (rafIdRef.current !== null) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }
  }, []);

  // Shared teardown for every way playback can stop: the "ended" event or an
  // explicit stop() call. Resets the CSS glow signal and speaking state.
  const teardownPlaybackVisuals = useCallback(() => {
    cancelAmplitudeLoop();
    smoothedLevelRef.current = 0;
    resetSpeechLevel();
    targetRef.current?.removeAttribute(SPEAKING_ATTRIBUTE);
    setSpeaking(false);
  }, [cancelAmplitudeLoop, resetSpeechLevel, targetRef]);

  const revokeObjectUrl = useCallback(() => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
  }, []);

  // Lazily creates the one-and-only audio element plus its "ended" listener.
  // Must run before any play attempt, including the prime() gesture unlock.
  const ensureAudioElement = useCallback((): HTMLAudioElement => {
    if (audioRef.current) return audioRef.current;

    const audio = new Audio();
    audio.preload = "auto";
    // Attached once, at creation, per the single-shared-element contract —
    // re-attaching per speak() call would leak listeners onto this element.
    audio.addEventListener("ended", teardownPlaybackVisuals);
    audioRef.current = audio;
    return audio;
  }, [teardownPlaybackVisuals]);

  // Builds the Web Audio graph exactly once. If AudioContext construction
  // fails (ancient browsers), playback continues without the glow — the
  // analyser is enhancement only, never a playback dependency.
  const ensureAudioGraph = useCallback((audio: HTMLAudioElement): void => {
    if (audioContextRef.current && sourceNodeRef.current && analyserRef.current) return;

    try {
      const Ctor =
        window.AudioContext ??
        (window as WindowWithWebkitAudioContext).webkitAudioContext;
      if (!Ctor) return;

      const context = new Ctor();
      // Safari: createMediaElementSource may only be called once per element
      // for its entire lifetime — this call must never run a second time.
      const source = context.createMediaElementSource(audio);
      const analyser = context.createAnalyser();
      analyser.fftSize = ANALYSER_FFT_SIZE;

      source.connect(analyser);
      analyser.connect(context.destination);

      audioContextRef.current = context;
      sourceNodeRef.current = source;
      analyserRef.current = analyser;
      analyserDataRef.current = new Uint8Array(analyser.frequencyBinCount);
    } catch {
      // Enhancement only — leave every ref null so the amplitude loop below
      // takes its "no analyser" branch; audio playback is unaffected.
    }
  }, []);

  // The iOS/Safari gesture unlock. Called synchronously inside a click
  // handler, so it must never await anything before touching audio/context.
  const prime = useCallback(() => {
    const audio = ensureAudioElement();

    // A muted play/pause round-trip inside the gesture marks this element as
    // user-activated so a later, async speak() call can call play() freely.
    const wasMuted = audio.muted;
    audio.muted = true;
    audio
      .play()
      .then(() => {
        audio.pause();
        audio.currentTime = 0;
        audio.muted = wasMuted;
      })
      .catch(() => {
        // Nothing played yet (no src) — that's fine, the gesture still counts
        // toward unlocking the element for the next real play() call.
        audio.muted = wasMuted;
      });

    ensureAudioGraph(audio);
    audioContextRef.current?.resume().catch(() => {
      // Resume can reject if the context is already running/closed — ignore.
    });
  }, [ensureAudioElement, ensureAudioGraph]);

  const runAmplitudeLoop = useCallback(() => {
    const analyser = analyserRef.current;
    const data = analyserDataRef.current;

    if (!analyser || !data) {
      // No analyser (construction failed) — keep the loop alive so speaking
      // state/lifecycle still tracks correctly, just with a flat level.
      writeSpeechLevel(0);
      rafIdRef.current = requestAnimationFrame(runAmplitudeLoop);
      return;
    }

    analyser.getByteTimeDomainData(data);

    let sumSquares = 0;
    for (let i = 0; i < data.length; i += 1) {
      const deviation = data[i] - 128;
      sumSquares += deviation * deviation;
    }
    const rms = Math.sqrt(sumSquares / data.length);
    const rawLevel = Math.min(1, (rms / 128) * RMS_GAIN);

    smoothedLevelRef.current += (rawLevel - smoothedLevelRef.current) * SMOOTHING_LERP;
    writeSpeechLevel(smoothedLevelRef.current);

    rafIdRef.current = requestAnimationFrame(runAmplitudeLoop);
  }, [writeSpeechLevel]);

  const stop = useCallback(() => {
    const audio = audioRef.current;
    teardownPlaybackVisuals();
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }
  }, [teardownPlaybackVisuals]);

  const speak = useCallback(
    async (text: string, platformTurn?: PlatformTurnContext | null) => {
      if (!enabled || !text.trim()) return;

      stop();

      let response: Response;
      try {
        response = await fetch("/api/clive-voice", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(platformTurn
              ? {
                  "X-Platform-Session": platformTurn.handle,
                  "X-Platform-Turn-Id": platformTurn.turnId,
                }
              : {}),
          },
          body: JSON.stringify({ text, turnId: platformTurn?.turnId }),
        });
      } catch {
        onVoiceError?.("Could not reach the voice service.");
        return;
      }

      if (!response.ok) {
        onVoiceError?.(`Voice request failed (${response.status}).`);
        return;
      }

      let blob: Blob;
      try {
        blob = await response.blob();
      } catch {
        onVoiceError?.("Voice response could not be read.");
        return;
      }

      const audio = ensureAudioElement();
      ensureAudioGraph(audio);
      // Covers the restored-preference path (voice on from localStorage, no
      // toggle click this session): the Send interaction grants activation,
      // so a suspended context can resume here rather than playing silently.
      audioContextRef.current?.resume().catch(() => {});

      // Each speak() gets its own object URL; the previous one is revoked so
      // blob URLs don't accumulate for the life of the page.
      revokeObjectUrl();
      const url = URL.createObjectURL(blob);
      objectUrlRef.current = url;
      audio.src = url;

      try {
        await audio.play();
      } catch {
        onVoiceError?.("Playback was blocked by the browser.");
        return;
      }

      setSpeaking(true);
      targetRef.current?.setAttribute(SPEAKING_ATTRIBUTE, "true");
      smoothedLevelRef.current = 0;
      cancelAmplitudeLoop();
      rafIdRef.current = requestAnimationFrame(runAmplitudeLoop);
    },
    [
      cancelAmplitudeLoop,
      ensureAudioElement,
      ensureAudioGraph,
      enabled,
      onVoiceError,
      revokeObjectUrl,
      runAmplitudeLoop,
      stop,
      targetRef,
    ],
  );

  // Enabled is an external kill switch (e.g. a mute toggle) — flipping it off
  // mid-speech must silence playback immediately, not just block new speak()s.
  useEffect(() => {
    if (!enabled) stop();
  }, [enabled, stop]);

  useEffect(() => {
    return () => {
      stop();
      cancelAmplitudeLoop();
      revokeObjectUrl();
      // AudioContext is intentionally left open on unmount — Safari's
      // handling of context re-creation/teardown across remounts is
      // unreliable, so we leak one context for the page's lifetime instead.
      audioRef.current?.removeEventListener("ended", teardownPlaybackVisuals);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { speak, stop, speaking, prime };
}
