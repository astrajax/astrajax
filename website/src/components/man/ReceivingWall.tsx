"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  CAPTURE_SOURCE_LABEL,
  CAPTURE_SOURCE_TINT,
  isReceivingRecordActioned,
  listPopulatedReceivingCategories,
  receivingCategoryBlurb,
  receivingCategoryKey,
  receivingCategoryLabel,
  receivingCategoryTint,
  type ReceivingRecord,
} from "@/lib/receiving-wall";
import { CliveChatSurface } from "@/components/chapter1/CliveChatSurface";
import { usePrefersReducedMotion } from "@/components/command-centre/usePortraitTransition";
import { acceptReceivingWallRecord } from "@/lib/brains/actions/receiving-wall-accept";
import {
  archInteriorMaskUrl,
  roomStaticMaskUrl,
} from "@/lib/man/receiving-wall-arch-mask";
import {
  DOLLY_IN_DEFAULT,
  DOLLY_IN_LADDER,
  INTERIOR_WALL,
} from "@/lib/man/receiving-wall-manifest";

/** Avoid "brain · brain" when provenance already names the destination. */
function brainLabelForRow(record: ReceivingRecord): string | null {
  const label =
    record.systemBrainName || record.systemBrainSlug || record.brainSlug || null;
  if (!label) return null;
  const hay = (record.provenance || "").toLowerCase();
  const needle = label.toLowerCase();
  if (hay.includes(needle)) return null;
  // Slug ↔ display-name soft match (astrajax-chapter-1 vs AstraJax Chapter 1)
  const slugish = needle.replace(/[^a-z0-9]+/g, "");
  const provish = hay.replace(/[^a-z0-9]+/g, "");
  if (slugish && provish.includes(slugish)) return null;
  return label;
}
import type { ChatMessage } from "@/lib/clive/types";
import type { PlatformTurnContext } from "@/lib/platform-activity/types";
import styles from "./receiving-wall.module.css";

type WallData = {
  records: ReceivingRecord[];
  source: "live" | "derived" | "seed";
  message?: string;
};

/**
 * Portal — slow centre push; reading scrolls flat interior paint behind a pinned arch.
 *
 *   idle     — wide wall at dolly 1; ledger + interior paint travel together
 *   exiting  — ledger fading (nave only)
 *   zooming  — slow scale into centre (same video/poster — no still swap)
 *   zoomedIn — interior paint + bay type travel together; arch/sill stay pinned
 *   returning— bay fades; camera holds close until RETURN_MS
 *   settling — slow pull-back; ledger held out until SETTLE_MS
 *
 * Layers on .plate: travelling interior texture (aperture paint only) →
 * roomStatic (luminance hole) → sill belt. Idle and zoomed share one travel
 * mechanism. Close framing: `--dolly-in-16-9` (default 1.22).
 * Spec: website/docs/receiving-wall-portal-spec.md
 */
type Beat = "idle" | "exiting" | "zooming" | "zoomedIn" | "returning" | "settling";

const TIMINGS = {
  normal: { EXIT: 220, ARRIVE: 2500, RETURN: 260, SETTLE: 1700 },
  reduced: { EXIT: 120, ARRIVE: 240, RETURN: 120, SETTLE: 240 },
} as const;

