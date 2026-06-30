"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import type { ChatMessage, ClivePersona } from "@/lib/clive/types";

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
  /** Label for the human side of the conversation (Chapter 1: "The Architect"). */
  userLabel?: string;
  /** When set, skips /api/ask-clive and uses this handler for assistant replies. */
  onCustomSend?: (message: string, history: ChatMessage[]) => Promise<string>;
  onUserMessage?: (message: string) => void;
  onAssistantMessage?: (message: string) => void;
  onThinkingChange?: (thinking: boolean) => void;
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
  onUserMessage,
  onAssistantMessage,
  onThinkingChange,
  disabled = false,
  transcriptOnly = false,
  initialMessages = [],
  onCustomSend,
}: CliveChatSurfaceProps) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [input, setInput] = useState("");
  const [streamingText, setStreamingText] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    requestAnimationFrame(() => {
      listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
    });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingText, scrollToBottom]);

  useEffect(() => {
    onThinkingChange?.(isThinking);
  }, [isThinking, onThinkingChange]);

  const sendMessage = useCallback(
    async (raw: string) => {
      const message = raw.trim();
      if (!message || isThinking || disabled || transcriptOnly) return;

      setError(null);
      setInput("");
      setIsThinking(true);
      setStreamingText("");
      onUserMessage?.(message);

      const nextMessages: ChatMessage[] = [...messages, { role: "user", content: message }];
      setMessages(nextMessages);

      try {
        let reply: string;

        if (onCustomSend) {
          reply = await onCustomSend(message, messages);
        } else {
          const response = await fetch("/api/ask-clive", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Accept: "text/plain",
            },
            body: JSON.stringify({
              message,
              history: messages,
              sessionId,
              persona,
              beat,
              loopContext,
              stream: true,
            }),
          });

          if (!response.ok) {
            const data = (await response.json().catch(() => ({}))) as { error?: string };
            throw new Error(data.error ?? "Clive could not answer right now.");
          }

          reply = await readTextStream(response, setStreamingText);
        }

        const assistantMessage: ChatMessage = { role: "assistant", content: reply };
        setMessages([...nextMessages, assistantMessage]);
        setStreamingText("");
        onAssistantMessage?.(reply);
      } catch (err) {
        const detail = err instanceof Error ? err.message : "Something went wrong.";
        setError(detail);
        setStreamingText("");
      } finally {
        setIsThinking(false);
      }
    },
    [
      beat,
      disabled,
      isThinking,
      loopContext,
      messages,
      onAssistantMessage,
      onCustomSend,
      onUserMessage,
      persona,
      sessionId,
      transcriptOnly,
    ],
  );

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    void sendMessage(input);
  }

  const speakerName = studyMode
    ? persona === "pam"
      ? "Pam Portiscue"
      : "Clive Wigglesworth"
    : persona === "pam"
      ? "Pam"
      : "Clive";
  const portraitSrc =
    persona === "pam" ? null : "/agent-cast/clive-wigglesworth.png";

  const chatClassName = [
    "clive-chat",
    compact ? "clive-chat--compact" : "",
    studyMode ? "clive-chat--study" : "",
  ]
    .filter(Boolean)
    .join(" ");

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
        <p className={options?.muted ? "text-ink-muted" : undefined}>
          <span className="clive-chat__speaker">{label}:</span> {content}
        </p>
      </div>
    );
  }

  return (
    <div className={chatClassName}>
      <div ref={listRef} className="clive-chat__messages">
        {greeting && messages.length === 0 && !streamingText &&
          renderTurn("assistant", greeting, "greeting")}

        {messages.map((turn, index) =>
          renderTurn(turn.role, turn.content, `${turn.role}-${index}`),
        )}

        {streamingText && renderTurn("assistant", streamingText, "streaming")}

        {isThinking && !streamingText &&
          renderTurn("assistant", "Thinking…", "thinking", { muted: true })}
      </div>

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
            <input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder={placeholder}
              maxLength={500}
              disabled={isThinking || disabled}
              className="clive-chat__input"
              aria-label={`Message for ${speakerName}`}
            />
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

      {error && (
        <p className="mt-3 text-xs text-apricot" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
