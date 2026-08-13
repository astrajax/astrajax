"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  CAPTURE_SOURCE_LABEL,
  CAPTURE_SOURCE_TINT,
  isReceivingRecordActioned,
  type ReceivingRecord,
} from "@/lib/receiving-wall";
import { CliveChatSurface } from "@/components/chapter1/CliveChatSurface";
import { usePrefersReducedMotion } from "@/components/command-centre/usePortraitTransition";
import { acceptReceivingWallRecord } from "@/lib/brains/actions/receiving-wall-accept";
import { roomStaticMaskUrl } from "@/lib/man/receiving-wall-arch-mask";
import {
  DOLLY_IN_DEFAULT,
  DOLLY_IN_LADDER,
  HOTSPOTS,
  INTERIOR_PORTAL,
  INTERIOR_WALL,
} from "@/lib/man/receiving-wall-manifest";
import {
  HEALTH_BAND_STILL_SRC,
  shrineArtForBand,
} from "@/lib/platform/brains";
import type { ChatMessage } from "@/lib/clive/types";
import type { PlatformTurnContext } from "@/lib/platform-activity/types";
import {
  HEALTH_BAND_WORD_TINT,
  OPERATOR_PORTAL_DOORS,
  brainBandLine,
  defaultReportLetterId,
  featuredBrain,
  isOperatorPortalId,
  mergeOperatorWallPayload,
  pendingDraftsForJudgement,
  portalDoor,
  portalRightMark,
  wallHonestyNote,
  type OperatorPortalId,
  type OperatorWallPayload,
  type PortalQueueItem,
  type PortalReportLetter,
} from "./receiving-wall-portals";
import styles from "./receiving-wall.module.css";

/**
 * Portal — slow centre push; bay reading scrolls the interior behind a pinned arch.
 *
 * Operator portals v1: idle = three job doors (Judgement / Brain health / This morning).
 * Zoomed bay layouts differ by portal; camera grammar unchanged.
 *
 *   idle     — wide wall at dolly 1 + portal doors (paint still; list scrolls in aperture)
 *   exiting  — ledger fading (nave only)
 *   zooming  — slow scale into centre (same video/poster — no still swap)
 *   zoomedIn — interior paint + bay type travel together; arch/sill stay pinned
 *   returning— bay fades; camera holds close until RETURN_MS
 *   settling — slow pull-back; ledger held out until SETTLE_MS
 *
 * Layers on .plate: travelling interior → roomStatic (luminance hole) → sill belt.
 * Spec: website/docs/receiving-wall-portal-spec.md
 * Brief: docs/initiatives/receiving-wall-operator-portals-v1.md
 */
type Beat = "idle" | "exiting" | "zooming" | "zoomedIn" | "returning" | "settling";

const TIMINGS = {
  normal: { EXIT: 220, ARRIVE: 2500, RETURN: 260, SETTLE: 1700 },
  reduced: { EXIT: 120, ARRIVE: 240, RETURN: 120, SETTLE: 240 },
} as const;

type AcceptState = "idle" | "pending" | "success" | "error";

type LetterKind = "draft" | "queue" | "report";

