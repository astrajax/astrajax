"use client";

import Image from "next/image";
import Link from "next/link";
import {
  useEffect,
  useState,
  useCallback,
  useRef,
  useLayoutEffect,
  type CSSProperties,
  type ReactNode,
  type RefObject,
} from "react";
import {
  createJudgementPaperTrail,
  DEFAULT_COURT_DECISION,
  DEFAULT_BENCH,
  COURT_ATTENDANT_POOL,
  COURT_PORTRAIT_SRC,
  COURT_JUDGE_MEDIA,
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
import { usePlatformSession } from "@/components/platform-session/PlatformSessionProvider";
import { PlatformSessionControls } from "@/components/platform-session/PlatformSessionControls";
import type { PlatformTurnContext } from "@/lib/platform-activity/types";

// Art v2: the book ships BLANK — empty gilt frames, empty strips, blank
// brass. The cast are layers; the text is live; the Judge breathes.
const COURT_BOOK_IMAGE = "/agent-cast/court/court-book-blank-v3.jpg";
const JUDGE_VIDEO_WEBM_SRC = COURT_JUDGE_MEDIA.webm;
const JUDGE_VIDEO_MP4_SRC = COURT_JUDGE_MEDIA.mp4;
const JUDGE_POSTER_SRC = COURT_JUDGE_MEDIA.poster;

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

/** Stage-relative centre of a portrait cell — drives frame-ring sprite windows
 * from layout, not manifest x/y nudges. */
function useStageCenter(
  cellRef: RefObject<HTMLElement | null>,
  stageRef: RefObject<HTMLElement | null>,
) {
  const [center, setCenter] = useState({ x: 50, y: 50 });

  useLayoutEffect(() => {
    const update = () => {
      const cell = cellRef.current;
      const stage = stageRef.current;
      if (!cell || !stage) return;
      const cr = cell.getBoundingClientRect();
      const sr = stage.getBoundingClientRect();
      if (sr.width === 0 || sr.height === 0) return;
      setCenter({
        x: ((cr.left + cr.width / 2 - sr.left) / sr.width) * 100,
        y: ((cr.top + cr.height / 2 - sr.top) / sr.height) * 100,
      });
    };

    update();
    const ro = new ResizeObserver(update);
    if (cellRef.current) ro.observe(cellRef.current);
    if (stageRef.current) ro.observe(stageRef.current);
    window.addEventListener("resize", update);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", update);
    };
  }, [cellRef, stageRef]);

  return center;
}

/** Left-page roster — portrait column + verdict strips, centred in the
 * parchment content box via flex (not absolute left% on the full stage). */
function CourtLeftPageRoster({ children }: { children: ReactNode }) {
  return (
    <div className="platform-court__left-page">
      <div className="platform-court__roster">{children}</div>
    </div>
  );
}

function RosterRow({ children }: { children: ReactNode }) {
  return <div className="platform-court__roster-row">{children}</div>;
}

