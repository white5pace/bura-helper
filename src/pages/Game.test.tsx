import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { ParticipantsProvider } from "@/contexts/ParticipantsContext";
import type { Team } from "@/lib/teamPair";
import Game from "@/pages/Game";
import { readCurrentGame, seedStorage } from "@/test/storage";

const PLAYERS = [
  { id: "p1", name: "Алиса" },
  { id: "p2", name: "Боб" },
  { id: "p3", name: "Вася" },
  { id: "p4", name: "Галя" },
];

const TEAMS: Team[] = [
  { id: "t1", name: "Чёрная гвардия", playerIds: ["p1", "p3"] },
  { id: "t2", name: "Красная стрела", playerIds: ["p2", "p4"] },
];

function renderGame() {
  return render(
    <ParticipantsProvider>
      <MemoryRouter initialEntries={["/game"]}>
        <Routes>
          <Route path="/game" element={<Game />} />
          <Route path="/round-end" element={<h1>Итоги раунда</h1>} />
          <Route path="/" element={<h1>Меню</h1>} />
        </Routes>
      </MemoryRouter>
    </ParticipantsProvider>,
  );
}

describe("Game page", () => {
  it("renders trump icon, player names, scores (with 0 fallback) and no team block in regular mode", () => {
    seedStorage({
      players: PLAYERS,
      selectedPlayerIds: ["p1", "p2"],
      gameStarted: true,
      trump: "пики",
      dealerId: "p2",
      scores: { p1: 12 },
    });
    renderGame();

    expect(screen.getByRole("img", { name: "пики" })).toBeInTheDocument();
    expect(screen.getByText("Алиса")).toBeInTheDocument();
    expect(screen.getByText("Боб")).toBeInTheDocument();

    const aliceSeat = screen.getByTestId("seat-p1");
    const bobSeat = screen.getByTestId("seat-p2");

    expect(within(aliceSeat).getByText("12")).toBeInTheDocument();
    expect(within(bobSeat).getByText("0")).toBeInTheDocument();
    expect(screen.queryByText("Команда:")).not.toBeInTheDocument();
  });

  it("renders dealer icon exactly once inside the dealer player card", () => {
    seedStorage({
      players: PLAYERS,
      selectedPlayerIds: ["p1", "p2", "p3", "p4"],
      gameStarted: true,
      trump: "пики",
      dealerId: "p3",
      scores: { p1: 4, p2: 2, p3: 6, p4: 0 },
    });
    renderGame();

    const dealerIcons = screen.getAllByRole("img", { name: "Раздает" });
    expect(dealerIcons).toHaveLength(1);

    const dealerSeat = screen.getByTestId("seat-p3");
    expect(
      within(dealerSeat).getByRole("img", { name: "Раздает" }),
    ).toBeInTheDocument();

    for (const otherId of ["p1", "p2", "p4"]) {
      expect(
        within(screen.getByTestId(`seat-${otherId}`)).queryByRole("img", {
          name: "Раздает",
        }),
      ).not.toBeInTheDocument();
    }
  });

  it("seats 2 players in bottom-right and top-left (rotated) corners", () => {
    seedStorage({
      players: PLAYERS,
      selectedPlayerIds: ["p1", "p2"],
      gameStarted: true,
      trump: "пики",
      dealerId: "p1",
    });
    renderGame();

    const firstSeat = screen.getByTestId("seat-p1");
    const secondSeat = screen.getByTestId("seat-p2");

    expect(firstSeat.className).toContain("right-0");
    expect(firstSeat.className).toContain("bottom-0");
    expect(firstSeat.className).not.toContain("rotate-180");

    expect(secondSeat.className).toContain("top-0");
    expect(secondSeat.className).toContain("left-0");
    expect(secondSeat.className).toContain("rotate-180");
  });

  it("seats 4 players with first two at bottom (not rotated) and 3rd/4th at top (rotated)", () => {
    seedStorage({
      players: PLAYERS,
      selectedPlayerIds: ["p1", "p2", "p3", "p4"],
      gameStarted: true,
      trump: "пики",
      dealerId: "p1",
    });
    renderGame();

    const seat1 = screen.getByTestId("seat-p1");
    const seat2 = screen.getByTestId("seat-p2");
    const seat3 = screen.getByTestId("seat-p3");
    const seat4 = screen.getByTestId("seat-p4");

    expect(seat1.className).toContain("bottom-0");
    expect(seat1.className).toContain("right-0");
    expect(seat1.className).not.toContain("rotate-180");

    expect(seat2.className).toContain("bottom-0");
    expect(seat2.className).toContain("left-0");
    expect(seat2.className).not.toContain("rotate-180");

    expect(seat3.className).toContain("top-0");
    expect(seat3.className).toContain("left-0");
    expect(seat3.className).toContain("rotate-180");

    expect(seat4.className).toContain("top-0");
    expect(seat4.className).toContain("right-0");
    expect(seat4.className).toContain("rotate-180");
  });

  it("renders team names and red team score styling in team mode", () => {
    seedStorage({
      players: PLAYERS,
      teams: TEAMS,
      selectedPlayerIds: ["p1", "p2", "p3", "p4"],
      teamMode: true,
      gameStarted: true,
      currentTeamIds: { black: "t1", red: "t2" },
      trump: "пики",
      dealerId: "p1",
      scores: { p1: 3, p2: 5, p3: 7, p4: 9 },
    });
    renderGame();

    for (const [playerId, scoreText] of [
      ["p1", "3"],
      ["p3", "7"],
    ] as const) {
      const seat = screen.getByTestId(`seat-${playerId}`);
      expect(within(seat).getByText("Команда:")).toBeInTheDocument();
      expect(within(seat).getByText("Чёрная гвардия")).toBeInTheDocument();
      expect(within(seat).getByText(scoreText).className).not.toContain(
        "text-team",
      );
    }

    for (const [playerId, scoreText] of [
      ["p2", "5"],
      ["p4", "9"],
    ] as const) {
      const seat = screen.getByTestId(`seat-${playerId}`);
      expect(within(seat).getByText("Команда:")).toBeInTheDocument();
      expect(within(seat).getByText("Красная стрела")).toBeInTheDocument();
      expect(within(seat).getByText(scoreText).className).toContain("text-team");
    }
  });

  it("opens round-end confirmation dialog, cancels back to /game, and navigates to /round-end on confirm", async () => {
    seedStorage({
      players: PLAYERS,
      selectedPlayerIds: ["p1", "p2"],
      gameStarted: true,
      trump: "пики",
      dealerId: "p1",
    });
    const user = userEvent.setup();
    renderGame();

    await user.click(screen.getByRole("button", { name: "Завершить раунд" }));

    expect(
      await screen.findByText("Вы уверены, что хотите закончить данный раунд?"),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Отмена" }));

    expect(
      screen.queryByText("Вы уверены, что хотите закончить данный раунд?"),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("img", { name: "пики" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Завершить раунд" }));
    await user.click(screen.getByRole("button", { name: "Завершить" }));

    expect(
      await screen.findByRole("heading", { name: "Итоги раунда" }),
    ).toBeInTheDocument();
  });

  it("redirects silently to / when gameStarted is false without resetting selectedPlayerIds", async () => {
    seedStorage({
      players: PLAYERS,
      selectedPlayerIds: ["p1", "p2"],
      gameStarted: false,
      trump: null,
      dealerId: null,
    });
    renderGame();

    expect(
      await screen.findByRole("heading", { name: "Меню" }),
    ).toBeInTheDocument();
    expect(readCurrentGame().selectedPlayerIds).toEqual(["p1", "p2"]);
  });
});
