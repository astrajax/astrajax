"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  CAPTURE_SOURCE_BLURB,
  CAPTURE_SOURCE_LABEL,
  CAPTURE_SOURCE_ORDER,
  CAPTURE_SOURCE_TINT,
  type CaptureSource,
  type ReceivingRecord,
} from "@/lib/receiving-wall";
import { CliveChatSurface } from "@/components/chapter1/CliveChatSurface";
import type { ChatMessage } from "@/lib/clive/types";
import styles from "./receiving-wall.module.css";

type WallData = {
  records: ReceivingRecord[];
  source: "live" | "derived" | "seed";
  message?: string;
};

/**
 * The dolly-zoom, in one sentence: the ledger fades out, the camera pushes into
 * the arch field while the zoomed painting crossfades over the wide loop, then
 * the bay's records fade in at rest. Text never scales — only the wall moves.
 *
 * Timings are orchestrated by CSS (see receiving-wall.module.css); the JS only
 * tracks which beat we're in so the DOM swaps line up with the visual ones:
 *
 *   idle     — wide wall + ledger
 *   exiting  — ledger fading/lifting out (~260ms)
 *   zooming  — the dolly: wall scales toward the arch, painting crossfades in
 *   zoomedIn — arrived: zoomed painting holds, bay list fading in
 *   returning— reverse: bay list out, dolly pulls back, ledger returns
 *
 * The wall transform/crossfade is pure CSS transition on the .zooming class,
 * so reduced-motion users get the same state change as a plain crossfade.
 */
type Beat = "idle" | "exiting" | "zooming" | "zoomedIn" | "returning";

const EXIT_MS = 260; // ledger fade-out before the dolly begins
const ARRIVE_MS = 1160; // dolly + painting crossfade, matching CSS
const RETURN_MS = 260; // bay fade-out before the pull-back

function createSessionId(): string {
  return `rw_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export function ReceivingWall() {
  const [data, setData] = useState<WallData | null>(null);
  const [beat, setBeat] = useState<Beat>("idle");
  const [zoomed, setZoomed] = useState<CaptureSource | null>(null);
  const [openRecordId, setOpenRecordId] = useState<string | null>(null);
  const [cliveOpen, setCliveOpen] = useState(false);
  const [sessionId] = useState(createSessionId);
  const [chatSeed, setChatSeed] = useState<ChatMessage[]>([]);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

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
    };
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
      if (beat === "exiting" || beat === "zooming") return;
      setZoomed(source);
      setOpenRecordId(null);
      setBeat("exiting");
      after(EXIT_MS, () => setBeat("zooming"));
      after(ARRIVE_MS, () => setBeat("zoomedIn"));
    },
    [beat, after],
  );

  const closeZoom = useCallback(() => {
    if (beat !== "zoomedIn") return;
    setOpenRecordId(null);
    setBeat("returning");
    after(RETURN_MS, () => {
      setZoomed(null);
      setBeat("idle");
    });
  }, [beat, after]);

  const summonClive = useCallback(() => {
    setChatSeed([
      {
        role: "assistant",
        content:
          "The wall holds what the household has captured but not yet decided. Tell me which record you'd like to read properly, or ask me to walk the bench and propose what each should become.",
      },
    ]);
    setCliveOpen(true);
  }, []);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        if (cliveOpen) setCliveOpen(false);
        else if (openRecordId) setOpenRecordId(null);
        else if (beat === "zoomedIn") closeZoom();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [cliveOpen, openRecordId, beat, closeZoom]);

  const moving = beat === "zooming" || beat === "zoomedIn";
  const stageState = moving ? styles.zooming : "";
  const ledgerState =
    beat === "exiting" ? styles.contentExit : beat === "idle" ? styles.contentEnter : "";
  const bayState = beat === "zoomedIn" ? styles.contentEnter : "";

  return (
    <main className={styles.wall} aria-label="The Receiving Wall">
      {/* Living wall — two layers: the wide loop, and the zoomed painting that
          crossfades over it as the dolly arrives. Both scale together. */}
      <div className={`${styles.stage} ${stageState}`} aria-hidden>
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
        <div
          className={styles.stageZoomed}
          style={{
            backgroundImage: "url(/agent-cast/clives-man/receiving-wall-zoomed.jpg)",
          }}
        />
        <div className={styles.stageScrim} />
      </div>

      {/* Header */}
      <header className={styles.header}>
        <div>
          <p className={styles.kicker}>The Receiving Wall</p>
          <h1 className={styles.title}>Clive&rsquo;s Man</h1>
        </div>
        <div className={styles.headerActions}>
          <button type="button" className={styles.summonBtn} onClick={summonClive}>
            Sit with Clive
          </button>
          <Link href="/brain" className={styles.ghostLink}>
            To the brains →
          </Link>
        </div>
      </header>

      {data?.source !== "live" && data?.message ? (
        <p className={styles.note} role="status">
          {data.source === "derived"
            ? "Showing live records — source tinting is inferred until the Capture Source field is set."
            : data.message}
        </p>
      ) : null}

      {/* The engraved ledger — visible on the wide wall, fades out for the dolly */}
      {!zoomed ? (
        <section className={`${styles.ledger} ${ledgerState}`} aria-label="Captured context">
          <p className={styles.ledgerHint}>
            Choose a door to read what waits within.
          </p>
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
        </section>
      ) : (
        /* The bay — arrives once the dolly has settled on the painting */
        <section
          className={`${styles.zoom} ${bayState}`}
          aria-label={CAPTURE_SOURCE_LABEL[zoomed]}
          style={{ ["--tint" as string]: CAPTURE_SOURCE_TINT[zoomed] }}
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
                    onClick={() =>
                      setOpenRecordId(openRecordId === record.recordId ? null : record.recordId)
                    }
                  >
                    <span className={styles.recordIncision}>
                      <span className={styles.recordTitle}>{record.title}</span>
                      <span className={styles.recordProvenance}>{record.provenance}</span>
                    </span>
                    <span className={styles.recordChevron} aria-hidden>
                      {openRecordId === record.recordId ? "−" : "+"}
                    </span>
                  </button>

                  {openRecordId === record.recordId && openRecord ? (
                    <div className={styles.letter} role="region" aria-label={`${record.title} — full record`}>
                      <p className={styles.letterTitle}>{openRecord.title}</p>
                      <p className={styles.letterMeta}>
                        {openRecord.provenance}
                        {openRecord.status ? ` · ${openRecord.status}` : ""}
                        {openRecord.brainSlug ? ` · → ${openRecord.brainSlug}` : ""}
                      </p>
                      <p className={styles.letterBody}>
                        {openRecord.canonicalText || openRecord.snippet}
                      </p>
                      <p className={styles.letterNote}>
                        To decide what this becomes, sit with Clive — he files the record and
                        writes the paper trail.
                      </p>
                      <div className={styles.letterActions}>
                        <button type="button" className={styles.summonBtn} onClick={summonClive}>
                          Decide with Clive
                        </button>
                        <button
                          type="button"
                          className={styles.ghostBtn}
                          onClick={() => setOpenRecordId(null)}
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
        </section>
      )}

      {/* Clive pop-out */}
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
              />
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
