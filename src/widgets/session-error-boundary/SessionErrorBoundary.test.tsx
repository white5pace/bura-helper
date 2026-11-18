import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Component, type ReactNode } from "react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { ParticipantsProvider } from "@/contexts/ParticipantsContext";
import {
  CURRENT_GAME_STORAGE_KEY,
  defaultCurrentGame,
  type CurrentGame,
} from "@/lib/currentGameStorage";
import type { Team } from "@/lib/teamPair";
import GameStart from "@/pages/GameStart";
import SessionErrorBoundary from "@/widgets/session-error-boundary/SessionErrorBoundary";

const PLAYERS = [
  { id: "p1", name: "Алиса" },
  { id: "p2", name: "Боб" },
  { id: "p3", name: "Вася" },
  { id: "p4", name: "Галя" },
];

const TEAMS: Team[] = [
  { id: "t1", name: "Старая гвардия", playerIds: ["p1", "p3"] },
];

const SESSION_ERROR_TEXT =
  "Не удалось загрузить текущую игру: данные сессии повреждены или участники были изменены.";

function seedBrokenSession() {
  localStorage.setItem("players", JSON.stringify(PLAYERS));
  localStorage.setItem("teams", JSON.stringify(TEAMS));
  localStorage.setItem(
    CURRENT_GAME_STORAGE_KEY,
    JSON.stringify({
      selectedPlayerIds: ["missing"],
      teamMode: false,
      gameStarted: false,
      currentTeamIds: { black: null, red: null },
      trump: null,
      dealerId: null,
      scores: {},
    } satisfies CurrentGame),
  );
}

function readCurrentGame(): CurrentGame {
  return JSON.parse(
    localStorage.getItem(CURRENT_GAME_STORAGE_KEY)!,
  ) as CurrentGame;
}

function readPlayers() {
  return JSON.parse(localStorage.getItem("players") ?? "[]") as typeof PLAYERS;
}

function readTeams() {
  return JSON.parse(localStorage.getItem("teams") ?? "[]") as Team[];
}

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
  it("восстанавливает сессию при CurrentGameValidationError и сохраняет игроков и команды", async () => {
    seedBrokenSession();
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
    expect(readPlayers()).toEqual(PLAYERS);
    expect(readTeams()).toEqual(TEAMS);

    await user.click(screen.getByRole("button", { name: "Начать новую игру" }));

    expect(
      await screen.findByRole("heading", { name: "Выберите участников" }),
    ).toBeInTheDocument();
    expect(readCurrentGame()).toEqual(defaultCurrentGame());
    expect(readPlayers()).toEqual(PLAYERS);
    expect(readTeams()).toEqual(TEAMS);
  });

  it("вызывает переданный колбэк onReset при нажатии «Начать новую игру»", async () => {
    seedBrokenSession();
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

  it("пробрасывает постороннюю ошибку Error наружу", () => {
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
