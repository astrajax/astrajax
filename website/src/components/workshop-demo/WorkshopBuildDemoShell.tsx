"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import { RoomShell } from "@/components/command-centre/RoomShell";
import { PaperTrailList } from "@/components/platform/PaperTrailList";
import { TrinityLaneHeader } from "@/components/workshop-demo/TrinityLaneHeader";
import { ApprovalStep } from "@/components/workshop-demo/steps/ApprovalStep";
import { BriefStep } from "@/components/workshop-demo/steps/BriefStep";
import { BuilderStep } from "@/components/workshop-demo/steps/BuilderStep";
import { ChallengerStep } from "@/components/workshop-demo/steps/ChallengerStep";
import { ExportStep } from "@/components/workshop-demo/steps/ExportStep";
import { ProposerStep } from "@/components/workshop-demo/steps/ProposerStep";
import { RoutingStep } from "@/components/workshop-demo/steps/RoutingStep";
import { DEMO_AGENT } from "@/lib/workshop-demo/demo-data";
import {
  nextStep,
  prevStep,
  WORKSHOP_BUILD_STEPS,
  type WorkshopBuildStep,
  type WorkshopDemoState,
} from "@/lib/workshop-demo/types";

function createInitialState(): WorkshopDemoState {
  return {
    currentStep: "routing",
    approverName: "",
    humanApproved: false,
    buildComplete: false,
    paperTrail: [],
  };
}

export function WorkshopBuildDemoShell() {
  const [state, setState] = useState<WorkshopDemoState>(createInitialState);

  const handleUpdate = useCallback((patch: Partial<WorkshopDemoState>) => {
    setState((prev) => ({ ...prev, ...patch }));
  }, []);

  const handleNext = useCallback(() => {
    setState((prev) => {
      const next = nextStep(prev.currentStep);
      return next ? { ...prev, currentStep: next } : prev;
    });
  }, []);

  const handleBack = useCallback(() => {
    setState((prev) => {
      const back = prevStep(prev.currentStep);
      return back ? { ...prev, currentStep: back } : prev;
    });
  }, []);

  const handleReset = useCallback(() => {
    setState(createInitialState());
  }, []);

  const stepProps = {
    state,
    onUpdate: handleUpdate,
    onNext: handleNext,
    onBack: handleBack,
  };

  const stepNumber = WORKSHOP_BUILD_STEPS.indexOf(state.currentStep) + 1;

  return (
    <RoomShell
      theme="doc"
      roomLabel="Doc's workshop"
      roomTitle="Agent build demo"
      badge={<span className="workshop-build-demo__badge">Demo</span>}
      onReset={handleReset}
      resetLabel="Start again"
      headerActions={
        <Link href="/command/doc" className="room-shell__ghost-btn">
          Workshop hub
        </Link>
      }
    >
      <div className="workshop-build-demo">
        <p className="mb-4 max-w-2xl text-lg text-parchment/85">
          Walk the Doc&apos;s Workshop Trinity — design, red-team, approve, then Composer builds a
          governed Hyperagent export for {DEMO_AGENT.name}.
        </p>

        <TrinityLaneHeader currentStep={state.currentStep} />

        <div
          className="workshop-build-demo__progress mt-6"
          role="progressbar"
          aria-valuenow={stepNumber}
          aria-valuemin={1}
          aria-valuemax={WORKSHOP_BUILD_STEPS.length}
          aria-label={`Step ${stepNumber} of ${WORKSHOP_BUILD_STEPS.length}`}
        >
          <div
            className="workshop-build-demo__progress-fill"
            style={{ width: `${(stepNumber / WORKSHOP_BUILD_STEPS.length) * 100}%` }}
          />
        </div>

        <div className="mt-8">
          {state.currentStep === "routing" ? <RoutingStep {...stepProps} /> : null}
          {state.currentStep === "brief" ? <BriefStep {...stepProps} /> : null}
          {state.currentStep === "proposer" ? <ProposerStep {...stepProps} /> : null}
          {state.currentStep === "challenger" ? <ChallengerStep {...stepProps} /> : null}
          {state.currentStep === "approval" ? <ApprovalStep {...stepProps} /> : null}
          {state.currentStep === "builder" ? <BuilderStep {...stepProps} /> : null}
          {state.currentStep === "export" ? <ExportStep {...stepProps} /> : null}
        </div>

        <PaperTrailList lines={state.paperTrail} />
      </div>
    </RoomShell>
  );
}
