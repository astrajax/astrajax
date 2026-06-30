"use client";

import { RoomShell } from "@/components/command-centre/RoomShell";
import { RoomStationGrid } from "@/components/command-centre/RoomStationGrid";
import { COMMAND_ROOMS } from "@/lib/command-centre/rooms";

export function DocWorkshopRoom() {
  const room = COMMAND_ROOMS.doc;

  return (
    <RoomShell theme="doc" roomLabel={room.roomLabel} roomTitle={room.roomTitle}>
      <p className="mb-8 max-w-2xl text-lg text-parchment/85">{room.tagline}</p>
      <RoomStationGrid stations={room.stations} />
    </RoomShell>
  );
}
