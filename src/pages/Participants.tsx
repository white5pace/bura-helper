import { Button } from "@/components/ui/button";
import { PlusIcon, PencilIcon, Trash2Icon } from "lucide-react";
import { NumberedCheckbox } from "@/components/ui/numbered-checkbox";
import { Field, FieldGroup, FieldLabel, FieldSet } from "@/components/ui/field";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { type Player, useParticipants } from "@/contexts/ParticipantsContext";
import SecondHeader from "@/shared/ui/SecondHeader";
import DeleteConfirmDialog from "@/shared/ui/DeleteConfirmDialog";

interface PlayerRowProps {
  player: Player;
  checked: boolean;
  orderNumber?: number;
  onCheckedChange: (checked: boolean) => void;
  onDelete: () => void;
}

function PlayerRow({
  player,
  checked,
  orderNumber,
  onCheckedChange,
  onDelete,
}: PlayerRowProps) {
  const navigate = useNavigate();

  return (
    <Field orientation="horizontal">
      <NumberedCheckbox
        id={String(player.id)}
        name={String(player.id)}
        checked={checked}
        orderNumber={orderNumber}
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
  const { players, getPlayerById, deletePlayer } = useParticipants();

  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [deletePlayerId, setDeletePlayerId] = useState<string | null>(null);

  const handleSelectRow = (id: string, checked: boolean) => {
    setSelectedRows((prev) =>
      checked ? [...prev, id] : prev.filter((rowId) => rowId !== id),
    );
  };

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
      description: `Вы уверены, что хотите удалить игрока «${player.name}»?`,
    };
  }, [deletePlayerId, getPlayerById]);

  const handleConfirmDelete = () => {
    if (!deletePlayerId) {
      return;
    }

    deletePlayer(deletePlayerId);
    setSelectedRows((prev) => prev.filter((rowId) => rowId !== deletePlayerId));
    setDeletePlayerId(null);
  };

  return (
    <div>
      <SecondHeader
        actions={
          <Button
            variant="secondary"
            size="icon"
            className="ml-auto"
            onClick={() => navigate("/participants/player")}
          >
            <PlusIcon />
          </Button>
        }
      >
        Выберите участников
      </SecondHeader>

      <FieldSet>
        <FieldGroup className="gap-3">
          {players.length === 0 ? (
            <p className="text-muted-foreground">
              Нет игроков. Нажмите +, чтобы добавить.
            </p>
          ) : (
            players.map((player) => {
              const orderIndex = selectedRows.indexOf(player.id);

              return (
                <PlayerRow
                  key={player.id}
                  player={player}
                  checked={orderIndex !== -1}
                  orderNumber={
                    orderIndex !== -1 ? orderIndex + 1 : undefined
                  }
                  onCheckedChange={(checked) =>
                    handleSelectRow(player.id, checked)
                  }
                  onDelete={() => setDeletePlayerId(player.id)}
                />
              );
            })
          )}
        </FieldGroup>
      </FieldSet>

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
    </div>
  );
}

export default Participants;
