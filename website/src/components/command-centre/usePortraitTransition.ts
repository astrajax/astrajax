"use client";

import { useCallback, useEffect, useState } from "react";

const PORTRAIT_TRANSITION_MS = 900;

export function usePrefersReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setPrefersReducedMotion(mediaQuery.matches);
    sync();
    mediaQuery.addEventListener("change", sync);
    return () => mediaQuery.removeEventListener("change", sync);
  }, []);

  return prefersReducedMotion;
}

type RunWithPortraitTransitionOptions = {
  viewTransitionName?: string;
};

export function usePortraitTransition() {
  const prefersReducedMotion = usePrefersReducedMotion();

  const runWithPortraitTransition = useCallback(
    (action: () => void, options?: RunWithPortraitTransitionOptions) => {
      const applyTransitionName = () => {
        if (!options?.viewTransitionName) return;
        document.documentElement.style.setProperty(
          "view-transition-name",
          options.viewTransitionName,
        );
      };

      const clearTransitionName = () => {
        document.documentElement.style.removeProperty("view-transition-name");
      };

      if (prefersReducedMotion) {
        action();
        return;
      }

      if (typeof document !== "undefined" && "startViewTransition" in document) {
        applyTransitionName();
        const transition = document.startViewTransition(() => {
          action();
        });
        void transition.finished.finally(clearTransitionName);
        return;
      }

      applyTransitionName();
      window.setTimeout(() => {
        action();
        clearTransitionName();
      }, PORTRAIT_TRANSITION_MS);
    },
    [prefersReducedMotion],
  );

  const runDelayedTransition = useCallback(
    (action: () => void, leavingClassTarget?: HTMLElement | null) => {
      if (prefersReducedMotion) {
        action();
        return;
      }

      if (leavingClassTarget) {
        leavingClassTarget.classList.add("portrait-entry--leaving");
      }

      window.setTimeout(action, PORTRAIT_TRANSITION_MS);
    },
    [prefersReducedMotion],
  );

  return {
    prefersReducedMotion,
    transitionMs: PORTRAIT_TRANSITION_MS,
    runWithPortraitTransition,
    runDelayedTransition,
  };
}
