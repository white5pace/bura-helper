import { cva } from "class-variance-authority";

import { dealer as dealerIcon } from "@/assets/icons";
import { cn } from "@/lib/utils";

const playerCardVariants = cva(
  "relative z-10 flex w-[175px] flex-col gap-[16px] p-[10px] text-[var(--text)]",
  {
    variants: {
      align: {
        start: "items-start text-left",
        end: "items-end text-right",
      },
    },
  },
);

const scoreVariants = cva("text-[48px] font-normal leading-[normal]", {
  variants: {
    variant: {
      red: "text-team",
      black: "text-[var(--text)]",
    },
  },
});

export type PlayerCardVariant = "red" | "black";
export type PlayerCardAlign = "start" | "end";

export type PlayerCardProps = {
  name: string;
  score: number;
  variant: PlayerCardVariant;
  align: PlayerCardAlign;
  dealer?: boolean;
  teamName?: string;
  className?: string;
};

function PlayerCard({
  name,
  score,
  variant,
  align,
  dealer = false,
  teamName,
  className,
}: PlayerCardProps) {
  const hasTeam = teamName !== undefined;

  return (
    <div
      className={cn(
        playerCardVariants({ align }),
        hasTeam ? "h-[205px]" : "h-[142px]",
        className,
      )}
    >
      <div
        aria-hidden
        className={cn(
          "pointer-events-none absolute inset-y-0 z-10 w-[10px] bg-[var(--bg)]",
          align === "end" ? "right-0" : "left-0",
        )}
      />
      <div
        aria-hidden
        className={cn(
          "pointer-events-none absolute bottom-0 z-10 h-[10px] w-[50px] bg-[var(--bg)]",
          align === "end" ? "right-0" : "left-0",
        )}
      />
      <div className="flex items-center gap-[20px]">
        {dealer ? (
          <img src={dealerIcon} alt="Раздает" className="shrink-0" />
        ) : null}
        <p className={scoreVariants({ variant })}>{score}</p>
      </div>
      <div className="flex w-full min-w-0 flex-col gap-[8px]">
        <p className="line-clamp-2 h-[42px] w-full text-[16px] font-bold leading-[1.2]">
          {name}
        </p>
        {hasTeam ? (
          <div className="h-[51px] w-full overflow-hidden text-[14px] font-normal leading-[1.2]">
            <p>Команда:</p>
            <p className="line-clamp-2">{teamName}</p>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default PlayerCard;
