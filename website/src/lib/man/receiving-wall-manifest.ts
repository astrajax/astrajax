/**
 * Scene manifest — The Receiving Wall (Clive's Man intake portal).
 *
 * House convention (build pack W7): geometry from the painted plate lives as
 * data, not in component code. All fractions are relative to the 1920×1080
 * source frame (receiving-wall-poster.jpg). CSS custom properties in
 * receiving-wall.module.css derive from these values — see §0 of
 * website/docs/receiving-wall-portal-spec.md.
 */

/** Arch aperture and safe content box (source-frame fractions). */
export const APERTURE = {
  /** Inner arch legs — straight section below the crown springing line. */
  innerLeft: 0.19,
  innerRight: 0.81,
  /** Stone moulding bands outside the inner legs. */
  mouldingLeft: { from: 0.167, to: 0.19 },
  mouldingRight: { from: 0.81, to: 0.833 },
  /** Lit plaster wall outside the moulding. */
  plasterLeft: { from: 0.115, to: 0.167 },
  plasterRight: { from: 0.833, to: 0.88 },
  /** Largest rectangle inside the aperture with clearance. */
  safeBox: {
    xFrom: 0.24,
    xTo: 0.76,
    yFrom: 0.22,
    yTo: 0.86,
  },
  /** Opening width (19% → 81%). */
  openingWidth: 0.62,
  /** Safe content width (24% → 76%). */
  safeWidth: 0.52,
  crownApexY: 0.0815,
  voidBottomY: 0.895,
} as const;

/** Inner arch curve — y at each x column (symmetric about 50%). */
export const ARCH_CURVE: ReadonlyArray<{ x: number; y: number }> = [
  { x: 0.19, y: 0.295 },
  { x: 0.2, y: 0.239 },
  { x: 0.22, y: 0.197 },
  { x: 0.24, y: 0.184 },
  { x: 0.26, y: 0.171 },
  { x: 0.28, y: 0.157 },
  { x: 0.3, y: 0.145 },
  { x: 0.34, y: 0.123 },
  { x: 0.38, y: 0.107 },
  { x: 0.42, y: 0.094 },
  { x: 0.46, y: 0.085 },
  { x: 0.5, y: 0.0815 },
];

/** Candle sconce positions (source-frame fractions). */
export const SCONCES = {
  left: { x: 0.104, y: 0.344 },
  right: { x: 0.895, y: 0.344 },
} as const;

/** Still-life on the stone ledge (sealed letter + quill). */
export const LEDGE_STILL_LIFE = {
  xFrom: 0.27,
  xTo: 0.44,
  yFrom: 0.87,
  yTo: 0.93,
} as const;

/** Palette sampled from the paint — use these, not invented values. */
/**
 * Close portal framing — 16:9 bucket. Matthew picks from the ladder; other aspect
 * buckets scale proportionally (ratios vs the old 1.38 reference in the spec).
 *
 * Default 1.12 (Aug 2026): bay still uses receiving-wall-zoomed.jpg (~1.61× crop of
 * the poster). Stacking the old 1.54 dolly on that still over-zoomed into the teal
 * void. With the arch pinned on .roomStatic (luminance mask), 1.12 is a light interior
 * push that keeps the multi-tiered stone arch fully in frame (Matthew yellow-outline).
 */
export const DOLLY_IN_LADDER = [1.05, 1.12, 1.22] as const;
export const DOLLY_IN_DEFAULT = 1.12;
/** Legacy spec reference scale — used to derive aspect-ratio bucket multipliers. */
export const DOLLY_IN_REFERENCE = 1.38;
export const DOLLY_ASPECT_RATIOS = {
  /** max-aspect-ratio: 16/9 (taller than 16:9) */
  tall169: 1.24 / DOLLY_IN_REFERENCE,
  /** max-aspect-ratio: 3/2 */
  threeTwo: 1.04 / DOLLY_IN_REFERENCE,
  /** max-aspect-ratio: 6/5 — nave mode, absolute 1.0 */
  nave: 1,
} as const;

export const PALETTE = {
  voidInnerEdge: "#161712",
  voidCentre: "#3b4039",
  voidBloomPeak: "#677367",
  voidUnderCrown: "#22211d",
  mouldingShadowLeft: "#54442d",
  mouldingCatchLeft: "#716147",
  mouldingShadowRight: "#5d4c38",
  mouldingCatchRight: "#6d5f44",
  plasterLeft: "#c7a577",
  plasterRight: "#c7a276",
  frameTopMean: "#352e22",
  frameBottomMean: "#2e251b",
} as const;

export type ReceivingWallManifest = {
  room: "receiving-wall";
  sourceWidth: number;
  sourceHeight: number;
  aperture: typeof APERTURE;
  archCurve: typeof ARCH_CURVE;
  sconces: typeof SCONCES;
  ledgeStillLife: typeof LEDGE_STILL_LIFE;
  palette: typeof PALETTE;
};

export const RECEIVING_WALL_MANIFEST: ReceivingWallManifest = {
  room: "receiving-wall",
  sourceWidth: 1920,
  sourceHeight: 1080,
  aperture: APERTURE,
  archCurve: ARCH_CURVE,
  sconces: SCONCES,
  ledgeStillLife: LEDGE_STILL_LIFE,
  palette: PALETTE,
};
