/** Kathryn brand tokens for Doc workshop deep dive (night mode). */
export const WORKSHOP_BRAND = {
  moss: "#202A1B",
  workshopDark: "#1a120c",
  parchment: "#E7D1AD",
  sage: "#9AA77A",
  graphite: "#171A18",
} as const;

export const DEMO_AGENT = {
  slug: "northline-shift-advisor-demo",
  name: "Northline Shift Advisor",
  brainName: "Northline Field Ops Brain",
  exportFilename: "agent-northline-shift-advisor-demo-v0_1.json",
  exportPath: "hyperagent/exports/agents/agent-northline-shift-advisor-demo-v0_1.json",
  generatorPath: "hyperagent/builds/build_northline_shift_advisor_demo_v0_1.py",
  downloadUrl: "/workshop-demo/agent-northline-shift-advisor-demo-v0_1.json",
} as const;

export const ROUTING_BLOCK = {
  routing: "Doc's Workshop — Hyperagent Builder",
  why: "Agent design pack cleared; mechanical build and export only.",
  notThisLane: "Not Vercel Minion (UI) or live Hyperagent import — export artifact only.",
} as const;

export const DEMO_BRIEF = {
  purpose:
    "Help Northline field reps plan event shifts against approved staffing minimums. Draft RM exception requests when minimums cannot be met.",
  channel: "Hyperagent thread — field sales managers and regional leads",
  trigger: "On-demand when rep opens shift planning from the brain-linked session",
  dataActions:
    "Read approved staffing truths at session start. Draft structured exception requests. No roster writes without human approval.",
  tone: "Practical, field-ready. Competence locked; personality editable in fleet design later.",
  riskTier: "Medium" as const,
  runtime: "Hyperagent only (demo export — no Cursor twin in v1)",
};

export const PROPOSER_PACK = {
  mission: DEMO_BRIEF.purpose,
  nonGoals: [
    "Replace RM judgement on exceptions",
    "Quote draft workshop rows as policy",
    "Auto-schedule or mutate rosters",
  ],
  toolsPlan: [
    { id: "documents", label: "Documents", enabled: true, why: "Structured exception drafts" },
    { id: "tables", label: "Tables", enabled: true, why: "Compare shift options vs approved minimums" },
    { id: "browser", label: "Browser", enabled: false, why: "Not required for trusted-context reads" },
    { id: "web-search", label: "Web search", enabled: false, why: "Brain-bound; no open web" },
  ],
  evalFloor: "5 capability + 3 boundary tests (see build pack)",
  rosterDecision: "BUILD NEW — no overlapping fleet agent on shift planning axis",
  proposerNote: "Proposer designs the pack. It does not write runtime files.",
};

export const CHALLENGER_VERDICT = {
  verdict: "Proceed" as const,
  summary:
    "Pack is scoped, brain-bound, and respects governed defaults. Tool surface is minimal. Eval floor meets Workshop standard.",
  checks: [
    { id: "scope", label: "Scope narrow enough for Medium tier", pass: true },
    { id: "tools", label: "No browser/sandbox without justification", pass: true },
    { id: "governed", label: "Governed defaults checklist complete", pass: true },
    { id: "eval", label: "Eval floor ≥5 capability, ≥3 boundary", pass: true },
    { id: "duplicate", label: "Roster check — 0–1 axis overlap", pass: true },
  ],
  governedDefaults: [
    { key: "autoSaveMemories", label: "Auto-save memories", value: "false", locked: true },
    { key: "autoSaveSkills", label: "Auto-save skills", value: "false", locked: true },
    { key: "autoSaveAgents", label: "Auto-save agents", value: "false", locked: true },
    { key: "autoSavePrompts", label: "Auto-save prompts", value: "false", locked: true },
    { key: "skillLoadMode", label: "Skill load mode", value: "preload", locked: true },
    { key: "skillScope", label: "Skill scope", value: "selected", locked: true },
  ],
};

export const BUILDER_LOG = [
  "Loading cleared brief from Workshop Challenger handoff",
  `Writing generator: ${DEMO_AGENT.generatorPath}`,
  "Running generator — embedded skill with 11 required fields",
  "Running validate_hyperagent_export.py — schema v1 + governed defaults",
  `Export written: ${DEMO_AGENT.exportPath}`,
] as const;

export const IMPORT_HANDOFF = [
  "First-time import: agent JSON only (embedded skill attaches automatically)",
  "After import: verify tool toggles match build pack",
  "Attach Northline brain in Hyperagent UI if running live (demo uses mock context)",
  "Do not delete Hyperagent agent unless retiring — preserves webhook stability",
] as const;

export const CLIVE_MAN_HANDOFF =
  "In production, the Hyperagent Builder invokes @clive-man with export paths, governed defaults confirmed, and any roster decisions. This demo shows the handoff note only.";
