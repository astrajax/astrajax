import type { CSSProperties } from "react";
import {
  HEALTH_BAND_CSS_VAR,
  healthBandLabel,
  type BrainHealthBand,
} from "@/lib/platform/brains";

type StatusCartoucheProps = {
  band: BrainHealthBand;
  className?: string;
};

export function StatusCartouche({ band, className = "" }: StatusCartoucheProps) {
  return (
    <div
      className={`brain-shrine__cartouche ${className}`.trim()}
      style={{ "--health-accent": HEALTH_BAND_CSS_VAR[band] } as CSSProperties}
      role="status"
      aria-label={`Brain health: ${healthBandLabel(band)}`}
    >
      <span className="brain-shrine__cartouche-word">{healthBandLabel(band)}</span>
    </div>
  );
}
