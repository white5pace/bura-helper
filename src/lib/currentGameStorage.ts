import { z } from "zod";
import {
  TEAM_MODE_PLAYER_COUNT,
  TRUMP_SUITS,
  type TrumpSuit,
} from "@/lib/gameRules";

export { TRUMP_SUITS, type TrumpSuit };

export class CurrentGameValidationError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = "CurrentGameValidationError";
  }
}

const currentTeamIdsSchema = z.object(
  {
    black: z
      .string({
        invalid_type_error: "Id команды должен быть строкой",
      })
      .nullable(),
    red: z
      .string({
        invalid_type_error: "Id команды должен быть строкой",
      })
      .nullable(),
  },
  {
    required_error: "Не заданы команды",
    invalid_type_error: "Команды заданы неверно",
  },
);

const currentGameSchema = z
  .object(
    {
      selectedPlayerIds: z
        .array(
          z.string({
            invalid_type_error: "Id игрока должен быть строкой",
          }),
          {
            required_error: "Не задан список игроков",
            invalid_type_error: "Список игроков должен быть массивом",
          },
        )
        .max(TEAM_MODE_PLAYER_COUNT, "В партии не больше четырёх игроков"),
      teamMode: z.boolean({
        required_error: "Не задан командный режим",
        invalid_type_error: "Командный режим должен быть логическим значением",
      }),
      gameStarted: z.boolean({
        required_error: "Не задан признак начала игры",
        invalid_type_error:
          "Признак начала игры должен быть логическим значением",
      }),
      currentTeamIds: currentTeamIdsSchema,
      trump: z
        .enum(TRUMP_SUITS, {
          errorMap: (issue) => {
            if (
              issue.code === z.ZodIssueCode.invalid_type &&
              issue.received === "undefined"
            ) {
              return { message: "Не задан козырь" };
            }
            return { message: "Неизвестная масть козыря" };
          },
        })
        .nullable(),
      dealerId: z
        .string({
          required_error: "Не задан раздающий",
          invalid_type_error: "Id раздающего должен быть строкой",
        })
        .nullable(),
      scores: z.record(
        z.string({
          invalid_type_error: "Id игрока в счёте должен быть строкой",
        }),
        z
          .number({
            invalid_type_error: "Счёт должен быть числом",
          })
          .finite("Счёт должен быть конечным числом"),
        {
          required_error: "Не задан счёт",
          invalid_type_error: "Счёт должен быть объектом",
        },
      ),
    },
    {
      errorMap: (issue, ctx) => {
        if (
          issue.code === z.ZodIssueCode.invalid_type &&
          issue.path.length === 0
        ) {
          return { message: "Данные текущей игры должны быть объектом" };
        }
        return { message: ctx.defaultError };
      },
    },
  )
  .superRefine((game, ctx) => {
    const selectedSet = new Set(game.selectedPlayerIds);
    if (selectedSet.size !== game.selectedPlayerIds.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Дубликаты игроков в партии",
        path: ["selectedPlayerIds"],
      });
    }

    if (!game.teamMode) {
      if (
        game.currentTeamIds.black !== null ||
        game.currentTeamIds.red !== null
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Вне командного режима команды не задаются",
          path: ["currentTeamIds"],
        });
      }
    } else if (
      game.currentTeamIds.black !== null ||
      game.currentTeamIds.red !== null
    ) {
      if (
        game.currentTeamIds.black === null ||
        game.currentTeamIds.red === null
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "В командном режиме нужно задать обе команды",
          path: ["currentTeamIds"],
        });
      }
      if (game.selectedPlayerIds.length !== TEAM_MODE_PLAYER_COUNT) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Команды заданы не для четырёх игроков",
          path: ["selectedPlayerIds"],
        });
      }
    }

    if (game.gameStarted) {
      if (game.selectedPlayerIds.length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Начатая игра без игроков",
          path: ["selectedPlayerIds"],
        });
      }
      if (game.trump === null) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Начатая игра без козыря",
          path: ["trump"],
        });
      }
      if (game.dealerId === null) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Начатая игра без раздающего",
          path: ["dealerId"],
        });
      } else if (!selectedSet.has(game.dealerId)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Раздающий не входит в список игроков",
          path: ["dealerId"],
        });
      }
      for (const playerId of Object.keys(game.scores)) {
        if (!selectedSet.has(playerId)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Счёт содержит неизвестного игрока",
            path: ["scores", playerId],
          });
        }
      }
      if (
        game.teamMode &&
        (game.selectedPlayerIds.length !== TEAM_MODE_PLAYER_COUNT ||
          game.currentTeamIds.black === null ||
          game.currentTeamIds.red === null)
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Неполный состав командной игры",
          path: ["currentTeamIds"],
        });
      }
    } else {
      if (game.trump !== null) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Игра не начата, но козырь уже задан",
          path: ["trump"],
        });
      }
      if (game.dealerId !== null) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Игра не начата, но раздающий уже задан",
          path: ["dealerId"],
        });
      }
      if (Object.keys(game.scores).length !== 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Игра не начата, но счёт уже задан",
          path: ["scores"],
        });
      }
    }
  });

export type CurrentTeamIds = z.infer<typeof currentTeamIdsSchema>;
export type CurrentGame = z.infer<typeof currentGameSchema>;

export const CURRENT_GAME_STORAGE_KEY = "currentGame";

export function defaultCurrentGame(): CurrentGame {
  return {
    selectedPlayerIds: [],
    teamMode: false,
    gameStarted: false,
    currentTeamIds: { black: null, red: null },
    trump: null,
    dealerId: null,
    scores: {},
  };
}

export function parseCurrentGame(value: unknown): CurrentGame {
  const result = currentGameSchema.safeParse(value);
  if (!result.success) {
    throw new CurrentGameValidationError(
      result.error.issues.map((issue) => issue.message).join("; "),
      { cause: result.error },
    );
  }
  return result.data;
}

export function validateCurrentGameCatalogs(
  game: CurrentGame,
  catalogs: {
    playerIds: ReadonlySet<string>;
    teamIds: ReadonlySet<string>;
  },
): CurrentGame {
  for (const playerId of game.selectedPlayerIds) {
    if (!catalogs.playerIds.has(playerId)) {
      throw new CurrentGameValidationError(
        "Сессия ссылается на несуществующего игрока",
      );
    }
  }

  const teamIds = [game.currentTeamIds.black, game.currentTeamIds.red];
  for (const teamId of teamIds) {
    if (teamId !== null && !catalogs.teamIds.has(teamId)) {
      throw new CurrentGameValidationError(
        "Сессия ссылается на несуществующую команду",
      );
    }
  }

  return game;
}

export function loadCurrentGame(): CurrentGame {
  const stored = localStorage.getItem(CURRENT_GAME_STORAGE_KEY);
  if (stored === null) {
    return defaultCurrentGame();
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(stored);
  } catch (error) {
    throw new CurrentGameValidationError("Не удалось прочитать текущую игру", {
      cause: error,
    });
  }

  return parseCurrentGame(parsed);
}

export function saveCurrentGame(game: CurrentGame): void {
  localStorage.setItem(CURRENT_GAME_STORAGE_KEY, JSON.stringify(game));
}
