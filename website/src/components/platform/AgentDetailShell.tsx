"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useState } from "react";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { PlatformNav } from "@/components/platform/PlatformNav";
import {
  createPromotePaperTrail,
  createRetirePaperTrail,
  KNOWN_TRUTH_SLOT_LABELS,
  type AgentDetail,
  type KnownTruth,
  type PersonaMemory,
} from "@/lib/platform/agent-bases";
import type { PaperTrailLine } from "@/lib/platform/brain-health";
import type { InteractionSummary } from "@/lib/brains/types";

function formatWhen(iso: string): string {
  try {
    return new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short" }).format(
      new Date(iso),
    );
  } catch {
    return iso;
  }
}

function personaLabel(persona: InteractionSummary["persona"]): string {
  if (persona === "pam") return "Pam";
  if (persona === "doc") return "Doc";
  return "Clive";
}

function PaperTrailList({ lines }: { lines: PaperTrailLine[] }) {
  if (lines.length === 0) return null;
  return (
    <div className="platform-paper-trail mt-3">
      <p className="section-label mb-2">Paper trail</p>
      <ul className="platform-paper-trail__list">
        {lines.map((line) => (
          <li key={line.id} className="platform-paper-trail__item">
            <p className="platform-paper-trail__action">{line.action}</p>
            <p className="platform-paper-trail__meta">
              {line.actor} · {formatWhen(line.timestamp)}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}

function TierPromoteGate({
  label,
  content,
  onPromote,
  promoted,
}: {
  label: string;
  content: string;
  agentName: string;
  onPromote: (actor: string) => PaperTrailLine;
  promoted: boolean;
}) {
  const [actor, setActor] = useState("");
  const [trail, setTrail] = useState<PaperTrailLine | null>(null);
  const inputId = `tier-promote-actor-${label.replace(/\s+/g, "-").toLowerCase()}`;

  return (
    <article className="card p-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className={`status-pill ${promoted ? "status-pill--live" : "status-pill--pending"}`}>
          {promoted ? "Approved (canonical)" : "Pending"}
        </span>
        <span className="section-label">{label}</span>
      </div>
      <p className="mt-3 text-sm leading-relaxed text-ink">{content}</p>
      {!promoted ? (
        <div className="mt-4 rounded-xl border border-apricot/20 bg-apricot/5 p-3">
          <p className="text-xs text-ink-muted">Human gate: agents propose; you promote to canonical.</p>
          <label className="mt-3 block text-sm" htmlFor={inputId}>
            <span className="section-label mb-1 block">Your name</span>
            <input
              id={inputId}
              name="tierPromoteActor"
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
            onClick={() => setTrail(onPromote(actor.trim()))}
            className="btn-primary mt-3 text-sm disabled:opacity-60"
          >
            Promote to canonical
          </button>
        </div>
      ) : null}
      {trail ? (
        <div aria-live="polite">
          <PaperTrailList lines={[trail]} />
        </div>
      ) : null}
    </article>
  );
}

function MemoryRetireGate({
  memory,
  onRetire,
}: {
  memory: PersonaMemory;
  onRetire: (memoryId: string, actor: string) => PaperTrailLine;
}) {
  const [actor, setActor] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [retired, setRetired] = useState(memory.status === "retired");
  const [trail, setTrail] = useState<PaperTrailLine | null>(null);
  const inputId = `memory-retire-actor-${memory.id}`;

  const handleRetire = () => {
    setTrail(onRetire(memory.id, actor.trim()));
    setRetired(true);
    setConfirming(false);
  };

  return (
    <article className="card p-4">
      <span className={`status-pill ${retired ? "status-pill--pending" : "status-pill--live"}`}>
        {retired ? "Retired" : "Active (auto-formed)"}
      </span>
      <h3 className="mt-2 font-display font-semibold text-ink">{memory.title}</h3>
      <p className="mt-1 text-sm text-ink-muted">{memory.content}</p>
      <p className="mt-2 text-xs text-ink-muted">
        Linked known truth: {KNOWN_TRUTH_SLOT_LABELS[memory.linkedTruthSlot]}
      </p>
      {!retired ? (
        <div className="mt-4 rounded-xl border border-ink/10 bg-cream-deep/40 p-3">
          <label className="block text-sm" htmlFor={inputId}>
            <span className="section-label mb-1 block">Your name</span>
            <input
              id={inputId}
              name="memoryRetireActor"
              type="text"
              value={actor}
              onChange={(e) => setActor(e.target.value)}
              autoComplete="off"
              spellCheck={false}
              placeholder="Required to retire…"
              className="w-full rounded-lg border border-ink/15 bg-white px-3 py-2 text-sm"
            />
          </label>
          {confirming ? (
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleRetire}
                className="btn-secondary text-sm"
              >
                Confirm retire
              </button>
              <button
                type="button"
                onClick={() => setConfirming(false)}
                className="btn-secondary text-sm"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              type="button"
              disabled={!actor.trim()}
              onClick={() => setConfirming(true)}
              className="btn-secondary mt-3 text-sm disabled:opacity-60"
            >
              Retire memory
            </button>
          )}
        </div>
      ) : null}
      {trail ? (
        <div aria-live="polite">
          <PaperTrailList lines={[trail]} />
        </div>
      ) : null}
    </article>
  );
}

export function AgentDetailShell({ agent }: { agent: AgentDetail }) {
  const [superObjective, setSuperObjective] = useState(agent.superObjective);
  const [knownTruths, setKnownTruths] = useState(agent.knownTruths);
  const [memories, setMemories] = useState(agent.personaMemories);

  const promoteSuperObjective = useCallback(
    (actor: string) => {
      setSuperObjective((prev) => ({ ...prev, provenanceStatus: "approved-canonical" }));
      return createPromotePaperTrail(agent.name, "Super Objective", actor);
    },
    [agent.name],
  );

  const promoteKnownTruth = useCallback(
    (id: string, actor: string) => {
      setKnownTruths((prev) =>
        prev.map((kt) =>
          kt.id === id ? { ...kt, provenanceStatus: "approved-canonical" as const } : kt,
        ),
      );
      const slot = knownTruths.find((k) => k.id === id);
      const label = slot ? KNOWN_TRUTH_SLOT_LABELS[slot.slot] : "Known Truth";
      return createPromotePaperTrail(agent.name, label, actor);
    },
    [agent.name, knownTruths],
  );

  const retireMemory = useCallback(
    (memoryId: string, actor: string) => {
      const memory = memories.find((m) => m.id === memoryId);
      setMemories((prev) =>
        prev.map((m) => (m.id === memoryId ? { ...m, status: "retired" as const } : m)),
      );
      return createRetirePaperTrail(memory?.title ?? "Memory", actor);
    },
    [memories],
  );

  return (
    <>
      <Nav />
      <PlatformNav />
      <main className="platform-page">
        <div className="platform-page__inner">
          <header className="platform-page__header">
            <Link href="/agents" className="text-sm text-apricot hover:underline">
              ← Fleet roster
            </Link>
            <div className="mt-4 flex flex-wrap items-start gap-4">
              {agent.slug === "clive-man" ? (
                <Link
                  href="/brain"
                  aria-label="Enter the brain shrine"
                  className="rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-apricot"
                >
                  {agent.portraitSrc ? (
                    <Image
                      src={agent.portraitSrc}
                      alt=""
                      width={96}
                      height={96}
                      sizes="96px"
                      className="platform-agent-card__portrait platform-agent-card__portrait--lg"
                    />
                  ) : (
                    <div
                      className="platform-agent-card__nameplate platform-agent-card__nameplate--lg"
                      aria-hidden
                    >
                      <span>{agent.name.split(" ").map((p) => p[0]).join("").slice(0, 2)}</span>
                    </div>
                  )}
                </Link>
              ) : agent.portraitSrc ? (
                <Image
                  src={agent.portraitSrc}
                  alt=""
                  width={96}
                  height={96}
                  sizes="96px"
                  className="platform-agent-card__portrait platform-agent-card__portrait--lg"
                />
              ) : (
                <div className="platform-agent-card__nameplate platform-agent-card__nameplate--lg" aria-hidden>
                  <span>{agent.name.split(" ").map((p) => p[0]).join("").slice(0, 2)}</span>
                </div>
              )}
              <div>
                <p className="section-label">Agent base review</p>
                <h1 className="font-display mt-1 text-3xl font-semibold text-ink">{agent.name}</h1>
                <p className="platform-apricot-text">{agent.role}</p>
                <p className="mt-2 max-w-xl text-ink-muted">{agent.oneLiner}</p>
                {agent.slug === "clive-man" ? (
                  <Link href="/brain" className="btn-primary mt-4 inline-flex text-sm">
                    Enter the brain shrine →
                  </Link>
                ) : null}
              </div>
            </div>
          </header>

          <div className="platform-grid mt-10">
            <section className="sm:col-span-2">
              <p className="section-label mb-3">Tier 1: Super Objective</p>
              <TierPromoteGate
                label="Super Objective"
                content={superObjective.content}
                agentName={agent.name}
                onPromote={promoteSuperObjective}
                promoted={superObjective.provenanceStatus === "approved-canonical"}
              />
            </section>

            <section className="sm:col-span-2">
              <p className="section-label mb-3">Tier 2: Known Truths (five fixed slots)</p>
              <ul className="space-y-3">
                {knownTruths.map((kt: KnownTruth) => (
                  <li key={kt.id}>
                    <TierPromoteGate
                      label={KNOWN_TRUTH_SLOT_LABELS[kt.slot]}
                      content={kt.content}
                      agentName={agent.name}
                      onPromote={(actor) => promoteKnownTruth(kt.id, actor)}
                      promoted={kt.provenanceStatus === "approved-canonical"}
                    />
                  </li>
                ))}
              </ul>
            </section>

            <section className="sm:col-span-2">
              <p className="section-label mb-3">Tier 3: Persona memories</p>
              <p className="mb-3 text-xs text-ink-muted">
                Persona memories form automatically; humans retire them or promote them out. They are not canonical on create.
              </p>
              {memories.length === 0 ? (
                <p className="text-sm text-ink-muted">No persona memories seeded yet.</p>
              ) : (
                <ul className="space-y-3">
                  {memories.map((memory) => (
                    <li key={memory.id}>
                      <MemoryRetireGate memory={memory} onRetire={retireMemory} />
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="card p-5">
              <p className="section-label">Persona config</p>
              <dl className="mt-4 space-y-3 text-sm">
                <div>
                  <dt className="section-label">Role</dt>
                  <dd className="mt-1 text-ink-muted">{agent.personaConfig.role}</dd>
                </div>
                <div>
                  <dt className="section-label">Output shape</dt>
                  <dd className="mt-1 text-ink-muted">{agent.personaConfig.outputShape}</dd>
                </div>
                <div>
                  <dt className="section-label">Tone</dt>
                  <dd className="mt-1 text-ink-muted">{agent.personaConfig.toneNotes}</dd>
                </div>
              </dl>
            </section>

            <section className="card p-5 sm:col-span-2">
              <p className="section-label">Persona conversation review</p>
              {agent.recentInteractions.length === 0 ? (
                <p className="mt-3 text-sm text-ink-muted">No recent interactions seeded.</p>
              ) : (
                <ul className="mt-4 space-y-4">
                  {agent.recentInteractions.map((interaction) => (
                    <li key={interaction.recordId} className="card-muted p-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-moss px-3 py-1 text-xs font-medium text-cream">
                          {personaLabel(interaction.persona)}
                        </span>
                        <time className="text-xs text-ink-muted" dateTime={interaction.createdAt}>
                          {formatWhen(interaction.createdAt)}
                        </time>
                      </div>
                      <p className="mt-2 text-sm font-medium text-ink">{interaction.userMessage}</p>
                      <p className="mt-2 text-sm text-ink-muted">{interaction.assistantReply}</p>
                    </li>
                  ))}
                </ul>
              )}
              <Link href="/brain/review" className="btn-secondary mt-4 inline-flex text-sm">
                Score interactions in Brain review
              </Link>
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
