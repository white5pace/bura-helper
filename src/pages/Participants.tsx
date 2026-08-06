import { Button } from "@/components/ui/button";
import { PlusIcon, PencilIcon } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldGroup, FieldLabel, FieldSet } from "@/components/ui/field";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  type Player,
  type Team,
  useParticipants,
} from "@/contexts/ParticipantsContext";
import SecondHeader from "@/shared/ui/SecondHeader";

interface PlayerRowProps {
  player: Player;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}

function PlayerRow({ player, checked, onCheckedChange }: PlayerRowProps) {
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

      <Button
        variant="ghost"
        size="icon"
        className="ml-auto"
        aria-label={`Редактировать ${player.name}`}
        onClick={() => navigate(`/participants/player/${player.id}`)}
      >
        <PencilIcon />
      </Button>
    </Field>
  );
}

interface TeamRowProps {
  team: Team;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}

function TeamRow({ team, checked, onCheckedChange }: TeamRowProps) {
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

      <Button
        variant="ghost"
        size="icon"
        className="ml-auto"
        aria-label={`Редактировать ${team.name}`}
        onClick={() => navigate(`/participants/team/${team.id}`)}
      >
        <PencilIcon />
      </Button>
    </Field>
  );
}

function Participants() {
  const navigate = useNavigate();
  const { players, teams } = useParticipants();

  const [currentTab, setCurrentTab] = useState<"players" | "teams">("players");

  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [selectedTeams, setSelectedTeams] = useState<Set<string>>(new Set());

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
                  />
                ))
              )}
            </FieldGroup>
          </FieldSet>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default Participants;
