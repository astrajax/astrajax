"use client";

import { useCallback, useMemo, useState } from "react";
import { Stepper } from "@/components/aie-demo/Stepper";
import { BusinessBrainStep } from "@/components/aie-demo/steps/BusinessBrainStep";
import { CliveInterviewStep } from "@/components/aie-demo/steps/CliveInterviewStep";
import { ContextAccessStep } from "@/components/aie-demo/steps/ContextAccessStep";
import { DocHandoffStep } from "@/components/aie-demo/steps/DocHandoffStep";
import { GuideModeStep } from "@/components/aie-demo/steps/GuideModeStep";
import { HumanDecisionStep } from "@/components/aie-demo/steps/HumanDecisionStep";
import { PamChallengeStep } from "@/components/aie-demo/steps/PamChallengeStep";
import { ReceiptsStep } from "@/components/aie-demo/steps/ReceiptsStep";
import { UserBrainStep } from "@/components/aie-demo/steps/UserBrainStep";
import {
  BOOTH_HEADLINE,
  BOOTH_SUBHEAD,
  DEFAULT_BUSINESS_BRAIN,
  DEFAULT_PAM_REVIEW,
  DEMO_SCOPE,
} from "@/lib/aie-demo/demo-data";
import { LOOP_STEPS, MATURITY_LABELS, type LoopState, type LoopStep } from "@/lib/aie-demo/types";
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
  const [state, setState] = useState<LoopState>(createInitialState);

  const accessState = deriveBrainKeyUiState({
    brainSlug: "astrajax-chapter-1",
    maturity: state.brainMaturity,
    request: state.keyRequest ?? undefined,
    grant: state.grant ?? undefined,
    promotionPending: false,
  });

  const completedSteps = useMemo(() => {
    const idx = LOOP_STEPS.indexOf(state.currentStep);
    return new Set(LOOP_STEPS.slice(0, idx));
  }, [state.currentStep]);

  const update = useCallback((patch: Partial<LoopState>) => {
    setState((prev) => ({ ...prev, ...patch }));
  }, []);

  const goTo = useCallback((step: LoopStep) => {
    setState((prev) => ({ ...prev, currentStep: step }));
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
  }, []);

  const stepProps = {
    state,
    accessState,
    onUpdate: update,
    onNext: goNext,
    onBack: goBack,
  };

  const stepContent = (() => {
    switch (state.currentStep) {
      case "user_brain":
        return <UserBrainStep {...stepProps} onBack={undefined} />;
      case "guide":
        return <GuideModeStep {...stepProps} />;
      case "clive_interview":
        return <CliveInterviewStep {...stepProps} />;
      case "business_brain":
        return <BusinessBrainStep {...stepProps} />;
      case "pam_challenge":
        return <PamChallengeStep {...stepProps} />;
      case "human_decision":
        return <HumanDecisionStep {...stepProps} />;
      case "doc_handoff":
        return <DocHandoffStep {...stepProps} />;
      case "context_access":
        return <ContextAccessStep {...stepProps} />;
      case "receipts":
        return <ReceiptsStep {...stepProps} onNext={goNext} />;
      default:
        return null;
    }
  })();

  return (
    <div className="min-h-screen bg-cream">
      <header className="border-b border-ink/10 bg-cream-deep/50">
        <div className="mx-auto flex max-w-[96rem] flex-wrap items-center justify-between gap-4 px-6 py-5">
          <div>
            <p className="section-label">AstraJax · Chapter 1 Workbench</p>
            <p className="mt-1 max-w-3xl font-display text-lg font-semibold text-ink sm:text-xl">
              {BOOTH_HEADLINE}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="rounded-full bg-ink/5 px-3 py-1 font-mono text-xs text-ink-muted">
              {headerBadge(state, accessState)}
            </span>
            <button type="button" className="btn-secondary text-sm" onClick={reset}>
              Reset / replay
            </button>
          </div>
        </div>
        <p className="mx-auto max-w-[96rem] px-6 pb-4 text-sm text-ink-muted">{BOOTH_SUBHEAD}</p>
      </header>

      <div className="mx-auto grid max-w-[96rem] gap-8 px-6 py-10 lg:grid-cols-[16rem_minmax(0,1fr)]">
        <aside className="lg:sticky lg:top-8 lg:self-start">
          <Stepper currentStep={state.currentStep} completedSteps={completedSteps} onJump={goTo} />
        </aside>
        <main className="min-w-0">{stepContent}</main>
      </div>
    </div>
  );
}
