import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import RoundEnd from "@/pages/RoundEnd";
import { renderWithRouter } from "@/test/router";
import {
  readCurrentGame,
  readPlayers,
  readTeams,
  seedStorage,
  TEST_PLAYERS,
  TEST_TEAMS,
  type SeedStorageOptions,
} from "@/test/storage";

const PENALTY_OPTIONS = ["0", "2", "4", "6", "8", "12"] as const;
const SUITS = ["крести", "пики", "черви", "буби"] as const;

const ONE_SIDE_PENALTY_MESSAGE =
  "Штрафные очки больше 0 можно указать только для одной стороны";

const EMPTY_GAME = {
  selectedPlayerIds: [],
  teamMode: false,
  gameStarted: false,
  currentTeamIds: { black: null, red: null },
  trump: null,
  dealerId: null,
  scores: {},
};

function renderRoundEnd() {
  return renderWithRouter(
    [
      { path: "/round-end", element: <RoundEnd /> },
      { path: "/game", element: <h1>Игра</h1> },
      { path: "/", element: <h1>Меню</h1> },
    ],
    { initialEntries: ["/round-end"] },
  );
}

function seedRound(overrides: SeedStorageOptions = {}) {
  seedStorage({
    players: TEST_PLAYERS,
    teams: TEST_TEAMS,
    selectedPlayerIds: ["p1", "p2"],
    gameStarted: true,
    trump: "пики",
    dealerId: "p1",
    scores: { p1: 0, p2: 0 },
    ...overrides,
  });
}

function penaltyRow(label: string) {
  const labelEl = screen.getByText(label);
  const field = labelEl.closest('[role="group"]');
  if (!(field instanceof HTMLElement)) {
    throw new Error(`Penalty row not found: ${label}`);
  }
  return within(field);
}

function expectPenaltyRadios(label: string) {
  const radios = penaltyRow(label).getAllByRole("radio");
  expect(radios).toHaveLength(PENALTY_OPTIONS.length);
  PENALTY_OPTIONS.forEach((option, index) => {
    expect(radios[index]).toHaveAccessibleName(option);
  });
  expect(radios[0]).toBeChecked();
  for (const radio of radios.slice(1)) {
    expect(radio).not.toBeChecked();
  }
}

