import { ContextIntakeShell } from "@/components/brain/ContextIntakeShell";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Context intake — Clive's Man — AstraJax",
  description:
    "Clive's Man detects candidate context and proposes where it belongs. Approve, decline, or route each item, then enter the brain shrine. Human-gated; session-only demo.",
};

export default function ContextIntakePage() {
  return <ContextIntakeShell />;
}
