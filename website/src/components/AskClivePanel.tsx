"use client";

import { useEffect, useState } from "react";
import { CliveChatSurface } from "@/components/chapter1/CliveChatSurface";

const GREETING =
  "Ask me about AstraJax, citizen-builders, the adoption loop, or how Clive keeps agent context clean.";

const SESSION_STORAGE_KEY = "astrajax-ask-clive-session";

const STARTER_PROMPTS = [
  "What is the adoption operating system?",
  "Why should domain experts shape agents?",
  "How does Clive keep agents trustworthy?",
];

export function AskClivePanel() {
  const [sessionId, setSessionId] = useState<string | null>(null);

  useEffect(() => {
    const existing = window.localStorage.getItem(SESSION_STORAGE_KEY);
    if (existing?.trim()) {
      setSessionId(existing.trim());
      return;
    }
    const created =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `web_${Date.now()}`;
    window.localStorage.setItem(SESSION_STORAGE_KEY, created);
    setSessionId(created);
  }, []);

  if (!sessionId) {
    return (
      <div className="card flex min-h-[18rem] items-center justify-center p-6 text-sm text-ink-muted">
        Loading Clive…
      </div>
    );
  }

  return (
    <div className="card p-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="section-label">Ask Clive</p>
        <span className="status-pill status-pill--live">Live</span>
      </div>
      <CliveChatSurface
        greeting={GREETING}
        sessionId={sessionId}
        placeholder="Ask about adoption, context or Clive…"
        starterPrompts={STARTER_PROMPTS}
      />
      <p className="mt-3 text-xs text-ink-muted">
        Answers use approved AstraJax context. For the full governed loop, enter Chapter 1.
      </p>
    </div>
  );
}
