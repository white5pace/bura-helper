import { Button } from "@/components/ui/button";
import { PlusIcon, PencilIcon, Trash2Icon } from "lucide-react";
import { NumberedCheckbox } from "@/components/ui/numbered-checkbox";
import { Field, FieldGroup, FieldLabel, FieldSet } from "@/components/ui/field";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/components/ui/toast";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { type Player, useParticipants } from "@/contexts/ParticipantsContext";
import { TEAM_MODE_PLAYER_COUNT } from "@/lib/gameRules";
import PageLayout from "@/shared/ui/PageLayout";
import SecondHeader from "@/shared/ui/SecondHeader";
import DeleteConfirmDialog from "@/shared/ui/DeleteConfirmDialog";

interface PlayerRowProps {
  player: Player;
  checked: boolean;
  disabled?: boolean;
  orderNumber?: number;
  tone?: "default" | "team";
  onCheckedChange: (checked: boolean) => void;
  onDelete: () => void;
}

function PlayerRow({
  player,
  checked,
  disabled,
  orderNumber,
  tone = "default",
  onCheckedChange,
  onDelete,
}: PlayerRowProps) {
  const navigate = useNavigate();

  return (
    <Field orientation="horizontal" className="gap-3">
      <NumberedCheckbox
        id={String(player.id)}
        name={String(player.id)}
        checked={checked}
        disabled={disabled}
        orderNumber={orderNumber}
        tone={tone}
        onCheckedChange={(value) => onCheckedChange(value === true)}
      />
      <FieldLabel htmlFor={String(player.id)} className="font-normal">
        {player.name}
      </FieldLabel>

      <div className="ml-auto flex shrink-0">
        <Button
          variant="ghost"
          size="icon"
          aria-label={`Редактировать ${player.name}`}
          onClick={() => navigate(`/participants/player/${player.id}`)}
        >
          <PencilIcon />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          aria-label={`Удалить ${player.name}`}
          onClick={onDelete}
        >
          <Trash2Icon />
        </Button>
      </div>
    </Field>
  );
}

function Participants() {
  const navigate = useNavigate();
  const {
    players,
    selectedPlayerIds,
    teamMode,
    setTeamMode,
    setPlayerSelected,
    getPlayerById,
    deletePlayer,
    commitTeamSelection,
  } = useParticipants();

  const [deletePlayerId, setDeletePlayerId] = useState<string | null>(null);

  const selectionLimitReached =
    selectedPlayerIds.length >= TEAM_MODE_PLAYER_COUNT;

  const deleteDialogContent = useMemo(() => {
    if (!deletePlayerId) {
      return { title: "", description: "" };
    }

    const player = getPlayerById(deletePlayerId);
    if (!player) {
      return { title: "", description: "" };
    }

    return {
      title: "Удалить игрока?",
      description: `Вы уверены, что хотите удалить игрока «${player.name}»? Вместе с ним будут удалены все команды, в которых он состоит.`,
    };
  }, [deletePlayerId, getPlayerById]);

  const handleConfirmDelete = () => {
    if (!deletePlayerId) {
      return;
    }

    deletePlayer(deletePlayerId);
    setDeletePlayerId(null);
  };

  const handleContinue = () => {
    if (teamMode && selectedPlayerIds.length < TEAM_MODE_PLAYER_COUNT) {
      toast.add({
        type: "error",
        title: "Выберите четырёх игроков для командного режима",
      });
      return;
    }

    if (teamMode) {
      if (!commitTeamSelection()) {
        return;
      }
      navigate("/teams");
      return;
    }

    navigate("/game-start");
  };

  return (
    <PageLayout
      footer={
        <Button
          type="button"
          variant="outline"
          size="lg"
          className="w-full"
          onClick={handleContinue}
        >
          Продолжить
        </Button>
      }
    >
      <SecondHeader
        actions={
          <Button
            variant="ghost"
            size="icon"
            iconSize="lg"
            className="ml-auto"
            onClick={() => navigate("/participants/player")}
          >
            <PlusIcon />
          </Button>
        }
      >
        Выберите участников
      </SecondHeader>

      <div className="flex flex-col gap-4">
        <div className="flex w-full items-center">
          <div className="flex items-center gap-2">
            <Switch
              id="team-mode"
              size="lg"
              checked={teamMode}
              onCheckedChange={(checked) => setTeamMode(checked)}
            />
            <Label htmlFor="team-mode">Командный режим</Label>
          </div>
          {teamMode ? (
            <span className="ml-auto font-medium">
              {selectedPlayerIds.length} из {TEAM_MODE_PLAYER_COUNT}
            </span>
          ) : null}
        </div>

        <FieldSet>
          <FieldGroup className="gap-4">
            {players.length === 0 ? (
              <p className="text-muted-foreground">
                Нет игроков. Нажмите +, чтобы добавить.
              </p>
            ) : (
              players.map((player) => {
                const orderIndex = selectedPlayerIds.indexOf(player.id);
                const checked = orderIndex !== -1;
                const orderNumber = checked ? orderIndex + 1 : undefined;
                const tone =
                  teamMode && (orderNumber === 2 || orderNumber === 4)
                    ? "team"
                    : "default";

                return (
                  <PlayerRow
                    key={player.id}
                    player={player}
                    checked={checked}
                    disabled={!checked && selectionLimitReached}
                    orderNumber={orderNumber}
                    tone={tone}
                    onCheckedChange={(isChecked) =>
                      setPlayerSelected(player.id, isChecked)
                    }
                    onDelete={() => setDeletePlayerId(player.id)}
                  />
                );
              })
            )}
          </FieldGroup>
        </FieldSet>
      </div>

      <DeleteConfirmDialog
        open={deletePlayerId !== null}
        onOpenChange={(open) => {
          if (!open) {
            setDeletePlayerId(null);
          }
        }}
        title={deleteDialogContent.title}
        description={deleteDialogContent.description}
        onConfirm={handleConfirmDelete}
      />
    </PageLayout>
  );
}

export default Participants;
