"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { PlatformNav } from "@/components/platform/PlatformNav";
import {
  createJudgementPaperTrail,
  CONVENING_LINE,
  DEFAULT_COURT_DECISION,
  docExecutionLine,
  conveneMatter,
  type CourtDecision,
  type CourtMatter,
  type CourtRole,
  type HumanJudgement,
} from "@/lib/platform/court";
import type { PaperTrailLine } from "@/lib/platform/brain-health";

function formatWhen(iso: string): string {
  try {
    return new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short" }).format(
      new Date(iso),
    );
  } catch {
    return iso;
  }
}

function RoleAvatar({ role }: { role: CourtRole }) {
  if (role.portraitSrc) {
    return (
      <Image
        src={role.portraitSrc}
        alt=""
        width={56}
        height={56}
        sizes="56px"
        className="platform-court__avatar"
      />
    );
  }

  const initials = role.name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2);

  return (
    <div className="platform-court__avatar platform-court__avatar--nameplate" aria-hidden>
      <span>{initials}</span>
    </div>
  );
}

function CourtSession({ decision }: { decision: CourtDecision }) {
  const [revealedCount, setRevealedCount] = useState(1);
  const [actor, setActor] = useState("");
  const [judgement, setJudgement] = useState<HumanJudgement>(null);
  const [paperTrail, setPaperTrail] = useState<PaperTrailLine[]>([]);
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setEntered(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  // Dialogue auto-reveal
  useEffect(() => {
    if (revealedCount >= decision.dialogue.length) return;

    const timer = setTimeout(() => {
      setRevealedCount((prev) => prev + 1);
    }, 2800);

    return () => clearTimeout(timer);
  }, [revealedCount, decision.dialogue.length]);

  const recordJudgement = (choice: Exclude<HumanJudgement, null>) => {
    if (!actor.trim()) return;
    setJudgement(choice);
    setPaperTrail((prev) => [...prev, createJudgementPaperTrail(choice, actor.trim())]);
  };

  const docLine = judgement ? docExecutionLine(judgement) : null;
  const gateStage =
    revealedCount < Math.ceil(decision.dialogue.length / 2)
      ? "1"
      : revealedCount < decision.dialogue.length
        ? "2"
        : "3";
  const convenerRole = decision.roles.find((r) => r.id === decision.convenerId)!;

  return (
    <>
      <header className="platform-page__header platform-court__header">
        <p className="section-label">Court mode</p>
        <h1 className="font-display mt-2 text-3xl font-semibold text-cream sm:text-4xl">
          {decision.title}
        </h1>
        <p className="mt-3 max-w-2xl text-lg text-cream/80">{decision.context}</p>
        <p className="mt-2 text-sm text-parchment/90">
          <strong>Stakes:</strong> {decision.stakes}
        </p>
        <p className="mt-4 rounded-lg border border-parchment/20 bg-moss/60 px-4 py-3 text-sm text-cream">
          {decision.ruleLine}
        </p>
      </header>

      <div className="platform-court__convening-strip">
        <p className="text-sm text-cream/90">
          <strong className="text-cream">{convenerRole.name}</strong> convenes this session. She calls
          the Court to order; she does not own the verdict.
        </p>
      </div>

      <div className={`platform-court__scene${entered ? " platform-court__scene--entered" : ""}`}>
        <ul className="platform-court__dialogue">
          {decision.dialogue.slice(0, revealedCount).map((turn, idx) => {
            const role = decision.roles.find((r) => r.id === turn.roleId)!;
            const isJudge = role.id === "judge";
            return (
              <li
                key={idx}
                className={`platform-court__dialogue-turn platform-court__dialogue-turn--entered`}
              >
                <div className="flex gap-3">
                  <RoleAvatar role={role} />
                  <div>
                    <p className="section-label">{role.title}</p>
                    <h2 className="font-display text-lg font-semibold text-ink">{role.name}</h2>
                    <p className="mt-2 text-sm leading-relaxed text-ink">{turn.line}</p>
                    {isJudge ? (
                      <p className="mt-3 text-xs font-medium text-apricot">
                        The Judge summarises — does not decide.
                      </p>
                    ) : null}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
        {revealedCount < decision.dialogue.length ? (
          <button
            onClick={() => setRevealedCount(decision.dialogue.length)}
            className="btn-secondary text-sm mt-4"
          >
            Reveal all
          </button>
        ) : null}
      </div>

      <div className={`platform-court__judgement-gate platform-court__judgement-gate--stage-${gateStage}`}>
        <div className="sticky bottom-0 bg-cream/95 backdrop-blur border-t border-ink/10 px-4 py-3">
          <p className="text-xs font-medium text-ink-muted mb-1">{decision.ruleLine}</p>
        </div>

        <section className="card platform-court__judgement p-5">
          <p className="section-label">Human gives judgement</p>
          <p className="mt-2 text-sm text-ink-muted">{decision.judgeSummary}</p>

          {!judgement ? (
            <>
              <label className="mt-4 block text-sm" htmlFor="court-actor-name">
                <span className="section-label mb-1 block">Your name</span>
                <input
                  id="court-actor-name"
                  name="courtActor"
                  type="text"
                  value={actor}
                  onChange={(e) => setActor(e.target.value)}
                  autoComplete="off"
                  spellCheck={false}
                  className="w-full max-w-md rounded-lg border border-ink/15 bg-white px-3 py-2 text-sm"
                  placeholder="Who is recording this judgement?…"
                />
              </label>
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={!actor.trim()}
                  onClick={() => recordJudgement("approve")}
                  className="btn-primary text-sm disabled:opacity-60"
                >
                  Approve
                </button>
                <button
                  type="button"
                  disabled={!actor.trim()}
                  onClick={() => recordJudgement("not-yet")}
                  className="btn-secondary text-sm disabled:opacity-60"
                >
                  Not yet
                </button>
                <button
                  type="button"
                  disabled={!actor.trim()}
                  onClick={() => recordJudgement("escalate")}
                  className="btn-secondary text-sm disabled:opacity-60"
                >
                  Send to another human
                </button>
              </div>
            </>
          ) : (
            <div className="mt-4 rounded-xl border border-sage/30 bg-sage/10 p-4" aria-live="polite">
              <p className="font-display font-semibold text-ink">
                Judgement recorded:{" "}
                {judgement === "approve"
                  ? "Approved"
                  : judgement === "not-yet"
                    ? "Not yet"
                    : "Escalated"}
              </p>
              {docLine ? <p className="mt-2 text-sm text-ink-muted">{docLine}</p> : null}
            </div>
          )}

          {paperTrail.length > 0 ? (
            <div className="platform-paper-trail mt-4">
              <p className="section-label mb-2">Paper trail</p>
              <ul className="platform-paper-trail__list">
                {paperTrail.map((line) => (
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
          ) : null}
        </section>
      </div>

      <p className="mt-8 text-xs text-ink-muted">
        Demo data. Actions update this session only, not live records.
      </p>
    </>
  );
}

function CourtIntake({ onDecisionSet }: { onDecisionSet: (d: CourtDecision) => void }) {
  const [title, setTitle] = useState("");
  const [context, setContext] = useState("");
  const [stakes, setStakes] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !context.trim() || !stakes.trim()) return;

    const matter: CourtMatter = { title: title.trim(), context: context.trim(), stakes: stakes.trim() };
    onDecisionSet(conveneMatter(matter));
  };

  return (
    <>
      <header className="platform-page__header platform-court__header">
        <p className="section-label">Court mode</p>
        <h1 className="font-display mt-2 text-3xl font-semibold text-cream sm:text-4xl">
          Bring a matter to the Court
        </h1>
        <p className="mt-3 max-w-2xl text-lg text-cream/80">
          The Court sits for consequential calls. If this is idle curiosity, take it to Clive first.
        </p>
      </header>

      <div className="mt-8 space-y-6">
        <div className="space-y-4">
          <h2 className="font-display text-xl font-semibold text-ink">Sample matter</h2>
          <button
            onClick={() => onDecisionSet(DEFAULT_COURT_DECISION)}
            className="btn-secondary text-sm"
          >
            Convene the sample Court
          </button>
        </div>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-ink/10"></div>
          </div>
          <div className="relative flex justify-center">
            <span className="px-3 bg-cream text-sm text-ink-muted">or</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <h2 className="font-display text-xl font-semibold text-ink">Bring your own matter</h2>
          <div>
            <label className="block text-sm" htmlFor="matter-title">
              <span className="section-label mb-1 block">Matter title</span>
              <input
                id="matter-title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full max-w-2xl rounded-lg border border-ink/15 bg-white px-3 py-2 text-sm"
                placeholder="Approve the off-script discount guardrail?…"
                required
              />
            </label>
          </div>
          <div>
            <label className="block text-sm" htmlFor="matter-context">
              <span className="section-label mb-1 block">Context</span>
              <textarea
                id="matter-context"
                value={context}
                onChange={(e) => setContext(e.target.value)}
                className="w-full max-w-2xl rounded-lg border border-ink/15 bg-white px-3 py-2 text-sm min-h-24"
                placeholder="What is the situation and why does it matter?…"
                required
              />
            </label>
          </div>
          <div>
            <label className="block text-sm" htmlFor="matter-stakes">
              <span className="section-label mb-1 block">Stakes</span>
              <textarea
                id="matter-stakes"
                value={stakes}
                onChange={(e) => setStakes(e.target.value)}
                className="w-full max-w-2xl rounded-lg border border-ink/15 bg-white px-3 py-2 text-sm min-h-20"
                placeholder="What happens if you decide wrong?…"
                required
              />
            </label>
          </div>
          <button
            type="submit"
            disabled={!title.trim() || !context.trim() || !stakes.trim()}
            className="btn-primary text-sm disabled:opacity-60"
          >
            Convene the Court
          </button>
        </form>
      </div>
    </>
  );
}

export function CourtShell() {
  const [decision, setDecision] = useState<CourtDecision | null>(null);

  return (
    <>
      <Nav />
      <PlatformNav />
      <main className="platform-page platform-page--court">
        <div className="platform-page__inner">
          {decision ? (
            <CourtSession decision={decision} />
          ) : (
            <CourtIntake onDecisionSet={setDecision} />
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
