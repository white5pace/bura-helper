export const TEAM_MODE_PLAYER_COUNT = 4;

export const TRUMP_SUITS = ["крести", "пики", "черви", "буби"] as const;

export type TrumpSuit = (typeof TRUMP_SUITS)[number];
