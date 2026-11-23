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
import { useParticipants } from "@/contexts/ParticipantsContext";

function Home() {
  const navigate = useNavigate();
  const { gameStarted, resetGame } = useParticipants();
  const [confirmNewGame, setConfirmNewGame] = useState(false);

  const startNewGame = () => {
    resetGame();
    navigate("/participants");
  };

  return (
    <div>
      <Button
        variant="outline"
        size="lg"
        className="w-full mb-4"
        onClick={() => {
          if (gameStarted) {
            setConfirmNewGame(true);
            return;
          }
          startNewGame();
        }}
      >
        Начать новую игру
      </Button>
      {gameStarted ? (
        <Button
          variant="outline"
          size="lg"
          className="w-full"
          onClick={() => navigate("/game")}
        >
          Продолжить
        </Button>
      ) : null}
      <AlertDialog open={confirmNewGame} onOpenChange={setConfirmNewGame}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Начать новую игру</AlertDialogTitle>
            <AlertDialogDescription>
              Вы уверены, что хотите начать новую игру? Текущая партия будет
              сброшена.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction
              type="button"
              onClick={() => {
                setConfirmNewGame(false);
                startNewGame();
              }}
            >
              Начать
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default Home;
