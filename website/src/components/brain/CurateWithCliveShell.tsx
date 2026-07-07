"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CliveStudyShell } from "@/components/chapter1/CliveStudyShell";
import { CliveChatSurface } from "@/components/chapter1/CliveChatSurface";
import { StudyStageDecisionPanel } from "@/components/chapter1/StudyStageDecisionPanel";
import type { CliveVideoStageHandle } from "@/components/chapter1/CliveVideoStage";
import { ProposalCard } from "@/components/brain/ProposalCard";
import {
  buildDocketSummaryMonologue,
  CURATION_SITTING_BEATS,
} from "@/lib/clive/curation-sitting";
import type { ChatMessage } from "@/lib/clive/types";
import {
  DECISION_REACTIONS,
  thinkingReaction,
  userMessageReaction,
} from "@/lib/clive/reaction-map";
import { destinationConfirmLabel } from "@/lib/curation/destinations";
import type { CurationDocket, CurationProposal } from "@/lib/curation/types";

type CurateWithCliveShellProps = {
  brainSlug: string;
  brainName: string;
};

/**
 * W6 — the docket made physical. Each count on the summary card is a real
 * button opening its list on the right page; the monologue's promise
 * ("ask me to summarise any item") is now kept by the UI as well as the chat.
 */
type DocketListView = "trusted" | "drafts" | "flagged" | "sources";

const DOCKET_VIEWS: Record<DocketListView, { label: string; empty: string }> = {
  trusted: {
    label: "Trusted truths",
    empty: "No trusted truths yet — nothing has been promoted.",
  },
  drafts: {
    label: "Workshop drafts",
    empty: "The workshop bench is clear.",
  },
  flagged: {
    label: "Flagged interactions",
    empty: "No conversations are flagged for review.",
  },
  sources: {
    label: "Source documents",
    empty: "No source documents waiting to be mined.",
  },
};

const DOCKET_LIST_CAP = 8;

function truncate(text: string, max = 140): string {
  const trimmed = text.trim();
  return trimmed.length > max ? `${trimmed.slice(0, max)}…` : trimmed;
}

