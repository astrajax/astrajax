"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { StudyAssistantText } from "@/components/chapter1/StudyAssistantText";
import { StudyMarkdown } from "@/components/chapter1/StudyMarkdown";
import { useFolioStage } from "@/components/chapter1/FolioStageContext";
import { usePlatformSession } from "@/components/platform-session/PlatformSessionProvider";
import { useCliveVoice } from "@/lib/clive/use-clive-voice";
import type { ChatMessage, ClivePersona } from "@/lib/clive/types";
import type { PlatformTurnContext } from "@/lib/platform-activity/types";

const TRANSCRIPT_STORAGE_PREFIX = "astrajax-clive-transcript-";
const TRANSCRIPT_MAX_TURNS = 40;
const SCROLL_PIN_THRESHOLD_PX = 48;
const VOICE_STORAGE_KEY = "astrajax-clive-voice";

type CliveChatSurfaceProps = {
  persona?: ClivePersona;
  greeting?: string;
  beat?: string;
  loopContext?: string;
  sessionId: string;
  placeholder?: string;
  starterPrompts?: string[];
  compact?: boolean;
  /** Calm study rail — full names, lighter chrome. */
  studyMode?: boolean;
  /** Label for the human side of the conversation (Chapter 1: "Architect {name}"). */
  userLabel?: string;
  /** Max characters accepted by the input. */
  maxLength?: number;
  /**
   * Persist the transcript to sessionStorage (keyed by sessionId) and restore
   * it on mount. Intended for the Ask Clive panel and global launcher so a
   * closed panel keeps its conversation. Loop surfaces manage their own state
   * and should leave this off.
   */
  persistTranscript?: boolean;
  /**
   * Offer Clive's voice (T1): a "Hear him" toggle, spoken-register replies,
   * and read-aloud playback with the amplitude glow. Pass only where the
   * NEXT_PUBLIC_CLIVE_VOICE flag is on — see docs/clive-voice-t1-build-pack.md.
   */
  voice?: boolean;
  /** When set, skips /api/ask-clive and uses this handler for assistant replies. */
  onCustomSend?: (
    message: string,
    history: ChatMessage[],
    platformTurn?: PlatformTurnContext | null,
  ) => Promise<string>;
  onUserMessage?: (message: string) => void;
  onAssistantMessage?: (message: string) => void;
  onThinkingChange?: (thinking: boolean) => void;
  /** Notified after a reply fails and the in-surface error affordance is shown. */
  onError?: (detail: string) => void;
  disabled?: boolean;
  /** When set, renders as read-only transcript without input. */
  transcriptOnly?: boolean;
  initialMessages?: ChatMessage[];
};

async function readTextStream(response: Response, onDelta: (chunk: string) => void): Promise<string> {
  const reader = response.body?.getReader();
  if (!reader) throw new Error("No response stream.");

  const decoder = new TextDecoder();
  let full = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const chunk = decoder.decode(value, { stream: true });
    full += chunk;
    onDelta(full);
  }

  return full.trim();
}

