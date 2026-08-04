import { Suspense } from "react";
import { ReceivingWall } from "@/components/man/ReceivingWall";
import { Cinzel } from "next/font/google";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

const wallFont = Cinzel({
  subsets: ["latin"],
  weight: ["600", "700"],
  variable: "--font-wall",
  display: "swap",
});

export const metadata: Metadata = {
  title: "The Receiving Wall — Clive's Man — AstraJax",
  description:
    "Where the household's captured context arrives. Read the wall, open a record, and decide what each truth becomes.",
};

export default function ReceivingWallPage() {
  // Server-only env — serialize into the client tree so Accept gating can
  // honor a custom accept status (NEXT_PUBLIC_ is intentionally not used).
  const customAcceptStatus =
    process.env.BRAIN_WORKSHOP_RECEIVING_WALL_ACCEPT_STATUS?.trim() || undefined;

  return (
    <div className={wallFont.variable}>
      <Suspense fallback={null}>
        <ReceivingWall customAcceptStatus={customAcceptStatus} />
      </Suspense>
    </div>
  );
}
