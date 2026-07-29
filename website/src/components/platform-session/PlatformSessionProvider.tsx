"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { PlatformTurnContext } from "@/lib/platform-activity/types";

const STORAGE_KEY = "astrajax-platform-session-v1";

type StoredSession = {
  handle: string;
  publicSessionId: string;
};

type PlatformSessionStatus =
  | "starting"
  | "active"
  | "paused"
  | "ended"
  | "disabled"
  | "error";

type PlatformSessionContextValue = {
  status: PlatformSessionStatus;
  publicSessionId?: string;
  beginTurn: () => Promise<PlatformTurnContext | null>;
  headersFor: (turn?: Pick<PlatformTurnContext, "handle" | "turnId"> | null) => Record<string, string>;
  pause: () => Promise<void>;
  reopen: () => Promise<void>;
  endSession: () => Promise<boolean>;
  recordEvent: (input: {
    eventType?: "Action" | "Decision";
    summary: string;
    outcome?: string;
    source?: string;
    detail?: Record<string, unknown>;
  }) => Promise<void>;
};

const PlatformSessionContext = createContext<PlatformSessionContextValue | null>(null);

function readStoredSession(): StoredSession | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredSession;
    return parsed.handle && parsed.publicSessionId ? parsed : null;
  } catch {
    return null;
  }
}

function persistSession(session: StoredSession | null): void {
  if (session) {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  } else {
    window.localStorage.removeItem(STORAGE_KEY);
  }
}

export function PlatformSessionProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<StoredSession | null>(null);
  const [status, setStatus] = useState<PlatformSessionStatus>("starting");
  const sessionRef = useRef<StoredSession | null>(null);
  const startPromiseRef = useRef<Promise<StoredSession | null> | null>(null);

  const storeSession = useCallback((next: StoredSession | null) => {
    sessionRef.current = next;
    setSession(next);
    persistSession(next);
  }, []);

  const start = useCallback(async (): Promise<StoredSession | null> => {
    if (startPromiseRef.current) return startPromiseRef.current;
    const pending = (async () => {
      setStatus("starting");
      const response = await fetch("/api/platform-sessions/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pageUrl: window.location.href }),
      });
      const data = (await response.json()) as {
        enabled?: boolean;
        handle?: string;
        publicSessionId?: string;
      };
      if (!response.ok) throw new Error("Could not start the platform session.");
      if (!data.enabled) {
        setStatus("disabled");
        return null;
      }
      if (!data.handle || !data.publicSessionId) {
        throw new Error("Platform session start returned no handle.");
      }
      const next = { handle: data.handle, publicSessionId: data.publicSessionId };
      storeSession(next);
      setStatus("active");
      return next;
    })()
      .catch(() => {
        setStatus("error");
        return null;
      })
      .finally(() => {
        startPromiseRef.current = null;
      });
    startPromiseRef.current = pending;
    return pending;
  }, [storeSession]);

  const reopen = useCallback(async () => {
    const current = sessionRef.current;
    if (!current) {
      await start();
      return;
    }
    const response = await fetch("/api/platform-sessions/reopen", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Platform-Session": current.handle },
      body: JSON.stringify({ handle: current.handle }),
      keepalive: true,
    });
    if (response.status === 410) {
      storeSession(null);
      await start();
      return;
    }
    if (response.ok) setStatus("active");
  }, [start, storeSession]);

  const pause = useCallback(async () => {
    const current = sessionRef.current;
    if (!current || status === "disabled" || status === "ended") return;
    setStatus("paused");
    await fetch("/api/platform-sessions/pause", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Platform-Session": current.handle },
      body: JSON.stringify({ handle: current.handle }),
      keepalive: true,
    }).catch(() => undefined);
  }, [status]);

  const endSession = useCallback(async () => {
    let current = sessionRef.current;
    if (!current) current = await start();
    if (!current) return status === "disabled" || status === "error";
    const response = await fetch("/api/platform-sessions/close", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Platform-Session": current.handle },
      body: JSON.stringify({ handle: current.handle }),
      keepalive: true,
    });
    if (!response.ok) return false;
    storeSession(null);
    setStatus("ended");
    return true;
  }, [start, status, storeSession]);

  const beginTurn = useCallback(async (): Promise<PlatformTurnContext | null> => {
    let current = sessionRef.current;
    if (!current) current = await start();
    if (!current) return null;
    if (status === "paused") await reopen();
    current = sessionRef.current ?? current;
    return {
      handle: current.handle,
      publicSessionId: current.publicSessionId,
      turnId: crypto.randomUUID(),
    };
  }, [reopen, start, status]);

  const headersFor = useCallback(
    (turn?: Pick<PlatformTurnContext, "handle" | "turnId"> | null): Record<string, string> => {
      const current = turn?.handle ?? sessionRef.current?.handle;
      return {
        ...(current ? { "X-Platform-Session": current } : {}),
        ...(turn?.turnId ? { "X-Platform-Turn-Id": turn.turnId } : {}),
      };
    },
    [],
  );

  const recordEvent = useCallback(
    async (input: {
      eventType?: "Action" | "Decision";
      summary: string;
      outcome?: string;
      source?: string;
      detail?: Record<string, unknown>;
    }) => {
      const turn = await beginTurn();
      if (!turn) return;
      await fetch("/api/platform-activity/event", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...headersFor(turn) },
        body: JSON.stringify({ handle: turn.handle, ...input }),
        keepalive: true,
      });
    },
    [beginTurn, headersFor],
  );

  useEffect(() => {
    const existing = readStoredSession();
    if (existing) {
      storeSession(existing);
      void reopen();
    } else {
      void start();
    }
  }, [reopen, start, storeSession]);

  useEffect(() => {
    const pauseByBeacon = () => {
      const current = sessionRef.current;
      if (!current || status === "disabled" || status === "ended") return;
      const body = new Blob([JSON.stringify({ handle: current.handle })], {
        type: "application/json",
      });
      navigator.sendBeacon("/api/platform-sessions/pause", body);
    };
    const onVisibility = () => {
      if (document.visibilityState === "hidden") pauseByBeacon();
      else void reopen();
    };
    const onOffline = () => pauseByBeacon();
    const onOnline = () => void reopen();

    window.addEventListener("pagehide", pauseByBeacon);
    window.addEventListener("offline", onOffline);
    window.addEventListener("online", onOnline);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("pagehide", pauseByBeacon);
      window.removeEventListener("offline", onOffline);
      window.removeEventListener("online", onOnline);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [reopen, status]);

  const value = useMemo<PlatformSessionContextValue>(
    () => ({
      status,
      publicSessionId: session?.publicSessionId,
      beginTurn,
      headersFor,
      pause,
      reopen,
      endSession,
      recordEvent,
    }),
    [beginTurn, endSession, headersFor, pause, recordEvent, reopen, session?.publicSessionId, status],
  );

  return <PlatformSessionContext.Provider value={value}>{children}</PlatformSessionContext.Provider>;
}

export function usePlatformSession(): PlatformSessionContextValue {
  const context = useContext(PlatformSessionContext);
  if (!context) throw new Error("usePlatformSession must be used inside PlatformSessionProvider.");
  return context;
}
