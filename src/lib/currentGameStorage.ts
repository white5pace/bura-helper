import { z } from "zod";
import {
  MIN_PLAYER_COUNT,
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

export const TYPE_MISMATCH_MESSAGE =
  "Данные текущей игры не соответствуют ожидаемому типу";

const currentTeamIdsSchema = z.object({
  black: z.string().nullable(),
  red: z.string().nullable(),
});

const currentGameSchema = z
  .object({
    selectedPlayerIds: z
      .array(z.string())
      .max(TEAM_MODE_PLAYER_COUNT, "В партии не больше четырёх игроков"),
    teamMode: z.boolean(),
    gameStarted: z.boolean(),
    currentTeamIds: currentTeamIdsSchema,
    trump: z.enum(TRUMP_SUITS).nullable(),
    dealerId: z.string().nullable(),
    scores: z.record(z.string(), z.number().finite()),
  })
  .superRefine((game, ctx) => {
    const selectedSet = new Set(game.selectedPlayerIds);
    if (selectedSet.size !== game.selectedPlayerIds.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Дубликаты игроков в партии",
        path: ["selectedPlayerIds"],
      });
    }

    const teamsAssigned =
      game.currentTeamIds.black !== null || game.currentTeamIds.red !== null;

    if (!game.teamMode) {
      if (teamsAssigned) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Вне командного режима команды не задаются",
          path: ["currentTeamIds"],
        });
      }
    } else if (!game.gameStarted && teamsAssigned) {
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
      if (game.selectedPlayerIds.length < MIN_PLAYER_COUNT) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "В начатой игре должно быть минимум два игрока",
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

function currentGameIssueMessage(issue: z.ZodIssue): string {
  if (
    issue.code === z.ZodIssueCode.custom ||
    issue.code === z.ZodIssueCode.too_big
  ) {
    return issue.message;
  }
  return TYPE_MISMATCH_MESSAGE;
}

export function parseCurrentGame(value: unknown): CurrentGame {
  const result = currentGameSchema.safeParse(value);
  if (!result.success) {
    throw new CurrentGameValidationError(
      Array.from(
        new Set(result.error.issues.map(currentGameIssueMessage)),
      ).join("; "),
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
