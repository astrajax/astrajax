"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Chapter1Conversation } from "@/components/chapter1/Chapter1Conversation";
import type { HubBookId } from "@/components/chapter1/CliveStudyHub";
import { CliveStudyShell } from "@/components/chapter1/CliveStudyShell";
import { CliveWelcomeSequence } from "@/components/chapter1/CliveWelcomeSequence";
import { PaperTrailDrawer } from "@/components/chapter1/PaperTrailDrawer";
import { PlatformSessionControls } from "@/components/platform-session/PlatformSessionControls";
import { usePlatformSession } from "@/components/platform-session/PlatformSessionProvider";
import type { CliveVideoStageHandle } from "@/components/chapter1/CliveVideoStage";
import type { CliveReaction } from "@/lib/clive/video-reactions";
import { syncJourneyProgress } from "@/lib/journey-progress/client";
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

/**
 * W7 — resume from the ledger. With `?resume=1`, entry lands on the step the
 * persisted slice recorded for this book (the hub's bookmark ribbon sets
 * this), falling back to the book's opening step when the ledger doesn't
 * match. Resuming past the welcome beat also skips the cinematic.
 */
function entryStepForBook(
  book: HubBookId,
  resume: boolean,
): { currentStep: LoopStep; skipWelcomeSequence: boolean } {
  const base = stepForBook(book);
  if (!resume) return base;
  const persisted = loadPersistedLoopSlice();
  const step = persisted?.currentStep;
  if (persisted?.book !== book || !step) return base;
  const steps = getLoopStepsForBook(book);
  if (!steps.includes(step)) return base;
  return {
    currentStep: step,
    skipWelcomeSequence: base.skipWelcomeSequence || step !== "welcome",
  };
}

/**
 * The folio state must follow the INTERACTION state, not the presence of a
 * component. Opening/teaching beats keep Clive on the left page; once the
 * experience becomes conversational/compositional (the intake interview or
 * any later working beat, on either route), Clive resolves top-right and the
 * left page carries the writing. This is the single source of truth for
 * data-folio-state, driven by the explicit step machine — never inferred
 * from :has() selectors.
 */
function isInteractionStep(step: LoopStep, showWelcomeSequence: boolean): boolean {
  // Teaching = the opening/teaching material (the welcome cinematic and the
  // pre-engagement welcome step). The moment the experience carries a live
  // working chat — any beat after that, on either route, including the
  // context_importance entry — the interface is conversational and Clive
  // resolves top-right. The visual state follows the interaction state.
  if (showWelcomeSequence) return false;
  return step !== "welcome";
}

export function AieDemoShell() {
  const router = useRouter();
  const { endSession, status: platformSessionStatus } = usePlatformSession();
  const searchParams = useSearchParams();
  const bookParam = readBookParam(searchParams.get("book"));
  const newBrainParam = searchParams.get("newBrain")?.trim() || undefined;
  const resumeParam = searchParams.get("resume") === "1";
  const cliveVideoRef = useRef<CliveVideoStageHandle>(null);
  const [hubSelection, setHubSelection] = useState<HubBookId | null>(() => bookParam);
  const [welcomeComplete, setWelcomeComplete] = useState(
    () => (bookParam ? entryStepForBook(bookParam, resumeParam).skipWelcomeSequence : false),
  );
  const [state, setState] = useState<LoopState>(() =>
    bookParam
      ? createInitialState(entryStepForBook(bookParam, resumeParam).currentStep, newBrainParam)
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
      book: bookParam,
    });
    // Server is the authority (state contract §2); localStorage above is
    // the accelerator. Silent no-op for anonymous visitors.
    syncJourneyProgress({ chapter: 1, step: state.currentStep, book: bookParam });
  }, [state.sessionId, state.userBrain, state.userBrainIntake, state.currentStep, bookParam]);

  useEffect(() => {
    if (bookParam) {
      const { currentStep, skipWelcomeSequence } = entryStepForBook(bookParam, resumeParam);
      setHubSelection(bookParam);
      setWelcomeComplete(skipWelcomeSequence);
      setState(createInitialState(currentStep, newBrainParam));
      return;
    }
    router.replace("/command/clive");
  }, [bookParam, newBrainParam, resumeParam, router]);

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

  const reset = useCallback(async () => {
    const closed =
      platformSessionStatus === "disabled" || platformSessionStatus === "error"
        ? true
        : await endSession();
    if (!closed) return;
    clearPersistedLoopSlice();
    router.push("/command/clive");
  }, [endSession, platformSessionStatus, router]);

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

  // Scope the reaction queue to the current beat: on a step change any cue
  // queued under the old turn goes stale and drops on the next natural end
  // (non-interruption contract — clear queued reactions on page/state change).
  useEffect(() => {
    cliveVideoRef.current?.setContextTurn(`${bookParam ?? "hub"}:${state.currentStep}`);
  }, [bookParam, state.currentStep]);

  const showWelcomeSequence = hubSelection === "welcome" && !welcomeComplete;

  // Folio engagement is derived from the explicit step machine, not from any
  // component's presence — see isInteractionStep.
  const folioEngaged = isInteractionStep(state.currentStep, showWelcomeSequence);

  // Start the ambient idle reel once, on entry (or when switching books).
  // `returnToIdle()` (called internally after any reaction clip) already
  // resumes the reel from where it left off — this effect must NOT depend
  // on state.currentStep, or every step transition resets the reel back to
  // clip 0 and re-fetches it, fighting the video that's already playing.
  useEffect(() => {
    if (showWelcomeSequence) return;
    cliveVideoRef.current?.startIdleReel();
  }, [showWelcomeSequence, bookParam]);

  if (!bookParam || hubSelection === null) {
    return null;
  }

  return (
    <>
      <CliveStudyShell
        ref={cliveVideoRef}
        onReset={() => void reset()}
        headerActions={<PlatformSessionControls compact />}
        stageState={folioEngaged ? "interaction" : "teaching"}
        paperTrail={
          showWelcomeSequence
            ? undefined
            : (open, onClose) => (
                <PaperTrailDrawer
                  open={open}
                  onClose={onClose}
                  state={state}
                  accessState={accessState}
                />
              )
        }
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
            architectPath={bookParam === "architect"}
          />
        )}
      </CliveStudyShell>
    </>
  );
}
