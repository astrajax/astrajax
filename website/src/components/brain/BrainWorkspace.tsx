"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { InteractionReviewShell } from "@/components/brain/InteractionReviewShell";
import { BrainPaperTrailPanel } from "@/components/brain/BrainPaperTrailPanel";
import {
  BrainHealthShell,
  type BrainHealthViewTab,
} from "@/components/platform/BrainHealthShell";
import {
  BRAINS_SHELF,
  findBrainInList,
  getBrainHealthBandForSlug,
  getBrainHealthSnapshot,
  healthBandLabel,
  HEALTH_BAND_CSS_VAR,
  type BrainShelfEntry,
} from "@/lib/platform/brains";
import type { BrainHealthSnapshot } from "@/lib/platform/brain-health";

const WORKSPACE_TABS = [
  { id: "overview", label: "Overview" },
  { id: "truths-memories", label: "Truths + memories" },
  { id: "review", label: "Review" },
  { id: "context-health", label: "Context health" },
  { id: "paper-trail", label: "Paper trail" },
] as const;

export type WorkspaceTab = (typeof WORKSPACE_TABS)[number]["id"];

function parseWorkspaceTab(value: string | null): WorkspaceTab {
  if (value && WORKSPACE_TABS.some((tab) => tab.id === value)) {
    return value as WorkspaceTab;
  }
  return "overview";
}

function isHealthTab(tab: WorkspaceTab): tab is BrainHealthViewTab {
  return tab === "overview" || tab === "truths-memories" || tab === "context-health";
}

function BrainWorkspaceInner({ slug }: { slug: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeTab = parseWorkspaceTab(searchParams.get("tab"));
  const [brains, setBrains] = useState<BrainShelfEntry[]>(BRAINS_SHELF);
  const [listReady, setListReady] = useState(false);
  const [liveSnapshot, setLiveSnapshot] = useState<BrainHealthSnapshot | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const response = await fetch("/api/brains/list");
        const data = (await response.json()) as { brains?: BrainShelfEntry[] };
        if (!cancelled && response.ok && data.brains?.length) {
          setBrains(data.brains);
        }
      } catch {
        /* seed fallback */
      } finally {
        if (!cancelled) setListReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const response = await fetch(
          `/api/brains/health?brainSlug=${encodeURIComponent(slug)}`,
        );
        const data = (await response.json()) as { snapshot?: BrainHealthSnapshot };
        if (!cancelled && response.ok && data.snapshot) {
          setLiveSnapshot(data.snapshot);
        }
      } catch {
        /* fallback snapshot */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  const brain = useMemo(() => findBrainInList(slug, brains), [brains, slug]);
  const snapshot = useMemo(
    () => liveSnapshot ?? (brain ? getBrainHealthSnapshot(slug, brain) : null),
    [brain, liveSnapshot, slug],
  );
  const curateHref = `/brain/${slug}/curate`;
  const healthBand = useMemo(
    () => (brain ? getBrainHealthBandForSlug(slug, brain) : null),
    [brain, slug],
  );
  const reviewHref = `/brain/${slug}?tab=review`;

  const setTab = useCallback(
    (tab: WorkspaceTab) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("tab", tab);
      if (tab !== "review") {
        params.delete("view");
      }
      router.replace(`/brain/${slug}?${params.toString()}`);
    },
    [router, searchParams, slug],
  );

  if (!brain && !listReady) {
    return (
      <>
        <Nav />
        <main className="platform-page">
          <div className="platform-page__inner">
            <p className="text-sm text-ink-muted">Loading brain workspace…</p>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  if (!brain) {
    return (
      <>
        <Nav />
        <main className="platform-page">
          <div className="platform-page__inner">
            <h1 className="font-display text-2xl font-semibold text-ink">Brain not found</h1>
            <p className="mt-3 text-ink-muted">That slug is not on the shrine shelf yet.</p>
            <Link href="/brain" className="btn-primary mt-6 inline-flex">
              Back to shrine
            </Link>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Nav />
      <main className="platform-page">
        <div className="platform-page__inner">
          <header className="platform-page__header">
            <Link href="/brain" className="text-sm text-apricot hover:underline">
              ← Brain shrine
            </Link>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <h1 className="font-display text-3xl font-semibold text-ink sm:text-4xl">
                {brain.name}
              </h1>
              <span
                className="brain-health-band"
                style={
                  {
                    "--health-accent": HEALTH_BAND_CSS_VAR[brain.healthBand],
                  } as React.CSSProperties
                }
              >
                {healthBandLabel(brain.healthBand)}
              </span>
            </div>
            <div className="mt-4">
              <Link href={curateHref} className="btn-primary inline-flex">
                Sit with Clive
              </Link>
            </div>
          </header>

          <div className="platform-tabs mt-8" role="tablist" aria-label="Brain workspace sections">
            {WORKSPACE_TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={activeTab === tab.id}
                aria-pressed={activeTab === tab.id}
                className={`platform-tabs__btn${activeTab === tab.id ? " platform-tabs__btn--active" : ""}`}
                onClick={() => setTab(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="mt-8" role="tabpanel">
            {isHealthTab(activeTab) ? (
              <BrainHealthShell
                embedded
                activeTab={activeTab}
                snapshotOverride={snapshot!}
                healthBand={healthBand!}
                reviewHref={reviewHref}
                curateHref={curateHref}
              />
            ) : null}
            {activeTab === "review" ? (
              <InteractionReviewShell embedded brainSlug={slug} />
            ) : null}
            {activeTab === "paper-trail" ? <BrainPaperTrailPanel slug={slug} /> : null}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

export function BrainWorkspace({ slug }: { slug: string }) {
  return (
    <Suspense fallback={<p className="p-8 text-sm text-ink-muted">Loading workspace…</p>}>
      <BrainWorkspaceInner slug={slug} />
    </Suspense>
  );
}
