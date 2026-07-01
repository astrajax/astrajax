"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Chapter1Conversation } from "@/components/chapter1/Chapter1Conversation";
import type { HubBookId } from "@/components/chapter1/CliveStudyHub";
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
import {
  clearPersistedLoopSlice,
  createEmptyIntake,
  loadPersistedLoopSlice,
  persistLoopSlice,
} from "@/lib/aie-demo/user-brain-intake";
import { LOOP_STEPS, MATURITY_LABELS, type LoopState, type LoopStep } from "@/lib/aie-demo/types";
import {
  SEEDLING_HEADER_LABEL,
  UI_STATE_LABELS,
  deriveBrainKeyUiState,
} from "@/lib/brains/ui-states";
import { isHubBookId, stepForBook } from "@/lib/chapter1/hub-books";

function createInitialState(currentStep: LoopStep = "welcome"): LoopState {
  const persisted = loadPersistedLoopSlice();
  const base: LoopState = {
    sessionId: persisted?.sessionId ?? crypto.randomUUID(),
    currentStep,
    brainMaturity: "seedling",
    userBrain: persisted?.userBrain ?? null,
    userBrainIntake: persisted?.userBrainIntake ?? null,
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

  if (currentStep === "user_brain" && !base.userBrainIntake) {
    base.userBrainIntake = createEmptyIntake();
  }

  return base;
}

function headerBadge(state: LoopState, accessState: ReturnType<typeof deriveBrainKeyUiState>): string {
  if (state.brainMaturity === "seedling") {
    return SEEDLING_HEADER_LABEL;
  }
  return `${MATURITY_LABELS.working} · ${UI_STATE_LABELS[accessState]}`;
}

function readBookParam(book: string | null): HubBookId | null {
  return isHubBookId(book) ? book : null;
}

export function AieDemoShell() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const bookParam = readBookParam(searchParams.get("book"));
  const cliveVideoRef = useRef<CliveVideoStageHandle>(null);
  const [hubSelection, setHubSelection] = useState<HubBookId | null>(() => bookParam);
  const [welcomeComplete, setWelcomeComplete] = useState(
    () => (bookParam ? stepForBook(bookParam).skipWelcomeSequence : false),
  );
  const [paperTrailOpen, setPaperTrailOpen] = useState(false);
  const [state, setState] = useState<LoopState>(() =>
    bookParam ? createInitialState(stepForBook(bookParam).currentStep) : createInitialState(),
  );

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

  useEffect(() => {
    persistLoopSlice({
      sessionId: state.sessionId,
      userBrain: state.userBrain,
      userBrainIntake: state.userBrainIntake,
      currentStep: state.currentStep,
    });
  }, [state.sessionId, state.userBrain, state.userBrainIntake, state.currentStep]);

  useEffect(() => {
    if (bookParam) {
      const { currentStep, skipWelcomeSequence } = stepForBook(bookParam);
      setHubSelection(bookParam);
      setWelcomeComplete(skipWelcomeSequence);
      setState(createInitialState(currentStep));
      return;
    }
    router.replace("/command/clive");
  }, [bookParam, router]);

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
    clearPersistedLoopSlice();
    setPaperTrailOpen(false);
    router.push("/command/clive");
  }, [router]);

  const completeWelcome = useCallback(() => {
    setWelcomeComplete(true);
    setState((prev) => ({
      ...prev,
      currentStep: "user_brain",
      userBrainIntake: prev.userBrainIntake ?? createEmptyIntake(),
    }));
  }, []);

  const playCliveReaction = useCallback((reaction: CliveReaction) => {
    void cliveVideoRef.current?.playReaction(reaction);
  }, []);

  if (!bookParam || hubSelection === null) {
    return null;
  }

  const showWelcomeSequence = hubSelection === "welcome" && !welcomeComplete;

  return (
    <>
      <CliveStudyShell
        ref={cliveVideoRef}
        maturityLabel={maturityLabel}
        onReset={reset}
        onOpenPaperTrail={() => setPaperTrailOpen(true)}
      >
        {showWelcomeSequence ? (
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
