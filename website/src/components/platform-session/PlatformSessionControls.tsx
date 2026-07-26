"use client";

import { useState } from "react";
import { usePlatformSession } from "./PlatformSessionProvider";
import styles from "./PlatformSessionControls.module.css";

export function PlatformSessionControls({ compact = false }: { compact?: boolean }) {
  const { status, pause, endSession } = usePlatformSession();
  const [working, setWorking] = useState<"pause" | "end" | null>(null);
  const [note, setNote] = useState<string | null>(null);

  if (status === "disabled" || status === "error" || status === "starting") return null;

  const pauseSession = async () => {
    setWorking("pause");
    setNote(null);
    await pause();
    setNote("Paused — your place is kept while the session stays live.");
    setWorking(null);
  };

  const closeSession = async () => {
    setWorking("end");
    setNote(null);
    const closed = await endSession();
    setNote(closed ? "Session ended." : "The session could not be ended yet.");
    setWorking(null);
  };

  return (
    <div className={`${styles.root}${compact ? ` ${styles.compact}` : ""}`}>
      <div className={styles.actions}>
        <button
          type="button"
          className={styles.button}
          disabled={working !== null || status === "ended"}
          onClick={() => void pauseSession()}
        >
          {working === "pause" ? "Pausing…" : "Pause"}
        </button>
        <button
          type="button"
          className={`${styles.button} ${styles.end}`}
          disabled={working !== null || status === "ended"}
          onClick={() => void closeSession()}
        >
          {working === "end" ? "Ending…" : "End session"}
        </button>
      </div>
      {note ? <p className={styles.note} aria-live="polite">{note}</p> : null}
    </div>
  );
}
