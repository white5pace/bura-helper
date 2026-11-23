import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { Toaster } from "@/components/ui/toast";
import { ParticipantsProvider } from "@/contexts/ParticipantsContext";
import { defaultCurrentGame } from "@/lib/currentGameStorage";
import RequireNotStarted from "@/layouts/RequireNotStarted";
import GameStart from "@/pages/GameStart";
import Participants from "@/pages/Participants";
import Teams from "@/pages/Teams";
import { readCurrentGame, readTeams, seedStorage } from "@/test/storage";

const FIVE_PLAYERS = [
  { id: "p1", name: "Алиса" },
  { id: "p2", name: "Боб" },
  { id: "p3", name: "Вася" },
  { id: "p4", name: "Галя" },
  { id: "p5", name: "Дима" },
];

// todo: extract routes into a shared component and a renderWithRouter helper
function renderParticipants() {
  return render(
    <ParticipantsProvider>
      <Toaster>
        <MemoryRouter initialEntries={["/participants"]}>
          <Routes>
            <Route element={<RequireNotStarted />}>
              <Route path="/participants" element={<Participants />} />
              <Route path="/teams" element={<Teams />} />
              <Route path="/game-start" element={<GameStart />} />
            </Route>
            <Route path="/game" element={<h1>Игра</h1>} />
          </Routes>
        </MemoryRouter>
      </Toaster>
    </ParticipantsProvider>,
  );
}

function checkboxFor(name: string) {
  return screen.getByRole("checkbox", { name });
}

