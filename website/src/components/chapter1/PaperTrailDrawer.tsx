"use client";

import { useMemo } from "react";
import type { LoopState } from "@/lib/aie-demo/types";
import { RECEIPT_CARDS, ACCESS_RECEIPT_LINE } from "@/lib/aie-demo/demo-data";
import { MATURITY_LABELS } from "@/lib/aie-demo/types";
import { UI_STATE_LABELS } from "@/lib/brains/ui-states";
import type { BrainKeyUiState } from "@/lib/brains/types";

type PaperTrailDrawerProps = {
  open: boolean;
  onClose: () => void;
  state: LoopState;
  accessState: BrainKeyUiState;
};

type TrailEntry = {
  when: string;
  who: string;
  what: string;
};

function buildTrail(state: LoopState, accessState: BrainKeyUiState): TrailEntry[] {
  const entries: TrailEntry[] = [];

  if (state.userBrain) {
    const who = state.userBrainIntake?.name?.trim();
    entries.push({
      when: "Start",
      who: who || "You",
      what: `User brain inferred: ${state.userBrain.label}`,
    });
  }

  if (state.guideMode) {
    entries.push({
      when: "Guide",
      who: "You",
      what: `Chose guide mode: ${state.guideMode.replace(/_/g, " ")}`,
    });
  }

  entries.push({
    when: "Workshop",
    who: "Clive",
    what: `Drafted a business brain brief for ${state.businessBrain.clientName} — workshop only, not trusted yet`,
  });

  entries.push({
    when: "Challenge",
    who: "Pam",
    what: `Sniff test: ${state.pamReview.weakestAssumption.slice(0, 120)}…`,
  });

  if (state.humanApproved) {
    entries.push({
      when: "Approval",
      who: "You",
      what: "Approved the brief for Doc to file into trusted context",
    });
  }

  if (state.promoteReceipt) {
    entries.push({
      when: "Filed",
      who: "Doc",
      what: `${state.promoteReceipt.changeSummary}. Signed off by ${state.promoteReceipt.approver}.`,
    });
  }

  if (state.keyRequest) {
    entries.push({
      when: "Access",
      who: "Clive",
      what: "Asked to use approved context for a bounded task",
    });
  }

  if (state.grant) {
    entries.push({
      when: "Granted",
      who: "You",
      what: `${UI_STATE_LABELS[accessState]}. ${ACCESS_RECEIPT_LINE}`,
    });
  }

  return entries;
}

export function PaperTrailDrawer({ open, onClose, state, accessState }: PaperTrailDrawerProps) {
  const trail = useMemo(() => buildTrail(state, accessState), [state, accessState]);

  if (!open) return null;

  return (
    <div className="paper-trail-overlay" role="dialog" aria-modal="true" aria-label="Paper trail">
      <button type="button" className="paper-trail-overlay__backdrop" onClick={onClose} aria-label="Close paper trail" />
      <aside className="paper-trail-drawer">
        <header className="paper-trail-drawer__header">
          <div>
            <p className="section-label">Governance</p>
            <h2 className="font-display text-xl font-semibold text-ink">Paper trail</h2>
          </div>
          <button type="button" className="clive-study__ghost-btn text-ink" onClick={onClose}>
            Close
          </button>
        </header>

        <p className="text-sm text-ink-muted">
          Plain-language record of what happened in this session.{" "}
          {MATURITY_LABELS[state.brainMaturity]} — no credentials exposed.
        </p>

        <ol className="paper-trail-drawer__list">
          {trail.map((entry) => (
            <li key={`${entry.when}-${entry.who}`} className="paper-trail-drawer__item">
              <span className="paper-trail-drawer__when">{entry.when}</span>
              <span className="paper-trail-drawer__who">{entry.who}</span>
              <p className="paper-trail-drawer__what">{entry.what}</p>
            </li>
          ))}
        </ol>

        <section className="paper-trail-drawer__unlocks">
          <p className="section-label">What this unlocks</p>
          <ul className="mt-3 space-y-3">
            {RECEIPT_CARDS.map((card) => (
              <li key={card.id} className="rounded-lg border border-ink/10 bg-cream/80 p-4">
                <p className="font-display font-semibold text-ink">{card.title}</p>
                <p className="mt-1 text-sm text-ink-muted">{card.summary}</p>
              </li>
            ))}
          </ul>
        </section>
      </aside>
    </div>
  );
}
