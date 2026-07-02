import type { Metadata } from "next";
import { WorkshopBuildDemoShell } from "@/components/workshop-demo/WorkshopBuildDemoShell";

export const metadata: Metadata = {
  title: "Agent build demo — Doc's Workshop",
  description:
    "Doc's Workshop Trinity walkthrough — Proposer, Challenger, human approval, Hyperagent export.",
};

export default function WorkshopBuildDemoPage() {
  return <WorkshopBuildDemoShell />;
}
