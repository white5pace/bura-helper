import { describe, expect, it } from "vitest";
import {
  CURRENT_GAME_STORAGE_KEY,
  CurrentGameValidationError,
  defaultCurrentGame,
  loadCurrentGame,
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

function expectStoredGameError(message: string) {
  let caught: unknown;
  try {
    loadCurrentGame();
  } catch (error) {
    caught = error;
  }

  expect(caught).toBeInstanceOf(CurrentGameValidationError);
  expect((caught as CurrentGameValidationError).message).toBe(message);
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

  it("throws CurrentGameValidationError for broken JSON and non-object roots", () => {
    localStorage.setItem(CURRENT_GAME_STORAGE_KEY, "{");
    expectStoredGameError("Не удалось прочитать текущую игру");

    localStorage.setItem(CURRENT_GAME_STORAGE_KEY, "null");
    expectStoredGameError("Данные текущей игры должны быть объектом");

    localStorage.setItem(CURRENT_GAME_STORAGE_KEY, "[]");
    expectStoredGameError("Данные текущей игры должны быть объектом");

    localStorage.setItem(CURRENT_GAME_STORAGE_KEY, "42");
    expectStoredGameError("Данные текущей игры должны быть объектом");
  });

  it("throws CurrentGameValidationError for invalid fields", () => {
    store({
      ...validGame(),
      selectedPlayerIds: ["p1", 2, "p2"],
    });
    expectStoredGameError("Id игрока должен быть строкой");

    store({
      ...validGame(),
      teamMode: "yes",
    });
    expectStoredGameError("Командный режим должен быть логическим значением");

    store({
      ...validGame(),
      gameStarted: "yes",
    });
    expectStoredGameError(
      "Признак начала игры должен быть логическим значением",
    );

    store({
      ...validGame(),
      gameStarted: undefined,
    });
    expectStoredGameError("Не задан признак начала игры");

    store({
      ...validGame(),
      trump: "бубны",
    });
    expectStoredGameError("Неизвестная масть козыря");
  });

  it("throws CurrentGameValidationError for more than 4 players or broken invariants", () => {
    store(
      validGame({
        selectedPlayerIds: ["p1", "p2", "p3", "p4", "p5"],
      }),
    );
    expectStoredGameError("В партии не больше четырёх игроков");

    store(
      validGame({
        selectedPlayerIds: ["p1", "p1"],
      }),
    );
    expectStoredGameError("Дубликаты игроков в партии");

    store(
      validGame({
        dealerId: "missing",
      }),
    );
    expectStoredGameError("Игра не начата, но раздающий уже задан");

    store(
      validGame({
        trump: "пики",
      }),
    );
    expectStoredGameError("Игра не начата, но козырь уже задан");

    store(
      validGame({
        scores: { p1: 1 },
      }),
    );
    expectStoredGameError("Игра не начата, но счёт уже задан");

    store(
      validGame({
        currentTeamIds: { black: "t1", red: null },
      }),
    );
    expectStoredGameError("Вне командного режима команды не задаются");

    store(
      validGame({
        teamMode: true,
        selectedPlayerIds: ["p1", "p2", "p3", "p4"],
        currentTeamIds: { black: "t1", red: null },
      }),
    );
    expectStoredGameError("В командном режиме нужно задать обе команды");

    store(
      validGame({
        teamMode: true,
        currentTeamIds: { black: "t1", red: "t2" },
      }),
    );
    expectStoredGameError("Команды заданы не для четырёх игроков");

    store(
      validGame({
        gameStarted: true,
        trump: null,
        dealerId: "p1",
      }),
    );
    expectStoredGameError("Начатая игра без козыря");

    store(
      validGame({
        gameStarted: true,
        trump: "пики",
        dealerId: null,
      }),
    );
    expectStoredGameError("Начатая игра без раздающего");

    store(
      validGame({
        gameStarted: true,
        trump: "пики",
        dealerId: "missing",
      }),
    );
    expectStoredGameError("Раздающий не входит в список игроков");

    store(
      validGame({
        gameStarted: true,
        trump: "пики",
        dealerId: "p1",
        scores: { missing: 2 },
      }),
    );
    expectStoredGameError("Счёт содержит неизвестного игрока");

    store(
      validGame({
        gameStarted: true,
        selectedPlayerIds: [],
        trump: "пики",
        dealerId: "p1",
      }),
    );
    expectStoredGameError(
      "Начатая игра без игроков; Раздающий не входит в список игроков",
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
    expectStoredGameError("Неполный состав командной игры");
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
    expect(() =>
      validateCurrentGameCatalogs(validGame(), {
        playerIds: new Set(["p1"]),
        teamIds: new Set(),
      }),
    ).toThrow(
      new CurrentGameValidationError(
        "Сессия ссылается на несуществующего игрока",
      ),
    );

    expect(() =>
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
    ).toThrow(
      new CurrentGameValidationError(
        "Сессия ссылается на несуществующую команду",
      ),
    );
  });
});
