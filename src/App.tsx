import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { ParticipantsProvider } from "./contexts/ParticipantsContext";
import MainLayout from "./layouts/MainLayout";
import Home from "./pages/Home";
import Participants from "./pages/Participants";
import Player from "./pages/Player";

const router = createBrowserRouter([
  {
    path: "/",
    element: <MainLayout />,
    children: [
      { index: true, element: <Home /> },
      { path: "/participants", element: <Participants /> },
      { path: "/participants/player/:id?", element: <Player /> },
    ],
  },
]);

function App() {
  return (
    <ParticipantsProvider>
      <RouterProvider router={router} />
    </ParticipantsProvider>
  );
}

export default App;
