import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import GameStart from "@/pages/GameStart";
import { renderWithRouter } from "@/test/router";
import {
  readCurrentGame,
  readPlayers,
  seedStorage,
  TEST_PLAYERS,
} from "@/test/storage";

const players = TEST_PLAYERS.slice(0, 4);

const SUITS = ["крести", "пики", "черви", "буби"] as const;

function renderGameStart() {
  return renderWithRouter(
    [
      { path: "/game-start", element: <GameStart /> },
      { path: "/game", element: <h1>Игра</h1> },
      { path: "/participants", element: <h1>Выберите участников</h1> },
      { path: "/", element: <h1>Меню</h1> },
    ],
    { initialEntries: ["/game-start"] },
  );
}

describe("GameStart page", () => {
  it("shows the first selected player as dealer and leaves the suit unselected", () => {
    seedStorage({ players, selectedPlayerIds: ["p2", "p1"] });
    renderGameStart();

    expect(screen.getByRole("heading", { name: "Подготовка" })).toBeInTheDocument();
    expect(screen.getByText("Раздает:")).toBeInTheDocument();
    expect(screen.getByText("Боб")).toBeInTheDocument();
    expect(screen.queryByText("Алиса")).not.toBeInTheDocument();

    const radios = screen.getAllByRole("radio");
    expect(radios).toHaveLength(SUITS.length);
    SUITS.forEach((suit, index) => {
      expect(radios[index]).toBe(screen.getByRole("radio", { name: suit }));
      expect(radios[index]).not.toBeChecked();
    });
    expect(
      screen.getAllByRole("img").map((img) => img.getAttribute("alt")),
    ).toEqual([...SUITS]);
    expect(
      screen.getByRole("button", { name: "Начать игру" }),
    ).toBeInTheDocument();
  });

  it("stays on the page and does not save the round when no trump is chosen", async () => {
    seedStorage({ players, selectedPlayerIds: ["p2", "p1"] });
    const user = userEvent.setup();
    renderGameStart();

    await user.click(screen.getByRole("button", { name: "Начать игру" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Выберите козырь");
    expect(screen.getByRole("heading", { name: "Подготовка" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Игра" })).not.toBeInTheDocument();
    await waitFor(() => {
      expect(readCurrentGame()).toEqual({
        selectedPlayerIds: ["p2", "p1"],
        teamMode: false,
        gameStarted: false,
        currentTeamIds: { black: null, red: null },
        trump: null,
        dealerId: null,
        scores: {},
      });
    });
  });

  it("saves hearts and the dealer, then opens the game", async () => {
    seedStorage({ players, selectedPlayerIds: ["p2", "p1"] });
    const user = userEvent.setup();
    renderGameStart();

    await user.click(screen.getByRole("radio", { name: "черви" }));
    await user.click(screen.getByRole("button", { name: "Начать игру" }));

    expect(await screen.findByRole("heading", { name: "Игра" })).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "Подготовка" }),
    ).not.toBeInTheDocument();
    await waitFor(() => {
      expect(readCurrentGame()).toEqual({
        selectedPlayerIds: ["p2", "p1"],
        teamMode: false,
        gameStarted: true,
        currentTeamIds: { black: null, red: null },
        trump: "черви",
        dealerId: "p2",
        scores: {},
      });
    });
  });

  it.each([
    { label: "no players", selectedPlayerIds: [] as string[] },
    { label: "one player", selectedPlayerIds: ["p1"] },
  ])(
    "redirects to participants without a message when fewer than two players are selected ($label)",
    async ({ selectedPlayerIds }) => {
      seedStorage({ players, teamMode: true, selectedPlayerIds });
      renderGameStart();

      expect(
        await screen.findByRole("heading", { name: "Выберите участников" }),
      ).toBeInTheDocument();
      expect(
        screen.queryByRole("heading", { name: "Подготовка" }),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByText("Не удалось определить, кто раздаёт."),
      ).not.toBeInTheDocument();
      expect(readCurrentGame()).toEqual({
        selectedPlayerIds,
        teamMode: true,
        gameStarted: false,
        currentTeamIds: { black: null, red: null },
        trump: null,
        dealerId: null,
        scores: {},
      });
      expect(readPlayers()).toEqual(players);
    },
  );

  it("redirects to participants without a message when team mode has no formed teams", async () => {
    seedStorage({
      players,
      selectedPlayerIds: ["p1", "p2", "p3", "p4"],
      teamMode: true,
    });
    renderGameStart();

    expect(
      await screen.findByRole("heading", { name: "Выберите участников" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "Подготовка" }),
    ).not.toBeInTheDocument();
    expect(readCurrentGame().selectedPlayerIds).toEqual([
      "p1",
      "p2",
      "p3",
      "p4",
    ]);
  });
});
