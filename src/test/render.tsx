import { render, type RenderOptions } from "@testing-library/react";
import { type ReactElement, type ReactNode } from "react";
import { MemoryRouter } from "react-router-dom";
import { ParticipantsProvider } from "@/contexts/ParticipantsContext";

interface WrapperProps {
  children: ReactNode;
  initialEntries?: string[];
}

function AllProviders({
  children,
  initialEntries = ["/"],
}: WrapperProps) {
  return (
    <MemoryRouter initialEntries={initialEntries}>
      <ParticipantsProvider>{children}</ParticipantsProvider>
    </MemoryRouter>
  );
}

export function renderWithProviders(
  ui: ReactElement,
  options?: Omit<RenderOptions, "wrapper"> & { initialEntries?: string[] },
) {
  const { initialEntries, ...renderOptions } = options ?? {};

  return render(ui, {
    wrapper: ({ children }) => (
      <AllProviders initialEntries={initialEntries}>{children}</AllProviders>
    ),
    ...renderOptions,
  });
}