function createSessionId(): string {
  return `cur_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export function CurateWithCliveShell({ brainSlug, brainName }: CurateWithCliveShellProps) {
  const videoRef = useRef<CliveVideoStageHandle | null>(null);
  const [sessionId] = useState(createSessionId);
  const [introBeatIndex, setIntroBeatIndex] = useState(0);
  const [introComplete, setIntroComplete] = useState(false);
  const [docket, setDocket] = useState<CurationDocket | null>(null);
  const [proposals, setProposals] = useState<CurationProposal[]>([]);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [seedStatus, setSeedStatus] = useState<string | null>(null);
  const [loopContext, setLoopContext] = useState<string>("");
  const [docketView, setDocketView] = useState<DocketListView | null>(null);

  const loadDocket = useCallback(async () => {
    try {
      const response = await fetch(`/api/brains/curation/docket?brainSlug=${encodeURIComponent(brainSlug)}`);
      const data = (await response.json()) as CurationDocket;
      if (response.ok) {
        setDocket(data);
        setLoopContext(
          buildDocketSummaryMonologue({
            draftCount: data.drafts.length,
            flaggedCount: data.flaggedInteractions.length,
            sourceDocCount: data.pendingSourceDocuments.length,
            trustedCount: data.trustedTruths.length,
          }),
        );
      }
    } catch {
      /* optional */
    }
  }, [brainSlug]);

  useEffect(() => {
    void loadDocket();
  }, [loadDocket]);

  useEffect(() => {
    void videoRef.current?.startIdleReel();
  }, []);

  const introBeat = CURATION_SITTING_BEATS[introBeatIndex];
  const isLastIntroBeat = introBeatIndex >= CURATION_SITTING_BEATS.length - 1;

  const handleIntroContinue = useCallback(() => {
    if (isLastIntroBeat) {
      setIntroComplete(true);
      return;
    }
    setIntroBeatIndex((index) => index + 1);
  }, [isLastIntroBeat]);

  const handleReset = useCallback(() => {
    setIntroComplete(false);
    setIntroBeatIndex(0);
  }, []);

  const initialMessages = useMemo<ChatMessage[]>(() => {
    if (!docket) return [];
    return [
      {
        role: "assistant",
        content: buildDocketSummaryMonologue({
          draftCount: docket.drafts.length,
          flaggedCount: docket.flaggedInteractions.length,
          sourceDocCount: docket.pendingSourceDocuments.length,
          trustedCount: docket.trustedTruths.length,
        }),
      },
    ];
  }, [docket]);

  const handleCustomSend = useCallback(
    async (message: string, history: ChatMessage[]) => {
      const response = await fetch("/api/brains/curation/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brainSlug,
          sessionId,
          message,
          history,
        }),
      });
      const data = (await response.json()) as {
        reply?: string;
        proposals?: CurationProposal[];
        error?: string;
      };
      if (!response.ok) {
        throw new Error(data.error ?? "Curation chat failed.");
      }
      if (data.proposals?.length) {
        setProposals((prev) => [...prev, ...data.proposals!]);
      }
      return data.reply ?? "…";
    },
    [brainSlug, sessionId],
  );

  const handleConfirm = useCallback(async (proposal: CurationProposal) => {
    setConfirmingId(proposal.id);
    try {
      const response = await fetch("/api/brains/curation/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ proposal, actor: "Architect" }),
      });
      const data = (await response.json()) as CurationProposal;
      if (!response.ok) throw new Error("Confirm failed.");
      setProposals((prev) => prev.map((item) => (item.id === proposal.id ? data : item)));
      videoRef.current?.playReaction(DECISION_REACTIONS.proposal_confirmed);
      void loadDocket();
    } catch {
      setProposals((prev) =>
        prev.map((item) =>
          item.id === proposal.id
            ? { ...item, status: "failed", error: "Could not file record." }
            : item,
        ),
      );
    } finally {
      setConfirmingId(null);
    }
  }, [loadDocket]);

  const handleDemoSeed = useCallback(async () => {
    setSeedStatus("Seeding Airtable…");
    try {
      const response = await fetch("/api/brains/demo/seed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brainSlug, actor: "Architect", includeDrafts: true }),
      });
      const data = (await response.json()) as {
        trustedRecordIds?: string[];
        mode?: string;
        error?: string;
      };
      if (!response.ok) throw new Error(data.error ?? "Seed failed.");
      setSeedStatus(
        `Seeded ${data.trustedRecordIds?.length ?? 0} trusted truth(s) (${data.mode ?? "unknown"} mode).`,
      );
      void loadDocket();
    } catch (error) {
      setSeedStatus(error instanceof Error ? error.message : "Seed failed.");
    }
  }, [brainSlug, loadDocket]);

  const latestPendingProposal = useMemo(
    () => [...proposals].reverse().find((proposal) => proposal.status === "pending") ?? null,
    [proposals],
  );

  const leftProposals = useMemo(
    () =>
      latestPendingProposal
        ? proposals.filter((proposal) => proposal.id !== latestPendingProposal.id)
        : proposals,
    [proposals, latestPendingProposal],
  );

  const showRightDecisionLayout = introComplete && Boolean(docket);

  const rightDecisionPanel = useMemo(() => {
    if (!docket) return null;

    if (latestPendingProposal) {
      return (
        <StudyStageDecisionPanel>
          <article className="study-doc-card study-doc-card--selected">
            <p className="study-doc-card__tag">Clive proposes</p>
            <p className="study-doc-card__title">{latestPendingProposal.title}</p>
            <p className="study-doc-card__body">{latestPendingProposal.summary}</p>
            <button
              type="button"
              className="btn-primary chapter1-conversation__primary mt-3 w-full"
              disabled={confirmingId === latestPendingProposal.id}
              onClick={() => void handleConfirm(latestPendingProposal)}
            >
              {confirmingId === latestPendingProposal.id
                ? "Filing…"
                : destinationConfirmLabel(latestPendingProposal.destination)}
            </button>
          </article>
        </StudyStageDecisionPanel>
      );
    }

    if (docketView) {
      const view = DOCKET_VIEWS[docketView];
      const items: { key: string; tag?: string; title: string; body?: string }[] =
        docketView === "trusted"
          ? docket.trustedTruths.map((row) => ({
              key: row.recordId,
              tag: row.category,
              title: row.title,
              body: truncate(row.canonicalText),
            }))
          : docketView === "drafts"
            ? docket.drafts.map((draft) => ({
                key: draft.recordId,
                tag: [draft.proposedCategory, draft.status].filter(Boolean).join(" · "),
                title: draft.title,
                body: truncate(draft.canonicalText),
              }))
            : docketView === "flagged"
              ? docket.flaggedInteractions.map((interaction) => ({
                  key: interaction.recordId,
                  tag: interaction.reviewStatus,
                  title: `“${truncate(interaction.userMessage, 90)}”`,
                  body: truncate(interaction.assistantReply),
                }))
              : docket.pendingSourceDocuments.map((doc) => ({
                  key: doc.recordId,
                  tag: doc.mineStatus,
                  title: doc.title,
                }));

      return (
        <StudyStageDecisionPanel>
          <article className="study-doc-card">
            <div className="study-docket__list-head">
              <p className="study-doc-card__tag">Docket · {view.label}</p>
              <button
                type="button"
                className="study-docket__back"
                onClick={() => setDocketView(null)}
              >
                ← Docket
              </button>
            </div>
            {items.length === 0 ? (
              <p className="study-doc-card__body study-doc-card__body--muted">{view.empty}</p>
            ) : (
              <ul className="study-docket__items">
                {items.slice(0, DOCKET_LIST_CAP).map((item) => (
                  <li key={item.key} className="study-docket__item">
                    {item.tag ? <p className="study-docket__item-tag">{item.tag}</p> : null}
                    <p className="study-docket__item-title">{item.title}</p>
                    {item.body ? <p className="study-docket__item-body">{item.body}</p> : null}
                  </li>
                ))}
              </ul>
            )}
            {items.length > DOCKET_LIST_CAP ? (
              <p className="study-doc-card__note study-doc-card__note--muted">
                +{items.length - DOCKET_LIST_CAP} more — ask Clive to take you through them.
              </p>
            ) : null}
          </article>
        </StudyStageDecisionPanel>
      );
    }

    const docketRows: { view: DocketListView; count: number; label: string }[] = [
      { view: "trusted", count: docket.trustedTruths.length, label: "trusted truths" },
      { view: "drafts", count: docket.drafts.length, label: "workshop drafts" },
      { view: "flagged", count: docket.flaggedInteractions.length, label: "flagged interactions" },
      { view: "sources", count: docket.pendingSourceDocuments.length, label: "source documents" },
    ];

    return (
      <StudyStageDecisionPanel>
        <article className="study-doc-card">
          <p className="study-doc-card__tag">Docket</p>
          <p className="study-doc-card__title">Pending work</p>
          <ul className="study-docket__rows">
            {docketRows.map((row) => (
              <li key={row.view}>
                <button
                  type="button"
                  className="study-docket__row"
                  onClick={() => setDocketView(row.view)}
                >
                  <span className="study-docket__count">{row.count}</span>
                  <span className="study-docket__label">{row.label}</span>
                  <span className="study-docket__chevron" aria-hidden>
                    ›
                  </span>
                </button>
              </li>
            ))}
          </ul>
          <p className="study-doc-card__note study-doc-card__note--muted">
            Open any line to read what's waiting.
          </p>
        </article>
      </StudyStageDecisionPanel>
    );
  }, [confirmingId, docket, docketView, handleConfirm, latestPendingProposal]);

  const headerActions = (
    <>
      <button type="button" className="study-stage__ghost-btn" onClick={() => void handleDemoSeed()}>
        Seed demo truths
      </button>
      {seedStatus ? <span className="study-stage__header-note">{seedStatus}</span> : null}
    </>
  );

  return (
    <CliveStudyShell
      ref={videoRef}
      onReset={handleReset}
      label="Sit with Clive"
      subtitle={brainName}
      backHref={`/brain/${brainSlug}`}
      backLabel={brainName}
      headerActions={headerActions}
    >
      {!introComplete && introBeat ? (
        <div className="clive-welcome">
          <p className="clive-welcome-caption clive-welcome-caption--visible">{introBeat.caption}</p>
          <div className="clive-welcome-monologue">
            <p className="clive-welcome-monologue__label">Clive Wigglesworth</p>
            <p className="clive-welcome-monologue__text clive-welcome-monologue__text--visible">
              {introBeat.monologue}
            </p>
          </div>
          <div className="clive-welcome__controls">
            <button type="button" className="btn-primary" onClick={handleIntroContinue}>
              {isLastIntroBeat ? "Begin curation" : "Continue"}
            </button>
          </div>
        </div>
      ) : (
        <div
          className={`chapter1-conversation${showRightDecisionLayout ? " chapter1-right-decision" : ""}`}
        >
          <CliveChatSurface
            sessionId={sessionId}
            studyMode
            userLabel="Architect"
            placeholder="Ask Clive about the docket, propose a truth, or promote a draft…"
            starterPrompts={[
              "What's on the docket?",
              "Summarise flagged conversations",
              "Propose a positioning truth from our docs",
            ]}
            loopContext={loopContext}
            initialMessages={initialMessages}
            onCustomSend={handleCustomSend}
            onUserMessage={() => {
              const reaction = userMessageReaction("clive");
              if (reaction) videoRef.current?.playReaction(reaction);
            }}
            onThinkingChange={(thinking) => {
              const reaction = thinkingReaction("clive");
              if (thinking && reaction) videoRef.current?.playReaction(reaction);
            }}
          />
          {leftProposals.map((proposal) => (
            <ProposalCard
              key={proposal.id}
              proposal={proposal}
              confirming={confirmingId === proposal.id}
              onConfirm={handleConfirm}
            />
          ))}
          {rightDecisionPanel}
        </div>
      )}
    </CliveStudyShell>
  );
}
