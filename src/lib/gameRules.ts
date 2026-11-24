export const MIN_PLAYER_COUNT = 2;

export const TEAM_MODE_PLAYER_COUNT = 4;

export const TRUMP_SUITS = ["крести", "пики", "черви", "буби"] as const;

export type TrumpSuit = (typeof TRUMP_SUITS)[number];

export const GAME_END_SCORE = 12;

export type RoundScoreUpdate = {
  playerIds: readonly string[];
  points: number;
};

export function participantScore(
  scores: Record<string, number>,
  playerIds: readonly string[],
): number {
  return playerIds.reduce((highest, playerId) => {
    const score = scores[playerId] ?? 0;
    return score > highest ? score : highest;
  }, 0);
}

export function scoresAfterRound(
  scores: Record<string, number>,
  updates: readonly RoundScoreUpdate[],
): Record<string, number> {
  const next = { ...scores };

  for (const update of updates) {
    if (!Number.isFinite(update.points)) {
      continue;
    }

    const total = participantScore(scores, update.playerIds) + update.points;
    for (const playerId of update.playerIds) {
      next[playerId] = total;
    }
  }

  return next;
}

export function nextDealerId(
  playerIds: readonly string[],
  dealerId: string | null,
): string | null {
  if (playerIds.length === 0) {
    return null;
  }

  const currentIndex = dealerId === null ? -1 : playerIds.indexOf(dealerId);
  const nextIndex =
    currentIndex === -1 ? 0 : (currentIndex + 1) % playerIds.length;
  return playerIds[nextIndex] ?? null;
}
