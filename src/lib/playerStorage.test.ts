import { describe, expect, it } from "vitest";
import {
  loadPlayers,
  PLAYERS_STORAGE_KEY,
  savePlayers,
} from "@/lib/playerStorage";

describe("playerStorage", () => {
  it("returns an empty list for invalid JSON and non-array roots", () => {
    localStorage.setItem(PLAYERS_STORAGE_KEY, "{");
    expect(loadPlayers()).toEqual([]);

    localStorage.setItem(PLAYERS_STORAGE_KEY, "null");
    expect(loadPlayers()).toEqual([]);

    localStorage.setItem(PLAYERS_STORAGE_KEY, "{}");
    expect(loadPlayers()).toEqual([]);
  });

  it("keeps only valid players from a mixed array", () => {
    localStorage.setItem(
      PLAYERS_STORAGE_KEY,
      JSON.stringify([
        { id: "p1", name: "Алиса" },
        { id: 1, name: "Боб" },
        { name: "Вася" },
        null,
        { id: "p2", name: "Галя" },
      ]),
    );

    expect(loadPlayers()).toEqual([
      { id: "p1", name: "Алиса" },
      { id: "p2", name: "Галя" },
    ]);
  });

  it("roundtrips save and load", () => {
    const players = [
      { id: "p1", name: "Алиса" },
      { id: "p2", name: "Боб" },
    ];

    savePlayers(players);
    expect(loadPlayers()).toEqual(players);
  });
});
