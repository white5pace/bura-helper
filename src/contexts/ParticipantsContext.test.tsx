import { act, renderHook } from "@testing-library/react";
import { type ReactNode } from "react";
import { describe, expect, it } from "vitest";
import {
  ParticipantsProvider,
  useParticipants,
} from "@/contexts/ParticipantsContext";
import {
  CURRENT_GAME_STORAGE_KEY,
  type CurrentGame,
} from "@/lib/currentGameStorage";
import type { Team } from "@/lib/teamPair";

const DEFAULT_PLAYERS = [
  { id: "p1", name: "Алиса" },
  { id: "p2", name: "Боб" },
  { id: "p3", name: "Вася" },
  { id: "p4", name: "Галя" },
  { id: "p5", name: "Дима" },
];

function wrapper({ children }: { children: ReactNode }) {
  return <ParticipantsProvider>{children}</ParticipantsProvider>;
}

function readCurrentGame(): CurrentGame {
  return JSON.parse(localStorage.getItem(CURRENT_GAME_STORAGE_KEY)!) as CurrentGame;
}

function seedPlayers(
  players = DEFAULT_PLAYERS,
  selectedPlayerIds: string[] = [],
  teamMode = false,
  teams: Team[] = [],
  currentTeamIds: CurrentGame["currentTeamIds"] = { black: null, red: null },
) {
  localStorage.setItem("players", JSON.stringify(players));
  localStorage.setItem("teams", JSON.stringify(teams));
  localStorage.setItem(
    CURRENT_GAME_STORAGE_KEY,
    JSON.stringify({
      selectedPlayerIds,
      teamMode,
      currentTeamIds,
    } satisfies CurrentGame),
  );
}

