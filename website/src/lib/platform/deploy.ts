import type { PaperTrailLine } from "./brain-health";
import type { FleetAgentSlug } from "./fleet";

export interface ScopedTool {
  id: string;
  label: string;
  description: string;
}

export interface TrustedContextBinding {
  id: string;
  label: string;
  maturityRequired: string;
}

export interface GovernedDefault {
  key: string;
  label: string;
  value: string;
  locked: boolean;
}

export interface DeployPackage {
  id: string;
  agentSlug: FleetAgentSlug;
  agentName: string;
  brainName: string;
  scopedTools: ScopedTool[];
  approvalRulesSummary: string;
  trustedContextBindings: TrustedContextBinding[];
  governedDefaults: GovernedDefault[];
  memoryTarget: string;
  runtimeFetchNote: string;
}

export interface DeploySnapshot {
  partnerFraming: string;
  packages: DeployPackage[];
}

export const DEPLOY_PARTNER_FRAMING =
  "HyperAgent makes powerful agents possible. AstraJax makes them adoptable by the teams who know the work.";

export const DEFAULT_DEPLOY: DeploySnapshot = {
  partnerFraming: DEPLOY_PARTNER_FRAMING,
  packages: [
    {
      id: "pkg-forecast-coach",
      agentSlug: "forecast-coach",
      agentName: "Forecast Coach",
      brainName: "Northline Field Ops Brain",
      scopedTools: [
        {
          id: "tool-truth-read",
          label: "Read approved truths",
          description: "Fetch trusted forecast and staffing snippets at session start.",
        },
        {
          id: "tool-escalate",
          label: "Propose escalation",
          description: "Draft exception or gap flag for human approval, no direct writes.",
        },
      ],
      approvalRulesSummary:
        "Forecast assumption changes and staffing exceptions require RM sign-off before any record update.",
      trustedContextBindings: [
        {
          id: "bind-forecast",
          label: "Forecast guardrails bundle",
          maturityRequired: "Working Brain",
        },
        {
          id: "bind-staffing",
          label: "Event staffing minimums",
          maturityRequired: "Working Brain",
        },
      ],
      governedDefaults: [
        { key: "autoSaveMemories", label: "Auto-save memories", value: "false", locked: true },
        { key: "sessionContextFetch", label: "Session context fetch", value: "trusted at start", locked: true },
        { key: "draftRowUsage", label: "Draft row usage", value: "cite with gap flag only", locked: true },
      ],
      memoryTarget: "Airtable Agent / Trusted bases, durable memory, not runtime cache.",
      runtimeFetchNote:
        "HyperAgent session loads trusted context at start; runtime does not own the brain.",
    },
    {
      id: "pkg-event-staffing",
      agentSlug: "event-staffing-advisor",
      agentName: "Event Staffing Advisor",
      brainName: "Northline Field Ops Brain",
      scopedTools: [
        {
          id: "tool-rota-read",
          label: "Read staffing truths",
          description: "Approved minimums and regional calendars only.",
        },
        {
          id: "tool-exception-draft",
          label: "Draft exception request",
          description: "Structured proposal for RM review, no roster mutation.",
        },
      ],
      approvalRulesSummary:
        "Weekend minimum exceptions need RM approval with reason captured in the brain log.",
      trustedContextBindings: [
        {
          id: "bind-staffing-min",
          label: "Staffing minimums truth set",
          maturityRequired: "Working Brain",
        },
      ],
      governedDefaults: [
        { key: "autoSaveMemories", label: "Auto-save memories", value: "false", locked: true },
        { key: "sessionContextFetch", label: "Session context fetch", value: "trusted at start", locked: true },
        { key: "autoScheduling", label: "Auto-scheduling", value: "disabled", locked: true },
      ],
      memoryTarget: "Airtable Agent / Trusted bases, durable memory, not runtime cache.",
      runtimeFetchNote:
        "HyperAgent session loads trusted context at start; runtime does not own the brain.",
    },
    {
      id: "pkg-pricing-guardrail",
      agentSlug: "pricing-guardrail-checker",
      agentName: "Pricing Guardrail Checker",
      brainName: "Northline Field Ops Brain",
      scopedTools: [
        {
          id: "tool-pricing-read",
          label: "Read pricing guardrails",
          description: "Approved tier ladder and off-script rules, draft rows excluded.",
        },
        {
          id: "tool-discount-escalate",
          label: "Route discount escalation",
          description: "Draft RM sign-off request when rep exceeds approved tier.",
        },
      ],
      approvalRulesSummary:
        "Off-tier discounts route to RM with brain log entry before any customer-facing commit.",
      trustedContextBindings: [
        {
          id: "bind-pricing",
          label: "Pricing guardrail bundle",
          maturityRequired: "Working Brain",
        },
      ],
      governedDefaults: [
        { key: "autoSaveMemories", label: "Auto-save memories", value: "false", locked: true },
        { key: "sessionContextFetch", label: "Session context fetch", value: "trusted at start", locked: true },
        { key: "pnlBlending", label: "P&L blending", value: "forbidden", locked: true },
      ],
      memoryTarget: "Airtable Agent / Trusted bases, durable memory, not runtime cache.",
      runtimeFetchNote:
        "HyperAgent session loads trusted context at start; runtime does not own the brain.",
    },
  ],
};

export function createExportPaperTrail(agentName: string, actor: string): PaperTrailLine {
  return {
    id: `pt-export-${Date.now()}`,
    action: `Exported HyperAgent-ready package for ${agentName}`,
    actor,
    reason: "Human gate: package summary reviewed before handoff.",
    timestamp: new Date().toISOString(),
  };
}

export function createDeployPaperTrail(agentName: string, actor: string): PaperTrailLine {
  return {
    id: `pt-deploy-${Date.now()}`,
    action: `Mock deploy to HyperAgent for ${agentName}`,
    actor,
    reason: "Demo only, no live runtime sync. Success state shown for booth walkthrough.",
    timestamp: new Date().toISOString(),
  };
}
