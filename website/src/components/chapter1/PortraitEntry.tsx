"use client";

import { PortraitDoor } from "@/components/command-centre/PortraitDoor";
import { BOOTH_SUBHEAD } from "@/lib/aie-demo/demo-data";

type PortraitEntryProps = {
  onEnter: () => void;
};

export function PortraitEntry({ onEnter }: PortraitEntryProps) {
  return (
    <PortraitDoor
      mode="inline"
      character="clive"
      eyebrow="Chapter 1"
      title="Step into Clive's study"
      description={BOOTH_SUBHEAD}
      cta="Enter the study"
      onEnter={onEnter}
    />
  );
}
