import {
  CURRENT_GAME_STORAGE_KEY,
  type CurrentGame,
  type TrumpSuit,
} from "@/lib/currentGameStorage";
import { PLAYERS_STORAGE_KEY, type Player } from "@/lib/playerStorage";
import type { Team } from "@/lib/teamPair";
import { TEAMS_STORAGE_KEY } from "@/lib/teamStorage";

export type SeedStorageOptions = {
  players?: Player[];
  teams?: Team[];
  selectedPlayerIds?: string[];
  teamMode?: boolean;
  gameStarted?: boolean;
  currentTeamIds?: CurrentGame["currentTeamIds"];
  trump?: TrumpSuit | null;
  dealerId?: string | null;
  scores?: Record<string, number>;
};

export function seedStorage({
  players = [],
  teams = [],
  selectedPlayerIds = [],
  teamMode = false,
  gameStarted = false,
  currentTeamIds = { black: null, red: null },
  trump = null,
  dealerId = null,
  scores = {},
}: SeedStorageOptions = {}) {
  localStorage.setItem(PLAYERS_STORAGE_KEY, JSON.stringify(players));
  localStorage.setItem(TEAMS_STORAGE_KEY, JSON.stringify(teams));
  localStorage.setItem(
    CURRENT_GAME_STORAGE_KEY,
    JSON.stringify({
      selectedPlayerIds,
      teamMode,
      gameStarted,
      currentTeamIds,
      trump,
      dealerId,
      scores,
    } satisfies CurrentGame),
  );
}

export function readCurrentGame(): CurrentGame {
  return JSON.parse(
    localStorage.getItem(CURRENT_GAME_STORAGE_KEY)!,
  ) as CurrentGame;
}

export function readPlayers(): Player[] {
  return JSON.parse(localStorage.getItem(PLAYERS_STORAGE_KEY) ?? "[]") as Player[];
}

export function readTeams(): Team[] {
  return JSON.parse(localStorage.getItem(TEAMS_STORAGE_KEY) ?? "[]") as Team[];
}
