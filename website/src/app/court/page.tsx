import { CourtShell } from "@/components/platform/CourtShell";
import { Cinzel } from "next/font/google";
import type { Metadata } from "next";

// Engraved voice for the Court's brass — the same face as the Brain Shrine's
// plates (see app/brain/page.tsx), loaded page-scoped so only /court pays for
// it. Referenced in CSS as var(--font-engraved, …) with serif fallbacks.
const engravedFont = Cinzel({
  subsets: ["latin"],
  weight: ["600", "700"],
  variable: "--font-engraved",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Court mode — AstraJax",
  description:
    "The Court convenes for consequential calls — the cast speak in character, the human gives judgement.",
};

export default function CourtPage() {
  return (
    <div className={engravedFont.variable}>
      <CourtShell />
    </div>
  );
}
