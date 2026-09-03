import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { ParticipantsProvider } from "@/contexts/ParticipantsContext";
import Player from "@/pages/Player";

function renderPlayer(path = "/participants/player") {
  return render(
    <ParticipantsProvider>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/participants/player/:id?" element={<Player />} />
        </Routes>
      </MemoryRouter>
    </ParticipantsProvider>,
  );
}

describe("Player page", () => {
  it("focuses the name input when opening the create page", () => {
    renderPlayer();

    expect(screen.getByLabelText("Имя игрока")).toHaveFocus();
  });
});
