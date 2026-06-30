import type { Metadata } from "next";
import { PamDeskRoom } from "@/components/command-centre/PamDeskRoom";

export const metadata: Metadata = {
  title: "Pam's Desk — AstraJax Command Centre",
  description: "Brain bases, health scores, and challenge before you fix stale context.",
};

export default function CommandPamPage() {
  return <PamDeskRoom />;
}
