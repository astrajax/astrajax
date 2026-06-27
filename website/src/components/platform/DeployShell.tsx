"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { PlatformNav } from "@/components/platform/PlatformNav";
import { PaperTrailList } from "@/components/platform/PaperTrailList";
import type { PaperTrailLine } from "@/lib/platform/brain-health";
import {
  DEFAULT_DEPLOY,
  createDeployPaperTrail,
  createExportPaperTrail,
  type DeployPackage,
} from "@/lib/platform/deploy";

function PackageCard({
  pkg,
  exported,
  deployed,
  onExport,
  onDeploy,
  paperTrail,
}: {
  pkg: DeployPackage;
  exported: boolean;
  deployed: boolean;
  onExport: (packageId: string, actor: string) => void;
  onDeploy: (packageId: string, actor: string) => void;
  paperTrail: PaperTrailLine[];
}) {
  const [actor, setActor] = useState("");
  const [showExportSummary, setShowExportSummary] = useState(false);
  const [confirmDeploy, setConfirmDeploy] = useState(false);

  return (
    <article className="card p-5 sm:col-span-2">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="font-display text-xl font-semibold text-ink">{pkg.agentName}</h2>
        <span className="status-pill status-pill--clean">{pkg.brainName}</span>
        {exported ? <span className="status-pill status-pill--live">Exported</span> : null}
        {deployed ? <span className="status-pill status-pill--live">Mock deployed</span> : null}
      </div>

      <div className="platform-grid mt-6">
        <section className="card-muted p-4">
          <p className="section-label">Scoped tools</p>
          <ul className="mt-3 space-y-3">
            {pkg.scopedTools.map((tool) => (
              <li key={tool.id}>
                <p className="font-medium text-sm text-ink">{tool.label}</p>
                <p className="mt-1 text-xs text-ink-muted">{tool.description}</p>
              </li>
            ))}
          </ul>
        </section>

        <section className="card-muted p-4">
          <p className="section-label">Trusted context bindings</p>
          <ul className="mt-3 space-y-2">
            {pkg.trustedContextBindings.map((binding) => (
              <li key={binding.id} className="text-sm">
                <span className="text-ink">{binding.label}</span>
                <span className="text-ink-muted">, requires {binding.maturityRequired}</span>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-xs text-ink-muted">{pkg.runtimeFetchNote}</p>
        </section>

        <section className="card-muted p-4 sm:col-span-2">
          <p className="section-label">Approval rules</p>
          <p className="mt-2 text-sm text-ink-muted">{pkg.approvalRulesSummary}</p>
        </section>

        <section className="card-muted p-4 sm:col-span-2">
          <p className="section-label">Governed defaults</p>
          <table className="platform-deploy-defaults mt-3 w-full text-sm">
            <thead>
              <tr>
                <th scope="col" className="section-label pb-2 text-left">
                  Setting
                </th>
                <th scope="col" className="section-label pb-2 text-left">
                  Value
                </th>
                <th scope="col" className="section-label pb-2 text-left">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {pkg.governedDefaults.map((d) => (
                <tr key={d.key} className="border-t border-ink/8">
                  <td className="py-2 pr-4 text-sm text-ink">{d.label}</td>
                  <td className="py-2 pr-4 text-ink-muted">{d.value}</td>
                  <td className="py-2">
                    {d.locked ? (
                      <span className="platform-fleet-lock-badge text-xs" aria-label="Locked">
                        Locked
                      </span>
                    ) : (
                      <span className="text-xs text-ink-muted">Configurable</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-3 text-xs text-ink-muted">
            Memory target: {pkg.memoryTarget}
          </p>
        </section>
      </div>

      <div className="mt-6 rounded-xl border border-apricot/20 bg-apricot/5 p-4">
        <p className="text-xs text-ink-muted">
          Human gate before export or deploy. Deploy is mocked for demo, no live HyperAgent sync.
        </p>
        <label className="mt-3 block text-sm" htmlFor={`deploy-actor-${pkg.id}`}>
          <span className="section-label mb-1 block">Your name</span>
          <input
            id={`deploy-actor-${pkg.id}`}
            name="deployActor"
            type="text"
            value={actor}
            onChange={(e) => setActor(e.target.value)}
            autoComplete="off"
            spellCheck={false}
            className="platform-gate-input w-full rounded-lg border border-ink/15 bg-white px-3 py-2 text-sm"
            placeholder="Who is authorising this action?…"
          />
        </label>
        <div className="mt-3 flex flex-wrap gap-3">
          <button
            type="button"
            disabled={!actor.trim() || exported}
            onClick={() => {
              onExport(pkg.id, actor.trim());
              setShowExportSummary(true);
            }}
            className="btn-secondary text-sm disabled:opacity-60"
          >
            Export package
          </button>
          {!confirmDeploy ? (
            <button
              type="button"
              disabled={!actor.trim() || !exported || deployed}
              onClick={() => setConfirmDeploy(true)}
              className="btn-primary text-sm disabled:opacity-60"
            >
              Mock deploy to HyperAgent
            </button>
          ) : (
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={!actor.trim() || deployed}
                onClick={() => {
                  onDeploy(pkg.id, actor.trim());
                  setConfirmDeploy(false);
                }}
                className="btn-primary text-sm disabled:opacity-60"
              >
                Confirm mock deploy
              </button>
              <button
                type="button"
                onClick={() => setConfirmDeploy(false)}
                className="btn-secondary text-sm"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
        {showExportSummary ? (
          <p className="mt-3 text-sm text-sage" aria-live="polite">
            Package summary ready for handoff: {pkg.scopedTools.length} tools,{" "}
            {pkg.governedDefaults.length} governed defaults, with auto-save memories turned off (locked).
          </p>
        ) : null}
        {deployed ? (
          <p className="mt-3 text-sm text-sage" aria-live="polite">
            Mock deploy succeeded. HyperAgent would fetch trusted context at session start, demo only.
          </p>
        ) : null}
      </div>

      <PaperTrailList lines={paperTrail} />
    </article>
  );
}

export function DeployShell() {
  const [snapshot] = useState(DEFAULT_DEPLOY);
  const [selectedPackageId, setSelectedPackageId] = useState(snapshot.packages[0]?.id ?? "");
  const [exportedIds, setExportedIds] = useState<Set<string>>(new Set());
  const [deployedIds, setDeployedIds] = useState<Set<string>>(new Set());
  const [paperTrails, setPaperTrails] = useState<Record<string, PaperTrailLine[]>>({});

  const selectedPackage =
    snapshot.packages.find((p) => p.id === selectedPackageId) ?? snapshot.packages[0];

  const handleExport = useCallback(
    (packageId: string, actor: string) => {
      const pkg = snapshot.packages.find((p) => p.id === packageId);
      if (!pkg) return;

      setExportedIds((prev) => new Set(prev).add(packageId));
      const line = createExportPaperTrail(pkg.agentName, actor);
      setPaperTrails((prev) => ({
        ...prev,
        [packageId]: [...(prev[packageId] ?? []), line],
      }));
    },
    [snapshot.packages],
  );

  const handleDeploy = useCallback(
    (packageId: string, actor: string) => {
      const pkg = snapshot.packages.find((p) => p.id === packageId);
      if (!pkg) return;

      setDeployedIds((prev) => new Set(prev).add(packageId));
      const line = createDeployPaperTrail(pkg.agentName, actor);
      setPaperTrails((prev) => ({
        ...prev,
        [packageId]: [...(prev[packageId] ?? []), line],
      }));
    },
    [snapshot.packages],
  );

  return (
    <>
      <Nav />
      <PlatformNav />
      <main className="platform-page">
        <div className="platform-page__inner">
          <header className="platform-page__header">
            <p className="section-label">Package and deploy</p>
            <h1 className="font-display mt-2 text-3xl font-semibold text-ink sm:text-4xl">
              HyperAgent-ready packages
            </h1>
            <p className="mt-3 max-w-2xl text-lg text-ink-muted">{snapshot.partnerFraming}</p>
          </header>

          <div className="card mt-6 border-apricot/20 bg-apricot/5 p-4">
            <p className="text-sm text-ink-muted">
              Seeded board, not a live job queue. Actions update this session only.
            </p>
          </div>

          <p className="mt-4 text-sm text-ink-muted">
            Approve fleet designs on the{" "}
            <Link href="/fleet" className="text-apricot underline-offset-2 hover:underline">
              Fleet page
            </Link>{" "}
            first.
          </p>

          <div className="platform-tabs mt-6">
            {snapshot.packages.map((pkg) => (
              <button
                key={pkg.id}
                type="button"
                aria-pressed={selectedPackageId === pkg.id}
                className={`platform-tabs__btn${
                  selectedPackageId === pkg.id ? " platform-tabs__btn--active" : ""
                }`}
                onClick={() => setSelectedPackageId(pkg.id)}
              >
                {pkg.agentName}
              </button>
            ))}
          </div>

          {selectedPackage ? (
            <PackageCard
              key={selectedPackage.id}
              pkg={selectedPackage}
              exported={exportedIds.has(selectedPackage.id)}
              deployed={deployedIds.has(selectedPackage.id)}
              onExport={handleExport}
              onDeploy={handleDeploy}
              paperTrail={paperTrails[selectedPackage.id] ?? []}
            />
          ) : null}

          <p className="mt-8 text-xs text-ink-muted">
            Demo data. Actions update this session only, not live records.
          </p>
        </div>
      </main>
      <Footer />
    </>
  );
}
