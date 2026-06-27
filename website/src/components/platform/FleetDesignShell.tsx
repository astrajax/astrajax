"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { PlatformNav } from "@/components/platform/PlatformNav";
import { PaperTrailList } from "@/components/platform/PaperTrailList";
import type { PaperTrailLine } from "@/lib/platform/brain-health";
import {
  DEFAULT_FLEET,
  FLEET_PRINCIPLE,
  FLEET_PRINCIPLE_SUBLINE,
  createFleetApprovePaperTrail,
  createFleetRevokePaperTrail,
  type FleetAgent,
  type FleetAgentPersonality,
} from "@/lib/platform/fleet";

function LockedField({ label, value }: { label: string; value: string }) {
  return (
    <div className="platform-fleet-locked__field">
      <p className="section-label">{label}</p>
      <p className="mt-1 text-sm text-ink-muted">{value}</p>
    </div>
  );
}

function FleetAgentCard({
  agent,
  onPersonalityChange,
  onApprove,
  onRevoke,
  paperTrail,
}: {
  agent: FleetAgent;
  onPersonalityChange: (slug: FleetAgent["slug"], patch: Partial<FleetAgentPersonality>) => void;
  onApprove: (slug: FleetAgent["slug"], actor: string) => void;
  onRevoke: (slug: FleetAgent["slug"], actor: string) => void;
  paperTrail: PaperTrailLine[];
}) {
  const [actor, setActor] = useState("");
  const [confirmRevoke, setConfirmRevoke] = useState(false);
  const [revokeNotice, setRevokeNotice] = useState(false);
  const approved = agent.designStatus === "approved";

  return (
    <article className="card p-5 sm:col-span-2">
      <div className="flex flex-wrap items-start gap-4">
        <div className="platform-agent-card__nameplate" aria-hidden>
          <span>{agent.personality.initials}</span>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-display text-xl font-semibold text-ink">{agent.personality.name}</h2>
            <span
              className={`status-pill ${approved ? "status-pill--clean" : "status-pill--pending"}`}
            >
              {approved ? "Design approved" : "Draft design"}
            </span>
          </div>
        </div>
      </div>

      <div className="platform-fleet-panels mt-6">
        <section className="platform-fleet-editable">
          <div className="platform-fleet-panel__header">
            <h3 className="font-display font-semibold text-ink">Editable: personality</h3>
            <span className="status-pill status-pill--clean">Team-facing</span>
          </div>
          {approved ? (
            <div className="mt-4 rounded-lg border border-sage/30 bg-sage/5 p-3">
              <p className="text-sm text-ink">
                Design approved. Personality changes require re-approval before packaging.
              </p>
              {!confirmRevoke ? (
                <button
                  type="button"
                  onClick={() => setConfirmRevoke(true)}
                  className="btn-secondary mt-3 text-sm"
                >
                  Revoke approval
                </button>
              ) : (
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      onRevoke(agent.slug, actor.trim() || "Operator");
                      setConfirmRevoke(false);
                      setRevokeNotice(true);
                    }}
                    className="btn-primary text-sm"
                  >
                    Confirm revoke
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmRevoke(false)}
                    className="btn-secondary text-sm"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          ) : null}
          <div className="mt-4 space-y-4">
            <label className="block text-sm" htmlFor={`${agent.slug}-name`}>
              <span className="section-label mb-1 block">Name</span>
              <input
                id={`${agent.slug}-name`}
                name="agentName"
                type="text"
                value={agent.personality.name}
                disabled={approved}
                onChange={(e) => onPersonalityChange(agent.slug, { name: e.target.value })}
                className="w-full rounded-lg border border-ink/15 bg-white px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-60"
              />
            </label>
            <label className="block text-sm" htmlFor={`${agent.slug}-tone`}>
              <span className="section-label mb-1 block">Tone</span>
              <input
                id={`${agent.slug}-tone`}
                name="agentTone"
                type="text"
                value={agent.personality.tone}
                disabled={approved}
                onChange={(e) => onPersonalityChange(agent.slug, { tone: e.target.value })}
                className="w-full rounded-lg border border-ink/15 bg-white px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-60"
              />
            </label>
            <label className="block text-sm" htmlFor={`${agent.slug}-examples`}>
              <span className="section-label mb-1 block">Example phrases</span>
              <textarea
                id={`${agent.slug}-examples`}
                name="agentExamples"
                rows={2}
                value={agent.personality.examples}
                disabled={approved}
                onChange={(e) => onPersonalityChange(agent.slug, { examples: e.target.value })}
                className="w-full rounded-lg border border-ink/15 bg-white px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-60"
              />
            </label>
            <label className="block text-sm" htmlFor={`${agent.slug}-personality`}>
              <span className="section-label mb-1 block">Team-facing personality</span>
              <textarea
                id={`${agent.slug}-personality`}
                name="agentTeamPersonality"
                rows={2}
                value={agent.personality.teamPersonality}
                disabled={approved}
                onChange={(e) =>
                  onPersonalityChange(agent.slug, { teamPersonality: e.target.value })
                }
                className="w-full rounded-lg border border-ink/15 bg-white px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-60"
              />
            </label>
          </div>
        </section>

        <section className="platform-fleet-locked" aria-labelledby={`${agent.slug}-locked-heading`}>
          <div className="platform-fleet-panel__header">
            <h3 id={`${agent.slug}-locked-heading`} className="font-display font-semibold text-ink">
              Locked: competence
            </h3>
            <span className="platform-fleet-lock-badge" aria-hidden>
              Locked
            </span>
          </div>
          <p className="mt-2 text-xs text-ink-muted">
            Governed by the approved brain. Not editable here.
          </p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <LockedField label="Task scope" value={agent.competence.taskScope} />
            <LockedField label="Model / runtime" value={agent.competence.modelRuntime} />
            <LockedField label="Write permissions" value={agent.competence.writePermissions} />
            <LockedField label="Approval rules" value={agent.competence.approvalRules} />
            <LockedField label="Source boundaries" value={agent.competence.sourceBoundaries} />
            <LockedField label="Safety guardrails" value={agent.competence.guardrails} />
          </div>
        </section>
      </div>

      {!approved ? (
        <>
          {revokeNotice ? (
            <p className="mt-6 text-sm text-ink-muted" aria-live="polite">
              Design returned to draft. Re-approval required before packaging.
            </p>
          ) : null}
          <div className="mt-6 rounded-xl border border-apricot/20 bg-apricot/5 p-4">
            <p className="text-xs text-ink-muted">
              Human gate: approve marks this agent design ready for packaging. Nothing deploys automatically.
            </p>
            <label className="mt-3 block text-sm" htmlFor={`${agent.slug}-approve-actor`}>
              <span className="section-label mb-1 block">Your name</span>
              <input
                id={`${agent.slug}-approve-actor`}
                name="fleetApproveActor"
                type="text"
                value={actor}
                onChange={(e) => setActor(e.target.value)}
                autoComplete="off"
                spellCheck={false}
                className="platform-gate-input w-full rounded-lg border border-ink/15 bg-white px-3 py-2 text-sm"
                placeholder="Who is approving this design?…"
              />
            </label>
            <button
              type="button"
              disabled={!actor.trim()}
              onClick={() => {
                onApprove(agent.slug, actor.trim());
                setRevokeNotice(false);
              }}
              className="btn-primary mt-3 text-sm disabled:opacity-60"
            >
              Approve this fleet design
            </button>
          </div>
        </>
      ) : (
        <p className="mt-6 text-sm text-sage" aria-live="polite">
          Design approved: ready for{" "}
          <Link href="/deploy" className="text-apricot underline-offset-2 hover:underline">
            packaging and deploy
          </Link>
          .
        </p>
      )}

      <PaperTrailList lines={paperTrail} />
    </article>
  );
}

