import { Component, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import {
  CurrentGameValidationError,
  defaultCurrentGame,
  saveCurrentGame,
} from "@/lib/currentGameStorage";
import AppHeader from "@/shared/ui/AppHeader";

interface SessionErrorBoundaryProps {
  children: ReactNode;
  onReset?: () => void | Promise<void>;
}

interface SessionErrorBoundaryState {
  error: Error | null;
}

class SessionErrorBoundary extends Component<
  SessionErrorBoundaryProps,
  SessionErrorBoundaryState
> {
  state: SessionErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): SessionErrorBoundaryState {
    return { error };
  }

  private handleStartNewGame = () => {
    saveCurrentGame(defaultCurrentGame());
    void this.finishReset();
  };

  private finishReset = async () => {
    try {
      await this.props.onReset?.();
    } finally {
      this.setState({ error: null });
    }
  };

  render() {
    if (this.state.error) {
      if (!(this.state.error instanceof CurrentGameValidationError)) {
        throw this.state.error;
      }

      return (
        <div className="box-border flex min-h-0 flex-1 flex-col p-[16px]">
          <AppHeader />
          <div className="flex min-h-0 flex-1 flex-col items-stretch gap-[16px] text-left">
            <p>
              Не удалось загрузить текущую игру: данные сессии повреждены или
              участники были изменены.
            </p>
            <Button
              type="button"
              variant="outline"
              size="lg"
              className="w-full"
              onClick={this.handleStartNewGame}
            >
              Начать новую игру
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default SessionErrorBoundary;
