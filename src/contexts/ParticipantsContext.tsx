import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  defaultCurrentGame,
  loadCurrentGame,
  sanitizeCurrentGame,
  saveCurrentGame,
  type CurrentTeamIds,
} from "@/lib/currentGameStorage";
import {
  EMPTY_CURRENT_TEAM_IDS,
  ensureTeamsForSelection,
  removePlayerFromCatalogs,
  sameCurrentTeamIds,
} from "@/lib/ensureTeamsForSelection";
import { loadPlayers, savePlayers, type Player } from "@/lib/playerStorage";
import { type Team } from "@/lib/teamPair";
import { TEAM_MODE_PLAYER_COUNT } from "@/lib/gameRules";
import { loadTeams, saveTeams } from "@/lib/teamStorage";

export type { CurrentTeamIds, Player, Team };

function loadSession(players: Player[], teams: Team[]) {
  return sanitizeCurrentGame(loadCurrentGame(), {
    playerIds: new Set(players.map((player) => player.id)),
    teamIds: new Set(teams.map((team) => team.id)),
  });
}

interface ParticipantsContextValue {
  players: Player[];
  selectedPlayerIds: string[];
  teamMode: boolean;
  teams: Team[];
  currentTeamIds: CurrentTeamIds;
  resetGame: () => void;
  setTeamMode: (enabled: boolean) => void;
  setTeamName: (teamId: string, name: string) => void;
  setPlayerSelected: (id: string, selected: boolean) => void;
  getPlayerById: (id: string) => Player | undefined;
  getTeamById: (id: string) => Team | undefined;
  addPlayer: (name: string) => Player;
  updatePlayer: (id: string, name: string) => void;
  deletePlayer: (playerId: string) => void;
  commitTeamSelection: () => boolean;
}

const ParticipantsContext = createContext<ParticipantsContextValue | null>(
  null,
);

function useSyncedPlayers() {
  const [players, setPlayers] = useState(loadPlayers);

  useEffect(() => {
    savePlayers(players);
  }, [players]);

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

  return { players, setPlayers, addPlayer, updatePlayer };
}

function useSyncedTeams() {
  const [teams, setTeams] = useState(loadTeams);

  useEffect(() => {
    saveTeams(teams);
  }, [teams]);

  const setTeamName = useCallback((teamId: string, name: string) => {
    setTeams((prev) => {
      const exists = prev.some((team) => team.id === teamId);
      if (!exists) {
        return prev;
      }
      return prev.map((team) =>
        team.id === teamId ? { ...team, name } : team,
      );
    });
  }, []);

  const getTeamById = useCallback(
    (id: string) => teams.find((team) => team.id === id),
    [teams],
  );

  return { teams, setTeams, setTeamName, getTeamById };
}

function useSyncedSession(players: Player[], teams: Team[]) {
  const [initial] = useState(() => loadSession(players, teams));
  const [selectedPlayerIds, setSelectedPlayerIds] = useState(
    initial.selectedPlayerIds,
  );
  const [teamMode, setTeamMode] = useState(initial.teamMode);
  const [currentTeamIds, setCurrentTeamIds] = useState(
    initial.currentTeamIds,
  );

  useEffect(() => {
    saveCurrentGame({
      selectedPlayerIds,
      teamMode,
      currentTeamIds,
    });
  }, [selectedPlayerIds, teamMode, currentTeamIds]);

  const setPlayerSelected = useCallback((id: string, selected: boolean) => {
    setSelectedPlayerIds((prev) => {
      if (selected) {
        if (prev.includes(id) || prev.length >= TEAM_MODE_PLAYER_COUNT) {
          return prev;
        }
        return [...prev, id];
      }
      return prev.filter((playerId) => playerId !== id);
    });
  }, []);

  const resetGame = useCallback(() => {
    const empty = defaultCurrentGame();
    setSelectedPlayerIds(empty.selectedPlayerIds);
    setTeamMode(empty.teamMode);
    setCurrentTeamIds(empty.currentTeamIds);
  }, []);

  return {
    selectedPlayerIds,
    setSelectedPlayerIds,
    teamMode,
    setTeamMode,
    currentTeamIds,
    setCurrentTeamIds,
    setPlayerSelected,
    resetGame,
  };
}

export function ParticipantsProvider({ children }: { children: ReactNode }) {
  const { players, setPlayers, addPlayer, updatePlayer } = useSyncedPlayers();
  const { teams, setTeams, setTeamName, getTeamById } = useSyncedTeams();
  const {
    selectedPlayerIds,
    setSelectedPlayerIds,
    teamMode,
    setTeamMode,
    currentTeamIds,
    setCurrentTeamIds,
    setPlayerSelected,
    resetGame,
  } = useSyncedSession(players, teams);

  const getPlayerById = useCallback(
    (id: string) => players.find((player) => player.id === id),
    [players],
  );

  const commitTeamSelection = useCallback((): boolean => {
    if (!teamMode || selectedPlayerIds.length !== TEAM_MODE_PLAYER_COUNT) {
      return false;
    }

    const next = ensureTeamsForSelection(
      teams,
      selectedPlayerIds,
      players,
      teamMode,
    );

    if (next.teams !== teams) {
      setTeams(next.teams);
    }
    if (!sameCurrentTeamIds(currentTeamIds, next.currentTeamIds)) {
      setCurrentTeamIds(
        next.currentTeamIds.black === null && next.currentTeamIds.red === null
          ? EMPTY_CURRENT_TEAM_IDS
          : next.currentTeamIds,
      );
    }

    return true;
  }, [
    teamMode,
    selectedPlayerIds,
    players,
    teams,
    currentTeamIds,
    setTeams,
    setCurrentTeamIds,
  ]);

  const deletePlayer = useCallback(
    (playerId: string) => {
      setPlayers((prev) => prev.filter((player) => player.id !== playerId));
      setSelectedPlayerIds((prev) =>
        prev.filter((selectedId) => selectedId !== playerId),
      );

      const next = removePlayerFromCatalogs(teams, currentTeamIds, playerId);
      if (next.teams !== teams) {
        setTeams(next.teams);
      }
      if (!sameCurrentTeamIds(currentTeamIds, next.currentTeamIds)) {
        setCurrentTeamIds(next.currentTeamIds);
      }
    },
    [
      teams,
      currentTeamIds,
      setPlayers,
      setSelectedPlayerIds,
      setTeams,
      setCurrentTeamIds,
    ],
  );

  const value = useMemo(
    () => ({
      players,
      selectedPlayerIds,
      teamMode,
      teams,
      currentTeamIds,
      resetGame,
      setTeamMode,
      setTeamName,
      setPlayerSelected,
      getPlayerById,
      getTeamById,
      addPlayer,
      updatePlayer,
      deletePlayer,
      commitTeamSelection,
    }),
    [
      players,
      selectedPlayerIds,
      teamMode,
      teams,
      currentTeamIds,
      resetGame,
      setTeamMode,
      setTeamName,
      setPlayerSelected,
      getPlayerById,
      getTeamById,
      addPlayer,
      updatePlayer,
      deletePlayer,
      commitTeamSelection,
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
