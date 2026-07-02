"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  approveBrainKey,
  fetchDraftTruths,
  logInteraction,
  promoteToTrusted,
  requestBrainKey,
  retrieveContext,
} from "@/lib/aie-demo/brain-client";
import {
  CHAPTER1_PAM_GREETING,
} from "@/lib/clive/chapter1-fallback";
import {
  DEMO_SCOPE,
  mergeDraftTruthsForDisplay,
  OWNERSHIP_LINE,
  promotionsFromDrafts,
  RECEIPT_CARDS,
} from "@/lib/aie-demo/demo-data";
import {
  GOOD_THEME_QUALITIES,
  WHY_WE_THEME,
  themesForIntake,
} from "@/lib/aie-demo/brain-theme-templates";
import type { DraftTruthItem, LoopStep, StepProps } from "@/lib/aie-demo/types";
import { DEMO_BRAIN_SLUG } from "@/lib/aie-demo/types";
import { formatArchitectLabel } from "@/lib/chapter1/format-labels";
import { brainsIntroGreeting, truthApprovalGreeting } from "@/lib/clive/beat-copy";
import { buildLoopContextSummary } from "@/lib/clive/loop-context";
import { cliveMessageForState } from "@/lib/brains/ui-states";
import { CliveChatSurface } from "@/components/chapter1/CliveChatSurface";
import { StudyStageDecisionPanel } from "@/components/chapter1/StudyStageDecisionPanel";
import { UserBrainIntakeChat } from "@/components/chapter1/UserBrainIntakeChat";
import type { CliveReaction } from "@/lib/clive/video-reactions";

type Chapter1ConversationProps = StepProps & {
  playCliveReaction?: (reaction: CliveReaction) => void;
  architectPath?: boolean;
};

const STATIC_BEAT_GREETINGS: Partial<Record<LoopStep, string>> = {
  pam_challenge: CHAPTER1_PAM_GREETING,
  human_decision: "Pam has had her say on the drafts you picked. What becomes trusted is your call — not mine.",
  doc_handoff: "Your approved brief is ready for filing. I'll ask Doc to promote it when you say so.",
  context_access: "Approved context exists now. I can ask to use it for a bounded task — you approve, it's scoped and logged.",
  receipts: "That's the loop. Your brain is growing up — here's what it unlocks next.",
};

function pamNoteForDrafts(selected: DraftTruthItem[]): string {
  if (selected.length === 0) {
    return "Pick at least one draft before you decide. I won't pretend an empty approval is governance.";
  }
  if (selected.some((draft) => draft.source === "session")) {
    return "Session drafts are honest starting points — but live promote needs real Workshop rows. Strongest part: you're naming what matters. Weakest assumption: that intake alone is enough evidence without sources.";
  }
  return `You've selected ${selected.length} draft${selected.length === 1 ? "" : "s"}. Strongest part: each row is labelled and scoped. Weakest assumption: that agents will cite them before humans have promoted. Missing evidence: check canonical text against your sources before Doc files.`;
}

