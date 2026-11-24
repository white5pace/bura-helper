import { Navigate, Outlet } from "react-router-dom";
import { useParticipants } from "@/contexts/ParticipantsContext";

function RequireStartedGame() {
  const { gameStarted } = useParticipants();

  if (!gameStarted) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}

export default RequireStartedGame;
