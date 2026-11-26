import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { useParticipants, type Player } from "@/contexts/ParticipantsContext";
import GameCard, { type GameCardPlayer } from "@/shared/ui/GameCard";
import PageLayout from "@/shared/ui/PageLayout";

function Game() {
  const navigate = useNavigate();
  const {
    selectedPlayerIds,
    teamMode,
    currentTeamIds,
    trump,
    dealerId,
    scores,
    getPlayerById,
    getTeamById,
  } = useParticipants();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const confirmRoundEnd = () => {
    setConfirmOpen(false);
    navigate("/round-end");
  };

  if (!trump) {
    return null;
  }

  const players: GameCardPlayer[] = selectedPlayerIds
    .map((id) => getPlayerById(id))
    .filter((player): player is Player => player !== undefined)
    .map(({ id, name }) => ({ id, name }));

  const teamNames = {
    black: currentTeamIds.black
      ? (getTeamById(currentTeamIds.black)?.name ?? null)
      : null,
    red: currentTeamIds.red
      ? (getTeamById(currentTeamIds.red)?.name ?? null)
      : null,
  };

  return (
    <PageLayout
      footer={
        <Button
          type="button"
          variant="outline"
          size="default"
          className="w-full shadow-xs"
          onClick={() => {
            setConfirmOpen(true);
          }}
        >
          Завершить раунд
        </Button>
      }
    >
      <GameCard
        trump={trump}
        players={players}
        teamMode={teamMode}
        teamNames={teamNames}
        teamIds={currentTeamIds}
        scores={scores}
        dealerId={dealerId}
      />
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Завершить раунд</AlertDialogTitle>
            <AlertDialogDescription>
              Вы уверены, что хотите закончить данный раунд?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction type="button" onClick={confirmRoundEnd}>
              Завершить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageLayout>
  );
}

export default Game;
