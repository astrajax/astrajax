"use client";

import { useRef } from "react";
import { CliveStudyStage } from "@/components/chapter1/CliveStudyStage";
import type { CliveVideoStageHandle } from "@/components/chapter1/CliveVideoStage";
import { OnboardingFlow } from "@/components/onboarding/OnboardingFlow";

/**
 * Onboarding — the two-route Living Folio flow, mounted inside Clive's study
 * stage so the locked folio grammar applies: teaching Clive left / lesson
 * right at rest; the interaction state as the user engages; the gold-leaf
 * thought-vein; live text; engraved controls; reduced-motion; uninterrupted
 * video. Fixture-driven (contract v0.1); no backend, no merge/deploy.
 */
export default function OnboardingPage() {
  const cliveRef = useRef<CliveVideoStageHandle>(null);

  return (
    <CliveStudyStage
      ref={cliveRef}
      onReset={() => {
        // Start again returns to the opening choice; fixture state resets.
        if (typeof window !== "undefined") window.location.reload();
      }}
      label="Begin your Trusted Brain"
      subtitle="Chapter 1 · onboarding"
    >
      <OnboardingFlow />
    </CliveStudyStage>
  );
}
