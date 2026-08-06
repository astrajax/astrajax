/**
 * Shared state library — the onboarding evidence visual grammar.
 *
 * Kathryn's three-plate family (Source Pack / Corpus Census / Provisional
 * Constellation) is built as RESPONSIVE MODULAR SVG with every label, name,
 * date, count and status LIVE in code. Generated lettering is diagnostic
 * only and never enters production — these components carry no baked text;
 * all copy is passed in and rendered as real <text>.
 *
 * This module is the single source for the shared marks, colours and
 * connector grammar the three plates draw from. It is deliberately
 * presentational (pure SVG, no data fetching) so the same marks serve the
 * fixture contract now and Ruth's verified contract later.
 */

/* ── Palette (locked house register) ─────────────────────────────────── */
export const STATE = {
  ink: "#23271B",
  inkMuted: "#4a4f4c",
  graphite: "#171a18",
  cream: "#f3eddb",
  creamPaper: "#faf7ed",
  terracotta: "#a95a2e",
  sage: "#9aa77a",
  gold: "#cba056",
  goldDeep: "#9a7634",
  goldLight: "#e8c07a",
} as const;

/* ── Connector grammar ───────────────────────────────────────────────── */
/** Fine Ink connector between an evidence node and an inference. */
export const CONNECTOR = {
  stroke: STATE.ink,
  strokeWidth: 0.75,
  opacity: 0.5,
} as const;

/**
 * Support-role connector grammar (Ruth v1.1.0): how an edge reads by role.
 * Direct = fine Ink; Corroborating = a Sage tick beside the node;
 * Contradicting = the Terracotta bracket (already defined below). The UI
 * shows the role only when the edge carries one (v1.1.0) — bare v1.0.0
 * edges read as plain fine-Ink with no role label.
 */
export const SUPPORT_ROLE_MARK: Record<string, { stroke: string; label: string }> = {
  Direct: { stroke: STATE.ink, label: "Direct" },
  Corroborating: { stroke: STATE.sage, label: "Corroborating" },
  Contradicting: { stroke: STATE.terracotta, label: "Contradicting" },
} as const;

/** Thin gold attention stroke — the ONE restrained pass, then full settle. */
export const ATTENTION = {
  stroke: STATE.gold,
  strokeWidth: 1.25,
} as const;

/* ── Evidence / inference node marks ─────────────────────────────────── */

/** Solid Ink evidence node — a piece of evidence, filled. */
export function EvidenceNode({ x, y, r = 5 }: { x: number; y: number; r?: number }) {
  return <circle cx={x} cy={y} r={r} fill={STATE.ink} />;
}

/** Graphite hatch inference — the provisional inference, hatched (not solid). */
export function InferenceNode({ x, y, r = 6, id }: { x: number; y: number; r?: number; id: string }) {
  return (
    <g>
      <defs>
        <pattern id={`hatch-${id}`} width="3" height="3" patternTransform="rotate(45)" patternUnits="userSpaceOnUse">
          <line x1="0" y1="0" x2="0" y2="3" stroke={STATE.graphite} strokeWidth="0.7" opacity="0.6" />
        </pattern>
      </defs>
      <circle cx={x} cy={y} r={r} fill={`url(#hatch-${id})`} stroke={STATE.graphite} strokeWidth="0.75" opacity="0.85" />
    </g>
  );
}

/** Hollow open-question node — an unresolved question, unfilled. */
export function OpenQuestionNode({ x, y, r = 5 }: { x: number; y: number; r?: number }) {
  return <circle cx={x} cy={y} r={r} fill="none" stroke={STATE.ink} strokeWidth="0.9" strokeDasharray="1.5 1.5" />;
}

/** Terracotta contradiction bracket / correction stroke. */
export function ContradictionBracket({ x, y, w, h }: { x: number; y: number; w: number; h: number }) {
  return (
    <path
      d={`M ${x} ${y} L ${x} ${y + h} L ${x + 6} ${y + h} M ${x + w} ${y} L ${x + w} ${y + h} L ${x + w - 6} ${y + h}`}
      fill="none"
      stroke={STATE.terracotta}
      strokeWidth="1.25"
      strokeLinecap="round"
    />
  );
}

