import { render, screen } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { ParticipantsProvider } from "@/contexts/ParticipantsContext";
import RequireNotStarted from "@/layouts/RequireNotStarted";
import { seedStorage } from "@/test/storage";

const PREP_ROUTES = ["/participants", "/teams", "/game-start"] as const;

function seedStartedGame() {
  seedStorage({
    players: [{ id: "p1", name: "Алиса" }],
    selectedPlayerIds: ["p1"],
    gameStarted: true,
    trump: "пики",
    dealerId: "p1",
  });
}

function renderGuard(path: string) {
  let childMounted = false;

  function PrepPage() {
    childMounted = true;
    return <h1>Подготовка</h1>;
  }

  const router = createMemoryRouter(
    [
      {
        element: <RequireNotStarted />,
        children: PREP_ROUTES.map((routePath) => ({
          path: routePath,
          element: <PrepPage />,
        })),
      },
      { path: "/game", element: <h1>Игра</h1> },
    ],
    { initialEntries: [path] },
  );

  render(
    <ParticipantsProvider>
      <RouterProvider router={router} />
    </ParticipantsProvider>,
  );

  return {
    router,
    childMounted: () => childMounted,
  };
}

describe("RequireNotStarted", () => {
  it.each(PREP_ROUTES)(
    "redirects %s to /game with replace and does not mount the child when the game has started",
    async (path) => {
      seedStartedGame();
      const { router, childMounted } = renderGuard(path);

      expect(
        await screen.findByRole("heading", { name: "Игра" }),
      ).toBeInTheDocument();
      expect(
        screen.queryByRole("heading", { name: "Подготовка" }),
      ).not.toBeInTheDocument();
      expect(childMounted()).toBe(false);
      expect(router.state.location.pathname).toBe("/game");
      expect(router.state.historyAction).toBe("REPLACE");
    },
  );

  it.each(PREP_ROUTES)(
    "renders the child page at %s when the game has not started",
    (path) => {
      seedStorage({ players: [{ id: "p1", name: "Алиса" }] });
      const { router, childMounted } = renderGuard(path);

      expect(
        screen.getByRole("heading", { name: "Подготовка" }),
      ).toBeInTheDocument();
      expect(childMounted()).toBe(true);
      expect(router.state.location.pathname).toBe(path);
    },
  );
});
