import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { Toaster } from "./components/ui/toast";
import { ParticipantsProvider } from "./contexts/ParticipantsContext";
import MainLayout from "./layouts/MainLayout";
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
      { path: "/participants", element: <Participants /> },
      { path: "/participants/player/:id?", element: <Player /> },
      { path: "/teams", element: <Teams /> },
      { path: "/game-start", element: <GameStart /> },
    ],
  },
]);

function App() {
  return (
    <ParticipantsProvider>
      <Toaster>
        <RouterProvider router={router} />
      </Toaster>
    </ParticipantsProvider>
  );
}

export default App;
