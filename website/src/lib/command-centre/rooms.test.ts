import { describe, expect, it } from "vitest";
import { COMMAND_ROOMS } from "./rooms";

describe("command-centre rooms", () => {
  it("Pam desk includes outstanding actions station", () => {
    const pam = COMMAND_ROOMS.pam;
    const outstanding = pam.stations.find((station) => station.id === "outstanding-actions");
    expect(outstanding).toBeDefined();
    expect(outstanding?.href).toBe("/brain/review?view=actionProposed");
  });

  it("all station links are internal paths", () => {
    for (const room of Object.values(COMMAND_ROOMS)) {
      for (const station of room.stations) {
        expect(station.href.startsWith("/")).toBe(true);
        expect(station.href.startsWith("http")).toBe(false);
      }
    }
  });
});
