import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { defaultCurrentGame } from "@/lib/currentGameStorage";
import Home from "@/pages/Home";
import { renderWithRouter } from "@/test/router";
import {
  readCurrentGame,
  readPlayers,
  readTeams,
  seedStorage,
  TEST_PLAYERS,
  TEST_TEAMS,
} from "@/test/storage";

const players = TEST_PLAYERS.slice(0, 2);

const startedGame = {
  players,
  teams: TEST_TEAMS,
  selectedPlayerIds: ["p1", "p2"],
  gameStarted: true,
  trump: "пики" as const,
  dealerId: "p1",
  scores: { p1: 4 },
};

function renderHome() {
  return renderWithRouter(
    [
      { path: "/", element: <Home /> },
      { path: "/game", element: <h1>Игра</h1> },
      { path: "/participants", element: <h1>Выберите участников</h1> },
    ],
    { initialEntries: ["/"] },
  );
}

describe("Home page", () => {
  it("does not render Continue when the game has not started", () => {
    seedStorage({ players });
    renderHome();

    expect(
      screen.getByRole("button", { name: "Начать новую игру" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Продолжить" }),
    ).not.toBeInTheDocument();
  });

  it("renders Continue and navigates to /game when the game has started", async () => {
    seedStorage(startedGame);
    const user = userEvent.setup();
    renderHome();

    await user.click(screen.getByRole("button", { name: "Продолжить" }));

    expect(
      await screen.findByRole("heading", { name: "Игра" }),
    ).toBeInTheDocument();
  });

  it("resets currentGame and navigates to /participants without a dialog when the game has not started", async () => {
    seedStorage({
      players,
      teams: TEST_TEAMS,
      selectedPlayerIds: ["p1", "p2"],
    });
    const user = userEvent.setup();
    const { router } = renderHome();

    await user.click(screen.getByRole("button", { name: "Начать новую игру" }));

    expect(
      await screen.findByRole("heading", { name: "Выберите участников" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByText("Текущая партия будет сброшена."),
    ).not.toBeInTheDocument();
    expect(router.state.location.pathname).toBe("/participants");
    expect(readCurrentGame()).toEqual(defaultCurrentGame());
    expect(readPlayers()).toEqual(players);
    expect(readTeams()).toEqual(TEST_TEAMS);
  });

  it("asks for confirmation before resetting a started game and keeps the session on cancel", async () => {
    seedStorage(startedGame);
    const user = userEvent.setup();
    const { router } = renderHome();

    await user.click(screen.getByRole("button", { name: "Начать новую игру" }));

    expect(
      await screen.findByRole("heading", { name: "Начать новую игру" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Текущая партия будет сброшена/),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Отмена" }));

    expect(
      screen.queryByText(/Текущая партия будет сброшена/),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Продолжить" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "Выберите участников" }),
    ).not.toBeInTheDocument();
    expect(router.state.location.pathname).toBe("/");
    expect(readCurrentGame()).toEqual({
      selectedPlayerIds: ["p1", "p2"],
      teamMode: false,
      gameStarted: true,
      currentTeamIds: { black: null, red: null },
      trump: "пики",
      dealerId: "p1",
      scores: { p1: 4 },
    });
    expect(readPlayers()).toEqual(players);
    expect(readTeams()).toEqual(TEST_TEAMS);
  });

  it("resets currentGame and navigates to /participants after confirming a new game", async () => {
    seedStorage(startedGame);
    const user = userEvent.setup();
    const { router } = renderHome();

    await user.click(screen.getByRole("button", { name: "Начать новую игру" }));
    await user.click(await screen.findByRole("button", { name: "Начать" }));

    expect(
      await screen.findByRole("heading", { name: "Выберите участников" }),
    ).toBeInTheDocument();
    expect(router.state.location.pathname).toBe("/participants");
    expect(readCurrentGame()).toEqual(defaultCurrentGame());
    expect(readPlayers()).toEqual(players);
    expect(readTeams()).toEqual(TEST_TEAMS);
  });
});
