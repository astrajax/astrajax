/**
 * @vitest-environment jsdom
 *
 * The V1.0.0 semantic validator — Ruth's Kate/CI acceptance step. Proves
 * the worked fixture passes and each referential rule fires on a broken
 * fixture. Draft 2020-12 shape is Ruth's schema; these are the cross-array
 * semantic checks the schema cannot express.
 */
import { describe, expect, it } from "vitest";
import { validateOnboardingFixture } from "./validate-v1";
import { ONBOARDING_FIXTURE_V1 } from "./fixture-v1";
import type { ImportedEvidence, OnboardingFixture, SourceObject } from "./contract-v1";

const base: OnboardingFixture = JSON.parse(JSON.stringify(ONBOARDING_FIXTURE_V1));

function mutate(fn: (f: OnboardingFixture) => void): OnboardingFixture {
  const f = JSON.parse(JSON.stringify(base));
  fn(f);
  return f;
}

describe("V1.0.0 fixture — Ruth's worked example", () => {
  it("passes semantic validation", () => {
    const { valid, findings } = validateOnboardingFixture(ONBOARDING_FIXTURE_V1);
    expect(valid).toBe(true);
    expect(findings.some((f) => f.severity === "kill" || f.severity === "error")).toBe(false);
  });

  it("has schemaVersion + outputContractVersion 1.0.0", () => {
    expect(ONBOARDING_FIXTURE_V1.schemaVersion).toBe("1.1.0");
    expect(ONBOARDING_FIXTURE_V1.case.outputContractVersion).toBe("1.1.0");
  });
});

