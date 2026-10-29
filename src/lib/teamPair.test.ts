import { describe, expect, it } from "vitest";
import {
  findTeamByPlayers,
  normalizePair,
  samePair,
  upsertTeam,
  type Team,
} from "@/lib/teamPair";

describe("normalizePair", () => {
  it("returns the same canonical order for swapped ids", () => {
    expect(normalizePair(["p1", "p3"])).toEqual(["p1", "p3"]);
    expect(normalizePair(["p3", "p1"])).toEqual(["p1", "p3"]);
  });

  it("throws when the pair does not contain exactly two different ids", () => {
    expect(() => normalizePair(["p1"])).toThrow(
      "Команда должна состоять ровно из двух игроков",
    );
    expect(() => normalizePair(["p1", "p2", "p3"])).toThrow(
      "Команда должна состоять ровно из двух игроков",
    );
    expect(() => normalizePair(["p1", "p1"])).toThrow(
      "Команда должна состоять из двух разных игроков",
    );
  });
});

describe("samePair", () => {
  it("treats swapped player ids as the same pair", () => {
    expect(samePair(["p1", "p3"], ["p3", "p1"])).toBe(true);
    expect(samePair(["p1", "p3"], ["p1", "p3"])).toBe(true);
  });

  it("returns false for different pairs or invalid input", () => {
    expect(samePair(["p1", "p3"], ["p2", "p4"])).toBe(false);
    expect(samePair(["p1"], ["p1", "p3"])).toBe(false);
    expect(samePair(["p1", "p1"], ["p1", "p3"])).toBe(false);
  });
});

describe("findTeamByPlayers", () => {
  const teams: Team[] = [
    { id: "t1", name: "Старая гвардия", playerIds: ["p1", "p3"] },
    { id: "t2", name: "Новички", playerIds: ["p2", "p4"] },
  ];

  it("finds a team when the lookup order is reversed", () => {
    expect(findTeamByPlayers(teams, ["p3", "p1"])?.id).toBe("t1");
    expect(findTeamByPlayers(teams, ["p1", "p3"])?.id).toBe("t1");
  });

  it("returns undefined when no matching pair exists", () => {
    expect(findTeamByPlayers(teams, ["p1", "p2"])).toBeUndefined();
  });
});

describe("upsertTeam", () => {
  it("creates a team with canonical playerIds", () => {
    const { teams, team } = upsertTeam([], ["p3", "p1"], "Старая гвардия", () => "t1");

    expect(team).toEqual({
      id: "t1",
      name: "Старая гвардия",
      playerIds: ["p1", "p3"],
    });
    expect(teams).toEqual([team]);
  });

  it("updates the existing team when the pair is swapped and does not create a duplicate", () => {
    const initial: Team[] = [
      { id: "t1", name: "Старая гвардия", playerIds: ["p1", "p3"] },
    ];

    const { teams, team } = upsertTeam(initial, ["p3", "p1"], "Молния");

    expect(team).toEqual({
      id: "t1",
      name: "Молния",
      playerIds: ["p1", "p3"],
    });
    expect(teams).toHaveLength(1);
    expect(teams[0]).toEqual(team);
  });
});
