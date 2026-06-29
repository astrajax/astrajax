/**
 * Live Airtable IDs for Chapter 1 Brain Key bases (Phase B, 25 Jun 2026).
 * Replicable schema blueprint: docs/initiatives/brain-key-schema.md
 * Builder status + PAT/env guidance: docs/initiatives/doc-brain-base-builder.md
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

/** Registry Brains table — Chapter 1 context structure fields (Phase B, 29 Jun 2026). */
export const BRAIN_REGISTRY_BRAINS_FIELDS = {
  brainSlug: "fldXw8rDWqzrIDcGA",
  brainName: "fldXpuQ9VpksGlrqk",
  purpose: "fldw3C7bMEqWWbjjf",
  brainType: "fldJcvtVv8WrCOEsj",
  scopeArea: "fldITnNzA3TqiSXVy",
  maturity: "fldr4LEJPGzh5X9Zi",
  workshopBaseId: "fldNOk4DJUhqbY37l",
  trustedBaseId: "fldwfZ0MRyjvCG9S5",
  status: "fldlqAv7M40Fw4v9p",
  domainOwner: "fld6A4WeBjLGMc7Kw",
} as const;

export const BRAIN_WORKSHOP_BASE_ID = "appL2fdnGmhA02WXd";

export const BRAIN_WORKSHOP_TABLES = {
  userBrains: "tblm6MqTYRPk8sA9o",
  draftBrainTruth: "tblswvXNYFDqnl6af",
  sourceDocuments: "tblfWdhwbq4QsCjUf",
  brainInteractions: "tblNqNSuIJ2akHyA1",
  pamReviews: "tblMsU9nQTB1TuigK",
  approvalDecisions: "tblJExsLJghdI01XX",
  docActions: "tblimAjCOdFEcl52x",
} as const;

/** Workshop User Brains — identity + operator development (Phase B, 29 Jun 2026). */
export const BRAIN_WORKSHOP_USER_BRAINS_FIELDS = {
  userLabel: "fldi06frit7tJGBqZ",
  archetype: "fldK3PP8kdgLwcjPd",
  primaryFunction: "fldN5rZRjgEgzBWT4",
  brainSet: "fldRa47ySX1yWui2A",
  oneLineRemit: "fldEgPO6TXmBpDVaI",
  roleDomain: "fldjO5b8ZkZ6fLUrw",
  guideMode: "fldtkpb76WqRX4KDb",
  aiConfidence: "fldxhhjBkFsI1AnPk",
  contextEnvironmentConfidence: "fldM4WRnlbuzynXR2",
  strengths: "fldPn5Bv0ouRgCi0T",
  weaknesses: "fldFoXvkSAF1EYfqS",
  coachingPreferences: "fldbMUmiaKHSP4UNb",
  developmentFocus: "fldAGVdVxp0JFe4BL",
  developmentNotes: "fldWWPyNMYAVzfLtO",
  psychometricReference: "fldYF3O7dFOJTHWUt",
  notes: "fldTn2QCcji7c3cPv",
} as const;

/** Matthew demo row — Workshop User Brains (Phase B seed). */
export const BRAIN_WORKSHOP_USER_BRAINS_DEMO = {
  matthew: "recj9eQY8y6lqxEV9",
} as const;

/** Workshop Source Documents — Clive's Man attachment mining (Phase B, 29 Jun 2026). */
export const BRAIN_WORKSHOP_SOURCE_DOCUMENTS_FIELDS = {
  title: "fldXZjXfaINi0GsBF",
  attachment: "fld2Arp3c9y8DvwN6",
  attachmentSummary: "fld9kNTVmyyejfdko",
  mineStatus: "fld9YeXtmbLFBSxir",
  brainSlug: "fldbpIC2Ekte9LB1v",
  proposedByAgent: "fldlxdJ7vHV76XYK6",
  createdBy: "fldj4gdpDTJICpU7B",
  notes: "fldE4bLBTpbfzdHwh",
  linkedDrafts: "fldm0dA2jtyU0V3Vl",
} as const;

