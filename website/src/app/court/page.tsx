import { CourtShell } from "@/components/platform/CourtShell";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Court mode — AstraJax",
  description:
    "The Court convenes for consequential calls — the cast speak in character, the human gives judgement.",
};

export default function CourtPage() {
  return <CourtShell />;
}
