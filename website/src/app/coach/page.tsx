import { CoachShell } from "@/components/platform/CoachShell";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Coach — User brain — AstraJax",
  description:
    "User-brain competency map, Clive and Pam calibration, and Coach Whit prompt coaching.",
};

export default function CoachPage() {
  return <CoachShell />;
}
