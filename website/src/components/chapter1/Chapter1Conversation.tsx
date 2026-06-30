"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import {
  approveBrainKey,
  logInteraction,
  promoteToTrusted,
  requestBrainKey,
  retrieveContext,
} from "@/lib/aie-demo/brain-client";
import {
  CHAPTER1_CLIVE_GREETING,
  CHAPTER1_PAM_GREETING,
} from "@/lib/clive/chapter1-fallback";
import {
  CLIVE_DRAFT_SUMMARY,
  DEMO_SCOPE,
  GUIDE_MODE_OPTIONS,
  OWNERSHIP_LINE,
  PROMOTE_DRAFT,
  RECEIPT_CARDS,
  USER_BRAIN_PROFILES,
} from "@/lib/aie-demo/demo-data";
import type { LoopState, LoopStep, StepProps } from "@/lib/aie-demo/types";
import { DEMO_BRAIN_SLUG } from "@/lib/aie-demo/types";
import { buildLoopContextSummary } from "@/lib/clive/loop-context";
import { cliveMessageForState } from "@/lib/brains/ui-states";
import { CliveChatSurface } from "@/components/chapter1/CliveChatSurface";
import type { CliveReaction } from "@/lib/clive/video-reactions";

type Chapter1ConversationProps = StepProps & {
  playCliveReaction?: (reaction: CliveReaction) => void;
};

const BEAT_GREETINGS: Partial<Record<LoopStep, string>> = {
  user_brain: CHAPTER1_CLIVE_GREETING,
  guide: "Same scopes underneath — how much character do you want in the room?",
  clive_interview: "Tell me what your team actually does day to day — not the slide version.",
  business_brain: CLIVE_DRAFT_SUMMARY,
  pam_challenge: CHAPTER1_PAM_GREETING,
  human_decision: "Pam has had her say. What becomes trusted is your call — not mine.",
  doc_handoff: "Your approved brief is ready for filing. I'll ask Doc to promote it when you say so.",
  context_access: "Approved context exists now. I can ask to use it for a bounded task — you approve, it's scoped and logged.",
  receipts: "That's the loop. Your brain is growing up — here's what it unlocks next.",
};

