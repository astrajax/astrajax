"use client";

/**
 * The folio action ledger — SC1 grammar for the lower two-thirds of the
 * right page in the interaction/convergence state. Brass/sage/graphite state
 * medallions (cropped transparent furniture) + ornamental rules + live
 * status text. Each row: a medallion, the action as a ledger line, and its
 * live status beneath. Account-book, not a status dashboard.
 *
 * Medallions are the refined v2 furniture set (accepted-sage, write-brass,
 * pending-graphite) — cleaner cut-outs from the transparent-v2 sheet.
 */
import Image from "next/image";

export type LedgerAction = {
  id: string;
  label: string;
  status: "completed" | "in_progress" | "queued";
  /** Live status line (e.g. "Completed · Just now", "In Progress · Est. 15 min"). */
  statusText: string;
};

const MEDALLION: Record<LedgerAction["status"], { src: string; alt: string }> = {
  completed: { src: "/brand/system-assets/folio/furniture/medallion-accepted-sage.svg", alt: "Completed" },
  in_progress: { src: "/brand/system-assets/folio/furniture/medallion-write-brass.svg", alt: "In progress" },
  queued: { src: "/brand/system-assets/folio/furniture/medallion-pending-graphite.svg", alt: "Queued" },
};

export function FolioActionLedger({
  title = "Clive's Actions",
  actions,
  footnote,
}: {
  title?: string;
  actions: LedgerAction[];
  footnote?: string;
}) {
  return (
    <div className="folio-ledger">
      <p className="folio-ledger__title">{title}</p>
      <ul className="folio-ledger__rows">
        {actions.map((action, i) => {
          const m = MEDALLION[action.status];
          return (
            <li key={action.id} className="folio-ledger__row">
              <span className="folio-ledger__medallion">
                <Image src={m.src} alt={m.alt} width={44} height={44} />
              </span>
              <span className="folio-ledger__body">
                <span className="folio-ledger__label">{action.label}</span>
                <span className={`folio-ledger__status folio-ledger__status--${action.status}`}>
                  {action.statusText}
                </span>
              </span>
              {i < actions.length - 1 ? <span className="folio-ledger__rule" aria-hidden /> : null}
            </li>
          );
        })}
      </ul>
      {footnote ? <p className="folio-ledger__footnote">{footnote}</p> : null}
    </div>
  );
}
