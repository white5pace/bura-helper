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

export interface Team {
  id: string;
  name: string;
  playerIds: string[];
}

const PLAYERS_STORAGE_KEY = "players";
const TEAMS_STORAGE_KEY = "teams";

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

function loadTeams(): Team[] {
  try {
    const stored = localStorage.getItem(TEAMS_STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored) as Team[];
    }
  } catch {
    // ignore invalid localStorage data
  }
  return [];
}

interface ParticipantsContextValue {
  players: Player[];
  teams: Team[];
  getPlayerById: (id: string) => Player | undefined;
  getTeamById: (id: string) => Team | undefined;
  addPlayer: (name: string) => Player;
  updatePlayer: (id: string, name: string) => void;
  addTeam: (name: string, playerIds: string[]) => Team;
  updateTeam: (id: string, name: string, playerIds: string[]) => void;
  getTeamsByPlayerId: (id: string) => Team[];
  deletePlayer: (id: string) => void;
  deleteTeam: (id: string) => void;
}

const ParticipantsContext = createContext<ParticipantsContextValue | null>(
  null,
);

export function ParticipantsProvider({ children }: { children: ReactNode }) {
  const [players, setPlayers] = useState<Player[]>(loadPlayers);
  const [teams, setTeams] = useState<Team[]>(loadTeams);

  useEffect(() => {
    localStorage.setItem(PLAYERS_STORAGE_KEY, JSON.stringify(players));
  }, [players]);

  useEffect(() => {
    localStorage.setItem(TEAMS_STORAGE_KEY, JSON.stringify(teams));
  }, [teams]);

  const getPlayerById = useCallback(
    (id: string) => players.find((player) => player.id === id),
    [players],
  );

  const getTeamById = useCallback(
    (id: string) => teams.find((team) => team.id === id),
    [teams],
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

  const addTeam = useCallback((name: string, playerIds: string[]) => {
    const newTeam: Team = {
      id: self.crypto.randomUUID(),
      name,
      playerIds,
    };
    setTeams((prev) => [...prev, newTeam]);
    return newTeam;
  }, []);

  const updateTeam = useCallback(
    (id: string, name: string, playerIds: string[]) => {
      setTeams((prev) =>
        prev.map((team) => {
          if (team.id !== id) {
            return team;
          }
          return { ...team, name, playerIds };
        }),
      );
    },
    [],
  );

  const getTeamsByPlayerId = useCallback(
    (id: string) => teams.filter((team) => team.playerIds.includes(id)),
    [teams],
  );

  const deleteTeam = useCallback((id: string) => {
    setTeams((prev) => prev.filter((team) => team.id !== id));
  }, []);

  const deletePlayer = useCallback((id: string) => {
    setTeams((prev) => prev.filter((team) => !team.playerIds.includes(id)));
    setPlayers((prev) => prev.filter((player) => player.id !== id));
  }, []);

  const value = useMemo(
    () => ({
      players,
      teams,
      getPlayerById,
      getTeamById,
      addPlayer,
      updatePlayer,
      addTeam,
      updateTeam,
      getTeamsByPlayerId,
      deletePlayer,
      deleteTeam,
    }),
    [
      players,
      teams,
      getPlayerById,
      getTeamById,
      addPlayer,
      updatePlayer,
      addTeam,
      updateTeam,
      getTeamsByPlayerId,
      deletePlayer,
      deleteTeam,
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