describe("V1.0.0 semantic validator — rules fire", () => {
  it("rejects a wrong schemaVersion (0.9 AND the superseded 1.0.0)", () => {
    const f = mutate((x) => { x.schemaVersion = "0.9" as never; });
    expect(validateOnboardingFixture(f).findings.some((k) => k.code === "VERSION" && k.severity === "kill")).toBe(true);
    const old = mutate((x) => { x.schemaVersion = "1.0.0" as never; });
    expect(validateOnboardingFixture(old).findings.some((k) => k.code === "VERSION" && k.severity === "kill")).toBe(true);
  });

  it("catches duplicate IDs", () => {
    const f = mutate((x) => { x.evidence[1].evidenceId = x.evidence[0].evidenceId; });
    expect(validateOnboardingFixture(f).findings.some((k) => k.code === "UNIQUE_ID")).toBe(true);
  });

  it("catches an unresolved evidence source reference", () => {
    const f = mutate((x) => {
      (x.evidence[0] as ImportedEvidence).sourceId = "src_missing";
    });
    expect(validateOnboardingFixture(f).findings.some((k) => k.code === "REF_SOURCE")).toBe(true);
  });

  it("catches a hash mismatch between evidence and source", () => {
    const f = mutate((x) => {
      (x.evidence[0] as ImportedEvidence).sourceSha256 =
        "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb";
    });
    expect(validateOnboardingFixture(f).findings.some((k) => k.code === "HASH_MATCH")).toBe(true);
  });

  it("enforces the competency self-reported-only fence", () => {
    const f = mutate((x) => {
      x.inferences[1].evidence = [{ evidenceId: "ev_role_doc", supportRole: "Direct" }]; // imported
      x.inferences[1].evidenceClasses = ["imported_document"];
    });
    expect(validateOnboardingFixture(f).findings.some((k) => k.code === "COMPETENCY_FENCE")).toBe(true);
  });

  it("catches a confirmation targeting the wrong inference version", () => {
    const f = mutate((x) => {
      x.confirmationEvents.push({
        confirmationEventId: "conf_bad",
        targetInferenceId: "inf_role_v1",
        targetInferenceVersion: 99,
        decision: "confirm",
        presentedValue: "Operations Lead",
        decidedAt: "2026-08-06T06:10:00+01:00",
        actor: "Matthew",
      });
    });
    expect(validateOnboardingFixture(f).findings.some((k) => k.code === "CONF_VERSION")).toBe(true);
  });

  it("rejects a Workshop item built from a leave_open decision", () => {
    const f = mutate((x) => {
      x.confirmationEvents.push({
        confirmationEventId: "conf_lo",
        targetInferenceId: "inf_role_v1",
        targetInferenceVersion: 1,
        decision: "leave_open",
        presentedValue: "Operations Lead",
        decidedAt: "2026-08-06T06:10:00+01:00",
        actor: "Matthew",
      });
      x.workshopDraft.items.push({
        workshopItemId: "wd_bad",
        attributeType: "provisional_role",
        value: "Operations Lead",
        inferenceFamilyId: "inffam_role",
        sourceInferenceId: "inf_role_v1",
        confirmationEventId: "conf_lo",
        evidenceIds: ["ev_role_doc"],
        status: "accepted_for_workshop",
      });
    });
    expect(validateOnboardingFixture(f).findings.some((k) => k.code === "WORKSHOP_LEAVE_OPEN")).toBe(true);
  });

  it("enforces the question hard cap of 16", () => {
    const f = mutate((x) => { x.case.questionProgress.answered = 17; });
    expect(validateOnboardingFixture(f).findings.some((k) => k.code === "QCAP" || k.code === "QCAP16")).toBe(true);
  });

  it("enforces the Source Pack file cap of 5", () => {
    const f = mutate((x) => {
      for (let i = 0; i < 5; i++) {
        x.sourcePack.sources.push({ ...x.sourcePack.sources[0], sourceId: `src_extra_${i}` });
      }
    });
    expect(validateOnboardingFixture(f).findings.some((k) => k.code === "CAP_FILES")).toBe(true);
  });

  it("V1.1.0 requires the evidence edge on every inference", () => {
    const f = mutate((x) => { x.inferences[0].evidence = []; });
    expect(validateOnboardingFixture(f).findings.some((k) => k.code === "EDGE_REQUIRED")).toBe(true);
  });

  it("V1.1.0 edge roles are capitalised Direct/Corroborating/Contradicting", () => {
    const good = mutate((x) => {
      x.inferences[0].evidence = [{ evidenceId: "ev_role_doc", supportRole: "Corroborating" }];
    });
    expect(validateOnboardingFixture(good).valid).toBe(true);
    const bad = mutate((x) => {
      x.inferences[0].evidence = [{ evidenceId: "ev_role_doc", supportRole: "direct" as never }]; // lowercase rejected
    });
    expect(validateOnboardingFixture(bad).findings.some((k) => k.code === "EDGE_ROLE")).toBe(true);
    const sideways = mutate((x) => {
      x.inferences[0].evidence = [{ evidenceId: "ev_role_doc", supportRole: "sideways" as never }];
    });
    expect(validateOnboardingFixture(sideways).findings.some((k) => k.code === "EDGE_ROLE")).toBe(true);
  });

  it("V1.1.0 edge references must resolve", () => {
    const f = mutate((x) => {
      x.inferences[0].evidence = [{ evidenceId: "ev_missing", supportRole: "Direct" }];
    });
    expect(validateOnboardingFixture(f).findings.some((k) => k.code === "REF_EDGE")).toBe(true);
  });

  it("V1.1.0 workshop items require a declared inferenceFamilyId that resolves", () => {
    const missing = mutate((x) => {
      x.workshopDraft.items.push({
        workshopItemId: "wd_1", attributeType: "provisional_role", value: "Operations Lead",
        sourceInferenceId: "inf_role_v1", confirmationEventId: "conf_x", evidenceIds: ["ev_role_doc"], status: "accepted_for_workshop",
      } as never);
      x.confirmationEvents.push({
        confirmationEventId: "conf_x", targetInferenceId: "inf_role_v1", targetInferenceVersion: 1,
        decision: "confirm", presentedValue: "Operations Lead", decidedAt: "2026-08-06T06:10:00+01:00", actor: "Matthew",
      });
    });
    expect(validateOnboardingFixture(missing).findings.some((k) => k.code === "FAMILY_REQUIRED")).toBe(true);
  });

  it("V1.1.0 source statuses: objectStatus and versionProcessingStatus are distinct and queued is barred", () => {
    const badObj = mutate((x) => {
      (x.sourcePack.sources[0] as SourceObject).objectStatus = "extracted" as SourceObject["objectStatus"];
    });
    expect(validateOnboardingFixture(badObj).findings.some((k) => k.code === "OBJECT_STATUS")).toBe(true);
    const queued = mutate((x) => {
      (x.sourcePack.sources[0] as SourceObject).versionProcessingStatus =
        "queued" as SourceObject["versionProcessingStatus"];
    });
    expect(validateOnboardingFixture(queued).findings.some((k) => k.code === "VERSION_QUEUED")).toBe(true);
    const good = mutate((x) => {
      x.sourcePack.sources[0].versionProcessingStatus = "ready_for_ai";
    });
    expect(validateOnboardingFixture(good).valid).toBe(true);
  });
});
