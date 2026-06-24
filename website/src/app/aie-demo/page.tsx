import { AieDemoShell } from "@/components/aie-demo/AieDemoShell";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Chapter 1 Workbench — AstraJax AIE Demo",
  description:
    "Governed brain loop: user brain, business brain, Pam challenge, human approval, Doc handoff.",
};

export default function AieDemoPage() {
  return <AieDemoShell />;
}
