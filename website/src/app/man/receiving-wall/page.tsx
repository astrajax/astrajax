import { ReceivingWall } from "@/components/man/ReceivingWall";
import { Cinzel } from "next/font/google";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

const wallFont = Cinzel({
  subsets: ["latin"],
  weight: ["600", "700"],
  variable: "--font-wall",
  display: "swap",
});

export const metadata: Metadata = {
  title: "The Receiving Wall — Clive's Man — AstraJax",
  description:
    "Where the household's captured context arrives. Read the wall, open a record, and decide what each truth becomes.",
};

export default function ReceivingWallPage() {
  return (
    <div className={wallFont.variable}>
      <ReceivingWall />
    </div>
  );
}