describe("ParticipantsContext", () => {
  it("adds a player", () => {
    const { result } = renderHook(() => useParticipants(), { wrapper });

    act(() => {
      result.current.addPlayer("Алиса");
    });

    expect(result.current.players).toHaveLength(1);
    expect(result.current.players[0]?.name).toBe("Алиса");
  });

  it("updates a player name", () => {
    const { result } = renderHook(() => useParticipants(), { wrapper });

    act(() => {
      const player = result.current.addPlayer("Алиса");
      result.current.updatePlayer(player.id, "Алиса Б.");
    });

    expect(result.current.players[0]?.name).toBe("Алиса Б.");
  });

  it("deletes a player", () => {
    const { result } = renderHook(() => useParticipants(), { wrapper });

    act(() => {
      const player = result.current.addPlayer("Алиса");
      result.current.deletePlayer(player.id);
    });

    expect(result.current.players).toHaveLength(0);
  });

  it("persists players to localStorage", () => {
    const { result } = renderHook(() => useParticipants(), { wrapper });

    act(() => {
      result.current.addPlayer("Боб");
    });

    const stored = localStorage.getItem("players");
    expect(stored).toBeTruthy();
    expect(JSON.parse(stored!)).toEqual([
      { id: "test-uuid-1", name: "Боб" },
    ]);
  });

  it("keeps selectedPlayerIds in selection order", () => {
    seedPlayers();
    const { result } = renderHook(() => useParticipants(), { wrapper });

    act(() => {
      result.current.setPlayerSelected("p3", true);
      result.current.setPlayerSelected("p1", true);
      result.current.setPlayerSelected("p4", true);
    });

    expect(result.current.selectedPlayerIds).toEqual(["p3", "p1", "p4"]);
  });

  it("preserves remaining order after deselecting a player", () => {
    seedPlayers(DEFAULT_PLAYERS, ["p1", "p2", "p3"]);
    const { result } = renderHook(() => useParticipants(), { wrapper });

    act(() => {
      result.current.setPlayerSelected("p2", false);
    });

    expect(result.current.selectedPlayerIds).toEqual(["p1", "p3"]);
  });

  it("does not select more than 4 players", () => {
    seedPlayers();
    const { result } = renderHook(() => useParticipants(), { wrapper });

    act(() => {
      result.current.setPlayerSelected("p1", true);
      result.current.setPlayerSelected("p2", true);
      result.current.setPlayerSelected("p3", true);
      result.current.setPlayerSelected("p4", true);
      result.current.setPlayerSelected("p5", true);
    });

    expect(result.current.selectedPlayerIds).toEqual(["p1", "p2", "p3", "p4"]);
  });

  it("does not add a duplicate selection", () => {
    seedPlayers(DEFAULT_PLAYERS, ["p1"]);
    const { result } = renderHook(() => useParticipants(), { wrapper });

    act(() => {
      result.current.setPlayerSelected("p1", true);
    });

    expect(result.current.selectedPlayerIds).toEqual(["p1"]);
  });

  it("removes a deleted player from the selection", () => {
    seedPlayers(DEFAULT_PLAYERS, ["p1", "p2", "p3"]);
    const { result } = renderHook(() => useParticipants(), { wrapper });

    act(() => {
      result.current.deletePlayer("p2");
    });

    expect(result.current.players.map((player) => player.id)).toEqual([
      "p1",
      "p3",
      "p4",
      "p5",
    ]);
    expect(result.current.selectedPlayerIds).toEqual(["p1", "p3"]);
  });

  it("removes catalog teams that include a deleted player", async () => {
    seedPlayers(
      DEFAULT_PLAYERS,
      ["p1", "p2", "p3", "p4"],
      true,
      [
        { id: "t1", name: "Старая гвардия", playerIds: ["p1", "p3"] },
        { id: "t2", name: "Новички", playerIds: ["p2", "p4"] },
      ],
    );
    const { result } = renderHook(() => useParticipants(), { wrapper });

    act(() => {
      result.current.commitTeamSelection();
    });

    expect(result.current.currentTeamIds).toEqual({ black: "t1", red: "t2" });

    act(() => {
      result.current.deletePlayer("p1");
    });

    expect(
      result.current.teams.find((team) => team.id === "t1"),
    ).toBeUndefined();
    expect(result.current.teams.map((team) => team.id)).toContain("t2");
    expect(
      result.current.teams.every((team) => !team.playerIds.includes("p1")),
    ).toBe(true);
  });

  it("persists selectedPlayerIds to currentGame in localStorage", () => {
    seedPlayers();
    const { result } = renderHook(() => useParticipants(), { wrapper });

    act(() => {
      result.current.setPlayerSelected("p2", true);
      result.current.setPlayerSelected("p1", true);
    });

    expect(readCurrentGame().selectedPlayerIds).toEqual(["p2", "p1"]);
  });

  it("persists teamMode to currentGame in localStorage", () => {
    const { result } = renderHook(() => useParticipants(), { wrapper });

    expect(readCurrentGame().teamMode).toBe(false);

    act(() => {
      result.current.setTeamMode(true);
    });

    expect(readCurrentGame().teamMode).toBe(true);
  });

  it("restores selectedPlayerIds and teamMode from currentGame", () => {
    seedPlayers(DEFAULT_PLAYERS, ["p4", "p1"], true);
    const { result } = renderHook(() => useParticipants(), { wrapper });

    expect(result.current.selectedPlayerIds).toEqual(["p4", "p1"]);
    expect(result.current.teamMode).toBe(true);
  });

  it("does not create catalog teams until commitTeamSelection", () => {
    seedPlayers(DEFAULT_PLAYERS, ["p1", "p2", "p3", "p4"], true);
    const { result } = renderHook(() => useParticipants(), { wrapper });

    expect(result.current.teams).toEqual([]);
    expect(result.current.currentTeamIds).toEqual({ black: null, red: null });
  });

  it("creates catalog teams and currentTeamIds for a full team selection", () => {
    seedPlayers(DEFAULT_PLAYERS, ["p1", "p2", "p3", "p4"], true);
    const { result } = renderHook(() => useParticipants(), { wrapper });

    act(() => {
      expect(result.current.commitTeamSelection()).toBe(true);
    });

    expect(result.current.teams).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: "Алиса + Вася",
          playerIds: ["p1", "p3"],
        }),
        expect.objectContaining({
          name: "Боб + Галя",
          playerIds: ["p2", "p4"],
        }),
      ]),
    );
    expect(result.current.currentTeamIds.black).toBeTruthy();
    expect(result.current.currentTeamIds.red).toBeTruthy();
    expect(
      result.current.getTeamById(result.current.currentTeamIds.black!)?.name,
    ).toBe("Алиса + Вася");
    expect(
      result.current.getTeamById(result.current.currentTeamIds.red!)?.name,
    ).toBe("Боб + Галя");
  });

  it("reuses an existing team when the pair order is reversed", () => {
    seedPlayers(
      DEFAULT_PLAYERS,
      ["p3", "p2", "p1", "p4"],
      true,
      [{ id: "t1", name: "Старая гвардия", playerIds: ["p1", "p3"] }],
    );
    const { result } = renderHook(() => useParticipants(), { wrapper });

    act(() => {
      result.current.commitTeamSelection();
    });

    expect(result.current.teams.filter((team) =>
      team.playerIds[0] === "p1" && team.playerIds[1] === "p3",
    )).toHaveLength(1);
    expect(result.current.currentTeamIds.black).toBe("t1");
    expect(result.current.getTeamById("t1")?.name).toBe("Старая гвардия");
  });

  it("updates a team name by id", () => {
    seedPlayers(DEFAULT_PLAYERS, ["p1", "p2", "p3", "p4"], true);
    const { result } = renderHook(() => useParticipants(), { wrapper });

    act(() => {
      result.current.commitTeamSelection();
    });

    const blackId = result.current.currentTeamIds.black;
    expect(blackId).toBeTruthy();

    act(() => {
      result.current.setTeamName(blackId!, "Молния");
    });

    expect(result.current.getTeamById(blackId!)?.name).toBe("Молния");
  });

  it("resets the current game state without clearing the teams catalog", () => {
    seedPlayers(
      DEFAULT_PLAYERS,
      ["p1", "p2", "p3", "p4"],
      true,
      [{ id: "t1", name: "Старая гвардия", playerIds: ["p1", "p3"] }],
    );
    const { result } = renderHook(() => useParticipants(), { wrapper });

    act(() => {
      result.current.commitTeamSelection();
    });

    const catalogBeforeReset = result.current.teams;

    act(() => {
      result.current.resetGame();
    });

    expect(result.current.players).toEqual(DEFAULT_PLAYERS);
    expect(result.current.selectedPlayerIds).toEqual([]);
    expect(result.current.teamMode).toBe(false);
    expect(result.current.currentTeamIds).toEqual({ black: null, red: null });
    expect(result.current.teams.length).toBeGreaterThanOrEqual(1);
    expect(result.current.teams).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: "t1", name: "Старая гвардия" }),
      ]),
    );
    expect(readCurrentGame()).toEqual({
      selectedPlayerIds: [],
      teamMode: false,
      currentTeamIds: { black: null, red: null },
    });
    expect(JSON.parse(localStorage.getItem("teams")!)).toEqual(
      catalogBeforeReset,
    );
  });

  it("drops unknown and extra selected ids when loading", () => {
    seedPlayers(DEFAULT_PLAYERS, ["missing", "p2", "p1", "p3", "p4", "p5"]);
    const { result } = renderHook(() => useParticipants(), { wrapper });

    expect(result.current.selectedPlayerIds).toEqual(["p2", "p1", "p3", "p4"]);
  });
});
