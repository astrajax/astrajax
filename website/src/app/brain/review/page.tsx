import { DEFAULT_BRAIN_SLUG } from "@/lib/platform/brains";
import { redirect } from "next/navigation";

type PageProps = {
  searchParams: Promise<{ view?: string }>;
};

export default async function BrainReviewRedirect({ searchParams }: PageProps) {
  const { view } = await searchParams;
  const params = new URLSearchParams({ tab: "review" });
  if (view) params.set("view", view);
  redirect(`/brain/${DEFAULT_BRAIN_SLUG}?${params.toString()}`);
}
