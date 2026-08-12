import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { OperatorState } from "../platform/operator-state";
import { initialOperatorState } from "../platform/operator-state";

const getByEmail = vi.fn();
const create = vi.fn();

vi.mock("../platform/operator-store/get-store", () => ({
  getOperatorStore: () => ({
    getByEmail,
    getById: vi.fn(),
    create,
    put: vi.fn(),
  }),
}));

import {
  loadOrCreateOperatorIdentity,
  OperatorIdentityUnavailableError,
} from "./resolve-operator-identity";

function stateFor(email: string): OperatorState {
  return initialOperatorState({
    operatorId: "op_existing",
    email,
  });
}

describe("loadOrCreateOperatorIdentity", () => {
  beforeEach(() => {
    getByEmail.mockReset();
    create.mockReset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("returns an existing operator without creating", async () => {
    getByEmail.mockResolvedValueOnce(stateFor("matthew@astrajax.com"));

    await expect(
      loadOrCreateOperatorIdentity("matthew@astrajax.com"),
    ).resolves.toEqual({
      id: "op_existing",
      email: "matthew@astrajax.com",
    });
    expect(create).not.toHaveBeenCalled();
  });

  it("creates when no row exists yet", async () => {
    getByEmail.mockResolvedValueOnce(undefined);
    create.mockImplementationOnce(async (state: OperatorState) => state);

    const identity = await loadOrCreateOperatorIdentity("matthew@astrajax.com");
    expect(identity.email).toBe("matthew@astrajax.com");
    expect(identity.id).toMatch(/^op_/);
    expect(create).toHaveBeenCalledOnce();
  });

  it("reloads the winner when create races with already-exists", async () => {
    getByEmail
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce(stateFor("matthew@astrajax.com"));
    create.mockRejectedValueOnce(
      new Error("Operator already exists for matthew@astrajax.com"),
    );

    await expect(
      loadOrCreateOperatorIdentity("matthew@astrajax.com"),
    ).resolves.toEqual({
      id: "op_existing",
      email: "matthew@astrajax.com",
    });
    expect(getByEmail).toHaveBeenCalledTimes(2);
  });

  it("surfaces store-unavailable when the race reload also finds nothing", async () => {
    getByEmail.mockResolvedValueOnce(undefined).mockResolvedValueOnce(undefined);
    create.mockRejectedValueOnce(
      new Error("Operator already exists for matthew@astrajax.com"),
    );

    await expect(
      loadOrCreateOperatorIdentity("matthew@astrajax.com"),
    ).rejects.toBeInstanceOf(OperatorIdentityUnavailableError);
  });

  it("rethrows non-conflict create failures", async () => {
    getByEmail.mockResolvedValueOnce(undefined);
    create.mockRejectedValueOnce(new Error("Airtable API error 503"));

    await expect(
      loadOrCreateOperatorIdentity("matthew@astrajax.com"),
    ).rejects.toThrow(/Airtable API error 503/);
  });
});
