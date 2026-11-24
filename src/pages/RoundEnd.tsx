import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useParticipants } from "@/contexts/ParticipantsContext";
import { TRUMP_SUITS } from "@/lib/currentGameStorage";
import { GAME_END_SCORE, participantScore } from "@/lib/gameRules";
import PageLayout from "@/shared/ui/PageLayout";
import SecondHeader from "@/shared/ui/SecondHeader";
import TrumpRadioGroup from "@/shared/ui/TrumpRadioGroup";

const ROUND_END_FORM_ID = "round-end-form";

const PENALTY_OPTIONS = ["0", "2", "4", "6", "8", "12"] as const;

const ONE_SIDE_PENALTY_MESSAGE =
  "Штрафные очки больше 0 можно указать только для одной стороны";

function isChargedPenalty(value: string): boolean {
  return value !== "" && value !== "0";
}

const formSchema = z.object({
  penalties: z
    .record(
      z.string(),
      z.enum(PENALTY_OPTIONS, {
        errorMap: () => ({ message: "Выберите штрафные очки" }),
      }),
    )
    .superRefine((penalties, ctx) => {
      const charged = Object.values(penalties).filter((value) =>
        isChargedPenalty(value),
      );
      if (charged.length > 1) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: ONE_SIDE_PENALTY_MESSAGE,
          path: ["root"],
        });
      }
    }),
  trump: z.enum(TRUMP_SUITS, {
    errorMap: () => ({ message: "Выберите козырь" }),
  }),
});

type FormValues = z.infer<typeof formSchema>;

type PenaltyRow = {
  id: string;
  name: string;
  playerIds: readonly string[];
  current: number;
};

function selectedPenalty(value: string | undefined): number {
  const match = PENALTY_OPTIONS.find((option) => option === value);
  return match === undefined ? 0 : Number(match);
}

function rowTotal(current: number, value: string | undefined): number {
  return current + selectedPenalty(value);
}

function penaltyGroupMessage(
  penalties:
    | {
        message?: string;
        root?: { message?: string };
      }
    | undefined,
): string | undefined {
  return penalties?.root?.message ?? penalties?.message;
}

function RoundEnd() {
  const navigate = useNavigate();
  const {
    selectedPlayerIds,
    teamMode,
    currentTeamIds,
    scores,
    getPlayerById,
    getTeamById,
    finishRound,
    resetGame,
  } = useParticipants();

  const rows = useMemo(() => {
    if (!teamMode) {
      return selectedPlayerIds.flatMap((playerId) => {
        const player = getPlayerById(playerId);
        if (!player) {
          return [];
        }
        const playerIds = [player.id];
        return [
          {
            id: player.id,
            name: player.name,
            playerIds,
            current: participantScore(scores, playerIds),
          } satisfies PenaltyRow,
        ];
      });
    }

    return [currentTeamIds.black, currentTeamIds.red].flatMap((teamId) => {
      if (!teamId) {
        return [];
      }
      const team = getTeamById(teamId);
      if (!team) {
        return [];
      }
      return [
        {
          id: team.id,
          name: team.name,
          playerIds: team.playerIds,
          current: participantScore(scores, team.playerIds),
        } satisfies PenaltyRow,
      ];
    });
  }, [
    teamMode,
    selectedPlayerIds,
    scores,
    currentTeamIds,
    getPlayerById,
    getTeamById,
  ]);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      penalties: Object.fromEntries(
        rows.map((row) => [row.id, "0"]),
      ) as FormValues["penalties"],
      trump: "" as FormValues["trump"],
    },
  });

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = form;
  
  const watchedPenalties = useWatch({ control, name: "penalties" });
  const gameOver = rows.some(
    (row) =>
      rowTotal(row.current, watchedPenalties?.[row.id]) >= GAME_END_SCORE,
  );
  const groupMessage = penaltyGroupMessage(errors.penalties);

  const continueRound = (data: FormValues) => {
    const reachedEnd = rows.some(
      (row) => rowTotal(row.current, data.penalties[row.id]) >= GAME_END_SCORE,
    );
    if (reachedEnd) {
      return;
    }

    finishRound({
      trump: data.trump,
      penalties: rows.map((row) => ({
        playerIds: row.playerIds,
        points: selectedPenalty(data.penalties[row.id]),
      })),
    });
    navigate("/game", { replace: true });
  };

  const endGame = () => {
    resetGame();
    navigate("/", { replace: true });
  };

  return (
    <PageLayout
      footer={
        gameOver ? (
          <Button
            type="button"
            variant="outline"
            size="lg"
            className="w-full"
            onClick={endGame}
          >
            Закончить
          </Button>
        ) : (
          <Button
            type="submit"
            form={ROUND_END_FORM_ID}
            variant="outline"
            size="lg"
            className="w-full"
          >
            Продолжить
          </Button>
        )
      }
    >
      <SecondHeader>Штрафные очки за раунд</SecondHeader>
      <form
        id={ROUND_END_FORM_ID}
        onSubmit={handleSubmit(continueRound)}
        className="flex flex-1 flex-col gap-4 text-left"
      >
        {rows.map((row) => (
          <Controller
            key={row.id}
            name={`penalties.${row.id}`}
            control={control}
            render={({ field, fieldState }) => {
              const total = rowTotal(row.current, field.value);
              return (
                <Field data-invalid={fieldState.invalid} className="gap-3">
                  <FieldLabel
                    className={
                      total >= GAME_END_SCORE ? "text-team" : undefined
                    }
                  >
                    {row.name} ({total})
                  </FieldLabel>
                  <RadioGroup
                    name={field.name}
                    value={field.value ?? ""}
                    onValueChange={field.onChange}
                    className="flex w-full flex-row items-center gap-4"
                  >
                    {PENALTY_OPTIONS.map((option) => (
                      <Label key={option} className="shrink-0">
                        <RadioGroupItem
                          value={option}
                          aria-invalid={fieldState.invalid}
                        />
                        {option}
                      </Label>
                    ))}
                  </RadioGroup>
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              );
            }}
          />
        ))}
        {groupMessage ? (
          <FieldError errors={[{ message: groupMessage }]} />
        ) : null}
        {gameOver ? null : (
          <Controller
            name="trump"
            control={control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid} className="gap-3">
                <FieldLabel>Козырь</FieldLabel>
                <TrumpRadioGroup
                  name={field.name}
                  value={field.value}
                  onValueChange={field.onChange}
                  invalid={fieldState.invalid}
                />
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />
        )}
      </form>
    </PageLayout>
  );
}

export default RoundEnd;
