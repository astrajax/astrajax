"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  DEFAULT_STORY_MODE,
  STORY_MODE_STORAGE_KEY,
  isPortraitNavigationEnabled,
  parseStoryMode,
  type StoryMode,
} from "@/lib/command-centre/story-mode";

type StoryModeContextValue = {
  mode: StoryMode;
  setMode: (mode: StoryMode) => void;
  portraitDoorsEnabled: boolean;
};

const StoryModeContext = createContext<StoryModeContextValue | null>(null);

export function StoryModeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<StoryMode>(DEFAULT_STORY_MODE);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem(STORY_MODE_STORAGE_KEY);
    setModeState(parseStoryMode(stored));
    setHydrated(true);
  }, []);

  const setMode = useCallback((next: StoryMode) => {
    setModeState(next);
    window.localStorage.setItem(STORY_MODE_STORAGE_KEY, next);
  }, []);

  const value = useMemo(
    () => ({
      mode: hydrated ? mode : DEFAULT_STORY_MODE,
      setMode,
      portraitDoorsEnabled: isPortraitNavigationEnabled(hydrated ? mode : DEFAULT_STORY_MODE),
    }),
    [hydrated, mode, setMode],
  );

  return <StoryModeContext.Provider value={value}>{children}</StoryModeContext.Provider>;
}

export function useStoryMode(): StoryModeContextValue {
  const ctx = useContext(StoryModeContext);
  if (!ctx) {
    throw new Error("useStoryMode must be used within StoryModeProvider");
  }
  return ctx;
}
