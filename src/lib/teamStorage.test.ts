import { describe, expect, it } from "vitest";
import { loadTeams, saveTeams, TEAMS_STORAGE_KEY } from "@/lib/teamStorage";

describe("teamStorage", () => {
  it("canonicalizes swapped player ids on load", () => {
    localStorage.setItem(
      TEAMS_STORAGE_KEY,
      JSON.stringify([
        { id: "t1", name: "Старая гвардия", playerIds: ["p3", "p1"] },
      ]),
    );

    expect(loadTeams()).toEqual([
      { id: "t1", name: "Старая гвардия", playerIds: ["p1", "p3"] },
    ]);
  });

  it("returns an empty list for invalid JSON", () => {
    localStorage.setItem(TEAMS_STORAGE_KEY, "{");
    expect(loadTeams()).toEqual([]);
  });

  it("returns an empty list when the stored value is not an array", () => {
    localStorage.setItem(TEAMS_STORAGE_KEY, "{}");
    expect(loadTeams()).toEqual([]);
  });

  it("drops a team whose player ids are equal", () => {
    localStorage.setItem(
      TEAMS_STORAGE_KEY,
      JSON.stringify([
        { id: "t1", name: "Ок", playerIds: ["p1", "p2"] },
        { id: "bad", name: "Дубль", playerIds: ["p1", "p1"] },
      ]),
    );

    expect(loadTeams()).toEqual([
      { id: "t1", name: "Ок", playerIds: ["p1", "p2"] },
    ]);
  });

  it("drops items that do not match the team shape", () => {
    localStorage.setItem(
      TEAMS_STORAGE_KEY,
      JSON.stringify([
        { id: "t1", name: "Ок", playerIds: ["p1", "p2"] },
        { id: "short", name: "Один", playerIds: ["p1"] },
        { name: "без id", playerIds: ["p1", "p2"] },
        null,
      ]),
    );

    expect(loadTeams()).toEqual([
      { id: "t1", name: "Ок", playerIds: ["p1", "p2"] },
    ]);
  });

  it("roundtrips save and load", () => {
    const teams = [
      { id: "t1", name: "Старая гвардия", playerIds: ["p1", "p3"] as [string, string] },
    ];

    saveTeams(teams);
    expect(loadTeams()).toEqual(teams);
  });
});
