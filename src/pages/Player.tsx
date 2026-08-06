import { useEffect, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel, FieldError } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useParticipants } from "@/contexts/ParticipantsContext";
import PageLayout from "@/shared/ui/PageLayout";
import SecondHeader from "@/shared/ui/SecondHeader";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const PLAYER_FORM_ID = "player-form";

function Player() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { getPlayerById, updatePlayer, addPlayer, players } = useParticipants();

  const player = id ? getPlayerById(id) : undefined;

  const formSchema = useMemo(
    () =>
      z.object({
        playerName: z
          .string()
          .trim()
          .min(2, {
            message: "Имя пользователя должно содержать минимум 2 символа.",
          })
          .refine(
            (name) => {
              const existingPlayer = players.find(
                (p) => p.name.toLowerCase() === name.toLowerCase(),
              );

              if (existingPlayer && id) {
                return existingPlayer.id === id;
              }

              return !existingPlayer;
            },
            {
              message: "Игрок с таким именем уже существует",
            },
          ),
      }),
    [players, id],
  );

  type FormValues = z.infer<typeof formSchema>;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      playerName: player?.name ?? "",
    },
  });

  useEffect(() => {
    if (id && !player) {
      navigate("/participants", { replace: true });
    }
  }, [id, navigate, player]);

  useEffect(() => {
    form.reset({ playerName: player?.name ?? "" });
  }, [form, id, player?.name]);

  const savePlayer = (data: FormValues) => {
    if (id) {
      if (!player) {
        return;
      }
      updatePlayer(id, data.playerName);
    } else {
      addPlayer(data.playerName);
    }
    navigate("/participants");
  };

  if (id && !player) {
    return null;
  }

  return (
    <PageLayout
      footer={
        <Button
          type="submit"
          form={PLAYER_FORM_ID}
          variant="outline"
          size="lg"
          className="w-full"
        >
          Сохранить
        </Button>
      }
    >
      <SecondHeader>Игрок</SecondHeader>
      <form id={PLAYER_FORM_ID} onSubmit={form.handleSubmit(savePlayer)}>
        <Controller
          name="playerName"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="player-name">Имя игрока</FieldLabel>
              <Input
                {...field}
                id="player-name"
                aria-invalid={fieldState.invalid}
                placeholder="Имя игрока"
                autoComplete="off"
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
      </form>
    </PageLayout>
  );
}

export default Player;
