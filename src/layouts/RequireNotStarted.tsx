import { Navigate, Outlet } from "react-router-dom";
import { useParticipants } from "@/contexts/ParticipantsContext";

function RequireNotStarted() {
  const { gameStarted } = useParticipants();

  if (gameStarted) {
    return <Navigate to="/game" replace />;
  }

  return <Outlet />;
}

export default RequireNotStarted;
