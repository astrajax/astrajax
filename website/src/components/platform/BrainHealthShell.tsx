"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState, type CSSProperties } from "react";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { PlatformNav } from "@/components/platform/PlatformNav";
import { DestinationChip } from "@/components/brain/DestinationChip";
import Image from "next/image";
import {
  healthBandLabel,
  HEALTH_BAND_CSS_VAR,
  stillArtForBand,
  type BrainHealthBand,
} from "@/lib/platform/brains";
import {
  DEFAULT_BRAIN_HEALTH,
  EFFICIENCY_CREDIT_TABLE,
  getImportanceDistribution,
  getRetireCandidates,
  LIFECYCLE_LABELS,
  MATURITY_LADDER,
  maturityIndex,
  maturityLabel,
  MEMORY_STATUS_DISPLAY,
  RISK_TOLERANCE_OPTIONS,
  type BrainHealthSnapshot,
  type BrainMemoryLifecycle,
  type BrainMemoryRow,
  type MemoryImportance,
  type PaperTrailLine,
  type RiskTolerance,
} from "@/lib/platform/brain-health";

export type BrainHealthViewTab = "overview" | "truths-memories" | "context-health";

type HealthTab = BrainHealthViewTab;

function HealthBandBanner({ band }: { band: BrainHealthBand }) {
  return (
    <figure className="brain-state-portrait sm:col-span-2" role="status">
      <div className="brain-state-portrait__frame">
        <Image
          src={stillArtForBand(band)}
          alt={`Painted portrait of a ${healthBandLabel(band).toLowerCase()} brain in its jar`}
          width={1024}
          height={571}
          priority
          sizes="(min-width: 640px) 42rem, 100vw"
          className="brain-state-portrait__image"
        />
      </div>
      <figcaption
        className="brain-state-portrait__caption"
        style={{ "--health-accent": HEALTH_BAND_CSS_VAR[band] } as CSSProperties}
      >
        <span className="brain-state-portrait__band">{healthBandLabel(band)}</span>
        <span className="brain-state-portrait__note">
          Coaching read, not permission to act unsupervised
        </span>
      </figcaption>
    </figure>
  );
}

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