export const BRAIN_WORKSHOP_SOURCE_DOCUMENTS_MINE_STATUS = {
  pending: "Pending",
  summarised: "Summarised",
  proposed: "Proposed",
  skipped: "Skipped",
} as const;

/** Workshop Draft Brain Truth — Chapter 1 context structure (Phase B, 29 Jun 2026). */
export const BRAIN_WORKSHOP_DRAFT_TRUTH_FIELDS = {
  title: "fld8BVmRBSsVuXD8I",
  canonicalText: "fld95ls0LG26rCNx4",
  brainSlug: "flddfROfNcP1u6gCy",
  brainTheme: "fld8wdl04NOs8CwpX",
  proposedCategory: "fldD4gLnHeihH7yCd",
  horizon: "fldEgLQcvc6L4c9p1",
  status: "fldiMCxuBITyZIOXW",
  proposedByAgent: "flde1d1sda9lWwrj9",
  createdBy: "fldEonKVeEsrbiwkm",
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
} as const;

/** Trusted Brain Truth — Chapter 1 context structure (Phase B, 29 Jun 2026). */
export const BRAIN_TRUSTED_CHAPTER1_TRUTH_FIELDS = {
  title: "fldVxNhopdtZTjR6n",
  canonicalText: "fldX79BWrIGBUccHT",
  category: "fld4gG1ZjH3ETmqa3",
  scope: "fldtQVETmrrHUiYMw",
  brainTheme: "fldFGVJhAUHTq7Xco",
  horizon: "fldU57ic2fZWwFmlU",
  authority: "fldX0V2cpvYlwiWxh",
  freshness: "fld0eIdJ9UEjSbstx",
  lastReviewed: "fldvBsrSKoy6YKjUf",
  legacyScopeText: "fldIo20j7jpJNL03f",
} as const;

