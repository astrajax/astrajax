"use client";

import Image from "next/image";
import Link from "next/link";
import {
  useEffect,
  useState,
  useCallback,
  useRef,
  type CSSProperties,
  type ReactNode,
} from "react";
import {
  createJudgementPaperTrail,
  DEFAULT_COURT_DECISION,
  docExecutionLine,
  conveneMatter,
  COURT_BOOK_LAYOUT,
  COURT_MATTER_LIMITS,
  type CourtDecision,
  type CourtRole,
  type CourtMatter,
  type HumanJudgement,
  type AgentVerdict,
  type BickerTurn,
  type CourtRoleId,
} from "@/lib/platform/court";
import type { PaperTrailLine } from "@/lib/platform/brain-health";

const COURT_BOOK_IMAGE = "/agent-cast/court/court-book.jpg";

// A 16×9 thumb of the painting — the canvas emerging through varnish while
// the full artwork loads.
const COURT_BOOK_BLUR = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAA4KCw0LCQ4NDA0QDw4RFiQXFhQUFiwgIRokNC43NjMuMjI6QVNGOj1OPjIySGJJTlZYXV5dOEVmbWVabFNbXVn/2wBDAQ8QEBYTFioXFypZOzI7WVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVn/wAARCAAJABADASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwCx4YKf2PHuUEgEZI9q0r9of+EdlXCEi3GRjkDFcLZf8eyVM/8Ax5n/AHa5XHU6bn//2Q==";

const BENCH_ROLE_IDS = ["clive", "pam", "doc", "lazlo", "clive-man"] as const;
const PORTRAIT_ROLE_IDS = [...BENCH_ROLE_IDS, "judge"] as const;

// Written-by-hand variance for the verdict entries: a whisper of tilt and ink
// weight per slot so five entries don't read machine-stamped. Values feed the
// --slot-tilt / --slot-ink custom properties in globals.css.
const SLOT_FINISH: Record<
  (typeof BENCH_ROLE_IDS)[number],
  { tilt: string; ink: number }
> = {
  clive: { tilt: "-0.35deg", ink: 0.84 },
  pam: { tilt: "0.25deg", ink: 0.8 },
  doc: { tilt: "0.4deg", ink: 0.86 },
  lazlo: { tilt: "-0.2deg", ink: 0.78 },
  "clive-man": { tilt: "0.3deg", ink: 0.82 },
};

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
          placeholder="blur"
          blurDataURL={COURT_BOOK_BLUR}
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

/** Warm lamplight over a painted miniature — a masked radial layer,
 * screen-blended over the oil, faded in by opacity when its role speaks. */
