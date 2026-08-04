"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  CAPTURE_SOURCE_BLURB,
  CAPTURE_SOURCE_LABEL,
  CAPTURE_SOURCE_ORDER,
  CAPTURE_SOURCE_TINT,
  isReceivingRecordActioned,
  type CaptureSource,
  type ReceivingRecord,
} from "@/lib/receiving-wall";
import { CliveChatSurface } from "@/components/chapter1/CliveChatSurface";
import { usePrefersReducedMotion } from "@/components/command-centre/usePortraitTransition";
import { acceptReceivingWallRecord } from "@/lib/brains/actions/receiving-wall-accept";
import {
  DOLLY_IN_DEFAULT,
  DOLLY_IN_LADDER,
} from "@/lib/man/receiving-wall-manifest";
import type { ChatMessage } from "@/lib/clive/types";
import type { PlatformTurnContext } from "@/lib/platform-activity/types";
import styles from "./receiving-wall.module.css";

type WallData = {
  records: ReceivingRecord[];
  source: "live" | "derived" | "seed";
  message?: string;
};

/**
 * Portal — push-in to enter, locked-arch scroll inside.
 *
 *   idle     — wide wall at dolly 1 + ledger on the upper plate
 *   exiting  — ledger fading (nave only; desktop scroll carries text)
 *   zooming  — dolly push to close framing, then interior scroll; plates crossfade
 *   zoomedIn — bay on the lower plate; arch pinned, interior only moves between bays
 *   returning— bay fades out; camera holds close until RETURN_MS
 *   settling — dolly pull-back + scroll return; ledger held out until SETTLE_MS
 *
 * Close framing: `--dolly-in-16-9` (default 1.54). Ladder via ?dolly=1.46|1.54|1.62.
 * Spec: website/docs/receiving-wall-portal-spec.md
 */
type Beat = "idle" | "exiting" | "zooming" | "zoomedIn" | "returning" | "settling";

const TIMINGS = {
  normal: { EXIT: 220, ARRIVE: 1420, RETURN: 260, SETTLE: 880 },
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
  const [zoomed, setZoomed] = useState<CaptureSource | null>(null);
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

  const zoomedRecords = zoomed
    ? records.filter((r) => r.captureSource === zoomed)
    : [];

  const openRecord = openRecordId
    ? (records.find((r) => r.recordId === openRecordId) ?? null)
    : null;

  const openSource = useCallback(
    (source: CaptureSource) => {
      if (beat === "exiting" || beat === "zooming" || beat === "returning") return;

      const beginZoom = () => {
        clearPending();
        setOpenRecordId(null);
        setZoomed(source);
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
        if (source === zoomed) return;
        clearPending();
        setOpenRecordId(null);
        setZoomed(source);
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
        ? records.filter((record) => record.captureSource === zoomed)
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
          actor: "Architect",
        }),
      });
      const data = (await response.json()) as { reply?: string; error?: string };
      if (!response.ok) {
        throw new Error(data.error ?? "Receiving Wall curation chat failed.");
      }
      return data.reply ?? "…";
    },
    [cliveContextRecords, cliveFocusedRecord, sessionId],
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
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [cliveOpen, openRecordId, beat, closeZoom]);

  const wallZoomed = zoomed !== null;
  const wallClasses = [
    styles.wall,
    wallZoomed ? styles.zoomed : "",
    beat === "settling" ? styles.settling : "",
  ]
    .filter(Boolean)
    .join(" ");

  const ledgerState = beat === "idle" ? styles.contentEnter : styles.contentExit;
  const bayState = beat === "zoomedIn" ? styles.contentEnter : styles.contentExit;

  const idleTint = "#e7d1ad";

  const statusNote =
    data?.source !== "live" && data?.message ? (
      <p className={styles.note} role="status">
        {data.source === "derived"
          ? "Showing live records — source tinting is inferred until the Capture Source field is set."
          : data.message}
      </p>
    ) : null;

  const ledgerSection = (
    <section
      className={`${styles.ledger} ${isNave ? ledgerState : styles.contentEnter}`}
      aria-label="Captured context"
    >
      <ul className={styles.sourceList}>
        {CAPTURE_SOURCE_ORDER.map((source) => {
          const count = records.filter((r) => r.captureSource === source).length;
          return (
            <li key={source}>
              <button
                type="button"
                className={styles.sourceRow}
                style={{ ["--tint" as string]: CAPTURE_SOURCE_TINT[source] }}
                onClick={() => openSource(source)}
                aria-label={`${CAPTURE_SOURCE_LABEL[source]} — ${count} record${count === 1 ? "" : "s"}`}
              >
                <span className={styles.sourceIncision}>
                  <span className={styles.sourceName}>{CAPTURE_SOURCE_LABEL[source]}</span>
                  <span className={styles.sourceBlurb}>{CAPTURE_SOURCE_BLURB[source]}</span>
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

  const baySection =
    zoomed !== null ? (
      <section
        key={zoomed}
        className={`${styles.zoom} ${bayState}`}
        aria-label={CAPTURE_SOURCE_LABEL[zoomed]}
      >
        <div className={styles.zoomHead}>
          <button type="button" className={styles.backBtn} onClick={closeZoom}>
            ← The wall
          </button>
          <h2 className={styles.zoomTitle}>{CAPTURE_SOURCE_LABEL[zoomed]}</h2>
          <p className={styles.zoomBlurb}>{CAPTURE_SOURCE_BLURB[zoomed]}</p>
        </div>

        {zoomedRecords.length === 0 ? (
          <p className={styles.empty}>Nothing waits in this bay yet.</p>
        ) : (
          <ul className={styles.recordList}>
            {zoomedRecords.map((record) => (
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
                    <span className={styles.recordProvenance}>{record.provenance}</span>
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
                      {openRecord.status ? ` · ${openRecord.status}` : ""}
                      {openRecord.brainSlug ? ` · → ${openRecord.brainSlug}` : ""}
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
            ))}
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
        ["--tint" as string]: zoomed ? CAPTURE_SOURCE_TINT[zoomed] : idleTint,
        ["--dolly-in-16-9" as string]: String(dollyIn169),
      }}
    >
      <div className={styles.stage}>
        <div className={styles.plate}>
          <div className={styles.interiorViewport}>
            <div className={styles.voidFill} aria-hidden />
            <div className={styles.interiorTrack}>
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
                <div className={styles.surfaceContent}>
                  {statusNote}
                  {!isNave ? ledgerSection : null}
                </div>
              </div>
              <div className={styles.surfacePlate}>
                <div className={styles.surfaceBackdrop}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    className={styles.surfaceStill}
                    src="/agent-cast/clives-man/receiving-wall-zoomed.jpg"
                    alt=""
                  />
                  <div className={styles.plateRecess} />
                </div>
                <div className={styles.surfaceContent}>
                  {!isNave && zoomed !== null ? baySection : null}
                </div>
              </div>
            </div>
          </div>
          <div className={styles.frameOverlay} />
        </div>
        <div className={styles.stageScrim} />
      </div>

      <nav className={styles.navExit} aria-label="Leave the wall">
        <Link href="/brain" className={styles.ghostLink}>
          To the brains →
        </Link>
      </nav>

      {isNave ? (
        <div className={styles.aperture}>
          {statusNote}
          {!zoomed ? ledgerSection : baySection}
        </div>
      ) : null}

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