/** Chapter 1 Registry Brains row (Phase B — Brain Type = Core). */
export const BRAIN_REGISTRY_CHAPTER1_BRAIN = {
  recordId: "recT9PuelzCg7LuPC",
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

/**
 * Tiered character-context model fields (Phase B, 26 Jun 2026).
 * Reference implementation on the Clive Agent base; the same fields roll out to
 * pam / doc / clive-man bases when ready. Schema + governance:
 * docs/initiatives/brain-key-schema.md (Tiered character context).
 */
export const CLIVE_NARRATIVE_ARCH_TIER_FIELDS = {
  /** singleSelect: Pending | Approved-Canonical — the agent-write approval gate (Tier 1 + 2). */
  provenanceStatus: "fldJojz3esjGO2klY",
  /** singleSelect: Tier 1 — Super Objective | Tier 2 — Known Truth. */
  tier: "fldRUW0s4RR8R1Rq1",
  /** singleSelect: the fixed five Known Truth slots. */
  knownTruthSlot: "fldQteQIJTrsOGCxu",
  /** number (0dp): 5 = Super Objective, 4 = Known Truth; Persona Memories are 3 (on demand). */
  injectionPriority: "fldPp4QgTSe7FbL78",
  /** auto-created inverse of Persona Memories → Known Truth link. */
  personaMemoriesLink: "fld8PHQR2aRgqM0oi",
} as const;

export const CLIVE_PERSONA_MEMORIES_TIER_FIELDS = {
  /** multipleRecordLinks → Narrative Arch. Memory → Known Truth link (Tier 3 → Tier 2). */
  knownTruthLink: "fldjselBA3YHpPuqf",
} as const;

/** Agent writes default to "Pending"; Matthew promotes to "Approved-Canonical". */
export const CHARACTER_PROVENANCE_STATUS = {
  pending: "Pending",
  approvedCanonical: "Approved-Canonical",
} as const;

export const CHARACTER_TIER = {
  superObjective: "Tier 1 — Super Objective",
  knownTruth: "Tier 2 — Known Truth",
} as const;

/** The fixed five Known Truths (Tier 2). Keep one record per slot. */
export const KNOWN_TRUTH_SLOTS = {
  formativeMemory: "1 — Formative Memory",
  secret: "2 — Secret",
  baselineRelationshipStance: "3 — Baseline Relationship Stance",
  greatestFear: "4 — Greatest Fear",
  innerAttitude: "5 — Inner Attitude",
} as const;

/** Seed record IDs for the Clive tier scaffold (Approved-Canonical 27 Jun 2026). */
export const CLIVE_TIER_SEED_RECORDS = {
  superObjective: "recFs4640A6yFOEyo",
  knownTruth1FormativeMemory: "reccUyF8mxj3Uv0mO",
  knownTruth2Secret: "recsOW1Wy3KCumXXY",
  knownTruth3BaselineRelationshipStance: "rec2nihSPX2qdkO85",
  knownTruth4GreatestFear: "recV0BWeKhQ2pZYyv",
  knownTruth5InnerAttitude: "recx18KnKU2IlcRdT",
} as const;

/** Clive Persona Config — Approved Operational v0.2 (27 Jun 2026). Canonical technical role spec. */
export const CLIVE_PERSONA_CONFIG = {
  operationalV02: "recJFiRQjbIecCAQ5",
} as const;

export const PAM_AGENT_BASE_ID = "appH7NeSSNntuKRL4";
export const PAM_AGENT_TABLES = {
  narrativeArch: "tblPMfpSZ7VTp87Pk",
  personaConfig: "tblqdIlbrY9qsUotQ",
  personaMemories: "tbl3k3On8UuDGJVQX",
  minions: "tbltMuegBZx6kv33M",
} as const satisfies AgentBaseTables;

/** Pam Persona Config — Approved Operational v0.2 (27 Jun 2026). Canonical technical role spec. */
export const PAM_PERSONA_CONFIG = {
  operationalV02: "rect3MIejCMhCWdH1",
} as const;

export const PAM_NARRATIVE_ARCH_TIER_FIELDS = {
  /** singleSelect: Pending | Approved-Canonical — the agent-write approval gate (Tier 1 + 2). */
  provenanceStatus: "flddl8JkJENLwnC23",
  /** singleSelect: Tier 1 — Super Objective | Tier 2 — Known Truth. */
  tier: "fldN4aR8fLOuDnLX2",
  /** singleSelect: the fixed five Known Truth slots. */
  knownTruthSlot: "fldKc2L1MbdsfrC9J",
  /** number (0dp): 5 = Super Objective, 4 = Known Truth; Persona Memories are 3 (on demand). */
  injectionPriority: "fldCUYg0D05mrVqK0",
  /** auto-created inverse of Persona Memories → Known Truth link. */
  personaMemoriesLink: "fldgZCxhAm2LoCqsT",
} as const;

export const PAM_PERSONA_MEMORIES_TIER_FIELDS = {
  /** multipleRecordLinks → Narrative Arch. Memory → Known Truth link (Tier 3 → Tier 2). */
  knownTruthLink: "fldd9z8GQfvWQQH76",
} as const;

/** Seed record IDs for the Pam tier scaffold (Approved-Canonical 27 Jun 2026). */
export const PAM_TIER_SEED_RECORDS = {
  superObjective: "recnVuOKPFSNXWLf1",
  knownTruth1FormativeMemory: "recK6tBC6EbOsBh5r",
  knownTruth2Secret: "recAYK11M0E8ommqK",
  knownTruth3BaselineRelationshipStance: "recnEZOvX1dhagdkz",
  knownTruth4GreatestFear: "reca4YJ6JLhkSGI9q",
  knownTruth5InnerAttitude: "rec1rxEXErbCEofhK",
  memoryAssumptionLine: "recF8rTlRLwECCZFh",
  memoryCliveIntervention: "recHlOsDin7RkS1Up",
  memoryRewriteRitual: "recDLKZDzdJ3hEolv",
} as const;

export const DOC_AGENT_BASE_ID = "appI5tpwsKNwjfrqR";
export const DOC_AGENT_TABLES = {
  narrativeArch: "tblnAjaDHX0yccXgv",
  personaConfig: "tblvW54c4dVFdu57n",
  personaMemories: "tbls55fI3YtBLNBNb",
  minions: "tblgDsH08xfozFleP",
} as const satisfies AgentBaseTables;

export const DOC_NARRATIVE_ARCH_TIER_FIELDS = {
  /** singleSelect: Pending | Approved-Canonical — the agent-write approval gate (Tier 1 + 2). */
  provenanceStatus: "flduGiK3cqdoN74VA",
  /** singleSelect: Tier 1 — Super Objective | Tier 2 — Known Truth. */
  tier: "fldaVL2mvSaaYE8pK",
  /** singleSelect: the fixed five Known Truth slots. */
  knownTruthSlot: "fldrmw8VkB0idsoSX",
  /** number (0dp): 5 = Super Objective, 4 = Known Truth; Persona Memories are 3 (on demand). */
  injectionPriority: "fldeTvKy7rsfjYEz9",
  /** auto-created inverse of Persona Memories → Known Truth link. */
  personaMemoriesLink: "fldDTdVG2GxixvW6a",
} as const;

export const DOC_PERSONA_MEMORIES_TIER_FIELDS = {
  /** multipleRecordLinks → Narrative Arch. Memory → Known Truth link (Tier 3 → Tier 2). */
  knownTruthLink: "fld8cm0Z2JKmPl4Kg",
} as const;

/** Seed record IDs for the Doc tier scaffold (Approved-Canonical 27 Jun 2026). */
export const DOC_TIER_SEED_RECORDS = {
  superObjective: "recrXhowUHQG2bUEo",
  knownTruth1FormativeMemory: "recjSiBULOVjt6usO",
  knownTruth2Secret: "recPSfNwon3i1Ockx",
  knownTruth3BaselineRelationshipStance: "recmp7wUF7tRNkBxS",
  knownTruth4GreatestFear: "recKCW7Oz1C2otcuh",
  knownTruth5InnerAttitude: "recA5qCNI8CJJRJK2",
  memoryActually: "recNSZnCEWrJG9s1M",
  memoryCliveNo: "recO8PJWhU4y8YE0V",
  memoryHumanFine: "rec1vB1NxNARCHupz",
  memoryFoundIt: "recgZKuvyBNuaQLG8",
} as const;

/** Doc Persona Config — Approved Operational v0.2 (27 Jun 2026). Canonical technical role spec. */
export const DOC_PERSONA_CONFIG = {
  operationalV02: "rec0KNMfpdSlPWQuf",
} as const;

export const CLIVE_MAN_AGENT_BASE_ID = "appZ71CSKBlhnb4hR";
export const CLIVE_MAN_AGENT_TABLES = {
  narrativeArch: "tblfFteVzoqJTyNkE",
  personaConfig: "tblQMlziNRMd53Yns",
  personaMemories: "tblS28UjKCCS1pI8t",
  minions: "tblqvGSnKOKReBX41",
} as const satisfies AgentBaseTables;

/** Clive's Man Persona Config — Approved Operational v0.2 (27 Jun 2026). Canonical technical role spec. */
export const CLIVE_MAN_PERSONA_CONFIG = {
  operationalV02: "rec6b8PB3HY3yv0Wq",
} as const;

/** Clive's Man spine record IDs — Approved-Canonical 27 Jun 2026 (legacy Narrative Arch schema; tier fields not yet on this base). */
export const CLIVE_MAN_LEGACY_SPINE_RECORDS = {
  superObjective: "rec3hPQ2xwvWmd5JC",
  knownTruth1FormativeMemory: "rec4FjN3r4cmp0KyN",
  knownTruth2Secret: "recn5rxBfxcCihK8D",
  knownTruth3BaselineRelationshipStance: "recfvCe3arVkIroha",
  knownTruth4GreatestFear: "recSQPTGY6s0gAfX0",
  knownTruth5InnerAttitude: "recSyxXYqlFQC79nT",
  memoryTea: "recCGM8TMH73TNwPv",
  memoryFootsteps: "recjIo6EnGZqZ2KEk",
} as const;

export const LAZLO_AGENT_BASE_ID = "appMHIxnwPMljiAQB";
export const LAZLO_AGENT_TABLES = {
  narrativeArch: "tblJcvP73HhrO3Gyf",
  personaConfig: "tblR0Fdc8FXzRwQ76",
  personaMemories: "tbliOr32bEi6ZytVF",
  minions: "tblOgliPGTR9PvJkY",
} as const satisfies AgentBaseTables;

export const LAZLO_NARRATIVE_ARCH_TIER_FIELDS = {
  /** singleSelect: Pending | Approved-Canonical — the agent-write approval gate (Tier 1 + 2). */
  provenanceStatus: "fldcJ2VPje38KTum3",
  /** singleSelect: Tier 1 — Super Objective | Tier 2 — Known Truth. */
  tier: "fldyqFtbVJyxPZz3Z",
  /** singleSelect: the fixed five Known Truth slots. */
  knownTruthSlot: "fld0yKsN1JZAeO431",
  /** number (0dp): 5 = Super Objective, 4 = Known Truth; Persona Memories are 3 (on demand). */
  injectionPriority: "fldCPUrH6okfbgfh5",
  /** auto-created inverse of Persona Memories → Known Truth link. */
  personaMemoriesLink: "fldoQDykyFRR3RvY5",
} as const;

export const LAZLO_PERSONA_MEMORIES_TIER_FIELDS = {
  /** multipleRecordLinks → Narrative Arch. Memory → Known Truth link (Tier 3 → Tier 2). */
  knownTruthLink: "fldt2hNFjYUwD07dQ",
} as const;

/** Seed record IDs for the Lazlo tier scaffold (all Provenance Status = Pending). */
export const LAZLO_TIER_SEED_RECORDS = {
  superObjective: "recwsVH8T8rmyWHR3",
  knownTruth1FormativeMemory: "recvUHuhYDer9RB5v",
  knownTruth2Secret: "recg8JRKfhfhqm1i7",
  knownTruth3BaselineRelationshipStance: "recqtOrXLQ499ZQ5Z",
  knownTruth4GreatestFear: "recRqtv2C8L17XRP3",
  knownTruth5InnerAttitude: "recNIJYiQgkQAxXgE",
} as const;

/** Lazlo Marlowe Persona Config — Approved Operational v0.2 (27 Jun 2026). Canonical technical role spec. */
export const LAZLO_PERSONA_CONFIG = {
  operationalV02: "recHipJdrgeh0PAof",
} as const;

export const CHAPTER1_AGENT_BASES = {
  clive: { baseId: CLIVE_AGENT_BASE_ID, tables: CLIVE_AGENT_TABLES },
  pam: { baseId: PAM_AGENT_BASE_ID, tables: PAM_AGENT_TABLES },
  doc: { baseId: DOC_AGENT_BASE_ID, tables: DOC_AGENT_TABLES },
  "clive-man": { baseId: CLIVE_MAN_AGENT_BASE_ID, tables: CLIVE_MAN_AGENT_TABLES },
  "lazlo-marlowe": { baseId: LAZLO_AGENT_BASE_ID, tables: LAZLO_AGENT_TABLES },
} as const;

export type Chapter1AgentSlug = keyof typeof CHAPTER1_AGENT_BASES;

export const CHAPTER1_BRAIN_SLUG = "astrajax-chapter-1";
