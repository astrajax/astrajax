import { InteractionReviewShell } from "@/components/brain/InteractionReviewShell";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Review agent answers — AstraJax",
  description:
    "Client-facing quality review for Clive and Pam interactions — score answers 1–5 and flag context issues.",
};

export default function BrainReviewPage() {
  return <InteractionReviewShell />;
}
