import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { ParticipantsProvider } from "@/contexts/ParticipantsContext";
import GameStart from "@/pages/GameStart";
import { readCurrentGame, readPlayers, seedStorage } from "@/test/storage";

const PLAYERS = [
  { id: "p1", name: "Алиса" },
  { id: "p2", name: "Боб" },
  { id: "p3", name: "Вася" },
  { id: "p4", name: "Галя" },
];

const SUITS = ["крести", "пики", "черви", "буби"] as const;

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

describe("GameStart page", () => {
  it("shows the first selected player as dealer and leaves the suit unselected", () => {
    seedStorage({ players: PLAYERS, selectedPlayerIds: ["p2", "p1"] });
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
    seedStorage({ players: PLAYERS, selectedPlayerIds: ["p2", "p1"] });
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
    seedStorage({ players: PLAYERS, selectedPlayerIds: ["p2", "p1"] });
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

  it("redirects to participants without a message when no players are selected", async () => {
    seedStorage({ players: PLAYERS, teamMode: true });
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

  it("redirects to participants without a message when team mode has no formed teams", async () => {
    seedStorage({
      players: PLAYERS,
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
