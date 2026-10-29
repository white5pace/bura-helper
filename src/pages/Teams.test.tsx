import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { ParticipantsProvider } from "@/contexts/ParticipantsContext";
import {
  CURRENT_GAME_STORAGE_KEY,
  type CurrentGame,
} from "@/lib/currentGameStorage";
import type { Team } from "@/lib/teamPair";
import GameStart from "@/pages/GameStart";
import Teams from "@/pages/Teams";

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

function seedTeams({
  selectedPlayerIds = PLAYERS.map(({ id }) => id),
  teams = DEFAULT_CATALOG_TEAMS,
  currentTeamIds = { black: "t-black" as string | null, red: "t-red" as string | null },
} = {}) {
  localStorage.setItem("players", JSON.stringify(PLAYERS));
  localStorage.setItem("teams", JSON.stringify(teams));
  localStorage.setItem(
    CURRENT_GAME_STORAGE_KEY,
    JSON.stringify({
      selectedPlayerIds,
      teamMode: true,
      currentTeamIds,
    } satisfies CurrentGame),
  );
}

function readTeams(): Team[] {
  return JSON.parse(localStorage.getItem("teams") ?? "[]") as Team[];
}

function readCurrentTeamIds(): { black: string | null; red: string | null } {
  const game = JSON.parse(
    localStorage.getItem(CURRENT_GAME_STORAGE_KEY) ?? "{}",
  ) as Partial<CurrentGame>;
  return game.currentTeamIds ?? { black: null, red: null };
}

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
  it("распределяет игроков, предзаполняет и сохраняет названия по умолчанию", async () => {
    seedTeams();
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
      const current = readCurrentTeamIds();
      expect(current.black).toBeTruthy();
      expect(current.red).toBeTruthy();
    });
  });

  it("показывает ошибки и invalid-состояния для обоих коротких названий", async () => {
    seedTeams();
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
      screen.queryByRole("heading", { name: "Подготовка к игре" }),
    ).not.toBeInTheDocument();
  });

  it("сохраняет введённые названия и переходит к подготовке игры", async () => {
    seedTeams();
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
      await screen.findByRole("heading", { name: "Подготовка к игре" }),
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

  it("подставляет сохранённое имя для уже известного состава", async () => {
    seedTeams({
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

  it("узнаёт состав независимо от порядка выбора игроков", async () => {
    // Тот же состав чёрных (p1, p3), но выбран в другом порядке — p3 первым.
    seedTeams({
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

  it("перенаправляет на выбор участников, если игроков недостаточно", async () => {
    seedTeams({ selectedPlayerIds: ["p1", "p2", "p3"] });
    renderTeams();

    expect(
      await screen.findByRole("heading", { name: "Выберите участников" }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("form")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("textbox", { name: /Имя команды/ }),
    ).not.toBeInTheDocument();
  });
});
