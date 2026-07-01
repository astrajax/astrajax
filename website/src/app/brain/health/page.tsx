import { DEFAULT_BRAIN_SLUG } from "@/lib/platform/brains";
import { redirect } from "next/navigation";

export default function BrainHealthRedirect() {
  redirect(`/brain/${DEFAULT_BRAIN_SLUG}?tab=overview`);
}
