"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  BRAINS_SHELF,
  DEFAULT_BRAIN_SLUG,
  findBrainInList,
  formatShrineAuditDate,
  healthBandLabel,
  type BrainShelfEntry,
} from "@/lib/platform/brains";
import { BrainJar } from "./BrainJar";
import { BrainNameplate } from "./BrainNameplate";

type BrainShrineProps = {
  initialSlug?: string;
};

export function BrainShrine({ initialSlug = DEFAULT_BRAIN_SLUG }: BrainShrineProps) {
  const router = useRouter();
  const [brains, setBrains] = useState<BrainShelfEntry[]>(BRAINS_SHELF);
  const [activeSlug, setActiveSlug] = useState(initialSlug);
  const [createMode, setCreateMode] = useState(false);
  const [newBrainName, setNewBrainName] = useState("");
  const [listSource, setListSource] = useState<"seed" | "live">("seed");

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const response = await fetch("/api/brains/list");
        const data = (await response.json()) as {
          brains?: BrainShelfEntry[];
          source?: "seed" | "live";
        };
        if (!cancelled && response.ok && data.brains?.length) {
          setBrains(data.brains);
          setListSource(data.source ?? "live");
          setActiveSlug((current) =>
            data.brains!.some((brain) => brain.slug === current)
              ? current
              : data.brains![0]!.slug,
          );
        }
      } catch {
        /* seed fallback */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const activeBrain = useMemo(
    () => findBrainInList(activeSlug, brains) ?? brains[0] ?? BRAINS_SHELF[0]!,
    [activeSlug, brains],
  );

  const cycle = useCallback(
    (direction: -1 | 1) => {
      setCreateMode(false);
      setNewBrainName("");
      setActiveSlug((slug) => {
        const idx = brains.findIndex((brain) => brain.slug === slug);
        const baseIdx = idx >= 0 ? idx : 0;
        const next = (baseIdx + direction + brains.length) % brains.length;
        return brains[next]!.slug;
      });
    },
    [brains],
  );

  const enterWorkspace = useCallback(() => {
    if (createMode) return;
    router.push(`/brain/${activeBrain.slug}?tab=overview`);
  }, [activeBrain.slug, createMode, router]);

  const confirmCreate = useCallback(() => {
    const trimmed = newBrainName.trim();
    if (!trimmed) return;
    router.push(
      `/chapter-1?book=brain-building&newBrain=${encodeURIComponent(trimmed)}`,
    );
  }, [newBrainName, router]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        if (event.key === "Escape") {
          setCreateMode(false);
          setNewBrainName("");
        }
        return;
      }

      if (event.key === "ArrowLeft") {
        event.preventDefault();
        cycle(-1);
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        cycle(1);
      } else if (event.key === "Enter" && !createMode) {
        event.preventDefault();
        enterWorkspace();
      } else if (event.key === "Escape") {
        router.push("/command/clive");
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [cycle, createMode, enterWorkspace, router]);

  return (
    <div className="brain-shrine">
      <header className="brain-shrine__header">
        <p className="brain-shrine__label">Context governance</p>
        <p className="brain-shrine__subtitle">
          One brain on stage — health is a mood read, not permission to act alone.
          {listSource === "seed" ? " Shelf data is seeded until the registry list is wired." : null}
        </p>
      </header>

      <div className="brain-shrine__stage">
        <div className="brain-shrine__surface">
          <BrainJar
            healthBand={activeBrain.healthBand}
            alt={`${activeBrain.name} — health ${healthBandLabel(activeBrain.healthBand)}`}
          />

          <button
            type="button"
            className="brain-shrine__arrow brain-shrine__arrow--prev"
            aria-label="Previous brain"
            onClick={() => cycle(-1)}
          >
            ‹
          </button>
          <button
            type="button"
            className="brain-shrine__arrow brain-shrine__arrow--next"
            aria-label="Next brain"
            onClick={() => cycle(1)}
          >
            ›
          </button>

          <div
            className="brain-shrine__overlay brain-shrine__overlay--audit shrine-slot"
            aria-label={`Last audit: ${formatShrineAuditDate(activeBrain.lastAuditAt)}`}
          >
            <span className="shrine-slot__value">{formatShrineAuditDate(activeBrain.lastAuditAt)}</span>
          </div>

          <div
            className="brain-shrine__overlay brain-shrine__overlay--flags shrine-slot"
            aria-label={`${activeBrain.flagsCount} open flags`}
          >
            <span className="shrine-slot__value">{activeBrain.flagsCount}</span>
          </div>

          <div className="brain-shrine__overlay brain-shrine__overlay--nameplate">
            <BrainNameplate
              mode={createMode ? "create" : "view"}
              name={createMode ? newBrainName : activeBrain.name}
              onNameChange={setNewBrainName}
              onConfirmCreate={confirmCreate}
            />
          </div>
        </div>
      </div>

      <footer className="brain-shrine__footer">
        <div className="brain-shrine__actions">
          {createMode ? (
            <>
              <button
                type="button"
                className="brain-shrine__action brain-shrine__action--primary"
                disabled={!newBrainName.trim()}
                onClick={confirmCreate}
              >
                Start build in Chapter 1
              </button>
              <button
                type="button"
                className="brain-shrine__action brain-shrine__action--ghost"
                onClick={() => {
                  setCreateMode(false);
                  setNewBrainName("");
                }}
              >
                Cancel
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                className="brain-shrine__action brain-shrine__action--primary"
                onClick={enterWorkspace}
              >
                Enter
              </button>
              <button
                type="button"
                className="brain-shrine__action brain-shrine__action--ghost"
                onClick={() => {
                  setCreateMode(true);
                  setNewBrainName("");
                }}
              >
                + New brain
              </button>
            </>
          )}
        </div>
        <p className="brain-shrine__hint">
          Arrow keys cycle brains · Enter opens workspace · Esc returns to Clive&apos;s study
        </p>
        <Link href="/command/clive" className="brain-shrine__back">
          ← Back to study
        </Link>
      </footer>
    </div>
  );
}
