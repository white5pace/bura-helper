import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import type { Team } from "@/lib/teamPair";
import GameStart from "@/pages/GameStart";
import Teams from "@/pages/Teams";
import { renderWithRouter } from "@/test/router";
import {
  readCurrentGame,
  readTeams,
  seedStorage,
  TEST_PLAYERS,
  TEST_TEAMS,
  type SeedStorageOptions,
} from "@/test/storage";

const players = TEST_PLAYERS.slice(0, 4);

const DEFAULT_CATALOG_TEAMS: Team[] = [
  { id: "t-black", name: "Алиса + Вася", playerIds: ["p1", "p3"] },
  { id: "t-red", name: "Боб + Галя", playerIds: ["p2", "p4"] },
];

const teamsPageStorage = {
  players,
  selectedPlayerIds: players.map(({ id }) => id),
  teams: DEFAULT_CATALOG_TEAMS,
  teamMode: true,
  currentTeamIds: { black: "t-black", red: "t-red" },
} satisfies SeedStorageOptions;

const participantRedirects: { title: string; override: SeedStorageOptions }[] = [
  {
    title: "there are not enough players",
    override: {
      selectedPlayerIds: ["p1", "p2", "p3"],
      currentTeamIds: { black: null, red: null },
    },
  },
  {
    title: "team mode is off",
    override: {
      teamMode: false,
      currentTeamIds: { black: null, red: null },
    },
  },
  {
    title: "teams are not set",
    override: {
      currentTeamIds: { black: null, red: null },
    },
  },
];

function renderTeams() {
  return renderWithRouter(
    [
      { path: "/teams", element: <Teams /> },
      { path: "/participants", element: <h1>Выберите участников</h1> },
      { path: "/game-start", element: <GameStart /> },
    ],
    { initialEntries: ["/teams"] },
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
      teams: TEST_TEAMS,
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

  it.each(participantRedirects)(
    "redirects to participant selection when $title",
    async ({ override }) => {
      seedStorage({
        ...teamsPageStorage,
        ...override,
      });
      renderTeams();

      expect(
        await screen.findByRole("heading", { name: "Выберите участников" }),
      ).toBeInTheDocument();
      expect(screen.queryByRole("form")).not.toBeInTheDocument();
      expect(
        screen.queryByRole("textbox", { name: /Имя команды/ }),
      ).not.toBeInTheDocument();
    },
  );
});
