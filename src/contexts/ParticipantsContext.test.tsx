import { act, renderHook } from "@testing-library/react";
import { type ReactNode } from "react";
import { describe, expect, it } from "vitest";
import {
  ParticipantsProvider,
  useParticipants,
} from "@/contexts/ParticipantsContext";

function wrapper({ children }: { children: ReactNode }) {
  return <ParticipantsProvider>{children}</ParticipantsProvider>;
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
});