export function Chapter1Conversation({
  state,
  accessState,
  onUpdate,
  onNext,
  onBack,
  playCliveReaction,
  architectPath = false,
}: Chapter1ConversationProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draftsLoading, setDraftsLoading] = useState(false);

  const loopContext = useMemo(
    () =>
      buildLoopContextSummary({
        userName: state.userBrainIntake?.name,
        userRole: state.userBrainIntake?.role,
        devExperience: state.userBrainIntake?.devExperience,
        aiComfort: state.userBrainIntake?.aiComfort,
        contextFamiliarity: state.userBrainIntake?.contextFamiliarity,
        userGoal: state.userBrainIntake?.goal,
        businessSector: state.userBrainIntake?.businessSector,
        sectorLabel: state.userBrainIntake?.brainThemeRecommendations?.sectorLabel,
        userBrainLabel: state.userBrain?.label,
        guideMode: state.guideMode ?? undefined,
        businessGoal: state.businessBrain.goal,
        beat: state.currentStep,
        cliveTone: state.userBrain?.cliveTone,
        pamSensitivity: state.userBrain?.pamSensitivity,
      }),
    [state],
  );

  const userLabel = formatArchitectLabel(state.userBrainIntake?.name);
  const recommendedThemes = useMemo(
    () => themesForIntake(state.userBrainIntake),
    [state.userBrainIntake],
  );
  const themeRecommendations = state.userBrainIntake?.brainThemeRecommendations;
  const primaryPickId = themeRecommendations?.primaryPickId;
  const primaryTheme = useMemo(
    () =>
      recommendedThemes.find((theme) => theme.id === primaryPickId) ?? recommendedThemes[0] ?? null,
    [recommendedThemes, primaryPickId],
  );
  const isBrainsIntroStep = state.currentStep === "brains_intro";
  const isUserBrainStep = state.currentStep === "user_brain";
  const isTruthApprovalStep = state.currentStep === "truth_approval";
  const userBrainIntakeComplete = Boolean(
    state.userBrainIntake?.intakeComplete && state.userBrain,
  );

  const persona =
    state.currentStep === "pam_challenge" || state.currentStep === "truth_approval"
      ? "pam"
      : "clive";

  const greeting = useMemo(() => {
    if (state.currentStep === "brains_intro") {
      return brainsIntroGreeting(state.userBrainIntake);
    }
    if (state.currentStep === "truth_approval") {
      return truthApprovalGreeting(state.userBrainIntake);
    }
    return STATIC_BEAT_GREETINGS[state.currentStep];
  }, [state.currentStep, state.userBrainIntake]);

  const selectedDrafts = useMemo(
    () =>
      state.draftTruths.filter((draft) => state.selectedDraftIds.includes(draft.recordId)),
    [state.draftTruths, state.selectedDraftIds],
  );

  useEffect(() => {
    if (!isTruthApprovalStep) return;
    if (state.draftTruths.length > 0) return;

    let cancelled = false;
    setDraftsLoading(true);
    setError(null);

    void (async () => {
      try {
        const result = await fetchDraftTruths(DEMO_BRAIN_SLUG);
        const workshopDrafts: DraftTruthItem[] = (result.drafts ?? []).map((draft) => ({
          ...draft,
          source: draft.source ?? "workshop",
        }));
        const merged = mergeDraftTruthsForDisplay(
          state.sessionId,
          state.userBrainIntake,
          workshopDrafts,
        );

        if (cancelled) return;

        onUpdate({
          draftTruths: merged.drafts,
          draftTruthsSource: merged.source,
          draftTruthsNotice: result.message ?? merged.notice,
          selectedDraftIds:
            state.selectedDraftIds.length > 0
              ? state.selectedDraftIds
              : merged.drafts.slice(0, 1).map((draft) => draft.recordId),
        });
      } catch (err) {
        if (cancelled) return;
        const merged = mergeDraftTruthsForDisplay(state.sessionId, state.userBrainIntake, []);
        onUpdate({
          draftTruths: merged.drafts,
          draftTruthsSource: merged.source,
          draftTruthsNotice:
            err instanceof Error ? err.message : "Could not reach Workshop — using session drafts.",
          selectedDraftIds: merged.drafts.slice(0, 1).map((draft) => draft.recordId),
        });
      } finally {
        if (!cancelled) setDraftsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [
    isTruthApprovalStep,
    onUpdate,
    state.draftTruths.length,
    state.sessionId,
    state.userBrainIntake,
    state.selectedDraftIds.length,
  ]);

  const toggleDraftSelection = useCallback(
    (recordId: string) => {
      const selected = state.selectedDraftIds.includes(recordId);
      onUpdate({
        selectedDraftIds: selected
          ? state.selectedDraftIds.filter((id) => id !== recordId)
          : [...state.selectedDraftIds, recordId],
      });
    },
    [onUpdate, state.selectedDraftIds],
  );

  const handlePromote = useCallback(async () => {
    setLoading(true);
    setError(null);

    const promotions = promotionsFromDrafts(state.draftTruths, state.selectedDraftIds);
    if (promotions.length === 0) {
      setError("Select at least one draft truth to promote.");
      setLoading(false);
      return;
    }

    try {
      const result = await promoteToTrusted({
        approvalDecisionId: state.approvalDecisionId || `session_${state.sessionId}`,
        brainSlug: DEMO_BRAIN_SLUG,
        promotions,
        approver: "Matthew",
        reason: "Human approved draft brain truth(s) after review",
      });

      onUpdate({
        promoteReceipt: {
          promotedRecordIds: result.promotedRecordIds,
          changeSummary: `Doc filed ${result.promotedRecordIds.length} approved snippet(s) into the Trusted Brain (${result.mode} mode)`,
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
  }, [onUpdate, state.approvalDecisionId, state.draftTruths, state.selectedDraftIds, state.sessionId]);

  const handleRequestAccess = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await requestBrainKey({
        brainSlug: DEMO_BRAIN_SLUG,
        persona: "clive",
        purpose: "Answer a question using approved positioning context",
        scope: DEMO_SCOPE,
        reason: state.draftTruths[0]?.title ?? "Need approved snippets for this task",
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
  }, [onUpdate, state.draftTruths, state.sessionId]);

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

  const showChat =
    !isUserBrainStep && !(isTruthApprovalStep && architectPath);

  const hasRightDecisionPanel =
    (isBrainsIntroStep && Boolean(primaryTheme)) ||
    state.currentStep === "business_brain" ||
    state.currentStep === "pam_challenge" ||
    state.currentStep === "human_decision" ||
    (state.currentStep === "truth_approval" && !draftsLoading) ||
    (state.currentStep === "doc_handoff" && Boolean(state.promoteReceipt)) ||
    (state.currentStep === "context_access" &&
      state.brainMaturity === "working" &&
      state.snippets.length > 0) ||
    state.currentStep === "receipts";

  const rightDecisionPanel = useMemo(() => {
    if (isBrainsIntroStep && primaryTheme) {
      return (
        <StudyStageDecisionPanel>
          <article className="study-doc-card study-doc-card--selected">
            <span className="study-doc-card__tag">
              {primaryTheme.label}
              {primaryTheme.isCore ? " · always one" : ""}
              {" · start here"}
            </span>
            <p className="study-doc-card__body">{primaryTheme.description}</p>
            <p className="study-doc-card__note study-doc-card__note--muted">
              {primaryTheme.whyRecommended}
            </p>
          </article>
        </StudyStageDecisionPanel>
      );
    }

    if (state.currentStep === "business_brain") {
      return (
        <StudyStageDecisionPanel>
          <article className="study-doc-card">
            <p className="study-doc-card__tag">Workshop draft</p>
            <p className="study-doc-card__title">{state.businessBrain.clientName}</p>
            <p className="study-doc-card__body">{state.businessBrain.goal}</p>
            <ul className="study-doc-card__list">
              {state.businessBrain.workflows.slice(0, 3).map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>
        </StudyStageDecisionPanel>
      );
    }

    if (state.currentStep === "pam_challenge") {
      return (
        <StudyStageDecisionPanel>
          <article className="study-doc-card study-doc-card--pam">
            <p className="study-doc-card__tag">Pam — challenge</p>
            <dl className="study-doc-card__dl">
              <div>
                <dt>Strongest part</dt>
                <dd>{state.pamReview.strongestPart}</dd>
              </div>
              <div>
                <dt>Weakest assumption</dt>
                <dd>{state.pamReview.weakestAssumption}</dd>
              </div>
            </dl>
          </article>
        </StudyStageDecisionPanel>
      );
    }

    if (state.currentStep === "human_decision") {
      return (
        <StudyStageDecisionPanel>
          <div className="study-doc-card__stack">
            <blockquote className="study-doc-card study-doc-card--quote">{OWNERSHIP_LINE}</blockquote>
            {selectedDrafts.map((draft) => (
              <article key={draft.recordId} className="study-doc-card">
                <p className="study-doc-card__title">{draft.title}</p>
                <p className="study-doc-card__body study-doc-card__body--muted">
                  {draft.canonicalText.slice(0, 140)}
                  {draft.canonicalText.length > 140 ? "…" : ""}
                </p>
              </article>
            ))}
          </div>
        </StudyStageDecisionPanel>
      );
    }

    if (state.currentStep === "truth_approval" && !draftsLoading) {
      return (
        <StudyStageDecisionPanel>
          <article className="study-doc-card study-doc-card--pam">
            <p className="study-doc-card__tag">Pam — sniff test</p>
            <p className="study-doc-card__body">{pamNoteForDrafts(selectedDrafts)}</p>
            <p className="study-doc-card__note study-doc-card__note--muted">
              {selectedDrafts.length} draft{selectedDrafts.length === 1 ? "" : "s"} selected for review.
            </p>
          </article>
        </StudyStageDecisionPanel>
      );
    }

    if (state.currentStep === "doc_handoff" && state.promoteReceipt) {
      return (
        <StudyStageDecisionPanel>
          <article className="study-doc-card study-doc-card--receipt">
            <p className="study-doc-card__tag">Doc — filed</p>
            <p className="study-doc-card__title">{state.promoteReceipt.changeSummary}</p>
            <p className="study-doc-card__body study-doc-card__body--muted">
              Filed by {state.promoteReceipt.executingAgent}, approved by{" "}
              {state.promoteReceipt.approver}.
            </p>
          </article>
        </StudyStageDecisionPanel>
      );
    }

    if (
      state.currentStep === "context_access" &&
      state.brainMaturity === "working" &&
      state.snippets.length > 0
    ) {
      return (
        <StudyStageDecisionPanel>
          <div className="study-doc-card__stack">
            <p className="study-doc-card__tag">Approved context unlocked</p>
            {state.snippets.map((snippet) => (
              <article key={snippet.recordId} className="study-doc-card">
                <p className="study-doc-card__title">{snippet.title}</p>
                <p className="study-doc-card__body">{snippet.text}</p>
              </article>
            ))}
          </div>
        </StudyStageDecisionPanel>
      );
    }

    if (state.currentStep === "receipts" && RECEIPT_CARDS[0]) {
      const card = RECEIPT_CARDS[0];
      return (
        <StudyStageDecisionPanel>
          <article className="study-doc-card">
            {card.tag ? <span className="study-doc-card__tag">{card.tag}</span> : null}
            <h3 className="study-doc-card__title">{card.title}</h3>
            <p className="study-doc-card__body">{card.summary}</p>
          </article>
        </StudyStageDecisionPanel>
      );
    }

    return null;
  }, [
    draftsLoading,
    isBrainsIntroStep,
    primaryTheme,
    selectedDrafts,
    state.businessBrain,
    state.brainMaturity,
    state.currentStep,
    state.pamReview,
    state.promoteReceipt,
    state.snippets,
  ]);

  const showRightDecisionLayout = hasRightDecisionPanel;

  return (
    <div
      className={`chapter1-conversation${showRightDecisionLayout ? " chapter1-right-decision" : ""}`}
    >
      {isUserBrainStep ? (
        <UserBrainIntakeChat
          sessionId={state.sessionId}
          intake={state.userBrainIntake}
          userBrain={state.userBrain}
          guideMode={state.guideMode ?? undefined}
          onIntakeUpdate={(userBrainIntake) => onUpdate({ userBrainIntake })}
          onComplete={(userBrainIntake, userBrain) =>
            onUpdate({ userBrainIntake, userBrain })
          }
          playCliveReaction={playCliveReaction}
          disabled={loading}
        />
      ) : showChat ? (
        <CliveChatSurface
          key={`${state.currentStep}-${persona}`}
          persona={persona}
          greeting={greeting}
          beat={state.currentStep}
          loopContext={loopContext}
          sessionId={state.sessionId}
          placeholder={persona === "pam" ? "Respond to Pam…" : "Talk to Clive…"}
          starterPrompts={[]}
          disabled={loading}
          studyMode
          userLabel={userLabel}
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
      ) : isTruthApprovalStep ? (
        <div className="chapter1-conversation__beat">
          <p className="study-doc-card__note study-doc-card__note--muted">{greeting}</p>
        </div>
      ) : null}

      {rightDecisionPanel}

      {error && (
        <p className="study-stage__error" role="alert">
          {error}
        </p>
      )}

      <div className="chapter1-conversation__actions">
        {(state.currentStep === "context_importance" ||
          state.currentStep === "brains_intro") && (
          <div className="chapter1-conversation__beat">
            {state.currentStep === "brains_intro" && (
              <div className="study-doc-card__stack">
                {themeRecommendations && (
                  <p className="study-doc-card__note study-doc-card__note--muted">
                    Recommended for <strong>{themeRecommendations.sectorLabel}</strong> —{" "}
                    {themeRecommendations.sectorRationale}
                  </p>
                )}
                <p className="study-doc-card__note study-doc-card__note--muted">
                  {WHY_WE_THEME} Pick one to light first — not all of them at once.
                </p>
                <div className="study-doc-card">
                  <p className="study-doc-card__tag">What makes a good theme</p>
                  <ul className="study-doc-card__list">
                    {GOOD_THEME_QUALITIES.map((q) => (
                      <li key={q.title}>
                        <strong>{q.title}</strong> — {q.body}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
            <div className="chapter1-conversation__nav">
              {onBack && (
                <button type="button" className="study-stage__ghost-btn" onClick={onBack}>
                  Back
                </button>
              )}
              <button type="button" className="btn-primary chapter1-conversation__primary" onClick={onNext}>
                {state.currentStep === "brains_intro"
                  ? architectPath
                    ? "Review draft truths"
                    : "See the workshop draft"
                  : "Continue"}
              </button>
            </div>
          </div>
        )}

        {state.currentStep === "user_brain" && (
          <div className="chapter1-conversation__beat">
            <button
              type="button"
              className="btn-primary chapter1-conversation__primary disabled:opacity-40"
              disabled={!userBrainIntakeComplete}
              onClick={onNext}
            >
              Continue
            </button>
          </div>
        )}

        {state.currentStep === "truth_approval" && (
          <div className="chapter1-conversation__beat">
            {state.draftTruthsNotice && (
              <p className="study-doc-card__note study-doc-card__note--muted">
                {state.draftTruthsNotice}
              </p>
            )}
            {draftsLoading ? (
              <p className="study-doc-card__body">Loading Workshop drafts…</p>
            ) : (
              <div className="study-doc-card__stack">
                {state.draftTruths.map((draft) => {
                  const selected = state.selectedDraftIds.includes(draft.recordId);
                  return (
                    <article
                      key={draft.recordId}
                      className={`study-doc-card${selected ? " study-doc-card--selected" : ""}`}
                    >
                      <label className="flex cursor-pointer gap-3">
                        <input
                          type="checkbox"
                          className="mt-1"
                          checked={selected}
                          onChange={() => toggleDraftSelection(draft.recordId)}
                        />
                        <span className="flex-1">
                          <span className="study-doc-card__tag">
                            {draft.brainTheme ?? "core"} · {draft.proposedCategory}
                            {draft.source === "session" ? " · session draft" : ""}
                          </span>
                          <p className="study-doc-card__title">{draft.title}</p>
                          <p className="study-doc-card__body">{draft.canonicalText}</p>
                          {draft.proposedByAgent && (
                            <p className="study-doc-card__note study-doc-card__note--muted">
                              Proposed by {draft.proposedByAgent} · {draft.status}
                            </p>
                          )}
                        </span>
                      </label>
                    </article>
                  );
                })}
              </div>
            )}
            <div className="chapter1-conversation__nav">
              {onBack && (
                <button type="button" className="study-stage__ghost-btn" onClick={onBack}>
                  Back
                </button>
              )}
              <button
                type="button"
                className="btn-primary chapter1-conversation__primary disabled:opacity-40"
                disabled={draftsLoading || state.selectedDraftIds.length === 0}
                onClick={onNext}
              >
                Ready for my decision
              </button>
            </div>
          </div>
        )}

        {state.currentStep === "business_brain" && (
          <div className="chapter1-conversation__beat">
            <div className="chapter1-conversation__nav">
              {onBack && (
                <button type="button" className="study-stage__ghost-btn" onClick={onBack}>
                  Back
                </button>
              )}
              <button type="button" className="btn-primary chapter1-conversation__primary" onClick={onNext}>
                Ask Pam to challenge
              </button>
            </div>
          </div>
        )}

        {state.currentStep === "pam_challenge" && (
          <div className="chapter1-conversation__beat">
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
            {!state.humanApproved ? (
              <button
                type="button"
                className="btn-primary chapter1-conversation__primary disabled:opacity-40"
                disabled={state.selectedDraftIds.length === 0}
                onClick={() =>
                  onUpdate({
                    humanApproved: true,
                    approvalDecisionId: `session_${state.sessionId}`,
                  })
                }
              >
                Make selected truths trusted — send to Doc
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
              <button type="button" className="btn-primary chapter1-conversation__primary" onClick={onNext}>
                Use approved context
              </button>
            )}
          </div>
        )}

        {state.currentStep === "context_access" && state.brainMaturity === "working" && (
          <div className="chapter1-conversation__beat">
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
            {RECEIPT_CARDS.length > 1 ? (
              <div className="study-doc-card__stack">
                {RECEIPT_CARDS.slice(1).map((card) => (
                  <article key={card.id} className="study-doc-card">
                    {card.tag ? <span className="study-doc-card__tag">{card.tag}</span> : null}
                    <h3 className="study-doc-card__title">{card.title}</h3>
                    <p className="study-doc-card__body">{card.summary}</p>
                  </article>
                ))}
              </div>
            ) : null}
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
