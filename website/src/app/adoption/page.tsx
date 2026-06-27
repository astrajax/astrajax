import { AdoptionShell } from "@/components/platform/AdoptionShell";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Adoption — AstraJax",
  description:
    "KK Kingsford scorekeeper — training, confidence, team celebrations, enablement not surveillance.",
};

export default function AdoptionPage() {
  return <AdoptionShell />;
}
