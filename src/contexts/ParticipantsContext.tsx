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

const SELECTION_LIMIT = 4;

const PLAYERS_STORAGE_KEY = "players";
const SELECTED_PLAYER_IDS_STORAGE_KEY = "selectedPlayerIds";
const TEAM_MODE_STORAGE_KEY = "teamMode";

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

function loadSelectedPlayerIds(players: Player[]): string[] {
  const validIds = new Set(players.map((player) => player.id));

  try {
    const stored = localStorage.getItem(SELECTED_PLAYER_IDS_STORAGE_KEY);
    if (stored) {
      const parsed: unknown = JSON.parse(stored);
      if (Array.isArray(parsed)) {
        return parsed
          .filter((id): id is string => typeof id === "string" && validIds.has(id))
          .slice(0, SELECTION_LIMIT);
      }
    }
  } catch {
    // ignore invalid localStorage data
  }
  return [];
}

function loadTeamMode(): boolean {
  try {
    const stored = localStorage.getItem(TEAM_MODE_STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored) === true;
    }
  } catch {
    // ignore invalid localStorage data
  }
  return false;
}

interface ParticipantsContextValue {
  players: Player[];
  selectedPlayerIds: string[];
  teamMode: boolean;
  setTeamMode: (enabled: boolean) => void;
  setPlayerSelected: (id: string, selected: boolean) => void;
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
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<string[]>(() =>
    loadSelectedPlayerIds(loadPlayers()),
  );
  const [teamMode, setTeamMode] = useState(loadTeamMode);

  useEffect(() => {
    localStorage.setItem(PLAYERS_STORAGE_KEY, JSON.stringify(players));
  }, [players]);

  useEffect(() => {
    localStorage.setItem(
      SELECTED_PLAYER_IDS_STORAGE_KEY,
      JSON.stringify(selectedPlayerIds),
    );
  }, [selectedPlayerIds]);

  useEffect(() => {
    localStorage.setItem(TEAM_MODE_STORAGE_KEY, JSON.stringify(teamMode));
  }, [teamMode]);

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
    setSelectedPlayerIds((prev) => prev.filter((playerId) => playerId !== id));
  }, []);

  const setPlayerSelected = useCallback((id: string, selected: boolean) => {
    setSelectedPlayerIds((prev) => {
      if (selected) {
        if (prev.includes(id) || prev.length >= SELECTION_LIMIT) {
          return prev;
        }
        return [...prev, id];
      }
      return prev.filter((playerId) => playerId !== id);
    });
  }, []);

  const value = useMemo(
    () => ({
      players,
      selectedPlayerIds,
      teamMode,
      setTeamMode,
      setPlayerSelected,
      getPlayerById,
      addPlayer,
      updatePlayer,
      deletePlayer,
    }),
    [
      players,
      selectedPlayerIds,
      teamMode,
      setPlayerSelected,
      getPlayerById,
      addPlayer,
      updatePlayer,
      deletePlayer,
    ],
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
