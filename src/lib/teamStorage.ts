import { z } from "zod";
import { normalizePair, type Team } from "@/lib/teamPair";

const teamSchema = z.object({
  id: z.string(),
  name: z.string(),
  playerIds: z.tuple([z.string(), z.string()]),
});

export const TEAMS_STORAGE_KEY = "teams";

function parseTeam(value: unknown): Team | null {
  const result = teamSchema.safeParse(value);
  if (!result.success) {
    return null;
  }

  try {
    return {
      ...result.data,
      playerIds: normalizePair(result.data.playerIds),
    };
  } catch {
    return null;
  }
}

const teamsPayloadSchema = z.array(z.unknown()).catch([]).transform((items) =>
  items.flatMap((item) => {
    const team = parseTeam(item);
    return team ? [team] : [];
  }),
);

export function parseTeams(value: unknown): Team[] {
  const result = teamsPayloadSchema.safeParse(value);
  return result.success ? result.data : [];
}

export function loadTeams(): Team[] {
  try {
    const stored = localStorage.getItem(TEAMS_STORAGE_KEY);
    if (!stored) {
      return [];
    }

    return parseTeams(JSON.parse(stored));
  } catch {
    return [];
  }
}

export function saveTeams(teams: Team[]): void {
  localStorage.setItem(TEAMS_STORAGE_KEY, JSON.stringify(teams));
}
