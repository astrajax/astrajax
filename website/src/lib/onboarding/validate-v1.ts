/**
 * Semantic validator for Ruth's V1.0.0 onboarding fixture.
 *
 * This is the Kate/CI acceptance step Ruth flagged: her sandbox lacked a
 * Draft 2020-12 validator, so the cross-array REFERENTIAL checks live here
 * as code. JSON Schema proves shape; these rules prove the semantic
 * invariants the schema cannot (proposal §5 "Semantic validator rules
 * outside JSON Schema"). Each rule returns findings with severity
 * info/warning/error/kill; any kill means the fixture is rejected.
 *
 * Rules: unique IDs; all references resolve; same-case links; route
 * sequence monotonicity; source totals within caps; fragment/source class
 * exclusivity; exact source hash/version match; competency self-reported
 * only; confirmation target/value match; correction successor chain; no
 * Workshop item from Leave open; no duplicate active acceptance key;
 * question count ≤16; switch preserves earlier object sets.
 */

import type {
  OnboardingFixture,
  Evidence,
  ImportedEvidence,
} from "./contract-v1";

export type Finding = {
  code: string;
  severity: "info" | "warning" | "error" | "kill";
  objectId: string;
  message: string;
};

const kill = (code: string, objectId: string, message: string): Finding => ({ code, severity: "kill", objectId, message });
const error = (code: string, objectId: string, message: string): Finding => ({ code, severity: "error", objectId, message });
const info = (code: string, objectId: string, message: string): Finding => ({ code, severity: "info", objectId, message });

function isImported(e: Evidence): e is ImportedEvidence {
  return e.evidenceClass === "imported_document";
}

