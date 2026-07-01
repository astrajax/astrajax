import { BrainWorkspace } from "@/components/brain/BrainWorkspace";
import { BRAINS_SHELF, getBrainBySlug } from "@/lib/platform/brains";
import type { Metadata } from "next";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  return BRAINS_SHELF.map((brain) => ({ slug: brain.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const brain = getBrainBySlug(slug);
  return {
    title: brain ? `${brain.name} — Brain workspace` : `${slug} — Brain workspace`,
    description: "Per-brain context governance workspace with health, review, and paper trail.",
  };
}

export default async function BrainWorkspacePage({ params }: PageProps) {
  const { slug } = await params;
  return <BrainWorkspace slug={slug} />;
}
