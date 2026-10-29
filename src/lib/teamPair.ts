export interface Team {
  id: string;
  name: string;
  playerIds: [string, string];
}

export function normalizePair(ids: string[]): [string, string] {
  if (ids.length !== 2) {
    throw new Error("Команда должна состоять ровно из двух игроков");
  }

  const [first, second] = ids;
  if (typeof first !== "string" || typeof second !== "string") {
    throw new Error("Команда должна состоять ровно из двух игроков");
  }
  if (first === second) {
    throw new Error("Команда должна состоять из двух разных игроков");
  }

  return first < second ? [first, second] : [second, first];
}

export function samePair(a: string[], b: string[]): boolean {
  try {
    const [a0, a1] = normalizePair(a);
    const [b0, b1] = normalizePair(b);
    return a0 === b0 && a1 === b1;
  } catch {
    return false;
  }
}

export function findTeamByPlayers(
  teams: Team[],
  playerIds: string[],
): Team | undefined {
  return teams.find((team) => samePair(team.playerIds, playerIds));
}

export function upsertTeam(
  teams: Team[],
  playerIds: string[],
  name: string,
  createId: () => string = () => self.crypto.randomUUID(),
): { teams: Team[]; team: Team } {
  const normalized = normalizePair(playerIds);
  const existing = findTeamByPlayers(teams, normalized);

  if (existing) {
    if (existing.name === name) {
      return { teams, team: existing };
    }

    const updated: Team = { ...existing, name };
    return {
      teams: teams.map((team) => (team.id === existing.id ? updated : team)),
      team: updated,
    };
  }

  const created: Team = {
    id: createId(),
    name,
    playerIds: normalized,
  };

  return { teams: [...teams, created], team: created };
}
