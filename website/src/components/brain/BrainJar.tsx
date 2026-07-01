import type { CSSProperties } from "react";
import Image from "next/image";
import { HEALTH_BAND_CSS_VAR, shrineArtForBand, type BrainHealthBand } from "@/lib/platform/brains";

type BrainJarProps = {
  healthBand: BrainHealthBand;
  alt: string;
};

export function BrainJar({ healthBand, alt }: BrainJarProps) {
  return (
    <div
      className="brain-shrine__jar"
      style={{ "--health-glow": HEALTH_BAND_CSS_VAR[healthBand] } as CSSProperties}
    >
      <Image
        src={shrineArtForBand(healthBand)}
        alt={alt}
        fill
        priority
        className="brain-shrine__jar-image"
        sizes="100vw"
      />
    </div>
  );
}
