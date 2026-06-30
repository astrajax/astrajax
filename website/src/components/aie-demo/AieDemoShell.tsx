"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { Chapter1Conversation } from "@/components/chapter1/Chapter1Conversation";
import { CliveStudyShell } from "@/components/chapter1/CliveStudyShell";
import { CliveWelcomeSequence } from "@/components/chapter1/CliveWelcomeSequence";
import type { CliveVideoStageHandle } from "@/components/chapter1/CliveVideoStage";
import { PaperTrailDrawer } from "@/components/chapter1/PaperTrailDrawer";
import type { CliveReaction } from "@/lib/clive/video-reactions";
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
    currentStep: "welcome",
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
  const cliveVideoRef = useRef<CliveVideoStageHandle>(null);
  const [welcomeComplete, setWelcomeComplete] = useState(false);
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

      let nextIdx = idx - 1;
      if (welcomeComplete) {
        while (nextIdx > 0) {
          const step = LOOP_STEPS[nextIdx];
          if (step !== "welcome" && step !== "context_importance" && step !== "brains_intro") {
            break;
          }
          nextIdx -= 1;
        }
      }

      return { ...prev, currentStep: LOOP_STEPS[nextIdx] };
    });
  }, [welcomeComplete]);

  const reset = useCallback(() => {
    setState(createInitialState());
    setWelcomeComplete(false);
    setPaperTrailOpen(false);
  }, []);

  const completeWelcome = useCallback(() => {
    setWelcomeComplete(true);
    setState((prev) => ({ ...prev, currentStep: "user_brain" }));
  }, []);

  const playCliveReaction = useCallback((reaction: CliveReaction) => {
    void cliveVideoRef.current?.playReaction(reaction);
  }, []);

  return (
    <>
      <CliveStudyShell
        ref={cliveVideoRef}
        maturityLabel={maturityLabel}
        onReset={reset}
        onOpenPaperTrail={() => setPaperTrailOpen(true)}
      >
        {!welcomeComplete ? (
          <CliveWelcomeSequence
            sessionId={state.sessionId}
            videoRef={cliveVideoRef}
            onComplete={completeWelcome}
          />
        ) : (
          <Chapter1Conversation
            state={state}
            accessState={accessState}
            onUpdate={update}
            onNext={goNext}
            onBack={state.currentStep !== "user_brain" ? goBack : undefined}
            playCliveReaction={playCliveReaction}
          />
        )}
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
