import { useEffect, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { type Player, useParticipants } from "@/contexts/ParticipantsContext";
import PageLayout from "@/shared/ui/PageLayout";
import SecondHeader from "@/shared/ui/SecondHeader";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";

const TEAM_FORM_ID = "team-form";

interface TeamPlayerRowProps {
  player: Player;
  checked: boolean;
  disabled: boolean;
  onCheckedChange: (checked: boolean) => void;
}

function TeamPlayerRow({
  player,
  checked,
  disabled,
  onCheckedChange,
}: TeamPlayerRowProps) {
  return (
    <Field orientation="horizontal" data-disabled={disabled || undefined}>
      <Checkbox
        id={`team-player-${player.id}`}
        name={`team-player-${player.id}`}
        checked={checked}
        disabled={disabled}
        onCheckedChange={(value) => onCheckedChange(value === true)}
      />
      <FieldLabel htmlFor={`team-player-${player.id}`} className="font-normal">
        {player.name}
      </FieldLabel>
    </Field>
  );
}

function Team() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { players, teams, getTeamById, addTeam, updateTeam } =
    useParticipants();

  const team = id ? getTeamById(id) : undefined;

  const formSchema = useMemo(
    () =>
      z.object({
        teamName: z
          .string()
          .trim()
          .min(2, {
            message: "Имя команды должно содержать минимум 2 символа.",
          })
          .refine(
            (name) => {
              const existingTeam = teams.find(
                (t) => t.name.toLowerCase() === name.toLowerCase(),
              );

              if (existingTeam && id) {
                return existingTeam.id === id;
              }

              return !existingTeam;
            },
            {
              message: "Команда с таким именем уже существует",
            },
          ),
        playerIds: z.array(z.string()).length(2, {
          message: "В команде должно быть ровно 2 игрока",
        }),
      }),
    [teams, id],
  );

  type FormValues = z.infer<typeof formSchema>;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      teamName: team?.name ?? "",
      playerIds: team?.playerIds ?? [],
    },
  });

  useEffect(() => {
    if (id && !team) {
      navigate("/participants", { replace: true });
    }
  }, [id, navigate, team]);

  useEffect(() => {
    form.reset({
      teamName: team?.name ?? "",
      playerIds: team?.playerIds ?? [],
    });
  }, [form, id, team?.name, team?.playerIds]);

  const saveTeam = (data: FormValues) => {
    if (id) {
      if (!team) {
        return;
      }
      updateTeam(id, data.teamName, data.playerIds);
    } else {
      addTeam(data.teamName, data.playerIds);
    }
    navigate("/participants");
  };

  const handlePlayerCheckedChange = (
    playerId: string,
    checked: boolean,
    currentIds: string[],
    onChange: (value: string[]) => void,
  ) => {
    if (checked) {
      onChange([...currentIds, playerId]);
      return;
    }

    onChange(currentIds.filter((currentId) => currentId !== playerId));
  };

  if (id && !team) {
    return null;
  }

  return (
    <PageLayout
      footer={
        <Button
          type="submit"
          form={TEAM_FORM_ID}
          variant="outline"
          size="lg"
          className="w-full"
        >
          Сохранить
        </Button>
      }
    >
      <SecondHeader>Команда</SecondHeader>
      <form id={TEAM_FORM_ID} onSubmit={form.handleSubmit(saveTeam)}>
        <Controller
          name="teamName"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field className="mb-6" data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="team-name">Имя команды</FieldLabel>
              <Input
                {...field}
                id="team-name"
                aria-invalid={fieldState.invalid}
                placeholder="Имя команды"
                autoComplete="off"
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Controller
          name="playerIds"
          control={form.control}
          render={({ field, fieldState }) => {
            const isMaxPlayersSelected = field.value.length >= 2;

            return (
              <div
                className="flex flex-col gap-2 data-[invalid=true]:text-destructive"
                data-invalid={fieldState.invalid || undefined}
              >
                {players.length < 2 ? (
                  <p className="text-muted-foreground">
                    Для создания команды нужно минимум 2 игрока на вкладке
                    «Игроки».
                  </p>
                ) : (
                  <FieldGroup className="gap-3">
                    {players.map((player) => (
                      <TeamPlayerRow
                        key={player.id}
                        player={player}
                        checked={field.value.includes(player.id)}
                        disabled={
                          isMaxPlayersSelected &&
                          !field.value.includes(player.id)
                        }
                        onCheckedChange={(checked) =>
                          handlePlayerCheckedChange(
                            player.id,
                            checked,
                            field.value,
                            field.onChange,
                          )
                        }
                      />
                    ))}
                  </FieldGroup>
                )}
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </div>
            );
          }}
        />
      </form>
    </PageLayout>
  );
}

export default Team;
