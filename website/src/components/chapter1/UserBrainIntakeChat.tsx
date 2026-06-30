"use client";

import { useCallback, useMemo, useState } from "react";
import { CliveChatSurface } from "@/components/chapter1/CliveChatSurface";
import type { CliveReaction } from "@/lib/clive/video-reactions";
import type { ChatMessage } from "@/lib/clive/types";
import type { UserBrainIntake, UserBrainProfile } from "@/lib/aie-demo/types";
import {
  applyIntakeAnswer,
  buildIntakeSummaryCard,
  buildIntakeTranscript,
  createEmptyIntake,
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
  onIntakeUpdate: (intake: UserBrainIntake) => void;
  onComplete: (intake: UserBrainIntake, profile: UserBrainProfile) => void;
  playCliveReaction?: (reaction: CliveReaction) => void;
  disabled?: boolean;
};

export function UserBrainIntakeChat({
  sessionId,
  intake: intakeProp,
  userBrain,
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

  const userLabel = intake.name?.trim() || "You";

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

        const completedIntake: UserBrainIntake = {
          ...updatedIntake,
          inferredProfileId: profileId,
          intakeComplete: true,
          classificationSummary: summary,
        };

        onIntakeUpdate(completedIntake);
        onComplete(completedIntake, profile);
        playCliveReaction?.("pleased");
        return summary;
      } catch {
        const heuristic = inferProfileFromIntake(updatedIntake);
        const profile = getProfileById(heuristic.profileId)!;
        const completedIntake: UserBrainIntake = {
          ...updatedIntake,
          inferredProfileId: heuristic.profileId,
          intakeComplete: true,
          classificationSummary: heuristic.summary,
        };
        onIntakeUpdate(completedIntake);
        onComplete(completedIntake, profile);
        playCliveReaction?.("pleased");
        return heuristic.summary;
      } finally {
        setClassifying(false);
      }
    },
    [intake, intakeComplete, onComplete, onIntakeUpdate, playCliveReaction],
  );

  const summaryCard =
    intakeComplete && userBrain
      ? buildIntakeSummaryCard(intake, userBrain)
      : null;

  return (
    <>
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

      {summaryCard && (
        <article className="study-doc-card chapter1-intake-summary">
          <p className="study-doc-card__title">{summaryCard.headline}</p>
          <ul className="study-doc-card__list">
            {summaryCard.lines.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
          <p className="study-doc-card__note">
            Inferred profile: <strong>{summaryCard.profileLabel}</strong> — Clive will adapt pace
            and tone from here. You did not pick a card; I classified from what you said.
          </p>
        </article>
      )}
    </>
  );
}