describe("RoundEnd page", () => {
  it("shows the round title, penalty radios, and the switch to number input", () => {
    seedRound({
      selectedPlayerIds: ["p1", "p2"],
      scores: { p1: 4, p2: 0 },
    });
    renderRoundEnd();

    expect(
      screen.getByRole("heading", { name: "Штрафные очки за раунд" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Ввод числом" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Радиокнопки" }),
    ).not.toBeInTheDocument();
    expect(document.querySelector('input[type="number"]')).toBeNull();

    expect(screen.getByText("Алиса (4)")).toBeInTheDocument();
    expect(screen.getByText("Боб (0)")).toBeInTheDocument();
    expect(screen.queryByText("Старая гвардия")).not.toBeInTheDocument();
    expect(screen.queryByText("Новички")).not.toBeInTheDocument();
    expectPenaltyRadios("Алиса (4)");
    expectPenaltyRadios("Боб (0)");

    expect(screen.getByText("Козырь")).toBeInTheDocument();
    const trumpRadios = SUITS.map((suit) =>
      screen.getByRole("radio", { name: suit }),
    );
    expect(trumpRadios.every((radio) => !radio.checked)).toBe(true);
    expect(
      screen.getByRole("button", { name: "Продолжить" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Закончить" }),
    ).not.toBeInTheDocument();
  });

  it("lists both teams with the side score and recalculates the label", async () => {
    seedRound({
      selectedPlayerIds: ["p1", "p2", "p3", "p4"],
      teamMode: true,
      currentTeamIds: { black: "t1", red: "t2" },
      scores: { t1: 6, t2: 5 },
    });
    const user = userEvent.setup();
    renderRoundEnd();

    expect(screen.getByText("Старая гвардия (6)")).toBeInTheDocument();
    expect(screen.getByText("Новички (5)")).toBeInTheDocument();
    expect(screen.queryByText(/Алиса|Боб|Вася|Галя/)).not.toBeInTheDocument();
    expectPenaltyRadios("Старая гвардия (6)");
    expectPenaltyRadios("Новички (5)");

    await user.click(
      penaltyRow("Старая гвардия (6)").getByRole("radio", { name: "4" }),
    );

    const updated = screen.getByText("Старая гвардия (10)");
    expect(updated).toBeInTheDocument();
    expect(updated).not.toHaveClass("text-team");
    expect(penaltyRow("Старая гвардия (10)").getByRole("radio", { name: "4" })).toBeChecked();
    expect(screen.getByText("Новички (5)")).toBeInTheDocument();
  });

  it("requires a trump before continuing when every total stays under 12", async () => {
    seedRound({ scores: { p1: 4, p2: 2 } });
    const user = userEvent.setup();
    renderRoundEnd();

    await user.click(
      penaltyRow("Алиса (4)").getByRole("radio", { name: "6" }),
    );
    await user.click(screen.getByRole("button", { name: "Продолжить" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Выберите козырь");
    expect(
      screen.getByRole("heading", { name: "Штрафные очки за раунд" }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Игра" })).not.toBeInTheDocument();
    expect(readCurrentGame()).toMatchObject({
      trump: "пики",
      dealerId: "p1",
      scores: { p1: 4, p2: 2 },
    });
  });

  it("rejects a penalty above 0 on more than one side for both continue and finish", async () => {
    seedRound({ scores: { p1: 4, p2: 2 } });
    const user = userEvent.setup();
    renderRoundEnd();

    await user.click(penaltyRow("Алиса (4)").getByRole("radio", { name: "2" }));
    await user.click(penaltyRow("Боб (2)").getByRole("radio", { name: "2" }));
    await user.click(screen.getByRole("radio", { name: "крести" }));
    await user.click(screen.getByRole("button", { name: "Продолжить" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      ONE_SIDE_PENALTY_MESSAGE,
    );
    expect(
      screen.getByRole("heading", { name: "Штрафные очки за раунд" }),
    ).toBeInTheDocument();
    expect(readCurrentGame()).toMatchObject({
      trump: "пики",
      dealerId: "p1",
      scores: { p1: 4, p2: 2 },
    });
  });

  it("rejects two charged sides on finish when one of them has already reached 12", async () => {
    seedRound({ scores: { p1: 10, p2: 4 } });
    const before = {
      trump: "пики" as const,
      dealerId: "p1",
      scores: { p1: 10, p2: 4 },
      gameStarted: true,
    };
    const user = userEvent.setup();
    renderRoundEnd();

    await user.click(penaltyRow("Алиса (10)").getByRole("radio", { name: "2" }));

    expect(screen.getByText("Алиса (12)")).toHaveClass("text-team");
    expect(screen.queryByText("Козырь")).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Закончить" }),
    ).toBeInTheDocument();

    await user.click(penaltyRow("Боб (4)").getByRole("radio", { name: "2" }));
    await user.click(screen.getByRole("button", { name: "Закончить" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      ONE_SIDE_PENALTY_MESSAGE,
    );
    expect(
      screen.getByRole("heading", { name: "Штрафные очки за раунд" }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Меню" })).not.toBeInTheDocument();
    expect(readCurrentGame()).toMatchObject(before);
    expect(readPlayers()).toEqual(TEST_PLAYERS);
    expect(readTeams()).toEqual(TEST_TEAMS);
  });

  it("accepts all-zero penalties, keeps the scores, and only rotates trump and dealer", async () => {
    seedRound({
      selectedPlayerIds: ["p3", "p1", "p2"],
      scores: { p3: 4, p1: 4, p2: 4 },
      dealerId: "p2",
      trump: "пики",
    });
    const user = userEvent.setup();
    renderRoundEnd();

    expect(screen.getByText("Вася (4)")).toBeInTheDocument();
    expect(screen.getByText("Алиса (4)")).toBeInTheDocument();
    expect(screen.getByText("Боб (4)")).toBeInTheDocument();

    await user.click(screen.getByRole("radio", { name: "черви" }));
    await user.click(screen.getByRole("button", { name: "Продолжить" }));

    expect(await screen.findByRole("heading", { name: "Игра" })).toBeInTheDocument();
    await waitFor(() => {
      expect(readCurrentGame()).toMatchObject({
        selectedPlayerIds: ["p3", "p1", "p2"],
        teamMode: false,
        gameStarted: true,
        trump: "черви",
        dealerId: "p3",
        scores: { p3: 4, p1: 4, p2: 4 },
      });
    });
    expect(readPlayers()).toEqual(TEST_PLAYERS);
    expect(readTeams()).toEqual(TEST_TEAMS);
  });

  it("awards the chosen penalty, updates trump, and passes the deal to the next selected player", async () => {
    seedRound({
      selectedPlayerIds: ["p3", "p1", "p2"],
      scores: { p3: 4, p1: 2, p2: 0 },
      dealerId: "p1",
      trump: "пики",
    });
    const user = userEvent.setup();
    renderRoundEnd();

    await user.click(penaltyRow("Вася (4)").getByRole("radio", { name: "6" }));

    expect(screen.getByText("Вася (10)")).toBeInTheDocument();
    expect(screen.getByText("Вася (10)")).not.toHaveClass("text-team");

    await user.click(screen.getByRole("radio", { name: "буби" }));
    await user.click(screen.getByRole("button", { name: "Продолжить" }));

    expect(await screen.findByRole("heading", { name: "Игра" })).toBeInTheDocument();
    await waitFor(() => {
      expect(readCurrentGame()).toMatchObject({
        selectedPlayerIds: ["p3", "p1", "p2"],
        gameStarted: true,
        trump: "буби",
        dealerId: "p2",
        scores: { p3: 10, p1: 2, p2: 0 },
      });
    });
  });

  it("awards a team penalty to the team key and wraps the deal to the first player", async () => {
    seedRound({
      selectedPlayerIds: ["p1", "p2", "p3", "p4"],
      teamMode: true,
      currentTeamIds: { black: "t1", red: "t2" },
      scores: { t1: 6, t2: 1 },
      dealerId: "p4",
      trump: "пики",
    });
    const user = userEvent.setup();
    renderRoundEnd();

    await user.click(
      penaltyRow("Старая гвардия (6)").getByRole("radio", { name: "4" }),
    );
    expect(screen.getByText("Старая гвардия (10)")).toBeInTheDocument();

    await user.click(screen.getByRole("radio", { name: "крести" }));
    await user.click(screen.getByRole("button", { name: "Продолжить" }));

    expect(await screen.findByRole("heading", { name: "Игра" })).toBeInTheDocument();
    await waitFor(() => {
      expect(readCurrentGame()).toEqual({
        selectedPlayerIds: ["p1", "p2", "p3", "p4"],
        teamMode: true,
        gameStarted: true,
        currentTeamIds: { black: "t1", red: "t2" },
        trump: "крести",
        dealerId: "p1",
        scores: { t1: 10, t2: 1 },
      });
    });
    expect(readPlayers()).toEqual(TEST_PLAYERS);
    expect(readTeams()).toEqual(TEST_TEAMS);
  });

  it("highlights a side at 12 or more, hides trump, and switches the footer to finish", async () => {
    seedRound({ scores: { p1: 8, p2: 2 } });
    const user = userEvent.setup();
    renderRoundEnd();

    expect(screen.getByText("Алиса (8)")).not.toHaveClass("text-team");
    expect(screen.getByText("Козырь")).toBeInTheDocument();

    await user.click(penaltyRow("Алиса (8)").getByRole("radio", { name: "4" }));

    expect(screen.getByText("Алиса (12)")).toHaveClass("text-team");
    expect(screen.getByText("Боб (2)")).not.toHaveClass("text-team");
    expect(screen.queryByText("Козырь")).not.toBeInTheDocument();
    expect(screen.queryByRole("radio", { name: "крести" })).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Закончить" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Продолжить" }),
    ).not.toBeInTheDocument();

    await user.click(penaltyRow("Алиса (12)").getByRole("radio", { name: "0" }));

    expect(screen.getByText("Алиса (8)")).not.toHaveClass("text-team");
    expect(screen.getByText("Козырь")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Продолжить" }),
    ).toBeInTheDocument();
  });

  it("finishes a game that is already at 12 and keeps player and team catalogs", async () => {
    seedRound({ scores: { p1: 12, p2: 4 } });
    const user = userEvent.setup();
    renderRoundEnd();

    expect(screen.getByText("Алиса (12)")).toHaveClass("text-team");
    expect(screen.getByText("Боб (4)")).not.toHaveClass("text-team");
    expect(screen.queryByText("Козырь")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Закончить" }));

    expect(await screen.findByRole("heading", { name: "Меню" })).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "Штрафные очки за раунд" }),
    ).not.toBeInTheDocument();
    await waitFor(() => {
      expect(readCurrentGame()).toEqual(EMPTY_GAME);
    });
    expect(readPlayers()).toEqual(TEST_PLAYERS);
    expect(readTeams()).toEqual(TEST_TEAMS);
  });

  it("finishes from a penalty that crosses 12 without asking for the next trump", async () => {
    seedRound({
      selectedPlayerIds: ["p1", "p2", "p3", "p4"],
      teamMode: true,
      currentTeamIds: { black: "t1", red: "t2" },
      scores: { t1: 10, t2: 3 },
    });
    const user = userEvent.setup();
    renderRoundEnd();

    await user.click(
      penaltyRow("Новички (3)").getByRole("radio", { name: "12" }),
    );

    expect(screen.getByText("Новички (15)")).toHaveClass("text-team");
    expect(screen.getByText("Старая гвардия (10)")).not.toHaveClass("text-team");
    expect(screen.queryByText("Козырь")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Закончить" }));

    expect(await screen.findByRole("heading", { name: "Меню" })).toBeInTheDocument();
    await waitFor(() => {
      expect(readCurrentGame()).toEqual(EMPTY_GAME);
    });
    expect(readPlayers()).toEqual(TEST_PLAYERS);
    expect(readTeams()).toEqual(TEST_TEAMS);
  });

  it("resets penalties to 0 when switching entry mode and keeps the selected trump", async () => {
    seedRound({ scores: { p1: 4, p2: 2 } });
    const user = userEvent.setup();
    renderRoundEnd();

    await user.click(penaltyRow("Алиса (4)").getByRole("radio", { name: "6" }));
    await user.click(screen.getByRole("radio", { name: "черви" }));
    await user.click(screen.getByRole("button", { name: "Ввод числом" }));

    expect(screen.getByText("Алиса (4)")).toBeInTheDocument();
    expect(screen.getByText("Боб (2)")).toBeInTheDocument();
    expect(penaltyRow("Алиса (4)").getByRole("spinbutton")).toHaveValue(0);
    expect(penaltyRow("Боб (2)").getByRole("spinbutton")).toHaveValue(0);
    expect(penaltyRow("Алиса (4)").queryByRole("radio")).not.toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "черви" })).toBeChecked();
    expect(
      screen.getByRole("button", { name: "Радиокнопки" }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Радиокнопки" }));

    expectPenaltyRadios("Алиса (4)");
    expectPenaltyRadios("Боб (2)");
    expect(screen.queryByRole("spinbutton")).not.toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "черви" })).toBeChecked();
    expect(
      screen.getByRole("button", { name: "Ввод числом" }),
    ).toBeInTheDocument();
  });

  it("stores an integer that is not a radio option and advances the round", async () => {
    seedRound({
      scores: { p1: 0, p2: 0 },
      dealerId: "p1",
      trump: "пики",
    });
    const user = userEvent.setup();
    renderRoundEnd();

    await user.click(screen.getByRole("button", { name: "Ввод числом" }));
    const alicePenalty = penaltyRow("Алиса (0)").getByRole("spinbutton");
    await user.clear(alicePenalty);
    await user.type(alicePenalty, "3");
    expect(screen.getByText("Алиса (3)")).toBeInTheDocument();

    await user.click(screen.getByRole("radio", { name: "черви" }));
    await user.click(screen.getByRole("button", { name: "Продолжить" }));

    expect(await screen.findByRole("heading", { name: "Игра" })).toBeInTheDocument();
    await waitFor(() => {
      expect(readCurrentGame()).toMatchObject({
        selectedPlayerIds: ["p1", "p2"],
        gameStarted: true,
        trump: "черви",
        dealerId: "p2",
        scores: { p1: 3, p2: 0 },
      });
    });
  });

  it("rejects a fractional penalty and stays on the round", async () => {
    seedRound({ scores: { p1: 0, p2: 0 } });
    const user = userEvent.setup();
    renderRoundEnd();

    await user.click(screen.getByRole("button", { name: "Ввод числом" }));
    const alicePenalty = penaltyRow("Алиса (0)").getByRole("spinbutton");
    await user.clear(alicePenalty);
    await user.type(alicePenalty, "1.5");
    expect(screen.getByText("Алиса (1.5)")).toBeInTheDocument();
    await user.click(screen.getByRole("radio", { name: "крести" }));
    await user.click(screen.getByRole("button", { name: "Продолжить" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Введите целое число от 0",
    );
    expect(
      screen.getByRole("heading", { name: "Штрафные очки за раунд" }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Игра" })).not.toBeInTheDocument();
    expect(readCurrentGame()).toMatchObject({
      trump: "пики",
      dealerId: "p1",
      scores: { p1: 0, p2: 0 },
    });
  });

  it("rejects a negative penalty and stays on the round", async () => {
    seedRound({ scores: { p1: 4, p2: 2 } });
    const user = userEvent.setup();
    renderRoundEnd();

    await user.click(screen.getByRole("button", { name: "Ввод числом" }));
    const alicePenalty = penaltyRow("Алиса (4)").getByRole("spinbutton");
    await user.clear(alicePenalty);
    await user.type(alicePenalty, "-1");
    expect(screen.getByText("Алиса (3)")).toBeInTheDocument();

    await user.click(screen.getByRole("radio", { name: "крести" }));
    await user.click(screen.getByRole("button", { name: "Продолжить" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Введите целое число от 0",
    );
    expect(
      screen.getByRole("heading", { name: "Штрафные очки за раунд" }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Игра" })).not.toBeInTheDocument();
    expect(readCurrentGame()).toMatchObject({
      trump: "пики",
      dealerId: "p1",
      scores: { p1: 4, p2: 2 },
    });
  });

  it("continues when cleared number fields count as zero", async () => {
    seedRound({
      scores: { p1: 4, p2: 2 },
      dealerId: "p1",
      trump: "пики",
    });
    const user = userEvent.setup();
    renderRoundEnd();

    await user.click(screen.getByRole("button", { name: "Ввод числом" }));
    await user.clear(penaltyRow("Алиса (4)").getByRole("spinbutton"));
    await user.clear(penaltyRow("Боб (2)").getByRole("spinbutton"));
    expect(screen.getByText("Алиса (4)")).toBeInTheDocument();
    expect(screen.getByText("Боб (2)")).toBeInTheDocument();

    await user.click(screen.getByRole("radio", { name: "черви" }));
    await user.click(screen.getByRole("button", { name: "Продолжить" }));

    expect(await screen.findByRole("heading", { name: "Игра" })).toBeInTheDocument();
    await waitFor(() => {
      expect(readCurrentGame()).toMatchObject({
        selectedPlayerIds: ["p1", "p2"],
        gameStarted: true,
        trump: "черви",
        dealerId: "p2",
        scores: { p1: 4, p2: 2 },
      });
    });
  });
});
