import { Button } from "@/components/ui/button";
import { PlusIcon, PencilIcon } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldGroup, FieldLabel, FieldSet } from "@/components/ui/field";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

interface PlayerRowProps {
  player: Player;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}

function PlayerRow({ player, checked, onCheckedChange }: PlayerRowProps) {
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

      <Button variant="ghost" size="icon" className="ml-auto">
        <PencilIcon />
      </Button>
    </Field>
  );
}

interface Player {
  id: number;
  name: string;
}

const players: Player[] = [
  { id: 1, name: "Роман" },
  { id: 2, name: "Ирина" },
  { id: 3, name: "Анастасия" },
  { id: 4, name: "Колян" },
];

function Participants() {
  const navigate = useNavigate();

  const [currentTab, setCurrentTab] = useState<"players" | "teams">("players");

  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());

  const handleSelectRow = (id: number, checked: boolean) => {
    const newSelected = new Set(selectedRows);
    if (checked) {
      newSelected.add(id);
    } else {
      newSelected.delete(id);
    }
    setSelectedRows(newSelected);

    console.log(newSelected);
  };

  const addParticipant = () => {
    if (currentTab === "players") {
      navigate("/participant/player");
    } else {
      navigate("/participant/team");
    }
  };

  return (
    <div>
      <div className="flex">
        <h2 className="m-0!">Выберите участников </h2>
        <Button
          variant="ghost"
          size="icon"
          className="ml-auto"
          onClick={addParticipant}
        >
          <PlusIcon />
        </Button>
      </div>

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
              {players.map((player) => (
                <PlayerRow
                  key={player.id}
                  player={player}
                  checked={selectedRows.has(player.id)}
                  onCheckedChange={(checked) =>
                    handleSelectRow(player.id, checked)
                  }
                />
              ))}
            </FieldGroup>
          </FieldSet>
        </TabsContent>

        <TabsContent value="teams">Change your password here.</TabsContent>
      </Tabs>
    </div>
  );
}

export default Participants;