export function FleetDesignShell() {
  const [snapshot] = useState(DEFAULT_FLEET);
  const [agents, setAgents] = useState(snapshot.agents);
  const [paperTrails, setPaperTrails] = useState<Record<string, PaperTrailLine[]>>({});

  const handlePersonalityChange = useCallback(
    (slug: FleetAgent["slug"], patch: Partial<FleetAgentPersonality>) => {
      setAgents((prev) =>
        prev.map((a) =>
          a.slug === slug && a.designStatus !== "approved"
            ? { ...a, personality: { ...a.personality, ...patch } }
            : a,
        ),
      );
    },
    [],
  );

  const handleApprove = useCallback(
    (slug: FleetAgent["slug"], actor: string) => {
      const agent = agents.find((a) => a.slug === slug);
      if (!agent) return;

      setAgents((prev) =>
        prev.map((a) => (a.slug === slug ? { ...a, designStatus: "approved" as const } : a)),
      );

      const line = createFleetApprovePaperTrail(agent.personality.name, actor);
      setPaperTrails((prev) => ({
        ...prev,
        [slug]: [...(prev[slug] ?? []), line],
      }));
    },
    [agents],
  );

  const handleRevoke = useCallback(
    (slug: FleetAgent["slug"], actor: string) => {
      const agent = agents.find((a) => a.slug === slug);
      if (!agent) return;

      setAgents((prev) =>
        prev.map((a) => (a.slug === slug ? { ...a, designStatus: "draft" as const } : a)),
      );

      const line = createFleetRevokePaperTrail(agent.personality.name, actor);
      setPaperTrails((prev) => ({
        ...prev,
        [slug]: [...(prev[slug] ?? []), line],
      }));
    },
    [agents],
  );

  const allApproved = agents.every((a) => a.designStatus === "approved");

  return (
    <>
      <Nav />
      <PlatformNav />
      <main className="platform-page">
        <div className="platform-page__inner">
          <header className="platform-page__header">
            <p className="section-label">Fleet design</p>
            <h1 className="font-display mt-2 text-3xl font-semibold text-ink sm:text-4xl">
              Design the fleet
            </h1>
            <p className="mt-3 max-w-2xl text-lg text-ink-muted">
              Task-scoped agents from an approved brain: {snapshot.brainName}.
            </p>
          </header>

          <section className="card platform-fleet-banner p-5 sm:col-span-2">
            <p className="font-display text-lg font-semibold text-ink">{FLEET_PRINCIPLE}</p>
            <p className="mt-2 text-sm text-ink-muted">{FLEET_PRINCIPLE_SUBLINE}</p>
          </section>

          <div className="platform-grid mt-10">
            {agents.map((agent) => (
              <FleetAgentCard
                key={agent.slug}
                agent={agent}
                onPersonalityChange={handlePersonalityChange}
                onApprove={handleApprove}
                onRevoke={handleRevoke}
                paperTrail={paperTrails[agent.slug] ?? []}
              />
            ))}
          </div>

          {allApproved ? (
            <div className="mt-8">
              <Link href="/deploy" className="btn-primary inline-flex text-sm">
                Continue to package and deploy
              </Link>
            </div>
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
