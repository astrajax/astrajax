/**
 * The V1.0.0 onboarding fixture — Ruth's worked example as the canonical
 * data the UI renders. This REPLACES the v0.1 fixture contract. The
 * accessor validates the fixture against the semantic validator before
 * returning it (Ruth's Kate/CI acceptance step); an invalid fixture throws
 * in development and surfaces in CI.
 *
 * ADAPTER SEAM: this module is the ONLY place the UI touches the contract.
 * Presentation components consume the typed fixture; no Airtable table or
 * field IDs are baked into any component. When Ruth's live data layer
 * serves real fixtures, getOnboardingFixtureV1() maps her response onto
 * OnboardingFixture and this worked example is removed.
 */

import type { OnboardingFixture } from "./contract-v1";
import { validateOnboardingFixture } from "./validate-v1";

export const ONBOARDING_FIXTURE_V1: OnboardingFixture = {
  schemaVersion: "1.0.0",
  fixtureId: "fx_fictional_business_route_a",
  generatedAt: "2026-08-06T06:05:00+01:00",
  case: {
    caseId: "case_fictional_001",
    status: "confirmation",
    businessDisplayName: "Northstar Field Services",
    initialRoute: "bring_material",
    currentRoute: "bring_material",
    outputContractVersion: "1.0.0",
    questionProgress: { answered: 3, softTarget: 12, hardCap: 16, canStopEarly: false, stopReason: null },
  },
  sourcePack: {
    packId: "pack_fictional_001",
    version: 1,
    limits: {
      maxFiles: 5,
      maxBytesTotal: 52428800,
      maxBytesPerFile: 20971520,
      maxPagesTotal: 250,
      maxTabularRowsTotal: 25000,
      maxWorksheetsTotal: 20,
      maxColumnsPerSheet: 75,
    },
    sources: [
      {
        sourceId: "src_roles_docx",
        objectVersion: 1,
        sha256: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
        filename: "team-roles.docx",
        mediaType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        fileFamily: "narrative_document",
        sizeBytes: 84213,
        ownershipBoundary: "matthew_owned",
        processingStatus: "validated",
        profile: { profileVersion: "1.0.0", deterministic: true, census: { paragraphCount: 42, headingCount: 6, tableCount: 1 } },
      },
    ],
  },
  routeSessions: [
    { routeSessionId: "route_a_001", route: "bring_material", sequence: 1, startedAt: "2026-08-06T05:40:00+01:00", endedAt: null, status: "active", switchReason: null },
  ],
  evidence: [
    {
      evidenceId: "ev_role_doc",
      evidenceClass: "imported_document",
      exactText: "The Operations Lead owns weekly staffing decisions and resolves field exceptions.",
      sourceId: "src_roles_docx",
      sourceObjectVersion: 1,
      sourceSha256: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
      processingRunId: "run_gsd_001",
      locator: { kind: "docx_heading_paragraph", label: "Responsibilities > Operations Lead, paragraph 3", payload: { headingPath: ["Responsibilities", "Operations Lead"], paragraphIndex: 3 }, usable: true },
      validationStatus: "valid",
    },
    {
      evidenceId: "ev_competency_answer",
      evidenceClass: "self_reported",
      exactText: "I am confident with team planning but still learning workflow automation.",
      turnId: "turn_003",
      questionText: "Which parts of this work do you feel confident doing yourself, and where do you still want support?",
      responseText: "I am confident with team planning but still learning workflow automation.",
      validationStatus: "valid",
    },
  ],
  assertions: [
    { assertionId: "as_role_owner", atomicText: "The Operations Lead owns weekly staffing decisions.", subject: "Operations Lead", predicate: "owns", object: "weekly staffing decisions", evidenceIds: ["ev_role_doc"], validationStatus: "valid" },
  ],
  inferences: [
    {
      inferenceId: "inf_role_v1",
      inferenceFamilyId: "inffam_role",
      version: 1,
      supersedesInferenceId: null,
      attributeType: "provisional_role",
      value: { display: "Operations Lead", code: null, metadata: {} },
      evidenceIds: ["ev_role_doc"],
      evidenceClasses: ["imported_document"],
      confidence: 0.87,
      uncertainty: "The document names accountability but does not confirm the respondent currently holds the role.",
      status: "proposed",
    },
    {
      inferenceId: "inf_competency_v1",
      inferenceFamilyId: "inffam_competency",
      version: 1,
      supersedesInferenceId: null,
      attributeType: "competency",
      value: { display: "Confident in team planning; developing workflow automation", code: null, metadata: {} },
      evidenceIds: ["ev_competency_answer"],
      evidenceClasses: ["self_reported"],
      confidence: 1.0,
      uncertainty: "Self-reported competency is not independently assessed.",
      status: "proposed",
    },
  ],
  confirmationEvents: [],
  workshopDraft: { status: "not_ready", items: [] },
  validation: { contractValid: true, validatorVersion: "1.0.0", findings: [] },
};

/**
 * The V1.0.0 wiring seam. Validates the fixture (Ruth's Kate/CI acceptance
 * step) then returns it. Throws if the fixture fails semantic validation —
 * an invalid contract must never reach the UI silently.
 */
export function getOnboardingFixtureV1(): OnboardingFixture {
  const { valid, findings } = validateOnboardingFixture(ONBOARDING_FIXTURE_V1);
  if (!valid) {
    const kills = findings.filter((f) => f.severity === "kill" || f.severity === "error");
    throw new Error(`Onboarding fixture V1.0.0 failed semantic validation: ${kills.map((k) => `${k.code}(${k.objectId})`).join(", ")}`);
  }
  return ONBOARDING_FIXTURE_V1;
}
