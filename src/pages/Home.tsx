import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

function Home() {
  const navigate = useNavigate();

  return (
    <div>
      <Button
        variant="outline"
        size="lg"
        className="w-full mb-4"
        onClick={() => {
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

// потом кнопки из shadcn начать новую и продолжить
// кнопка начать новая перебрасывает на страницу с выбором участников

export default Home;