export function Chapter1Conversation({
  state,
  accessState,
  onUpdate,
  onNext,
  onBack,
  playCliveReaction,
}: Chapter1ConversationProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loopContext = useMemo(
    () =>
      buildLoopContextSummary({
        userBrainLabel: state.userBrain?.label,
        guideMode: state.guideMode ?? undefined,
        businessGoal: state.businessBrain.goal,
        beat: state.currentStep,
        cliveTone: state.userBrain?.cliveTone,
        pamSensitivity: state.userBrain?.pamSensitivity,
      }),
    [state],
  );

  const persona = state.currentStep === "pam_challenge" ? "pam" : "clive";
  const greeting = BEAT_GREETINGS[state.currentStep];

  const handlePromote = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await promoteToTrusted({
        approvalDecisionId: state.approvalDecisionId || `session_${state.sessionId}`,
        brainSlug: DEMO_BRAIN_SLUG,
        promotions: [PROMOTE_DRAFT],
        approver: "Matthew",
        reason: "Human approved business brain brief after Pam sniff test",
      });

      onUpdate({
        promoteReceipt: {
          promotedRecordIds: result.promotedRecordIds,
          changeSummary: `Doc filed ${result.promotedRecordIds.length} approved snippet(s) into the Trusted Brain`,
          executingAgent: "Doc",
          approver: "Matthew",
        },
        brainMaturity: "working",
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Doc could not file the brief.");
    } finally {
      setLoading(false);
    }
  }, [onUpdate, state.approvalDecisionId, state.sessionId]);

  const handleRequestAccess = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await requestBrainKey({
        brainSlug: DEMO_BRAIN_SLUG,
        persona: "clive",
        purpose: "Answer a question using approved positioning context",
        scope: DEMO_SCOPE,
        reason: state.businessBrain.knownGaps[0] ?? "Need approved snippets for this task",
        sessionId: state.sessionId,
        requestedExpiryMinutes: 15,
      });

      onUpdate({
        keyRequest: {
          requestId: result.requestId,
          brainSlug: DEMO_BRAIN_SLUG,
          persona: "clive",
          purpose: "Answer using approved positioning",
          scope: DEMO_SCOPE,
          reason: "Use approved context for this task",
          sessionId: state.sessionId,
          status: "pending",
          requestedAt: new Date().toISOString(),
          expiresAt: result.expiresAt,
        },
        demoScope: DEMO_SCOPE,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not request context access.");
    } finally {
      setLoading(false);
    }
  }, [onUpdate, state.businessBrain.knownGaps, state.sessionId]);

  const handleApproveAccess = useCallback(async () => {
    if (!state.keyRequest) return;
    setLoading(true);
    setError(null);
    try {
      const approveResult = await approveBrainKey({
        requestId: state.keyRequest.requestId,
        decision: "approved",
        approver: "Matthew",
        grantMaxUses: 3,
        grantExpiryMinutes: 15,
      });

      const grant = {
        grantId: approveResult.grantId,
        requestId: state.keyRequest.requestId,
        brainSlug: DEMO_BRAIN_SLUG,
        persona: "clive" as const,
        scope: state.demoScope,
        sessionId: state.sessionId,
        approvedBy: "Matthew",
        approvedAt: new Date().toISOString(),
        expiresAt: approveResult.expiresAt,
        maxUses: approveResult.maxUses,
        useCount: 0,
        status: "active" as const,
      };

      const retrieveResult = await retrieveContext({
        grantId: approveResult.grantId,
        sessionId: state.sessionId,
        persona: "clive",
        brainSlug: DEMO_BRAIN_SLUG,
        scope: state.demoScope,
      });

      await logInteraction({
        sessionId: state.sessionId,
        persona: "clive",
        brainSlug: DEMO_BRAIN_SLUG,
        userMessage: "Approved context access for this task",
        assistantReply: cliveMessageForState("unlocked"),
        manifest: retrieveResult.manifest,
        channel: "booth",
      });

      onUpdate({ grant, snippets: retrieveResult.snippets });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not approve access.");
    } finally {
      setLoading(false);
    }
  }, [onUpdate, state.demoScope, state.keyRequest, state.sessionId]);

  return (
    <div className="chapter1-conversation">
      <CliveChatSurface
        key={`${state.currentStep}-${persona}`}
        persona={persona}
        greeting={greeting}
        beat={state.currentStep}
        loopContext={loopContext}
        sessionId={state.sessionId}
        placeholder={persona === "pam" ? "Respond to Pam…" : "Talk to Clive…"}
        starterPrompts={
          state.currentStep === "clive_interview"
            ? ["We run weekly forecasts with five spreadsheets", "Context lives in WhatsApp and Notion"]
            : []
        }
        disabled={loading}
        studyMode
        userLabel="The Architect"
        onUserMessage={() => {
          if (persona === "clive") playCliveReaction?.("listen");
        }}
        onThinkingChange={(thinking) => {
          if (persona === "clive" && thinking) playCliveReaction?.("think");
        }}
        onAssistantMessage={() => {
          if (persona === "clive") playCliveReaction?.("pleased");
        }}
      />

      {error && (
        <p className="study-stage__error" role="alert">
          {error}
        </p>
      )}

      <div className="chapter1-conversation__actions">
        {state.currentStep === "user_brain" && (
          <div className="chapter1-conversation__beat">
            <p className="chapter1-conversation__prompt">Pick who sits in the chair:</p>
            <div className="grid gap-2">
              {USER_BRAIN_PROFILES.map((profile) => (
                <button
                  key={profile.id}
                  type="button"
                  onClick={() => onUpdate({ userBrain: profile })}
                  className={`chapter1-choice ${
                    state.userBrain?.id === profile.id ? "chapter1-choice--selected" : ""
                  }`}
                >
                  {profile.label}
                </button>
              ))}
            </div>
            <button
              type="button"
              className="btn-primary chapter1-conversation__primary disabled:opacity-40"
              disabled={!state.userBrain}
              onClick={onNext}
            >
              Continue
            </button>
          </div>
        )}

        {state.currentStep === "guide" && (
          <div className="chapter1-conversation__beat">
            {GUIDE_MODE_OPTIONS.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => onUpdate({ guideMode: option.id })}
                className={`chapter1-choice ${
                  state.guideMode === option.id ? "chapter1-choice--selected" : ""
                }`}
              >
                <span className="font-medium">{option.label}</span>
                <span className="mt-1 block text-sm opacity-80">{option.description}</span>
              </button>
            ))}
            <button
              type="button"
              className="btn-primary chapter1-conversation__primary disabled:opacity-40"
              disabled={!state.guideMode}
              onClick={onNext}
            >
              Start with Clive
            </button>
          </div>
        )}

        {(state.currentStep === "clive_interview" || state.currentStep === "business_brain") && (
          <div className="chapter1-conversation__beat">
            {state.currentStep === "business_brain" && (
              <article className="study-doc-card">
                <p className="study-doc-card__title">
                  Workshop draft — {state.businessBrain.clientName}
                </p>
                <p className="study-doc-card__body">{state.businessBrain.goal}</p>
                <ul className="study-doc-card__list">
                  {state.businessBrain.workflows.slice(0, 3).map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
                {state.businessBrain.knownGaps.length > 0 && (
                  <p className="study-doc-card__note">
                    Gaps not yet trusted: {state.businessBrain.knownGaps[0]}
                  </p>
                )}
              </article>
            )}
            <div className="chapter1-conversation__nav">
              {onBack && (
                <button type="button" className="study-stage__ghost-btn" onClick={onBack}>
                  Back
                </button>
              )}
              <button type="button" className="btn-primary chapter1-conversation__primary" onClick={onNext}>
                {state.currentStep === "clive_interview" ? "See the draft brief" : "Ask Pam to challenge"}
              </button>
            </div>
          </div>
        )}

        {state.currentStep === "pam_challenge" && (
          <div className="chapter1-conversation__beat">
            <article className="study-doc-card study-doc-card--pam">
              {state.userBrain?.pamSensitivity === "high" && (
                <p className="study-doc-card__note study-doc-card__note--muted">
                  Your profile: Pam will challenge sooner when evidence wobbles.
                </p>
              )}
              <dl className="study-doc-card__dl">
                <div>
                  <dt>Strongest part</dt>
                  <dd>{state.pamReview.strongestPart}</dd>
                </div>
                <div>
                  <dt>Weakest assumption</dt>
                  <dd>{state.pamReview.weakestAssumption}</dd>
                </div>
                <div>
                  <dt>Missing evidence</dt>
                  <dd>{state.pamReview.missingEvidence}</dd>
                </div>
                <div>
                  <dt>Rabbit-hole risk</dt>
                  <dd>{state.pamReview.rabbitHoleRisk}</dd>
                </div>
                <div>
                  <dt>Safe to send to Doc?</dt>
                  <dd>
                    {state.pamReview.safeToSendToDoc === "yes"
                      ? "Pam says yes — you still decide."
                      : "Not yet — review gaps first."}
                  </dd>
                </div>
              </dl>
            </article>
            <div className="chapter1-conversation__nav">
              {onBack && (
                <button type="button" className="study-stage__ghost-btn" onClick={onBack}>
                  Back
                </button>
              )}
              <button type="button" className="btn-primary chapter1-conversation__primary" onClick={onNext}>
                Ready for my decision
              </button>
            </div>
          </div>
        )}

        {state.currentStep === "human_decision" && (
          <div className="chapter1-conversation__beat">
            <blockquote className="study-doc-card study-doc-card--quote">
              {OWNERSHIP_LINE}
            </blockquote>
            {!state.humanApproved ? (
              <button
                type="button"
                className="btn-primary chapter1-conversation__primary"
                onClick={() =>
                  onUpdate({
                    humanApproved: true,
                    approvalDecisionId: `session_${state.sessionId}`,
                  })
                }
              >
                Make this trusted — send to Doc
              </button>
            ) : (
              <button type="button" className="btn-primary chapter1-conversation__primary" onClick={onNext}>
                Doc, file it
              </button>
            )}
          </div>
        )}

        {state.currentStep === "doc_handoff" && (
          <div className="chapter1-conversation__beat">
            {!state.promoteReceipt ? (
              <button
                type="button"
                className="btn-primary chapter1-conversation__primary disabled:opacity-40"
                disabled={loading || !state.humanApproved}
                onClick={handlePromote}
              >
                {loading ? "Doc is filing…" : "Doc, promote to Trusted Brain"}
              </button>
            ) : (
              <>
                <article className="study-doc-card study-doc-card--receipt">
                  <p className="study-doc-card__title">{state.promoteReceipt.changeSummary}</p>
                  <p className="study-doc-card__body study-doc-card__body--muted">
                    Filed by {state.promoteReceipt.executingAgent}, approved by{" "}
                    {state.promoteReceipt.approver}.
                  </p>
                </article>
                <button type="button" className="btn-primary chapter1-conversation__primary" onClick={onNext}>
                  Use approved context
                </button>
              </>
            )}
          </div>
        )}

        {state.currentStep === "context_access" && state.brainMaturity === "working" && (
          <div className="chapter1-conversation__beat">
            {state.snippets.length > 0 && (
              <div className="space-y-2">
                {state.snippets.map((snippet) => (
                  <article key={snippet.recordId} className="study-doc-card">
                    <p className="study-doc-card__title">{snippet.title}</p>
                    <p className="study-doc-card__body">{snippet.text}</p>
                  </article>
                ))}
              </div>
            )}
            {!state.keyRequest && (
              <button
                type="button"
                className="btn-primary chapter1-conversation__primary disabled:opacity-40"
                disabled={loading}
                onClick={handleRequestAccess}
              >
                {loading ? "Requesting…" : "Clive asks to use approved context"}
              </button>
            )}
            {state.keyRequest && !state.grant && (
              <button
                type="button"
                className="btn-primary chapter1-conversation__primary disabled:opacity-40"
                disabled={loading}
                onClick={handleApproveAccess}
              >
                {loading ? "Approving…" : "Approve for this task"}
              </button>
            )}
            {state.grant && state.snippets.length > 0 && (
              <button type="button" className="btn-primary chapter1-conversation__primary" onClick={onNext}>
                See what this unlocks
              </button>
            )}
          </div>
        )}

        {state.currentStep === "receipts" && (
          <div className="chapter1-conversation__beat">
            <div className="study-doc-card__stack">
              {RECEIPT_CARDS.map((card) => (
                <article key={card.id} className="study-doc-card">
                  {card.tag && <span className="study-doc-card__tag">{card.tag}</span>}
                  <h3 className="study-doc-card__title">{card.title}</h3>
                  <p className="study-doc-card__body">{card.summary}</p>
                </article>
              ))}
            </div>
            <div className="chapter1-conversation__nav">
              <Link href="/" className="btn-secondary">
                Back to home
              </Link>
              <Link href="/brain/review" className="btn-primary chapter1-conversation__primary">
                Brain review
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
