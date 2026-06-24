/**
 * Live Airtable IDs for Chapter 1 Brain Key bases (created via MCP, 24 Jun 2026).
 * Replicable schema blueprint: docs/initiatives/brain-key-schema.md
 * Override via env vars in production; scoped tokens still required per base.
 */

export const BRAIN_REGISTRY_BASE_ID = "appbdTVHevH6Bl5ZZ";

export const BRAIN_REGISTRY_TABLES = {
  brains: "tblAUtpgSjtKf3BBr",
  keyRequests: "tblhaWR5UNd8n01tn",
  accessGrants: "tblWLRYSGfLipR53P",
  changeLog: "tbliAMUuKKW4DDRXF",
} as const;

export const BRAIN_WORKSHOP_BASE_ID = "appL2fdnGmhA02WXd";

export const BRAIN_WORKSHOP_TABLES = {
  userBrains: "tblm6MqTYRPk8sA9o",
  draftBrainContext: "tblswvXNYFDqnl6af",
  brainInteractions: "tblNqNSuIJ2akHyA1",
  pamReviews: "tblMsU9nQTB1TuigK",
  approvalDecisions: "tblJExsLJghdI01XX",
  docActions: "tblimAjCOdFEcl52x",
} as const;

export const BRAIN_TRUSTED_CHAPTER1_BASE_ID = "app6tjzzG0L0lOeVb";

export const BRAIN_TRUSTED_CHAPTER1_TABLES = {
  brainContext: "tblipHzCl905T7o5F",
  personas: "tblBV7XSiTYdqSOWH",
} as const;

export const CHAPTER1_BRAIN_SLUG = "astrajax-chapter-1";
