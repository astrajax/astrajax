import { BrainShrine } from "@/components/brain/BrainShrine";
import { Cinzel } from "next/font/google";
import type { Metadata } from "next";

const shrineFont = Cinzel({
  subsets: ["latin"],
  weight: ["600", "700"],
  variable: "--font-shrine",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Brain shrine — AstraJax",
  description:
    "Browse governed brains, read health at a glance, and enter each brain's workspace.",
};

export default function BrainShrinePage() {
  return (
    <div className={shrineFont.variable}>
      <BrainShrine />
    </div>
  );
}
