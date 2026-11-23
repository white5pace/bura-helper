import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Component, type ReactNode } from "react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { ParticipantsProvider } from "@/contexts/ParticipantsContext";
import { defaultCurrentGame } from "@/lib/currentGameStorage";
import GameStart from "@/pages/GameStart";
import {
  readCurrentGame,
  readPlayers,
  readTeams,
  seedStorage,
  TEST_PLAYERS,
  TEST_TEAMS,
} from "@/test/storage";
import SessionErrorBoundary from "@/widgets/session-error-boundary/SessionErrorBoundary";

const players = TEST_PLAYERS.slice(0, 4);

const SESSION_ERROR_TEXT =
  "Не удалось загрузить текущую игру: данные сессии повреждены или участники были изменены.";

class ProbeBoundary extends Component<
  { children: ReactNode },
  { message: string | null }
> {
  state = { message: null as string | null };

  static getDerivedStateFromError(error: Error) {
    return { message: error.message };
  }

  render() {
    if (this.state.message) {
      return <p>{this.state.message}</p>;
    }
    return this.props.children;
  }
}

function Crash(): ReactNode {
  throw new Error("Посторонняя ошибка отрисовки");
}

describe("SessionErrorBoundary", () => {
  it("recovers the session on CurrentGameValidationError and keeps players and teams", async () => {
    seedStorage({
      players,
      teams: TEST_TEAMS,
      selectedPlayerIds: ["missing"],
    });
    const user = userEvent.setup();
    render(
      <SessionErrorBoundary>
        <ParticipantsProvider>
          <MemoryRouter initialEntries={["/game-start"]}>
            <Routes>
              <Route path="/game-start" element={<GameStart />} />
              <Route
                path="/participants"
                element={<h1>Выберите участников</h1>}
              />
              <Route path="/" element={<h1>Меню</h1>} />
            </Routes>
          </MemoryRouter>
        </ParticipantsProvider>
      </SessionErrorBoundary>,
    );

    expect(screen.getByText(SESSION_ERROR_TEXT)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Начать новую игру" }),
    ).toBeInTheDocument();
    expect(readPlayers()).toEqual(players);
    expect(readTeams()).toEqual(TEST_TEAMS);

    await user.click(screen.getByRole("button", { name: "Начать новую игру" }));

    expect(
      await screen.findByRole("heading", { name: "Выберите участников" }),
    ).toBeInTheDocument();
    expect(readCurrentGame()).toEqual(defaultCurrentGame());
    expect(readPlayers()).toEqual(players);
    expect(readTeams()).toEqual(TEST_TEAMS);
  });

  it("calls the provided onReset callback when starting a new game", async () => {
    seedStorage({
      players,
      teams: TEST_TEAMS,
      selectedPlayerIds: ["missing"],
    });
    const onReset = vi.fn();
    const user = userEvent.setup();

    render(
      <SessionErrorBoundary onReset={onReset}>
        <ParticipantsProvider>
          <MemoryRouter initialEntries={["/game-start"]}>
            <Routes>
              <Route path="/game-start" element={<GameStart />} />
              <Route
                path="/participants"
                element={<h1>Выберите участников</h1>}
              />
            </Routes>
          </MemoryRouter>
        </ParticipantsProvider>
      </SessionErrorBoundary>,
    );

    await user.click(screen.getByRole("button", { name: "Начать новую игру" }));

    expect(onReset).toHaveBeenCalledTimes(1);
    expect(
      await screen.findByRole("heading", { name: "Выберите участников" }),
    ).toBeInTheDocument();
  });

  it("rethrows an unrelated Error", () => {
    render(
      <ProbeBoundary>
        <SessionErrorBoundary>
          <Crash />
        </SessionErrorBoundary>
      </ProbeBoundary>,
    );

    expect(screen.getByText("Посторонняя ошибка отрисовки")).toBeInTheDocument();
    expect(screen.queryByText(SESSION_ERROR_TEXT)).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Начать новую игру" }),
    ).not.toBeInTheDocument();
  });
});
