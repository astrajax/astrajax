"use client";

/**
 * Corpus Census plate — Kathryn's production direction, modular SVG with
 * all labels LIVE. Used most directly as a working ledger.
 *
 * - Ledger rows for: provenance, recency, repetition tally, a contradiction
 *   pair/bracket, and a gap reserve.
 * - Provenance waves simplified to: maker mark + short trace + route symbol.
 * - Page-native dividers; blank date/count windows (live, never baked).
 * - Restrained: a working ledger, not a decorated table.
 */
import {
  STATE,
  SourceMark,
  ContradictionBracket,
  OpenQuestionNode,
  PageDivider,
  BlankWindow,
} from "./state-library";

export type CensusRow = {
  id: string;
  evidenceClass: "imported_document" | "self_reported";
  /** Maker mark label (the source). */
  label: string;
  /** Short trace (page ref or turn). */
  trace: string;
  /** Recency (live date). */
  recency: string;
  /** Repetition tally (live count). */
  tally?: number;
};

const W = 560;
const ROW_H = 46;

export function CorpusCensusPlate({
  rows,
  contradictionPair,
  gapReserve,
  totals,
  reducedMotion: _reducedMotion = false,
}: {
  rows: CensusRow[];
  /** Two row ids that contradict — bracketed in Terracotta. */
  contradictionPair?: [string, string];
  /** A live open-question count held in reserve. */
  gapReserve?: { label: string; count: number };
  /** Live totals for the count windows. */
  totals?: { documents: number; words: number };
  reducedMotion?: boolean;
}) {
  const bodyH = rows.length * ROW_H + 40;
  const H = bodyH + (gapReserve ? 50 : 0) + 30;
  const pairY = contradictionPair
    ? (contradictionPair.map((id) => rows.findIndex((r) => r.id === id)).filter((i) => i >= 0) as number[])
    : [];

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="onb-plate onb-plate--corpus-census"
      role="img"
      aria-label={`Corpus census: ${rows.length} ledger rows`}
      style={{ width: "100%", height: "auto", display: "block" }}
    >
      {/* Header: blank count windows (live) */}
      {totals ? (
        <g>
          <BlankWindow x={20} y={10} w={90} h={20} />
          <text x={65} y={24} textAnchor="middle" fontSize="9.5" fill={STATE.ink} fontFamily="Georgia, serif">
            {totals.documents} documents
          </text>
          <BlankWindow x={120} y={10} w={100} h={20} />
          <text x={170} y={24} textAnchor="middle" fontSize="9.5" fill={STATE.ink} fontFamily="Georgia, serif">
            {totals.words.toLocaleString()} words
          </text>
        </g>
      ) : null}

      {rows.map((row, i) => {
        const y = 44 + i * ROW_H;
        const isContradiction = pairY.includes(i);
        return (
          <g key={row.id}>
            {/* maker mark + short trace + route symbol */}
            <SourceMark evidenceClass={row.evidenceClass} x={36} y={y + 16} size={16} />
            <text x={58} y={y + 19} fontSize="11" fill={STATE.ink} fontFamily="Georgia, serif">
              {row.label}
            </text>
            <text x={58} y={y + 32} fontSize="8.5" fill={STATE.inkMuted} fontFamily="Georgia, serif" fontStyle="italic">
              {row.trace}
            </text>
            {/* recency (live date) */}
            <text x={W - 150} y={y + 19} textAnchor="end" fontSize="9" fill={STATE.inkMuted} fontFamily="Georgia, serif">
              {row.recency}
            </text>
            {/* repetition tally (live count) */}
            {row.tally != null ? (
              <>
                <BlankWindow x={W - 128} y={y + 22} w={44} h={16} />
                <text x={W - 106} y={y + 33} textAnchor="middle" fontSize="9" fill={STATE.ink} fontFamily="Georgia, serif">
                  ×{row.tally}
                </text>
              </>
            ) : null}
            {/* contradiction bracket (Terracotta) */}
            {isContradiction ? (
              <ContradictionBracket x={16} y={y - 2} w={W - 32} h={ROW_H - 8} />
            ) : null}
            {i < rows.length - 1 ? <PageDivider x={20} y={y + ROW_H - 6} w={W - 40} /> : null}
          </g>
        );
      })}

      {/* Gap reserve: hollow open-question nodes, live count */}
      {gapReserve ? (
        <g>
          <PageDivider x={20} y={44 + rows.length * ROW_H + 4} w={W - 40} />
          <OpenQuestionNode x={36} y={44 + rows.length * ROW_H + 26} r={6} />
          <text x={58} y={44 + rows.length * ROW_H + 30} fontSize="10.5" fill={STATE.ink} fontFamily="Georgia, serif">
            {gapReserve.label}
          </text>
          <BlankWindow x={W - 128} y={44 + rows.length * ROW_H + 16} w={44} h={16} />
          <text x={W - 106} y={44 + rows.length * ROW_H + 27} textAnchor="middle" fontSize="9" fill={STATE.ink} fontFamily="Georgia, serif">
            {gapReserve.count}
          </text>
        </g>
      ) : null}
    </svg>
  );
}
