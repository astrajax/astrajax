"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  BRAINS_SHELF,
  SHRINE_STAGE_SRC,
  type BrainShelfEntry,
} from "@/lib/platform/brains";
import {
  CONTEXT_INTAKE_QUEUE,
  createDeclinePaperTrail,
  createRoutePaperTrail,
  type ContextIntakeStatus,
  type DetectedContextItem,
} from "@/lib/platform/context-intake";
import type { PaperTrailLine } from "@/lib/platform/brain-health";

type IntakeRow = DetectedContextItem & {
  targetSlug: string;
  trail: PaperTrailLine | null;
};

const STATUS_META: Record<
  ContextIntakeStatus,
  { label: string; pillClass: string }
> = {
  pending: { label: "Pending", pillClass: "status-pill status-pill--pending" },
  approved: { label: "Approved", pillClass: "status-pill status-pill--clean" },
  routed: { label: "Routed", pillClass: "status-pill status-pill--live" },
  declined: { label: "Declined", pillClass: "status-pill status-pill--review" },
};

const FALLBACK_ACTOR = "Reviewer (this session)";

function formatWhen(iso: string): string {
  try {
    return new Intl.DateTimeFormat("en-GB", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function IntakePaperTrail({ line }: { line: PaperTrailLine }) {
  return (
    <div className="platform-paper-trail mt-4">
      <p className="section-label mb-2">Paper trail</p>
      <ul className="platform-paper-trail__list">
        <li className="platform-paper-trail__item">
          <p className="platform-paper-trail__action">{line.action}</p>
          <p className="platform-paper-trail__meta">
            {line.actor} · {formatWhen(line.timestamp)}
          </p>
          <p className="platform-paper-trail__reason">{line.reason}</p>
        </li>
      </ul>
    </div>
  );
}

type IntakeCardProps = {
  row: IntakeRow;
  routeOptions: readonly BrainShelfEntry[];
  suggestedName: string;
  onChangeTarget: (id: string, slug: string) => void;
  onRoute: (id: string) => void;
  onDecline: (id: string) => void;
  onReopen: (id: string) => void;
};

function IntakeCard({
  row,
  routeOptions,
  suggestedName,
  onChangeTarget,
  onRoute,
  onDecline,
  onReopen,
}: IntakeCardProps) {
  const selectId = `intake-route-${row.id}`;
  const meta = STATUS_META[row.status];
  const isPending = row.status === "pending";
  const targetName =
    routeOptions.find((brain) => brain.slug === row.targetSlug)?.name ?? row.targetSlug;

  return (
    <article className="context-intake__card card p-5" data-status={row.status}>
      <div className="context-intake__card-head">
        <span className={meta.pillClass}>{meta.label}</span>
        <span className="context-intake__source">{row.sourceLabel}</span>
      </div>

      <h3 className="context-intake__title font-display">{row.title}</h3>
      <p className="context-intake__snippet">{row.snippet}</p>

      <p className="context-intake__meta">
        <span className="section-label">Detected by</span> {row.detectedByAgent}
      </p>
      <p className="context-intake__note">
        <span className="section-label">Clive&apos;s Man read</span> {row.confidenceNote}
      </p>

      <div className="context-intake__controls">
        <label className="context-intake__field" htmlFor={selectId}>
          <span className="section-label">Route to brain</span>
          <select
            id={selectId}
            name={selectId}
            className="context-intake__select"
            value={row.targetSlug}
            disabled={!isPending}
            onChange={(event) => onChangeTarget(row.id, event.target.value)}
          >
            {routeOptions.map((brain) => (
              <option key={brain.slug} value={brain.slug}>
                {brain.name}
              </option>
            ))}
          </select>
          <span className="context-intake__suggest">
            Clive&apos;s Man suggests: {suggestedName}
          </span>
        </label>

        <div className="context-intake__actions">
          {isPending ? (
            <>
              <button
                type="button"
                className="btn-primary text-sm"
                onClick={() => onRoute(row.id)}
              >
                Approve &amp; route
              </button>
              <button
                type="button"
                className="btn-secondary text-sm"
                onClick={() => onDecline(row.id)}
              >
                Decline
              </button>
            </>
          ) : (
            <button
              type="button"
              className="btn-secondary text-sm"
              onClick={() => onReopen(row.id)}
            >
              Re-open for review
            </button>
          )}
        </div>
      </div>

      {row.status === "routed" ? (
        <p className="context-intake__outcome context-intake__outcome--routed">
          Routed to {targetName} · draft in that brain&apos;s review queue · this session only.
        </p>
      ) : null}
      {row.status === "declined" ? (
        <p className="context-intake__outcome context-intake__outcome--declined">
          Declined · nothing written to any brain.
        </p>
      ) : null}

      {row.trail ? (
        <div aria-live="polite">
          <IntakePaperTrail line={row.trail} />
        </div>
      ) : null}
    </article>
  );
}

export function ContextIntakeShell() {
  const [brains, setBrains] = useState<BrainShelfEntry[]>(BRAINS_SHELF);
  const [listSource, setListSource] = useState<"seed" | "live">("seed");
  const [reviewerName, setReviewerName] = useState("");
  const [rows, setRows] = useState<IntakeRow[]>(() =>
    CONTEXT_INTAKE_QUEUE.map((item) => ({
      ...item,
      targetSlug: item.suggestedBrainSlug,
      trail: null,
    })),
  );

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
        }
      } catch {
        /* seed fallback */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Route targets = live brains (or seed) unioned with the seeded shelf, so a
  // seeded item's suggested destination is always selectable even against a
  // live registry that does not include it.
  const routeOptions = useMemo<BrainShelfEntry[]>(() => {
    const seen = new Set(brains.map((brain) => brain.slug));
    const merged = [...brains];
    for (const brain of BRAINS_SHELF) {
      if (!seen.has(brain.slug)) {
        merged.push(brain);
        seen.add(brain.slug);
      }
    }
    return merged;
  }, [brains]);

  const nameForSlug = useCallback(
    (slug: string) => routeOptions.find((brain) => brain.slug === slug)?.name ?? slug,
    [routeOptions],
  );

  const counts = useMemo(
    () =>
      rows.reduce(
        (acc, row) => {
          acc[row.status] += 1;
          return acc;
        },
        { pending: 0, approved: 0, declined: 0, routed: 0 } as Record<
          ContextIntakeStatus,
          number
        >,
      ),
    [rows],
  );

  const changeTarget = useCallback((id: string, slug: string) => {
    setRows((prev) =>
      prev.map((row) => (row.id === id ? { ...row, targetSlug: slug } : row)),
    );
  }, []);

  const routeItem = useCallback(
    (id: string) => {
      setRows((prev) =>
        prev.map((row) => {
          if (row.id !== id) return row;
          const actor = reviewerName.trim() || FALLBACK_ACTOR;
          const brainName = nameForSlug(row.targetSlug);
          return {
            ...row,
            status: "routed",
            trail: createRoutePaperTrail(row.title, brainName, actor),
          };
        }),
      );
    },
    [nameForSlug, reviewerName],
  );

  const declineItem = useCallback(
    (id: string) => {
      setRows((prev) =>
        prev.map((row) => {
          if (row.id !== id) return row;
          const actor = reviewerName.trim() || FALLBACK_ACTOR;
          return {
            ...row,
            status: "declined",
            trail: createDeclinePaperTrail(row.title, actor),
          };
        }),
      );
    },
    [reviewerName],
  );

  const reopenItem = useCallback((id: string) => {
    setRows((prev) =>
      prev.map((row) =>
        row.id === id ? { ...row, status: "pending", trail: null } : row,
      ),
    );
  }, []);

  const queueClear = counts.pending === 0;

  return (
    <div className="context-intake">
      <section className="context-intake__hero" aria-labelledby="context-intake-title">
        <div className="context-intake__hero-surface">
          <Image
            src={SHRINE_STAGE_SRC}
            alt=""
            fill
            priority
            sizes="100vw"
            className="context-intake__hero-image"
          />
          <div className="context-intake__hero-scrim" aria-hidden />

          <div className="context-intake__overlay context-intake__overlay--cartouche">
            <span className="context-intake__cartouche-word">Context lane · intake</span>
          </div>
          <div className="context-intake__overlay context-intake__overlay--count plate">
            <span className="plate__label">Detected</span>
            <span className="plate__value">{rows.length} items</span>
          </div>
          <div className="context-intake__overlay context-intake__overlay--steward">
            <span className="context-intake__steward-name">Detected by Clive&apos;s Man</span>
          </div>

          <div className="context-intake__hero-content">
            <p className="context-intake__label">Before the shrine</p>
            <h1 id="context-intake-title" className="context-intake__headline font-display">
              Clive&apos;s Man — context intake
            </h1>
            <p className="context-intake__lede">
              Clive&apos;s Man has detected candidate context and proposed where it belongs. You
              approve, decline, or route each item — then continue into the brain shrine.
            </p>
            <div className="context-intake__hero-actions">
              <Link href="/brain" className="btn-primary">
                Enter the brain shrine →
              </Link>
              <Link href="/command/clive" className="context-intake__back">
                ← Back to Clive&apos;s study
              </Link>
            </div>
          </div>
        </div>
      </section>

      <div className="context-intake__body">
        <div className="context-intake__inner">
          <div className="context-intake__governance card p-5">
            <p className="section-label">How this works</p>
            <p className="context-intake__governance-text">
              Clive&apos;s Man <strong>proposes</strong>; you <strong>decide</strong>. Approve,
              decline, and route are your calls — nothing routes itself. Approving sends the item
              to a brain&apos;s review queue as a <strong>draft</strong>. Naming or routing an item
              does <strong>not</strong> create a Trusted base or write canonical truth.
            </p>
            <label className="context-intake__reviewer" htmlFor="context-intake-reviewer">
              <span className="section-label">Your name (for the paper trail)</span>
              <input
                id="context-intake-reviewer"
                name="reviewerName"
                type="text"
                value={reviewerName}
                onChange={(event) => setReviewerName(event.target.value)}
                autoComplete="off"
                spellCheck={false}
                placeholder="Optional — defaults to “Reviewer (this session)”"
                className="context-intake__input"
              />
            </label>
          </div>

          <div className="context-intake__summary" role="status" aria-live="polite">
            <span className="context-intake__stat">
              <span className="context-intake__stat-num">{counts.pending}</span> pending
            </span>
            <span className="context-intake__stat">
              <span className="context-intake__stat-num">{counts.routed}</span> routed
            </span>
            <span className="context-intake__stat">
              <span className="context-intake__stat-num">{counts.declined}</span> declined
            </span>
            {listSource === "seed" ? (
              <span className="context-intake__stat context-intake__stat--muted">
                Route targets seeded until the registry list is wired.
              </span>
            ) : null}
          </div>

          <ul className="context-intake__queue">
            {rows.map((row) => (
              <li key={row.id}>
                <IntakeCard
                  row={row}
                  routeOptions={routeOptions}
                  suggestedName={nameForSlug(row.suggestedBrainSlug)}
                  onChangeTarget={changeTarget}
                  onRoute={routeItem}
                  onDecline={declineItem}
                  onReopen={reopenItem}
                />
              </li>
            ))}
          </ul>

          <div className="context-intake__footer card p-5">
            <div>
              <p className="context-intake__footer-title font-display">
                {queueClear ? "Queue clear — the shrine awaits" : "Ready when you are"}
              </p>
              <p className="context-intake__footer-text">
                {queueClear
                  ? "Every detected item has a decision. Step through to the brains."
                  : "You can enter the shrine at any time and return to finish the queue."}
              </p>
            </div>
            <Link href="/brain" className="btn-primary">
              Enter the brain shrine →
            </Link>
          </div>

          <p className="context-intake__caveat">
            Demo data. Actions update this session only, not live records.
          </p>
        </div>
      </div>
    </div>
  );
}
