export const DEMO_AGENT = {
  slug: "external-context-scanner",
  name: "External Context Scanner",
  brainName: "Clive's Man intake (quarantine)",
  exportFilename: "agent-external-context-scanner-v0_1.json",
  exportPath: "hyperagent/exports/agents/agent-external-context-scanner-v0_1.json",
  generatorPath: "hyperagent/builds/build_external_context_scanner_v0_1.py",
  downloadUrl: "/workshop-demo/agent-external-context-scanner-v0_1.json",
} as const;

export const ROUTING_BLOCK = {
  routing: "Doc's Workshop — Hyperagent Builder",
  why: "Agent design pack cleared; mechanical build and export only.",
  notThisLane: "Not Vercel Minion (UI) or live Hyperagent import — export artifact only.",
} as const;

export const DEMO_BRIEF = {
  purpose:
    "Source useful external information from allowlisted domains once a week and hand it to Clive's Man as clearly-labelled UNVERIFIED intake candidates.",
  channel: "Hyperagent scheduled invocation — weekly, Monday 08:00 Europe/London",
  trigger: "Native RRULE schedule in the export; manual scans on request",
  dataActions:
    "Read allowlisted web sources. Draft at most 5 intake candidates per run. No canonical writes, no approvals — quarantine-only output.",
  tone: "Practical analyst, not an indexer. Competence locked; personality editable in fleet design later.",
  riskTier: "Medium-High" as const,
  runtime: "Hyperagent only (scheduled web sourcing — no Cursor twin in v1)",
};

export const PROPOSER_PACK = {
  mission: DEMO_BRIEF.purpose,
  nonGoals: [
    "Decide what becomes canonical context — Clive's Man curates, Matthew promotes",
    "Follow links off the source allowlist",
    "Write Airtable, repo files, or published claims",
  ],
  toolsPlan: [
    { id: "web-search", label: "Web search", enabled: true, why: "Allowlisted-domain sourcing" },
    { id: "documents", label: "Documents", enabled: true, why: "Structured intake-candidate drafts" },
    { id: "browser", label: "Browser", enabled: false, why: "Biggest injection surface — off in v1" },
    { id: "tables", label: "Tables", enabled: false, why: "No table work in scan lane" },
  ],
  evalFloor: "5 capability + 3 boundary tests (incl. embedded-instruction resistance)",
  rosterDecision:
    "BUILD NEW — sibling of archived Clive Context Scanner v0.4; open-web sourcing axis is clear",
  proposerNote: "Proposer designs the pack. It does not write runtime files.",
};

export const CHALLENGER_VERDICT = {
  verdict: "Proceed" as const,
  summary:
    "Pack is scoped, allowlist-bound, and quarantine-only. Injection risk is named and mitigated. Weekly cadence keeps cost visible before scaling.",
  checks: [
    { id: "scope", label: "Scope narrow enough for Medium-High tier", pass: true },
    { id: "injection", label: "Fetched content treated as data, never instructions", pass: true },
    { id: "tools", label: "No browser/sandbox without justification", pass: true },
    { id: "governed", label: "Governed defaults checklist complete", pass: true },
    { id: "eval", label: "Eval floor ≥5 capability, ≥3 boundary", pass: true },
    { id: "duplicate", label: "Roster check — archived v0.4 lineage noted", pass: true },
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
  "Running generator — embedded skill, weekly RRULE schedule, allowlist baked in",
  "Running validate_hyperagent_export.py — schema v1 + governed defaults",
  `Export written: ${DEMO_AGENT.exportPath}`,
] as const;

export const IMPORT_HANDOFF = [
  "First-time import: agent JSON only (embedded skill and weekly schedule attach automatically)",
  "After import: verify tool toggles and the Monday 08:00 schedule match the build pack",
  "Wire the Clive's Man intake integration in the Hyperagent UI before the first scheduled run",
  "Do not delete Hyperagent agent unless retiring — preserves webhook stability",
] as const;

export const CLIVE_MAN_HANDOFF =
  "In production, the Hyperagent Builder invokes @clive-man with export paths, governed defaults confirmed, and any roster decisions. This demo shows the handoff note only.";
