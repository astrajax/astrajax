"use client";

import { RoomShell } from "@/components/command-centre/RoomShell";
import type { ReactNode } from "react";

type CliveStudyShellProps = {
  children: ReactNode;
  maturityLabel: string;
  onReset: () => void;
  onOpenPaperTrail?: () => void;
};

export function CliveStudyShell({
  children,
  maturityLabel,
  onReset,
  onOpenPaperTrail,
}: CliveStudyShellProps) {
  return (
    <RoomShell
      theme="clive"
      roomLabel="Clive's study"
      roomTitle="Chapter 1"
      showExit={false}
      onReset={onReset}
      badge={
        <span className="rounded-full bg-moss/40 px-3 py-1 font-mono text-xs text-parchment/90">
          {maturityLabel}
        </span>
      }
      headerActions={
        onOpenPaperTrail ? (
          <button type="button" className="room-shell__ghost-btn" onClick={onOpenPaperTrail}>
            Paper trail
          </button>
        ) : undefined
      }
    >
      {children}
    </RoomShell>
  );
}
