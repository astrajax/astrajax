"use client";

import Link from "next/link";
import { useMemo } from "react";
import { RoomShell } from "@/components/command-centre/RoomShell";
import { RoomStationGrid } from "@/components/command-centre/RoomStationGrid";
import { COMMAND_ROOMS } from "@/lib/command-centre/rooms";
import {
  countActiveMemories,
  DEFAULT_BRAIN_HEALTH,
  getImportanceDistribution,
  getRetireCandidates,
} from "@/lib/platform/brain-health";

export function PamDeskRoom() {
  const room = COMMAND_ROOMS.pam;

  const bloatSummary = useMemo(() => {
    const memories = DEFAULT_BRAIN_HEALTH.memories;
    const mix = getImportanceDistribution(memories);
    const retireCount = getRetireCandidates(memories).length;
    const activeCount = countActiveMemories(memories);
    const lowImportance = mix[1] + mix[2];
    return { mix, retireCount, activeCount, lowImportance };
  }, []);

  return (
    <RoomShell theme="pam" roomLabel={room.roomLabel} roomTitle={room.roomTitle}>
      <p className="mb-6 max-w-2xl text-lg text-parchment/85">{room.tagline}</p>

      <aside
        className="mb-8 max-w-2xl rounded-xl border border-parchment/15 bg-parchment/5 p-4"
        aria-label="Context bloat summary"
      >
        <p className="section-label text-parchment/70">Context Health — quick sniff test</p>
        <p className="mt-2 text-sm text-parchment/90">
          Right. {bloatSummary.activeCount} active memories in the demo brain —{" "}
          {bloatSummary.lowImportance} scored low importance, {bloatSummary.retireCount} already
          eligible for retire. Better now than never, I suppose.
        </p>
        <p className="mt-2 text-xs text-parchment/70">
          Demo data only. Clive&apos;s Man proposes repairs behind this desk — you approve before
          Trusted truth changes.
        </p>
        <p className="mt-2 text-xs text-parchment/60">
          Counts from demo seed — retire actions on Brain Health update there first until Phase 2
          live sync.
        </p>
        <Link
          href="/brain/northline-field-ops?tab=context-health"
          className="mt-3 inline-block text-sm text-apricot underline-offset-2 hover:underline"
        >
          Open Context Health tab →
        </Link>
      </aside>

      <RoomStationGrid stations={room.stations} stewardNote={room.stewardNote} />
    </RoomShell>
  );
}
