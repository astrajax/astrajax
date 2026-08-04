import { describe, expect, it } from "vitest";
import { APERTURE, ARCH_CURVE } from "./receiving-wall-manifest";
import {
  archInteriorMaskUrl,
  buildArchPathD,
  roomStaticClipPath,
  roomStaticMaskUrl,
} from "./receiving-wall-arch-mask";

describe("receiving-wall arch mask geometry", () => {
  it("builds a closed symmetric path from the aperture legs and arch curve", () => {
    const path = buildArchPathD();

    expect(path.startsWith(`M ${APERTURE.innerLeft}`)).toBe(true);
    expect(path).toContain(`L ${APERTURE.innerRight}`);
    expect(path.endsWith(" Z")).toBe(true);

    // First curve point appears once on the left; its mirror appears on the right.
    const first = ARCH_CURVE[0];
    expect(path).toContain(`L ${first.x} ${first.y}`);
    expect(path).toContain(`L ${1 - first.x} ${first.y}`);

    // Apex (x=0.5) is on the axis of symmetry — only one segment.
    const apex = ARCH_CURVE[ARCH_CURVE.length - 1];
    expect(apex.x).toBe(0.5);
    expect(path.split(`L ${apex.x} ${apex.y}`).length - 1).toBe(1);
  });

  it("uses opposite SVG mask polarity for interior vs room-static overlays", () => {
    const interior = archInteriorMaskUrl();
    const room = roomStaticMaskUrl();

    expect(interior.startsWith('url("data:image/svg+xml,')).toBe(true);
    expect(room.startsWith('url("data:image/svg+xml,')).toBe(true);

    const interiorSvg = decodeURIComponent(
      interior.slice('url("data:image/svg+xml,'.length, -2),
    );
    const roomSvg = decodeURIComponent(room.slice('url("data:image/svg+xml,'.length, -2));

    expect(interiorSvg).toContain("fill='black'");
    expect(interiorSvg).toContain("fill='white'");
    expect(interiorSvg.indexOf("fill='black'")).toBeLessThan(
      interiorSvg.indexOf("fill='white'"),
    );

    expect(roomSvg).toContain("fill='white'");
    expect(roomSvg).toContain("fill='black'");
    expect(roomSvg.indexOf("fill='white'")).toBeLessThan(roomSvg.indexOf("fill='black'"));
  });

  it("builds an even-odd clip that subtracts the arch from the full frame", () => {
    const clip = roomStaticClipPath();
    const arch = buildArchPathD();

    expect(clip.startsWith("path(evenodd, 'M 0 0 H 1 V 1 H 0 Z ")).toBe(true);
    expect(clip).toContain(arch);
    expect(clip.endsWith("')")).toBe(true);
  });
});
