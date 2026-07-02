"use client";

import { createContext, useContext, type ReactNode } from "react";
import { createPortal } from "react-dom";

const StudyStageRightPanelContext = createContext<HTMLElement | null>(null);

export function StudyStageRightPanelProvider({
  container,
  children,
}: {
  container: HTMLElement | null;
  children: ReactNode;
}) {
  return (
    <StudyStageRightPanelContext.Provider value={container}>
      {children}
    </StudyStageRightPanelContext.Provider>
  );
}

export function StudyStageRightPanel({ children }: { children: ReactNode }) {
  const container = useContext(StudyStageRightPanelContext);
  if (!container) return null;
  return createPortal(children, container);
}
