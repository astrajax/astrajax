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
  onUserMessage?: (message: string) => void;
  onAssistantMessage?: (message: string) => void;
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
  onUserMessage,
  onAssistantMessage,
  disabled = false,
  transcriptOnly = false,
  initialMessages = [],
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

        const reply = await readTextStream(response, setStreamingText);
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

  const speakerName = persona === "pam" ? "Pam" : "Clive";
  const portraitSrc =
    persona === "pam" ? null : "/agent-cast/clive-wigglesworth.png";

  return (
    <div className={`clive-chat ${compact ? "clive-chat--compact" : ""}`}>
      <div ref={listRef} className="clive-chat__messages">
        {greeting && messages.length === 0 && !streamingText && (
          <div className="clive-chat__bubble clive-chat__bubble--assistant">
            {portraitSrc && (
              <Image
                src={portraitSrc}
                alt=""
                width={36}
                height={36}
                className="clive-chat__avatar"
              />
            )}
            {persona === "pam" && (
              <div className="clive-chat__avatar clive-chat__avatar--pam" aria-hidden>
                P
              </div>
            )}
            <p>
              <span className="clive-chat__speaker">{speakerName}:</span> {greeting}
            </p>
          </div>
        )}

        {messages.map((turn, index) => (
          <div
            key={`${turn.role}-${index}`}
            className={`clive-chat__bubble ${
              turn.role === "assistant" ? "clive-chat__bubble--assistant" : "clive-chat__bubble--user"
            }`}
          >
            {turn.role === "assistant" && portraitSrc && (
              <Image
                src={portraitSrc}
                alt=""
                width={36}
                height={36}
                className="clive-chat__avatar"
              />
            )}
            {turn.role === "assistant" && persona === "pam" && (
              <div className="clive-chat__avatar clive-chat__avatar--pam" aria-hidden>
                P
              </div>
            )}
            <p>
              <span className="clive-chat__speaker">
                {turn.role === "assistant" ? speakerName : "You"}:
              </span>{" "}
              {turn.content}
            </p>
          </div>
        ))}

        {streamingText && (
          <div className="clive-chat__bubble clive-chat__bubble--assistant">
            {portraitSrc && (
              <Image
                src={portraitSrc}
                alt=""
                width={36}
                height={36}
                className="clive-chat__avatar"
              />
            )}
            {persona === "pam" && (
              <div className="clive-chat__avatar clive-chat__avatar--pam" aria-hidden>
                P
              </div>
            )}
            <p>
              <span className="clive-chat__speaker">{speakerName}:</span> {streamingText}
            </p>
          </div>
        )}

        {isThinking && !streamingText && (
          <div className="clive-chat__bubble clive-chat__bubble--assistant">
            <p className="text-ink-muted">
              <span className="clive-chat__speaker">{speakerName}:</span> Thinking…
            </p>
          </div>
        )}
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
