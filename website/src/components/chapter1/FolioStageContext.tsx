"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

/**
 * Living Folio stage state.
 *
 * The folio has two compositions:
 * - "teaching"   — Clive fills the left page; lesson copy lives opposite.
 * - "interaction" — active exchange: conversation left, Clive top-third
 *   right, his action record in the lower two-thirds.
 *
 * The stage owns the state; the conversation reports engagement (a user
 * message sent this beat) and the chat surface reports sends so the stage
 * can play the message pulse (the thought-vein to Clive's portrait).
 */
export type FolioStageState = "teaching" | "interaction";

export type FolioPulse = {
  /** Increments per send so a re-send re-plays the vein. */
  nonce: number;
};

type FolioStageContextValue = {
  stageState: FolioStageState;
  /** Conversation calls this when its beat gains/loses an active exchange. */
  setEngaged: (engaged: boolean) => void;
  /** Chat surface calls this on every send; the stage plays the pulse. */
  fireMessagePulse: () => void;
  pulse: FolioPulse | null;
  /** Set by the pulse layer when the vein reaches Clive (actions may reveal). */
  pulseArrived: boolean;
  markPulseArrived: () => void;
};

const FolioStageContext = createContext<FolioStageContextValue | null>(null);

export function FolioStageProvider({ children }: { children: ReactNode }) {
  const [engaged, setEngagedState] = useState(false);
  const [pulse, setPulse] = useState<FolioPulse | null>(null);
  const [pulseArrived, setPulseArrived] = useState(false);
  const nonceRef = useRef(0);

  const setEngaged = useCallback((next: boolean) => {
    setEngagedState(next);
  }, []);

  const fireMessagePulse = useCallback(() => {
    nonceRef.current += 1;
    setPulseArrived(false);
    setPulse({ nonce: nonceRef.current });
  }, []);

  const markPulseArrived = useCallback(() => {
    setPulseArrived(true);
  }, []);

  const value = useMemo<FolioStageContextValue>(
    () => ({
      stageState: engaged ? "interaction" : "teaching",
      setEngaged,
      fireMessagePulse,
      pulse,
      pulseArrived,
      markPulseArrived,
    }),
    [engaged, setEngaged, fireMessagePulse, pulse, pulseArrived, markPulseArrived],
  );

  return <FolioStageContext.Provider value={value}>{children}</FolioStageContext.Provider>;
}

/** Null when rendered outside the folio stage (e.g. other chat surfaces). */
export function useFolioStage(): FolioStageContextValue | null {
  return useContext(FolioStageContext);
}
