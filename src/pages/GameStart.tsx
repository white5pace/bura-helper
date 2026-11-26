import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { dealer as dealerIcon } from "@/assets/icons";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { useParticipants } from "@/contexts/ParticipantsContext";
import { TRUMP_SUITS } from "@/lib/currentGameStorage";
import { MIN_PLAYER_COUNT } from "@/lib/gameRules";
import PageLayout from "@/shared/ui/PageLayout";
import SecondHeader from "@/shared/ui/SecondHeader";
import TrumpRadioGroup from "@/shared/ui/TrumpRadioGroup";

const GAME_START_FORM_ID = "game-start-form";

const formSchema = z.object({
  trump: z.enum(TRUMP_SUITS, {
    errorMap: () => ({ message: "Выберите козырь" }),
  }),
});

type FormValues = z.infer<typeof formSchema>;

function GameStart() {
  const navigate = useNavigate();
  const {
    selectedPlayerIds,
    teamMode,
    currentTeamIds,
    getPlayerById,
    startGame,
  } = useParticipants();
  const dealerId = selectedPlayerIds[0];
  const dealer = dealerId ? getPlayerById(dealerId) : undefined;
  const shouldLeave =
    selectedPlayerIds.length < MIN_PLAYER_COUNT ||
    (teamMode && (!currentTeamIds.black || !currentTeamIds.red));

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      trump: "" as FormValues["trump"],
    },
  });
  const { control, handleSubmit } = form;

  useEffect(() => {
    if (shouldLeave) {
      navigate("/participants", { replace: true });
    }
  }, [shouldLeave, navigate]);

  const beginGame = (data: FormValues) => {
    if (!dealer) {
      return;
    }
    startGame({ trump: data.trump, dealerId: dealer.id });
    navigate("/game");
  };

  if (shouldLeave || !dealer) {
    return null;
  }

  return (
    <PageLayout
      footer={
        <Button
          type="submit"
          form={GAME_START_FORM_ID}
          variant="outline"
          size="lg"
          className="w-full"
        >
          Начать игру
        </Button>
      }
    >
      <SecondHeader>Подготовка</SecondHeader>
      <div className="flex flex-1 flex-col gap-4 text-left">
        <div className="flex w-fit flex-col gap-3">
          <div className="flex items-center gap-2">
            <img
              src={dealerIcon}
              alt=""
              className="size-[24px] shrink-0 object-contain"
            />
            <span>Раздает:</span>
          </div>
          <div>{dealer.name}</div>
        </div>
        <form id={GAME_START_FORM_ID} onSubmit={handleSubmit(beginGame)}>
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
        </form>
      </div>
    </PageLayout>
  );
}

export default GameStart;
