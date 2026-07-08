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
  DEFAULT_BENCH,
  COURT_ATTENDANT_POOL,
  COURT_PORTRAIT_SRC,
  COURT_ROLES,
  docExecutionLine,
  conveneMatter,
  COURT_BOOK_LAYOUT,
  COURT_MATTER_LIMITS,
  type CourtAttendantId,
  type CourtBookSeat,
  type CourtDecision,
  type CourtRole,
  type CourtMatter,
  type HumanJudgement,
  type AgentVerdict,
  type BickerTurn,
  type CourtRoleId,
} from "@/lib/platform/court";
import type { PaperTrailLine } from "@/lib/platform/brain-health";

// Art v2: the book ships BLANK — empty gilt frames, empty strips, blank
// brass. The cast are layers; the text is live; the Judge breathes.
const COURT_BOOK_IMAGE = "/agent-cast/court/court-book-blank.jpg";
const JUDGE_VIDEO_SRC = "/agent-cast/court/court-judge.mp4";
const JUDGE_POSTER_SRC = "/agent-cast/court/court-judge-poster.jpg";

// A 16×9 thumb of the blank book — canvas emerging through varnish.
const COURT_BOOK_BLUR = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAA4KCw0LCQ4NDA0QDw4RFiQXFhQUFiwgIRokNC43NjMuMjI6QVNGOj1OPjIySGJJTlZYXV5dOEVmbWVabFNbXVn/2wBDAQ8QEBYTFioXFypZOzI7WVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVn/wAARCAAJABADASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwC/ohX+yoiygna3J57Vemkg/sOWMCMuLY5XHI+WuFg/1Ef0p3/Lu3+5/SuTlOq5/9k=";

// Written-by-hand variance per SEAT (positions, not names — whoever sits
// in seat three inherits seat three's hand).
const SLOT_FINISH: Array<{ tilt: string; ink: number }> = [
  { tilt: "-0.35deg", ink: 0.84 },
  { tilt: "0.25deg", ink: 0.8 },
  { tilt: "0.4deg", ink: 0.86 },
  { tilt: "-0.2deg", ink: 0.78 },
  { tilt: "0.3deg", ink: 0.82 },
];

