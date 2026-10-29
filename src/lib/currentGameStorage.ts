import { z } from "zod";
import { TEAM_MODE_PLAYER_COUNT } from "@/lib/gameRules";

const currentTeamIdsSchema = z.object({
  black: z.union([z.string(), z.null()]),
  red: z.union([z.string(), z.null()]),
});

const currentGameSchema = z.object({
  selectedPlayerIds: z
    .array(z.unknown())
    .catch([])
    .transform((items) =>
      items.filter((id): id is string => typeof id === "string"),
    ),
  teamMode: z.unknown().transform((value) => value === true),
  currentTeamIds: currentTeamIdsSchema.catch({ black: null, red: null }),
});

export type CurrentTeamIds = z.infer<typeof currentTeamIdsSchema>;
export type CurrentGame = z.infer<typeof currentGameSchema>;

export const CURRENT_GAME_STORAGE_KEY = "currentGame";

export function defaultCurrentGame(): CurrentGame {
  return {
    selectedPlayerIds: [],
    teamMode: false,
    currentTeamIds: { black: null, red: null },
  };
}

export function parseCurrentGame(value: unknown): CurrentGame {
  const result = currentGameSchema.safeParse(value);
  if (!result.success) {
    return defaultCurrentGame();
  }
  return result.data;
}

export function keepPlayersThatStillExist(
  ids: string[],
  existingPlayerIds: ReadonlySet<string>,
): string[] {
  return ids.filter((id) => existingPlayerIds.has(id));
}

export function keepTeamIdIfExists(
  teamId: string | null,
  existingTeamIds: ReadonlySet<string>,
): string | null {
  if (typeof teamId === "string" && existingTeamIds.has(teamId)) {
    return teamId;
  }
  return null;
}

export function sanitizeCurrentGame(
  game: CurrentGame,
  catalogs: {
    playerIds: ReadonlySet<string>;
    teamIds: ReadonlySet<string>;
  },
): CurrentGame {
  return {
    selectedPlayerIds: keepPlayersThatStillExist(
      game.selectedPlayerIds,
      catalogs.playerIds,
    ).slice(0, TEAM_MODE_PLAYER_COUNT),
    teamMode: game.teamMode,
    currentTeamIds: {
      black: keepTeamIdIfExists(game.currentTeamIds.black, catalogs.teamIds),
      red: keepTeamIdIfExists(game.currentTeamIds.red, catalogs.teamIds),
    },
  };
}

export function loadCurrentGame(): CurrentGame {
  try {
    const stored = localStorage.getItem(CURRENT_GAME_STORAGE_KEY);
    if (!stored) {
      return defaultCurrentGame();
    }

    const parsed: unknown = JSON.parse(stored);
    return parseCurrentGame(parsed);
  } catch {
    return defaultCurrentGame();
  }
}

export function saveCurrentGame(game: CurrentGame): void {
  localStorage.setItem(CURRENT_GAME_STORAGE_KEY, JSON.stringify(game));
}
