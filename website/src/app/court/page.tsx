import { CourtShell } from "@/components/platform/CourtShell";
import { Cinzel } from "next/font/google";
import type { Metadata } from "next";

// Engraved voice for the Court — same Cinzel face as Clive's Man Receiving
// Wall (see app/man/receiving-wall/page.tsx). Loaded page-scoped so only
// /court pays for it. CSS uses var(--font-engraved) as --font-book on
// .court-stage so every strip, label, and intake line matches the wall.
const courtFont = Cinzel({
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
    <div className={courtFont.variable}>
      <CourtShell />
    </div>
  );
}
