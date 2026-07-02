"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Chapter1Conversation } from "@/components/chapter1/Chapter1Conversation";
import type { HubBookId } from "@/components/chapter1/CliveStudyHub";
import { CliveStudyShell } from "@/components/chapter1/CliveStudyShell";
import { CliveWelcomeSequence } from "@/components/chapter1/CliveWelcomeSequence";
import type { CliveVideoStageHandle } from "@/components/chapter1/CliveVideoStage";
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
import {
  resolveLoopStep,
  type LoopState,
  type LoopStep,
} from "@/lib/aie-demo/types";
import { deriveBrainKeyUiState } from "@/lib/brains/ui-states";
import { isHubBookId, stepForBook, getLoopStepsForBook } from "@/lib/chapter1/hub-books";

function createInitialState(currentStep: LoopStep = "welcome", newBrainName?: string): LoopState {
  const persisted = loadPersistedLoopSlice();
  const base: LoopState = {
    sessionId: persisted?.sessionId ?? crypto.randomUUID(),
    currentStep,
    brainMaturity: "seedling",
    userBrain: persisted?.userBrain ?? null,
    userBrainIntake: persisted?.userBrainIntake ?? null,
    guideMode: "full_story",
    businessBrain: newBrainName
      ? { ...DEFAULT_BUSINESS_BRAIN, clientName: newBrainName }
      : DEFAULT_BUSINESS_BRAIN,
    pamReview: DEFAULT_PAM_REVIEW,
    keyRequest: null,
    grant: null,
    snippets: [],
    humanApproved: false,
    approvalDecisionId: "",
    promoteReceipt: null,
    demoScope: DEMO_SCOPE,
    draftTruths: [],
    selectedDraftIds: [],
  };

  if (currentStep === "user_brain" && !base.userBrainIntake) {
    base.userBrainIntake = createEmptyIntake();
  }

  return base;
}

function readBookParam(book: string | null): HubBookId | null {
  return isHubBookId(book) ? book : null;
}

export function AieDemoShell() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const bookParam = readBookParam(searchParams.get("book"));
  const newBrainParam = searchParams.get("newBrain")?.trim() || undefined;
  const cliveVideoRef = useRef<CliveVideoStageHandle>(null);
  const [hubSelection, setHubSelection] = useState<HubBookId | null>(() => bookParam);
  const [welcomeComplete, setWelcomeComplete] = useState(
    () => (bookParam ? stepForBook(bookParam).skipWelcomeSequence : false),
  );
  const [state, setState] = useState<LoopState>(() =>
    bookParam
      ? createInitialState(stepForBook(bookParam).currentStep, newBrainParam)
      : createInitialState(),
  );

  const accessState = deriveBrainKeyUiState({
    brainSlug: "astrajax-chapter-1",
    maturity: state.brainMaturity,
    request: state.keyRequest ?? undefined,
    grant: state.grant ?? undefined,
    promotionPending: false,
  });

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
      setState(createInitialState(currentStep, newBrainParam));
      return;
    }
    router.replace("/command/clive");
  }, [bookParam, newBrainParam, router]);

  const loopSteps = useMemo(() => getLoopStepsForBook(bookParam), [bookParam]);

  const goNext = useCallback(() => {
    setState((prev) => {
      const current = resolveLoopStep(prev.currentStep, prev.currentStep);
      const idx = loopSteps.indexOf(current);
      if (idx >= loopSteps.length - 1) return prev;
      return { ...prev, currentStep: loopSteps[idx + 1] };
    });
  }, [loopSteps]);

  const goBack = useCallback(() => {
    setState((prev) => {
      const current = resolveLoopStep(prev.currentStep, prev.currentStep);
      const idx = loopSteps.indexOf(current);
      if (idx <= 0) return prev;

      let nextIdx = idx - 1;
      if (welcomeComplete) {
        while (nextIdx > 0) {
          const step = loopSteps[nextIdx];
          if (step !== "welcome" && step !== "context_importance") {
            break;
          }
          nextIdx -= 1;
        }
      }

      return { ...prev, currentStep: loopSteps[nextIdx] };
    });
  }, [loopSteps, welcomeComplete]);

  const reset = useCallback(() => {
    clearPersistedLoopSlice();
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

  const showWelcomeSequence = hubSelection === "welcome" && !welcomeComplete;

  useEffect(() => {
    if (showWelcomeSequence) return;
    cliveVideoRef.current?.startIdleReel();
  }, [showWelcomeSequence, bookParam, state.currentStep]);

  if (!bookParam || hubSelection === null) {
    return null;
  }

  return (
    <>
      <CliveStudyShell ref={cliveVideoRef} onReset={reset}>
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
            architectPath={bookParam === "architect"}
          />
        )}
      </CliveStudyShell>
    </>
  );
}
