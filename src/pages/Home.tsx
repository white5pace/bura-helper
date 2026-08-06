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

export default Home;
