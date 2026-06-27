"use client";

import { useMemo, useState } from "react";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { PlatformNav } from "@/components/platform/PlatformNav";
import {
  DEFAULT_USER_BRAIN,
  deriveCalibration,
  scoreLabel,
  weakestDomains,
  type CompetencyScore,
  type UserBrainDomain,
} from "@/lib/platform/user-brain";

const SCORE_OPTIONS: CompetencyScore[] = ["new", "comfortable", "expert", "prefer-not-to-say"];

export function CoachShell() {
  const [domains, setDomains] = useState<UserBrainDomain[]>(DEFAULT_USER_BRAIN.domains);

  const calibration = useMemo(() => deriveCalibration(domains), [domains]);
  const weak = useMemo(() => weakestDomains(domains), [domains]);
  const tips = useMemo(
    () =>
      DEFAULT_USER_BRAIN.coachTips.filter((tip) =>
        weak.some((d) => d.id === tip.domainId),
      ),
    [weak],
  );

  const updateDomain = (id: string, patch: Partial<UserBrainDomain>) => {
    setDomains((prev) => prev.map((d) => (d.id === id ? { ...d, ...patch } : d)));
  };

  return (
    <>
      <Nav />
      <PlatformNav />
      <main className="platform-page">
        <div className="platform-page__inner">
          <header className="platform-page__header">
            <p className="section-label">User brain + Coach Whit</p>
            <h1 className="font-display mt-2 text-3xl font-semibold text-ink sm:text-4xl">
              Who is sitting in the chair?
            </h1>
            <p className="mt-3 max-w-2xl text-lg text-ink-muted">
              The system adapts to you before you adapt to the system. Enablement, not surveillance.
            </p>
          </header>

          <div className="platform-grid mt-10">
            <section className="card p-5 sm:col-span-2">
              <p className="section-label">Competency map</p>
              <p className="mt-1 text-xs text-ink-muted">Editable self-report; living profile, not a test.</p>
              <ul className="mt-4 space-y-4">
                {domains.map((domain) => (
                  <li key={domain.id} className="border-b border-ink/8 pb-4 last:border-0">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <label className="font-medium text-ink" htmlFor={`score-${domain.id}`}>
                        {domain.label}
                      </label>
                      <select
                        id={`score-${domain.id}`}
                        value={domain.score}
                        onChange={(e) =>
                          updateDomain(domain.id, { score: e.target.value as CompetencyScore })
                        }
                        className="rounded-lg border border-ink/15 bg-white px-3 py-2 text-sm"
                      >
                        {SCORE_OPTIONS.map((opt) => (
                          <option key={opt} value={opt}>
                            {scoreLabel(opt)}
                          </option>
                        ))}
                      </select>
                    </div>
                    <textarea
                      value={domain.notes ?? ""}
                      onChange={(e) => updateDomain(domain.id, { notes: e.target.value })}
                      rows={2}
                      aria-label={`Notes for ${domain.label}`}
                      placeholder="Optional notes…"
                      className="mt-2 w-full rounded-lg border border-ink/15 bg-cream-deep/30 px-3 py-2 text-sm text-ink-muted"
                    />
                  </li>
                ))}
              </ul>
            </section>

            <section className="card p-5 sm:col-span-2">
              <p className="section-label">Profile-based calibration</p>
              <p className="mt-1 text-xs text-ink-muted">
                From your competency scores: how Clive&apos;s pace and Pam&apos;s sensitivity adjust.
              </p>
              <div className="mt-4 overflow-x-auto">
                <table className="platform-calibration-table w-full min-w-[32rem] text-sm">
                  <thead>
                    <tr>
                      <th className="section-label pb-2 text-left">Signal</th>
                      <th className="section-label pb-2 text-left">Clive</th>
                      <th className="section-label pb-2 text-left">Pam</th>
                    </tr>
                  </thead>
                  <tbody>
                    {calibration.map((row) => (
                      <tr key={row.signal} className="border-t border-ink/8">
                        <td className="py-3 pr-4 align-top font-medium text-ink">{row.signal}</td>
                        <td className="py-3 pr-4 align-top text-ink-muted">{row.cliveBehaviour}</td>
                        <td className="py-3 align-top text-ink-muted">{row.pamBehaviour}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="card p-5">
              <p className="section-label">Coach Whit: prompt coaching</p>
              <p className="mt-1 text-xs text-ink-muted">
                Seeded tips keyed to your weakest domains. Calibrated enablement.
              </p>
              <ul className="mt-4 space-y-4">
                {tips.map((tip) => (
                  <li key={tip.id} className="card-muted p-4">
                    <h3 className="font-display font-semibold text-ink">{tip.title}</h3>
                    <p className="mt-2 text-sm text-ink-muted">{tip.tip}</p>
                    <blockquote className="mt-3 border-l-2 border-apricot/40 pl-3 text-sm italic text-ink-muted">
                      {tip.examplePrompt}
                    </blockquote>
                  </li>
                ))}
              </ul>
            </section>

            <section className="card p-5">
              <p className="section-label">Champion signals (read-only)</p>
              <p className="mt-1 text-xs text-ink-muted">
                Optional context for coaching, not a performance score.
              </p>
              <ul className="mt-4 space-y-3">
                {DEFAULT_USER_BRAIN.managerFlags.map((flag) => (
                  <li key={flag.id} className="card-muted p-3">
                    <p className="section-label">{flag.label}</p>
                    <p className="mt-1 text-sm text-ink">{flag.value}</p>
                    <p className="mt-1 text-xs text-ink-muted">Set by {flag.setBy}</p>
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
