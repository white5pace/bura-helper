import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Component, type ReactNode } from "react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it } from "vitest";
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

const SUITS = ["крести", "пики", "черви", "буби"] as const;

function seedParticipants({
  players = PLAYERS,
  selectedPlayerIds = [] as string[],
  teamMode = false,
  teams = [] as Team[],
} = {}) {
  localStorage.setItem("players", JSON.stringify(players));
  localStorage.setItem("teams", JSON.stringify(teams));
  localStorage.setItem(
    CURRENT_GAME_STORAGE_KEY,
    JSON.stringify({
      selectedPlayerIds,
      teamMode,
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

function renderGameStart() {
  return render(
    <ParticipantsProvider>
      <MemoryRouter initialEntries={["/game-start"]}>
        <Routes>
          <Route path="/game-start" element={<GameStart />} />
          <Route path="/game" element={<h1>Игра</h1>} />
          <Route path="/participants" element={<h1>Выберите участников</h1>} />
          <Route path="/" element={<h1>Меню</h1>} />
        </Routes>
      </MemoryRouter>
    </ParticipantsProvider>,
  );
}

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

function Crash() {
  throw new Error("Посторонняя ошибка отрисовки");
}

describe("GameStart page", () => {
  it("показывает раздающим первого выбранного и не выбирает масть", () => {
    seedParticipants({ selectedPlayerIds: ["p2", "p1"] });
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
    expect(
      screen.queryByText(/Не удалось определить, кто раздаёт/),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", {
        name: "перейти по ссылке и начать новую игру",
      }),
    ).not.toBeInTheDocument();
  });

  it("без козыря остаётся на странице и не записывает партию", async () => {
    seedParticipants({ selectedPlayerIds: ["p2", "p1"] });
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

  it("записывает выбранные черви и раздающего и открывает игру", async () => {
    seedParticipants({ selectedPlayerIds: ["p2", "p1"] });
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

  it("без выбранных игроков тихо перенаправляет на участников", async () => {
    seedParticipants({ teamMode: true });
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
      selectedPlayerIds: [],
      teamMode: true,
      gameStarted: false,
      currentTeamIds: { black: null, red: null },
      trump: null,
      dealerId: null,
      scores: {},
    });
    expect(readPlayers()).toEqual(PLAYERS);
  });

  it("для неизвестного id показывает ошибку сессии", async () => {
    seedParticipants({ selectedPlayerIds: ["missing"] });
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
    expect(screen.queryByText("missing")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "Подготовка" }),
    ).not.toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: "Начать новую игру" }),
    );

    expect(
      await screen.findByRole("heading", { name: "Выберите участников" }),
    ).toBeInTheDocument();
    expect(readCurrentGame()).toEqual(defaultCurrentGame());
    expect(readPlayers()).toEqual(PLAYERS);
  });

  it("пробрасывает постороннюю ошибку из SessionErrorBoundary", () => {
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