function MemoryMetaPills({
  importance,
  lifecycle,
  status,
}: {
  importance: MemoryImportance;
  lifecycle: BrainMemoryLifecycle;
  status: BrainMemoryRow["status"];
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="status-pill status-pill--pending" title="Importance score (1–5)">
        Importance {importance}/5
      </span>
      <span
        className={`status-pill ${
          lifecycle === "retired"
            ? "status-pill--pending"
            : lifecycle === "trusted"
              ? "status-pill--live"
              : "status-pill--clean"
        }`}
      >
        {LIFECYCLE_LABELS[lifecycle]}
      </span>
      {status !== "draft" ? (
        <span className="text-xs text-ink-muted">{MEMORY_STATUS_DISPLAY[status]}</span>
      ) : null}
    </div>
  );
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

  if (memory.lifecycle === "retired") {
    return (
      <article className="card p-4 opacity-80" aria-live="polite">
        <MemoryMetaPills
          importance={memory.importance}
          lifecycle="retired"
          status={memory.status}
        />
        <h3 className="mt-2 font-display font-semibold text-ink">{memory.title}</h3>
        <p className="mt-1 text-sm text-ink-muted">{memory.summary}</p>
        <p className="mt-2 text-xs text-ink-muted">
          Retired from retrieval — not eligible for promote. Paper trail preserved.
        </p>
        <PaperTrailList lines={paperTrail} />
      </article>
    );
  }

  if (memory.status === "draft") {
    return (
      <article className="card p-4 opacity-80">
        <MemoryMetaPills
          importance={memory.importance}
          lifecycle={memory.lifecycle}
          status={memory.status}
        />
        <h3 className="mt-2 font-display font-semibold text-ink">{memory.title}</h3>
        <p className="mt-1 text-sm text-ink-muted">{memory.summary}</p>
        <p className="mt-2 text-xs text-ink-muted">Not yet eligible for promote; resolve workshop status first.</p>
      </article>
    );
  }

  if (promoted) {
    return (
      <article className="card p-4 border-sage/30" aria-live="polite">
        <MemoryMetaPills
          importance={memory.importance}
          lifecycle={memory.lifecycle}
          status={memory.status}
        />
        <span className="mt-2 inline-block status-pill status-pill--live">Queued for truth review (Workshop)</span>
        <h3 className="mt-2 font-display font-semibold text-ink">{memory.title}</h3>
        <p className="mt-1 text-sm text-ink-muted">{memory.summary}</p>
      </article>
    );
  }

  return (
    <article className="card p-4">
      <MemoryMetaPills
        importance={memory.importance}
        lifecycle={memory.lifecycle}
        status={memory.status}
      />
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

function MemoryRetireRow({
  memory,
  onRetire,
  paperTrail,
}: {
  memory: BrainMemoryRow;
  onRetire: (memoryId: string, actor: string) => void;
  paperTrail: PaperTrailLine[];
}) {
  const [actor, setActor] = useState("");
  const [retired, setRetired] = useState(memory.lifecycle === "retired");

  if (retired) {
    return (
      <article className="card p-4 opacity-80" aria-live="polite">
        <MemoryMetaPills
          importance={memory.importance}
          lifecycle="retired"
          status={memory.status}
        />
        <h3 className="mt-2 font-display font-semibold text-ink">{memory.title}</h3>
        <p className="mt-1 text-sm text-ink-muted">{memory.summary}</p>
        <p className="mt-2 text-xs text-ink-muted">
          Retired from retrieval — paper trail preserved. Demo session only.
        </p>
        <PaperTrailList lines={paperTrail} />
      </article>
    );
  }

  return (
    <article className="card p-4">
      <MemoryMetaPills
        importance={memory.importance}
        lifecycle={memory.lifecycle}
        status={memory.status}
      />
      <h3 className="mt-2 font-display font-semibold text-ink">{memory.title}</h3>
      <p className="mt-1 text-sm text-ink-muted">{memory.summary}</p>
      {memory.lastReferencedAt ? (
        <p className="mt-2 text-xs text-ink-muted">
          Last referenced: {formatWhen(memory.lastReferencedAt)}
        </p>
      ) : null}
      <div className="mt-4 rounded-xl border border-apricot/20 bg-apricot/5 p-3">
        <p className="text-xs text-ink-muted">
          Human gate: propose retire removes this memory from retrieval. Nothing is deleted — audit trail stays. Trusted Truth is untouched.
        </p>
        <label className="mt-3 block text-sm" htmlFor={`memory-retire-actor-${memory.id}`}>
          <span className="section-label mb-1 block">Your name</span>
          <input
            id={`memory-retire-actor-${memory.id}`}
            name="memoryRetireActor"
            type="text"
            value={actor}
            onChange={(e) => setActor(e.target.value)}
            autoComplete="off"
            spellCheck={false}
            className="w-full rounded-lg border border-ink/15 bg-white px-3 py-2 text-sm"
            placeholder="Who is approving this retire?…"
          />
        </label>
        <button
          type="button"
          disabled={!actor.trim()}
          onClick={() => {
            onRetire(memory.id, actor.trim());
            setRetired(true);
          }}
          className="btn-primary mt-3 text-sm disabled:opacity-60"
        >
          Propose retire from retrieval
        </button>
      </div>
      <PaperTrailList lines={paperTrail} />
    </article>
  );
}

function ContextHealthPanel({
  memories,
  riskTolerance,
  onRiskToleranceChange,
  onRetire,
  paperTrails,
}: {
  memories: BrainMemoryRow[];
  riskTolerance: RiskTolerance;
  onRiskToleranceChange: (value: RiskTolerance) => void;
  onRetire: (memoryId: string, actor: string) => void;
  paperTrails: Record<string, PaperTrailLine[]>;
}) {
  const importanceMix = useMemo(() => getImportanceDistribution(memories), [memories]);
  const retireCandidates = useMemo(() => getRetireCandidates(memories), [memories]);
  const lowImportanceCount = importanceMix[1] + importanceMix[2];

  return (
    <div className="platform-grid" id="context-health">
      <section className="card p-5 sm:col-span-2">
        <p className="section-label">Context Health</p>
        <h2 className="font-display mt-2 text-xl font-semibold text-ink">
          Spot bloat before it poisons answers
        </h2>
        <p className="mt-2 max-w-2xl text-sm text-ink-muted">
          Pam fronts this routine — importance scoring, lifecycle discipline, and a retire queue. Agents may propose;{" "}
          <strong className="font-medium text-ink">The Architect</strong> decides what becomes Trusted Truth.
        </p>
        <p className="mt-2 text-xs text-ink-muted">
          Demo data. Risk tolerance and retire actions update this session only.
        </p>
      </section>

      <section className="card p-5">
        <p className="section-label">Importance mix</p>
        <p className="mt-1 text-xs text-ink-muted">Active memories by score (retired excluded)</p>
        <ul className="mt-4 space-y-2">
          {([5, 4, 3, 2, 1] as MemoryImportance[]).map((score) => (
            <li key={score} className="flex items-center justify-between text-sm">
              <span className="text-ink">
                {score}/5
                {score === 1 ? " — auto-retire candidate if unused" : ""}
              </span>
              <span className="font-medium text-ink">{importanceMix[score]}</span>
            </li>
          ))}
        </ul>
        {lowImportanceCount >= 3 ? (
          <p className="mt-4 rounded-lg border border-apricot/20 bg-apricot/5 p-3 text-xs text-ink-muted">
            {lowImportanceCount} low-importance memories still in retrieval. Worth a tighten pass before the next demo.
          </p>
        ) : null}
      </section>

      <section className="card p-5">
        <p className="section-label">Risk tolerance</p>
        <p className="mt-1 text-xs text-ink-muted">Per-brain curator latitude (session-only in demo)</p>
        <fieldset className="mt-4 space-y-3">
          <legend className="sr-only">Risk tolerance mode</legend>
          {RISK_TOLERANCE_OPTIONS.map((option) => (
            <label
              key={option.value}
              className={`flex cursor-pointer gap-3 rounded-xl border p-3 text-sm transition-colors ${
                riskTolerance === option.value
                  ? "border-apricot/40 bg-apricot/5"
                  : "border-ink/10 hover:border-ink/20"
              }`}
            >
              <input
                type="radio"
                name="riskTolerance"
                value={option.value}
                checked={riskTolerance === option.value}
                onChange={() => onRiskToleranceChange(option.value)}
                className="mt-1"
              />
              <span>
                <span className="font-display font-semibold text-ink">{option.label}</span>
                <span className="mt-1 block text-ink-muted">{option.description}</span>
              </span>
            </label>
          ))}
        </fieldset>
        <p className="mt-4 text-xs text-ink-muted">
          Session-only in this demo — your choice is remembered until you reload. It does not change
          retire rules or auto-curation until Phase 3 curator automation.
        </p>
      </section>

      <section className="sm:col-span-2">
        <h2 className="section-label mb-1">Retire queue</h2>
        <p className="mb-3 text-xs text-ink-muted">
          Importance-1 Working Memory unused 14+ days — propose retire, not delete. Paper trail preserved.
        </p>
        {retireCandidates.length === 0 ? (
          <p className="card p-4 text-sm text-ink-muted">No retire candidates right now. Context looks tight enough.</p>
        ) : (
          <ul className="space-y-3">
            {retireCandidates.map((memory) => (
              <li key={memory.id}>
                <MemoryRetireRow
                  memory={memory}
                  onRetire={onRetire}
                  paperTrail={paperTrails[memory.id] ?? []}
                />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

export type BrainHealthShellProps = {
  embedded?: boolean;
  activeTab?: BrainHealthViewTab;
  snapshotOverride?: BrainHealthSnapshot;
  healthBand?: BrainHealthBand;
  reviewHref?: string;
  curateHref?: string;
};

export function BrainHealthShell({
  embedded = false,
  activeTab,
  snapshotOverride,
  healthBand,
  reviewHref = "/brain/review",
  curateHref = "/brain/astrajax-chapter-1/curate",
}: BrainHealthShellProps = {}) {
  const [snapshot] = useState<BrainHealthSnapshot>(snapshotOverride ?? DEFAULT_BRAIN_HEALTH);
  const [tab, setTab] = useState<HealthTab>(activeTab ?? "overview");
  const [memories, setMemories] = useState(snapshot.memories);
  const [riskTolerance, setRiskTolerance] = useState<RiskTolerance>(snapshot.riskTolerance);
  const [paperTrails, setPaperTrails] = useState<Record<string, PaperTrailLine[]>>({});

  useEffect(() => {
    if (embedded && activeTab) {
      setTab(activeTab);
    }
  }, [embedded, activeTab]);

  useEffect(() => {
    if (embedded) return;

    function syncTabFromHash() {
      if (typeof window === "undefined") return;
      if (window.location.hash === "#context-health") {
        setTab("context-health");
      }
    }

    syncTabFromHash();
    window.addEventListener("hashchange", syncTabFromHash);
    return () => window.removeEventListener("hashchange", syncTabFromHash);
  }, [embedded]);

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

  const handleRetire = useCallback((memoryId: string, actor: string) => {
    const memory = memories.find((m) => m.id === memoryId);
    if (!memory) return;

    setMemories((prev) =>
      prev.map((m) => (m.id === memoryId ? { ...m, lifecycle: "retired" as const } : m)),
    );

    const line: PaperTrailLine = {
      id: `pt-mem-retire-${Date.now()}`,
      action: "Proposed retire from retrieval",
      actor,
      reason: `Human gate: "${memory.title}" moved to Retired — audit trail preserved, not deleted.`,
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

  const resolvedTab = embedded && activeTab ? activeTab : tab;

  const tabPanels = (
    <>
          {resolvedTab === "overview" ? (
            <div className="platform-grid">
              {healthBand ? <HealthBandBanner band={healthBand} /> : null}
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
          ) : resolvedTab === "truths-memories" ? (
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
                      <DestinationChip
                        destination={
                          truth.status === "approved"
                            ? "trusted-brain-truth"
                            : "workshop-draft-truth"
                        }
                        brainSlug={snapshot.brainSlug}
                        recordId={truth.id}
                      />
                    </li>
                  ))}
                </ul>
              </section>

              <section className="sm:col-span-2">
                <h2 className="section-label mb-3">Brain memories</h2>
                <p className="card p-4 text-sm text-ink-muted">
                  Memory promote and retire moved to{" "}
                  <Link href={curateHref} className="text-apricot underline">
                    Sit with Clive
                  </Link>
                  . Counts above reflect live Workshop and Trusted records when wired.
                </p>
              </section>
            </div>
          ) : (
            <div className="card p-5">
              <p className="section-label">Context health</p>
              <p className="mt-3 text-sm text-ink-muted">
                Risk tolerance and retire queues are curated in{" "}
                <Link href={curateHref} className="text-apricot underline">
                  Sit with Clive
                </Link>
                . Review flagged interactions in the Review tab.
              </p>
            </div>
          )}

          {!embedded ? (
            <>
              <p className="mt-8 text-sm text-ink-muted">
                Score agent answers in{" "}
                <Link href={reviewHref} className="text-apricot underline-offset-2 hover:underline">
                  Brain review
                </Link>
                .
              </p>
              <p className="mt-4 text-xs text-ink-muted">
                Live counts when Airtable is wired.
              </p>
            </>
          ) : (
            <p className="mt-6 text-xs text-ink-muted">
              Live counts when Airtable is wired. Curate context in Sit with Clive.
            </p>
          )}
    </>
  );

  if (embedded) {
    return tabPanels;
  }

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

          <div className="platform-tabs mt-8" role="tablist" aria-label="Brain health sections">
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
            <button
              type="button"
              aria-pressed={tab === "context-health"}
              className={`platform-tabs__btn${tab === "context-health" ? " platform-tabs__btn--active" : ""}`}
              onClick={() => {
                setTab("context-health");
                if (typeof window !== "undefined") {
                  window.history.replaceState(null, "", "#context-health");
                }
              }}
            >
              Context Health
            </button>
          </div>

          {tabPanels}
        </div>
      </main>
      <Footer />
    </>
  );
}
