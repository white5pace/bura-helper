import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useParticipants } from "@/contexts/ParticipantsContext";
import PageLayout from "@/shared/ui/PageLayout";
import SecondHeader from "@/shared/ui/SecondHeader";

const TEAMS_FORM_ID = "teams-form";

const formSchema = z.object({
  blackTeamName: z
    .string()
    .trim()
    .min(3, "Название команды должно содержать минимум 3 символа."),
  redTeamName: z
    .string()
    .trim()
    .min(3, "Название команды должно содержать минимум 3 символа."),
});

type FormValues = z.infer<typeof formSchema>;

function Teams() {
  const navigate = useNavigate();
  const {
    selectedPlayerIds,
    getPlayerById,
    getTeamById,
    currentTeamIds,
    setTeamName,
  } = useParticipants();
  const selectedPlayers = selectedPlayerIds.map(getPlayerById);
  const hasRequiredPlayers =
    selectedPlayers.length === 4 &&
    selectedPlayers.every((player) => player !== undefined);
  const blackTeam = currentTeamIds.black
    ? getTeamById(currentTeamIds.black)
    : undefined;
  const redTeam = currentTeamIds.red
    ? getTeamById(currentTeamIds.red)
    : undefined;
  const hasCurrentTeams = blackTeam !== undefined && redTeam !== undefined;
  const blackTeamName = blackTeam?.name ?? "";
  const redTeamName = redTeam?.name ?? "";

  const blackPlayers = hasRequiredPlayers
    ? [selectedPlayers[0], selectedPlayers[2]]
    : [];
  const redPlayers = hasRequiredPlayers
    ? [selectedPlayers[1], selectedPlayers[3]]
    : [];

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      blackTeamName,
      redTeamName,
    },
  });
  const { reset, control, handleSubmit } = form;

  useEffect(() => {
    if (!hasRequiredPlayers) {
      navigate("/participants", { replace: true });
    }
  }, [hasRequiredPlayers, navigate]);

  useEffect(() => {
    if (blackTeamName || redTeamName) {
      reset({
        blackTeamName,
        redTeamName,
      });
    }
  }, [blackTeamName, redTeamName, reset]);

  const saveTeams = (data: FormValues) => {
    if (!currentTeamIds.black || !currentTeamIds.red) {
      return;
    }
    setTeamName(currentTeamIds.black, data.blackTeamName);
    setTeamName(currentTeamIds.red, data.redTeamName);
    navigate("/game-start");
  };

  if (!hasRequiredPlayers || !hasCurrentTeams) {
    return null;
  }

  const blackPlayerNames = blackPlayers
    .map((player) => player?.name)
    .join(", ");
  const redPlayerNames = redPlayers.map((player) => player?.name).join(", ");

  return (
    <PageLayout
      footer={
        <Button
          type="submit"
          form={TEAMS_FORM_ID}
          variant="outline"
          size="lg"
          className="w-full"
        >
          Продолжить
        </Button>
      }
    >
      <SecondHeader>Команды</SecondHeader>
      <form id={TEAMS_FORM_ID} onSubmit={handleSubmit(saveTeams)}>
        <FieldGroup className="gap-4">
          <Controller
            name="blackTeamName"
            control={control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="black-team-name">
                  Имя команды чёрных ({blackPlayerNames})
                </FieldLabel>
                <Input
                  {...field}
                  id="black-team-name"
                  aria-invalid={fieldState.invalid}
                  autoComplete="off"
                />
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />
          <Controller
            name="redTeamName"
            control={control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="red-team-name">
                  Имя команды красных ({redPlayerNames})
                </FieldLabel>
                <Input
                  {...field}
                  id="red-team-name"
                  aria-invalid={fieldState.invalid}
                  autoComplete="off"
                />
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />
        </FieldGroup>
      </form>
    </PageLayout>
  );
}

export default Teams;
