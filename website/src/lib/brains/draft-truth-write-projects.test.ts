import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./airtable-rest", async () => {
  const actual = await vi.importActual<typeof import("./airtable-rest")>("./airtable-rest");
  return {
    ...actual,
    airtableSelect: vi.fn(),
  };
});

import { airtableSelect } from "./airtable-rest";
import { BRAIN_WORKSHOP_PROJECTS_FIELDS } from "./airtable-ids";
import {
  clearProjectCacheForTests,
  listActiveProjects,
  resolveProjectRecordId,
} from "./draft-truth-write";

const selectMock = vi.mocked(airtableSelect);

describe("listActiveProjects", () => {
  beforeEach(() => {
    selectMock.mockReset();
    clearProjectCacheForTests();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("returns live Active project IDs and names for the HEAD to decide", async () => {
    selectMock.mockResolvedValue([
      {
        id: "rechmkpaan4o4R6CT",
        fields: {
          [BRAIN_WORKSHOP_PROJECTS_FIELDS.projectName]: "Manage AstraJax Context On-Platform",
        },
      },
      {
        id: "rec9deYmfHS8s39za",
        fields: {
          [BRAIN_WORKSHOP_PROJECTS_FIELDS.projectName]:
            "Establish K3 Open-Weights Fine-Tuning for AstraJax",
        },
      },
    ]);

    const rows = await listActiveProjects("appL2fdnGmhA02WXd", "pat");
    expect(rows).toEqual([
      {
        recordId: "rechmkpaan4o4R6CT",
        projectName: "Manage AstraJax Context On-Platform",
      },
      {
        recordId: "rec9deYmfHS8s39za",
        projectName: "Establish K3 Open-Weights Fine-Tuning for AstraJax",
      },
    ]);
    expect(selectMock).toHaveBeenCalledWith(
      "appL2fdnGmhA02WXd",
      "tbl5jo7EKBxAjjKbf",
      "pat",
      expect.objectContaining({
        filterByFormula: "{Lifecycle}='Active'",
        paginate: true,
      }),
    );
  });

  it("confirms an Active record ID and refuses a project name", async () => {
    selectMock.mockResolvedValue([
      {
        id: "rechmkpaan4o4R6CT",
        fields: {
          [BRAIN_WORKSHOP_PROJECTS_FIELDS.projectName]: "Manage AstraJax Context On-Platform",
        },
      },
    ]);

    await expect(
      resolveProjectRecordId("appL2fdnGmhA02WXd", "pat", "rechmkpaan4o4R6CT"),
    ).resolves.toBe("rechmkpaan4o4R6CT");
    await expect(
      resolveProjectRecordId(
        "appL2fdnGmhA02WXd",
        "pat",
        "Manage AstraJax Context On-Platform",
      ),
    ).resolves.toBeNull();
  });
});
