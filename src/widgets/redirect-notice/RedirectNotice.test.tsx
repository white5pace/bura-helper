import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import RedirectNotice from "@/widgets/redirect-notice/RedirectNotice";

const REASON = "Не удалось определить, кто раздаёт.";
const LINK_NAME = "перейти по ссылке и начать новую игру";

function renderNotice(onLeave = vi.fn()) {
  const view = render(<RedirectNotice reason={REASON} onLeave={onLeave} />);
  return { ...view, onLeave };
}

async function advanceSeconds(seconds: number) {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(seconds * 1000);
  });
}

describe("RedirectNotice", () => {
  beforeEach(() => {
    // Полный fake timers вешает userEvent.click на setTimeout(0).
    vi.useFakeTimers({ toFake: ["setInterval", "clearInterval"] });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("сразу показывает причину, число 10 и ссылку", () => {
    renderNotice();

    const notice = screen.getByRole("alert");
    expect(notice).toHaveTextContent(REASON);
    expect(notice).toHaveTextContent(/через: 10\./);
    expect(
      screen.getByRole("link", { name: LINK_NAME }),
    ).toBeInTheDocument();
  });

  it("уменьшает отсчёт и вызывает onLeave один раз через 10 секунд", async () => {
    const { onLeave } = renderNotice();

    await advanceSeconds(1);

    expect(screen.getByRole("alert")).toHaveTextContent(/через: 9\./);
    expect(onLeave).not.toHaveBeenCalled();

    await advanceSeconds(9);

    expect(screen.getByRole("alert")).toHaveTextContent(/через: 0\./);
    expect(onLeave).toHaveBeenCalledTimes(1);
  });

  it("вызывает onLeave по ссылке и не даёт таймеру вызвать его повторно", async () => {
    const { onLeave } = renderNotice();
    const user = userEvent.setup();

    await user.click(screen.getByRole("link", { name: LINK_NAME }));

    expect(onLeave).toHaveBeenCalledTimes(1);

    await advanceSeconds(10);

    expect(onLeave).toHaveBeenCalledTimes(1);
  });

  it("не вызывает onLeave при размонтировании", async () => {
    const { onLeave, unmount } = renderNotice();

    unmount();

    expect(onLeave).not.toHaveBeenCalled();

    await advanceSeconds(10);

    expect(onLeave).not.toHaveBeenCalled();
  });
});
