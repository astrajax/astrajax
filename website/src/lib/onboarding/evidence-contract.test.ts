/**
 * @vitest-environment jsdom
 *
 * The fixture contract v0.1 — guarantees the UI depends on, and the seam
 * Ruth's verified contract must satisfy.
 */
import { describe, expect, it } from "vitest";
import {
  getOnboardingEvidence,
  ONBOARDING_FIXTURE_VERSION,
  type OnboardingEvidence,
} from "./evidence-contract";

describe("onboarding evidence fixture contract v0.1", () => {
  const ev: OnboardingEvidence = getOnboardingEvidence();

  it("is versioned and labelled 0.1", () => {
    expect(ev.version).toBe(ONBOARDING_FIXTURE_VERSION);
    expect(ev.version).toBe("0.1");
  });

  it("exposes the single accessor seam (getOnboardingEvidence)", () => {
    expect(typeof getOnboardingEvidence).toBe("function");
    expect(ev).toBeTruthy();
  });

  it("evidence_class is only imported_document | self_reported", () => {
    for (const item of ev.evidence) {
      expect(["imported_document", "self_reported"]).toContain(item.evidence_class);
    }
  });

  it("every evidence item keeps supporting locators visible", () => {
    for (const item of ev.evidence) {
      expect(item.locators.length).toBeGreaterThan(0);
      for (const loc of item.locators) {
        expect(loc.label.trim().length).toBeGreaterThan(0);
      }
    }
  });

  it("self_reported items carry exact question + turn provenance", () => {
    const selfReported = ev.evidence.filter((e) => e.evidence_class === "self_reported");
    expect(selfReported.length).toBeGreaterThan(0);
    for (const item of selfReported) {
      expect(item.provenance?.question?.trim().length).toBeGreaterThan(0);
      expect(typeof item.provenance?.turn).toBe("number");
    }
  });

  it("imported_document items do NOT require provenance (locators suffice)", () => {
    const imported = ev.evidence.filter((e) => e.evidence_class === "imported_document");
    for (const item of imported) {
      expect(item.locators.length).toBeGreaterThan(0);
    }
  });

  it("provisional inference carries role, sector, collaborators, themes", () => {
    const keys = ev.provisional.fields.map((f) => f.key);
    expect(keys).toEqual(
      expect.arrayContaining(["role", "sector", "collaborators", "themes"]),
    );
  });

  it("every provisional field references existing evidence ids", () => {
    const ids = new Set(ev.evidence.map((e) => e.id));
    for (const f of ev.provisional.fields) {
      for (const eid of f.evidenceIds) {
        expect(ids.has(eid)).toBe(true);
      }
    }
  });

  it("Route B probe set is bounded to 12–16 questions", () => {
    expect(ev.probeQuestions.length).toBeGreaterThanOrEqual(12);
    expect(ev.probeQuestions.length).toBeLessThanOrEqual(16);
  });

  it("source pack manifest declares accepted types and caps", () => {
    expect(ev.sourcePack.accepted.length).toBeGreaterThan(0);
    expect(ev.sourcePack.maxFiles).toBeGreaterThan(0);
    expect(ev.sourcePack.maxTotalMb).toBeGreaterThan(0);
  });
});
