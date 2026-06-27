import { CourtShell } from "@/components/platform/CourtShell";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Court mode — AstraJax",
  description:
    "High-stakes multi-perspective panel — the Court surfaces perspectives; the human gives judgement.",
};

export default function CourtPage() {
  return <CourtShell />;
}
