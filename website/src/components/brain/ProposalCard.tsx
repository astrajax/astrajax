"use client";

import { DestinationBlock } from "@/components/brain/DestinationChip";
import { destinationConfirmLabel } from "@/lib/curation/destinations";
import type { CurationProposal } from "@/lib/curation/types";

type ProposalCardProps = {
  proposal: CurationProposal;
  onConfirm: (proposal: CurationProposal) => void;
  confirming?: boolean;
};

export function ProposalCard({ proposal, onConfirm, confirming = false }: ProposalCardProps) {
  const isDone = proposal.status === "confirmed";
  const isFailed = proposal.status === "failed";

  return (
    <article className="card mt-4 border border-apricot/30 p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-apricot">Clive proposes</p>
      <h3 className="mt-1 font-display text-lg font-semibold text-ink">{proposal.title}</h3>
      <p className="mt-2 text-sm text-ink-muted">{proposal.summary}</p>

      <DestinationBlock
        destination={proposal.destination}
        brainSlug={proposal.brainSlug}
        recordId={proposal.recordId}
        actionLabel="Destination"
      />

      {isDone ? (
        <p className="mt-3 text-sm text-green-700">
          Filed{proposal.recordId ? ` · ${proposal.recordId}` : ""}.
        </p>
      ) : null}

      {isFailed ? (
        <p className="mt-3 text-sm text-red-700">{proposal.error ?? "Could not file record."}</p>
      ) : null}

      {!isDone && !isFailed ? (
        <button
          type="button"
          className="btn-primary mt-4"
          disabled={confirming}
          onClick={() => onConfirm(proposal)}
        >
          {confirming ? "Filing…" : destinationConfirmLabel(proposal.destination)}
        </button>
      ) : null}
    </article>
  );
}
