import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { Toaster } from "./components/ui/toast";
import { ParticipantsProvider } from "./contexts/ParticipantsContext";
import MainLayout from "./layouts/MainLayout";
import RequireNotStarted from "./layouts/RequireNotStarted";
import RequireStartedGame from "./layouts/RequireStartedGame";
import SessionErrorBoundary from "./widgets/session-error-boundary/SessionErrorBoundary";
import Game from "./pages/Game";
import GameStart from "./pages/GameStart";
import Home from "./pages/Home";
import Participants from "./pages/Participants";
import Player from "./pages/Player";
import Teams from "./pages/Teams";

const router = createBrowserRouter([
  {
    path: "/",
    element: <MainLayout />,
    children: [
      { index: true, element: <Home /> },
      {
        element: <RequireNotStarted />,
        children: [
          { path: "/participants", element: <Participants /> },
          { path: "/participants/player/:id?", element: <Player /> },
          { path: "/teams", element: <Teams /> },
          { path: "/game-start", element: <GameStart /> },
        ],
      },
      {
        element: <RequireStartedGame />,
        children: [
          { path: "/game", element: <Game /> },
          { path: "/round-end", element: <p>Завершение раунда</p> },
          { path: "/game-end", element: <p>Завершение игры</p> },
        ],
      },
    ],
  },
]);

function App() {
  return (
    <SessionErrorBoundary
      onReset={() => router.navigate("/", { replace: true })}
    >
      <ParticipantsProvider>
        <Toaster>
          <RouterProvider router={router} />
        </Toaster>
      </ParticipantsProvider>
    </SessionErrorBoundary>
  );
}

export default App;
