import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { Toaster } from "@/components/ui/toast";
import { ParticipantsProvider } from "@/contexts/ParticipantsContext";
import GameStart from "@/pages/GameStart";
import Participants from "@/pages/Participants";
import Teams from "@/pages/Teams";

const FIVE_PLAYERS = [
  { id: "p1", name: "Алиса" },
  { id: "p2", name: "Боб" },
  { id: "p3", name: "Вася" },
  { id: "p4", name: "Галя" },
  { id: "p5", name: "Дима" },
];

function seedParticipants({
  players = FIVE_PLAYERS,
  selectedPlayerIds = [] as string[],
  teamMode = false,
} = {}) {
  localStorage.setItem("players", JSON.stringify(players));
  localStorage.setItem("selectedPlayerIds", JSON.stringify(selectedPlayerIds));
  localStorage.setItem("teamMode", JSON.stringify(teamMode));
}

function renderParticipants() {
  return render(
    <ParticipantsProvider>
      <Toaster>
        <MemoryRouter initialEntries={["/participants"]}>
          <Routes>
            <Route path="/participants" element={<Participants />} />
            <Route path="/teams" element={<Teams />} />
            <Route path="/game-start" element={<GameStart />} />
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
    seedParticipants({ selectedPlayerIds: ["p1", "p2"] });
    const user = userEvent.setup();
    renderParticipants();

    expect(screen.getByRole("switch", { name: "Командный режим" })).toHaveAttribute(
      "aria-checked",
      "false",
    );
    expect(screen.queryByText("2 из 4")).not.toBeInTheDocument();

    await user.click(screen.getByRole("switch", { name: "Командный режим" }));

    expect(screen.getByRole("switch", { name: "Командный режим" })).toHaveAttribute(
      "aria-checked",
      "true",
    );
    expect(screen.getByText("2 из 4")).toBeInTheDocument();
  });

  it("hides the selection counter when team mode is turned off", async () => {
    seedParticipants({ selectedPlayerIds: ["p1"], teamMode: true });
    const user = userEvent.setup();
    renderParticipants();

    expect(screen.getByText("1 из 4")).toBeInTheDocument();

    await user.click(screen.getByRole("switch", { name: "Командный режим" }));

    expect(screen.queryByText("1 из 4")).not.toBeInTheDocument();
  });

  it("updates the counter when players are selected in team mode", async () => {
    seedParticipants({ teamMode: true });
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
    seedParticipants({ selectedPlayerIds: ["p1", "p2"], teamMode: true });
    const user = userEvent.setup();
    renderParticipants();

    await user.click(screen.getByRole("button", { name: "Продолжить" }));

    expect(
      await screen.findByText("Выберите четырёх игроков для командного режима"),
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Выберите участников" })).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "Названия команд" }),
    ).not.toBeInTheDocument();
  });

  it("navigates to /teams when continuing in team mode with 4 players", async () => {
    seedParticipants({
      selectedPlayerIds: ["p1", "p2", "p3", "p4"],
      teamMode: true,
    });
    const user = userEvent.setup();
    renderParticipants();

    await user.click(screen.getByRole("button", { name: "Продолжить" }));

    expect(
      await screen.findByRole("heading", { name: "Названия команд" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByText("Выберите четырёх игроков для командного режима"),
    ).not.toBeInTheDocument();
  });

  it("navigates to /game-start when continuing without team mode", async () => {
    seedParticipants({ selectedPlayerIds: ["p1"] });
    const user = userEvent.setup();
    renderParticipants();

    await user.click(screen.getByRole("button", { name: "Продолжить" }));

    expect(
      await screen.findByRole("heading", { name: "Подготовка к игре" }),
    ).toBeInTheDocument();
  });

  it("disables unselected checkboxes at the limit and allows unchecking selected ones", async () => {
    seedParticipants({ selectedPlayerIds: ["p1", "p2", "p3", "p4"] });
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
    seedParticipants({
      selectedPlayerIds: ["p1", "p2", "p3", "p4"],
      teamMode: true,
    });
    renderParticipants();

    expect(checkboxFor("Алиса").className).toContain("data-checked:bg-primary");
    expect(checkboxFor("Алиса").className).not.toContain("data-checked:bg-team");
    expect(checkboxFor("Боб").className).toContain("data-checked:bg-team");
    expect(checkboxFor("Вася").className).toContain("data-checked:bg-primary");
    expect(checkboxFor("Вася").className).not.toContain("data-checked:bg-team");
    expect(checkboxFor("Галя").className).toContain("data-checked:bg-team");
  });

  it("keeps default checkbox tone when team mode is off", () => {
    seedParticipants({ selectedPlayerIds: ["p1", "p2", "p3", "p4"] });
    renderParticipants();

    for (const name of ["Алиса", "Боб", "Вася", "Галя"]) {
      expect(checkboxFor(name).className).toContain("data-checked:bg-primary");
      expect(checkboxFor(name).className).not.toContain("data-checked:bg-team");
    }
  });
});
