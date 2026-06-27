"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { PlatformNav } from "@/components/platform/PlatformNav";
import {
  createJudgementPaperTrail,
  DEFAULT_COURT_DECISION,
  docExecutionLine,
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

export function CourtShell() {
  const court = DEFAULT_COURT_DECISION;
  const [actor, setActor] = useState("");
  const [judgement, setJudgement] = useState<HumanJudgement>(null);
  const [paperTrail, setPaperTrail] = useState<PaperTrailLine[]>([]);
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setEntered(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  const recordJudgement = (choice: Exclude<HumanJudgement, null>) => {
    if (!actor.trim()) return;
    setJudgement(choice);
    setPaperTrail((prev) => [...prev, createJudgementPaperTrail(choice, actor.trim())]);
  };

  const docLine = judgement ? docExecutionLine(judgement) : null;

  return (
    <>
      <Nav />
      <PlatformNav />
      <main className="platform-page platform-page--court">
        <div className="platform-page__inner">
          <header className="platform-page__header platform-court__header">
            <p className="section-label">Court mode</p>
            <h1 className="font-display mt-2 text-3xl font-semibold text-cream sm:text-4xl">
              {court.title}
            </h1>
            <p className="mt-3 max-w-2xl text-lg text-cream/80">{court.context}</p>
            <p className="mt-2 text-sm text-parchment/90">
              <strong>Stakes:</strong> {court.stakes}
            </p>
            <p className="mt-4 rounded-lg border border-parchment/20 bg-moss/60 px-4 py-3 text-sm text-cream">
              {court.ruleLine}
            </p>
          </header>

          <div className={`platform-court__scene${entered ? " platform-court__scene--entered" : ""}`}>
            <ul className="platform-court__takes">
              {court.takes.map((take) => {
                const role = court.roles.find((r) => r.id === take.roleId)!;
                const isJudge = role.id === "judge";
                return (
                  <li
                    key={take.roleId}
                    className={`platform-court__take card ${isJudge ? "platform-court__take--judge" : ""}`}
                  >
                    <div className="flex gap-3">
                      <RoleAvatar role={role} />
                      <div>
                        <p className="section-label">{role.title}</p>
                        <h2 className="font-display text-lg font-semibold text-ink">{role.name}</h2>
                        <p className="mt-2 text-sm font-medium text-ink">{take.headline}</p>
                        <p className="mt-2 text-sm leading-relaxed text-ink-muted">{take.body}</p>
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
          </div>

          <section className="card platform-court__judgement p-5 mt-8">
            <p className="section-label">Human gives judgement</p>
            <p className="mt-2 text-sm text-ink-muted">{court.judgeSummary}</p>

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
          <p className="mt-8 text-xs text-ink-muted">
            Demo data. Actions update this session only, not live records.
          </p>
        </div>
      </main>
      <Footer />
    </>
  );
}