function PortraitCell({
  seat,
  stageRef,
  lit,
  children,
}: {
  seat: CourtBookSeat;
  stageRef: RefObject<HTMLElement | null>;
  lit?: boolean;
  children?: ReactNode;
}) {
  const cellRef = useRef<HTMLDivElement>(null);
  const center = useStageCenter(cellRef, stageRef);

  return (
    <div ref={cellRef} className="platform-court__portrait-cell">
      {children}
      <FrameRing seat={seat} center={center} />
      {lit ? <div aria-hidden className="platform-court__portrait-glow platform-court__portrait-glow--lit platform-court__portrait-glow--in-cell" /> : null}
    </div>
  );
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
 * lip shadow overlap the portrait's rim. Sprite offsets derive from the
 * portrait cell's layout centre, not manifest x coordinates. */
function FrameRing({
  seat,
  center,
}: {
  seat: CourtBookSeat;
  center: { x: number; y: number };
}) {
  const ring = COURT_BOOK_LAYOUT.portraitHotspot;
  const rx = ((seat.width / ring.width) * 50).toFixed(2);
  const ry = ((seat.height / ring.height) * 50).toFixed(2);
  const innerW = (100 / ring.width) * 100;
  const innerH = (100 / ring.height) * 100;
  const offX = (-(center.x - ring.width / 2) / ring.width) * 100;
  const offY = (-(center.y - ring.height / 2) / ring.height) * 100;
  return (
    <div
      aria-hidden
      className="platform-court__frame-ring platform-court__frame-ring--in-cell"
      style={
        {
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

/** Portrait art layer — fills its grid cell. */
function PortraitArt({ roleId }: { roleId: CourtAttendantId }) {
  return (
    <div aria-hidden className="platform-court__portrait-art platform-court__portrait-art--in-cell">
      <Image
        src={COURT_PORTRAIT_SRC[roleId]}
        alt=""
        fill
        sizes="5vw"
        className="platform-court__portrait-art-img"
      />
    </div>
  );
}

/** The Judge breathes inside his roster cell. */
function JudgeLoopInCell() {
  const [reducedMotion, setReducedMotion] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  return (
    <div aria-hidden className="platform-court__judge-loop platform-court__judge-loop--in-cell">
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
          poster={JUDGE_POSTER_SRC}
          autoPlay
          muted
          loop
          playsInline
        >
          <source src={JUDGE_VIDEO_WEBM_SRC} type="video/webm" />
          <source src={JUDGE_VIDEO_MP4_SRC} type="video/mp4" />
        </video>
      )}
    </div>
  );
}

/** One bench row: portrait cell + verdict strip (or picker hotspot at intake). */
function BenchRosterRow({
  seatIndex,
  seat,
  stageRef,
  roleId,
  lit,
  verdict,
  isDeliberating,
  finish,
  onPortraitClick,
  picking,
  pickLabel,
}: {
  seatIndex: number;
  seat: CourtBookSeat;
  stageRef: RefObject<HTMLElement | null>;
  roleId?: CourtAttendantId;
  lit?: boolean;
  verdict?: AgentVerdict;
  isDeliberating?: boolean;
  finish?: { tilt: string; ink: number };
  onPortraitClick?: () => void;
  picking?: boolean;
  pickLabel?: string;
}) {
  return (
    <RosterRow>
      <PortraitCell seat={seat} stageRef={stageRef} lit={lit}>
        {roleId ? <PortraitArt roleId={roleId} /> : null}
        {onPortraitClick ? (
          <button
            type="button"
            aria-label={pickLabel || roleById(roleId!)?.name || "Choose seat"}
            onClick={onPortraitClick}
            className={`platform-court__portrait-hotspot platform-court__portrait-hotspot--in-cell${
              picking ? " platform-court__portrait-hotspot--picking" : ""
            }`}
          />
        ) : null}
      </PortraitCell>
      {finish ? (
        <div
          className="platform-court__verdict-slot platform-court__verdict-slot--in-row"
          style={
            {
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
      ) : null}
    </RosterRow>
  );
}

/** Judge row — fixed sixth seat. */
function JudgeRosterRow({
  stageRef,
  lit,
}: {
  stageRef: RefObject<HTMLElement | null>;
  lit?: boolean;
}) {
  return (
    <RosterRow>
      <PortraitCell seat={COURT_BOOK_LAYOUT.judgeSeat} stageRef={stageRef} lit={lit}>
        <JudgeLoopInCell />
        <button
          aria-label="The Judge — summarises; does not decide"
          disabled
          className="platform-court__portrait-hotspot platform-court__portrait-hotspot--in-cell platform-court__portrait-hotspot--judge"
        />
      </PortraitCell>
      <div aria-hidden className="platform-court__judge-strip platform-court__judge-strip--in-row">
        <span className="platform-court__judge-strip-text">summarises; does not decide</span>
      </div>
    </RosterRow>
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
  const { beginTurn, headersFor, recordEvent } = usePlatformSession();
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
  const conveneTurnRef = useRef<PlatformTurnContext | null>(null);
  const courtCallIndexRef = useRef(5);

  const attendees = decision.attendees;

  const fetchBicker = useCallback(
    async (
      currentTranscript: BickerTurn[],
      options?: {
        force?: boolean;
        platformTurn?: PlatformTurnContext | null;
        userMessage?: string;
      },
    ) => {
      if (judgement) return;
      if (bickerInFlightRef.current && !options?.force) return;
      bickerInFlightRef.current = true;
      const platformTurn = options?.platformTurn ?? conveneTurnRef.current ?? (await beginTurn());
      const callIndex = courtCallIndexRef.current;
      courtCallIndexRef.current += 1;
      try {
        const res = await fetch("/api/court/bicker", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...headersFor(platformTurn),
          },
          body: JSON.stringify({
            title: decision.title,
            context: decision.context,
            stakes: decision.stakes,
            attendees: decision.attendees,
            transcript: currentTranscript,
            userMessage: options?.userMessage,
            callIndex,
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
    [beginTurn, decision, headersFor, judgement]
  );

  // Convene: fetch initial verdicts and bicker (guarded against StrictMode double-mount)
  useEffect(() => {
    if (conveneGuardRef.current === decision.id) return;
    conveneGuardRef.current = decision.id;

    const revealTimers: NodeJS.Timeout[] = [];

    const convene = async () => {
      setIsDeliberating(true);
      const platformTurn = await beginTurn();
      conveneTurnRef.current = platformTurn;
      courtCallIndexRef.current = 5;
      try {
        const res = await fetch("/api/court/deliberate", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...headersFor(platformTurn),
          },
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

      await fetchBicker([], { platformTurn });
    };

    convene();
    return () => revealTimers.forEach(clearTimeout);
  }, [beginTurn, decision, fetchBicker, headersFor]);

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
    const platformTurn = await beginTurn();
    await fetchBicker([...bicker, newTurn], {
      force: true,
      platformTurn,
      userMessage: newTurn.line,
    });
  };

  const recordJudgement = (choice: Exclude<HumanJudgement, null>) => {
    if (!actor.trim()) return;
    setJudgement(choice);
    setPaperTrail((prev) => [...prev, createJudgementPaperTrail(choice, actor.trim())]);
    void recordEvent({
      eventType: "Decision",
      summary: `Court judgement recorded: ${choice}`,
      outcome: choice,
      source: "court",
      detail: { matterId: decision.id, actor: actor.trim() },
    });
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
  const stageRef = useRef<HTMLDivElement>(null);

  return (
    <div className="platform-court__book-stage" ref={stageRef}>
      <CourtBookArtwork>
        <CourtLeftPageRoster>
          {COURT_BOOK_LAYOUT.seats.map((seat, seatIndex) => {
            const roleId = attendees[seatIndex];
            if (!roleId) return null;
            return (
              <BenchRosterRow
                key={`bench-row-${seatIndex}`}
                seatIndex={seatIndex}
                seat={seat}
                stageRef={stageRef}
                roleId={roleId}
                lit={glowRoleId === roleId}
                verdict={verdictMap[roleId]}
                isDeliberating={isDeliberating}
                finish={SLOT_FINISH[seatIndex]}
                onPortraitClick={() => setOpenVerdictRoleId(roleId)}
                pickLabel={roleById(roleId)?.name || roleId}
              />
            );
          })}
          <JudgeRosterRow stageRef={stageRef} lit={glowRoleId === "judge"} />
        </CourtLeftPageRoster>

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
  const stageRef = useRef<HTMLDivElement>(null);

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
    <div className="platform-court__book-stage" ref={stageRef}>
      <CourtBookArtwork>
        <CourtLeftPageRoster>
          {COURT_BOOK_LAYOUT.seats.map((seat, seatIndex) => {
            const occupant = bench[seatIndex];
            const picking = pickerSeat === seatIndex;
            return (
              <BenchRosterRow
                key={`intake-row-${seatIndex}`}
                seatIndex={seatIndex}
                seat={seat}
                stageRef={stageRef}
                roleId={occupant}
                onPortraitClick={() => setPickerSeat(picking ? null : seatIndex)}
                picking={picking}
                pickLabel={`Seat ${seatIndex + 1} — ${occupant ? roleById(occupant)?.name : "empty"}. Choose who sits.`}
              />
            );
          })}
          <JudgeRosterRow stageRef={stageRef} />
        </CourtLeftPageRoster>

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
                    rows={2}
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
                    rows={2}
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
            // Above the brass, on blank parchment — sits in the reserved
            // band between the form box and the plaque (not over inputs).
            left: `${plaque.x + plaque.width / 2}%`,
            top: `${plaque.y - 3.2}%`,
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
        <div className="flex flex-wrap items-center justify-end gap-3">
          <PlatformSessionControls compact />
          <Link href="/command/pam" className="court-stage__back-link">
            ← Leave the courtroom
          </Link>
        </div>
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
