/**
 * Live Airtable IDs for Chapter 1 Brain Key bases (Phase B, 25 Jun 2026).
 * Replicable schema blueprint: docs/initiatives/brain-key-schema.md
 * Builder status + PAT/env guidance: docs/initiatives/brain-base-builder-agent.md
 * Override via env vars in production; scoped tokens still required per base.
 */

export const BRAIN_REGISTRY_BASE_ID = "appbdTVHevH6Bl5ZZ";

export const BRAIN_REGISTRY_TABLES = {
  brains: "tblAUtpgSjtKf3BBr",
  agents: "tblmb7syHipyWfBzu",
  keyRequests: "tblhaWR5UNd8n01tn",
  accessGrants: "tblWLRYSGfLipR53P",
  changeLog: "tbliAMUuKKW4DDRXF",
} as const;

export const BRAIN_WORKSHOP_BASE_ID = "appL2fdnGmhA02WXd";

export const BRAIN_WORKSHOP_TABLES = {
  userBrains: "tblm6MqTYRPk8sA9o",
  draftBrainTruth: "tblswvXNYFDqnl6af",
  brainInteractions: "tblNqNSuIJ2akHyA1",
  pamReviews: "tblMsU9nQTB1TuigK",
  approvalDecisions: "tblJExsLJghdI01XX",
  docActions: "tblimAjCOdFEcl52x",
} as const;

/** Brain Interactions table — client review / scoring fields (26 Jun 2026). */
export const BRAIN_WORKSHOP_INTERACTION_FIELDS = {
  interactionId: "fldPYqbMfMMfnhUY1",
  sessionId: "fldlx9xv78p5FzgWl",
  persona: "fldeJlSq1FZV4rjd4",
  brainSlug: "fldloZIUkRIHtbfQg",
  userMessage: "fld6zsgDpsXaajowO",
  assistantReply: "fldeTgHNF7i74IEl6",
  channel: "fldE6LoZEyY45GQx1",
  manifestRecordIds: "fldlFt3qR1unSDImq",
  manifestHashes: "fld1J0G2XRBNLIHkF",
  grantId: "fldu6eDbPn3xoT7kN",
  qualityScore: "fld9KAwriVWN3tCwC",
  reviewer: "fldMK745iAt4wSnl8",
  reviewNotes: "fldldE7GBguR5aNR5",
  reviewedAt: "fldZIfZIdfPFZMQKA",
  suspectedContextIssue: "fld5EI2euzVYnmlze",
  reviewStatus: "fldk0PaNuCRiWJfC2",
  contextFlagged: "flduYD4mnl27MTcRW",
} as const;

export const BRAIN_INTERACTION_REVIEW_STATUS = {
  new: "New",
  reviewed: "Reviewed",
  actionProposed: "Action proposed",
  noAction: "No action",
} as const;

export const BRAIN_INTERACTION_CONTEXT_FLAGGED = {
  none: "None",
  flaggedForReview: "Flagged for review",
  quarantineProposed: "Quarantine proposed",
  resolved: "Resolved",
} as const;

export const BRAIN_TRUSTED_CHAPTER1_BASE_ID = "app6tjzzG0L0lOeVb";

export const BRAIN_TRUSTED_CHAPTER1_TABLES = {
  brainTruth: "tblipHzCl905T7o5F",
  brainMemories: "tbl5clS3OPwuABsGC",
  /** Legacy — migrated to Agent bases Phase B; delete table in Airtable UI when ready */
  personas: "tblBV7XSiTYdqSOWH",
} as const;

/** Shared table shape across all Chapter 1 Agent bases (IDs differ per base). */
export interface AgentBaseTables {
  narrativeArch: string;
  personaConfig: string;
  personaMemories: string;
  minions: string;
}

export const CLIVE_AGENT_BASE_ID = "appBd9tudgvOSrhSX";
export const CLIVE_AGENT_TABLES = {
  narrativeArch: "tbl98Pa5dVPXgdXil",
  personaConfig: "tblKvlzwvct00LcPJ",
  personaMemories: "tblARijTt5tWUjuuN",
  minions: "tblFy6D5f4NoPMf1e",
} as const satisfies AgentBaseTables;

export const PAM_AGENT_BASE_ID = "appH7NeSSNntuKRL4";
export const PAM_AGENT_TABLES = {
  narrativeArch: "tblPMfpSZ7VTp87Pk",
  personaConfig: "tblqdIlbrY9qsUotQ",
  personaMemories: "tbl3k3On8UuDGJVQX",
  minions: "tbltMuegBZx6kv33M",
} as const satisfies AgentBaseTables;

export const DOC_AGENT_BASE_ID = "appI5tpwsKNwjfrqR";
export const DOC_AGENT_TABLES = {
  narrativeArch: "tblnAjaDHX0yccXgv",
  personaConfig: "tblvW54c4dVFdu57n",
  personaMemories: "tbls55fI3YtBLNBNb",
  minions: "tblgDsH08xfozFleP",
} as const satisfies AgentBaseTables;

export const CLIVE_MAN_AGENT_BASE_ID = "appZ71CSKBlhnb4hR";
export const CLIVE_MAN_AGENT_TABLES = {
  narrativeArch: "tblfFteVzoqJTyNkE",
  personaConfig: "tblQMlziNRMd53Yns",
  personaMemories: "tblS28UjKCCS1pI8t",
  minions: "tblqvGSnKOKReBX41",
} as const satisfies AgentBaseTables;

export const CHAPTER1_AGENT_BASES = {
  clive: { baseId: CLIVE_AGENT_BASE_ID, tables: CLIVE_AGENT_TABLES },
  pam: { baseId: PAM_AGENT_BASE_ID, tables: PAM_AGENT_TABLES },
  doc: { baseId: DOC_AGENT_BASE_ID, tables: DOC_AGENT_TABLES },
  "clive-man": { baseId: CLIVE_MAN_AGENT_BASE_ID, tables: CLIVE_MAN_AGENT_TABLES },
} as const;

export type Chapter1AgentSlug = keyof typeof CHAPTER1_AGENT_BASES;

export const CHAPTER1_BRAIN_SLUG = "astrajax-chapter-1";
