import { DeployShell } from "@/components/platform/DeployShell";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Package and deploy — AstraJax",
  description:
    "HyperAgent-ready packages with governed defaults, scoped tools, and honest mock deployment.",
};

export default function DeployPage() {
  return <DeployShell />;
}
