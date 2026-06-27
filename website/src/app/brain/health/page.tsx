import { BrainHealthShell } from "@/components/platform/BrainHealthShell";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Brain health — AstraJax",
  description:
    "Brain maturity ladder, efficiency credit, celebrate-not-surveil leaderboard, and truths + memories review.",
};

export default function BrainHealthPage() {
  return <BrainHealthShell />;
}