describe("Participants page", () => {
  it("hides the selection counter until team mode is enabled", async () => {
    seedStorage({ players: FIVE_PLAYERS, selectedPlayerIds: ["p1", "p2"] });
    const user = userEvent.setup();
    renderParticipants();

    expect(
      screen.getByRole("switch", { name: "Командный режим" }),
    ).toHaveAttribute("aria-checked", "false");
    expect(screen.queryByText("2 из 4")).not.toBeInTheDocument();

    await user.click(screen.getByRole("switch", { name: "Командный режим" }));

    expect(
      screen.getByRole("switch", { name: "Командный режим" }),
    ).toHaveAttribute("aria-checked", "true");
    expect(screen.getByText("2 из 4")).toBeInTheDocument();
  });

  it("hides the selection counter when team mode is turned off", async () => {
    seedStorage({
      players: FIVE_PLAYERS,
      selectedPlayerIds: ["p1"],
      teamMode: true,
    });
    const user = userEvent.setup();
    renderParticipants();

    expect(screen.getByText("1 из 4")).toBeInTheDocument();

    await user.click(screen.getByRole("switch", { name: "Командный режим" }));

    expect(screen.queryByText("1 из 4")).not.toBeInTheDocument();
  });

  it("updates the counter when players are selected in team mode", async () => {
    seedStorage({ players: FIVE_PLAYERS, teamMode: true });
    const user = userEvent.setup();
    renderParticipants();

    expect(screen.getByText("0 из 4")).toBeInTheDocument();

    await user.click(checkboxFor("Алиса"));
    await user.click(checkboxFor("Вася"));

    expect(screen.getByText("2 из 4")).toBeInTheDocument();
    expect(checkboxFor("Алиса")).toHaveTextContent("1");
    expect(checkboxFor("Вася")).toHaveTextContent("2");
  });

  it("shows a toast and stays on the page when continuing in team mode without 4 players", async () => {
    seedStorage({
      players: FIVE_PLAYERS,
      selectedPlayerIds: ["p1", "p2"],
      teamMode: true,
    });
    const user = userEvent.setup();
    renderParticipants();

    await user.click(screen.getByRole("button", { name: "Продолжить" }));

    expect(
      await screen.findByText("Выберите четырёх игроков для командного режима"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Выберите участников" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "Названия команд" }),
    ).not.toBeInTheDocument();
  });

  it("navigates to /teams when continuing in team mode with 4 players", async () => {
    seedStorage({
      players: FIVE_PLAYERS,
      selectedPlayerIds: ["p1", "p2", "p3", "p4"],
      teamMode: true,
    });
    const user = userEvent.setup();
    renderParticipants();

    await user.click(screen.getByRole("button", { name: "Продолжить" }));

    expect(
      await screen.findByRole("heading", { name: "Команды" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByText("Выберите четырёх игроков для командного режима"),
    ).not.toBeInTheDocument();

    await waitFor(() => {
      const storedTeams = readTeams();
      expect(storedTeams).toEqual(
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
      expect(readCurrentGame().currentTeamIds.black).toBeTruthy();
      expect(readCurrentGame().currentTeamIds.red).toBeTruthy();
    });
  });

  it("navigates to /game-start when continuing without team mode", async () => {
    seedStorage({ players: FIVE_PLAYERS, selectedPlayerIds: ["p1"] });
    const user = userEvent.setup();
    renderParticipants();

    await user.click(screen.getByRole("button", { name: "Продолжить" }));

    expect(
      await screen.findByRole("heading", { name: "Подготовка" }),
    ).toBeInTheDocument();
  });

  it("disables unselected checkboxes at the limit and allows unchecking selected ones", async () => {
    seedStorage({
      players: FIVE_PLAYERS,
      selectedPlayerIds: ["p1", "p2", "p3", "p4"],
    });
    const user = userEvent.setup();
    renderParticipants();

    expect(checkboxFor("Алиса")).toBeChecked();
    expect(checkboxFor("Дима")).toHaveAttribute("aria-disabled", "true");
    expect(checkboxFor("Дима")).not.toBeChecked();

    await user.click(checkboxFor("Дима"));
    expect(checkboxFor("Дима")).not.toBeChecked();

    await user.click(checkboxFor("Боб"));

    expect(checkboxFor("Боб")).not.toBeChecked();
    expect(checkboxFor("Дима")).not.toHaveAttribute("aria-disabled", "true");

    await user.click(checkboxFor("Дима"));

    expect(checkboxFor("Дима")).toBeChecked();
    expect(checkboxFor("Боб")).toHaveAttribute("aria-disabled", "true");
  });

  it("applies team tone to even order numbers (2 and 4) in team mode", () => {
    seedStorage({
      players: FIVE_PLAYERS,
      selectedPlayerIds: ["p1", "p2", "p3", "p4"],
      teamMode: true,
    });
    renderParticipants();

    expect(checkboxFor("Алиса").className).toContain("data-checked:bg-primary");
    expect(checkboxFor("Алиса").className).not.toContain(
      "data-checked:bg-team",
    );
    expect(checkboxFor("Боб").className).toContain("data-checked:bg-team");
    expect(checkboxFor("Вася").className).toContain("data-checked:bg-primary");
    expect(checkboxFor("Вася").className).not.toContain("data-checked:bg-team");
    expect(checkboxFor("Галя").className).toContain("data-checked:bg-team");
  });

  it("keeps default checkbox tone when team mode is off", () => {
    seedStorage({
      players: FIVE_PLAYERS,
      selectedPlayerIds: ["p1", "p2", "p3", "p4"],
    });
    renderParticipants();

    for (const name of ["Алиса", "Боб", "Вася", "Галя"]) {
      expect(checkboxFor(name).className).toContain("data-checked:bg-primary");
      expect(checkboxFor(name).className).not.toContain("data-checked:bg-team");
    }
  });

  it("fills the saved black team name when the pair is selected in reverse order", async () => {
    seedStorage({
      players: FIVE_PLAYERS,
      teamMode: true,
      teams: [
        { id: "t1", name: "Старая гвардия", playerIds: ["p1", "p3"] },
        { id: "t2", name: "Новички", playerIds: ["p2", "p4"] },
      ],
    });
    const user = userEvent.setup();
    renderParticipants();

    // Vasya before Alisa: black is still p3+p1, but the click order is reversed.
    await user.click(checkboxFor("Вася"));
    await user.click(checkboxFor("Боб"));
    await user.click(checkboxFor("Алиса"));
    await user.click(checkboxFor("Галя"));
    await user.click(screen.getByRole("button", { name: "Продолжить" }));

    expect(
      await screen.findByRole("textbox", {
        name: "Имя команды чёрных (Вася, Алиса)",
      }),
    ).toHaveValue("Старая гвардия");
    expect(
      screen.getByRole("textbox", {
        name: "Имя команды красных (Боб, Галя)",
      }),
    ).toHaveValue("Новички");

    await waitFor(() => {
      const storedTeams = readTeams();
      expect(
        storedTeams.filter(
          (team) => team.playerIds[0] === "p1" && team.playerIds[1] === "p3",
        ),
      ).toHaveLength(1);
      expect(readCurrentGame().currentTeamIds.black).toBe("t1");
    });
  });

  it("reuses the saved team when that pair is seated as red", async () => {
    seedStorage({
      players: FIVE_PLAYERS,
      teamMode: true,
      teams: [{ id: "t1", name: "Старая гвардия", playerIds: ["p1", "p3"] }],
    });
    const user = userEvent.setup();
    renderParticipants();

    // 1 Bob, 2 Vasya, 3 Galya, 4 Alisa → red = Vasya+Alisa (p3+p1).
    await user.click(checkboxFor("Боб"));
    await user.click(checkboxFor("Вася"));
    await user.click(checkboxFor("Галя"));
    await user.click(checkboxFor("Алиса"));
    await user.click(screen.getByRole("button", { name: "Продолжить" }));

    expect(
      await screen.findByRole("textbox", {
        name: "Имя команды красных (Вася, Алиса)",
      }),
    ).toHaveValue("Старая гвардия");

    await waitFor(() => {
      expect(readCurrentGame().currentTeamIds.red).toBe("t1");
    });
  });

  it("opens a dialog without a selection warning when deleting an unselected player and removes only that player", async () => {
    seedStorage({ players: FIVE_PLAYERS, selectedPlayerIds: ["p1", "p2"] });
    const user = userEvent.setup();
    renderParticipants();

    await user.click(screen.getByRole("button", { name: "Удалить Дима" }));

    expect(
      await screen.findByRole("heading", { name: "Удалить игрока?" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Вы уверены, что хотите удалить игрока «Дима»\?/),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(/Вы удаляете выбранного игрока/),
    ).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Удалить" }));

    await waitFor(() => {
      expect(screen.queryByText("Дима")).not.toBeInTheDocument();
      expect(readCurrentGame().selectedPlayerIds).toEqual(["p1", "p2"]);
    });
  });

  it("warns and removes a selected player from the selection when the session is not committed", async () => {
    seedStorage({
      players: FIVE_PLAYERS,
      selectedPlayerIds: ["p1", "p2", "p3"],
    });
    const user = userEvent.setup();
    renderParticipants();

    await user.click(screen.getByRole("button", { name: "Удалить Боб" }));

    expect(
      await screen.findByText(
        /Вы удаляете выбранного игрока — он будет убран из текущего выбора\./,
      ),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Удалить" }));

    await waitFor(() => {
      expect(screen.queryByText("Боб")).not.toBeInTheDocument();
      expect(readCurrentGame().selectedPlayerIds).toEqual(["p1", "p3"]);
    });
  });

  it("warns that the current game will be reset and resets currentGame when deleting a selected player from a committed session", async () => {
    seedStorage({
      players: FIVE_PLAYERS,
      selectedPlayerIds: ["p1", "p2", "p3", "p4"],
      teamMode: true,
      teams: [
        { id: "t1", name: "Чёрные", playerIds: ["p1", "p3"] },
        { id: "t2", name: "Красные", playerIds: ["p2", "p4"] },
      ],
      currentTeamIds: { black: "t1", red: "t2" },
      gameStarted: false,
    });
    const user = userEvent.setup();
    renderParticipants();

    await user.click(screen.getByRole("button", { name: "Удалить Боб" }));

    expect(
      await screen.findByText(
        /Вы удаляете выбранного игрока — текущая игра будет сброшена\./,
      ),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Удалить" }));

    await waitFor(() => {
      expect(screen.queryByText("Боб")).not.toBeInTheDocument();
      expect(readCurrentGame()).toEqual(defaultCurrentGame());
    });
  });

  it("redirects to the game when it has already started and does not reset the session", async () => {
    seedStorage({
      players: FIVE_PLAYERS,
      selectedPlayerIds: ["p1", "p2", "p3", "p4"],
      teamMode: true,
      teams: [
        { id: "t1", name: "Чёрные", playerIds: ["p1", "p3"] },
        { id: "t2", name: "Красные", playerIds: ["p2", "p4"] },
      ],
      currentTeamIds: { black: "t1", red: "t2" },
      gameStarted: true,
      trump: "пики",
      dealerId: "p1",
      scores: { p1: 4, p2: 2 },
    });
    renderParticipants();

    expect(await screen.findByRole("heading", { name: "Игра" })).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "Выберите участников" }),
    ).not.toBeInTheDocument();
    expect(readCurrentGame()).toEqual({
      selectedPlayerIds: ["p1", "p2", "p3", "p4"],
      teamMode: true,
      gameStarted: true,
      currentTeamIds: { black: "t1", red: "t2" },
      trump: "пики",
      dealerId: "p1",
      scores: { p1: 4, p2: 2 },
    });
  });
});
