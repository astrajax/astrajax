import { Suspense } from "react";
import { AieDemoShell } from "@/components/aie-demo/AieDemoShell";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Chapter 1 — Build the Brain with Clive",
  description:
    "Step into Clive's study: map the human, draft the business brain, hear Pam challenge, and decide what becomes trusted.",
};

export default function Chapter1Page() {
  return (
    <Suspense fallback={null}>
      <AieDemoShell />
    </Suspense>
  );
}
