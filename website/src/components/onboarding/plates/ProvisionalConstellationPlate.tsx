"use client";

/**
 * Provisional Constellation plate — Kathryn's production direction, modular
 * SVG with all labels LIVE.
 *
 * - Four territories: role / sector / brain themes / observed collaborators.
 * - Smaller OUTLINED medallions, more exposed paper, an OPEN provisional
 *   centre, lighter node mass.
 * - A scholarly working chart — never a network dashboard or horoscope.
 * - NO central crest.
 * - Solid Ink evidence nodes → graphite hatch inference; hollow nodes for
 *   open questions; Sage seal when accepted.
 * - Fine Ink connectors; reciprocal opacity only, no node scale/pop, one
 *   thin gold pass then full settle; reduced motion = final static at once.
 */
import { useEffect, useState } from "react";
import {
  STATE,
  EvidenceNode,
  InferenceNode,
  OpenQuestionNode,
  AcceptedSeal,
  BlankWindow,
  CONNECTOR,
  ATTENTION,
} from "./state-library";

export type ConstellationTerritory = {
  key: "role" | "sector" | "themes" | "collaborators";
  /** Live territory label. */
  label: string;
  /** Live provisional value (open centre text). */
  provisional: string;
  /** Evidence feeding it: solid nodes; open questions: hollow. */
  evidenceCount: number;
  openQuestions?: number;
  accepted?: boolean;
};

const W = 560;
const H = 400;
const CX = W / 2;
const CY = H / 2 + 6;

const TERRITORY_POSITIONS = [
  { x: CX - 150, y: CY - 100 },
  { x: CX + 150, y: CY - 100 },
  { x: CX - 150, y: CY + 105 },
  { x: CX + 150, y: CY + 105 },
];

export function ProvisionalConstellationPlate({
  territories,
  reducedMotion = false,
}: {
  territories: ConstellationTerritory[];
  reducedMotion?: boolean;
}) {
  const [revealed, setRevealed] = useState(reducedMotion);
  useEffect(() => {
    if (reducedMotion) {
      setRevealed(true);
      return;
    }
    const t = window.setTimeout(() => setRevealed(true), 60);
    return () => window.clearTimeout(t);
  }, [reducedMotion]);

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="onb-plate onb-plate--constellation"
      role="img"
      aria-label="Provisional constellation: four territories awaiting confirmation"
      style={{ width: "100%", height: "auto", display: "block" }}
    >
      {/* Fine Ink connectors from the open centre to each territory. */}
      <g
        style={{
          opacity: revealed ? 1 : 0,
          transition: reducedMotion ? "none" : "opacity 1100ms cubic-bezier(0.45,0.05,0.55,0.95)",
        }}
      >
        {TERRITORY_POSITIONS.map((p, i) => (
          <line
            key={`conn-${i}`}
            x1={CX}
            y1={CY}
            x2={p.x}
            y2={p.y}
            stroke={CONNECTOR.stroke}
            strokeWidth={CONNECTOR.strokeWidth}
            opacity={CONNECTOR.opacity}
          />
        ))}
        {/* One thin gold pass to the first territory, then full settle. */}
        {!reducedMotion && revealed ? (
          <line
            x1={CX}
            y1={CY}
            x2={TERRITORY_POSITIONS[0].x}
            y2={TERRITORY_POSITIONS[0].y}
            stroke={ATTENTION.stroke}
            strokeWidth={ATTENTION.strokeWidth}
            strokeDasharray="200"
            strokeDashoffset="200"
            style={{ animation: "onb-gold-pass 1500ms cubic-bezier(0.45,0.05,0.55,0.95) forwards" }}
          />
        ) : null}
      </g>

      {/* Open provisional centre — NO crest, just the working title. */}
      <BlankWindow x={CX - 74} y={CY - 14} w={148} h={26} />
      <text
        x={CX}
        y={CY + 4}
        textAnchor="middle"
        fontSize="11"
        fontVariant="small-caps"
        letterSpacing="0.1em"
        fill={STATE.inkMuted}
        fontFamily="Georgia, serif"
      >
        provisional
      </text>

      {/* Four territories — small outlined medallions, exposed paper. */}
      {territories.slice(0, 4).map((t, i) => {
        const p = TERRITORY_POSITIONS[i];
        return (
          <g key={t.key}>
            {/* outlined medallion (not filled) */}
            <circle cx={p.x} cy={p.y} r={52} fill="none" stroke={STATE.ink} strokeWidth="1" opacity="0.7" />
            <circle cx={p.x} cy={p.y} r={46} fill="none" stroke={STATE.gold} strokeWidth="0.5" opacity="0.5" />

            {/* evidence nodes (solid ink) around the rim, lighter mass */}
            {Array.from({ length: Math.min(t.evidenceCount, 4) }).map((_, j) => {
              const ang = (-90 + j * 40) * (Math.PI / 180);
              return (
                <EvidenceNode key={`ev-${j}`} x={p.x + Math.cos(ang) * 52} y={p.y + Math.sin(ang) * 52} r={3.5} />
              );
            })}
            {/* open questions (hollow) */}
            {Array.from({ length: Math.min(t.openQuestions ?? 0, 2) }).map((_, j) => {
              const ang = (60 + j * 40) * (Math.PI / 180);
              return (
                <OpenQuestionNode key={`oq-${j}`} x={p.x + Math.cos(ang) * 52} y={p.y + Math.sin(ang) * 52} r={3.5} />
              );
            })}

            {/* graphite hatch inference at the medallion's heart */}
            <InferenceNode id={`inf-${t.key}`} x={p.x} y={p.y - 24} r={5} />

            {/* accepted seal (Sage) when confirmed */}
            {t.accepted ? <AcceptedSeal x={p.x + 40} y={p.y - 40} r={8} /> : null}

            {/* live labels */}
            <text
              x={p.x}
              y={p.y + 2}
              textAnchor="middle"
              fontSize="10"
              fontVariant="small-caps"
              letterSpacing="0.06em"
              fill={STATE.ink}
              fontFamily="Georgia, serif"
            >
              {t.label}
            </text>
            <text
              x={p.x}
              y={p.y + 18}
              textAnchor="middle"
              fontSize="8.5"
              fill={STATE.inkMuted}
              fontFamily="Georgia, serif"
              fontStyle="italic"
            >
              {t.provisional}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
