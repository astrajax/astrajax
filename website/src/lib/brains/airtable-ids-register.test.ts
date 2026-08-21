import { describe, expect, it } from "vitest";
import {
  HOUSEHOLD_MEMBERS_FIELDS,
  HOUSEHOLD_MINIONS_FIELDS,
  HOUSEHOLD_REGISTER_TABLES,
  HOUSEHOLD_SKILL_VERSIONS_FIELDS,
  HOUSEHOLD_SKILLS_FIELDS,
  HOUSEHOLD_VERSIONS_BASE_ID,
  HOUSEHOLD_VERSIONS_FIELDS,
  HOUSEHOLD_VERSIONS_TABLE_ID,
} from "./airtable-ids";

/**
 * Locks website register field IDs to the Self-Update / fleet-sync writer (#177).
 * Skill Versions.Change Reason has a leading space in Airtable — always write by ID.
 */
describe("household register Airtable IDs", () => {
  it("keeps register tables on the household versions base", () => {
    expect(HOUSEHOLD_VERSIONS_BASE_ID).toBe("appPrpfvsAr71RPP3");
    expect(HOUSEHOLD_REGISTER_TABLES.versions).toBe(HOUSEHOLD_VERSIONS_TABLE_ID);
    expect(HOUSEHOLD_REGISTER_TABLES).toEqual({
      members: "tblJ70qtHUc1dUHhi",
      minions: "tbl6aVm9rgWoOBVfd",
      versions: "tbleX09zbkUNKTGBz",
      skills: "tblAIXtDBBMrLuEYc",
      skillVersions: "tbllp30BraLWgslhk",
    });
  });

  it("locks member, minion, version, and skill field IDs used after verify", () => {
    expect(HOUSEHOLD_MEMBERS_FIELDS.systemPrompt).toBe("fldKKvps3FIAvJdhh");
    expect(HOUSEHOLD_MINIONS_FIELDS.systemPrompt).toBe("fldex5K15FTjEWoM7");
    expect(HOUSEHOLD_VERSIONS_FIELDS.changeReason).toBe("fldEy4G0Mz1417wDg");
    expect(HOUSEHOLD_VERSIONS_FIELDS.changeSource).toBe("fldx2PG3DUZA24wST");
    expect(HOUSEHOLD_SKILLS_FIELDS.skillName).toBe("fldz3v4xnWrwJtHTg");
    // Leading-space Change Reason — must never be written by display name.
    expect(HOUSEHOLD_SKILL_VERSIONS_FIELDS.changeReason).toBe("fldEh3aXTh12qzrog");
    expect(HOUSEHOLD_SKILL_VERSIONS_FIELDS.changeSource).toBe("fldLL07K8ZOaVKJIw");
  });
});
