"use client";

/**
 * Source Pack plate — Kathryn's production direction, as responsive modular
 * SVG with all labels LIVE (no baked/generated lettering).
 *
 * - 4 imported-document leaf silhouettes + 2 testimony-slip silhouettes.
 * - Only 3–5 restrained gathering paths into the central bound-pack body.
 * - Central bound-pack body with provenance tabs.
 * - Reduced generated line clutter; the pack reads as one bound body, not
 *   a scatter of strokes.
 *
 * Every label/file name is passed in and rendered as live <text>. The plate
 * carries NO generated text of its own. Motion-ready: paths reveal by
 * restrained stroke (opacity), never node scale/pop, one thin gold pass
 * then full settle; reduced motion shows the final static immediately.
 */
import { useEffect, useState } from "react";
import {
  STATE,
  BlankWindow,
  CONNECTOR,
  ATTENTION,
} from "./state-library";

export type SourcePackItem = {
  id: string;
  evidenceClass: "imported_document" | "self_reported";
  /** Live label (file name or testimony quote). */
  label: string;
  /** Live provenance tab (file type/page, or turn). */
  provenance: string;
};

const W = 560;
const H = 380;
const PACK = { x: W / 2, y: H / 2 + 10, w: 120, h: 150 };

/** Restrained gathering paths: exactly 4 anchors into the bound pack. */
const GATHER_ANCHORS = [
  { x: PACK.x - 20, y: PACK.y - 40 },
  { x: PACK.x + 20, y: PACK.y - 40 },
  { x: PACK.x - 20, y: PACK.y + 40 },
  { x: PACK.x + 20, y: PACK.y + 40 },
];

const LEAF_POSITIONS = [
  { x: 70, y: 70 },
  { x: 90, y: 210 },
  { x: 100, y: 320 },
  { x: W - 90, y: 90 },
];
const SLIP_POSITIONS = [
  { x: W - 80, y: 230 },
  { x: W - 110, y: 330 },
];

export function SourcePackPlate({
  items,
  packLabel = "Source Pack",
  motion = true,
  reducedMotion = false,
}: {
  items: SourcePackItem[];
  packLabel?: string;
  motion?: boolean;
  reducedMotion?: boolean;
}) {
  const [revealed, setRevealed] = useState(reducedMotion);
  useEffect(() => {
    if (reducedMotion) {
      setRevealed(true);
      return;
    }
    if (!motion) return;
    const t = window.setTimeout(() => setRevealed(true), 60);
    return () => window.clearTimeout(t);
  }, [motion, reducedMotion]);

  // Exactly 4 imported leaves + 2 testimony slips per Kathryn's direction.
  const imported = items.filter((i) => i.evidenceClass === "imported_document").slice(0, 4);
  const reported = items.filter((i) => i.evidenceClass === "self_reported").slice(0, 2);
  const all = [...imported, ...reported];
  const positions = [...LEAF_POSITIONS, ...SLIP_POSITIONS];

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="onb-plate onb-plate--source-pack"
      role="img"
      aria-label={`${packLabel}: ${items.length} items gathered`}
      style={{ width: "100%", height: "auto", display: "block" }}
    >
      {/* Restrained gathering paths — opacity reveal, no scale/pop. */}
      <g
        style={{
          opacity: revealed ? 1 : 0,
          transition: reducedMotion ? "none" : "opacity 900ms cubic-bezier(0.45,0.05,0.55,0.95)",
        }}
      >
        {all.slice(0, GATHER_ANCHORS.length).map((item, i) => {
          const p = positions[i];
          const a = GATHER_ANCHORS[i];
          const mx = (p.x + a.x) / 2;
          return (
            <path
              key={`gather-${item.id}`}
              d={`M ${p.x} ${p.y} Q ${mx} ${(p.y + a.y) / 2 - 18} ${a.x} ${a.y}`}
              fill="none"
              stroke={CONNECTOR.stroke}
              strokeWidth={CONNECTOR.strokeWidth}
              opacity={CONNECTOR.opacity}
            />
          );
        })}
        {/* One thin gold attention pass on the lead path, then full settle. */}
        {!reducedMotion && revealed && all[0] ? (
          <path
            d={`M ${positions[0].x} ${positions[0].y} Q ${(positions[0].x + GATHER_ANCHORS[0].x) / 2} ${(positions[0].y + GATHER_ANCHORS[0].y) / 2 - 18} ${GATHER_ANCHORS[0].x} ${GATHER_ANCHORS[0].y}`}
            fill="none"
            stroke={ATTENTION.stroke}
            strokeWidth={ATTENTION.strokeWidth}
            strokeDasharray="240"
            strokeDashoffset="240"
            style={{ animation: "onb-gold-pass 1400ms cubic-bezier(0.45,0.05,0.55,0.95) forwards" }}
          />
        ) : null}
      </g>

      {/* Central bound-pack body with provenance tabs. */}
      <g>
        <rect
          x={PACK.x - PACK.w / 2}
          y={PACK.y - PACK.h / 2}
          width={PACK.w}
          height={PACK.h}
          rx={3}
          fill="none"
          stroke={STATE.ink}
          strokeWidth="1.25"
        />
        {/* binding spine */}
        <line
          x1={PACK.x - PACK.w / 2 + 12}
          y1={PACK.y - PACK.h / 2}
          x2={PACK.x - PACK.w / 2 + 12}
          y2={PACK.y + PACK.h / 2}
          stroke={STATE.ink}
          strokeWidth="0.75"
          opacity="0.5"
        />
        {/* provenance tabs (live labels) */}
        {all.slice(0, 4).map((item, i) => (
          <g key={`tab-${item.id}`}>
            <rect
              x={PACK.x + PACK.w / 2 - 4}
              y={PACK.y - PACK.h / 2 + 16 + i * 30}
              width={12}
              height={18}
              rx={1}
              fill={STATE.creamPaper}
              stroke={STATE.gold}
              strokeWidth="0.6"
            />
            <text
              x={PACK.x + PACK.w / 2 + 16}
              y={PACK.y - PACK.h / 2 + 28 + i * 30}
              fontSize="7.5"
              fill={STATE.inkMuted}
              fontFamily="Georgia, serif"
            >
              {item.provenance}
            </text>
          </g>
        ))}
        {/* pack label — LIVE text in a blank window, never baked */}
        <BlankWindow x={PACK.x - 46} y={PACK.y - 12} w={92} h={22} />
        <text
          x={PACK.x}
          y={PACK.y + 3}
          textAnchor="middle"
          fontSize="11"
          fontVariant="small-caps"
          letterSpacing="0.08em"
          fill={STATE.ink}
          fontFamily="Georgia, serif"
        >
          {packLabel}
        </text>
      </g>

      {/* Item marks (Kathryn's furniture: imported folio-leaf, self-reported
          quotation-nib) + live labels. Equal weight, per the locked grammar. */}
      {all.map((item, i) => {
        const p = positions[i];
        const markSrc = item.evidenceClass === "imported_document"
          ? "/brand/system-assets/folio/furniture/mark-imported-leaf.png"
          : "/brand/system-assets/folio/furniture/mark-selfreported-nib.png";
        return (
          <g key={`item-${item.id}`}>
            <image
              href={markSrc}
              x={p.x - 14}
              y={p.y - 14}
              width={28}
              height={28}
              preserveAspectRatio="xMidYMid meet"
            />
            <text
              x={p.x}
              y={p.y + 22}
              textAnchor="middle"
              fontSize="8.5"
              fill={STATE.ink}
              fontFamily="Georgia, serif"
            >
              {item.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
