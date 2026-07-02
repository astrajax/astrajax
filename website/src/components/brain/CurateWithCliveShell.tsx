"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CliveStudyShell } from "@/components/chapter1/CliveStudyShell";
import { CliveChatSurface } from "@/components/chapter1/CliveChatSurface";
import type { CliveVideoStageHandle } from "@/components/chapter1/CliveVideoStage";
import { ProposalCard } from "@/components/brain/ProposalCard";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import {
  buildDocketSummaryMonologue,
  CURATION_SITTING_BEATS,
} from "@/lib/clive/curation-sitting";
import type { ChatMessage } from "@/lib/clive/types";
import type { CurationDocket, CurationProposal } from "@/lib/curation/types";

type CurateWithCliveShellProps = {
  brainSlug: string;
  brainName: string;
};

function createSessionId(): string {
  return `cur_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export function CurateWithCliveShell({ brainSlug, brainName }: CurateWithCliveShellProps) {
  const videoRef = useRef<CliveVideoStageHandle | null>(null);
  const [sessionId] = useState(createSessionId);
  const [introComplete, setIntroComplete] = useState(false);
  const [docket, setDocket] = useState<CurationDocket | null>(null);
  const [proposals, setProposals] = useState<CurationProposal[]>([]);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [seedStatus, setSeedStatus] = useState<string | null>(null);
  const [loopContext, setLoopContext] = useState<string>("");

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

  return (
    <>
      <Nav />
      <main className="platform-page">
        <div className="platform-page__inner">
          <header className="platform-page__header">
            <Link href={`/brain/${brainSlug}`} className="text-sm text-apricot hover:underline">
              ← {brainName}
            </Link>
            <h1 className="font-display mt-4 text-3xl font-semibold text-ink sm:text-4xl">
              Sit with Clive
            </h1>
            <p className="mt-3 max-w-2xl text-lg text-ink-muted">
              Curate {brainName}&apos;s context conversationally. Clive proposes; you confirm in one
              click. Every action shows where it lands.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <button type="button" className="study-stage__ghost-btn" onClick={() => void handleDemoSeed()}>
                Seed demo truths
              </button>
              {seedStatus ? <p className="text-sm text-ink-muted">{seedStatus}</p> : null}
            </div>
          </header>

          <CliveStudyShell ref={videoRef} onReset={() => setIntroComplete(false)}>
            {!introComplete ? (
              <div className="clive-welcome">
                {CURATION_SITTING_BEATS.map((beat) => (
                  <div key={beat.id} className="mb-6">
                    <p className="clive-welcome-caption clive-welcome-caption--visible">{beat.caption}</p>
                    <div className="clive-welcome-monologue mt-4">
                      <p className="clive-welcome-monologue__label">Clive Wigglesworth</p>
                      <p className="clive-welcome-monologue__text clive-welcome-monologue__text--visible">
                        {beat.monologue}
                      </p>
                    </div>
                  </div>
                ))}
                <button
                  type="button"
                  className="btn-primary mt-4"
                  onClick={() => setIntroComplete(true)}
                >
                  Begin curation
                </button>
              </div>
            ) : (
              <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
                <div>
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
                  />
                  {proposals.map((proposal) => (
                    <ProposalCard
                      key={proposal.id}
                      proposal={proposal}
                      confirming={confirmingId === proposal.id}
                      onConfirm={handleConfirm}
                    />
                  ))}
                </div>
                <aside className="card p-4">
                  <p className="section-label">Pending work</p>
                  {docket ? (
                    <ul className="mt-3 space-y-2 text-sm text-ink-muted">
                      <li>{docket.trustedTruths.length} trusted truths</li>
                      <li>{docket.drafts.length} workshop drafts</li>
                      <li>{docket.flaggedInteractions.length} flagged interactions</li>
                      <li>{docket.pendingSourceDocuments.length} source documents</li>
                    </ul>
                  ) : (
                    <p className="mt-3 text-sm text-ink-muted">Loading docket…</p>
                  )}
                </aside>
              </div>
            )}
          </CliveStudyShell>
        </div>
      </main>
      <Footer />
    </>
  );
}
