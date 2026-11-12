import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
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
      currentTeamIds: { black: null, red: null },
      trump: null,
      dealerId: null,
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
          <Route path="/" element={<h1>Меню</h1>} />
        </Routes>
      </MemoryRouter>
    </ParticipantsProvider>,
  );
}

function expectUnknownDealer() {
  expect(screen.getByRole("heading", { name: "Подготовка" })).toBeInTheDocument();
  expect(screen.getByRole("alert")).toHaveTextContent(
    "Не удалось определить, кто раздаёт.",
  );
  expect(
    screen.getByRole("link", {
      name: "перейти по ссылке и начать новую игру",
    }),
  ).toBeInTheDocument();
  expect(screen.queryByText("Раздает:")).not.toBeInTheDocument();
  expect(screen.queryByRole("radio")).not.toBeInTheDocument();
  expect(
    screen.queryByRole("button", { name: "Начать игру" }),
  ).not.toBeInTheDocument();
  for (const player of PLAYERS) {
    expect(screen.queryByText(player.name)).not.toBeInTheDocument();
  }
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
        currentTeamIds: { black: null, red: null },
        trump: null,
        dealerId: null,
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
        currentTeamIds: { black: null, red: null },
        trump: "черви",
        dealerId: "p2",
      });
    });
  });

  it("без выбранных игроков показывает, что раздающего не определить", () => {
    seedParticipants();
    renderGameStart();

    expectUnknownDealer();
  });

  it("для неизвестного id показывает тот же экран без пустого имени", () => {
    seedParticipants({ selectedPlayerIds: ["missing"] });
    renderGameStart();

    expectUnknownDealer();
    expect(screen.queryByText("missing")).not.toBeInTheDocument();
  });

  it("ссылка сбрасывает партию и открывает меню", async () => {
    seedParticipants({ teamMode: true });
    const user = userEvent.setup();
    renderGameStart();

    await user.click(
      screen.getByRole("link", {
        name: "перейти по ссылке и начать новую игру",
      }),
    );

    expect(await screen.findByRole("heading", { name: "Меню" })).toBeInTheDocument();
    await waitFor(() => {
      expect(readCurrentGame()).toEqual(defaultCurrentGame());
    });
    expect(readPlayers()).toEqual(PLAYERS);
  });
});
