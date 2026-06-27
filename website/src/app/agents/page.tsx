import { AgentBasesShell } from "@/components/platform/AgentBasesShell";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Agent bases — AstraJax",
  description: "Review tiered character context across the agent fleet.",
};

export default function AgentsPage() {
  return <AgentBasesShell />;
}
