/**
 * Arch aperture masks derived from receiving-wall-manifest.ts (ARCH_CURVE + APERTURE).
 * Used by ReceivingWall: interior clip + inverse room-static overlay.
 */
import { APERTURE, ARCH_CURVE } from "./receiving-wall-manifest";

/** Closed SVG path for the inner arch opening (viewBox 0 0 1 1, symmetric about x=0.5). */
export function buildArchPathD(): string {
  /** Prefer holeBottomY — keeps ledge props on the pinned room layer. */
  const bottom = APERTURE.holeBottomY;
  const left = APERTURE.innerLeft;
  const right = APERTURE.innerRight;
  const curve = ARCH_CURVE;

  const fmt = (n: number) => n.toFixed(4).replace(/\.?0+$/, "");

  let d = `M ${fmt(left)} ${fmt(bottom)}`;
  d += ` L ${fmt(curve[0].x)} ${fmt(curve[0].y)}`;

  for (let i = 1; i < curve.length; i++) {
    d += ` L ${fmt(curve[i].x)} ${fmt(curve[i].y)}`;
  }

  for (let i = curve.length - 2; i >= 0; i--) {
    const mirrorX = 1 - curve[i].x;
    d += ` L ${fmt(mirrorX)} ${fmt(curve[i].y)}`;
  }

  d += ` L ${fmt(right)} ${fmt(bottom)} Z`;
  return d;
}

function svgMaskDataUri(pathD: string, apertureFill: "white" | "black"): string {
  const bg = apertureFill === "white" ? "black" : "white";
  const svg = [
    "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1 1' preserveAspectRatio='none'>",
    `<rect width='1' height='1' fill='${bg}'/>`,
    `<path d='${pathD}' fill='${apertureFill}'/>`,
    "</svg>",
  ].join("");
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}

/** Interior visible inside the arch only (aperture = white). */
export function archInteriorMaskUrl(): string {
  return svgMaskDataUri(buildArchPathD(), "white");
}

/** Static room plate visible outside the arch only (aperture = black hole). */
export function roomStaticMaskUrl(): string {
  return svgMaskDataUri(buildArchPathD(), "black");
}

/** clip-path for room static — poster visible outside arch only (even-odd subtract). */
export function roomStaticClipPath(): string {
  const arch = buildArchPathD();
  return `path(evenodd, 'M 0 0 H 1 V 1 H 0 Z ${arch}')`;
}
