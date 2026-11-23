import { render } from "@testing-library/react";
import { type ReactNode } from "react";
import {
  createMemoryRouter,
  RouterProvider,
  type RouteObject,
} from "react-router-dom";
import { ParticipantsProvider } from "@/contexts/ParticipantsContext";

type RenderWithRouterOptions = {
  initialEntries?: string[];
  withParticipants?: boolean;
};

export function renderWithRouter(
  routes: RouteObject[],
  {
    initialEntries = ["/"],
    withParticipants = true,
  }: RenderWithRouterOptions = {},
) {
  const router = createMemoryRouter(routes, { initialEntries });
  let ui: ReactNode = <RouterProvider router={router} />;

  if (withParticipants) {
    ui = <ParticipantsProvider>{ui}</ParticipantsProvider>;
  }

  render(ui);

  return { router };
}
