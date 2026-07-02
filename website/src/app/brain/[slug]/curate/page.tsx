import { CurateWithCliveShell } from "@/components/brain/CurateWithCliveShell";
import { findBrainInList, BRAINS_SHELF } from "@/lib/platform/brains";
import { handleBrainList } from "@/lib/brains/handlers/brain-list";
import Link from "next/link";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";

export const dynamic = "force-dynamic";

export default async function CurateBrainPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const list = await handleBrainList();
  const brain = findBrainInList(slug, list.brains) ?? findBrainInList(slug, BRAINS_SHELF);

  if (!brain) {
    return (
      <>
        <Nav />
        <main className="platform-page">
          <div className="platform-page__inner">
            <h1 className="font-display text-2xl font-semibold text-ink">Brain not found</h1>
            <Link href="/brain" className="btn-primary mt-6 inline-flex">
              Back to shrine
            </Link>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  return <CurateWithCliveShell brainSlug={slug} brainName={brain.name} />;
}
