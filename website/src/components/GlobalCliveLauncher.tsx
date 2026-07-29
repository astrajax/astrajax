"use client";

import Image from "next/image";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useId, useState } from "react";
import { CliveChatSurface } from "@/components/chapter1/CliveChatSurface";
import { loadPersistedLoopSlice } from "@/lib/aie-demo/user-brain-intake";
import { PlatformSessionControls } from "@/components/platform-session/PlatformSessionControls";

const HIDDEN_PATHS = ["/brain", "/chapter-1", "/aie-demo", "/command", "/court"];

const GREETING =
  "Ask me about AstraJax, citizen-builders, the adoption loop, or how Clive keeps agent context clean.";

const SESSION_STORAGE_KEY = "astrajax-ask-clive-session";

const VOICE_ENABLED = process.env.NEXT_PUBLIC_CLIVE_VOICE === "1";

function createSessionId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `web_${Date.now()}`;
}

type ReturningArchitect = {
  name: string;
  role?: string;
  goal?: string;
};

function loadReturningArchitect(): ReturningArchitect | null {
  const intake = loadPersistedLoopSlice()?.userBrainIntake;
  const name = intake?.name?.trim();
  if (!name) return null;
  return { name, role: intake?.role, goal: intake?.goal };
}

export function GlobalCliveLauncher() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [returning, setReturning] = useState<ReturningArchitect | null>(null);
  const panelId = useId();

  useEffect(() => {
    setReturning(loadReturningArchitect());

    const existing = window.localStorage.getItem(SESSION_STORAGE_KEY);
    if (existing?.trim()) {
      setSessionId(existing.trim());
      return;
    }
    const created = createSessionId();
    window.localStorage.setItem(SESSION_STORAGE_KEY, created);
    setSessionId(created);
  }, []);

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [close, open]);

  const ready = sessionId !== null;

  if (pathname === "/" || HIDDEN_PATHS.some((path) => pathname?.startsWith(path))) {
    return null;
  }

  const greeting = returning
    ? `Welcome back, ${returning.name}. ${GREETING}`
    : GREETING;
  const loopContext = returning
    ? `Returning visitor previously mapped in Chapter 1 — name: ${returning.name}${
        returning.role ? `; role: ${returning.role}` : ""
      }${returning.goal ? `; goal: ${returning.goal}` : ""}. Greet them as a returning architect and keep continuity.`
    : undefined;

  return (
    <>
      <button
        type="button"
        className="global-clive-launcher"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((value) => !value)}
      >
        <Image
          src="/agent-cast/clive-wigglesworth.png"
          alt=""
          width={40}
          height={40}
          className="global-clive-launcher__avatar"
        />
        <span className="global-clive-launcher__label">Chat with Clive</span>
      </button>

      {open && ready && (
        <div className="global-clive-panel" id={panelId} role="dialog" aria-label="Chat with Clive">
          <header className="global-clive-panel__header">
            <div className="flex items-center gap-3">
              <Image
                src="/agent-cast/clive-wigglesworth.png"
                alt=""
                width={36}
                height={36}
                className="rounded-full"
              />
              <div>
                <p className="font-display font-semibold text-ink">Clive</p>
                <p className="text-xs text-ink-muted">Governed context · booth-safe fallback</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-end gap-2">
              <PlatformSessionControls compact />
              <button type="button" className="btn-secondary px-3 py-1.5 text-sm" onClick={close}>
                Close
              </button>
            </div>
          </header>
          <CliveChatSurface
            greeting={greeting}
            loopContext={loopContext}
            sessionId={sessionId}
            persistTranscript
            voice={VOICE_ENABLED}
            compact
            placeholder="Ask about adoption, context or Clive…"
            starterPrompts={[
              "What is the adoption operating system?",
              "Why should domain experts shape agents?",
            ]}
          />
        </div>
      )}
    </>
  );
}
