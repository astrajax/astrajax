"use client";

import { useEffect, useState } from "react";
import { DestinationChip } from "@/components/brain/DestinationChip";
import type { PaperTrailEntry } from "@/lib/curation/types";

function formatWhen(iso: string): string {
  try {
    return new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short" }).format(
      new Date(iso),
    );
  } catch {
    return iso;
  }
}

export function BrainPaperTrailPanel({ slug }: { slug: string }) {
  const [entries, setEntries] = useState<PaperTrailEntry[]>([]);
  const [mode, setMode] = useState<string>("loading");

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const response = await fetch(
          `/api/brains/paper-trail?brainSlug=${encodeURIComponent(slug)}`,
        );
        const data = (await response.json()) as {
          entries?: PaperTrailEntry[];
          mode?: string;
        };
        if (!cancelled && response.ok) {
          setEntries(data.entries ?? []);
          setMode(data.mode ?? "unknown");
        }
      } catch {
        if (!cancelled) setMode("error");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  return (
    <div>
      <p className="section-label">Paper trail</p>
      <p className="mt-2 max-w-2xl text-sm text-ink-muted">
        Governed actions for this brain from the Registry change log ({mode}).
      </p>

      {entries.length === 0 ? (
        <p className="mt-6 rounded-2xl border border-dashed border-ink/15 bg-white p-6 text-sm text-ink-muted">
          No change-log entries yet. Seed demo truths or confirm a curation proposal to populate the
          trail.
        </p>
      ) : (
        <ul className="platform-paper-trail__list mt-6">
          {entries.map((line) => (
            <li key={line.id} className="platform-paper-trail__item card p-4">
              <p className="platform-paper-trail__action">{line.action}</p>
              <p className="platform-paper-trail__meta">
                {line.actor} · {formatWhen(line.timestamp)}
              </p>
              <p className="platform-paper-trail__reason">{line.reason}</p>
              {line.destination ? (
                <DestinationChip
                  destination={line.destination}
                  brainSlug={slug}
                  recordId={line.recordId}
                />
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
