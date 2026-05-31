"use client";

import { useMemo, useRef, useState } from "react";
import type { ChatMessage } from "@/lib/clive/types";

const GREETING =
  "Ask me about AstraJax, the method, offers, or how Clive keeps context clean for agents.";

const STARTER_PROMPTS = [
  "What does AstraJax actually do?",
  "What is Clive?",
  "How did Matthew build this without coding?",
];

export function AskClivePanel() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const hasConversation = messages.length > 0;
  const statusLabel = useMemo(() => (isThinking ? "Thinking" : "Live"), [isThinking]);

  async function sendMessage(raw: string) {
    const message = raw.trim();
    if (!message || isThinking) return;

    setError(null);
    setInput("");
    setIsThinking(true);

    const nextMessages: ChatMessage[] = [...messages, { role: "user", content: message }];
    setMessages(nextMessages);

    try {
      const response = await fetch("/api/ask-clive", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message,
          history: messages,
        }),
      });

      const data = (await response.json()) as { reply?: string; error?: string };

      if (!response.ok || !data.reply) {
        throw new Error(data.error ?? "Clive could not answer right now.");
      }

      setMessages([...nextMessages, { role: "assistant", content: data.reply }]);
    } catch (err) {
      const detail = err instanceof Error ? err.message : "Something went wrong.";
      setError(detail);
    } finally {
      setIsThinking(false);
      requestAnimationFrame(() => {
        listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
      });
    }
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    void sendMessage(input);
  }

  return (
    <div className="card flex flex-col p-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="section-label">Ask Clive</p>
        <span
          className={`status-pill ${isThinking ? "status-pill--pending" : "status-pill--live"}`}
        >
          {statusLabel}
        </span>
      </div>

      <div className="card-muted flex min-h-[18rem] flex-1 flex-col p-5">
        <div ref={listRef} className="mb-4 max-h-72 flex-1 space-y-3 overflow-y-auto pr-1">
          {!hasConversation && (
            <>
              <div className="rounded-lg bg-white px-4 py-3 text-sm text-ink-muted">
                Context health · governed sources
              </div>
              <div className="rounded-lg bg-apricot/10 px-4 py-3 text-sm text-ink">
                <span className="font-medium">Clive:</span> {GREETING}
              </div>
            </>
          )}

          {messages.map((turn, index) => (
            <div
              key={`${turn.role}-${index}`}
              className={`rounded-lg px-4 py-3 text-sm ${
                turn.role === "assistant"
                  ? "bg-apricot/10 text-ink"
                  : "bg-white text-ink-muted"
              }`}
            >
              <span className="font-medium">{turn.role === "assistant" ? "Clive" : "You"}:</span>{" "}
              {turn.content}
            </div>
          ))}

          {isThinking && (
            <div className="rounded-lg bg-apricot/10 px-4 py-3 text-sm text-ink-muted">
              <span className="font-medium text-ink">Clive:</span> Thinking…
            </div>
          )}
        </div>

        {!hasConversation && (
          <div className="mb-4 flex flex-wrap gap-2">
            {STARTER_PROMPTS.map((prompt) => (
              <button
                key={prompt}
                type="button"
                onClick={() => void sendMessage(prompt)}
                disabled={isThinking}
                className="rounded-full border border-ink/15 bg-white px-3 py-1.5 text-left text-xs text-ink-muted transition hover:border-ink/30 hover:text-ink disabled:opacity-50"
              >
                {prompt}
              </button>
            ))}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Ask about AstraJax or Clive…"
            maxLength={500}
            disabled={isThinking}
            className="min-w-0 flex-1 rounded-lg border border-ink/15 bg-white px-3 py-2 text-sm text-ink outline-none ring-apricot/30 placeholder:text-ink-muted/70 focus:ring-2 disabled:opacity-60"
            aria-label="Message for Clive"
          />
          <button
            type="submit"
            disabled={isThinking || !input.trim()}
            className="btn-primary shrink-0 px-4 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50"
          >
            Send
          </button>
        </form>

        {error && (
          <p className="mt-3 text-xs text-apricot" role="alert">
            {error}
          </p>
        )}

        <p className="mt-3 text-xs text-ink-muted">
          Answers use approved AstraJax context. For a tailored conversation, start with an Audit.
        </p>
      </div>
    </div>
  );
}
