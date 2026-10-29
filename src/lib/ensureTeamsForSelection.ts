import type { CurrentTeamIds } from "@/lib/currentGameStorage";
import { TEAM_MODE_PLAYER_COUNT } from "@/lib/gameRules";
import { findTeamByPlayers, upsertTeam, type Team } from "@/lib/teamPair";

export const EMPTY_CURRENT_TEAM_IDS: CurrentTeamIds = {
  black: null,
  red: null,
};

interface NamedPlayer {
  id: string;
  name: string;
}

export function defaultTeamName(
  playerIds: string[],
  players: NamedPlayer[],
): string {
  return playerIds
    .map((id) => players.find((player) => player.id === id)?.name ?? "")
    .join(" + ");
}

export function sameCurrentTeamIds(a: CurrentTeamIds, b: CurrentTeamIds): boolean {
  return a.black === b.black && a.red === b.red;
}

export function ensureTeamsForSelection(
  teams: Team[],
  selectedPlayerIds: string[],
  players: NamedPlayer[],
  teamMode: boolean,
  createId: () => string = () => self.crypto.randomUUID(),
): { teams: Team[]; currentTeamIds: CurrentTeamIds } {
  if (!teamMode || selectedPlayerIds.length !== TEAM_MODE_PLAYER_COUNT) {
    return { teams, currentTeamIds: EMPTY_CURRENT_TEAM_IDS };
  }

  const blackPlayerIds = [selectedPlayerIds[0], selectedPlayerIds[2]];
  const redPlayerIds = [selectedPlayerIds[1], selectedPlayerIds[3]];

  let nextTeams = teams;

  if (!findTeamByPlayers(nextTeams, blackPlayerIds)) {
    nextTeams = upsertTeam(
      nextTeams,
      blackPlayerIds,
      defaultTeamName(blackPlayerIds, players),
      createId,
    ).teams;
  }

  if (!findTeamByPlayers(nextTeams, redPlayerIds)) {
    nextTeams = upsertTeam(
      nextTeams,
      redPlayerIds,
      defaultTeamName(redPlayerIds, players),
      createId,
    ).teams;
  }

  const blackTeam = findTeamByPlayers(nextTeams, blackPlayerIds);
  const redTeam = findTeamByPlayers(nextTeams, redPlayerIds);

  return {
    teams: nextTeams,
    currentTeamIds: {
      black: blackTeam?.id ?? null,
      red: redTeam?.id ?? null,
    },
  };
}

export function removePlayerFromCatalogs(
  teams: Team[],
  currentTeamIds: CurrentTeamIds,
  playerId: string,
): { teams: Team[]; currentTeamIds: CurrentTeamIds } {
  const remainingTeams = teams.filter(
    (team) => !team.playerIds.includes(playerId),
  );

  if (remainingTeams.length === teams.length) {
    return { teams, currentTeamIds };
  }

  const removedTeamIds = new Set(
    teams
      .filter((team) => team.playerIds.includes(playerId))
      .map((team) => team.id),
  );

  const nextCurrentTeamIds: CurrentTeamIds = {
    black:
      currentTeamIds.black && removedTeamIds.has(currentTeamIds.black)
        ? null
        : currentTeamIds.black,
    red:
      currentTeamIds.red && removedTeamIds.has(currentTeamIds.red)
        ? null
        : currentTeamIds.red,
  };

  return {
    teams: remainingTeams,
    currentTeamIds: sameCurrentTeamIds(currentTeamIds, nextCurrentTeamIds)
      ? currentTeamIds
      : nextCurrentTeamIds,
  };
}