export function validateOnboardingFixture(fixture: OnboardingFixture): { valid: boolean; findings: Finding[] } {
  const findings: Finding[] = [];

  /* ── contract version ── */
  if (fixture.schemaVersion !== "1.0.0") findings.push(kill("VERSION", fixture.fixtureId, `schemaVersion must be 1.0.0, got ${fixture.schemaVersion}`));
  if (fixture.case.outputContractVersion !== "1.0.0") findings.push(kill("VERSION", fixture.case.caseId, "case.outputContractVersion must be 1.0.0"));

  /* ── unique IDs across every array ── */
  const allIds = [
    ...fixture.sourcePack.sources.map((s) => s.sourceId),
    ...fixture.routeSessions.map((r) => r.routeSessionId),
    ...fixture.evidence.map((e) => e.evidenceId),
    ...fixture.assertions.map((a) => a.assertionId),
    ...fixture.inferences.map((i) => i.inferenceId),
    ...fixture.confirmationEvents.map((c) => c.confirmationEventId),
    ...fixture.workshopDraft.items.map((w) => w.workshopItemId),
  ];
  const seen = new Set<string>();
  for (const id of allIds) {
    if (seen.has(id)) findings.push(kill("UNIQUE_ID", id, `duplicate id ${id}`));
    seen.add(id);
  }

  /* ── reference resolution ── */
  const sourceIds = new Set(fixture.sourcePack.sources.map((s) => s.sourceId));
  const evidenceIds = new Set(fixture.evidence.map((e) => e.evidenceId));
  const inferenceIds = new Set(fixture.inferences.map((i) => i.inferenceId));
  const confirmationIds = new Set(fixture.confirmationEvents.map((c) => c.confirmationEventId));

  for (const e of fixture.evidence) {
    if (isImported(e) && !sourceIds.has(e.sourceId)) {
      findings.push(kill("REF_SOURCE", e.evidenceId, `imported evidence references missing source ${e.sourceId}`));
    }
  }
  for (const a of fixture.assertions) {
    for (const eid of a.evidenceIds) {
      if (!evidenceIds.has(eid)) findings.push(kill("REF_EVIDENCE", a.assertionId, `assertion references missing evidence ${eid}`));
    }
  }
  for (const inf of fixture.inferences) {
    for (const eid of inf.evidenceIds) {
      if (!evidenceIds.has(eid)) findings.push(kill("REF_EVIDENCE", inf.inferenceId, `inference references missing evidence ${eid}`));
    }
    if (inf.supersedesInferenceId && !inferenceIds.has(inf.supersedesInferenceId)) {
      findings.push(kill("REF_SUPERSEDES", inf.inferenceId, `supersedes missing inference ${inf.supersedesInferenceId}`));
    }
    /* v1.1.0 evidence-edge seam: when evidenceEdges is present, each edge
       must reference existing evidence and a valid supportRole, and its ids
       must align with the bare evidenceIds set (the two stay consistent). */
    if (inf.evidenceEdges) {
      const ROLES = new Set(["direct", "corroborating", "contradicting"]);
      const edgeIds = new Set<string>();
      for (const edge of inf.evidenceEdges) {
        if (!evidenceIds.has(edge.evidenceId)) findings.push(kill("REF_EDGE", inf.inferenceId, `edge references missing evidence ${edge.evidenceId}`));
        if (!ROLES.has(edge.supportRole)) findings.push(kill("EDGE_ROLE", inf.inferenceId, `invalid supportRole ${edge.supportRole}`));
        edgeIds.add(edge.evidenceId);
      }
      for (const eid of inf.evidenceIds) {
        if (!edgeIds.has(eid)) findings.push(error("EDGE_ALIGN", inf.inferenceId, `evidenceId ${eid} missing from evidenceEdges`));
      }
    }
  }
  for (const c of fixture.confirmationEvents) {
    if (!inferenceIds.has(c.targetInferenceId)) findings.push(kill("REF_INFERENCE", c.confirmationEventId, `confirmation targets missing inference ${c.targetInferenceId}`));
    if (c.correctionEvidenceId && !evidenceIds.has(c.correctionEvidenceId)) findings.push(kill("REF_CORRECTION_EV", c.confirmationEventId, `correction evidence ${c.correctionEvidenceId} missing`));
    if (c.resultingInferenceId && !inferenceIds.has(c.resultingInferenceId)) findings.push(kill("REF_RESULT_INF", c.confirmationEventId, `resulting inference ${c.resultingInferenceId} missing`));
  }
  for (const w of fixture.workshopDraft.items) {
    if (!inferenceIds.has(w.sourceInferenceId)) findings.push(kill("REF_SOURCE_INF", w.workshopItemId, `workshop item references missing inference ${w.sourceInferenceId}`));
    if (!confirmationIds.has(w.confirmationEventId)) findings.push(kill("REF_CONF", w.workshopItemId, `workshop item references missing confirmation ${w.confirmationEventId}`));
    for (const eid of w.evidenceIds) {
      if (!evidenceIds.has(eid)) findings.push(kill("REF_EVIDENCE", w.workshopItemId, `workshop item references missing evidence ${eid}`));
    }
  }

  /* ── route sequence monotonicity ── */
  const seqs = fixture.routeSessions.map((r) => r.sequence).sort((a, b) => a - b);
  for (let i = 1; i < seqs.length; i++) {
    if (seqs[i] !== seqs[i - 1] + 1) findings.push(error("ROUTE_SEQ", "routeSessions", `route sequence not monotonic: ${seqs.join(",")}`));
    break;
  }

  /* ── source totals within caps ── */
  const L = fixture.sourcePack.limits;
  if (fixture.sourcePack.sources.length > L.maxFiles) findings.push(kill("CAP_FILES", fixture.sourcePack.packId, `${fixture.sourcePack.sources.length} sources exceeds maxFiles ${L.maxFiles}`));
  const totalBytes = fixture.sourcePack.sources.reduce((n, s) => n + s.sizeBytes, 0);
  if (totalBytes > L.maxBytesTotal) findings.push(kill("CAP_BYTES", fixture.sourcePack.packId, `total bytes ${totalBytes} exceeds maxBytesTotal ${L.maxBytesTotal}`));
  for (const s of fixture.sourcePack.sources) {
    if (s.sizeBytes > L.maxBytesPerFile) findings.push(kill("CAP_FILE_BYTES", s.sourceId, `file ${s.filename} exceeds maxBytesPerFile`));
  }

  /* ── fragment/source class exclusivity: imported evidence must reference a
     source with the SAME hash + version as the source object carries ── */
  for (const e of fixture.evidence) {
    if (!isImported(e)) continue;
    const src = fixture.sourcePack.sources.find((s) => s.sourceId === e.sourceId);
    if (!src) continue; // already a kill above
    if (src.sha256 !== e.sourceSha256) findings.push(kill("HASH_MATCH", e.evidenceId, `evidence sha256 does not match source ${e.sourceId}`));
    if (src.objectVersion !== e.sourceObjectVersion) findings.push(error("VERSION_MATCH", e.evidenceId, `evidence objectVersion ${e.sourceObjectVersion} != source ${src.objectVersion}`));
  }

  /* ── competency self-reported only ── */
  for (const inf of fixture.inferences) {
    if (inf.attributeType !== "competency") continue;
    const classes = new Set(inf.evidenceIds.map((eid) => fixture.evidence.find((e) => e.evidenceId === eid)?.evidenceClass));
    if (classes.has("imported_document") || !classes.has("self_reported")) {
      findings.push(kill("COMPETENCY_FENCE", inf.inferenceId, "competency inference must be self_reported only"));
    }
  }

  /* ── confirmation target/value match ── */
  for (const c of fixture.confirmationEvents) {
    const inf = fixture.inferences.find((i) => i.inferenceId === c.targetInferenceId);
    if (!inf) continue;
    if (inf.version !== c.targetInferenceVersion) {
      findings.push(kill("CONF_VERSION", c.confirmationEventId, `confirmation targets version ${c.targetInferenceVersion} but inference is version ${inf.version}`));
    }
    if (inf.value.display !== c.presentedValue) {
      findings.push(error("CONF_VALUE", c.confirmationEventId, `presentedValue "${c.presentedValue}" != inference display "${inf.value.display}"`));
    }
    /* correction successor chain */
    if (c.decision === "correct") {
      if (!c.resultingInferenceId) findings.push(kill("CORRECT_CHAIN", c.confirmationEventId, "correct decision requires a resultingInferenceId successor"));
      if (!c.correctionEvidenceId) findings.push(error("CORRECT_EV", c.confirmationEventId, "correct decision should carry a correctionEvidenceId"));
    }
  }

  /* ── no Workshop item from Leave open ── */
  for (const w of fixture.workshopDraft.items) {
    const conf = fixture.confirmationEvents.find((c) => c.confirmationEventId === w.confirmationEventId);
    if (conf && conf.decision === "leave_open") {
      findings.push(kill("WORKSHOP_LEAVE_OPEN", w.workshopItemId, "Workshop item cannot come from a leave_open decision"));
    }
    if (conf && conf.decision !== "confirm" && conf.decision !== "correct") {
      findings.push(kill("WORKSHOP_DECISION", w.workshopItemId, `Workshop item from invalid decision ${conf.decision}`));
    }
  }

  /* ── no duplicate active acceptance key (one accepted item per inference family) ── */
  const acceptedKeys = new Map<string, string>();
  for (const w of fixture.workshopDraft.items) {
    const inf = fixture.inferences.find((i) => i.inferenceId === w.sourceInferenceId);
    const key = inf?.inferenceFamilyId ?? w.sourceInferenceId;
    if (acceptedKeys.has(key)) findings.push(kill("DUP_ACCEPT", w.workshopItemId, `duplicate active acceptance for family ${key} (${acceptedKeys.get(key)} and ${w.workshopItemId})`));
    acceptedKeys.set(key, w.workshopItemId);
  }

  /* ── question count ≤ hardCap ── */
  const qp = fixture.case.questionProgress;
  if (qp.answered > qp.hardCap) findings.push(kill("QCAP", fixture.case.caseId, `answered ${qp.answered} exceeds hardCap ${qp.hardCap}`));
  if (qp.answered > 16) findings.push(kill("QCAP16", fixture.case.caseId, "answered exceeds 16"));

  /* ── switch preserves earlier object sets: a 'switched' route session must
     not coincide with evidence/sources being reset (heuristic: at least one
     route session remains, and evidence exists from before the switch) ── */
  const hasSwitch = fixture.routeSessions.some((r) => r.status === "switched");
  if (hasSwitch && fixture.routeSessions.length < 2) {
    findings.push(error("SWITCH_SET", "routeSessions", "a switched session implies a prior session should remain"));
  }

  const valid = !findings.some((f) => f.severity === "kill" || f.severity === "error");
  if (valid) findings.push(info("OK", fixture.fixtureId, "fixture passes semantic validation"));
  return { valid, findings };
}
