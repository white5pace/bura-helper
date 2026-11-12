import { useCallback, useEffect, useRef, useState } from "react";
import { FieldError } from "@/components/ui/field";

const REDIRECT_SECONDS = 10;

function RedirectNotice({
  reason,
  onLeave,
}: {
  reason: string;
  onLeave: () => void;
}) {
  const [secondsLeft, setSecondsLeft] = useState(REDIRECT_SECONDS);
  const hasLeftRef = useRef(false);

  const leave = useCallback(() => {
    if (hasLeftRef.current) {
      return;
    }
    hasLeftRef.current = true;
    onLeave();
  }, [onLeave]);

  useEffect(() => {
    const timerId = window.setInterval(() => {
      setSecondsLeft((current) => (current > 0 ? current - 1 : current));
    }, 1000);

    return () => {
      window.clearInterval(timerId);
    };
  }, []);

  useEffect(() => {
    if (secondsLeft > 0) {
      return;
    }
    leave();
  }, [secondsLeft, leave]);

  return (
    <FieldError className="text-left">
      {reason} Вы можете сами{" "}
      <a
        href="/"
        className="text-inherit underline"
        onClick={(event) => {
          event.preventDefault();
          leave();
        }}
      >
        перейти по ссылке и начать новую игру
      </a>{" "}
      или вы будете автоматически перенаправлены через: {secondsLeft}.
    </FieldError>
  );
}

export default RedirectNotice;
