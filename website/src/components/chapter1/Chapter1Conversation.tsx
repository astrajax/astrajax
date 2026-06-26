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

type Chapter1ConversationProps = StepProps;

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
    <div className="chapter1-conversation space-y-6">
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
      />

      {error && (
        <p className="rounded-lg bg-apricot/10 px-4 py-2 text-sm text-apricot" role="alert">
          {error}
        </p>
      )}

      <div className="chapter1-conversation__actions">
        {state.currentStep === "user_brain" && (
          <div className="space-y-3">
            <p className="text-sm text-parchment/80">Pick who sits in the chair:</p>
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
              className="btn-primary disabled:opacity-40"
              disabled={!state.userBrain}
              onClick={onNext}
            >
              Continue
            </button>
          </div>
        )}

        {state.currentStep === "guide" && (
          <div className="space-y-3">
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
              className="btn-primary disabled:opacity-40"
              disabled={!state.guideMode}
              onClick={onNext}
            >
              Start with Clive
            </button>
          </div>
        )}

        {(state.currentStep === "clive_interview" || state.currentStep === "business_brain") && (
          <>
            {state.currentStep === "business_brain" && (
              <div className="mb-4 rounded-xl border border-parchment/20 bg-moss/25 p-5 text-sm text-parchment/90">
                <p className="font-display text-base font-semibold text-parchment">
                  Workshop draft — {state.businessBrain.clientName}
                </p>
                <p className="mt-2">{state.businessBrain.goal}</p>
                <ul className="mt-3 list-inside list-disc space-y-1 opacity-90">
                  {state.businessBrain.workflows.slice(0, 3).map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
                {state.businessBrain.knownGaps.length > 0 && (
                  <p className="mt-3 text-apricot/90">
                    Gaps not yet trusted: {state.businessBrain.knownGaps[0]}
                  </p>
                )}
              </div>
            )}
            <div className="flex flex-wrap gap-3">
              {onBack && (
                <button type="button" className="clive-study__ghost-btn" onClick={onBack}>
                  Back
                </button>
              )}
              <button type="button" className="btn-primary" onClick={onNext}>
                {state.currentStep === "clive_interview" ? "See the draft brief" : "Ask Pam to challenge"}
              </button>
            </div>
          </>
        )}

        {state.currentStep === "pam_challenge" && (
          <div className="rounded-xl border border-parchment/20 bg-moss/30 p-5">
            {state.userBrain?.pamSensitivity === "high" && (
              <p className="mb-3 text-sm text-parchment/75">
                Your profile: Pam will challenge sooner when evidence wobbles.
              </p>
            )}
            <dl className="space-y-3 text-sm text-parchment/90">
              <div>
                <dt className="font-mono text-xs uppercase opacity-70">Strongest part</dt>
                <dd>{state.pamReview.strongestPart}</dd>
              </div>
              <div>
                <dt className="font-mono text-xs uppercase opacity-70">Weakest assumption</dt>
                <dd>{state.pamReview.weakestAssumption}</dd>
              </div>
              <div>
                <dt className="font-mono text-xs uppercase opacity-70">Missing evidence</dt>
                <dd>{state.pamReview.missingEvidence}</dd>
              </div>
              <div>
                <dt className="font-mono text-xs uppercase opacity-70">Rabbit-hole risk</dt>
                <dd>{state.pamReview.rabbitHoleRisk}</dd>
              </div>
              <div>
                <dt className="font-mono text-xs uppercase opacity-70">Safe to send to Doc?</dt>
                <dd>
                  {state.pamReview.safeToSendToDoc === "yes"
                    ? "Pam says yes — you still decide."
                    : "Not yet — review gaps first."}
                </dd>
              </div>
            </dl>
            <div className="mt-4 flex flex-wrap gap-3">
              {onBack && (
                <button type="button" className="clive-study__ghost-btn" onClick={onBack}>
                  Back
                </button>
              )}
              <button type="button" className="btn-primary" onClick={onNext}>
                Ready for my decision
              </button>
            </div>
          </div>
        )}

        {state.currentStep === "human_decision" && (
          <div className="space-y-4">
            <blockquote className="border-l-4 border-apricot pl-4 font-display text-lg italic text-parchment">
              {OWNERSHIP_LINE}
            </blockquote>
            {!state.humanApproved ? (
              <button
                type="button"
                className="btn-primary"
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
              <button type="button" className="btn-primary" onClick={onNext}>
                Doc, file it
              </button>
            )}
          </div>
        )}

        {state.currentStep === "doc_handoff" && (
          <div className="space-y-4">
            {!state.promoteReceipt ? (
              <button
                type="button"
                className="btn-primary disabled:opacity-40"
                disabled={loading || !state.humanApproved}
                onClick={handlePromote}
              >
                {loading ? "Doc is filing…" : "Doc, promote to Trusted Brain"}
              </button>
            ) : (
              <div className="rounded-xl border border-sage/40 bg-sage/10 p-5 text-sm text-ink">
                <p className="font-medium">{state.promoteReceipt.changeSummary}</p>
                <p className="mt-2 text-ink-muted">
                  Filed by {state.promoteReceipt.executingAgent}, approved by{" "}
                  {state.promoteReceipt.approver}.
                </p>
                <button type="button" className="btn-primary mt-4" onClick={onNext}>
                  Use approved context
                </button>
              </div>
            )}
          </div>
        )}

        {state.currentStep === "context_access" && state.brainMaturity === "working" && (
          <div className="space-y-3">
            {state.snippets.length > 0 && (
              <div className="space-y-2">
                {state.snippets.map((snippet) => (
                  <div
                    key={snippet.recordId}
                    className="rounded-lg border border-parchment/20 bg-moss/20 p-4 text-sm text-parchment"
                  >
                    <p className="font-medium">{snippet.title}</p>
                    <p className="mt-1 opacity-90">{snippet.text}</p>
                  </div>
                ))}
              </div>
            )}
            {!state.keyRequest && (
              <button
                type="button"
                className="btn-primary disabled:opacity-40"
                disabled={loading}
                onClick={handleRequestAccess}
              >
                {loading ? "Requesting…" : "Clive asks to use approved context"}
              </button>
            )}
            {state.keyRequest && !state.grant && (
              <button
                type="button"
                className="btn-primary disabled:opacity-40"
                disabled={loading}
                onClick={handleApproveAccess}
              >
                {loading ? "Approving…" : "Approve for this task"}
              </button>
            )}
            {state.grant && state.snippets.length > 0 && (
              <button type="button" className="btn-primary" onClick={onNext}>
                See what this unlocks
              </button>
            )}
          </div>
        )}

        {state.currentStep === "receipts" && (
          <div className="space-y-6">
            <div className="grid gap-3 sm:grid-cols-2">
              {RECEIPT_CARDS.map((card) => (
                <article
                  key={card.id}
                  className="rounded-xl border border-parchment/20 bg-moss/20 p-4 text-sm text-parchment"
                >
                  {card.tag && (
                    <span className="font-mono text-xs uppercase tracking-wide text-apricot/90">
                      {card.tag}
                    </span>
                  )}
                  <h3 className="mt-1 font-display font-semibold">{card.title}</h3>
                  <p className="mt-2 opacity-90">{card.summary}</p>
                </article>
              ))}
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href="/" className="btn-secondary">
                Back to home
              </Link>
              <Link href="/brain/review" className="btn-primary">
                Brain review
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
