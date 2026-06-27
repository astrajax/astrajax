import { AgentDetailShell } from "@/components/platform/AgentDetailShell";
import { getAgentDetail, isAgentSlug } from "@/lib/platform/agent-bases";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const agent = getAgentDetail(slug);
  if (!agent) return { title: "Agent not found — AstraJax" };
  return {
    title: `${agent.name} — Agent base — AstraJax`,
    description: agent.oneLiner,
  };
}

export default async function AgentDetailPage({ params }: Props) {
  const { slug } = await params;
  if (!isAgentSlug(slug)) notFound();
  const agent = getAgentDetail(slug);
  if (!agent) notFound();
  return <AgentDetailShell agent={agent} />;
}
