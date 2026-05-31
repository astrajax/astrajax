import type { Metadata } from "next";
import { JourneyContent } from "@/components/JourneyContent";

export const metadata: Metadata = {
  title: "Matthew's Journey — AstraJax",
  description:
    "The Airspace talk track: how a non-technical commercial leader built an AI-ready operating system — boring layer first, agents second.",
};

export default function JourneyPage() {
  return <JourneyContent />;
}
