import { DispatchShell } from "@/components/platform/DispatchShell";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Doc dispatch — AstraJax",
  description:
    "Implementation jobs board — routing table, Opus to Composer builds, and publish gates.",
};

export default function DispatchPage() {
  return <DispatchShell />;
}
