import { describe, expect, it } from "vitest";
import {
  CURRENT_GAME_STORAGE_KEY,
  CurrentGameValidationError,
  TYPE_MISMATCH_MESSAGE,
  defaultCurrentGame,
  loadCurrentGame,
  saveCurrentGame,
  validateCurrentGameCatalogs,
  type CurrentGame,
} from "@/lib/currentGameStorage";

function store(value: unknown) {
  localStorage.setItem(CURRENT_GAME_STORAGE_KEY, JSON.stringify(value));
}

function validGame(overrides: Partial<CurrentGame> = {}): CurrentGame {
  return {
    selectedPlayerIds: ["p1", "p2"],
    teamMode: false,
    gameStarted: false,
    currentTeamIds: { black: null, red: null },
    trump: null,
    dealerId: null,
    scores: {},
    ...overrides,
  };
}

function expectValidationError(fn: () => void, message: string) {
  let caught: unknown;
  try {
    fn();
  } catch (error) {
    caught = error;
  }

  expect(caught).toBeInstanceOf(CurrentGameValidationError);
  expect((caught as CurrentGameValidationError).message).toBe(message);
}

function expectValidationMessages(fn: () => void, messages: readonly string[]) {
  let caught: unknown;
  try {
    fn();
  } catch (error) {
    caught = error;
  }

  expect(caught).toBeInstanceOf(CurrentGameValidationError);
  expect(
    (caught as CurrentGameValidationError).message.split("; ").sort(),
  ).toEqual([...messages].sort());
}

