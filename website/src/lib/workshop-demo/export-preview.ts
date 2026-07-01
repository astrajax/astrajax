import { CHALLENGER_VERDICT, DEMO_AGENT } from "./demo-data";

/** Safe preview fields for the export step — no full skill body in DOM. */
export const EXPORT_PREVIEW = {
  version: 1,
  type: "agent",
  data: {
    name: DEMO_AGENT.name,
    description:
      "Field-sales shift planning assistant for Northline Field Ops. Reads approved staffing truths, drafts exception requests for RM review.",
    skillScope: "selected",
    skillLoadMode: "preload",
    modelId: "opus-latest",
    skills: [
      {
        name: "northline-shift-advisor-demo",
        isPinned: true,
        toolsSummary: "documents ON, tables ON",
      },
    ],
    toolSettingsEnabled: ["documents", "tables", "searchMode"],
    governedFlags: CHALLENGER_VERDICT.governedDefaults.map((d) => ({
      key: d.key,
      value: d.value,
    })),
  },
} as const;

export function formatExportPreviewJson(): string {
  return JSON.stringify(EXPORT_PREVIEW, null, 2);
}
