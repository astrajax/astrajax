import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("../handlers/receiving-wall-accept", () => ({
  handleReceivingWallAccept: vi.fn(),
}));

import { auth } from "@/lib/auth";
import { handleReceivingWallAccept } from "../handlers/receiving-wall-accept";
import { acceptReceivingWallRecord } from "./receiving-wall-accept";

const authMock = vi.mocked(auth);
const acceptMock = vi.mocked(handleReceivingWallAccept);

beforeEach(() => {
  authMock.mockReset();
  acceptMock.mockReset();
});

describe("acceptReceivingWallRecord", () => {
  it("refuses anonymous callers so public wall ids cannot approve drafts", async () => {
    authMock.mockResolvedValue(null as never);

    const result = await acceptReceivingWallRecord({ recordId: "recDraft1" });

    expect(result).toEqual({
      ok: false,
      error: "Sign in to accept a draft on the Receiving Wall.",
    });
    expect(acceptMock).not.toHaveBeenCalled();
  });

  it("uses the signed-in operator email as actor when none is provided", async () => {
    authMock.mockResolvedValue({
      operator: {
        operatorId: "op_matthew",
        email: "matthew@example.com",
        role: "owner",
      },
    } as never);
    acceptMock.mockResolvedValue({
      recordId: "recDraft1",
      status: "Approved",
    } as never);

    const result = await acceptReceivingWallRecord({ recordId: "recDraft1" });

    expect(result).toEqual({
      ok: true,
      data: { recordId: "recDraft1", status: "Approved" },
    });
    expect(acceptMock).toHaveBeenCalledWith({
      recordId: "recDraft1",
      actor: "matthew@example.com",
    });
  });

  it("returns handler failures as ok:false instead of throwing", async () => {
    authMock.mockResolvedValue({
      operator: {
        operatorId: "op_matthew",
        email: "matthew@example.com",
        role: "owner",
      },
    } as never);
    acceptMock.mockRejectedValue(new Error("Draft already Promoted."));

    const result = await acceptReceivingWallRecord({
      recordId: "recDraft1",
      actor: "Matthew",
    });

    expect(result).toEqual({
      ok: false,
      error: "Draft already Promoted.",
    });
  });
});
