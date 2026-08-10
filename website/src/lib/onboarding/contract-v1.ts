/**
 * Ruth Hadley's Context-First Onboarding fixture contract — V1.1.0.
 *
 * schemaVersion: 1.1.0 (supersedes V1.0.0). This is the UI-side mirror of Ruth's frozen schema
 * (context-onboarding-fixture-v1.0.0.schema.json). The UI consumes the
 * contract; it does NOT bake Airtable table/field IDs into presentation
 * components — the adapter seam lives in the data layer, and these types
 * carry the contract's logical shape only.
 *
 * Breaking-change discipline: renames, enum changes, required fields or
 * semantic changes require a version bump (1.1.0 / 2.0.0) and a
 * compatibility note BACK TO RUTH as a versioned amendment — never a
 * silent divergence. Backward-compatible additions are optional fields only.
 */

export const ONBOARDING_CONTRACT_VERSION = "1.1.0" as const;

/* ── Case ── */
export type CaseStatus = "draft" | "evidence_gathering" | "confirmation" | "workshop_draft_ready" | "held";
export type RouteKind = "bring_material" | "talk_it_through";

export type QuestionProgress = {
  answered: number; // 0..16
  softTarget: 12;
  hardCap: 16;
  canStopEarly: boolean;
  stopReason?: string | null;
};

export type OnboardingCase = {
  caseId: string;
  status: CaseStatus;
  businessDisplayName: string;
  initialRoute: RouteKind;
  currentRoute: RouteKind;
  outputContractVersion: typeof ONBOARDING_CONTRACT_VERSION;
  questionProgress: QuestionProgress;
};

/* ── Source Pack ── */
export type SourcePackLimits = {
  maxFiles: 5;
  maxBytesTotal: 52428800;
  maxBytesPerFile: 20971520;
  maxPagesTotal: 250;
  maxTabularRowsTotal: 25000;
  maxWorksheetsTotal: 20;
  maxColumnsPerSheet: 75;
};

export type MediaType =
  | "application/pdf"
  | "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  | "text/plain"
  | "text/markdown"
  | "text/csv"
  | "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  | "application/vnd.openxmlformats-officedocument.presentationml.presentation";

export type FileFamily = "narrative_document" | "tabular_export" | "presentation";
/** Source Object lifecycle status (V1.1.0 — distinct from version processing). */
export type ObjectStatus = "received" | "validating" | "ready" | "held" | "superseded";
/** Source Version processing status (V1.1.0 — "queued" reserved for Extraction Runs). */
export type VersionProcessingStatus = "profiled" | "ready_for_ai" | "extracting" | "extracted" | "validated" | "held" | "failed";

export type SourceObject = {
  sourceId: string;
  objectVersion: number;
  sha256: string;
  filename: string;
  mediaType: MediaType;
  fileFamily: FileFamily;
  sizeBytes: number;
  ownershipBoundary: "matthew_owned" | "already_shared_with_matthew";
  /** Object lifecycle (ready/validating/held/superseded/received). */
  objectStatus: ObjectStatus;
  /** This version's processing status (profiled → ready_for_ai → extracting → extracted → validated). */
  versionProcessingStatus: VersionProcessingStatus;
  profile: { profileVersion: string; deterministic: true; census: Record<string, unknown> };
};

export type SourcePack = {
  packId: string;
  version: number;
  limits: SourcePackLimits;
  sources: SourceObject[]; // max 5
};

/* ── Route Sessions (append-only) ── */
export type RouteSession = {
  routeSessionId: string;
  route: RouteKind;
  sequence: number;
  startedAt: string;
  endedAt?: string | null;
  status: "active" | "completed" | "switched";
  switchReason?: string | null;
};

/* ── Evidence (discriminated union on evidenceClass) ── */
export type Locator = {
  kind:
    | "pdf_page_quote"
    | "docx_heading_paragraph"
    | "text_line_range"
    | "csv_row_cells"
    | "xlsx_sheet_row_cells"
    | "pptx_slide_shape";
  label: string;
  payload: Record<string, unknown>;
  usable: true;
};

export type ValidationStatus = "pending" | "valid" | "invalid" | "held";

export type ImportedEvidence = {
  evidenceId: string;
  evidenceClass: "imported_document";
  exactText: string;
  sourceId: string;
  sourceObjectVersion: number;
  sourceSha256: string;
  processingRunId: string;
  locator: Locator;
  validationStatus: ValidationStatus;
};

