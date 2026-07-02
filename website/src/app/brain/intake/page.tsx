import { DEFAULT_BRAIN_SLUG } from "@/lib/platform/brains";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Sit with Clive — AstraJax",
  description:
    "Context curation with Clive — review the docket, propose truths, and file records with visible destinations.",
};

/** Retired: standalone intake was preview-only. Curation lives in the sitting. */
export default function ContextIntakeRedirect() {
  redirect(`/brain/${DEFAULT_BRAIN_SLUG}/curate`);
}
