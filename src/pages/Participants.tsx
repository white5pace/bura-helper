import { Button } from "@/components/ui/button";
import { PlusIcon, PencilIcon, Trash2Icon } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldGroup, FieldLabel, FieldSet } from "@/components/ui/field";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  type Player,
  type Team,
  useParticipants,
} from "@/contexts/ParticipantsContext";
import SecondHeader from "@/shared/ui/SecondHeader";
import DeleteConfirmDialog from "@/shared/ui/DeleteConfirmDialog";

type DeleteTarget =
  | { type: "player"; id: string }
  | { type: "team"; id: string }
  | null;

interface PlayerRowProps {
  player: Player;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  onDelete: () => void;
}

function PlayerRow({
  player,
  checked,
  onCheckedChange,
  onDelete,
}: PlayerRowProps) {
  const navigate = useNavigate();

  return (
    <Field orientation="horizontal">
      <Checkbox
        id={String(player.id)}
        name={String(player.id)}
        checked={checked}
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

interface TeamRowProps {
  team: Team;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  onDelete: () => void;
}

function TeamRow({ team, checked, onCheckedChange, onDelete }: TeamRowProps) {
  const navigate = useNavigate();

  return (
    <Field orientation="horizontal">
      <Checkbox
        id={String(team.id)}
        name={String(team.id)}
        checked={checked}
        onCheckedChange={(value) => onCheckedChange(value === true)}
      />
      <FieldLabel htmlFor={String(team.id)} className="font-normal">
        {team.name}
      </FieldLabel>

      <div className="ml-auto flex shrink-0">
        <Button
          variant="ghost"
          size="icon"
          aria-label={`Редактировать ${team.name}`}
          onClick={() => navigate(`/participants/team/${team.id}`)}
        >
          <PencilIcon />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          aria-label={`Удалить ${team.name}`}
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
    teams,
    getPlayerById,
    getTeamById,
    getTeamsByPlayerId,
    deletePlayer,
    deleteTeam,
  } = useParticipants();

  const [currentTab, setCurrentTab] = useState<"players" | "teams">("players");
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [selectedTeams, setSelectedTeams] = useState<Set<string>>(new Set());
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget>(null);

  const handleSelectRow = (id: string, checked: boolean) => {
    const newSelected = new Set(selectedRows);
    if (checked) {
      newSelected.add(id);
    } else {
      newSelected.delete(id);
    }
    setSelectedRows(newSelected);
  };

  const handleSelectTeam = (id: string, checked: boolean) => {
    const newSelected = new Set(selectedTeams);
    if (checked) {
      newSelected.add(id);
    } else {
      newSelected.delete(id);
    }
    setSelectedTeams(newSelected);
  };

  const addParticipant = () => {
    if (currentTab === "players") {
      navigate("/participants/player");
    } else {
      navigate("/participants/team");
    }
  };

  const deleteDialogContent = useMemo(() => {
    if (!deleteTarget) {
      return { title: "", description: "" };
    }

    if (deleteTarget.type === "team") {
      const team = getTeamById(deleteTarget.id);
      if (!team) {
        return { title: "", description: "" };
      }

      return {
        title: "Удалить команду?",
        description: `Вы уверены, что хотите удалить команду «${team.name}»?`,
      };
    }

    const player = getPlayerById(deleteTarget.id);
    if (!player) {
      return { title: "", description: "" };
    }

    const relatedTeams = getTeamsByPlayerId(deleteTarget.id);
    const teamsMessage =
      relatedTeams.length > 0
        ? `\n\nТакже будут удалены команды: ${relatedTeams.map((team) => `«${team.name}»`).join(", ")}.`
        : "";

    return {
      title: "Удалить игрока?",
      description: `Вы уверены, что хотите удалить игрока «${player.name}»?${teamsMessage}`,
    };
  }, [deleteTarget, getPlayerById, getTeamById, getTeamsByPlayerId]);

  const handleConfirmDelete = () => {
    if (!deleteTarget) {
      return;
    }

    if (deleteTarget.type === "player") {
      const relatedTeams = getTeamsByPlayerId(deleteTarget.id);
      deletePlayer(deleteTarget.id);
      setSelectedRows((prev) => {
        const next = new Set(prev);
        next.delete(deleteTarget.id);
        return next;
      });
      if (relatedTeams.length > 0) {
        setSelectedTeams((prev) => {
          const next = new Set(prev);
          relatedTeams.forEach((team) => next.delete(team.id));
          return next;
        });
      }
    } else {
      deleteTeam(deleteTarget.id);
      setSelectedTeams((prev) => {
        const next = new Set(prev);
        next.delete(deleteTarget.id);
        return next;
      });
    }

    setDeleteTarget(null);
  };

  return (
    <div>
      <SecondHeader
        actions={
          <Button
            variant="ghost"
            size="icon"
            className="ml-auto"
            onClick={addParticipant}
          >
            <PlusIcon />
          </Button>
        }
      >
        Выберите участников
      </SecondHeader>

      <Tabs
        value={currentTab}
        className="w-full"
        onValueChange={(e) => {
          setCurrentTab(e);
        }}
      >
        <TabsList>
          <TabsTrigger value="players">Игроки</TabsTrigger>
          <TabsTrigger value="teams">Команды</TabsTrigger>
        </TabsList>

        <TabsContent value="players">
          <FieldSet>
            <FieldGroup className="gap-3">
              {players.length === 0 ? (
                <p className="text-muted-foreground">
                  Нет игроков. Нажмите +, чтобы добавить.
                </p>
              ) : (
                players.map((player) => (
                  <PlayerRow
                    key={player.id}
                    player={player}
                    checked={selectedRows.has(player.id)}
                    onCheckedChange={(checked) =>
                      handleSelectRow(player.id, checked)
                    }
                    onDelete={() =>
                      setDeleteTarget({ type: "player", id: player.id })
                    }
                  />
                ))
              )}
            </FieldGroup>
          </FieldSet>
        </TabsContent>

        <TabsContent value="teams">
          <FieldSet>
            <FieldGroup className="gap-3">
              {teams.length === 0 ? (
                <p className="text-muted-foreground">
                  Нет команд. Нажмите +, чтобы добавить.
                </p>
              ) : (
                teams.map((team) => (
                  <TeamRow
                    key={team.id}
                    team={team}
                    checked={selectedTeams.has(team.id)}
                    onCheckedChange={(checked) =>
                      handleSelectTeam(team.id, checked)
                    }
                    onDelete={() =>
                      setDeleteTarget({ type: "team", id: team.id })
                    }
                  />
                ))
              )}
            </FieldGroup>
          </FieldSet>
        </TabsContent>
      </Tabs>

      <DeleteConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteTarget(null);
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