function createSessionId(): string {
  return `rw_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function parseDollyParam(raw: string | null): number {
  if (!raw) return DOLLY_IN_DEFAULT;
  const n = Number.parseFloat(raw);
  if (!Number.isFinite(n)) return DOLLY_IN_DEFAULT;
  return (DOLLY_IN_LADDER as readonly number[]).includes(n) ? n : DOLLY_IN_DEFAULT;
}

export function ReceivingWall({
  customAcceptStatus,
}: {
  /** Server-resolved accept status; required for custom env values in the browser. */
  customAcceptStatus?: string;
} = {}) {
  const searchParams = useSearchParams();
  const dollyIn169 = parseDollyParam(searchParams.get("dolly"));

  const prefersReducedMotion = usePrefersReducedMotion();
  const T = prefersReducedMotion ? TIMINGS.reduced : TIMINGS.normal;

  const [isNave, setIsNave] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-aspect-ratio: 6/5)");
    const sync = () => setIsNave(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  const [data, setData] = useState<OperatorWallPayload | null>(null);
  const [beat, setBeat] = useState<Beat>("idle");
  /** Operator portal id when zoomed. */
  const [zoomed, setZoomed] = useState<OperatorPortalId | null>(null);
  const [openLetterId, setOpenLetterId] = useState<string | null>(null);
  const [openLetterKind, setOpenLetterKind] = useState<LetterKind | null>(null);
  const [cliveOpen, setCliveOpen] = useState(false);
  const [sessionId] = useState(createSessionId);
  const [chatSeed, setChatSeed] = useState<ChatMessage[]>([]);
  const [cliveFocusedRecord, setCliveFocusedRecord] = useState<ReceivingRecord | null>(null);
  const [cliveContextRecords, setCliveContextRecords] = useState<ReceivingRecord[]>([]);
  const [acceptState, setAcceptState] = useState<AcceptState>("idle");
  const [acceptError, setAcceptError] = useState<string | null>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const openLetterIdRef = useRef<string | null>(null);
  openLetterIdRef.current = openLetterId;
  const interiorViewportRef = useRef<HTMLDivElement>(null);
  const plateRef = useRef<HTMLDivElement>(null);
  const bayWindowRef = useRef<HTMLDivElement>(null);
  const bayTravelRef = useRef<HTMLDivElement>(null);
  const [readOffset, setReadOffset] = useState(0);
  const readOffsetRef = useRef(0);
  readOffsetRef.current = readOffset;
  const touchStartY = useRef<number | null>(null);
  const touchStartOffset = useRef(0);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const wallResponse = await fetch("/api/brains/receiving-wall");
        const wallJson = (await wallResponse.json()) as Partial<OperatorWallPayload> & {
          error?: string;
        };
        if (!cancelled && wallResponse.ok) {
          setData(mergeOperatorWallPayload(wallJson));
        } else if (!cancelled) {
          setData(
            mergeOperatorWallPayload({
              source: "seed",
              message:
                wallJson.error ||
                "Could not read the wall — showing seeded portals so the room is never blank.",
            }),
          );
        }
      } catch {
        if (!cancelled) {
          setData(mergeOperatorWallPayload({ source: "seed" }));
        }
      }
    })();
    return () => {
      cancelled = true;
      timers.current.forEach(clearTimeout);
      timers.current = [];
    };
  }, []);

  const clearPending = useCallback(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  }, []);

  const after = useCallback((ms: number, fn: () => void) => {
    const id = setTimeout(fn, ms);
    timers.current.push(id);
  }, []);

  const payload = data ?? mergeOperatorWallPayload({ source: "seed" });
  const records = payload.records;
  const pendingDrafts = pendingDraftsForJudgement(records, customAcceptStatus);

  const openDraft =
    openLetterKind === "draft" && openLetterId
      ? (records.find((r) => r.recordId === openLetterId) ?? null)
      : null;
  const openQueue =
    openLetterKind === "queue" && openLetterId
      ? ([...payload.held, ...payload.proposals].find((r) => r.recordId === openLetterId) ??
        null)
      : null;
  const openReport =
    openLetterKind === "report" && openLetterId
      ? (payload.reports.find((r) => r.recordId === openLetterId) ?? null)
      : null;

  const measureReadTravel = useCallback(() => {
    const windowEl = bayWindowRef.current;
    const travelEl = bayTravelRef.current;
    if (!windowEl || !travelEl) return 0;
    return Math.max(0, travelEl.scrollHeight - windowEl.clientHeight);
  }, []);

  const clampReadOffset = useCallback(
    (next: number) => Math.max(0, Math.min(next, measureReadTravel())),
    [measureReadTravel],
  );

  const applyReadDelta = useCallback(
    (delta: number) => {
      setReadOffset((current) => clampReadOffset(current + delta));
    },
    [clampReadOffset],
  );

  const scrollFocusedIntoView = useCallback(() => {
    const windowEl = bayWindowRef.current;
    const travelEl = bayTravelRef.current;
    const focused = document.activeElement;
    if (!windowEl || !travelEl || !(focused instanceof HTMLElement)) return;
    if (!travelEl.contains(focused)) return;

    const windowRect = windowEl.getBoundingClientRect();
    const focusRect = focused.getBoundingClientRect();
    const pad = 12;

    if (focusRect.top < windowRect.top + pad) {
      setReadOffset((current) =>
        clampReadOffset(current - (windowRect.top + pad - focusRect.top)),
      );
    } else if (focusRect.bottom > windowRect.bottom - pad) {
      setReadOffset((current) =>
        clampReadOffset(current + (focusRect.bottom - (windowRect.bottom - pad))),
      );
    }
  }, [clampReadOffset]);

  const toggleLetter = useCallback((id: string, kind: LetterKind) => {
    setOpenLetterId((current) => {
      if (current === id) {
        setOpenLetterKind(null);
        return null;
      }
      setOpenLetterKind(kind);
      return id;
    });
  }, []);

  const openPortal = useCallback(
    (portalId: OperatorPortalId) => {
      if (beat === "exiting" || beat === "zooming" || beat === "returning") return;

      const beginZoom = () => {
        clearPending();
        setOpenLetterId(null);
        setOpenLetterKind(null);
        setReadOffset(0);
        setZoomed(portalId);
        setBeat("zooming");
        after(T.ARRIVE, () => setBeat("zoomedIn"));
      };

      if (beat === "settling") {
        clearPending();
        setOpenLetterId(null);
        setOpenLetterKind(null);
        setZoomed(null);
        if (!isNave) {
          beginZoom();
          return;
        }
        setBeat("exiting");
        after(T.EXIT, beginZoom);
        return;
      }

      if (beat === "zoomedIn") {
        if (portalId === zoomed) return;
        clearPending();
        setOpenLetterId(null);
        setOpenLetterKind(null);
        setZoomed(portalId);
        setBeat("zooming");
        after(T.EXIT, () => setBeat("zoomedIn"));
        return;
      }

      if (!isNave) {
        beginZoom();
        return;
      }

      clearPending();
      setOpenLetterId(null);
      setOpenLetterKind(null);
      setBeat("exiting");
      after(T.EXIT, beginZoom);
    },
    [beat, zoomed, after, clearPending, T.EXIT, T.ARRIVE, isNave],
  );

  const closeZoom = useCallback(() => {
    if (beat === "exiting") {
      clearPending();
      setBeat("idle");
      return;
    }
    if (beat === "zooming") {
      clearPending();
      setOpenLetterId(null);
      setOpenLetterKind(null);
      setZoomed(null);
      setBeat("idle");
      return;
    }
    if (beat === "returning" || beat === "settling") {
      clearPending();
      setOpenLetterId(null);
      setOpenLetterKind(null);
      setZoomed(null);
      setBeat("idle");
      return;
    }
    if (beat !== "zoomedIn") return;
    clearPending();
    setOpenLetterId(null);
    setOpenLetterKind(null);
    setReadOffset(0);
    setBeat("returning");
    after(T.RETURN, () => {
      setZoomed(null);
      setBeat("settling");
    });
    after(T.SETTLE, () => setBeat("idle"));
  }, [beat, after, clearPending, T.RETURN, T.SETTLE]);

  const summonClive = useCallback(
    (contextRecord?: ReceivingRecord | null) => {
      const bayRecords =
        zoomed === "judgement"
          ? pendingDraftsForJudgement(records, customAcceptStatus)
          : records;
      const contextRecords =
        contextRecord &&
        bayRecords.some((record) => record.recordId === contextRecord.recordId)
          ? bayRecords
          : contextRecord
            ? [contextRecord]
            : bayRecords;

      setCliveFocusedRecord(contextRecord ?? null);
      setCliveContextRecords(contextRecords);

      const recordLine = contextRecord
        ? `You have "${contextRecord.title}" open — read it properly or tell me what it should become.`
        : zoomed === "judgement"
          ? "Tell me which draft needs deciding, or ask me to walk the judgement bay."
          : zoomed === "health"
            ? "Ask me which brains need attention, or what the shrine states mean."
            : zoomed === "reports"
              ? "Ask me to summarise this morning’s letters, or what still needs your eye."
              : "Tell me which record you'd like to read properly, or ask me to walk the bench.";
      setChatSeed([
        {
          role: "assistant",
          content: `The wall holds what the household has captured but not yet decided. ${recordLine}`,
        },
      ]);
      setCliveOpen(true);
    },
    [records, zoomed, customAcceptStatus],
  );

  const handleReceivingWallCliveSend = useCallback(
    async (
      message: string,
      history: ChatMessage[],
      platformTurn?: PlatformTurnContext | null,
    ) => {
      const response = await fetch("/api/brains/receiving-wall/clive", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(platformTurn
            ? {
                "X-Platform-Session": platformTurn.handle,
                "X-Platform-Turn-Id": platformTurn.turnId,
              }
            : {}),
        },
        body: JSON.stringify({
          sessionId: platformTurn?.publicSessionId ?? sessionId,
          message,
          history,
          focusedRecord: cliveFocusedRecord,
          records: cliveContextRecords,
          bayCategory: zoomed,
          actor: "Architect",
        }),
      });
      const replyData = (await response.json()) as { reply?: string; error?: string };
      if (!response.ok) {
        throw new Error(replyData.error ?? "Receiving Wall curation chat failed.");
      }
      return replyData.reply ?? "…";
    },
    [cliveContextRecords, cliveFocusedRecord, sessionId, zoomed],
  );

  const acceptRecord = useCallback(
    async (record: ReceivingRecord) => {
      if (isReceivingRecordActioned(record.status, customAcceptStatus)) return;
      const acceptedRecordId = record.recordId;
      setAcceptState("pending");
      setAcceptError(null);
      try {
        const result = await acceptReceivingWallRecord({
          recordId: acceptedRecordId,
          actor: "Architect",
        });
        if (!result.ok) {
          if (openLetterIdRef.current === acceptedRecordId) {
            setAcceptState("error");
            setAcceptError(result.error);
          }
          return;
        }
        setData((current) =>
          current
            ? {
                ...current,
                records: current.records.map((row) =>
                  row.recordId === result.data.record.recordId ? result.data.record : row,
                ),
              }
            : current,
        );
        if (openLetterIdRef.current === acceptedRecordId) {
          setAcceptState("success");
        }
      } catch (error) {
        if (openLetterIdRef.current === acceptedRecordId) {
          setAcceptState("error");
          setAcceptError(
            error instanceof Error ? error.message : "Could not accept this record.",
          );
        }
      }
    },
    [customAcceptStatus],
  );

  useEffect(() => {
    setAcceptState("idle");
    setAcceptError(null);
  }, [openLetterId]);

  useEffect(() => {
    if (beat !== "zoomedIn") return;
    const travelEl = bayTravelRef.current;
    if (!travelEl) return;
    const observer = new ResizeObserver(() => {
      setReadOffset((current) => clampReadOffset(current));
    });
    observer.observe(travelEl);
    return () => observer.disconnect();
  }, [beat, zoomed, openLetterId, pendingDrafts.length, clampReadOffset]);

  useEffect(() => {
    if (beat !== "zoomedIn" || isNave || prefersReducedMotion || cliveOpen) return;

    const surface = bayWindowRef.current;
    if (!surface) return;

    const onWheel = (event: WheelEvent) => {
      const max = measureReadTravel();
      if (max <= 0) return;
      event.preventDefault();
      const next = clampReadOffset(readOffsetRef.current + event.deltaY);
      if (next === readOffsetRef.current) return;
      setReadOffset(next);
    };

    surface.addEventListener("wheel", onWheel, { passive: false });
    return () => surface.removeEventListener("wheel", onWheel);
  }, [
    beat,
    isNave,
    prefersReducedMotion,
    cliveOpen,
    clampReadOffset,
    measureReadTravel,
  ]);

  useEffect(() => {
    if (beat !== "zoomedIn" || isNave || prefersReducedMotion || cliveOpen) return;

    const surface = bayWindowRef.current;
    if (!surface) return;

    const onTouchStart = (event: TouchEvent) => {
      if (event.touches.length !== 1) return;
      touchStartY.current = event.touches[0].clientY;
      touchStartOffset.current = readOffsetRef.current;
    };

    const onTouchMove = (event: TouchEvent) => {
      if (touchStartY.current === null || event.touches.length !== 1) return;
      const max = measureReadTravel();
      if (max <= 0) return;
      const delta = touchStartY.current - event.touches[0].clientY;
      const next = clampReadOffset(touchStartOffset.current + delta);
      if (next !== readOffsetRef.current) event.preventDefault();
      setReadOffset(next);
    };

    const onTouchEnd = () => {
      touchStartY.current = null;
    };

    surface.addEventListener("touchstart", onTouchStart, { passive: true });
    surface.addEventListener("touchmove", onTouchMove, { passive: false });
    surface.addEventListener("touchend", onTouchEnd);
    surface.addEventListener("touchcancel", onTouchEnd);
    return () => {
      surface.removeEventListener("touchstart", onTouchStart);
      surface.removeEventListener("touchmove", onTouchMove);
      surface.removeEventListener("touchend", onTouchEnd);
      surface.removeEventListener("touchcancel", onTouchEnd);
    };
  }, [
    beat,
    isNave,
    prefersReducedMotion,
    cliveOpen,
    clampReadOffset,
    measureReadTravel,
  ]);

  useEffect(() => {
    if (beat !== "zoomedIn" || cliveOpen) return;

    const onFocusIn = () => scrollFocusedIntoView();
    window.addEventListener("focusin", onFocusIn);
    return () => window.removeEventListener("focusin", onFocusIn);
  }, [beat, cliveOpen, scrollFocusedIntoView]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        if (cliveOpen) setCliveOpen(false);
        else if (openLetterId) {
          setOpenLetterId(null);
          setOpenLetterKind(null);
        } else if (
          beat === "zoomedIn" ||
          beat === "zooming" ||
          beat === "exiting" ||
          beat === "returning" ||
          beat === "settling"
        ) {
          closeZoom();
        }
        return;
      }

      if (beat !== "zoomedIn" || isNave || prefersReducedMotion || cliveOpen) return;

      const scrollKeys: Record<string, number> = {
        ArrowDown: 48,
        ArrowUp: -48,
        PageDown: 320,
        PageUp: -320,
        Home: -Infinity,
        End: Infinity,
      };
      const delta = scrollKeys[event.key];
      if (delta === undefined) return;
      if (measureReadTravel() <= 0) return;

      const target = event.target;
      if (
        target instanceof HTMLElement &&
        (target.isContentEditable ||
          target.closest("input, textarea, button, select, a, [contenteditable]"))
      ) {
        return;
      }

      if (event.key === "Home") {
        event.preventDefault();
        setReadOffset(0);
        return;
      }
      if (event.key === "End") {
        event.preventDefault();
        setReadOffset(measureReadTravel());
        return;
      }

      event.preventDefault();
      applyReadDelta(delta);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [
    cliveOpen,
    openLetterId,
    beat,
    closeZoom,
    isNave,
    prefersReducedMotion,
    applyReadDelta,
    measureReadTravel,
  ]);

  const wallZoomed = zoomed !== null;
  const reading = beat === "zoomedIn";
  const wallClasses = [
    styles.wall,
    wallZoomed ? styles.zoomed : "",
    beat === "settling" ? styles.settling : "",
    reading ? styles.reading : "",
  ]
    .filter(Boolean)
    .join(" ");

  const ledgerState = beat === "idle" ? styles.contentEnter : styles.contentExit;
  const bayState =
    beat === "zoomedIn" || beat === "zooming" ? styles.contentEnter : styles.contentExit;

  const idleTint = "#e7d1ad";
  const activeTint = zoomed ? portalDoor(zoomed).tint : idleTint;

  const honesty = data ? wallHonestyNote(data) : null;
  const statusNote = honesty ? (
    <p className={styles.note} role="status">
      {honesty}
    </p>
  ) : null;

  const sill = HOTSPOTS.sillLetter;
  const showSillHotspot = beat === "idle" || beat === "settling";

  const renderDraftLetter = (record: ReceivingRecord) => {
    const isOpen = openLetterKind === "draft" && openLetterId === record.recordId;
    const letter = isOpen ? openDraft : null;
    const dest =
      letter?.systemBrainName || letter?.systemBrainSlug || letter?.brainSlug || null;
    return (
      <li key={record.recordId}>
        <button
          type="button"
          className={`${styles.recordRow} ${isOpen ? styles.recordRowOpen : ""}`}
          aria-expanded={isOpen}
          aria-controls={`letter-${record.recordId}`}
          onClick={() => toggleLetter(record.recordId, "draft")}
        >
          <span className={styles.recordIncision}>
            <span id={`record-title-${record.recordId}`} className={styles.recordTitle}>
              {record.title}
            </span>
            <span
              className={styles.recordProvenance}
              style={{
                ["--tint" as string]: CAPTURE_SOURCE_TINT[record.captureSource],
              }}
            >
              {record.provenance}
              {record.category ? (
                <span className={styles.recordBrainSlug}>{` · ${record.category}`}</span>
              ) : null}
              {record.systemBrainName || record.systemBrainSlug || record.brainSlug ? (
                <span className={styles.recordBrainSlug}>
                  {` · ${record.systemBrainName || record.systemBrainSlug || record.brainSlug}`}
                </span>
              ) : null}
            </span>
          </span>
          <span className={styles.recordChevron} aria-hidden>
            {isOpen ? "−" : "+"}
          </span>
        </button>

        {isOpen && letter ? (
          <div
            id={`letter-${record.recordId}`}
            className={styles.letter}
            role="region"
            aria-labelledby={`record-title-${record.recordId}`}
          >
            <p className={styles.letterMeta}>
              {letter.provenance}
              {` · ${CAPTURE_SOURCE_LABEL[letter.captureSource]}`}
              {letter.category ? ` · ${letter.category}` : " · Uncategorised"}
              {letter.status ? ` · ${letter.status}` : ""}
              {dest ? ` · → ${dest}` : ""}
            </p>
            <p className={styles.letterBody}>{letter.canonicalText || letter.snippet}</p>
            {acceptState === "success" ? (
              <p className={styles.letterStatus} role="status">
                Accepted — recorded on the bench with a paper trail.
              </p>
            ) : null}
            {acceptState === "error" && acceptError ? (
              <p className={styles.letterError} role="alert">
                {acceptError}
              </p>
            ) : null}
            <div className={styles.letterActions}>
              <button
                type="button"
                className={[
                  styles.acceptBtn,
                  acceptState === "pending" ? styles.acceptBtnPending : "",
                  acceptState === "success" ||
                  isReceivingRecordActioned(letter.status, customAcceptStatus)
                    ? styles.acceptBtnSuccess
                    : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                disabled={
                  acceptState === "pending" ||
                  isReceivingRecordActioned(letter.status, customAcceptStatus) ||
                  acceptState === "success"
                }
                aria-busy={acceptState === "pending"}
                aria-label={
                  acceptState === "pending"
                    ? "Accepting record"
                    : acceptState === "success" ||
                        isReceivingRecordActioned(letter.status, customAcceptStatus)
                      ? "Record accepted"
                      : `Accept ${letter.title}`
                }
                onClick={() => void acceptRecord(letter)}
              >
                {acceptState === "pending"
                  ? "Accepting…"
                  : acceptState === "success" ||
                      isReceivingRecordActioned(letter.status, customAcceptStatus)
                    ? "Accepted"
                    : "Accept"}
              </button>
              <button
                type="button"
                className={styles.incisedAction}
                onClick={() => summonClive(letter)}
              >
                Discuss with Clive
              </button>
              <button
                type="button"
                className={styles.incisedActionMuted}
                onClick={() => {
                  setOpenLetterId(null);
                  setOpenLetterKind(null);
                }}
                aria-label={`Fold the letter — ${letter.title}`}
              >
                Fold the letter
              </button>
            </div>
          </div>
        ) : null}
      </li>
    );
  };

  /** Held only — read-only letter, no Accept (Kathryn look). */
  const renderHeldLetter = (item: PortalQueueItem) => {
    const isOpen = openLetterKind === "queue" && openLetterId === item.recordId;
    const letter = isOpen ? openQueue : null;
    return (
      <li key={item.recordId} className={styles.heldLip}>
        <button
          type="button"
          className={`${styles.recordRow} ${isOpen ? styles.recordRowOpen : ""}`}
          aria-expanded={isOpen}
          aria-controls={`letter-${item.recordId}`}
          onClick={() => toggleLetter(item.recordId, "queue")}
        >
          <span className={styles.recordIncision}>
            <span id={`record-title-${item.recordId}`} className={styles.recordTitle}>
              {item.title}
            </span>
            <span className={styles.recordProvenance}>
              {item.provenance}
              {item.stage ? (
                <span className={styles.recordBrainSlug}>{` · ${item.stage}`}</span>
              ) : null}
              {item.verdict ? (
                <span className={styles.recordBrainSlug}>{` · ${item.verdict}`}</span>
              ) : null}
            </span>
          </span>
          <span className={styles.recordChevron} aria-hidden>
            {isOpen ? "−" : "+"}
          </span>
        </button>
        {isOpen && letter ? (
          <div
            id={`letter-${item.recordId}`}
            className={styles.letter}
            role="region"
            aria-labelledby={`record-title-${item.recordId}`}
          >
            <p className={styles.letterMeta}>
              {letter.provenance}
              {letter.stage ? ` · ${letter.stage}` : ""}
              {letter.verdict ? ` · ${letter.verdict}` : ""}
              {" · Held for a human"}
            </p>
            <p className={styles.letterBody}>
              {letter.reason ? `${letter.reason}\n\n` : ""}
              {letter.snippet}
            </p>
            <p className={styles.letterStatus} role="status">
              Held — read only. No silent rewrite from this wall.
            </p>
            <div className={styles.letterActions}>
              <button
                type="button"
                className={styles.incisedActionMuted}
                onClick={() => {
                  setOpenLetterId(null);
                  setOpenLetterKind(null);
                }}
                aria-label={`Fold the letter — ${letter.title}`}
              >
                Fold the letter
              </button>
            </div>
          </div>
        ) : null}
      </li>
    );
  };

  const renderReportLetter = (report: PortalReportLetter) => {
    const isOpen = openLetterKind === "report" && openLetterId === report.recordId;
    const letter = isOpen ? openReport : null;
    return (
      <li key={report.recordId}>
        <button
          type="button"
          className={`${styles.recordRow} ${isOpen ? styles.recordRowOpen : ""}`}
          aria-expanded={isOpen}
          aria-controls={`letter-${report.recordId}`}
          onClick={() => toggleLetter(report.recordId, "report")}
        >
          <span className={styles.recordIncision}>
            <span id={`record-title-${report.recordId}`} className={styles.recordTitle}>
              {report.title}
            </span>
            <span className={styles.recordProvenance}>
              {report.reportType}
              {report.period ? (
                <span className={styles.recordBrainSlug}>{` · ${report.period}`}</span>
              ) : null}
              {report.agentSlug ? (
                <span className={styles.recordBrainSlug}>{` · ${report.agentSlug}`}</span>
              ) : null}
            </span>
          </span>
          <span className={styles.recordChevron} aria-hidden>
            {isOpen ? "−" : "+"}
          </span>
        </button>
        {isOpen && letter ? (
          <div
            id={`letter-${report.recordId}`}
            className={styles.letter}
            role="region"
            aria-labelledby={`record-title-${report.recordId}`}
          >
            <p className={styles.letterMeta}>
              {letter.reportType}
              {letter.period ? ` · ${letter.period}` : ""}
              {letter.agentSlug ? ` · ${letter.agentSlug}` : ""}
            </p>
            {letter.headline ? (
              <p className={styles.baySectionHint}>{letter.headline}</p>
            ) : null}
            <p className={styles.letterBody}>{letter.body}</p>
            <div className={styles.letterActions}>
              <button
                type="button"
                className={styles.incisedAction}
                onClick={() => summonClive()}
              >
                Discuss with Clive
              </button>
              <button
                type="button"
                className={styles.incisedActionMuted}
                onClick={() => {
                  setOpenLetterId(null);
                  setOpenLetterKind(null);
                }}
                aria-label={`Fold the letter — ${letter.title}`}
              >
                Fold the letter
              </button>
            </div>
          </div>
        ) : null}
      </li>
    );
  };

  const ledgerSection = (
    <section className={`${styles.ledger} ${ledgerState}`} aria-label="Operator portals">
      <ul className={styles.sourceList}>
        {OPERATOR_PORTAL_DOORS.map((door) => {
          const mark = portalRightMark(door.id, payload, customAcceptStatus);
          const markClass =
            mark.kind === "state"
              ? `${styles.portalMark} ${styles.portalMarkState}`
              : mark.kind === "time"
                ? `${styles.portalMark} ${styles.portalMarkTime}`
                : styles.portalMark;
          return (
            <li key={door.id}>
              <button
                type="button"
                className={styles.sourceRow}
                style={{
                  ["--tint" as string]: door.tint,
                  ["--mark-tint" as string]: mark.tint ?? door.tint,
                }}
                onClick={() => openPortal(door.id)}
                aria-label={`${door.label} — ${door.blurb} ${mark.value}`}
              >
                <span className={styles.sourceIncision}>
                  <span className={styles.portalDoorName}>{door.label}</span>
                  <span className={styles.sourceBlurb}>{door.blurb}</span>
                </span>
                <span className={styles.sourceCount}>
                  <span className={markClass}>{mark.value}</span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      <section className={styles.bench} aria-label="The bench">
        <div className={styles.benchRule} aria-hidden />
        <p className={styles.benchKicker}>THE BENCH</p>
        <p className={styles.benchLine}>He waits here between readings.</p>
        <button type="button" className={styles.incisedAction} onClick={() => summonClive()}>
          Sit with Clive →
        </button>
      </section>
    </section>
  );

  const zoomedDoor = zoomed && isOperatorPortalId(zoomed) ? portalDoor(zoomed) : null;

  const featured = featuredBrain(payload.brains);
  const tipReportId = defaultReportLetterId(payload.reports);
  const tipReport =
    tipReportId != null
      ? (payload.reports.find((report) => report.recordId === tipReportId) ?? null)
      : null;
  const siblingReports = tipReportId
    ? payload.reports.filter((report) => report.recordId !== tipReportId)
    : payload.reports;

  const judgementBay = (
    <>
      <div className={styles.baySection}>
        <p className={styles.letterMeta}>Needs a human</p>
        <p className={styles.baySectionHint}>
          Draft truths still pending — read, discuss with Clive, Accept.
        </p>
        {pendingDrafts.length === 0 ? (
          <p className={styles.empty}>Nothing pending in Draft Brain Truth right now.</p>
        ) : (
          <ul className={styles.recordList}>{pendingDrafts.map(renderDraftLetter)}</ul>
        )}
      </div>

      <div className={`${styles.baySection} ${styles.heldLip}`}>
        <p className={styles.letterMeta}>Held / stuck</p>
        <p className={styles.baySectionHint}>
          Amendment versions Challenger held — read why; no Accept from here.
        </p>
        {payload.held.length === 0 ? (
          <p className={styles.empty}>Nothing held this morning.</p>
        ) : (
          <ul className={styles.recordList}>{payload.held.map(renderHeldLetter)}</ul>
        )}
      </div>

      <div className={styles.baySection}>
        <p className={styles.letterMeta}>This morning’s proposals</p>
        <p className={styles.baySectionHint}>
          Recent V1 Proposed work not yet drafted — one line each; no execute from this wall.
        </p>
        {payload.proposals.length === 0 ? (
          <p className={styles.empty}>No open V1 proposals on the wall yet.</p>
        ) : (
          <ul className={styles.recordList}>
            {payload.proposals.map((item) => (
              <li key={item.recordId} className={styles.proposalLine}>
                {item.title}
                <span className={styles.proposalLineMeta}>
                  {item.provenance}
                  {item.stage ? ` · ${item.stage}` : ""}
                  {item.verdict ? ` · ${item.verdict}` : ""}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );

  const healthBay = featured ? (
    <div className={styles.baySection}>
      <div
        className={styles.shrineStage}
        style={{
          ["--tint" as string]: portalDoor("health").tint,
          ["--band-tint" as string]: HEALTH_BAND_WORD_TINT[featured.healthBand],
        }}
      >
        <div className={styles.shrineLoop}>
          {prefersReducedMotion ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              className={styles.shrineStill}
              src={HEALTH_BAND_STILL_SRC[featured.healthBand]}
              alt=""
              draggable={false}
            />
          ) : (
            <video
              className={styles.shrineVideo}
              autoPlay
              muted
              loop
              playsInline
              poster={HEALTH_BAND_STILL_SRC[featured.healthBand]}
              aria-label={`${featured.name} — ${brainBandLine(featured)}`}
            >
              <source src={shrineArtForBand(featured.healthBand)} type="video/mp4" />
            </video>
          )}
        </div>
        <div className={styles.shrineMeta}>
          <span className={styles.shrineName}>{featured.name}</span>
          <span className={styles.shrineBandLabel}>{brainBandLine(featured)}</span>
          <p className={styles.shrineTheme}>{featured.theme}</p>
          <Link
            href={`/brain/${featured.slug}?tab=overview`}
            className={styles.shrineOpen}
            aria-label={`To the brains — ${featured.name}`}
          >
            To the brains →
          </Link>
        </div>
      </div>
    </div>
  ) : (
    <p className={styles.empty}>No household brains on the shelf yet.</p>
  );

  const reportsBay = (
    <div className={styles.baySection}>
      {tipReport ? (
        <div
          className={styles.letter}
          role="region"
          aria-label={tipReport.title}
          style={{ marginTop: 0 }}
        >
          <p className={styles.letterMeta}>
            {tipReport.reportType}
            {tipReport.period ? ` · ${tipReport.period}` : ""}
            {tipReport.agentSlug ? ` · ${tipReport.agentSlug}` : ""}
          </p>
          <h3 className={styles.recordTitle} style={{ marginBottom: "0.65rem" }}>
            {tipReport.title}
          </h3>
          {tipReport.headline ? (
            <p className={styles.baySectionHint}>{tipReport.headline}</p>
          ) : null}
          <p className={styles.letterBody}>{tipReport.body}</p>
          <div className={styles.letterActions}>
            <button
              type="button"
              className={styles.incisedAction}
              onClick={() => summonClive()}
            >
              Discuss with Clive
            </button>
          </div>
        </div>
      ) : (
        <p className={styles.empty}>No daily change summary on the wall yet.</p>
      )}

      {siblingReports.length > 0 ? (
        <>
          <p className={`${styles.letterMeta}`} style={{ marginTop: "1.5rem" }}>
            Other letters
          </p>
          <ul className={styles.siblingList}>
            {siblingReports.map(renderReportLetter)}
          </ul>
        </>
      ) : null}
    </div>
  );

  const marginCopy =
    zoomed === "judgement"
      ? "Clive can walk this judgement bay and help you decide what each draft becomes."
      : zoomed === "health"
        ? "Clive can read the shrine states with you — he does not heal a brain from here."
        : zoomed === "reports"
          ? "Clive can sit with this morning’s letters and help you name what still needs an eye."
          : "Clive can read this bay and propose what each record becomes.";

  const baySection =
    zoomed !== null && zoomedDoor ? (
      <section
        key={zoomed}
        className={`${styles.zoom} ${bayState}`}
        aria-label={zoomedDoor.label}
      >
        <div className={styles.zoomHead}>
          <button type="button" className={styles.backBtn} onClick={closeZoom}>
            ← The wall
          </button>
          <h2 className={styles.zoomTitle}>{zoomedDoor.label}</h2>
          <p className={styles.zoomBlurb}>{zoomedDoor.blurb}</p>
        </div>

        {zoomed === "judgement"
          ? judgementBay
          : zoomed === "health"
            ? healthBay
            : reportsBay}

        <div className={styles.margin}>
          <p className={styles.marginText}>{marginCopy}</p>
          <button type="button" className={styles.incisedAction} onClick={() => summonClive()}>
            Sit with Clive →
          </button>
        </div>
      </section>
    ) : null;

  return (
    <main
      className={wallClasses}
      aria-label="The Receiving Wall"
      style={{
        ["--tint" as string]: activeTint,
        ["--dolly-in-16-9" as string]: String(dollyIn169),
        ["--room-static-mask" as string]: roomStaticMaskUrl(),
        ["--sill-x" as string]: String(sill.xFrom),
        ["--sill-x-to" as string]: String(sill.xTo),
        ["--sill-y" as string]: String(sill.yFrom),
        ["--sill-y-to" as string]: String(sill.yTo),
      }}
    >
      <div className={styles.stage}>
        <div className={styles.plate} ref={plateRef}>
          <div className={styles.interiorViewport} ref={interiorViewportRef}>
            <div className={styles.voidFill} aria-hidden />
            <div className={styles.surfacePlate}>
              <div className={styles.surfaceBackdrop}>
                <div className={styles.plateBreath}>
                  <video
                    className={styles.stageVideo}
                    autoPlay
                    muted
                    loop
                    playsInline
                    poster="/agent-cast/clives-man/receiving-wall-poster.jpg"
                  >
                    <source src="/agent-cast/clives-man/receiving-wall.mp4" type="video/mp4" />
                  </video>
                  <div className={styles.plateRecess} />
                </div>
              </div>
              <div
                className={styles.surfaceContent}
                inert={zoomed !== null && !isNave ? true : undefined}
              >
                {statusNote}
                {ledgerSection}
              </div>
              {/* Bay: travelling interior paint + type behind the pinned arch. */}
              <div className={styles.bayOverlay} aria-hidden={!wallZoomed}>
                <div
                  className={styles.bayWindow}
                  ref={bayWindowRef}
                  aria-hidden={!wallZoomed}
                  tabIndex={reading ? 0 : -1}
                >
                  <div
                    className={styles.bayPaintTravel}
                    aria-hidden
                    style={
                      reading && !prefersReducedMotion
                        ? { transform: `translateY(${-readOffset}px)` }
                        : undefined
                    }
                  >
                    {prefersReducedMotion || !wallZoomed ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        className={styles.bayWallStill}
                        src={INTERIOR_WALL.src}
                        width={INTERIOR_WALL.width}
                        height={INTERIOR_WALL.height}
                        alt=""
                        draggable={false}
                      />
                    ) : (
                      <video
                        className={styles.bayWallVideo}
                        autoPlay
                        muted
                        loop
                        playsInline
                        poster={INTERIOR_PORTAL.poster}
                        width={INTERIOR_PORTAL.width}
                        height={INTERIOR_PORTAL.height}
                      >
                        <source src={INTERIOR_PORTAL.src} type="video/mp4" />
                      </video>
                    )}
                  </div>
                  <div
                    className={styles.bayTravel}
                    ref={bayTravelRef}
                    style={
                      reading && !prefersReducedMotion
                        ? { transform: `translateY(${-readOffset}px)` }
                        : undefined
                    }
                  >
                    <div className={styles.bayContent}>
                      <div className={styles.surfaceContent}>
                        {zoomed !== null ? baySection : null}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          {/* Pinned frame — rides dolly with .plate, never bayTravel. */}
          <div className={styles.roomStatic} aria-hidden />
          {/* Pinned sill belt — ledge + letter/quill stay whole. */}
          <div className={styles.sillForeground} aria-hidden>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              className={styles.sillForegroundImg}
              src="/agent-cast/clives-man/receiving-wall-sill.png"
              alt=""
            />
          </div>
          {/* Hotspot on the plate (manifest fractions), not the 15% sill strip. */}
          {showSillHotspot ? (
            <button
              type="button"
              className={styles.sillHotspot}
              style={{ ["--tint" as string]: portalDoor("reports").tint }}
              aria-label={sill.ariaLabel}
              onClick={() => openPortal(sill.portalId)}
            />
          ) : null}
        </div>
        <div className={styles.stageScrim} />
      </div>

      <div className={styles.varnishTint} aria-hidden />
      <div className={styles.varnishShade} aria-hidden />
      <div className={styles.varnishGrain} aria-hidden />

      {cliveOpen ? (
        <div className={styles.popOverlay} role="dialog" aria-modal="true" aria-label="Sit with Clive">
          <div className={styles.popPanel}>
            <div className={styles.popHead}>
              <div>
                <p className={styles.popKicker}>Guided curation</p>
                <p className={styles.popTitle}>Sit with Clive</p>
              </div>
              <button
                type="button"
                className={styles.popClose}
                onClick={() => setCliveOpen(false)}
                aria-label="Close"
              >
                ×
              </button>
            </div>
            <div className={styles.popBody}>
              <CliveChatSurface
                sessionId={sessionId}
                userLabel="Architect"
                placeholder="Ask Clive to read a record, or propose what it should become…"
                starterPrompts={[
                  "Walk the bench — what needs deciding?",
                  "Read the first record properly",
                ]}
                initialMessages={chatSeed}
                onCustomSend={handleReceivingWallCliveSend}
              />
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
