import { describe, expect, it } from "vitest";
import {
  EMPTY_CURRENT_TEAM_IDS,
  defaultTeamName,
  ensureTeamsForSelection,
  removePlayerFromCatalogs,
} from "@/lib/ensureTeamsForSelection";
import type { Team } from "@/lib/teamPair";
import { TEST_PLAYERS, TEST_TEAMS } from "@/test/storage";

const players = TEST_PLAYERS.slice(0, 4);

const CATALOG: Team[] = [
  { id: "t-keep", name: "Соседи", playerIds: ["p5", "p6"] },
];

describe("defaultTeamName", () => {
  it("joins names in selection order", () => {
    expect(defaultTeamName(["p1", "p3"], players)).toBe("Алиса + Вася");
    expect(defaultTeamName(["p3", "p1"], players)).toBe("Вася + Алиса");
  });
});

describe("ensureTeamsForSelection", () => {
  it("returns empty currentTeamIds and the same catalog without a full team selection", () => {
    const result = ensureTeamsForSelection(
      CATALOG,
      ["p1", "p2", "p3"],
      players,
      true,
    );

    expect(result.teams).toBe(CATALOG);
    expect(result.currentTeamIds).toEqual(EMPTY_CURRENT_TEAM_IDS);

    const off = ensureTeamsForSelection(
      CATALOG,
      ["p1", "p2", "p3", "p4"],
      players,
      false,
    );
    expect(off.teams).toBe(CATALOG);
    expect(off.currentTeamIds).toEqual(EMPTY_CURRENT_TEAM_IDS);
  });

  it("creates two default-named teams and ids", () => {
    let n = 0;
    const result = ensureTeamsForSelection(
      [],
      ["p1", "p2", "p3", "p4"],
      players,
      true,
      () => `id-${++n}`,
    );

    expect(result.teams).toEqual([
      { id: "id-1", name: "Алиса + Вася", playerIds: ["p1", "p3"] },
      { id: "id-2", name: "Боб + Галя", playerIds: ["p2", "p4"] },
    ]);
    expect(result.currentTeamIds).toEqual({ black: "id-1", red: "id-2" });
  });

  it("reuses an existing team for a reversed pair and keeps the saved name", () => {
    const existing: Team[] = [TEST_TEAMS[0]];
    let n = 0;
    const result = ensureTeamsForSelection(
      existing,
      ["p3", "p2", "p1", "p4"],
      players,
      true,
      () => `new-${++n}`,
    );

    expect(result.teams).toHaveLength(2);
    expect(result.teams.filter((team) => team.id === "t1")).toHaveLength(1);
    expect(result.teams.find((team) => team.id === "t1")?.name).toBe(
      "Старая гвардия",
    );
    expect(result.currentTeamIds.black).toBe("t1");
    expect(result.currentTeamIds.red).toBe("new-1");
    expect(result.teams.find((team) => team.id === "new-1")).toEqual({
      id: "new-1",
      name: "Боб + Галя",
      playerIds: ["p2", "p4"],
    });
  });
});

describe("removePlayerFromCatalogs", () => {
  it("removes only teams that include the player and nulls matching current ids", () => {
    const teams: Team[] = [
      ...TEST_TEAMS,
      { id: "t3", name: "Соседи", playerIds: ["p5", "p6"] },
    ];
    const currentTeamIds = { black: "t1", red: "t2" };

    const result = removePlayerFromCatalogs(teams, currentTeamIds, "p1");

    expect(result.teams.map((team) => team.id)).toEqual(["t2", "t3"]);
    expect(result.currentTeamIds).toEqual({ black: null, red: "t2" });
  });

  it("keeps the catalog and current ids when no team includes the player", () => {
    const teams: Team[] = [TEST_TEAMS[1]];
    const currentTeamIds = { black: null, red: "t2" };

    const result = removePlayerFromCatalogs(teams, currentTeamIds, "p1");

    expect(result.teams).toBe(teams);
    expect(result.currentTeamIds).toBe(currentTeamIds);
  });
});