// The plaque hotspot/glow use the FULL ornament box (a forgiving click
// target and a glow that lights the whole casting). The engraved word
// centres on plaqueFace instead — the recessed wood panel, measured
// directly, which the crest ornament above pulls the ornament's own
// centre away from. This computes plaqueFace as a position/size relative
// to the plaque box, so the word wrapper can sit inside the button
// without fighting its flex-centering.
const PLAQUE_FACE_STYLE: CSSProperties = {
  position: "absolute",
  left: `${((COURT_BOOK_LAYOUT.plaqueFace.x - COURT_BOOK_LAYOUT.plaque.x) / COURT_BOOK_LAYOUT.plaque.width) * 100}%`,
  top: `${((COURT_BOOK_LAYOUT.plaqueFace.y - COURT_BOOK_LAYOUT.plaque.y) / COURT_BOOK_LAYOUT.plaque.height) * 100}%`,
  width: `${(COURT_BOOK_LAYOUT.plaqueFace.width / COURT_BOOK_LAYOUT.plaque.width) * 100}%`,
  height: `${(COURT_BOOK_LAYOUT.plaqueFace.height / COURT_BOOK_LAYOUT.plaque.height) * 100}%`,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

function roleById(id: CourtRoleId): CourtRole | undefined {
  return COURT_ROLES.find((r) => r.id === id);
}

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

/** A window onto the book painting itself, masked to the annulus of one
 * frame's gilt — laid ABOVE a seat's portrait so the painted ring and its
 * lip shadow overlap the portrait's rim. The frame hides the seam, as
 * frames always have. Inside the window sits a full-stage copy of the
 * same next/image rendition (sprite-window offsets from the manifest), so
 * the ring is pixel-identical to the background it continues. */
function FrameRing({ seat }: { seat: CourtBookSeat }) {
  const ring = COURT_BOOK_LAYOUT.portraitHotspot;
  // Opening half-extents as radii of the mask ellipse, relative to the box.
  const rx = ((seat.width / ring.width) * 50).toFixed(2);
  const ry = ((seat.height / ring.height) * 50).toFixed(2);
  // Sprite-window: a stage-sized inner layer offset so this window shows
  // exactly its own patch of the painting.
  const innerW = (100 / ring.width) * 100;
  const innerH = (100 / ring.height) * 100;
  const offX = (-(seat.x - ring.width / 2) / ring.width) * 100;
  const offY = (-(seat.y - ring.height / 2) / ring.height) * 100;
  return (
    <div
      aria-hidden
      className="platform-court__frame-ring"
      style={
        {
          left: `${seat.x}%`,
          top: `${seat.y}%`,
          width: `${ring.width}%`,
          height: `${ring.height}%`,
          "--ring-rx": `${rx}%`,
          "--ring-ry": `${ry}%`,
        } as CSSProperties
      }
    >
      <div
        className="platform-court__frame-ring-inner"
        style={{
          width: `${innerW.toFixed(3)}%`,
          height: `${innerH.toFixed(3)}%`,
          left: `${offX.toFixed(3)}%`,
          top: `${offY.toFixed(3)}%`,
        }}
      >
        <Image
          src={COURT_BOOK_IMAGE}
          alt=""
          fill
          sizes="100vw"
          className="platform-court__book-image"
        />
      </div>
    </div>
  );
}

/** The seated bench — one oval portrait layer per occupied seat, inside
 * the painted gilt frames, each overdrawing its opening slightly; the
 * frame-ring windows then lay the painting back over every rim. Scenery,
 * not controls: hotspots sit above. */
function BenchPortraits({ bench }: { bench: CourtAttendantId[] }) {
  const over = COURT_BOOK_LAYOUT.portraitOvershoot;
  return (
    <>
      {COURT_BOOK_LAYOUT.seats.map((pos, seat) => {
        const roleId = bench[seat];
        if (!roleId) return null; // an empty frame reads as a vacant seat
        return (
          <div
            key={`seat-art-${seat}`}
            aria-hidden
            className="platform-court__portrait-art"
            style={{
              left: `${pos.x}%`,
              top: `${pos.y}%`,
              width: `${pos.width + over.width}%`,
              height: `${pos.height + over.height}%`,
            }}
          >
            <Image
              src={COURT_PORTRAIT_SRC[roleId]}
              alt=""
              fill
              sizes="5vw"
              className="platform-court__portrait-art-img"
            />
          </div>
        );
      })}
      <JudgeLoop />
      {COURT_BOOK_LAYOUT.seats.map((seat, i) =>
        bench[i] ? <FrameRing key={`ring-${i}`} seat={seat} /> : null
      )}
      <FrameRing seat={COURT_BOOK_LAYOUT.judgeSeat} />
    </>
  );
}

/** The Judge breathes. A 16s seamless loop, masked to its interior oval
 * and seated behind the painted frame like any other portrait layer —
 * every seat is an art layer; his happens to move. Reduced motion (or a
 * video that never arrives) leaves the frame-zero poster: the painting,
 * still. */
function JudgeLoop() {
  const [reducedMotion, setReducedMotion] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const pos = COURT_BOOK_LAYOUT.judgeSeat;
  const size = COURT_BOOK_LAYOUT.judgeVideo;
  return (
    <div
      aria-hidden
      className="platform-court__judge-loop"
      style={{
        left: `${pos.x}%`,
        top: `${pos.y}%`,
        width: `${size.width}%`,
        height: `${size.height}%`,
      }}
    >
      {reducedMotion ? (
        <Image
          src={JUDGE_POSTER_SRC}
          alt=""
          fill
          sizes="8vw"
          className="platform-court__judge-media"
        />
      ) : (
        <video
          className="platform-court__judge-media"
          src={JUDGE_VIDEO_SRC}
          poster={JUDGE_POSTER_SRC}
          autoPlay
          muted
          loop
          playsInline
        />
      )}
    </div>
  );
}

/** Warm lamplight over a painted miniature — masked radial, screen-blended,
 * faded in by opacity when its occupant speaks. */
function SeatGlow({ pos, lit }: { pos: { x: number; y: number }; lit: boolean }) {
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

function formatWhen(iso: string): string {
  try {
    return new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short" }).format(
      new Date(iso),
    );
  } catch {
    return iso;
  }
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

  const attendees = decision.attendees;

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
            attendees: decision.attendees,
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
            attendees: decision.attendees,
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
  const allVerdictsIn =
    attendees.length > 0 && verdicts.length === attendees.length;

  // The lamplight follows the floor: an open verdict panel wins; otherwise
  // the latest cast voice in the bicker.
  const lastAgentTurn = [...bicker].reverse().find((t) => t.roleId !== "user");
  const glowRoleId: CourtRoleId | null =
    openVerdictRoleId ?? ((lastAgentTurn?.roleId as CourtRoleId | undefined) ?? null);

  const plaque = COURT_BOOK_LAYOUT.plaque;
  const slot = COURT_BOOK_LAYOUT.slot;

  return (
    <div className="platform-court__book-stage">
      <CourtBookArtwork>
        <BenchPortraits bench={attendees} />

        {/* Lamplight layers — per seat + the Judge's frame */}
        {COURT_BOOK_LAYOUT.seats.map((pos, seat) => (
          <SeatGlow
            key={`glow-${seat}`}
            pos={pos}
            lit={attendees[seat] !== undefined && glowRoleId === attendees[seat]}
          />
        ))}
        <SeatGlow pos={COURT_BOOK_LAYOUT.judgeSeat} lit={glowRoleId === "judge"} />

        {/* Portrait hotspots — oval hit areas over the occupied frames */}
        {COURT_BOOK_LAYOUT.seats.map((pos, seat) => {
          const roleId = attendees[seat];
          if (!roleId) return null;
          return (
            <button
              key={`hotspot-${seat}`}
              aria-label={roleById(roleId)?.name || roleId}
              onClick={() => setOpenVerdictRoleId(roleId)}
              className="platform-court__portrait-hotspot"
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
        <button
          aria-label="The Judge — summarises; does not decide"
          disabled
          className="platform-court__portrait-hotspot platform-court__portrait-hotspot--judge"
          style={{
            left: `${COURT_BOOK_LAYOUT.judgeSeat.x}%`,
            top: `${COURT_BOOK_LAYOUT.judgeSeat.y}%`,
            width: `${COURT_BOOK_LAYOUT.portraitHotspot.width}%`,
            height: `${COURT_BOOK_LAYOUT.portraitHotspot.height}%`,
            transform: "translate(-50%, -50%)",
          }}
        />

        {/* Verdict slots — engraved entries beside each occupied seat */}
        {COURT_BOOK_LAYOUT.seats.map((pos, seat) => {
          const roleId = attendees[seat];
          if (!roleId) return null;
          const verdict = verdictMap[roleId];
          const finish = SLOT_FINISH[seat];
          return (
            <div
              key={`slot-${seat}`}
              className="platform-court__verdict-slot"
              style={
                {
                  left: `${slot.x}%`,
                  top: `${pos.slotY}%`,
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

        {/* The judge's strip — his standing line, written into the record */}
        <div
          aria-hidden
          className="platform-court__judge-strip"
          style={{
            left: `${COURT_BOOK_LAYOUT.judgeSlot.x}%`,
            top: `${COURT_BOOK_LAYOUT.judgeSeat.slotY}%`,
            width: `${COURT_BOOK_LAYOUT.judgeSlot.width}%`,
            height: `${COURT_BOOK_LAYOUT.judgeSlot.height}%`,
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
              role={roleById(openVerdictRoleId)!}
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
                        : roleById(turn.roleId as CourtRoleId)?.name || turn.roleId}
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

        {/* The plaque — the Court's one seal of action. */}
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
              <span style={PLAQUE_FACE_STYLE}>
                <span className="platform-court__plaque-word">Decide</span>
              </span>
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

/** Choose who takes this seat — the pool laid out as a parchment roster.
 * Picking someone already seated elsewhere swaps the two seats. */
function SeatPicker({
  bench,
  seat,
  onPick,
  onClose,
}: {
  bench: CourtAttendantId[];
  seat: number;
  onPick: (candidate: CourtAttendantId) => void;
  onClose: () => void;
}) {
  const current = bench[seat];
  return (
    <div className="platform-court__seat-picker">
      <div className="platform-court__judgement-head">
        <p className="platform-court__judgement-eyebrow">
          Who takes seat {seat + 1}?
        </p>
        <button type="button" onClick={onClose} className="platform-court__inline-link">
          Return to the matter
        </button>
      </div>
      <ul className="platform-court__seat-picker-list">
        {COURT_ATTENDANT_POOL.map((id) => {
          const role = roleById(id)!;
          const seatedAt = bench.indexOf(id);
          const isCurrent = id === current;
          return (
            <li key={id}>
              <button
                type="button"
                onClick={() => onPick(id)}
                disabled={isCurrent}
                className={`platform-court__seat-candidate${
                  isCurrent ? " platform-court__seat-candidate--current" : ""
                }`}
              >
                <span className="platform-court__seat-candidate-thumb" aria-hidden>
                  <Image
                    src={COURT_PORTRAIT_SRC[id]}
                    alt=""
                    fill
                    sizes="48px"
                    className="platform-court__seat-candidate-img"
                  />
                </span>
                <span className="platform-court__seat-candidate-copy">
                  <span className="platform-court__seat-candidate-name">{role.name}</span>
                  <span className="platform-court__seat-candidate-title">{role.title}</span>
                </span>
                <span className="platform-court__seat-candidate-state">
                  {isCurrent
                    ? "this seat"
                    : seatedAt >= 0
                      ? "seated — will swap"
                      : ""}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
      <p className="platform-court__seat-picker-note">
        The Judge attends every session. He summarises; he does not decide.
      </p>
    </div>
  );
}

function CourtIntake({ onDecisionSet }: { onDecisionSet: (d: CourtDecision) => void }) {
  const [title, setTitle] = useState("");
  const [context, setContext] = useState("");
  const [stakes, setStakes] = useState("");
  const [bench, setBench] = useState<CourtAttendantId[]>([...DEFAULT_BENCH]);
  const [pickerSeat, setPickerSeat] = useState<number | null>(null);

  const valid = Boolean(title.trim() && context.trim() && stakes.trim());
  const plaque = COURT_BOOK_LAYOUT.plaque;

  const handlePick = (candidate: CourtAttendantId) => {
    if (pickerSeat === null) return;
    setBench((prev) => {
      const next = [...prev];
      const existingSeat = next.indexOf(candidate);
      if (existingSeat >= 0 && existingSeat !== pickerSeat) {
        // The candidate is already on the bench: the two occupants swap seats.
        next[existingSeat] = next[pickerSeat];
      }
      next[pickerSeat] = candidate;
      return next;
    });
    setPickerSeat(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid) return;

    const matter: CourtMatter = { title: title.trim(), context: context.trim(), stakes: stakes.trim() };
    onDecisionSet(conveneMatter(matter, bench));
  };

  return (
    <div className="platform-court__book-stage">
      <CourtBookArtwork>
        <BenchPortraits bench={bench} />

        {/* Seat hotspots — at intake the frames are how you choose the bench */}
        {COURT_BOOK_LAYOUT.seats.map((pos, seat) => {
          const occupant = roleById(bench[seat]);
          const picking = pickerSeat === seat;
          return (
            <button
              key={`seat-pick-${seat}`}
              type="button"
              aria-label={`Seat ${seat + 1} — ${occupant?.name || "empty"}. Choose who sits.`}
              onClick={() => setPickerSeat(picking ? null : seat)}
              className={`platform-court__portrait-hotspot${
                picking ? " platform-court__portrait-hotspot--picking" : ""
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

        <div
          className="platform-court__right-page-content platform-court__intake"
          style={{
            left: `${COURT_BOOK_LAYOUT.rightPageContent.left}%`,
            top: `${COURT_BOOK_LAYOUT.rightPageContent.top}%`,
            width: `${COURT_BOOK_LAYOUT.rightPageContent.width}%`,
            height: `${COURT_BOOK_LAYOUT.rightPageContent.height}%`,
          }}
        >
          {pickerSeat !== null ? (
            <SeatPicker
              bench={bench}
              seat={pickerSeat}
              onPick={handlePick}
              onClose={() => setPickerSeat(null)}
            />
          ) : (
            <div className="platform-court__intake-scroll">
              <div className="platform-court__intake-body">
                <h2 className="platform-court__intake-title">Bring a matter to the Court</h2>
                <p className="platform-court__intake-lede">
                  The Court sits for consequential calls. If this is idle curiosity, take it to
                  Clive first. Five seats hear the matter — the standard bench is seated; touch
                  a portrait to change who attends. The Judge presides regardless.
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
          )}
        </div>

        {/* Convene lives ON the painted brass — the same plaque that carries
            DECIDE once the bench is in. One seal of action, both states. */}
        {valid && pickerSeat === null ? (
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
          disabled={!valid || pickerSeat !== null}
          aria-label="Convene the Court"
          className="platform-court__plaque-hotspot"
          style={{
            left: `${plaque.x}%`,
            top: `${plaque.y}%`,
            width: `${plaque.width}%`,
            height: `${plaque.height}%`,
          }}
        >
          <span style={PLAQUE_FACE_STYLE}>
            <span className="platform-court__plaque-word">Convene</span>
          </span>
        </button>
        <button
          type="button"
          onClick={() => onDecisionSet(DEFAULT_COURT_DECISION)}
          className="platform-court__plaque-under platform-court__inline-link"
          style={{
            // Above the brass, on blank parchment — below it is the book's
            // dark board, where ink would drown.
            left: `${plaque.x + plaque.width / 2}%`,
            top: `${plaque.y - 2.6}%`,
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
