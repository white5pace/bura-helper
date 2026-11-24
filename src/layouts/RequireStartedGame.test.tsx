import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import RequireStartedGame from "@/layouts/RequireStartedGame";
import { renderWithRouter } from "@/test/router";
import { readCurrentGame, seedStorage, TEST_PLAYERS } from "@/test/storage";

const STARTED_ROUTES = [
  ["/game", "Игра"],
  ["/round-end", "Завершение раунда"],
  ["/game-end", "Завершение игры"],
] as const;

const NOT_STARTED_SELECTION = ["p1", "p2"] as const;

function seedNotStartedGame() {
  seedStorage({
    players: TEST_PLAYERS.slice(0, 2),
    selectedPlayerIds: [...NOT_STARTED_SELECTION],
    gameStarted: false,
  });
}

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

  function StartedPage({ title }: { title: string }) {
    childMounted = true;
    return <h1>{title}</h1>;
  }

  const { router } = renderWithRouter(
    [
      {
        element: <RequireStartedGame />,
        children: STARTED_ROUTES.map(([routePath, title]) => ({
          path: routePath,
          element: <StartedPage title={title} />,
        })),
      },
      { path: "/", element: <h1>Меню</h1> },
    ],
    { initialEntries: [path] },
  );

  return {
    router,
    childMounted: () => childMounted,
  };
}

describe("RequireStartedGame", () => {
  it.each(STARTED_ROUTES)(
    "redirects %s to / with replace and keeps selectedPlayerIds when the game has not started",
    async (path, title) => {
      seedNotStartedGame();
      const { router, childMounted } = renderGuard(path);

      expect(
        await screen.findByRole("heading", { name: "Меню" }),
      ).toBeInTheDocument();
      expect(
        screen.queryByRole("heading", { name: title }),
      ).not.toBeInTheDocument();
      expect(childMounted()).toBe(false);
      expect(router.state.location.pathname).toBe("/");
      expect(router.state.historyAction).toBe("REPLACE");
      expect(readCurrentGame().selectedPlayerIds).toEqual([
        ...NOT_STARTED_SELECTION,
      ]);
    },
  );

  it.each(STARTED_ROUTES)(
    "renders the child page at %s when the game has started",
    (path, title) => {
      seedStartedGame();
      const { router, childMounted } = renderGuard(path);

      expect(screen.getByRole("heading", { name: title })).toBeInTheDocument();
      expect(
        screen.queryByRole("heading", { name: "Меню" }),
      ).not.toBeInTheDocument();
      expect(childMounted()).toBe(true);
      expect(router.state.location.pathname).toBe(path);
    },
  );
});
