"use client";

import Link from "next/link";
import { useCallback, useMemo, useState } from "react";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { PlatformNav } from "@/components/platform/PlatformNav";
import {
  DEFAULT_BRAIN_HEALTH,
  EFFICIENCY_CREDIT_TABLE,
  MATURITY_LADDER,
  maturityIndex,
  maturityLabel,
  type BrainHealthSnapshot,
  type BrainMemoryRow,
  type PaperTrailLine,
} from "@/lib/platform/brain-health";

type HealthTab = "overview" | "truths-memories";

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

function PaperTrailList({ lines }: { lines: PaperTrailLine[] }) {
  if (lines.length === 0) return null;
  return (
    <div className="platform-paper-trail">
      <p className="section-label mb-3">Paper trail</p>
      <ul className="platform-paper-trail__list">
        {lines.map((line) => (
          <li key={line.id} className="platform-paper-trail__item">
            <p className="platform-paper-trail__action">{line.action}</p>
            <p className="platform-paper-trail__meta">
              {line.actor} · {formatWhen(line.timestamp)}
            </p>
            <p className="platform-paper-trail__reason">{line.reason}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}

function MaturityLadder({ currentLevel }: { currentLevel: BrainHealthSnapshot["currentLevel"] }) {
  const currentIdx = maturityIndex(currentLevel);

  return (
    <ol className="platform-maturity-ladder">
      {MATURITY_LADDER.map((step, idx) => {
        const state =
          idx < currentIdx ? "complete" : idx === currentIdx ? "current" : "upcoming";
        return (
          <li
            key={step.level}
            className={`platform-maturity-ladder__step platform-maturity-ladder__step--${state}`}
          >
            <span className="platform-maturity-ladder__marker" aria-hidden />
            <div>
              <p className="font-display font-semibold text-ink">{step.label}</p>
              <p className="mt-1 text-sm text-ink-muted">{step.description}</p>
              {state === "current" && step.requirements.length > 0 ? (
                <ul className="mt-2 list-inside list-disc text-xs text-ink-muted">
                  {step.requirements.map((req) => (
                    <li key={req}>{req}</li>
                  ))}
                </ul>
              ) : null}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

function MemoryPromoteRow({
  memory,
  onPromote,
  paperTrail,
}: {
  memory: BrainMemoryRow;
  onPromote: (memoryId: string, actor: string) => void;
  paperTrail: PaperTrailLine[];
}) {
  const [actor, setActor] = useState("");
  const [promoted, setPromoted] = useState(memory.status === "promoted");

  if (memory.status === "draft") {
    return (
      <article className="card p-4 opacity-80">
        <span className="status-pill status-pill--pending">Draft memory</span>
        <h3 className="mt-2 font-display font-semibold text-ink">{memory.title}</h3>
        <p className="mt-1 text-sm text-ink-muted">{memory.summary}</p>
        <p className="mt-2 text-xs text-ink-muted">Not yet eligible for promote; resolve workshop status first.</p>
      </article>
    );
  }

  if (promoted) {
    return (
      <article className="card p-4 border-sage/30" aria-live="polite">
        <span className="status-pill status-pill--live">Queued for truth review (Workshop)</span>
        <h3 className="mt-2 font-display font-semibold text-ink">{memory.title}</h3>
        <p className="mt-1 text-sm text-ink-muted">{memory.summary}</p>
      </article>
    );
  }

  return (
    <article className="card p-4">
      <span className="status-pill status-pill--clean">Active memory</span>
        <h3 className="mt-2 font-display font-semibold text-ink">{memory.title}</h3>
      <p className="mt-1 text-sm text-ink-muted">{memory.summary}</p>
      {memory.linkedTruthTitle ? (
        <p className="mt-2 text-xs text-ink-muted">Linked truth: {memory.linkedTruthTitle}</p>
      ) : null}
      <div className="mt-4 rounded-xl border border-apricot/20 bg-apricot/5 p-3">
        <p className="text-xs text-ink-muted">
          Human gate: promote creates a Brain Truth proposal in Workshop. Nothing becomes canonical without your approval.
        </p>
        <label className="mt-3 block text-sm" htmlFor={`memory-promote-actor-${memory.id}`}>
          <span className="section-label mb-1 block">Your name</span>
          <input
            id={`memory-promote-actor-${memory.id}`}
            name="memoryPromoteActor"
            type="text"
            value={actor}
            onChange={(e) => setActor(e.target.value)}
            autoComplete="off"
            spellCheck={false}
            className="w-full rounded-lg border border-ink/15 bg-white px-3 py-2 text-sm"
            placeholder="Who is approving this promote?…"
          />
        </label>
        <button
          type="button"
          disabled={!actor.trim()}
          onClick={() => {
            onPromote(memory.id, actor.trim());
            setPromoted(true);
          }}
          className="btn-primary mt-3 text-sm disabled:opacity-60"
        >
          Propose memory for Brain Truth review
        </button>
      </div>
      <PaperTrailList lines={paperTrail} />
    </article>
  );
}

export function BrainHealthShell() {
  const [snapshot] = useState<BrainHealthSnapshot>(DEFAULT_BRAIN_HEALTH);
  const [tab, setTab] = useState<HealthTab>("overview");
  const [memories, setMemories] = useState(snapshot.memories);
  const [paperTrails, setPaperTrails] = useState<Record<string, PaperTrailLine[]>>({});

  const nextStep = useMemo(
    () => MATURITY_LADDER.find((s) => s.level === snapshot.nextLevel),
    [snapshot.nextLevel],
  );

  const handlePromote = useCallback((memoryId: string, actor: string) => {
    const memory = memories.find((m) => m.id === memoryId);
    if (!memory) return;

    setMemories((prev) =>
      prev.map((m) => (m.id === memoryId ? { ...m, status: "promoted" as const } : m)),
    );

    const line: PaperTrailLine = {
      id: `pt-mem-promote-${Date.now()}`,
      action: "Promoted memory to Brain Truth (Workshop proposal)",
      actor,
      reason: `Human gate: "${memory.title}" queued for truth review.`,
      timestamp: new Date().toISOString(),
    };

    setPaperTrails((prev) => ({
      ...prev,
      [memoryId]: [...(prev[memoryId] ?? []), line],
    }));
  }, [memories]);

  const eligibilityItems = [
    { label: "Sustained maturity", ok: snapshot.eligibility.sustainedDays >= snapshot.eligibility.sustainedDaysRequired, detail: `${snapshot.eligibility.sustainedDays} / ${snapshot.eligibility.sustainedDaysRequired} days` },
    { label: "Known gaps below threshold", ok: snapshot.eligibility.gapsBelowThreshold },
    { label: "Contradictions low", ok: snapshot.eligibility.contradictionsLow },
    { label: "Failure rate improving", ok: snapshot.eligibility.failureRateImproving },
    { label: "Management sign-off current", ok: snapshot.eligibility.signOffCurrent },
  ];

  return (
    <>
      <Nav />
      <PlatformNav />
      <main className="platform-page">
        <div className="platform-page__inner">
          <header className="platform-page__header">
            <p className="section-label">Brain health meter</p>
            <h1 className="font-display mt-2 text-3xl font-semibold text-ink sm:text-4xl">
              {snapshot.brainName}
            </h1>
            <p className="mt-3 max-w-2xl text-lg text-ink-muted">
              Maturity earned by human review, not agent confidence. Coaching, not surveillance.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="status-pill status-pill--live">{maturityLabel(snapshot.currentLevel)}</span>
              {nextStep ? (
                <span className="status-pill status-pill--pending">Next: {nextStep.shortLabel}</span>
              ) : null}
            </div>
          </header>

          <div className="platform-tabs">
            <button
              type="button"
              aria-pressed={tab === "overview"}
              className={`platform-tabs__btn${tab === "overview" ? " platform-tabs__btn--active" : ""}`}
              onClick={() => setTab("overview")}
            >
              Overview
            </button>
            <button
              type="button"
              aria-pressed={tab === "truths-memories"}
              className={`platform-tabs__btn${tab === "truths-memories" ? " platform-tabs__btn--active" : ""}`}
              onClick={() => setTab("truths-memories")}
            >
              Truths + memories
            </button>
          </div>

          {tab === "overview" ? (
            <div className="platform-grid">
              {snapshot.recentLevelUp ? (
                <section className="card platform-level-up p-5 sm:col-span-2">
                  <p className="section-label">Level up</p>
                  <h2 className="font-display mt-2 text-xl font-semibold text-ink">
                    {maturityLabel(snapshot.recentLevelUp.fromLevel)} →{" "}
                    {maturityLabel(snapshot.recentLevelUp.toLevel)}
                  </h2>
                  <p className="mt-2 text-sm text-ink-muted">{snapshot.recentLevelUp.reason}</p>
                  <p className="mt-2 text-xs text-ink-muted">
                    Signed off by: Regional domain owner
                  </p>
                  <p className="mt-2 text-xs text-ink-muted">
                    {formatWhen(snapshot.recentLevelUp.celebratedAt)}
                  </p>
                </section>
              ) : null}

              <section className="card p-5 sm:col-span-2 lg:col-span-1">
                <p className="section-label">Maturity ladder</p>
                <div className="mt-4">
                  <MaturityLadder currentLevel={snapshot.currentLevel} />
                </div>
              </section>

              <section className="card p-5">
                <p className="section-label">Metrics</p>
                <dl className="platform-metrics mt-4">
                  <div><dt>QA passes</dt><dd>{snapshot.metrics.qaPassCount}</dd></div>
                  <div><dt>Approved records</dt><dd>{snapshot.metrics.approvedRecordCount}</dd></div>
                  <div><dt>Draft records</dt><dd>{snapshot.metrics.draftRecordCount}</dd></div>
                  <div><dt>Stale records</dt><dd>{snapshot.metrics.staleRecordCount}</dd></div>
                  <div><dt>Contradictions</dt><dd>{snapshot.metrics.contradictionCount}</dd></div>
                  <div><dt>Answer failure rate</dt><dd>{snapshot.metrics.answerFailureRate}% ({snapshot.metrics.answerFailureTrend})</dd></div>
                  <div><dt>Last reviewed</dt><dd>{formatWhen(snapshot.metrics.lastReviewed)}</dd></div>
                </dl>
                {snapshot.metrics.knownGaps.length > 0 ? (
                  <div className="mt-4">
                    <p className="section-label mb-2">Known gaps</p>
                    <ul className="list-inside list-disc text-sm text-ink-muted">
                      {snapshot.metrics.knownGaps.map((gap) => (
                        <li key={gap}>{gap}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}
                <div className="mt-4">
                  <p className="section-label mb-2">Trust after human review, by domain</p>
                  <p className="mb-2 text-xs text-ink-muted">
                    Scores reflect QA and sign-off, not agent confidence.
                  </p>
                  <ul className="space-y-2">
                    {snapshot.metrics.confidenceByDomain.map((d) => (
                      <li key={d.domain} className="flex justify-between text-sm">
                        <span className="text-ink">{d.domain}</span>
                        <span className="text-ink-muted capitalize">{d.confidence}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </section>

              <section className="card p-5">
                <p className="section-label">Brain efficiency credit</p>
                <p className="mt-2 text-lg font-display font-semibold text-ink">
                  Tier rate: {snapshot.currentCreditPercent}% (applies when eligibility is met)
                </p>
                <p className="mt-1 text-sm font-medium text-ink-muted">
                  Credit status: Pending, sustained review not complete
                </p>
                <p className="mt-2 text-sm text-ink-muted">
                  Shared economics: better context makes AI cheaper, safer, and more useful. Not a schoolroom discount.
                </p>
                <table className="platform-credit-table mt-4 w-full text-sm">
                  <thead>
                    <tr>
                      <th className="text-left section-label pb-2">Maturity</th>
                      <th className="text-right section-label pb-2">Credit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {EFFICIENCY_CREDIT_TABLE.map((row) => (
                      <tr key={row.maturity} className={row.maturity === snapshot.currentLevel ? "font-medium text-apricot" : "text-ink-muted"}>
                        <td className="py-1">{row.label}</td>
                        <td className="py-1 text-right">{row.creditPercent}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <ul className="mt-4 space-y-2">
                  {eligibilityItems.map((item) => (
                    <li key={item.label} className="flex items-start gap-2 text-sm">
                      <span aria-hidden>{item.ok ? "✓" : "○"}</span>
                      <span className={item.ok ? "text-sage" : "text-ink-muted"}>
                        {item.label}
                        {item.detail ? ` (${item.detail})` : ""}
                      </span>
                    </li>
                  ))}
                </ul>
              </section>

              <section className="card p-5 sm:col-span-2">
                <p className="section-label">Celebrate: brain and team level only</p>
                <p className="mt-1 text-xs text-ink-muted">Never ranks individuals. Rewards context hygiene.</p>
                <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                  {snapshot.leaderboard.map((entry) => (
                    <li key={entry.id} className="card-muted p-4">
                      <p className="section-label">{entry.category}</p>
                      <p className="mt-1 font-display font-semibold text-ink">{entry.brainOrTeam}</p>
                      <p className="mt-1 text-sm text-ink-muted">{entry.highlight}</p>
                    </li>
                  ))}
                </ul>
              </section>
            </div>
          ) : (
            <div className="platform-grid">
              <section className="sm:col-span-2">
                <h2 className="section-label mb-3">Brain truths</h2>
                <ul className="space-y-3">
                  {snapshot.truths.map((truth) => (
                    <li key={truth.id} className="card p-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`status-pill ${truth.status === "approved" ? "status-pill--live" : "status-pill--pending"}`}>
                          {truth.status === "approved" ? "Approved" : "Draft"}
                        </span>
                        <span className="text-xs text-ink-muted">{truth.domain}</span>
                      </div>
                      <h3 className="mt-2 font-display font-semibold text-ink">{truth.title}</h3>
                      <p className="mt-1 text-sm text-ink-muted">{truth.summary}</p>
                    </li>
                  ))}
                </ul>
              </section>

              <section className="sm:col-span-2">
                <h2 className="section-label mb-3">Brain memories: human-gated promote</h2>
                <ul className="space-y-3">
                  {memories.map((memory) => (
                    <li key={memory.id}>
                      <MemoryPromoteRow
                        memory={memory}
                        onPromote={handlePromote}
                        paperTrail={paperTrails[memory.id] ?? []}
                      />
                    </li>
                  ))}
                </ul>
              </section>
            </div>
          )}

          <p className="mt-8 text-sm text-ink-muted">
            Score agent answers in{" "}
            <Link href="/brain/review" className="text-apricot underline-offset-2 hover:underline">
              Brain review
            </Link>
            .
          </p>
          <p className="mt-4 text-xs text-ink-muted">
            Demo data. Actions update this session only, not live records.
          </p>
        </div>
      </main>
      <Footer />
    </>
  );
}
