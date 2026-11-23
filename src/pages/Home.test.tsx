import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { ParticipantsProvider } from "@/contexts/ParticipantsContext";
import { defaultCurrentGame } from "@/lib/currentGameStorage";
import Home from "@/pages/Home";
import { readCurrentGame, seedStorage } from "@/test/storage";

const PLAYERS = [{ id: "p1", name: "Алиса" }];

const STARTED_GAME = {
  players: PLAYERS,
  selectedPlayerIds: ["p1"],
  gameStarted: true,
  trump: "пики" as const,
  dealerId: "p1",
  scores: { p1: 4 },
};

function renderHome() {
  return render(
    <ParticipantsProvider>
      <MemoryRouter initialEntries={["/"]}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/game" element={<h1>Игра</h1>} />
          <Route path="/participants" element={<h1>Выберите участников</h1>} />
        </Routes>
      </MemoryRouter>
    </ParticipantsProvider>,
  );
}

describe("Home page", () => {
  it("does not render Continue when the game has not started", () => {
    seedStorage({ players: PLAYERS });
    renderHome();

    expect(
      screen.getByRole("button", { name: "Начать новую игру" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Продолжить" }),
    ).not.toBeInTheDocument();
  });

  it("renders Continue and navigates to /game when the game has started", async () => {
    seedStorage(STARTED_GAME);
    const user = userEvent.setup();
    renderHome();

    await user.click(screen.getByRole("button", { name: "Продолжить" }));

    expect(
      await screen.findByRole("heading", { name: "Игра" }),
    ).toBeInTheDocument();
  });

  it("resets currentGame to defaults and navigates to /participants when starting a new game", async () => {
    seedStorage(STARTED_GAME);
    const user = userEvent.setup();
    renderHome();

    await user.click(screen.getByRole("button", { name: "Начать новую игру" }));

    expect(
      await screen.findByRole("heading", { name: "Выберите участников" }),
    ).toBeInTheDocument();
    expect(readCurrentGame()).toEqual(defaultCurrentGame());
  });
});
