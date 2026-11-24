import { act, renderHook } from "@testing-library/react";
import { type ReactNode } from "react";
import { describe, expect, it } from "vitest";
import {
  ParticipantsProvider,
  useParticipants,
} from "@/contexts/ParticipantsContext";
import {
  CURRENT_GAME_STORAGE_KEY,
  CurrentGameValidationError,
  TYPE_MISMATCH_MESSAGE,
  defaultCurrentGame,
} from "@/lib/currentGameStorage";
import {
  readCurrentGame,
  readTeams,
  seedStorage,
  TEST_PLAYERS,
  TEST_TEAMS,
  type SeedStorageOptions,
} from "@/test/storage";

function wrapper({ children }: { children: ReactNode }) {
  return <ParticipantsProvider>{children}</ParticipantsProvider>;
}

function seedPlayers({
  players = TEST_PLAYERS,
  ...options
}: SeedStorageOptions = {}) {
  seedStorage({ players, ...options });
}

function expectParticipantsError(message: string) {
  expect(() => renderHook(() => useParticipants(), { wrapper })).toThrow(
    new CurrentGameValidationError(message),
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
    seedPlayers({ selectedPlayerIds: ["p1", "p2", "p3"] });
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
    seedPlayers({ selectedPlayerIds: ["p1"] });
    const { result } = renderHook(() => useParticipants(), { wrapper });

    act(() => {
      result.current.setPlayerSelected("p1", true);
    });

    expect(result.current.selectedPlayerIds).toEqual(["p1"]);
  });

  it("removes a deleted player from the selection", () => {
    seedPlayers({ selectedPlayerIds: ["p1", "p2", "p3"] });
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
    seedPlayers({
      selectedPlayerIds: ["p1", "p2", "p3", "p4"],
      teamMode: true,
      teams: TEST_TEAMS,
    });
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
    seedPlayers({ selectedPlayerIds: ["p4", "p1"], teamMode: true });
    const { result } = renderHook(() => useParticipants(), { wrapper });

    expect(result.current.selectedPlayerIds).toEqual(["p4", "p1"]);
    expect(result.current.teamMode).toBe(true);
  });

  it("does not create catalog teams until commitTeamSelection", () => {
    seedPlayers({
      selectedPlayerIds: ["p1", "p2", "p3", "p4"],
      teamMode: true,
    });
    const { result } = renderHook(() => useParticipants(), { wrapper });

    expect(result.current.teams).toEqual([]);
    expect(result.current.currentTeamIds).toEqual({ black: null, red: null });
  });

  it("creates catalog teams and currentTeamIds for a full team selection", () => {
    seedPlayers({
      selectedPlayerIds: ["p1", "p2", "p3", "p4"],
      teamMode: true,
    });
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

  it("updates a team name by id", () => {
    seedPlayers({
      selectedPlayerIds: ["p1", "p2", "p3", "p4"],
      teamMode: true,
    });
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
    seedPlayers({
      selectedPlayerIds: ["p1", "p2", "p3", "p4"],
      teamMode: true,
      teams: [TEST_TEAMS[0]],
    });
    const { result } = renderHook(() => useParticipants(), { wrapper });

    act(() => {
      result.current.commitTeamSelection();
    });

    const catalogBeforeReset = result.current.teams;

    act(() => {
      result.current.resetGame();
    });

    expect(result.current.players).toEqual(TEST_PLAYERS);
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
      gameStarted: false,
      currentTeamIds: { black: null, red: null },
      trump: null,
      dealerId: null,
      scores: {},
    });
    expect(readTeams()).toEqual(catalogBeforeReset);
  });

  it("startGame sets gameStarted, trump, and dealerId", () => {
    seedPlayers({
      selectedPlayerIds: ["p1", "p2"],
    });
    const { result } = renderHook(() => useParticipants(), { wrapper });

    act(() => {
      result.current.startGame({ trump: "пики", dealerId: "p2" });
    });

    expect(result.current.gameStarted).toBe(true);
    expect(result.current.trump).toBe("пики");
    expect(result.current.dealerId).toBe("p2");
    expect(result.current.scores).toEqual({});

    expect(readCurrentGame()).toEqual({
      selectedPlayerIds: ["p1", "p2"],
      teamMode: false,
      gameStarted: true,
      currentTeamIds: { black: null, red: null },
      trump: "пики",
      dealerId: "p2",
      scores: {},
    });
  });

  it("resets currentGame on deleting a selected player when hasCommittedSession is true, but preserves session when deleting an unselected player", () => {
    seedPlayers({
      selectedPlayerIds: ["p1", "p2", "p3", "p4"],
      teamMode: true,
      teams: TEST_TEAMS,
      currentTeamIds: { black: "t1", red: "t2" },
      gameStarted: true,
      trump: "черви",
      dealerId: "p1",
      scores: { p1: 4, p2: 2 },
    });
    const { result } = renderHook(() => useParticipants(), { wrapper });

    expect(result.current.hasCommittedSession).toBe(true);

    act(() => {
      result.current.deletePlayer("p5");
    });

    expect(result.current.hasCommittedSession).toBe(true);
    expect(result.current.gameStarted).toBe(true);
    expect(result.current.selectedPlayerIds).toEqual(["p1", "p2", "p3", "p4"]);
    expect(result.current.currentTeamIds).toEqual({ black: "t1", red: "t2" });
    expect(result.current.scores).toEqual({ p1: 4, p2: 2 });

    act(() => {
      result.current.deletePlayer("p2");
    });

    expect(result.current.hasCommittedSession).toBe(false);
    expect(readCurrentGame()).toEqual(defaultCurrentGame());
    expect(result.current.players.map((p) => p.id)).toEqual(["p1", "p3", "p4"]);
  });

  it("only removes player from selectedPlayerIds on deletePlayer when hasCommittedSession is false", () => {
    seedPlayers({ selectedPlayerIds: ["p1", "p2", "p3"] });
    const { result } = renderHook(() => useParticipants(), { wrapper });

    expect(result.current.hasCommittedSession).toBe(false);

    act(() => {
      result.current.deletePlayer("p2");
    });

    expect(result.current.selectedPlayerIds).toEqual(["p1", "p3"]);
    expect(readCurrentGame().selectedPlayerIds).toEqual(["p1", "p3"]);
  });

  it("clears currentTeamIds when setPlayerSelected or setTeamMode runs before the game starts", () => {
    const preparedGame = {
      selectedPlayerIds: ["p1", "p2", "p3", "p4"],
      teamMode: true,
      teams: TEST_TEAMS,
      currentTeamIds: { black: "t1", red: "t2" },
      gameStarted: false,
    };
    seedPlayers(preparedGame);
    const { result, unmount } = renderHook(() => useParticipants(), { wrapper });

    act(() => {
      result.current.setPlayerSelected("p4", false);
    });

    expect(result.current.selectedPlayerIds).toEqual(["p1", "p2", "p3"]);
    expect(result.current.teamMode).toBe(true);
    expect(result.current.gameStarted).toBe(false);
    expect(result.current.currentTeamIds).toEqual({ black: null, red: null });
    unmount();

    seedPlayers(preparedGame);
    const secondHook = renderHook(() => useParticipants(), { wrapper });

    act(() => {
      secondHook.result.current.setTeamMode(false);
    });

    expect(secondHook.result.current.teamMode).toBe(false);
    expect(secondHook.result.current.selectedPlayerIds).toEqual([
      "p1",
      "p2",
      "p3",
      "p4",
    ]);
    expect(secondHook.result.current.gameStarted).toBe(false);
    expect(secondHook.result.current.currentTeamIds).toEqual({
      black: null,
      red: null,
    });
  });

  it("resetGame clears a started game with trump, dealerId, and scores", () => {
    seedPlayers({
      selectedPlayerIds: ["p1", "p2"],
      gameStarted: true,
      trump: "пики",
      dealerId: "p2",
      scores: { p1: 8, p2: 4 },
    });
    const { result } = renderHook(() => useParticipants(), { wrapper });

    act(() => {
      result.current.resetGame();
    });

    expect(result.current.gameStarted).toBe(false);
    expect(result.current.trump).toBeNull();
    expect(result.current.dealerId).toBeNull();
    expect(result.current.scores).toEqual({});
    expect(result.current.selectedPlayerIds).toEqual([]);
    expect(readCurrentGame()).toEqual(defaultCurrentGame());
  });

  it("throws CurrentGameValidationError for unknown or extra selected ids", () => {
    seedPlayers({ selectedPlayerIds: ["missing", "p2"] });
    expectParticipantsError("Сессия ссылается на несуществующего игрока");

    seedPlayers({ selectedPlayerIds: ["p1", "p2", "p3", "p4", "p5"] });
    expectParticipantsError("В партии не больше четырёх игроков");
  });

  it("throws CurrentGameValidationError when the stored game has the wrong type", () => {
    seedPlayers({ selectedPlayerIds: ["p1"] });
    localStorage.setItem(CURRENT_GAME_STORAGE_KEY, "null");
    expectParticipantsError(TYPE_MISMATCH_MESSAGE);

    localStorage.setItem(
      CURRENT_GAME_STORAGE_KEY,
      JSON.stringify({
        selectedPlayerIds: ["p1"],
        teamMode: "yes",
        gameStarted: false,
        currentTeamIds: { black: null, red: null },
        trump: null,
        dealerId: null,
        scores: {},
      }),
    );
    expectParticipantsError(TYPE_MISMATCH_MESSAGE);
  });
});
