"use client";

import { useCallback, useState } from "react";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { PlatformNav } from "@/components/platform/PlatformNav";
import { PaperTrailList } from "@/components/platform/PaperTrailList";
import type { PaperTrailLine } from "@/lib/platform/brain-health";
import {
  DEFAULT_DISPATCH,
  JOB_STATUS_LABELS,
  createPublishPaperTrail,
  jobStatusPillClass,
  routingExecutorPillClass,
  type ImplementationJob,
  type JobStatus,
} from "@/lib/platform/dispatch";

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

function JobCard({
  job,
  onPublish,
  paperTrail,
}: {
  job: ImplementationJob;
  onPublish: (jobId: string, actor: string) => void;
  paperTrail: PaperTrailLine[];
}) {
  const [actor, setActor] = useState("");
  const [confirmPublish, setConfirmPublish] = useState(false);
  const canPublish = job.status === "draft-ready";

  return (
    <article className="card p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <h3 className="font-display font-semibold text-ink">{job.title}</h3>
        <span className={`status-pill ${jobStatusPillClass(job.status)}`}>
          {JOB_STATUS_LABELS[job.status]}
        </span>
      </div>
      <p className="mt-2 text-sm text-ink-muted">{job.briefReference}</p>
      <dl className="platform-dispatch-job-meta mt-3 text-sm">
        <div>
          <dt className="section-label">Executor</dt>
          <dd className="text-ink-muted">{job.executorLabel}</dd>
        </div>
        <div>
          <dt className="section-label">Diff / summary</dt>
          <dd className="text-ink-muted">{job.diffSummary}</dd>
        </div>
        {job.promptSummary ? (
          <div>
            <dt className="section-label">Prompt summary</dt>
            <dd className="text-ink-muted">{job.promptSummary}</dd>
          </div>
        ) : null}
        {job.startedAt ? (
          <div>
            <dt className="section-label">Started</dt>
            <dd className="text-ink-muted">{formatWhen(job.startedAt)}</dd>
          </div>
        ) : null}
        {job.completedAt ? (
          <div>
            <dt className="section-label">Completed</dt>
            <dd className="text-ink-muted">{formatWhen(job.completedAt)}</dd>
          </div>
        ) : null}
      </dl>

      {canPublish ? (
        <div className="mt-4 rounded-xl border border-apricot/20 bg-apricot/5 p-3">
          <p className="text-xs text-ink-muted">
            Human gate: publish moves implementation output from Draft to canonical.
          </p>
          {!confirmPublish ? (
            <button
              type="button"
              onClick={() => setConfirmPublish(true)}
              className="btn-primary mt-3 text-sm"
            >
              Publish to canonical
            </button>
          ) : (
            <>
              <label className="mt-3 block text-sm" htmlFor={`publish-actor-${job.id}`}>
                <span className="section-label mb-1 block">Your name</span>
                <input
                  id={`publish-actor-${job.id}`}
                  name="publishActor"
                  type="text"
                  value={actor}
                  onChange={(e) => setActor(e.target.value)}
                  autoComplete="off"
                  spellCheck={false}
                  className="platform-gate-input w-full rounded-lg border border-ink/15 bg-white px-3 py-2 text-sm"
                  placeholder="Who is publishing this draft?…"
                />
              </label>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={!actor.trim()}
                  onClick={() => {
                    onPublish(job.id, actor.trim());
                    setConfirmPublish(false);
                  }}
                  className="btn-primary text-sm disabled:opacity-60"
                >
                  Confirm publish
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmPublish(false)}
                  className="btn-secondary text-sm"
                >
                  Cancel
                </button>
              </div>
            </>
          )}
        </div>
      ) : null}

      {job.status === "published" ? (
        <p className="mt-3 text-sm text-sage" aria-live="polite">
          Published to canonical with full change log.
        </p>
      ) : null}

      <PaperTrailList lines={paperTrail} />
    </article>
  );
}

