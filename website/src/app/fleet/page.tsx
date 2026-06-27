import { FleetDesignShell } from "@/components/platform/FleetDesignShell";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Fleet design — AstraJax",
  description:
    "Design task-scoped agents — personality editable, competence locked — with human-gated approval.",
};

export default function FleetPage() {
  return <FleetDesignShell />;
}
