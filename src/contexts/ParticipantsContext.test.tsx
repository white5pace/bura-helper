import { act, renderHook } from "@testing-library/react";
import { type ReactNode } from "react";
import { describe, expect, it } from "vitest";
import {
  ParticipantsProvider,
  useParticipants,
} from "@/contexts/ParticipantsContext";

const FIVE_PLAYERS = [
  { id: "p1", name: "Алиса" },
  { id: "p2", name: "Боб" },
  { id: "p3", name: "Вася" },
  { id: "p4", name: "Галя" },
  { id: "p5", name: "Дима" },
];

function wrapper({ children }: { children: ReactNode }) {
  return <ParticipantsProvider>{children}</ParticipantsProvider>;
}

function seedPlayers(
  players = FIVE_PLAYERS,
  selectedPlayerIds: string[] = [],
  teamMode = false,
) {
  localStorage.setItem("players", JSON.stringify(players));
  localStorage.setItem("selectedPlayerIds", JSON.stringify(selectedPlayerIds));
  localStorage.setItem("teamMode", JSON.stringify(teamMode));
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
      { id: "test-uuid", name: "Боб" },
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
    seedPlayers(FIVE_PLAYERS, ["p1", "p2", "p3"]);
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
    seedPlayers(FIVE_PLAYERS, ["p1"]);
    const { result } = renderHook(() => useParticipants(), { wrapper });

    act(() => {
      result.current.setPlayerSelected("p1", true);
    });

    expect(result.current.selectedPlayerIds).toEqual(["p1"]);
  });

  it("removes a deleted player from the selection", () => {
    seedPlayers(FIVE_PLAYERS, ["p1", "p2", "p3"]);
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

  it("persists selectedPlayerIds to localStorage", () => {
    seedPlayers();
    const { result } = renderHook(() => useParticipants(), { wrapper });

    act(() => {
      result.current.setPlayerSelected("p2", true);
      result.current.setPlayerSelected("p1", true);
    });

    expect(JSON.parse(localStorage.getItem("selectedPlayerIds")!)).toEqual([
      "p2",
      "p1",
    ]);
  });

  it("persists teamMode to localStorage", () => {
    const { result } = renderHook(() => useParticipants(), { wrapper });

    expect(JSON.parse(localStorage.getItem("teamMode")!)).toBe(false);

    act(() => {
      result.current.setTeamMode(true);
    });

    expect(JSON.parse(localStorage.getItem("teamMode")!)).toBe(true);
  });

  it("restores selectedPlayerIds and teamMode from localStorage", () => {
    seedPlayers(FIVE_PLAYERS, ["p4", "p1"], true);
    const { result } = renderHook(() => useParticipants(), { wrapper });

    expect(result.current.selectedPlayerIds).toEqual(["p4", "p1"]);
    expect(result.current.teamMode).toBe(true);
  });

  it("drops unknown and extra selected ids when loading", () => {
    seedPlayers(FIVE_PLAYERS, ["missing", "p2", "p1", "p3", "p4", "p5"]);
    const { result } = renderHook(() => useParticipants(), { wrapper });

    expect(result.current.selectedPlayerIds).toEqual(["p2", "p1", "p3", "p4"]);
  });
});