/**
 * Corroborating support-role tick — a small Sage tick beside an evidence
 * node when the edge is corroborating (Ruth v1.1.0). Only rendered when the
 * edge actually carries a corroborating role.
 */
export function CorroboratingTick({ x, y }: { x: number; y: number }) {
  return (
    <path
      d={`M ${x - 4} ${y} L ${x - 1} ${y + 3.5} L ${x + 5} ${y - 3.5}`}
      fill="none"
      stroke={STATE.sage}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  );
}

/** Sage accepted-draft seal — a small wreathed seal for the accepted state. */
export function AcceptedSeal({ x, y, r = 9 }: { x: number; y: number; r?: number }) {
  return (
    <g>
      <circle cx={x} cy={y} r={r} fill="none" stroke={STATE.sage} strokeWidth="1.25" />
      <circle cx={x} cy={y} r={r - 3} fill="none" stroke={STATE.sage} strokeWidth="0.6" opacity="0.7" />
      <path
        d={`M ${x - r * 0.45} ${y} L ${x - r * 0.1} ${y + r * 0.4} L ${x + r * 0.5} ${y - r * 0.35}`}
        fill="none"
        stroke={STATE.sage}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </g>
  );
}

/* ── Source marks (imported-document vs self-reported, EQUAL weight) ─── */

/**
 * Imported-document source mark — a small leaf silhouette. Equal visual
 * weight and contrast to the conversation mark below (locked grammar).
 */
export function ImportedSourceMark({ x, y, size = 12 }: { x: number; y: number; size?: number }) {
  const s = size / 12;
  return (
    <g transform={`translate(${x}, ${y}) scale(${s})`} aria-label="imported document">
      <path
        d="M0,-6 C4,-6 6,-2 6,2 C6,6 3,8 0,8 C-3,8 -6,6 -6,2 C-6,-2 -4,-6 0,-6 Z M0,-6 L0,8"
        fill="none"
        stroke={STATE.ink}
        strokeWidth="1.1"
        strokeLinejoin="round"
      />
    </g>
  );
}

/**
 * Self-reported conversation source mark — a testimony slip silhouette.
 * EQUAL weight/contrast to the imported mark (locked grammar).
 */
export function ConversationSourceMark({ x, y, size = 12 }: { x: number; y: number; size?: number }) {
  const s = size / 12;
  return (
    <g transform={`translate(${x}, ${y}) scale(${s})`} aria-label="self reported">
      <path
        d="M-6,-5 L6,-5 L6,3 L1,3 L-2,7 L-2,3 L-6,3 Z"
        fill="none"
        stroke={STATE.ink}
        strokeWidth="1.1"
        strokeLinejoin="round"
      />
      <line x1="-3" y1="-2" x2="3" y2="-2" stroke={STATE.ink} strokeWidth="0.8" />
      <line x1="-3" y1="0.5" x2="2" y2="0.5" stroke={STATE.ink} strokeWidth="0.8" />
    </g>
  );
}

/** Renders the right source mark for an evidence_class, equal weight. */
export function SourceMark({
  evidenceClass,
  x,
  y,
  size = 12,
}: {
  evidenceClass: "imported_document" | "self_reported";
  x: number;
  y: number;
  size?: number;
}) {
  return evidenceClass === "imported_document" ? (
    <ImportedSourceMark x={x} y={y} size={size} />
  ) : (
    <ConversationSourceMark x={x} y={y} size={size} />
  );
}

/* ── Blank windows (live label/date/count — never baked) ─────────────── */

/** A blank label window — an engraved frame for LIVE text laid over it. */
export function BlankWindow({
  x,
  y,
  w,
  h,
}: {
  x: number;
  y: number;
  w: number;
  h: number;
}) {
  return (
    <rect
      x={x}
      y={y}
      width={w}
      height={h}
      rx={2}
      fill="none"
      stroke={STATE.gold}
      strokeWidth="0.75"
      opacity="0.55"
    />
  );
}

/* ── Page-native divider ─────────────────────────────────────────────── */
export function PageDivider({ x, y, w }: { x: number; y: number; w: number }) {
  return (
    <line
      x1={x}
      y1={y}
      x2={x + w}
      y2={y}
      stroke={STATE.gold}
      strokeWidth="0.75"
      opacity="0.5"
      strokeDasharray="1 2"
    />
  );
}
