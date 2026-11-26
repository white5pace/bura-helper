import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Controller, useForm, useWatch, type Control } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useParticipants } from "@/contexts/ParticipantsContext";
import {
  GAME_END_SCORE,
  TRUMP_SUITS,
  type TrumpSuit,
} from "@/lib/gameRules";
import PageLayout from "@/shared/ui/PageLayout";
import SecondHeader from "@/shared/ui/SecondHeader";
import TrumpRadioGroup from "@/shared/ui/TrumpRadioGroup";

const ROUND_END_FORM_ID = "round-end-form";

const PENALTY_OPTIONS = ["0", "2", "4", "6", "8", "12"] as const;

const ONE_SIDE_PENALTY_MESSAGE =
  "Штрафные очки больше 0 можно указать только для одной стороны";

function isTrumpSuit(value: string): value is TrumpSuit {
  return TRUMP_SUITS.some((suit) => suit === value);
}

const penaltiesSchema = z
  .record(
    z.string(),
    z.enum(PENALTY_OPTIONS, {
      errorMap: () => ({ message: "Выберите штрафные очки" }),
    }),
  )
  .superRefine((penalties, ctx) => {
    const chargedPenalty = Object.values(penalties).filter(
      (value) => value !== "0",
    );

    if (chargedPenalty.length > 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: ONE_SIDE_PENALTY_MESSAGE,
        path: ["root"],
      });
    }
  });

type PenaltyRow = {
  id: string;
  name: string;
  current: number;
};

type FormValues = {
  penalties: Record<string, (typeof PENALTY_OPTIONS)[number]>;
  trump: string;
};

function selectedPenalty(value: string | undefined): number {
  const match = PENALTY_OPTIONS.find((option) => option === value);
  return match === undefined ? 0 : Number(match);
}

function rowTotal(current: number, value: string | undefined): number {
  return current + selectedPenalty(value);
}

function hasReachedGameEnd(
  rows: readonly PenaltyRow[],
  penalties: { readonly [id: string]: string | undefined } | undefined,
): boolean {
  return rows.some(
    (row) => rowTotal(row.current, penalties?.[row.id]) >= GAME_END_SCORE,
  );
}

function PenaltyRowField({
  row,
  control,
}: {
  row: PenaltyRow;
  control: Control<FormValues>;
}) {
  return (
    <Controller
      name={`penalties.${row.id}`}
      control={control}
      render={({ field, fieldState }) => {
        const total = rowTotal(row.current, field.value);
        return (
          <Field data-invalid={fieldState.invalid} className="gap-3">
            <FieldLabel
              className={total >= GAME_END_SCORE ? "text-team" : undefined}
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
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        );
      }}
    />
  );
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
      return selectedPlayerIds.map((playerId) => {
        const player = getPlayerById(playerId);
        if (!player) {
          throw new Error("Не найден игрок текущей партии");
        }
        return {
          id: player.id,
          name: player.name,
          current: scores[player.id] ?? 0,
        } satisfies PenaltyRow;
      });
    }

    return [currentTeamIds.black, currentTeamIds.red].map((teamId) => {
      if (!teamId) {
        throw new Error("Не заданы команды текущей партии");
      }
      const team = getTeamById(teamId);
      if (!team) {
        throw new Error("Не найдена команда текущей партии");
      }
      return {
        id: team.id,
        name: team.name,
        current: scores[team.id] ?? 0,
      } satisfies PenaltyRow;
    });
  }, [
    teamMode,
    selectedPlayerIds,
    scores,
    currentTeamIds,
    getPlayerById,
    getTeamById,
  ]);

  const formSchema = useMemo(
    () =>
      z
        .object({
          penalties: penaltiesSchema,
          trump: z.string(),
        })
        .superRefine((data, ctx) => {
          if (hasReachedGameEnd(rows, data.penalties)) {
            return;
          }
          if (!isTrumpSuit(data.trump)) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: "Выберите козырь",
              path: ["trump"],
            });
          }
        }),
    [rows],
  );

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      penalties: Object.fromEntries(
        rows.map((row) => [row.id, "0"]),
      ) as FormValues["penalties"],
      trump: "",
    },
  });

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = form;
  const watchedPenalties = useWatch({ control, name: "penalties" });
  const gameOver = hasReachedGameEnd(rows, watchedPenalties);

  const onSubmit = (data: FormValues) => {
    if (hasReachedGameEnd(rows, data.penalties)) {
      resetGame();
      navigate("/", { replace: true });
      return;
    }

    if (!isTrumpSuit(data.trump)) {
      return;
    }

    finishRound({
      trump: data.trump,
      penalties: rows.map((row) => ({
        id: row.id,
        points: selectedPenalty(data.penalties[row.id]),
      })),
    });
    navigate("/game", { replace: true });
  };

  return (
    <PageLayout
      footer={
        <Button
          type="submit"
          form={ROUND_END_FORM_ID}
          variant="outline"
          size="lg"
          className="w-full"
        >
          {gameOver ? "Закончить" : "Продолжить"}
        </Button>
      }
    >
      <SecondHeader>Штрафные очки за раунд</SecondHeader>
      <form
        id={ROUND_END_FORM_ID}
        onSubmit={handleSubmit(onSubmit)}
        className="flex flex-1 flex-col gap-4 text-left"
      >
        {rows.map((row) => (
          <PenaltyRowField key={row.id} row={row} control={control} />
        ))}
        {errors.penalties?.root?.message ? (
          <FieldError errors={[{ message: errors.penalties.root.message }]} />
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
