import type { Metadata } from "next";
import { CliveStudyRoom } from "@/components/command-centre/CliveStudyRoom";

export const metadata: Metadata = {
  title: "Clive's Study — AstraJax Command Centre",
  description: "Choose a book on Clive's desk — welcome, reasoning, architect journal, or brain building.",
};

export default function CommandClivePage() {
  return <CliveStudyRoom />;
}
