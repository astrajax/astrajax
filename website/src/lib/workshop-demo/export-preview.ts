import { CHALLENGER_VERDICT, DEMO_AGENT } from "./demo-data";

/** Safe preview fields for the export step — no full skill body in DOM. */
export const EXPORT_PREVIEW = {
  version: 1,
  type: "agent",
  data: {
    name: DEMO_AGENT.name,
    description:
      "Scheduled web scanner for AstraJax. Sources useful external info from allowlisted domains weekly and drafts UNVERIFIED intake candidates for Clive's Man.",
    skillScope: "selected",
    skillLoadMode: "preload",
    modelId: "opus-latest",
    skills: [
      {
        name: "external-context-scanner",
        isPinned: true,
        toolsSummary: "web-search ON, documents ON",
      },
    ],
    scheduledInvocations: [
      {
        name: "Weekly external context scan",
        rrule: "FREQ=WEEKLY;BYDAY=MO;BYHOUR=8;BYMINUTE=0;BYSECOND=0",
        timezone: "Europe/London",
      },
    ],
    toolSettingsEnabled: ["web-search", "documents", "searchMode"],
    governedFlags: CHALLENGER_VERDICT.governedDefaults.map((d) => ({
      key: d.key,
      value: d.value,
    })),
  },
} as const;

export function formatExportPreviewJson(): string {
  return JSON.stringify(EXPORT_PREVIEW, null, 2);
}
