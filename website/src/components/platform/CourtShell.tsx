"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState, useCallback, useRef, type ReactNode } from "react";
import {
  createJudgementPaperTrail,
  CONVENING_LINE,
  DEFAULT_COURT_DECISION,
  docExecutionLine,
  conveneMatter,
  COURT_BOOK_LAYOUT,
  COURT_MATTER_LIMITS,
  type CourtDecision,
  type CourtMatter,
  type CourtRole,
  type HumanJudgement,
  type AgentVerdict,
  type BickerTurn,
  type CourtRoleId,
} from "@/lib/platform/court";
import type { PaperTrailLine } from "@/lib/platform/brain-health";

const COURT_BOOK_IMAGE = "/agent-cast/court/court-book.jpg";

function CourtBookArtwork({ children }: { children: ReactNode }) {
  return (
    <div className="platform-court__book-container">
      <div className="platform-court__book-media" aria-hidden>
        <Image
          src={COURT_BOOK_IMAGE}
          alt=""
          fill
          priority
          sizes="100vw"
          className="platform-court__book-image"
        />
      </div>
      {children}
    </div>
  );
}

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

function CourtBook({ decision }: { decision: CourtDecision }) {
  const [verdicts, setVerdicts] = useState<AgentVerdict[]>([]);
  const [bicker, setBicker] = useState<BickerTurn[]>([]);
  const [userInput, setUserInput] = useState("");
  const [actor, setActor] = useState("");
  const [judgement, setJudgement] = useState<HumanJudgement>(null);
  const [paperTrail, setPaperTrail] = useState<PaperTrailLine[]>([]);
  const [openVerdictRoleId, setOpenVerdictRoleId] = useState<CourtRoleId | null>(null);
  const [showJudgement, setShowJudgement] = useState(false);
  const [isDeliberating, setIsDeliberating] = useState(false);
  const [bickering, setBickering] = useState(false);
  const [bickerCount, setBickerCount] = useState(0);
  const bickerfeedRef = useRef<HTMLDivElement>(null);
  const bickerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const conveneGuardRef = useRef<string | null>(null);
  const bickerInFlightRef = useRef<boolean>(false);

  // Convene: fetch initial verdicts and bicker (guarded against StrictMode double-mount)
  useEffect(() => {
    if (conveneGuardRef.current === decision.id) return;
    conveneGuardRef.current = decision.id;

    const revealTimers: NodeJS.Timeout[] = [];

    const convene = async () => {
      setIsDeliberating(true);
      try {
        const res = await fetch("/api/court/deliberate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: decision.title,
            context: decision.context,
            stakes: decision.stakes,
          }),
        });
        const data = await res.json();
        const incoming: AgentVerdict[] = data.verdicts || [];
        // Reveal verdicts one at a time, like ink drying on the page
        incoming.forEach((verdict, index) => {
          revealTimers.push(
            setTimeout(() => {
              setVerdicts((prev) => [...prev, verdict]);
              if (index === incoming.length - 1) setIsDeliberating(false);
            }, 700 + index * 1100),
          );
        });
        if (incoming.length === 0) setIsDeliberating(false);
      } catch (error) {
        console.error("Deliberation error:", error);
        setIsDeliberating(false);
      }

      await fetchBicker([]);
    };

    convene();
    return () => revealTimers.forEach(clearTimeout);
  }, [decision]);

  const fetchBicker = useCallback(
    async (currentTranscript: BickerTurn[], options?: { force?: boolean }) => {
      if (judgement) return;
      if (bickerInFlightRef.current && !options?.force) return;
      bickerInFlightRef.current = true;
      setBickering(true);
      try {
        const res = await fetch("/api/court/bicker", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: decision.title,
            context: decision.context,
            stakes: decision.stakes,
            transcript: currentTranscript,
          }),
        });
        const data = await res.json();
        if (data.turns && data.turns.length > 0) {
          setBicker((prev) => {
            const last4 = prev.slice(-4);
            const filtered = data.turns.filter((turn: BickerTurn) =>
              !last4.some((t) => t.roleId === turn.roleId && t.line === turn.line)
            );
            return filtered.length > 0 ? [...prev, ...filtered] : prev;
          });
          setBickerCount((prev) => prev + 1);
        }
      } catch (error) {
        console.error("Bicker error:", error);
      } finally {
        setBickering(false);
        bickerInFlightRef.current = false;
      }
    },
    [decision, judgement]
  );

  // Auto-bicker loop
  useEffect(() => {
    if (!openVerdictRoleId && !judgement && document.visibilityState === "visible" && bickerCount < 30) {
      const interval = setInterval(async () => {
        await fetchBicker(bicker);
      }, 15000);
      bickerIntervalRef.current = interval;
      return () => clearInterval(interval);
    }
  }, [openVerdictRoleId, judgement, bickerCount, bicker, fetchBicker]);

  // Auto-scroll bicker feed
  useEffect(() => {
    if (bickerfeedRef.current) {
      bickerfeedRef.current.scrollTop = bickerfeedRef.current.scrollHeight;
    }
  }, [bicker]);

  const handleSendToVerdictRoleId = (roleId: CourtRoleId) => {
    setOpenVerdictRoleId(roleId);
    if (bickerIntervalRef.current) clearInterval(bickerIntervalRef.current);
  };

  const handleCloseVerdict = async () => {
    setOpenVerdictRoleId(null);
    if (bickerCount < 30) {
      await fetchBicker(bicker);
    }
    if (!openVerdictRoleId && !judgement && document.visibilityState === "visible" && bickerCount < 30) {
      const interval = setInterval(async () => {
        await fetchBicker(bicker);
      }, 15000);
      bickerIntervalRef.current = interval;
    }
  };

  const handleUserMessage = async () => {
    if (!userInput.trim()) return;
    const newTurn: BickerTurn = { roleId: "user", line: userInput.trim() };
    setBicker((prev) => [...prev, newTurn]);
    setUserInput("");

    // The human always gets the floor: bypass the in-flight guard so an
    // auto-bicker cycle can't swallow their address to the bench.
    await fetchBicker([...bicker, newTurn], { force: true });
  };

  const recordJudgement = (choice: Exclude<HumanJudgement, null>) => {
    if (!actor.trim()) return;
    setJudgement(choice);
    setPaperTrail((prev) => [...prev, createJudgementPaperTrail(choice, actor.trim())]);
    if (bickerIntervalRef.current) clearInterval(bickerIntervalRef.current);
  };

  const docLine = judgement ? docExecutionLine(judgement) : null;
  const verdictMap = Object.fromEntries(verdicts.map((v) => [v.roleId, v]));
  const allVerdictsIn = verdicts.length === 5;

  return (
    <div className="platform-court__book-stage">
        <CourtBookArtwork>
          {/* Portrait hotspots */}
          {(["clive", "pam", "doc", "lazlo", "clive-man", "judge"] as CourtRoleId[]).map((roleId) => {
            const pos = COURT_BOOK_LAYOUT.portraits[roleId];
            const isJudge = roleId === "judge";
            return (
              <button
                key={roleId}
                aria-label={`${decision.roles.find((r) => r.id === roleId)?.name || roleId}`}
                onClick={() => !isJudge && handleSendToVerdictRoleId(roleId)}
                disabled={isJudge}
                className={`platform-court__portrait-hotspot${
                  isJudge ? " platform-court__portrait-hotspot--judge" : ""
                }`}
                style={{
                  left: `${pos.x}%`,
                  top: `${pos.y}%`,
                  transform: "translate(-50%, -50%)",
                }}
                title={isJudge ? "The Judge summarises; the Judge does not decide." : ""}
              />
            );
          })}

          {/* Verdict slots */}
          {(["clive", "pam", "doc", "lazlo", "clive-man"] as Exclude<CourtRoleId, "judge">[]).map(
            (roleId) => {
              const slot = COURT_BOOK_LAYOUT.verdictSlots[roleId];
              const verdict = verdictMap[roleId];
              return (
                <div
                  key={`slot-${roleId}`}
                  className="platform-court__verdict-slot"
                  style={{
                    left: `${slot.x}%`,
                    top: `${slot.y}%`,
                    width: `${slot.width}%`,
                    height: `${slot.height}%`,
                  }}
                >
                  {verdict ? (
                    <span className="platform-court__verdict-text">{verdict.verdict}</span>
                  ) : (
                    <span className="platform-court__verdict-placeholder">
                      {isDeliberating ? "⋯" : ""}
                    </span>
                  )}
                </div>
              );
            }
          )}

          {/* Right page content area */}
          <div
            className="platform-court__right-page-content"
            style={{
              left: `${COURT_BOOK_LAYOUT.rightPageContent.left}%`,
              top: `${COURT_BOOK_LAYOUT.rightPageContent.top}%`,
              width: `${COURT_BOOK_LAYOUT.rightPageContent.width}%`,
              height: `${COURT_BOOK_LAYOUT.rightPageContent.height}%`,
            }}
          >
            {openVerdictRoleId ? (
              <VerdictPanel
                roleId={openVerdictRoleId}
                role={decision.roles.find((r) => r.id === openVerdictRoleId)!}
                verdict={verdictMap[openVerdictRoleId]}
                onClose={handleCloseVerdict}
              />
            ) : (
              <>
                <div className="platform-court__bicker-head">
                  <h2 className="font-display text-xl font-semibold text-ink">{decision.title}</h2>
                </div>
                <div className="platform-court__bicker-feed" ref={bickerfeedRef}>
                  {bicker.map((turn, idx) => (
                    <div key={idx} className="platform-court__bicker-turn">
                      <span className="platform-court__bicker-speaker">
                        {turn.roleId === "user"
                          ? "You"
                          : decision.roles.find((r) => r.id === turn.roleId)?.name || turn.roleId}
                      </span>
                      : {turn.line}
                    </div>
                  ))}
                </div>
                <div className="platform-court__bicker-input">
                  <input
                    type="text"
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleUserMessage()}
                    placeholder="Address the bench…"
                    className="platform-court__input"
                  />
                  <button
                    onClick={handleUserMessage}
                    disabled={!userInput.trim()}
                    className="platform-court__inline-link"
                  >
                    Address the bench
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Plaque hotspot */}
          {allVerdictsIn && !judgement && (
            <button
              aria-label="Record judgement"
              onClick={() => setShowJudgement(true)}
              className="platform-court__plaque-hotspot platform-court__plaque-hotspot--active"
              style={{
                left: `${COURT_BOOK_LAYOUT.plaque.x}%`,
                top: `${COURT_BOOK_LAYOUT.plaque.y}%`,
                width: `${COURT_BOOK_LAYOUT.plaque.width}%`,
                height: `${COURT_BOOK_LAYOUT.plaque.height}%`,
              }}
            >
              <span className="platform-court__plaque-word">Decide</span>
            </button>
          )}
        </CourtBookArtwork>

      {showJudgement ? (
        <div
          className="platform-court__judgement-overlay"
          role="dialog"
          aria-label="Record judgement"
          onClick={() => setShowJudgement(false)}
        >
          <div
            className="platform-court__judgement-card"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="platform-court__judgement-head">
              <p className="platform-court__judgement-eyebrow">The bench has spoken — you give judgement</p>
              <button
                type="button"
                onClick={() => setShowJudgement(false)}
                className="platform-court__inline-link"
              >
                Close
              </button>
            </div>
            <p className="platform-court__judgement-summary">{decision.judgeSummary}</p>

            {!judgement ? (
              <>
                <label className="platform-court__field" htmlFor="court-actor-name">
                  <span className="platform-court__field-label">Your name</span>
                  <input
                    id="court-actor-name"
                    name="courtActor"
                    type="text"
                    value={actor}
                    onChange={(e) => setActor(e.target.value)}
                    autoComplete="off"
                    spellCheck={false}
                    className="platform-court__underline-input"
                    placeholder="Who is recording this judgement?…"
                  />
                </label>
                <div className="platform-court__judgement-actions">
                  <button
                    type="button"
                    disabled={!actor.trim()}
                    onClick={() => recordJudgement("approve")}
                    className="platform-court__seal-btn"
                  >
                    Approve
                  </button>
                  <button
                    type="button"
                    disabled={!actor.trim()}
                    onClick={() => recordJudgement("not-yet")}
                    className="platform-court__inline-link"
                  >
                    Not yet
                  </button>
                  <button
                    type="button"
                    disabled={!actor.trim()}
                    onClick={() => recordJudgement("escalate")}
                    className="platform-court__inline-link"
                  >
                    Send to another human
                  </button>
                </div>
              </>
            ) : (
              <div className="platform-court__judgement-recorded" aria-live="polite">
                <p className="platform-court__judgement-verdict">
                  Judgement recorded:{" "}
                  {judgement === "approve"
                    ? "Approved"
                    : judgement === "not-yet"
                      ? "Not yet"
                      : "Escalated"}
                </p>
                {docLine ? <p className="platform-court__judgement-docline">{docLine}</p> : null}
              </div>
            )}

            {paperTrail.length > 0 ? (
              <div className="platform-court__paper-trail">
                <p className="platform-court__field-label">Paper trail</p>
                <ul>
                  {paperTrail.map((line) => (
                    <li key={line.id}>
                      <p className="platform-court__paper-action">{line.action}</p>
                      <p className="platform-court__paper-meta">
                        {line.actor} · {formatWhen(line.timestamp)}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function VerdictPanel({
  roleId,
  role,
  verdict,
  onClose,
}: {
  roleId: CourtRoleId;
  role: CourtRole;
  verdict?: AgentVerdict;
  onClose: () => void;
}) {
  return (
    <div className="platform-court__verdict-panel-inner">
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="section-label">{role.title}</p>
          <h3 className="font-display font-semibold text-ink">{role.name}</h3>
        </div>
        <button onClick={onClose} className="text-sm text-ink-muted hover:text-ink">
          Return to bench
        </button>
      </div>
      {verdict ? (
        <>
          <p className="text-lg font-semibold text-ink mb-2">{verdict.verdict}</p>
          <p className="text-sm leading-relaxed text-ink">{verdict.summary}</p>
        </>
      ) : (
        <p className="text-sm text-ink-muted">Deliberating…</p>
      )}
    </div>
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
    <div className="platform-court__book-stage">
      <CourtBookArtwork>
        <div
          className="platform-court__right-page-content platform-court__intake"
          style={{
            left: `${COURT_BOOK_LAYOUT.rightPageContent.left}%`,
            top: `${COURT_BOOK_LAYOUT.rightPageContent.top}%`,
            width: `${COURT_BOOK_LAYOUT.rightPageContent.width}%`,
            height: `${COURT_BOOK_LAYOUT.rightPageContent.height}%`,
          }}
        >
          <div className="platform-court__intake-scroll">
            <div className="platform-court__intake-body">
              <h2 className="platform-court__intake-title">Bring a matter to the Court</h2>
              <p className="platform-court__intake-lede">
                The Court sits for consequential calls. If this is idle curiosity, take it to Clive
                first.
              </p>

              <form id="court-intake-form" onSubmit={handleSubmit} className="platform-court__intake-form">
              <label className="platform-court__field" htmlFor="matter-title">
                <span className="platform-court__field-label">
                  Matter title
                  <span className="platform-court__field-count">
                    {title.length}/{COURT_MATTER_LIMITS.title}
                  </span>
                </span>
                {/* A textarea (not an input) so long titles wrap onto a second
                    line instead of scrolling off the edge of the page. */}
                <textarea
                  id="matter-title"
                  value={title}
                  onChange={(e) =>
                    setTitle(e.target.value.replace(/\n/g, " ").slice(0, COURT_MATTER_LIMITS.title))
                  }
                  onKeyDown={(e) => {
                    if (e.key === "Enter") e.preventDefault();
                  }}
                  rows={1}
                  maxLength={COURT_MATTER_LIMITS.title}
                  className="platform-court__underline-input platform-court__underline-input--area platform-court__underline-input--title"
                  placeholder="Approve the off-script discount guardrail?…"
                  required
                />
              </label>
              <label className="platform-court__field" htmlFor="matter-context">
                <span className="platform-court__field-label">
                  Context
                  <span className="platform-court__field-count">
                    {context.length}/{COURT_MATTER_LIMITS.context}
                  </span>
                </span>
                <textarea
                  id="matter-context"
                  value={context}
                  onChange={(e) => setContext(e.target.value.slice(0, COURT_MATTER_LIMITS.context))}
                  maxLength={COURT_MATTER_LIMITS.context}
                  className="platform-court__underline-input platform-court__underline-input--area"
                  placeholder="What is the situation and why does it matter?…"
                  required
                />
              </label>
              <label className="platform-court__field" htmlFor="matter-stakes">
                <span className="platform-court__field-label">
                  Stakes
                  <span className="platform-court__field-count">
                    {stakes.length}/{COURT_MATTER_LIMITS.stakes}
                  </span>
                </span>
                <textarea
                  id="matter-stakes"
                  value={stakes}
                  onChange={(e) => setStakes(e.target.value.slice(0, COURT_MATTER_LIMITS.stakes))}
                  maxLength={COURT_MATTER_LIMITS.stakes}
                  className="platform-court__underline-input platform-court__underline-input--area"
                  placeholder="What happens if you decide wrong?…"
                  required
                />
              </label>
              </form>
            </div>

            <div className="platform-court__intake-actions">
              <button
                type="submit"
                form="court-intake-form"
                disabled={!title.trim() || !context.trim() || !stakes.trim()}
                className="platform-court__seal-btn"
              >
                Convene the Court
              </button>
              <button
                type="button"
                onClick={() => onDecisionSet(DEFAULT_COURT_DECISION)}
                className="platform-court__intake-sample platform-court__inline-link"
              >
                or hear the sample matter
              </button>
            </div>
          </div>
        </div>
      </CourtBookArtwork>
    </div>
  );
}

export function CourtShell() {
  const [decision, setDecision] = useState<CourtDecision | null>(null);

  return (
    <div className="court-stage">
      <header className="court-stage__header">
        <div>
          <p className="court-stage__label">The Court</p>
        </div>
        <Link href="/command/pam" className="court-stage__back-link">
          ← Leave the courtroom
        </Link>
      </header>

      <div className="court-stage__artwork">
        <div className="platform-court__book-stage">
          {decision ? (
            <CourtBook decision={decision} />
          ) : (
            <CourtIntake onDecisionSet={setDecision} />
          )}
        </div>
      </div>
    </div>
  );
}