function PortraitGlow({ roleId, lit }: { roleId: CourtRoleId; lit: boolean }) {
  const pos = COURT_BOOK_LAYOUT.portraits[roleId];
  return (
    <div
      aria-hidden
      className={`platform-court__portrait-glow${
        lit ? " platform-court__portrait-glow--lit" : ""
      }`}
      style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
    />
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
  const [bickerCount, setBickerCount] = useState(0);
  const bickerfeedRef = useRef<HTMLDivElement>(null);
  const conveneGuardRef = useRef<string | null>(null);
  const bickerInFlightRef = useRef<boolean>(false);

  const fetchBicker = useCallback(
    async (currentTranscript: BickerTurn[], options?: { force?: boolean }) => {
      if (judgement) return;
      if (bickerInFlightRef.current && !options?.force) return;
      bickerInFlightRef.current = true;
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
        bickerInFlightRef.current = false;
      }
    },
    [decision, judgement]
  );

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
  }, [decision, fetchBicker]);

  // Auto-bicker loop. The effect owns the interval outright: it re-registers
  // whenever the bench view returns (verdict panel or judgement page closed),
  // so no handler needs to — and none should, or the Court double-ticks.
  useEffect(() => {
    if (
      !openVerdictRoleId &&
      !showJudgement &&
      !judgement &&
      document.visibilityState === "visible" &&
      bickerCount < 30
    ) {
      const interval = setInterval(async () => {
        await fetchBicker(bicker);
      }, 15000);
      return () => clearInterval(interval);
    }
  }, [openVerdictRoleId, showJudgement, judgement, bickerCount, bicker, fetchBicker]);

  // Auto-scroll bicker feed
  useEffect(() => {
    if (bickerfeedRef.current) {
      bickerfeedRef.current.scrollTop = bickerfeedRef.current.scrollHeight;
    }
  }, [bicker]);

  const handleCloseVerdict = async () => {
    setOpenVerdictRoleId(null);
    if (!judgement && bickerCount < 30) {
      await fetchBicker(bicker);
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
  };

  const verdictMap = Object.fromEntries(verdicts.map((v) => [v.roleId, v]));
  const allVerdictsIn = verdicts.length === 5;

  // The lamplight follows the floor: an open verdict panel wins; otherwise
  // the latest cast voice in the bicker.
  const lastAgentTurn = [...bicker].reverse().find((t) => t.roleId !== "user");
  const glowRoleId: CourtRoleId | null =
    openVerdictRoleId ?? ((lastAgentTurn?.roleId as CourtRoleId | undefined) ?? null);

  const judgeRole = decision.roles.find((r) => r.id === "judge");
  const plaque = COURT_BOOK_LAYOUT.plaque;

  return (
    <div className="platform-court__book-stage">
      <CourtBookArtwork>
        {/* Lamplight layers — one per miniature, lit for whoever holds the floor */}
        {PORTRAIT_ROLE_IDS.map((roleId) => (
          <PortraitGlow key={`glow-${roleId}`} roleId={roleId} lit={glowRoleId === roleId} />
        ))}

        {/* Portrait hotspots — oval hit areas matching the painted gilt frames */}
        {PORTRAIT_ROLE_IDS.map((roleId) => {
          const isJudge = roleId === "judge";
          const pos = COURT_BOOK_LAYOUT.portraits[roleId];
          return (
            <button
              key={roleId}
              aria-label={
                isJudge
                  ? `${judgeRole?.name || "The Judge"} — summarises; does not decide`
                  : `${decision.roles.find((r) => r.id === roleId)?.name || roleId}`
              }
              onClick={() => !isJudge && setOpenVerdictRoleId(roleId)}
              disabled={isJudge}
              className={`platform-court__portrait-hotspot${
                isJudge ? " platform-court__portrait-hotspot--judge" : ""
              }`}
              style={{
                left: `${pos.x}%`,
                top: `${pos.y}%`,
                width: `${COURT_BOOK_LAYOUT.portraitHotspot.width}%`,
                height: `${COURT_BOOK_LAYOUT.portraitHotspot.height}%`,
                transform: "translate(-50%, -50%)",
              }}
            />
          );
        })}

        {/* Verdict slots — engraved entries with per-slot tilt and ink weight */}
        {BENCH_ROLE_IDS.map((roleId) => {
          const slot = COURT_BOOK_LAYOUT.verdictSlots[roleId];
          const verdict = verdictMap[roleId];
          const finish = SLOT_FINISH[roleId];
          return (
            <div
              key={`slot-${roleId}`}
              className="platform-court__verdict-slot"
              style={
                {
                  left: `${slot.x}%`,
                  top: `${slot.y}%`,
                  width: `${slot.width}%`,
                  height: `${slot.height}%`,
                  "--slot-tilt": finish.tilt,
                  "--slot-ink": finish.ink,
                } as CSSProperties
              }
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
        })}

        {/* The judge's strip — his standing line, written into the record.
            The painting carries a sixth blank row beside his portrait; this
            is what it says. */}
        <div
          aria-hidden
          className="platform-court__judge-strip"
          style={{
            left: `${COURT_BOOK_LAYOUT.judgeStrip.x}%`,
            top: `${COURT_BOOK_LAYOUT.judgeStrip.y}%`,
            width: `${COURT_BOOK_LAYOUT.judgeStrip.width}%`,
            height: `${COURT_BOOK_LAYOUT.judgeStrip.height}%`,
          }}
        >
          <span className="platform-court__judge-strip-text">
            summarises; does not decide
          </span>
        </div>

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
              role={decision.roles.find((r) => r.id === openVerdictRoleId)!}
              verdict={verdictMap[openVerdictRoleId]}
              onClose={handleCloseVerdict}
            />
          ) : showJudgement || judgement ? (
            <JudgementPanel
              decision={decision}
              actor={actor}
              onActorChange={setActor}
              judgement={judgement}
              onRecord={recordJudgement}
              paperTrail={paperTrail}
              onBack={() => setShowJudgement(false)}
            />
          ) : (
            <>
              <div className="platform-court__bicker-head">
                <h2 className="platform-court__matter-title">{decision.title}</h2>
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

        {/* The plaque — the Court's one seal of action. When the bench is in,
            the brass carries DECIDE and glows for the human's judgement. */}
        {allVerdictsIn && !judgement && !showJudgement && (
          <>
            <div
              aria-hidden
              className="platform-court__plaque-glow"
              style={{
                left: `${plaque.x + plaque.width / 2}%`,
                top: `${plaque.y + plaque.height / 2}%`,
              }}
            />
            <button
              aria-label="Record judgement"
              onClick={() => setShowJudgement(true)}
              className="platform-court__plaque-hotspot"
              style={{
                left: `${plaque.x}%`,
                top: `${plaque.y}%`,
                width: `${plaque.width}%`,
                height: `${plaque.height}%`,
              }}
            >
              <span className="platform-court__plaque-word">Decide</span>
            </button>
          </>
        )}
      </CourtBookArtwork>
    </div>
  );
}

function VerdictPanel({
  role,
  verdict,
  onClose,
}: {
  role: CourtRole;
  verdict?: AgentVerdict;
  onClose: () => void;
}) {
  return (
    <div className="platform-court__verdict-panel-inner">
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="platform-court__field-label">{role.title}</p>
          <h3 className="platform-court__role-name">{role.name}</h3>
        </div>
        <button onClick={onClose} className="platform-court__inline-link">
          Return to the bench
        </button>
      </div>
      {verdict ? (
        <>
          <p className="platform-court__verdict-headline">{verdict.verdict}</p>
          <p className="text-sm leading-relaxed">{verdict.summary}</p>
        </>
      ) : (
        <p className="text-sm platform-court__muted">Deliberating…</p>
      )}
    </div>
  );
}

/** Judgement, written into the record on the right page — no modal, no
 * scrim. Approval lands with wax; declines are entered in ink. */
function JudgementPanel({
  decision,
  actor,
  onActorChange,
  judgement,
  onRecord,
  paperTrail,
  onBack,
}: {
  decision: CourtDecision;
  actor: string;
  onActorChange: (value: string) => void;
  judgement: HumanJudgement;
  onRecord: (choice: Exclude<HumanJudgement, null>) => void;
  paperTrail: PaperTrailLine[];
  onBack: () => void;
}) {
  const docLine = judgement ? docExecutionLine(judgement) : null;
  return (
    <div className="platform-court__judgement-page">
      <div className="platform-court__judgement-head">
        <p className="platform-court__judgement-eyebrow">
          The bench has spoken — you give judgement
        </p>
        {!judgement ? (
          <button type="button" onClick={onBack} className="platform-court__inline-link">
            Return to the bench
          </button>
        ) : null}
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
              onChange={(e) => onActorChange(e.target.value)}
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
              onClick={() => onRecord("approve")}
              className="platform-court__seal-btn"
            >
              Approve
            </button>
            <button
              type="button"
              disabled={!actor.trim()}
              onClick={() => onRecord("not-yet")}
              className="platform-court__inline-link"
            >
              Not yet
            </button>
            <button
              type="button"
              disabled={!actor.trim()}
              onClick={() => onRecord("escalate")}
              className="platform-court__inline-link"
            >
              Send to another human
            </button>
          </div>
        </>
      ) : (
        <div className="platform-court__judgement-recorded" aria-live="polite">
          {judgement === "approve" ? (
            <div className="platform-court__wax-seal" aria-hidden>
              <span className="platform-court__wax-seal-letter">A</span>
            </div>
          ) : null}
          <div>
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
  );
}

function CourtIntake({ onDecisionSet }: { onDecisionSet: (d: CourtDecision) => void }) {
  const [title, setTitle] = useState("");
  const [context, setContext] = useState("");
  const [stakes, setStakes] = useState("");

  const valid = Boolean(title.trim() && context.trim() && stakes.trim());
  const plaque = COURT_BOOK_LAYOUT.plaque;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid) return;

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
          </div>
        </div>

        {/* Convene lives ON the painted brass — the same plaque that carries
            DECIDE once the bench is in. One seal of action, both states. */}
        {valid ? (
          <div
            aria-hidden
            className="platform-court__plaque-glow"
            style={{
              left: `${plaque.x + plaque.width / 2}%`,
              top: `${plaque.y + plaque.height / 2}%`,
            }}
          />
        ) : null}
        <button
          type="submit"
          form="court-intake-form"
          disabled={!valid}
          aria-label="Convene the Court"
          className="platform-court__plaque-hotspot"
          style={{
            left: `${plaque.x}%`,
            top: `${plaque.y}%`,
            width: `${plaque.width}%`,
            height: `${plaque.height}%`,
          }}
        >
          <span className="platform-court__plaque-word">Convene</span>
        </button>
        <button
          type="button"
          onClick={() => onDecisionSet(DEFAULT_COURT_DECISION)}
          className="platform-court__plaque-under platform-court__inline-link"
          style={{
            // Above the brass, on blank parchment — below it is the book's
            // dark board, where ink would drown.
            left: `${plaque.x + plaque.width / 2}%`,
            top: `${plaque.y - 2.4}%`,
          }}
        >
          or hear the sample matter
        </button>
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
