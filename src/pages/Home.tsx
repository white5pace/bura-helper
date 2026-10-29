import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useParticipants } from "@/contexts/ParticipantsContext";

function Home() {
  const navigate = useNavigate();
  const { resetGame } = useParticipants();

  return (
    <div>
      <Button
        variant="outline"
        size="lg"
        className="w-full mb-4"
        onClick={() => {
          resetGame();
          navigate({ pathname: "/participants" });
        }}
      >
        Начать новую игру
      </Button>
      <Button variant="outline" size="lg" className="w-full ">
        Продолжить
      </Button>
    </div>
  );
}

export default Home;