export function DispatchShell() {
  const [snapshot] = useState(DEFAULT_DISPATCH);
  const [jobs, setJobs] = useState(snapshot.jobs);
  const [paperTrails, setPaperTrails] = useState<Record<string, PaperTrailLine[]>>({});

  const handlePublish = useCallback(
    (jobId: string, actor: string) => {
      const job = jobs.find((j) => j.id === jobId);
      if (!job) return;

      setJobs((prev) =>
        prev.map((j) => (j.id === jobId ? { ...j, status: "published" as JobStatus } : j)),
      );

      const line = createPublishPaperTrail(job.title, actor, job.promptSummary);
      setPaperTrails((prev) => ({
        ...prev,
        [jobId]: [...(prev[jobId] ?? []), line],
      }));
    },
    [jobs],
  );

  return (
    <>
      <Nav />
      <PlatformNav />
      <main className="platform-page">
        <div className="platform-page__inner">
          <header className="platform-page__header">
            <p className="section-label">Doc dispatch</p>
            <h1 className="font-display mt-2 text-3xl font-semibold text-ink sm:text-4xl">
              Implementation jobs board
            </h1>
            <p className="mt-3 max-w-2xl text-lg text-ink-muted">
              Doc routes approved briefs to the right executor for {snapshot.brainName}.
            </p>
            <p className="mt-2 max-w-2xl text-sm platform-apricot-text">{snapshot.metaProofNote}</p>
          </header>

          <div className="card mt-6 border-apricot/20 bg-apricot/5 p-4">
            <p className="text-sm text-ink-muted">
              Seeded board, not a live job queue. Actions update this session only.
            </p>
          </div>

          <div className="platform-grid mt-8">
            <section className="card p-5 sm:col-span-2">
              <h2 className="section-label">Routing table</h2>
              <p className="mt-1 text-xs text-ink-muted">
                How Doc picks the executor for each approved action.
              </p>
              <div className="mt-4 overflow-x-auto">
                <table className="platform-dispatch-routing w-full min-w-[36rem] text-sm">
                  <thead>
                    <tr>
                      <th scope="col" className="section-label pb-2 text-left">
                        Approved action
                      </th>
                      <th scope="col" className="section-label pb-2 text-left">
                        Executor
                      </th>
                      <th scope="col" className="section-label pb-2 text-left">
                        Why
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {snapshot.routingRules.map((rule) => (
                      <tr key={rule.id} className="border-t border-ink/8">
                        <td className="py-3 pr-4 align-top font-medium text-ink">
                          {rule.actionLabel}
                        </td>
                        <td className="py-3 pr-4 align-top">
                          <span
                            className={`status-pill ${routingExecutorPillClass(rule.executor)}`}
                          >
                            {rule.executorLabel}
                          </span>
                        </td>
                        <td className="py-3 align-top text-ink-muted">{rule.rationale}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="card p-5 sm:col-span-2">
              <h2 className="section-label">Guardrails</h2>
              <ul className="mt-4 space-y-2">
                {snapshot.guardrails.map((g) => (
                  <li key={g.id} className="flex gap-2 text-sm text-ink-muted">
                    <span className="platform-apricot-text" aria-hidden>
                      •
                    </span>
                    {g.text}
                  </li>
                ))}
              </ul>
            </section>

            <section className="card p-5 sm:col-span-2">
              <h2 className="section-label">Implementation jobs</h2>
              <p className="mt-1 text-xs text-ink-muted">
                Status flow: Approved → Running → Draft ready | Needs review | Failed
              </p>
              <ul className="mt-4 space-y-4">
                {jobs.map((job) => (
                  <li key={job.id}>
                    <JobCard
                      job={job}
                      onPublish={handlePublish}
                      paperTrail={paperTrails[job.id] ?? []}
                    />
                  </li>
                ))}
              </ul>
            </section>
          </div>

          <p className="mt-8 text-xs text-ink-muted">
            Demo data. Actions update this session only, not live records.
          </p>
        </div>
      </main>
      <Footer />
    </>
  );
}
