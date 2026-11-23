import { clubs, diamonds, hearts, spades } from "@/assets/icons";
import { type TrumpSuit } from "@/lib/gameRules";
import { cn } from "@/lib/utils";
import PlayerCard, { type PlayerCardAlign } from "@/shared/ui/PlayerCard";

export type GameCardTrump = TrumpSuit;

const trumpIcons: Record<GameCardTrump, string> = {
  крести: clubs,
  пики: spades,
  черви: hearts,
  буби: diamonds,
};

const corners: readonly {
  className: string;
  align: PlayerCardAlign;
}[] = [
  { className: "absolute right-0 bottom-0", align: "end" },
  { className: "absolute left-0 bottom-0", align: "start" },
  { className: "absolute top-0 left-0 rotate-180", align: "end" },
  { className: "absolute top-0 right-0 rotate-180", align: "start" },
];

function seatIndex(playerIndex: number, playerCount: number) {
  if (playerCount === 2 && playerIndex === 1) {
    return 2;
  }
  return playerIndex;
}

export type GameCardPlayer = {
  id: string;
  name: string;
};

export type GameCardTeamNames = {
  black: string | null;
  red: string | null;
};

export type GameCardProps = {
  trump: GameCardTrump;
  players: readonly GameCardPlayer[];
  teamMode: boolean;
  teamNames: GameCardTeamNames;
  scores: Record<string, number>;
  dealerId: string | null;
  className?: string;
};

function GameCard({
  trump,
  players,
  teamMode,
  teamNames,
  scores,
  dealerId,
  className,
}: GameCardProps) {
  return (
    <div
      className={cn(
        "relative mb-[32px] w-full flex-1",
        teamMode ? "min-h-[426px]" : "min-h-[300px]",
        className,
      )}
    >
      <div className="pointer-events-none absolute inset-0 rounded-[10px] border border-[var(--text)]" />
      <img
        src={trumpIcons[trump]}
        alt={trump}
        className="pointer-events-none absolute top-1/2 left-1/2 size-[100px] max-w-none -translate-x-1/2 -translate-y-1/2 object-contain"
      />
      {players.map((player, index) => {
        const corner = corners[seatIndex(index, players.length)];
        if (!corner) {
          return null;
        }

        const isRedTeam = teamMode && index % 2 === 1;
        const variant = isRedTeam ? "red" : "black";
        const teamName = teamMode
          ? ((isRedTeam ? teamNames.red : teamNames.black) ?? undefined)
          : undefined;

        return (
          <div
            key={player.id}
            data-testid={`seat-${player.id}`}
            className={corner.className}
          >
            <PlayerCard
              name={player.name}
              score={scores[player.id] ?? 0}
              variant={variant}
              align={corner.align}
              dealer={player.id === dealerId}
              teamName={teamName}
            />
          </div>
        );
      })}
    </div>
  );
}

export default GameCard;
