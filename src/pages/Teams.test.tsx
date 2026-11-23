import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { ParticipantsProvider } from "@/contexts/ParticipantsContext";
import type { Team } from "@/lib/teamPair";
import GameStart from "@/pages/GameStart";
import Teams from "@/pages/Teams";
import {
  readCurrentGame,
  readTeams,
  seedStorage,
  type SeedStorageOptions,
} from "@/test/storage";

const PLAYERS = [
  { id: "p1", name: "Алиса" },
  { id: "p2", name: "Боб" },
  { id: "p3", name: "Вася" },
  { id: "p4", name: "Галя" },
];

const DEFAULT_CATALOG_TEAMS: Team[] = [
  { id: "t-black", name: "Алиса + Вася", playerIds: ["p1", "p3"] },
  { id: "t-red", name: "Боб + Галя", playerIds: ["p2", "p4"] },
];

const teamsPageStorage = {
  players: PLAYERS,
  selectedPlayerIds: PLAYERS.map(({ id }) => id),
  teams: DEFAULT_CATALOG_TEAMS,
  teamMode: true,
  currentTeamIds: { black: "t-black", red: "t-red" },
} satisfies SeedStorageOptions;

function renderTeams() {
  return render(
    <ParticipantsProvider>
      <MemoryRouter initialEntries={["/teams"]}>
        <Routes>
          <Route path="/teams" element={<Teams />} />
          <Route path="/participants" element={<h1>Выберите участников</h1>} />
          <Route path="/game-start" element={<GameStart />} />
        </Routes>
      </MemoryRouter>
    </ParticipantsProvider>,
  );
}

describe("Teams page", () => {
  it("assigns players, prefills default names, and saves them", async () => {
    seedStorage(teamsPageStorage);
    renderTeams();

    expect(
      await screen.findByRole("textbox", {
        name: "Имя команды чёрных (Алиса, Вася)",
      }),
    ).toHaveValue("Алиса + Вася");
    expect(
      screen.getByRole("textbox", {
        name: "Имя команды красных (Боб, Галя)",
      }),
    ).toHaveValue("Боб + Галя");

    await waitFor(() => {
      const teams = readTeams();
      expect(teams).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            name: "Алиса + Вася",
            playerIds: ["p1", "p3"],
          }),
          expect.objectContaining({
            name: "Боб + Галя",
            playerIds: ["p2", "p4"],
          }),
        ]),
      );
      const current = readCurrentGame().currentTeamIds;
      expect(current.black).toBeTruthy();
      expect(current.red).toBeTruthy();
    });
  });

  it("shows errors and invalid state for both short names", async () => {
    seedStorage(teamsPageStorage);
    const user = userEvent.setup();
    renderTeams();

    const blackInput = await screen.findByRole("textbox", {
      name: "Имя команды чёрных (Алиса, Вася)",
    });
    const redInput = screen.getByRole("textbox", {
      name: "Имя команды красных (Боб, Галя)",
    });

    await user.clear(blackInput);
    await user.type(blackInput, "Я");
    await user.clear(redInput);
    await user.type(redInput, "  ");
    await user.click(screen.getByRole("button", { name: "Продолжить" }));

    expect(
      await screen.findAllByText(
        "Название команды должно содержать минимум 3 символа.",
      ),
    ).toHaveLength(2);
    expect(blackInput).toHaveAttribute("aria-invalid", "true");
    expect(redInput).toHaveAttribute("aria-invalid", "true");
    expect(blackInput.closest('[data-slot="field"]')).toHaveAttribute(
      "data-invalid",
      "true",
    );
    expect(redInput.closest('[data-slot="field"]')).toHaveAttribute(
      "data-invalid",
      "true",
    );
    expect(
      screen.queryByRole("heading", { name: "Подготовка" }),
    ).not.toBeInTheDocument();
  });

  it("saves entered names and continues to game setup", async () => {
    seedStorage(teamsPageStorage);
    const user = userEvent.setup();
    renderTeams();

    const blackInput = await screen.findByRole("textbox", {
      name: "Имя команды чёрных (Алиса, Вася)",
    });
    const redInput = screen.getByRole("textbox", {
      name: "Имя команды красных (Боб, Галя)",
    });

    await user.clear(blackInput);
    await user.type(blackInput, "Молния");
    await user.clear(redInput);
    await user.type(redInput, "Огонь");
    await user.click(screen.getByRole("button", { name: "Продолжить" }));

    expect(
      await screen.findByRole("heading", { name: "Подготовка" }),
    ).toBeInTheDocument();
    await waitFor(() => {
      const teams = readTeams();
      expect(teams).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            name: "Молния",
            playerIds: ["p1", "p3"],
          }),
          expect.objectContaining({
            name: "Огонь",
            playerIds: ["p2", "p4"],
          }),
        ]),
      );
    });
  });

  it("fills the saved name for an already known lineup", async () => {
    seedStorage({
      ...teamsPageStorage,
      teams: [
        { id: "t1", name: "Старая гвардия", playerIds: ["p1", "p3"] },
        { id: "t2", name: "Новички", playerIds: ["p2", "p4"] },
      ],
      currentTeamIds: { black: "t1", red: "t2" },
    });
    renderTeams();

    expect(
      await screen.findByRole("textbox", {
        name: "Имя команды чёрных (Алиса, Вася)",
      }),
    ).toHaveValue("Старая гвардия");
    expect(
      screen.getByRole("textbox", {
        name: "Имя команды красных (Боб, Галя)",
      }),
    ).toHaveValue("Новички");
  });

  it("recognizes a lineup regardless of player selection order", async () => {
    // Same black lineup (p1, p3), selected in a different order — p3 first.
    seedStorage({
      ...teamsPageStorage,
      selectedPlayerIds: ["p3", "p2", "p1", "p4"],
      teams: [
        { id: "t1", name: "Старая гвардия", playerIds: ["p1", "p3"] },
        { id: "t2", name: "Боб + Галя", playerIds: ["p2", "p4"] },
      ],
      currentTeamIds: { black: "t1", red: "t2" },
    });
    renderTeams();

    expect(
      await screen.findByRole("textbox", {
        name: "Имя команды чёрных (Вася, Алиса)",
      }),
    ).toHaveValue("Старая гвардия");
  });

  it("redirects to participant selection when there are not enough players", async () => {
    seedStorage({
      ...teamsPageStorage,
      selectedPlayerIds: ["p1", "p2", "p3"],
      currentTeamIds: { black: null, red: null },
    });
    renderTeams();

    expect(
      await screen.findByRole("heading", { name: "Выберите участников" }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("form")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("textbox", { name: /Имя команды/ }),
    ).not.toBeInTheDocument();
  });

  it("redirects to participant selection when team mode is off", async () => {
    seedStorage({
      ...teamsPageStorage,
      teamMode: false,
      currentTeamIds: { black: null, red: null },
    });
    renderTeams();

    expect(
      await screen.findByRole("heading", { name: "Выберите участников" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("textbox", { name: /Имя команды/ }),
    ).not.toBeInTheDocument();
  });

  it("redirects to participant selection when teams are not set", async () => {
    seedStorage({
      ...teamsPageStorage,
      currentTeamIds: { black: null, red: null },
    });
    renderTeams();

    expect(
      await screen.findByRole("heading", { name: "Выберите участников" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("textbox", { name: /Имя команды/ }),
    ).not.toBeInTheDocument();
  });
});
