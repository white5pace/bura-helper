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

const PLAYERS_STORAGE_KEY = "players";

function loadPlayers(): Player[] {
  try {
    const stored = localStorage.getItem(PLAYERS_STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored) as Player[];
    }
  } catch {
    // ignore invalid localStorage data
  }
  return [];
}

interface ParticipantsContextValue {
  players: Player[];
  getPlayerById: (id: string) => Player | undefined;
  addPlayer: (name: string) => Player;
  updatePlayer: (id: string, name: string) => void;
  deletePlayer: (id: string) => void;
}

const ParticipantsContext = createContext<ParticipantsContextValue | null>(
  null,
);

export function ParticipantsProvider({ children }: { children: ReactNode }) {
  const [players, setPlayers] = useState<Player[]>(loadPlayers);

  useEffect(() => {
    localStorage.setItem(PLAYERS_STORAGE_KEY, JSON.stringify(players));
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

  const deletePlayer = useCallback((id: string) => {
    setPlayers((prev) => prev.filter((player) => player.id !== id));
  }, []);

  const value = useMemo(
    () => ({
      players,
      getPlayerById,
      addPlayer,
      updatePlayer,
      deletePlayer,
    }),
    [players, getPlayerById, addPlayer, updatePlayer, deletePlayer],
  );

  return (
    <ParticipantsContext.Provider value={value}>
      {children}
    </ParticipantsContext.Provider>
  );
}

export function useParticipants() {
  const context = useContext(ParticipantsContext);
  if (!context) {
    throw new Error(
      "useParticipants must be used within ParticipantsProvider",
    );
  }
  return context;
}