export type SelfReportedEvidence = {
  evidenceId: string;
  evidenceClass: "self_reported";
  exactText: string;
  turnId: string;
  questionText: string;
  responseText: string;
  validationStatus: ValidationStatus;
};

export type Evidence = ImportedEvidence | SelfReportedEvidence;

/* ── Assertions ── */
/**
 * The support role of one evidence edge (V1.1.0) — Direct / Corroborating /
 * Contradicting, carried THROUGH confirmation. Capitalised per Ruth's schema.
 * Production NEVER silently defaults a role; synthetic fixtures may default
 * Direct only with a MIG-ROLE-DEFAULTED warning.
 */
export type SupportRole = "Direct" | "Corroborating" | "Contradicting";

export type EvidenceSupport = {
  evidenceId: string;
  supportRole: SupportRole;
};

export type Assertion = {
  assertionId: string;
  atomicText: string;
  subject?: string | null;
  predicate?: string | null;
  object?: string | number | boolean | null;
  evidence: EvidenceSupport[]; // min 1, unique — V1.1.0 edge shape
  validationStatus: ValidationStatus;
};

/* ── Inferences (versioned) ── */
export type AttributeType = "provisional_role" | "sector" | "observed_collaborator" | "brain_theme" | "competency";
export type InferenceStatus = "proposed" | "superseded" | "withdrawn" | "confirmed" | "corrected" | "left_open" | "rejected";

export type Inference = {
  inferenceId: string;
  inferenceFamilyId: string;
  version: number;
  supersedesInferenceId?: string | null;
  attributeType: AttributeType;
  value: { display: string; code?: string | null; metadata?: Record<string, unknown> };
  /** V1.1.0 evidence edges — { evidenceId, supportRole }, role carried through confirmation. */
  evidence: EvidenceSupport[];
  evidenceClasses: ("imported_document" | "self_reported")[];
  confidence: number; // 0..1
  uncertainty: string;
  status: InferenceStatus;
};

/**
 * ADAPTER: read an inference's evidence edges. V1.1.0 made the edge shape
 * required, so this simply returns inference.evidence — the helper remains
 * the single read point so presentation never reaches into the fixture
 * directly (adapter seam held). Roles are Direct/Corroborating/Contradicting;
 * production never silently defaults them (MIG-ROLE-DEFAULTED warning only
 * for synthetic fixtures).
 */
export function evidenceEdgesFor(inference: Inference): EvidenceSupport[] {
  return inference.evidence;
}

/* ── Confirmation Events (exact-version targets) ── */
export type ConfirmationDecision = "confirm" | "correct" | "leave_open";

export type ConfirmationEvent = {
  confirmationEventId: string;
  targetInferenceId: string;
  targetInferenceVersion: number;
  decision: ConfirmationDecision;
  presentedValue: string;
  selectedValue?: string | null;
  correctionEvidenceId?: string | null;
  resultingInferenceId?: string | null;
  decidedAt: string;
  actor: string;
};

/* ── Workshop Draft (accepted items only, Workshop-only) ── */
export type WorkshopItem = {
  workshopItemId: string;
  attributeType: AttributeType;
  value: string;
  /** Declared Inference Family lookup (V1.1.0 correction) — the family the accepted value belongs to. */
  inferenceFamilyId: string;
  sourceInferenceId: string;
  confirmationEventId: string;
  evidenceIds: string[];
  status: "accepted_for_workshop";
};

export type WorkshopDraft = {
  status: "not_ready" | "ready" | "accepted_for_workshop";
  items: WorkshopItem[];
};

/* ── The fixture ── */
export type OnboardingFixture = {
  schemaVersion: typeof ONBOARDING_CONTRACT_VERSION;
  fixtureId: string;
  generatedAt: string;
  case: OnboardingCase;
  sourcePack: SourcePack;
  routeSessions: RouteSession[];
  evidence: Evidence[];
  assertions: Assertion[];
  inferences: Inference[];
  confirmationEvents: ConfirmationEvent[];
  workshopDraft: WorkshopDraft;
  validation: {
    contractValid: boolean;
    validatorVersion: string;
    findings: { code: string; severity: "info" | "warning" | "error" | "kill"; objectId: string; message: string }[];
  };
};
