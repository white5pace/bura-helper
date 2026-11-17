import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  clubs,
  dealer as dealerIcon,
  diamonds,
  hearts,
  spades,
} from "@/assets/icons";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useParticipants } from "@/contexts/ParticipantsContext";
import { TRUMP_SUITS, type TrumpSuit } from "@/lib/currentGameStorage";
import PageLayout from "@/shared/ui/PageLayout";
import SecondHeader from "@/shared/ui/SecondHeader";

const GAME_START_FORM_ID = "game-start-form";

const SUIT_OPTIONS: { value: TrumpSuit; src: string; alt: string }[] = [
  { value: "крести", src: clubs, alt: "крести" },
  { value: "пики", src: spades, alt: "пики" },
  { value: "черви", src: hearts, alt: "черви" },
  { value: "буби", src: diamonds, alt: "буби" },
];

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
  const missingTeams =
    teamMode && (!currentTeamIds.black || !currentTeamIds.red);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      trump: "" as FormValues["trump"],
    },
  });
  const { control, handleSubmit } = form;

  useEffect(() => {
    if (!dealer || missingTeams) {
      navigate("/participants", { replace: true });
    }
  }, [dealer, missingTeams, navigate]);

  const beginGame = (data: FormValues) => {
    if (!dealer) {
      return;
    }
    startGame({ trump: data.trump, dealerId: dealer.id });
    navigate("/game");
  };

  if (!dealer || missingTeams) {
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
                <RadioGroup
                  name={field.name}
                  value={field.value}
                  onValueChange={(value) => {
                    field.onChange(value);
                  }}
                  className="flex w-auto flex-row items-center gap-4"
                >
                  {SUIT_OPTIONS.map((suit) => (
                    <Label key={suit.value}>
                      <RadioGroupItem
                        value={suit.value}
                        aria-invalid={fieldState.invalid}
                      />
                      <img src={suit.src} alt={suit.alt} className="shrink-0" />
                    </Label>
                  ))}
                </RadioGroup>
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
