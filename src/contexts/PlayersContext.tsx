import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export interface Player {
  id: string;
  name: string;
}

const STORAGE_KEY = "players";

function loadPlayers(): Player[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored) as Player[];
    }
  } catch {
    // ignore invalid localStorage data
  }
  return [];
}

interface PlayersContextValue {
  players: Player[];
  getPlayerById: (id: string) => Player | undefined;
  addPlayer: (name: string) => Player;
  updatePlayer: (id: string, name: string) => void;
}

const PlayersContext = createContext<PlayersContextValue | null>(null);

export function PlayersProvider({ children }: { children: ReactNode }) {
  const [players, setPlayers] = useState<Player[]>(loadPlayers);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(players));
  }, [players]);

  const getPlayerById = useCallback(
    (id: string) => players.find((player) => player.id === id),
    [players],
  );

  const addPlayer = useCallback((name: string) => {
    const newPlayer: Player = {
      id: self.crypto.randomUUID(),
      name,
    };
    setPlayers((prev) => [...prev, newPlayer]);
    return newPlayer;
  }, []);

  const updatePlayer = useCallback((id: string, name: string) => {
    setPlayers((prev) =>
      prev.map((player) => {
        if (player.id !== id) {
          return player;
        }
        return { ...player, name };
      }),
    );
  }, []);

  const value = useMemo(
    () => ({ players, getPlayerById, addPlayer, updatePlayer }),
    [players, getPlayerById, addPlayer, updatePlayer],
  );

  return (
    <PlayersContext.Provider value={value}>{children}</PlayersContext.Provider>
  );
}

export function usePlayers() {
  const context = useContext(PlayersContext);
  if (!context) {
    throw new Error("usePlayers must be used within PlayersProvider");
  }
  return context;
}
