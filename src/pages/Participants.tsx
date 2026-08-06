import { Button } from "@/components/ui/button";
import { PlusIcon, PencilIcon } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldGroup, FieldLabel, FieldSet } from "@/components/ui/field";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { type Player, usePlayers } from "@/contexts/PlayersContext";
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

function Participants() {
  const navigate = useNavigate();
  const { players } = usePlayers();

  const [currentTab, setCurrentTab] = useState<"players" | "teams">("players");

  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());

  const handleSelectRow = (id: string, checked: boolean) => {
    const newSelected = new Set(selectedRows);
    if (checked) {
      newSelected.add(id);
    } else {
      newSelected.delete(id);
    }
    setSelectedRows(newSelected);
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

        <TabsContent value="teams">Change your password here.</TabsContent>
      </Tabs>
    </div>
  );
}

export default Participants;