type AcceptState = "idle" | "pending" | "success" | "error";

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

  const [data, setData] = useState<WallData | null>(null);
  const [beat, setBeat] = useState<Beat>("idle");
  /** Proposed Category key, or RECEIVING_UNCATEGORISED_KEY. */
  const [zoomed, setZoomed] = useState<string | null>(null);
  const [openRecordId, setOpenRecordId] = useState<string | null>(null);
  const [cliveOpen, setCliveOpen] = useState(false);
  const [sessionId] = useState(createSessionId);
  const [chatSeed, setChatSeed] = useState<ChatMessage[]>([]);
  const [cliveFocusedRecord, setCliveFocusedRecord] = useState<ReceivingRecord | null>(null);
  const [cliveContextRecords, setCliveContextRecords] = useState<ReceivingRecord[]>([]);
  const [acceptState, setAcceptState] = useState<AcceptState>("idle");
  const [acceptError, setAcceptError] = useState<string | null>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const openRecordIdRef = useRef<string | null>(null);
  openRecordIdRef.current = openRecordId;
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
        const response = await fetch("/api/brains/receiving-wall");
        const json = (await response.json()) as WallData;
        if (!cancelled && response.ok) setData(json);
      } catch {
        /* leave wall in its loading state */
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

  const records = data?.records ?? [];
  const categoryKeys = listPopulatedReceivingCategories(records);

  const zoomedRecords = zoomed
    ? records.filter((r) => receivingCategoryKey(r) === zoomed)
    : [];

  const openRecord = openRecordId
    ? (records.find((r) => r.recordId === openRecordId) ?? null)
    : null;
  const destinationLabel =
    openRecord?.systemBrainName ||
    openRecord?.systemBrainSlug ||
    openRecord?.brainSlug ||
    null;

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

  const openCategory = useCallback(
    (categoryKey: string) => {
      if (beat === "exiting" || beat === "zooming" || beat === "returning") return;

      const beginZoom = () => {
        clearPending();
        setOpenRecordId(null);
        setReadOffset(0);
        setZoomed(categoryKey);
        setBeat("zooming");
        after(T.ARRIVE, () => setBeat("zoomedIn"));
      };

      if (beat === "settling") {
        clearPending();
        setOpenRecordId(null);
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
        if (categoryKey === zoomed) return;
        clearPending();
        setOpenRecordId(null);
        setZoomed(categoryKey);
        setBeat("zooming");
        after(T.EXIT, () => setBeat("zoomedIn"));
        return;
      }

      if (!isNave) {
        beginZoom();
        return;
      }

      clearPending();
      setOpenRecordId(null);
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
      setOpenRecordId(null);
      setZoomed(null);
      setBeat("idle");
      return;
    }
    if (beat === "returning" || beat === "settling") {
      clearPending();
      setOpenRecordId(null);
      setZoomed(null);
      setBeat("idle");
      return;
    }
    if (beat !== "zoomedIn") return;
    clearPending();
    setOpenRecordId(null);
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
      const bayRecords = zoomed
        ? records.filter((record) => receivingCategoryKey(record) === zoomed)
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
        : "Tell me which record you'd like to read properly, or ask me to walk the bench and propose what each should become.";
      setChatSeed([
        {
          role: "assistant",
          content: `The wall holds what the household has captured but not yet decided. ${recordLine}`,
        },
      ]);
      setCliveOpen(true);
    },
    [records, zoomed],
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
      const data = (await response.json()) as { reply?: string; error?: string };
      if (!response.ok) {
        throw new Error(data.error ?? "Receiving Wall curation chat failed.");
      }
      return data.reply ?? "…";
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
          if (openRecordIdRef.current === acceptedRecordId) {
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
        if (openRecordIdRef.current === acceptedRecordId) {
          setAcceptState("success");
        }
      } catch (error) {
        if (openRecordIdRef.current === acceptedRecordId) {
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
  }, [openRecordId]);

  /** Idle ledger and zoomed bay share one paint+type travel mechanism. */
  const paintTravelling = beat === "idle" || beat === "zoomedIn";

  useEffect(() => {
    if (!paintTravelling) return;
    const travelEl = bayTravelRef.current;
    if (!travelEl) return;
    const observer = new ResizeObserver(() => {
      setReadOffset((current) => clampReadOffset(current));
    });
    observer.observe(travelEl);
    return () => observer.disconnect();
  }, [
    paintTravelling,
    beat,
    zoomed,
    openRecordId,
    zoomedRecords.length,
    categoryKeys.length,
    records.length,
    clampReadOffset,
  ]);

  useEffect(() => {
    if (!paintTravelling || isNave || prefersReducedMotion || cliveOpen) return;

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
    paintTravelling,
    isNave,
    prefersReducedMotion,
    cliveOpen,
    clampReadOffset,
    measureReadTravel,
  ]);

  useEffect(() => {
    if (!paintTravelling || isNave || prefersReducedMotion || cliveOpen) return;

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
    paintTravelling,
    isNave,
    prefersReducedMotion,
    cliveOpen,
    clampReadOffset,
    measureReadTravel,
  ]);

  useEffect(() => {
    if (!paintTravelling || cliveOpen) return;

    const onFocusIn = () => scrollFocusedIntoView();
    window.addEventListener("focusin", onFocusIn);
    return () => window.removeEventListener("focusin", onFocusIn);
  }, [paintTravelling, cliveOpen, scrollFocusedIntoView]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        if (cliveOpen) setCliveOpen(false);
        else if (openRecordId) setOpenRecordId(null);
        else if (
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

      if (
        !(beat === "zoomedIn" || beat === "idle") ||
        isNave ||
        prefersReducedMotion ||
        cliveOpen
      ) {
        return;
      }

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
    openRecordId,
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
    paintTravelling && !prefersReducedMotion ? styles.paintTravel : "",
  ]
    .filter(Boolean)
    .join(" ");

  const ledgerState = beat === "idle" ? styles.contentEnter : styles.contentExit;
  const bayState =
    beat === "zoomedIn" || beat === "zooming" ? styles.contentEnter : styles.contentExit;
  const travelTransform =
    paintTravelling && !prefersReducedMotion
      ? { transform: `translateY(${-readOffset}px)` }
      : undefined;

  const idleTint = "#e7d1ad";

  const statusNote =
    data?.source !== "live" && data?.message ? (
      <p className={styles.note} role="status">
        {data.source === "derived"
          ? "Showing live drafts — Capture Source on each letter is inferred until that field is set."
          : data.message}
      </p>
    ) : null;

  const ledgerSection = (
    <section
      className={`${styles.ledger} ${ledgerState}`}
      aria-label="Captured context"
    >
      {statusNote}
      <ul className={styles.sourceList}>
        {categoryKeys.map((categoryKey) => {
          const count = records.filter(
            (r) => receivingCategoryKey(r) === categoryKey,
          ).length;
          const label = receivingCategoryLabel(categoryKey);
          const blurb = receivingCategoryBlurb(categoryKey);
          return (
            <li key={categoryKey}>
              <button
                type="button"
                className={styles.sourceRow}
                style={{ ["--tint" as string]: receivingCategoryTint(categoryKey) }}
                onClick={() => openCategory(categoryKey)}
                aria-label={`${label} — ${count} record${count === 1 ? "" : "s"}`}
              >
                <span className={styles.sourceIncision}>
                  <span className={styles.sourceName}>{label}</span>
                  {blurb ? <span className={styles.sourceBlurb}>{blurb}</span> : null}
                </span>
                <span className={styles.sourceCount}>
                  <span className={styles.sourceCountNum}>{count}</span>
                  <span className={styles.sourceCountWord}>within</span>
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

  const zoomedLabel = zoomed ? receivingCategoryLabel(zoomed) : "";
  const zoomedBlurb = zoomed ? receivingCategoryBlurb(zoomed) : undefined;

  const baySection =
    zoomed !== null ? (
      <section
        key={zoomed}
        className={`${styles.zoom} ${bayState}`}
        aria-label={zoomedLabel}
      >
        <div className={styles.zoomHead}>
          <button type="button" className={styles.backBtn} onClick={closeZoom}>
            ← The wall
          </button>
          <h2 className={styles.zoomTitle}>{zoomedLabel}</h2>
          {zoomedBlurb ? <p className={styles.zoomBlurb}>{zoomedBlurb}</p> : null}
        </div>

        {zoomedRecords.length === 0 ? (
          <p className={styles.empty}>Nothing waits in this bay yet.</p>
        ) : (
          <ul className={styles.recordList}>
            {zoomedRecords.map((record) => {
              const brainLabel = brainLabelForRow(record);
              return (
              <li key={record.recordId}>
                <button
                  type="button"
                  className={`${styles.recordRow} ${
                    openRecordId === record.recordId ? styles.recordRowOpen : ""
                  }`}
                  aria-expanded={openRecordId === record.recordId}
                  aria-controls={`letter-${record.recordId}`}
                  onClick={() =>
                    setOpenRecordId(openRecordId === record.recordId ? null : record.recordId)
                  }
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
                      {brainLabel ? (
                        <span className={styles.recordBrainSlug}>{` · ${brainLabel}`}</span>
                      ) : null}
                    </span>
                  </span>
                  <span className={styles.recordChevron} aria-hidden>
                    {openRecordId === record.recordId ? "−" : "+"}
                  </span>
                </button>

                {openRecordId === record.recordId && openRecord ? (
                  <div
                    id={`letter-${record.recordId}`}
                    className={styles.letter}
                    role="region"
                    aria-labelledby={`record-title-${record.recordId}`}
                  >
                    <p className={styles.letterMeta}>
                      {openRecord.provenance}
                      {` · ${CAPTURE_SOURCE_LABEL[openRecord.captureSource]}`}
                      {openRecord.category
                        ? ` · ${openRecord.category}`
                        : " · Uncategorised"}
                      {openRecord.status ? ` · ${openRecord.status}` : ""}
                      {destinationLabel ? ` · → ${destinationLabel}` : ""}
                    </p>
                    <p className={styles.letterBody}>
                      {openRecord.canonicalText || openRecord.snippet}
                    </p>
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
                          isReceivingRecordActioned(openRecord.status, customAcceptStatus)
                            ? styles.acceptBtnSuccess
                            : "",
                        ]
                          .filter(Boolean)
                          .join(" ")}
                        disabled={
                          acceptState === "pending" ||
                          isReceivingRecordActioned(openRecord.status, customAcceptStatus) ||
                          acceptState === "success"
                        }
                        aria-busy={acceptState === "pending"}
                        aria-label={
                          acceptState === "pending"
                            ? "Accepting record"
                            : acceptState === "success" ||
                                isReceivingRecordActioned(openRecord.status, customAcceptStatus)
                              ? "Record accepted"
                              : `Accept ${openRecord.title}`
                        }
                        onClick={() => void acceptRecord(openRecord)}
                      >
                        {acceptState === "pending"
                          ? "Accepting…"
                          : acceptState === "success" ||
                              isReceivingRecordActioned(openRecord.status, customAcceptStatus)
                            ? "Accepted"
                            : "Accept"}
                      </button>
                      <button
                        type="button"
                        className={styles.incisedAction}
                        onClick={() => summonClive(openRecord)}
                      >
                        Discuss with Clive
                      </button>
                      <button
                        type="button"
                        className={styles.incisedActionMuted}
                        onClick={() => setOpenRecordId(null)}
                        aria-label={`Fold the letter — ${openRecord.title}`}
                      >
                        Fold the letter
                      </button>
                    </div>
                  </div>
                ) : null}
              </li>
              );
            })}
          </ul>
        )}

        <div className={styles.margin}>
          <p className={styles.marginText}>
            Clive can read this bay and propose what each record becomes.
          </p>
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
        ["--tint" as string]: zoomed ? receivingCategoryTint(zoomed) : idleTint,
        ["--dolly-in-16-9" as string]: String(dollyIn169),
        ["--room-static-mask" as string]: roomStaticMaskUrl(),
        ["--arch-interior-mask" as string]: archInteriorMaskUrl(),
      }}
    >
      <div className={styles.stage}>
        <div className={styles.plate} ref={plateRef}>
          <div className={styles.interiorViewport} ref={interiorViewportRef}>
            <div className={styles.voidFill} aria-hidden />
            <div className={styles.portalCore} aria-hidden />
            <div className={styles.surfacePlate}>
              {/* Ambient loop under the aperture — covered by the travelling interior. */}
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
              {/*
                One travel stack for idle + zoomed: flat interior paint + type.
                Arch / sconces / wood stay on .roomStatic; ledge props on .sillForeground.
              */}
              <div className={styles.bayOverlay}>
                {/* Paint travel — tall 4K wall image, natural height (no stretch). */}
                <div className={styles.bayPaintClip} aria-hidden>
                  <div className={styles.bayPaintTravel} style={travelTransform}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      className={styles.bayWallStill}
                      src={INTERIOR_WALL.src}
                      width={INTERIOR_WALL.width}
                      height={INTERIOR_WALL.height}
                      alt=""
                      draggable={false}
                    />
                  </div>
                </div>
                {/* Type travel — same offset; aperture-fixed mask fades rows into the sill. */}
                <div
                  className={styles.bayWindow}
                  ref={bayWindowRef}
                  tabIndex={paintTravelling ? 0 : -1}
                  aria-label={
                    wallZoomed
                      ? `${zoomedLabel} — scroll to read`
                      : "Captured context — scroll the wall"
                  }
                >
                  <div
                    className={styles.bayTravel}
                    ref={bayTravelRef}
                    style={travelTransform}
                  >
                    <div className={styles.bayContent}>
                      <div className={styles.surfaceContent}>
                        {ledgerSection}
                        {baySection}
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
