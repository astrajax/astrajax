"use client";

import { useCallback, useMemo, useState } from "react";
import { Chapter1Conversation } from "@/components/chapter1/Chapter1Conversation";
import { CliveStudyShell } from "@/components/chapter1/CliveStudyShell";
import { PaperTrailDrawer } from "@/components/chapter1/PaperTrailDrawer";
import { PortraitEntry } from "@/components/chapter1/PortraitEntry";
import {
  DEFAULT_BUSINESS_BRAIN,
  DEFAULT_PAM_REVIEW,
  DEMO_SCOPE,
} from "@/lib/aie-demo/demo-data";
import { LOOP_STEPS, MATURITY_LABELS, type LoopState } from "@/lib/aie-demo/types";
import {
  SEEDLING_HEADER_LABEL,
  UI_STATE_LABELS,
  deriveBrainKeyUiState,
} from "@/lib/brains/ui-states";

function createInitialState(): LoopState {
  return {
    sessionId: crypto.randomUUID(),
    currentStep: "user_brain",
    brainMaturity: "seedling",
    userBrain: null,
    guideMode: null,
    businessBrain: DEFAULT_BUSINESS_BRAIN,
    pamReview: DEFAULT_PAM_REVIEW,
    keyRequest: null,
    grant: null,
    snippets: [],
    humanApproved: false,
    approvalDecisionId: "",
    promoteReceipt: null,
    demoScope: DEMO_SCOPE,
  };
}

function headerBadge(state: LoopState, accessState: ReturnType<typeof deriveBrainKeyUiState>): string {
  if (state.brainMaturity === "seedling") {
    return SEEDLING_HEADER_LABEL;
  }
  return `${MATURITY_LABELS.working} · ${UI_STATE_LABELS[accessState]}`;
}

export function AieDemoShell() {
  const [entered, setEntered] = useState(false);
  const [paperTrailOpen, setPaperTrailOpen] = useState(false);
  const [state, setState] = useState<LoopState>(createInitialState);

  const accessState = deriveBrainKeyUiState({
    brainSlug: "astrajax-chapter-1",
    maturity: state.brainMaturity,
    request: state.keyRequest ?? undefined,
    grant: state.grant ?? undefined,
    promotionPending: false,
  });

  const maturityLabel = useMemo(
    () => headerBadge(state, accessState),
    [state, accessState],
  );

  const update = useCallback((patch: Partial<LoopState>) => {
    setState((prev) => ({ ...prev, ...patch }));
  }, []);

  const goNext = useCallback(() => {
    setState((prev) => {
      const idx = LOOP_STEPS.indexOf(prev.currentStep);
      if (idx >= LOOP_STEPS.length - 1) return prev;
      return { ...prev, currentStep: LOOP_STEPS[idx + 1] };
    });
  }, []);

  const goBack = useCallback(() => {
    setState((prev) => {
      const idx = LOOP_STEPS.indexOf(prev.currentStep);
      if (idx <= 0) return prev;
      return { ...prev, currentStep: LOOP_STEPS[idx - 1] };
    });
  }, []);

  const reset = useCallback(() => {
    setState(createInitialState());
    setEntered(false);
    setPaperTrailOpen(false);
  }, []);

  if (!entered) {
    return <PortraitEntry onEnter={() => setEntered(true)} />;
  }

  return (
    <>
      <CliveStudyShell
        maturityLabel={maturityLabel}
        onReset={reset}
        onOpenPaperTrail={() => setPaperTrailOpen(true)}
      >
        <Chapter1Conversation
          state={state}
          accessState={accessState}
          onUpdate={update}
          onNext={goNext}
          onBack={state.currentStep !== "user_brain" ? goBack : undefined}
        />
      </CliveStudyShell>

      <PaperTrailDrawer
        open={paperTrailOpen}
        onClose={() => setPaperTrailOpen(false)}
        state={state}
        accessState={accessState}
      />
    </>
  );
}