function loadPersistedTranscript(sessionId: string): ChatMessage[] | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(`${TRANSCRIPT_STORAGE_PREFIX}${sessionId}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ChatMessage[];
    if (!Array.isArray(parsed)) return null;
    const turns = parsed.filter(
      (turn) =>
        (turn?.role === "user" || turn?.role === "assistant") &&
        typeof turn?.content === "string",
    );
    return turns.length > 0 ? turns : null;
  } catch {
    return null;
  }
}

function savePersistedTranscript(sessionId: string, messages: ChatMessage[]): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(
      `${TRANSCRIPT_STORAGE_PREFIX}${sessionId}`,
      JSON.stringify(messages.slice(-TRANSCRIPT_MAX_TURNS)),
    );
  } catch {
    // Private browsing or quota — transcript persistence is best-effort.
  }
}

function prefersReducedMotionNow(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function CliveChatSurface({
  persona = "clive",
  greeting,
  beat,
  loopContext,
  sessionId,
  placeholder = "Talk to Clive…",
  starterPrompts = [],
  compact = false,
  studyMode = false,
  userLabel = "You",
  maxLength = 500,
  persistTranscript = false,
  voice = false,
  onUserMessage,
  onAssistantMessage,
  onThinkingChange,
  onError,
  disabled = false,
  transcriptOnly = false,
  initialMessages = [],
  onCustomSend,
}: CliveChatSurfaceProps) {
  const { beginTurn, headersFor } = usePlatformSession();
  const folioStage = useFolioStage();
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    if (persistTranscript && !transcriptOnly) {
      const stored = loadPersistedTranscript(sessionId);
      if (stored) return stored;
    }
    return initialMessages;
  });
  const [input, setInput] = useState("");
  const [streamingText, setStreamingText] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [freshInk, setFreshInk] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const pinnedRef = useRef(true);
  const lastAnimatedIndexRef = useRef(messages.length > 0 ? messages.length - 1 : -1);
  const lastAnnouncedIndexRef = useRef(messages.length > 0 ? messages.length - 1 : -1);
  const skipNextAnimationRef = useRef(false);
  const [animatingIndex, setAnimatingIndex] = useState<number | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const [voiceOn, setVoiceOn] = useState(() => {
    if (!voice || typeof window === "undefined") return false;
    try {
      return window.localStorage.getItem(VOICE_STORAGE_KEY) === "1";
    } catch {
      return false;
    }
  });
  const [voiceNote, setVoiceNote] = useState<string | null>(null);

  const { speak, stop: stopVoice, prime } = useCliveVoice({
    enabled: voice && voiceOn,
    targetRef: rootRef,
    onVoiceError: () =>
      setVoiceNote("His voice is resting — words on the page, as ever."),
  });

  // The enabling click doubles as the iOS gesture unlock (pack D3).
  const toggleVoice = useCallback(() => {
    setVoiceNote(null);
    const next = !voiceOn;
    if (next) {
      prime();
    } else {
      stopVoice();
    }
    try {
      window.localStorage.setItem(VOICE_STORAGE_KEY, next ? "1" : "0");
    } catch {
      // Private browsing — the preference just won't persist.
    }
    setVoiceOn(next);
  }, [prime, stopVoice, voiceOn]);

  const speakerName = studyMode
    ? persona === "pam"
      ? "Pam Portiscue"
      : "Clive Wigglesworth"
    : persona === "pam"
      ? "Pam"
      : "Clive";

  const scrollToBottom = useCallback((force = false) => {
    requestAnimationFrame(() => {
      const node = listRef.current;
      if (!node) return;
      if (!force && !pinnedRef.current) return;
      node.scrollTo({
        top: node.scrollHeight,
        behavior: prefersReducedMotionNow() ? "auto" : "smooth",
      });
    });
  }, []);

  const handleListScroll = useCallback(() => {
    const node = listRef.current;
    if (!node) return;
    const distanceFromBottom = node.scrollHeight - node.scrollTop - node.clientHeight;
    const pinned = distanceFromBottom < SCROLL_PIN_THRESHOLD_PX;
    pinnedRef.current = pinned;
    if (pinned) setFreshInk(false);
  }, []);

  useEffect(() => {
    if (pinnedRef.current) {
      scrollToBottom();
    } else if (messages.length > 0 || streamingText) {
      setFreshInk(true);
    }
  }, [messages, streamingText, scrollToBottom]);

  useEffect(() => {
    if (isThinking) scrollToBottom();
  }, [isThinking, scrollToBottom]);

  useEffect(() => {
    if (!persistTranscript || transcriptOnly) return;
    if (messages.length === 0) return;
    savePersistedTranscript(sessionId, messages);
  }, [messages, persistTranscript, sessionId, transcriptOnly]);

  useEffect(() => {
    const lastIndex = messages.length - 1;
    const lastMessage = messages[lastIndex];
    if (
      lastMessage?.role === "assistant" &&
      lastIndex > lastAnimatedIndexRef.current &&
      !streamingText
    ) {
      lastAnimatedIndexRef.current = lastIndex;
      if (skipNextAnimationRef.current) {
        skipNextAnimationRef.current = false;
        setAnimatingIndex(null);
      } else {
        setAnimatingIndex(lastIndex);
      }
    }
  }, [messages, streamingText]);

  useEffect(() => {
    const lastIndex = messages.length - 1;
    const lastMessage = messages[lastIndex];
    if (
      lastMessage?.role === "assistant" &&
      lastIndex > lastAnnouncedIndexRef.current &&
      !streamingText
    ) {
      lastAnnouncedIndexRef.current = lastIndex;
      setStatusMessage(`${speakerName}: ${lastMessage.content}`);
    }
  }, [messages, speakerName, streamingText]);

  useEffect(() => {
    onThinkingChange?.(isThinking);
  }, [isThinking, onThinkingChange]);

  const thinkingLabel =
    persona === "pam" ? "Pam is considering…" : "Clive's thinking…";

  useEffect(() => {
    if (isThinking && !streamingText) setStatusMessage(thinkingLabel);
  }, [isThinking, streamingText, thinkingLabel]);

  const resizeInput = useCallback(() => {
    const node = inputRef.current;
    if (!node) return;
    node.style.height = "auto";
    // Grow smoothly with content up to a bounded max tied to the page, then
    // scroll internally with native chrome hidden. The folio composer sets its
    // own max-height in CSS (~min(32vh, 13rem)); read that so the geometry is
    // governed by the stylesheet, not a hardcoded pixel. Fallback 132px where
    // no CSS cap applies (non-folio surfaces).
    const cssCap = parseFloat(getComputedStyle(node).maxHeight);
    const cap = Number.isFinite(cssCap) ? cssCap : 132;
    const next = Math.min(node.scrollHeight, cap);
    node.style.height = `${next}px`;
    // Past the cap the text region scrolls; below it, no scrollbar can appear.
    node.style.overflowY = node.scrollHeight > cap ? "auto" : "hidden";
  }, []);

  useEffect(() => {
    resizeInput();
  }, [input, resizeInput]);

  const requestReply = useCallback(
    async (message: string, history: ChatMessage[], nextMessages: ChatMessage[]) => {
      setError(null);
      setVoiceNote(null);
      setIsThinking(true);
      setStreamingText("");

      try {
        let reply: string;
        const platformTurn = await beginTurn();

        if (onCustomSend) {
          reply = await onCustomSend(message, history, platformTurn);
        } else {
          const response = await fetch("/api/ask-clive", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Accept: "text/plain",
              ...headersFor(platformTurn),
            },
            body: JSON.stringify({
              message,
              history,
              sessionId,
              persona,
              beat,
              loopContext,
              spoken: voice && voiceOn,
              stream: true,
            }),
          });

          if (!response.ok) {
            const data = (await response.json().catch(() => ({}))) as { error?: string };
            throw new Error(data.error ?? "Clive could not answer right now.");
          }

          reply = await readTextStream(response, setStreamingText);
          skipNextAnimationRef.current = true;
        }

        const assistantMessage: ChatMessage = { role: "assistant", content: reply };
        setMessages([...nextMessages, assistantMessage]);
        setStreamingText("");
        onAssistantMessage?.(reply);
        if (voice && voiceOn && reply) {
          void speak(reply, platformTurn);
        }
      } catch (err) {
        const detail = err instanceof Error ? err.message : "Something went wrong.";
        setError(detail);
        setStreamingText("");
        onError?.(detail);
      } finally {
        setIsThinking(false);
      }
    },
    [beat, beginTurn, headersFor, loopContext, onAssistantMessage, onCustomSend, onError, persona, sessionId, speak, voice, voiceOn],
  );

  const sendMessage = useCallback(
    async (raw: string) => {
      const message = raw.trim();
      if (!message || isThinking || disabled || transcriptOnly) return;

      setInput("");
      onUserMessage?.(message);
      // The folio's thought-vein: one journey from the send plate to his
      // portrait edge; the action record reveals only once it arrives.
      folioStage?.fireMessagePulse();

      const history = messages;
      const nextMessages: ChatMessage[] = [...messages, { role: "user", content: message }];
      setMessages(nextMessages);
      pinnedRef.current = true;
      setFreshInk(false);

      await requestReply(message, history, nextMessages);
    },
    [disabled, isThinking, messages, onUserMessage, requestReply, transcriptOnly],
  );

  const canRetry =
    Boolean(error) &&
    messages.length > 0 &&
    messages[messages.length - 1].role === "user";

  // Tell the folio stage whether this surface holds an active exchange —
  // engagement flips the stage between the teaching and interaction
  // compositions. UserBrainIntakeChat keeps its own transcript, so the
  // conversation derives engagement for the intake step separately.
  useEffect(() => {
    if (!folioStage) return;
    folioStage.setEngaged(messages.some((turn) => turn.role === "user"));
  }, [folioStage, messages]);

  const retryLastMessage = useCallback(async () => {
    if (isThinking || disabled || transcriptOnly) return;
    const lastMessage = messages[messages.length - 1];
    if (!lastMessage || lastMessage.role !== "user") return;
    await requestReply(lastMessage.content, messages.slice(0, -1), messages);
  }, [disabled, isThinking, messages, requestReply, transcriptOnly]);

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    void sendMessage(input);
  }

  function handleInputKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      void sendMessage(input);
    }
  }

  const portraitSrc =
    persona === "pam" ? null : "/agent-cast/clive-wigglesworth.png";

  const chatClassName = [
    "clive-chat",
    compact ? "clive-chat--compact" : "",
    studyMode ? "clive-chat--study" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const errorLine =
    persona === "pam"
      ? "Pam couldn't get her verdict down just now."
      : "The ink's run dry — give me a moment.";

  const freshInkChip = freshInk ? (
    <button
      type="button"
      className="clive-chat__fresh-ink"
      onClick={() => {
        setFreshInk(false);
        scrollToBottom(true);
      }}
    >
      Fresh ink below ↓
    </button>
  ) : null;

  const statusNode = (
    <p className="sr-only" role="status" aria-live="polite">
      {statusMessage}
    </p>
  );

  function renderErrorNotice(className: string) {
    if (!error) return null;
    return (
      <p className={className} role="alert" title={error}>
        {errorLine}
        {canRetry && (
          <button
            type="button"
            className="clive-chat__retry"
            onClick={() => void retryLastMessage()}
            disabled={isThinking || disabled}
          >
            Try again
          </button>
        )}
      </p>
    );
  }

  function renderTurn(
    role: "assistant" | "user",
    content: string,
    key: string,
    options?: { muted?: boolean },
  ) {
    const isAssistant = role === "assistant";
    const label = isAssistant ? speakerName : userLabel;

    if (studyMode) {
      return (
        <div
          key={key}
          className={`clive-chat__turn ${
            isAssistant ? "clive-chat__turn--assistant" : "clive-chat__turn--user"
          }`}
        >
          <p className="clive-chat__turn-label">{label}</p>
          <div
            className={`clive-chat__bubble ${
              isAssistant ? "clive-chat__bubble--assistant" : "clive-chat__bubble--user"
            }`}
          >
            <p className={options?.muted ? "text-parchment/70" : undefined}>{content}</p>
          </div>
        </div>
      );
    }

    return (
      <div
        key={key}
        className={`clive-chat__bubble ${
          isAssistant ? "clive-chat__bubble--assistant" : "clive-chat__bubble--user"
        }`}
      >
        {isAssistant && portraitSrc && (
          <Image
            src={portraitSrc}
            alt=""
            width={36}
            height={36}
            className="clive-chat__avatar"
          />
        )}
        {isAssistant && persona === "pam" && (
          <div className="clive-chat__avatar clive-chat__avatar--pam" aria-hidden>
            P
          </div>
        )}
        {isAssistant ? (
          // Assistant copy may carry block Markdown (p/ul/ol/hr), so it needs
          // a BLOCK wrapper — never a <p>, which cannot legally contain block
          // elements. User turns stay simple inline text.
          <div className={`clive-chat__md ${options?.muted ? "text-ink-muted" : ""}`}>
            <span className="clive-chat__speaker">{label}:</span>{" "}
            <StudyMarkdown content={content} />
          </div>
        ) : (
          <p className={options?.muted ? "text-ink-muted" : undefined}>
            <span className="clive-chat__speaker">{label}:</span> {content}
          </p>
        )}
      </div>
    );
  }

  function renderStudyAssistantTurn(
    content: string,
    key: string,
    options?: { animate?: boolean; muted?: boolean },
  ) {
    return (
      <div key={key} className="clive-chat__prompt">
        <p className="clive-chat__prompt-label">{speakerName}</p>
        <StudyAssistantText content={content} animate={options?.animate} />
      </div>
    );
  }

  function renderStudyUserTurn(content: string, key: string) {
    return (
      <div key={key} className="clive-chat__user-echo">
        <p className="clive-chat__prompt-label">{userLabel}</p>
        <p className="clive-chat__prompt-text clive-chat__prompt-text--user">{content}</p>
      </div>
    );
  }

  if (studyMode) {
    return (
      <div ref={rootRef} className={chatClassName}>
        <div ref={listRef} onScroll={handleListScroll} className="clive-chat__messages">
          {greeting && messages.length === 0 && !streamingText &&
            renderStudyAssistantTurn(greeting, "greeting")}

          {messages.map((turn, index) =>
            turn.role === "assistant"
              ? renderStudyAssistantTurn(turn.content, `assistant-${index}`, {
                  animate: index === animatingIndex,
                })
              : renderStudyUserTurn(turn.content, `user-${index}`),
          )}

          {streamingText && renderStudyAssistantTurn(streamingText, "streaming")}

          {isThinking && !streamingText && (
            <div className="clive-chat__thinking">
              <span className="clive-chat__thinking-pulse" aria-hidden />
              <span>{thinkingLabel}</span>
            </div>
          )}

          {freshInkChip}
        </div>

        {statusNode}

        {!transcriptOnly && (
          <>
            {messages.length === 0 && starterPrompts.length > 0 && (
              <div className="clive-chat__starters">
                {starterPrompts.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    onClick={() => void sendMessage(prompt)}
                    disabled={isThinking || disabled}
                    className="clive-chat__starter"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            )}

            <form onSubmit={handleSubmit} className="clive-chat__form">
              {/* The writing well takes the full safe page measure; the label
                  and Send plate move to a stable control row beneath it so no
                  permanent side column steals width from the text. */}
              <div className="clive-chat__form-row">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  onKeyDown={handleInputKeyDown}
                  placeholder={placeholder}
                  maxLength={maxLength}
                  rows={1}
                  disabled={isThinking || disabled}
                  className="clive-chat__input"
                  aria-label={`Message for ${speakerName}`}
                />
              </div>
              <div className="clive-chat__control-row">
                <p className="clive-chat__architect-label">{userLabel}</p>
                <button
                  type="submit"
                  disabled={isThinking || disabled || !input.trim()}
                  className="btn-primary shrink-0 px-4 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Send
                </button>
              </div>
            </form>
          </>
        )}

        {renderErrorNotice("clive-chat__study-error")}
      </div>
    );
  }

  return (
    <div ref={rootRef} className={chatClassName}>
      <div ref={listRef} onScroll={handleListScroll} className="clive-chat__messages">
        {greeting && messages.length === 0 && !streamingText &&
          renderTurn("assistant", greeting, "greeting")}

        {messages.map((turn, index) =>
          renderTurn(turn.role, turn.content, `${turn.role}-${index}`),
        )}

        {streamingText && renderTurn("assistant", streamingText, "streaming")}

        {isThinking && !streamingText &&
          renderTurn("assistant", "Thinking…", "thinking", { muted: true })}

        {freshInkChip}
      </div>

      {statusNode}

      {!transcriptOnly && (
        <>
          {messages.length === 0 && starterPrompts.length > 0 && (
            <div className="clive-chat__starters">
              {starterPrompts.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => void sendMessage(prompt)}
                  disabled={isThinking || disabled}
                  className="clive-chat__starter"
                >
                  {prompt}
                </button>
              ))}
            </div>
          )}

          <form onSubmit={handleSubmit} className="clive-chat__form">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={handleInputKeyDown}
              placeholder={placeholder}
              maxLength={maxLength}
              rows={1}
              disabled={isThinking || disabled}
              className="clive-chat__input"
              aria-label={`Message for ${speakerName}`}
            />
            {voice && (
              <button
                type="button"
                onClick={toggleVoice}
                aria-pressed={voiceOn}
                title="A temporary voice, pending casting — Clive reads his answers aloud."
                className={`clive-chat__voice-toggle${
                  voiceOn ? " clive-chat__voice-toggle--on" : ""
                }`}
              >
                {voiceOn ? "Voice on" : "Hear him"}
              </button>
            )}
            <button
              type="submit"
              disabled={isThinking || disabled || !input.trim()}
              className="btn-primary shrink-0 px-4 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50"
            >
              Send
            </button>
          </form>
        </>
      )}

      {voiceNote && !error && (
        <p className="clive-chat__voice-note" role="status">
          {voiceNote}
        </p>
      )}
      {renderErrorNotice("mt-3 text-xs text-apricot")}
    </div>
  );
}
