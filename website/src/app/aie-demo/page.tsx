import { Suspense } from "react";
import { AieDemoShell } from "@/components/aie-demo/AieDemoShell";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Chapter 1 — Build the Brain with Clive",
  description:
    "Governed brain loop with Clive: user brain, business brain, Pam challenge, human approval, Doc filing.",
};

export default function AieDemoPage() {
  return (
    <Suspense fallback={null}>
      <AieDemoShell />
    </Suspense>
  );
}
