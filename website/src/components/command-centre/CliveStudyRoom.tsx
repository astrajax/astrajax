"use client";

import { useEffect, useState } from "react";
import { CliveChatSurface } from "@/components/chapter1/CliveChatSurface";
import { RoomShell } from "@/components/command-centre/RoomShell";
import { RoomStationGrid } from "@/components/command-centre/RoomStationGrid";
import { COMMAND_ROOMS } from "@/lib/command-centre/rooms";

const GREETING =
  "Ask me about AstraJax, citizen-builders, the adoption loop, or how Clive keeps agent context clean.";

const SESSION_STORAGE_KEY = "astrajax-ask-clive-session";

function createSessionId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `web_${Date.now()}`;
}

export function CliveStudyRoom() {
  const room = COMMAND_ROOMS.clive;
  const [sessionId, setSessionId] = useState<string | null>(null);

  useEffect(() => {
    const existing = window.localStorage.getItem(SESSION_STORAGE_KEY);
    if (existing?.trim()) {
      setSessionId(existing.trim());
      return;
    }
    const created = createSessionId();
    window.localStorage.setItem(SESSION_STORAGE_KEY, created);
    setSessionId(created);
  }, []);

  return (
    <RoomShell theme="clive" roomLabel={room.roomLabel} roomTitle={room.roomTitle}>
      <p className="mb-8 max-w-2xl text-lg text-parchment/85">{room.tagline}</p>
      <RoomStationGrid stations={room.stations.filter((s) => s.id !== "ask-clive")} />

      <section id="ask-clive" className="room-ask-clive mt-12 scroll-mt-24">
        <h2 className="font-display text-2xl font-semibold text-parchment">Ask Clive</h2>
        <p className="mt-2 max-w-xl text-sm text-parchment/75">
          Quick questions from the study — for the full governed loop, enter Chapter 1.
        </p>
        {sessionId ? (
          <div className="room-ask-clive__surface mt-6">
            <CliveChatSurface
              greeting={GREETING}
              sessionId={sessionId}
              placeholder="Ask about adoption, context or Clive…"
              starterPrompts={[
                "What is the adoption operating system?",
                "Why should domain experts shape agents?",
              ]}
            />
          </div>
        ) : null}
      </section>
    </RoomShell>
  );
}
