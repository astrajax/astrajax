import type { Metadata } from "next";
import { CliveStudyRoom } from "@/components/command-centre/CliveStudyRoom";

export const metadata: Metadata = {
  title: "Clive's Study — AstraJax Command Centre",
  description: "Reasoning and context management with Clive Wigglesworth.",
};

export default function CommandClivePage() {
  return <CliveStudyRoom />;
}
