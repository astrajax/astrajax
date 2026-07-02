import {
  DESTINATION_LABELS,
  type ContextDestination,
  type DestinationChipProps,
} from "@/lib/curation/destinations";

export function DestinationChip({
  destination,
  brainSlug,
  recordId,
  compact = false,
}: DestinationChipProps) {
  const meta = DESTINATION_LABELS[destination];

  return (
    <span
      className={`inline-flex flex-wrap items-center gap-1.5 rounded-full border border-ink/10 bg-white/80 px-2.5 py-1 text-xs text-ink-muted${compact ? "" : " mt-1"}`}
      title={`${meta.base} · ${meta.table}${recordId ? ` · ${recordId}` : ""}`}
    >
      <span className="font-medium text-ink">{meta.home}</span>
      {!compact ? (
        <>
          <span aria-hidden>→</span>
          <span>{meta.table}</span>
          {brainSlug ? <span className="text-ink-muted">· {brainSlug}</span> : null}
        </>
      ) : null}
      {recordId ? <span className="font-mono text-[10px] text-ink-muted">{recordId}</span> : null}
    </span>
  );
}

export function DestinationBlock({
  destination,
  brainSlug,
  recordId,
  actionLabel,
}: {
  destination: ContextDestination;
  brainSlug?: string;
  recordId?: string;
  actionLabel?: string;
}) {
  return (
    <div className="rounded-xl border border-ink/10 bg-cream/40 p-3">
      {actionLabel ? <p className="text-sm font-medium text-ink">{actionLabel}</p> : null}
      <DestinationChip destination={destination} brainSlug={brainSlug} recordId={recordId} />
    </div>
  );
}
