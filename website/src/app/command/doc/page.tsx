import type { Metadata } from "next";
import { DocWorkshopRoom } from "@/components/command-centre/DocWorkshopRoom";

export const metadata: Metadata = {
  title: "Doc's Workshop — AstraJax Command Centre",
  description: "Agent building and dispatch after human approval.",
};

export default function CommandDocPage() {
  return <DocWorkshopRoom />;
}
