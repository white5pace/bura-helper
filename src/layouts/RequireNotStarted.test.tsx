import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import RequireNotStarted from "@/layouts/RequireNotStarted";
import { renderWithRouter } from "@/test/router";
import { seedStorage, TEST_PLAYERS } from "@/test/storage";

const PREP_ROUTES = ["/participants", "/teams", "/game-start"] as const;

function seedStartedGame() {
  seedStorage({
    players: TEST_PLAYERS.slice(0, 2),
    selectedPlayerIds: ["p1", "p2"],
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

  const { router } = renderWithRouter(
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
      seedStorage({ players: TEST_PLAYERS.slice(0, 1) });
      const { router, childMounted } = renderGuard(path);

      expect(
        screen.getByRole("heading", { name: "Подготовка" }),
      ).toBeInTheDocument();
      expect(childMounted()).toBe(true);
      expect(router.state.location.pathname).toBe(path);
    },
  );
});
