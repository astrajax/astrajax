"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { CliveChatSurface } from "@/components/chapter1/CliveChatSurface";
import { StudyStageDecisionPanel } from "@/components/chapter1/StudyStageDecisionPanel";
import type { CliveReaction } from "@/lib/clive/video-reactions";
import type { ChatMessage } from "@/lib/clive/types";
import type { UserBrainIntake, UserBrainProfile } from "@/lib/aie-demo/types";
import { saveUserBrainToWorkshop } from "@/lib/aie-demo/brain-client";
import { formatArchitectLabel } from "@/lib/chapter1/format-labels";
import {
  intakeFromCaptured,
  mergeCaptured,
  type CapturedIntakeFields,
} from "@/lib/aie-demo/intake-agenda";
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

const INTAKE_MAX_MESSAGE_LENGTH = 800;

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

type ClassifyResponse = {
  profileId: string;
  profile: UserBrainProfile;
  summary: string;
  intake?: UserBrainIntake;
};

type IntakeChatTurnResponse = {
  reply?: string;
  captured?: unknown;
  done?: boolean;
  fallback?: boolean;
};

function capturedFromIntake(intake: UserBrainIntake): CapturedIntakeFields {
  return mergeCaptured(
    {},
    {
      name: intake.name,
      role: intake.role,
      businessSector: intake.businessSector,
      devExperience: intake.devExperience,
      aiComfort: intake.aiComfort,
      contextFamiliarity: intake.contextFamiliarity,
      goal: intake.goal,
    },
  );
}

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

  // The AI conducts the interview; the scripted engine is the booth-safe
  // fallback. Sessions restored mid-flight resume on the script (its
  // transcript rebuild is deterministic); fresh sessions start on the AI.
  const [engine, setEngine] = useState<"ai" | "script">(() =>
    intake.rawAnswers.length > 0 && !intake.intakeComplete ? "script" : "ai",
  );
  const capturedRef = useRef<CapturedIntakeFields>(capturedFromIntake(intake));

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

  const finishWithProfile = useCallback(
    (completedIntake: UserBrainIntake, profile: UserBrainProfile, summary: string) => {
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
    },
    [guideMode, onComplete, onIntakeUpdate, playCliveReaction, sessionId],
  );

  const completeHeuristically = useCallback(
    (baseIntake: UserBrainIntake): string => {
      const heuristic = inferProfileFromIntake(baseIntake);
      const profile = getProfileById(heuristic.profileId)!;
      const completedIntake = enrichIntakeWithThemeRecommendations({
        ...baseIntake,
        inferredProfileId: heuristic.profileId,
        intakeComplete: true,
        classificationSummary: heuristic.summary,
      });
      finishWithProfile(completedIntake, profile, heuristic.summary);
      return "I've captured your profile on the right-hand page — review it, then hit Continue when you're ready.";
    },
    [finishWithProfile],
  );

  /**
   * The authoritative pass: the classifier re-reads the full conversation
   * and extracts the profile from everything said — not slot-by-slot.
   */
  const completeViaClassify = useCallback(
    async (baseIntake: UserBrainIntake, transcript: ChatMessage[]): Promise<void> => {
      setClassifying(true);
      try {
        const response = await fetch("/api/chapter1/classify-user-brain", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            intake: baseIntake,
            answers: baseIntake.rawAnswers,
            transcript,
          }),
        });

        if (!response.ok) {
          completeHeuristically(baseIntake);
          return;
        }

        const data = (await response.json()) as ClassifyResponse;
        const completedIntake: UserBrainIntake = data.intake?.intakeComplete
          ? data.intake
          : enrichIntakeWithThemeRecommendations({
              ...baseIntake,
              inferredProfileId: data.profileId,
              intakeComplete: true,
              classificationSummary: data.summary,
            });
        const profile = getProfileById(data.profileId) ?? data.profile;

        finishWithProfile(completedIntake, profile, data.summary);
      } catch {
        completeHeuristically(baseIntake);
      } finally {
        setClassifying(false);
      }
    },
    [completeHeuristically, finishWithProfile],
  );

  /** The scripted engine, unchanged in behaviour — now the fallback path. */
  const handleScriptTurn = useCallback(
    async (message: string, currentIntake: UserBrainIntake): Promise<string> => {
      const question = INTAKE_QUESTIONS[currentIntake.questionIndex];
      if (!question) {
        return "Something went wobbly with the intake order. Refresh and we'll try again.";
      }

      const validationError = validateIntakeAnswer(question, message);
      if (validationError) {
        return validationError;
      }

      playCliveReaction?.("listen");
      const updatedIntake = applyIntakeAnswer(currentIntake, question, message);
      capturedRef.current = capturedFromIntake(updatedIntake);
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

        if (response.ok) {
          const data = (await response.json()) as ClassifyResponse;
          const completedIntake: UserBrainIntake = data.intake?.intakeComplete
            ? data.intake
            : enrichIntakeWithThemeRecommendations({
                ...updatedIntake,
                inferredProfileId: data.profileId,
                intakeComplete: true,
                classificationSummary: data.summary,
              });
          const profile = getProfileById(data.profileId) ?? data.profile;
          finishWithProfile(completedIntake, profile, data.summary);
          return "I've captured your profile on the right-hand page — review it, then hit Continue when you're ready.";
        }

        return completeHeuristically(updatedIntake);
      } catch {
        return completeHeuristically(updatedIntake);
      } finally {
        setClassifying(false);
      }
    },
    [completeHeuristically, finishWithProfile, onIntakeUpdate, playCliveReaction],
  );

  /** The AI interview turn; on any failure it bridges to the script. */
  const handleAiTurn = useCallback(
    async (message: string, history: ChatMessage[]): Promise<string> => {
      let data: IntakeChatTurnResponse | null = null;

      try {
        const response = await fetch("/api/chapter1/intake-chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId,
            message,
            history,
            captured: capturedRef.current,
          }),
        });
        if (response.ok) {
          data = (await response.json()) as IntakeChatTurnResponse;
        }
      } catch {
        data = null;
      }

      if (!data || data.fallback || !data.reply || !data.reply.trim()) {
        // Bridge to the scripted engine mid-conversation: captured fields
        // become answered questions and the script resumes at the first
        // uncovered one — the interview continues, degraded but unbroken.
        const bridged = intakeFromCaptured(capturedRef.current);
        setEngine("script");
        onIntakeUpdate(bridged);
        return handleScriptTurn(message, bridged);
      }

      playCliveReaction?.("listen");
      capturedRef.current = mergeCaptured(capturedRef.current, data.captured);
      const bridged = intakeFromCaptured(capturedRef.current);
      onIntakeUpdate(bridged);

      const reply = data.reply.trim();

      if (data.done) {
        const transcript: ChatMessage[] = [
          ...history,
          { role: "user", content: message },
          { role: "assistant", content: reply },
        ];
        await completeViaClassify(bridged, transcript);
        return reply;
      }

      playCliveReaction?.("pleased");
      return reply;
    },
    [completeViaClassify, handleScriptTurn, onIntakeUpdate, playCliveReaction, sessionId],
  );

  const handleCustomSend = useCallback(
    async (message: string, history: ChatMessage[]): Promise<string> => {
      if (intakeComplete) {
        return "Your profile is set — hit Continue when you're ready.";
      }
      if (engine === "ai") {
        return handleAiTurn(message, history);
      }
      return handleScriptTurn(message, intake);
    },
    [engine, handleAiTurn, handleScriptTurn, intake, intakeComplete],
  );

  const summaryCard =
    intakeComplete && userBrain
      ? buildIntakeSummaryCard(intake, userBrain)
      : null;

  return (
    <div className={`chapter1-intake-chat${summaryCard ? " chapter1-right-decision" : ""}`}>
      <CliveChatSurface
        key="user-brain-intake"
        persona="clive"
        sessionId={sessionId}
        studyMode
        userLabel={userLabel}
        maxLength={INTAKE_MAX_MESSAGE_LENGTH}
        initialMessages={initialMessages}
        onCustomSend={handleCustomSend}
        placeholder={
          engine === "script"
            ? (INTAKE_QUESTIONS[intake.questionIndex]?.placeholder ??
              (intake.questionIndex === 0 ? "Your name or nickname" : "Type your answer…"))
            : intake.name
              ? "Your answer — or ask Clive what he means…"
              : "Your name or nickname"
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
        <StudyStageDecisionPanel>
          <article className="study-doc-card">
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
        </StudyStageDecisionPanel>
      ) : null}
    </div>
  );
}
