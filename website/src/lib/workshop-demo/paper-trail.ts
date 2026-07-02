import type { PaperTrailLine } from "@/lib/platform/brain-health";

export function createApprovalPaperTrail(actor: string): PaperTrailLine {
  return {
    id: `pt-ws-approve-${Date.now()}`,
    action: `${actor} approved Workshop build — Phase B cleared`,
    actor,
    reason: "Challenger verdict: proceed. Human gate before Composer writes files.",
    timestamp: new Date().toISOString(),
  };
}

export function createBuildCompletePaperTrail(actor: string): PaperTrailLine {
  return {
    id: `pt-ws-build-${Date.now()}`,
    action: "Hyperagent Builder finished — export validated",
    actor: "Doc's Workshop Hyperagent Builder (Composer)",
    reason: `Build authorised by ${actor}. Generator run + validate_hyperagent_export.py passed.`,
    timestamp: new Date().toISOString(),
  };
}

export function createExportReadyPaperTrail(): PaperTrailLine {
  return {
    id: `pt-ws-export-${Date.now()}`,
    action: "Export ready for Hyperagent import",
    actor: "Doc's Workshop",
    reason:
      "agent-external-context-scanner-v0_1.json — embedded skill, weekly schedule, governed defaults confirmed.",
    timestamp: new Date().toISOString(),
  };
}
