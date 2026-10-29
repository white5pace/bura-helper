import { describe, expect, it } from "vitest";
import {
  CURRENT_GAME_STORAGE_KEY,
  defaultCurrentGame,
  loadCurrentGame,
  sanitizeCurrentGame,
} from "@/lib/currentGameStorage";

describe("currentGameStorage", () => {
  it("returns defaults for invalid JSON and non-object roots", () => {
    const defaults = defaultCurrentGame();

    localStorage.setItem(CURRENT_GAME_STORAGE_KEY, "{");
    expect(loadCurrentGame()).toEqual(defaults);

    localStorage.setItem(CURRENT_GAME_STORAGE_KEY, "null");
    expect(loadCurrentGame()).toEqual(defaults);

    localStorage.setItem(CURRENT_GAME_STORAGE_KEY, "[]");
    expect(loadCurrentGame()).toEqual(defaults);
  });

  it("filters non-strings from selectedPlayerIds without catalogs", () => {
    localStorage.setItem(
      CURRENT_GAME_STORAGE_KEY,
      JSON.stringify({
        selectedPlayerIds: ["p1", 2, "p2"],
        teamMode: false,
        currentTeamIds: { black: null, red: null },
      }),
    );

    expect(loadCurrentGame().selectedPlayerIds).toEqual(["p1", "p2"]);
  });

  it("treats teamMode as true only for boolean true", () => {
    localStorage.setItem(
      CURRENT_GAME_STORAGE_KEY,
      JSON.stringify({
        selectedPlayerIds: [],
        teamMode: "yes",
        currentTeamIds: { black: null, red: null },
      }),
    );

    expect(loadCurrentGame().teamMode).toBe(false);
  });

  it("drops unknown catalog ids and caps selection at the limit", () => {
    const game = {
      selectedPlayerIds: ["missing", "p2", "p1", "p3", "p4", "p5", "p6"],
      teamMode: true,
      currentTeamIds: { black: "t1", red: "gone" },
    };

    expect(
      sanitizeCurrentGame(game, {
        playerIds: new Set(["p1", "p2", "p3", "p4", "p5", "p6"]),
        teamIds: new Set(["t1"]),
      }),
    ).toEqual({
      selectedPlayerIds: ["p2", "p1", "p3", "p4"],
      teamMode: true,
      currentTeamIds: { black: "t1", red: null },
    });
  });
});
