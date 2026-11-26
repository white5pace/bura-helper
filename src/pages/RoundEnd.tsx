import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Controller, useForm, useWatch, type Control } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CopyCheck, SquarePen } from "lucide-react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

const INTEGER_PENALTY_MESSAGE = "Введите целое число от 0";

function penaltyPoints(value: string | number | undefined): number {
  if (value === undefined || value === "") {
    return 0;
  }
  return Number(value);
}

function rejectMultipleSides(ctx: z.RefinementCtx, chargedCount: number) {
  if (chargedCount > 1) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: ONE_SIDE_PENALTY_MESSAGE,
      path: ["root"],
    });
  }
}

function isTrumpSuit(value: string): value is TrumpSuit {
  return TRUMP_SUITS.some((suit) => suit === value);
}

const numberPenaltySchema = z.coerce
  .number({ invalid_type_error: INTEGER_PENALTY_MESSAGE })
  .int(INTEGER_PENALTY_MESSAGE)
  .nonnegative(INTEGER_PENALTY_MESSAGE);

function penaltiesSchema(numberMode: boolean) {
  if (numberMode) {
    return z
      .record(z.string(), numberPenaltySchema)
      .superRefine((penalties, ctx) => {
        rejectMultipleSides(
          ctx,
          Object.values(penalties).filter((value) => value > 0).length,
        );
      });
  }

  return z
    .record(
      z.string(),
      z.enum(PENALTY_OPTIONS, {
        errorMap: () => ({ message: "Выберите штрафные очки" }),
      }),
    )
    .superRefine((penalties, ctx) => {
      rejectMultipleSides(
        ctx,
        Object.values(penalties).filter((value) => value !== "0").length,
      );
    });
}

type PenaltyRow = {
  id: string;
  name: string;
  current: number;
};

type FormValues = {
  penalties: Record<string, string>;
  trump: string;
};

function rowTotal(current: number, value: string | number | undefined): number {
  return current + penaltyPoints(value);
}

function hasReachedGameEnd(
  rows: readonly PenaltyRow[],
  penalties:
    | { readonly [id: string]: string | number | undefined }
    | undefined,
): boolean {
  return rows.some(
    (row) => rowTotal(row.current, penalties?.[row.id]) >= GAME_END_SCORE,
  );
}

function PenaltyRowField({
  row,
  control,
  numberMode,
}: {
  row: PenaltyRow;
  control: Control<FormValues>;
  numberMode: boolean;
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
            {numberMode ? (
              <Input
                type="number"
                name={field.name}
                ref={field.ref}
                value={field.value}
                onBlur={field.onBlur}
                onChange={field.onChange}
                aria-invalid={fieldState.invalid}
              />
            ) : (
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
            )}
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

  const [numberMode, setNumberMode] = useState(false);

  const formSchema = useMemo(
    () =>
      z
        .object({
          penalties: penaltiesSchema(numberMode),
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
    [rows, numberMode],
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
    clearErrors,
    setValue,
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
        points: penaltyPoints(data.penalties[row.id]),
      })),
    });
    navigate("/game", { replace: true });
  };

  const toggleNumberMode = () => {
    setNumberMode((current) => !current);
    setValue(
      "penalties",
      Object.fromEntries(rows.map((row) => [row.id, "0"])),
    );
    clearErrors("penalties");
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
      <SecondHeader
        actions={
          <Button
            type="button"
            variant="ghost"
            size="icon"
            iconSize="lg"
            className="ml-auto"
            aria-label={numberMode ? "Радиокнопки" : "Ввод числом"}
            onClick={toggleNumberMode}
          >
            {numberMode ? <CopyCheck /> : <SquarePen />}
          </Button>
        }
      >
        Штрафные очки за раунд
      </SecondHeader>
      <form
        id={ROUND_END_FORM_ID}
        noValidate
        onSubmit={handleSubmit(onSubmit)}
        className="flex flex-1 flex-col gap-4 text-left"
      >
        {rows.map((row) => (
          <PenaltyRowField
            key={row.id}
            row={row}
            control={control}
            numberMode={numberMode}
          />
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
