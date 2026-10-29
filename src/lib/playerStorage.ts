import { z } from "zod";

const playerSchema = z.object({
  id: z.string(),
  name: z.string(),
});

const playersPayloadSchema = z.array(z.unknown()).catch([]).transform((items) =>
  items.flatMap((item) => {
    const result = playerSchema.safeParse(item);
    return result.success ? [result.data] : [];
  }),
);

export type Player = z.infer<typeof playerSchema>;

export const PLAYERS_STORAGE_KEY = "players";

export function parsePlayers(value: unknown): Player[] {
  const result = playersPayloadSchema.safeParse(value);
  return result.success ? result.data : [];
}

export function loadPlayers(): Player[] {
  try {
    const stored = localStorage.getItem(PLAYERS_STORAGE_KEY);
    if (!stored) {
      return [];
    }

    return parsePlayers(JSON.parse(stored));
  } catch {
    return [];
  }
}

export function savePlayers(players: Player[]): void {
  localStorage.setItem(PLAYERS_STORAGE_KEY, JSON.stringify(players));
}
