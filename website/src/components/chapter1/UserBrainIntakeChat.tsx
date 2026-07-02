"use client";

import { useCallback, useMemo, useState } from "react";
import { CliveChatSurface } from "@/components/chapter1/CliveChatSurface";
import { StudyStageRightPanel } from "@/components/chapter1/StudyStageRightPanel";
import type { CliveReaction } from "@/lib/clive/video-reactions";
import type { ChatMessage } from "@/lib/clive/types";
import type { UserBrainIntake, UserBrainProfile } from "@/lib/aie-demo/types";
import { saveUserBrainToWorkshop } from "@/lib/aie-demo/brain-client";
import { formatArchitectLabel } from "@/lib/chapter1/format-labels";
import {
  applyIntakeAnswer,
  buildIntakeSummaryCard,
  buildIntakeTranscript,
  createEmptyIntake,
  enrichIntakeWithThemeRecommendations,
  getNextAssistantMessage,
  getProfileById,
  INTAKE_QUESTIONS,
  inferProfileFromIntake,
  USER_BRAIN_INTAKE_GREETING,
  validateIntakeAnswer,
} from "@/lib/aie-demo/user-brain-intake";

type UserBrainIntakeChatProps = {
  sessionId: string;
  intake: UserBrainIntake | null;
  userBrain: UserBrainProfile | null;
  guideMode?: string;
  onIntakeUpdate: (intake: UserBrainIntake) => void;
  onComplete: (intake: UserBrainIntake, profile: UserBrainProfile) => void;
  playCliveReaction?: (reaction: CliveReaction) => void;
  disabled?: boolean;
};

export function UserBrainIntakeChat({
  sessionId,
  intake: intakeProp,
  userBrain,
  guideMode,
  onIntakeUpdate,
  onComplete,
  playCliveReaction,
  disabled = false,
}: UserBrainIntakeChatProps) {
  const [classifying, setClassifying] = useState(false);

  const intake = intakeProp ?? createEmptyIntake();
  const intakeComplete = Boolean(intake.intakeComplete && userBrain);

  const initialMessages = useMemo(() => {
    if (intake.rawAnswers.length === 0) {
      return [
        {
          role: "assistant" as const,
          content: `${USER_BRAIN_INTAKE_GREETING}\n\n${INTAKE_QUESTIONS[0].text}`,
        },
      ];
    }
    return buildIntakeTranscript(intake);
  }, [intake]);

  const userLabel = formatArchitectLabel(intake.name);

  const handleCustomSend = useCallback(
    async (message: string, _history: ChatMessage[]): Promise<string> => {
      if (intakeComplete) {
        return "Your profile is set — hit Continue when you're ready.";
      }

      const question = INTAKE_QUESTIONS[intake.questionIndex];
      if (!question) {
        return "Something went wobbly with the intake order. Refresh and we'll try again.";
      }

      const validationError = validateIntakeAnswer(question, message);
      if (validationError) {
        return validationError;
      }

      playCliveReaction?.("listen");
      const updatedIntake = applyIntakeAnswer(intake, question, message);
      onIntakeUpdate(updatedIntake);

      const nextMessage = getNextAssistantMessage(updatedIntake, message, question);
      if (nextMessage) {
        playCliveReaction?.("pleased");
        return nextMessage;
      }

      setClassifying(true);

      try {
        const response = await fetch("/api/chapter1/classify-user-brain", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            intake: updatedIntake,
            answers: updatedIntake.rawAnswers,
          }),
        });

        let profileId: string;
        let summary: string;
        let profile: UserBrainProfile;

        if (response.ok) {
          const data = (await response.json()) as {
            profileId: string;
            profile: UserBrainProfile;
            summary: string;
          };
          profileId = data.profileId;
          summary = data.summary;
          profile = data.profile;
        } else {
          const heuristic = inferProfileFromIntake(updatedIntake);
          profileId = heuristic.profileId;
          summary = heuristic.summary;
          profile = getProfileById(profileId)!;
        }

        const completedIntake = enrichIntakeWithThemeRecommendations({
          ...updatedIntake,
          inferredProfileId: profileId,
          intakeComplete: true,
          classificationSummary: summary,
        });

        onIntakeUpdate(completedIntake);
        onComplete(completedIntake, profile);
        playCliveReaction?.("pleased");

        void saveUserBrainToWorkshop({
          sessionId,
          name: completedIntake.name,
          role: completedIntake.role,
          goal: completedIntake.goal,
          profileLabel: profile.label,
          aiConfidence: profile.aiConfidence,
          contextConfidence: profile.contextConfidence,
          classificationSummary: summary,
          guideMode,
        }).catch(() => {
          // Workshop save is best-effort — intake still works in session
        });

        return "I've captured your profile on the right-hand page — review it, then hit Continue when you're ready.";
      } catch {
        const heuristic = inferProfileFromIntake(updatedIntake);
        const profile = getProfileById(heuristic.profileId)!;
        const completedIntake = enrichIntakeWithThemeRecommendations({
          ...updatedIntake,
          inferredProfileId: heuristic.profileId,
          intakeComplete: true,
          classificationSummary: heuristic.summary,
        });
        onIntakeUpdate(completedIntake);
        onComplete(completedIntake, profile);
        playCliveReaction?.("pleased");

        void saveUserBrainToWorkshop({
          sessionId,
          name: completedIntake.name,
          role: completedIntake.role,
          goal: completedIntake.goal,
          profileLabel: profile.label,
          aiConfidence: profile.aiConfidence,
          contextConfidence: profile.contextConfidence,
          classificationSummary: heuristic.summary,
          guideMode,
        }).catch(() => {});

        return "I've captured your profile on the right-hand page — review it, then hit Continue when you're ready.";
      } finally {
        setClassifying(false);
      }
    },
    [intake, intakeComplete, guideMode, onComplete, onIntakeUpdate, playCliveReaction, sessionId],
  );

  const summaryCard =
    intakeComplete && userBrain
      ? buildIntakeSummaryCard(intake, userBrain)
      : null;

  return (
    <div className="chapter1-intake-chat">
      <CliveChatSurface
        key="user-brain-intake"
        persona="clive"
        sessionId={sessionId}
        studyMode
        userLabel={userLabel}
        initialMessages={initialMessages}
        onCustomSend={handleCustomSend}
        placeholder={
          INTAKE_QUESTIONS[intake.questionIndex]?.placeholder ??
          (intake.questionIndex === 0 ? "Your name or nickname" : "Type your answer…")
        }
        disabled={disabled || classifying || intakeComplete}
        transcriptOnly={intakeComplete}
        onUserMessage={() => playCliveReaction?.("listen")}
        onThinkingChange={(thinking) => {
          if (thinking) playCliveReaction?.("think");
        }}
        onAssistantMessage={() => playCliveReaction?.("pleased")}
      />

      {summaryCard ? (
        <StudyStageRightPanel>
          <article className="study-doc-card chapter1-intake-summary study-stage__right-summary">
            <p className="study-doc-card__tag">Your profile</p>
            {intake.classificationSummary ? (
              <p className="study-doc-card__body">{intake.classificationSummary}</p>
            ) : null}
            <p className="study-doc-card__note">
              Inferred profile: <strong>{summaryCard.profileLabel}</strong>
              {summaryCard.sectorLabel ? (
                <>
                  {" "}
                  · Sector: <strong>{summaryCard.sectorLabel}</strong>
                </>
              ) : null}{" "}
              — shaped from your answers. Clive will adapt pace and tone from here.
            </p>
          </article>
        </StudyStageRightPanel>
      ) : null}
    </div>
  );
}