describe("currentGameStorage", () => {
  it("returns defaults when the key is missing", () => {
    expect(loadCurrentGame()).toEqual(defaultCurrentGame());
  });

  it("loads a valid stored game", () => {
    const game = validGame();
    store(game);

    expect(loadCurrentGame()).toEqual(game);
  });

  it("saves and loads a valid started team game", () => {
    const game = validGame({
      selectedPlayerIds: ["p1", "p2", "p3", "p4"],
      teamMode: true,
      gameStarted: true,
      currentTeamIds: { black: "t1", red: "t2" },
      trump: "черви",
      dealerId: "p3",
      scores: { t1: 6, t2: 2 },
    });

    saveCurrentGame(game);

    expect(loadCurrentGame()).toEqual(game);
  });

  it("throws CurrentGameValidationError for broken JSON and non-object roots", () => {
    localStorage.setItem(CURRENT_GAME_STORAGE_KEY, "{");
    expectValidationError(loadCurrentGame, "Не удалось прочитать текущую игру");

    localStorage.setItem(CURRENT_GAME_STORAGE_KEY, "null");
    expectValidationError(loadCurrentGame, TYPE_MISMATCH_MESSAGE);

    localStorage.setItem(CURRENT_GAME_STORAGE_KEY, "[]");
    expectValidationError(loadCurrentGame, TYPE_MISMATCH_MESSAGE);

    localStorage.setItem(CURRENT_GAME_STORAGE_KEY, "42");
    expectValidationError(loadCurrentGame, TYPE_MISMATCH_MESSAGE);
  });

  it("throws CurrentGameValidationError for invalid fields", () => {
    store({
      ...validGame(),
      selectedPlayerIds: ["p1", 2, "p2"],
    });
    expectValidationError(loadCurrentGame, TYPE_MISMATCH_MESSAGE);

    store({
      ...validGame(),
      teamMode: "yes",
    });
    expectValidationError(loadCurrentGame, TYPE_MISMATCH_MESSAGE);

    store({
      ...validGame(),
      gameStarted: "yes",
    });
    expectValidationError(loadCurrentGame, TYPE_MISMATCH_MESSAGE);

    store({
      ...validGame(),
      gameStarted: undefined,
    });
    expectValidationError(loadCurrentGame, TYPE_MISMATCH_MESSAGE);

    store({
      ...validGame(),
      trump: "бубны",
    });
    expectValidationError(loadCurrentGame, TYPE_MISMATCH_MESSAGE);

    store({
      ...validGame(),
      teamMode: "yes",
      gameStarted: "yes",
      trump: "бубны",
    });
    expectValidationError(loadCurrentGame, TYPE_MISMATCH_MESSAGE);
  });

  it("throws CurrentGameValidationError for more than 4 players or broken invariants", () => {
    store(
      validGame({
        selectedPlayerIds: ["p1", "p2", "p3", "p4", "p5"],
      }),
    );
    expectValidationError(loadCurrentGame, "В партии не больше четырёх игроков");

    store(
      validGame({
        selectedPlayerIds: ["p1", "p1"],
      }),
    );
    expectValidationError(loadCurrentGame, "Дубликаты игроков в партии");

    store(
      validGame({
        dealerId: "missing",
      }),
    );
    expectValidationError(loadCurrentGame, "Игра не начата, но раздающий уже задан");

    store(
      validGame({
        trump: "пики",
      }),
    );
    expectValidationError(loadCurrentGame, "Игра не начата, но козырь уже задан");

    store(
      validGame({
        scores: { p1: 1 },
      }),
    );
    expectValidationError(loadCurrentGame, "Игра не начата, но счёт уже задан");

    store(
      validGame({
        currentTeamIds: { black: "t1", red: null },
      }),
    );
    expectValidationError(loadCurrentGame, "Вне командного режима команды не задаются");

    store(
      validGame({
        teamMode: true,
        selectedPlayerIds: ["p1", "p2", "p3", "p4"],
        currentTeamIds: { black: "t1", red: null },
      }),
    );
    expectValidationError(loadCurrentGame, "В командном режиме нужно задать обе команды");

    store(
      validGame({
        teamMode: true,
        currentTeamIds: { black: "t1", red: "t2" },
      }),
    );
    expectValidationError(loadCurrentGame, "Команды заданы не для четырёх игроков");

    store(
      validGame({
        gameStarted: true,
        trump: null,
        dealerId: "p1",
      }),
    );
    expectValidationError(loadCurrentGame, "Начатая игра без козыря");

    store(
      validGame({
        gameStarted: true,
        trump: "пики",
        dealerId: null,
      }),
    );
    expectValidationError(loadCurrentGame, "Начатая игра без раздающего");

    store(
      validGame({
        gameStarted: true,
        trump: "пики",
        dealerId: "missing",
      }),
    );
    expectValidationError(loadCurrentGame, "Раздающий не входит в список игроков");

    store(
      validGame({
        gameStarted: true,
        selectedPlayerIds: [],
        trump: "пики",
        dealerId: "p1",
      }),
    );
    expectValidationMessages(loadCurrentGame, [
      "В начатой игре должно быть минимум два игрока",
      "Раздающий не входит в список игроков",
    ]);

    store(
      validGame({
        gameStarted: true,
        selectedPlayerIds: ["p1"],
        trump: "пики",
        dealerId: "p1",
      }),
    );
    expectValidationError(
      loadCurrentGame,
      "В начатой игре должно быть минимум два игрока",
    );

    store(
      validGame({
        gameStarted: true,
        teamMode: true,
        selectedPlayerIds: ["p1", "p2", "p3", "p4"],
        trump: "пики",
        dealerId: "p1",
      }),
    );
    expectValidationError(loadCurrentGame, "Неполный состав командной игры");

    store(
      validGame({
        gameStarted: true,
        teamMode: true,
        selectedPlayerIds: ["p1", "p2", "p3", "p4"],
        currentTeamIds: { black: "t1", red: null },
        trump: "пики",
        dealerId: "p1",
      }),
    );
    expectValidationError(loadCurrentGame, "Неполный состав командной игры");

    store(
      validGame({
        gameStarted: true,
        teamMode: true,
        selectedPlayerIds: ["p1", "p2"],
        currentTeamIds: { black: "t1", red: "t2" },
        trump: "пики",
        dealerId: "p1",
      }),
    );
    expectValidationError(loadCurrentGame, "Неполный состав командной игры");
  });

  it("returns the game when catalog ids exist", () => {
    const game = validGame({
      currentTeamIds: { black: "t1", red: null },
    });

    expect(
      validateCurrentGameCatalogs(game, {
        playerIds: new Set(["p1", "p2"]),
        teamIds: new Set(["t1"]),
      }),
    ).toBe(game);
  });

  it("throws CurrentGameValidationError for unknown player or team ids", () => {
    expectValidationError(
      () =>
        validateCurrentGameCatalogs(validGame(), {
          playerIds: new Set(["p1"]),
          teamIds: new Set(),
        }),
      "Сессия ссылается на несуществующего игрока",
    );

    expectValidationError(
      () =>
        validateCurrentGameCatalogs(
          validGame({
            teamMode: true,
            selectedPlayerIds: ["p1", "p2", "p3", "p4"],
            currentTeamIds: { black: "t1", red: "gone" },
          }),
          {
            playerIds: new Set(["p1", "p2", "p3", "p4"]),
            teamIds: new Set(["t1"]),
          },
        ),
      "Сессия ссылается на несуществующую команду",
    );
  });
});
